"use client";

/**
 * components/play/play-scene-draw-surface.tsx — MouseDrawSurface for the
 * Trail level. Tracks pointer events, raycasts onto an in-camera plane,
 * computes angular velocity around the canvas centre (live + gesture-mean),
 * and emits world-space points + commit boundaries to the parent. Renders
 * the live trail using the chosen Brush via `<TrailLine />`.
 */

import { useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";

import { TrailLine } from "./trail-line";

import type { Brush } from "./play-scene-brush";

export const MAX_TRAIL_VERTICES = 2000;
export const TRAIL_PLANE_DISTANCE = 1;
export const ANGULAR_WINDOW_MS = 250;

export type PointerSample = {
  /** Angular position around the canvas centre, radians. */
  theta: number;
  /** ISO timestamp (ms). */
  t: number;
};

export type AngularState = {
  /** Live angular velocity, radians per second. */
  live: number;
  /** Mean angular velocity over the current gesture. */
  mean: number;
};

export function MouseDrawSurface({
  active,
  liveTrail,
  brush,
  onPoint,
  onCommit,
  onAngular,
  onGestureStart,
}: {
  active: boolean;
  liveTrail: THREE.Vector3[];
  brush: Brush;
  onPoint: (p: THREE.Vector3) => void;
  onCommit: (mean: number) => void;
  onAngular: (state: AngularState) => void;
  onGestureStart: () => void;
}) {
  const { camera, gl } = useThree();
  const drawing = useRef(false);
  const sampleCounter = useRef(0);
  const raycaster = useRef(new THREE.Raycaster());
  const plane = useRef(
    new THREE.Plane(new THREE.Vector3(0, 0, 1), TRAIL_PLANE_DISTANCE),
  );

  const lastSample = useRef<PointerSample | null>(null);
  const windowSamples = useRef<PointerSample[]>([]);
  const gestureUnwrapped = useRef(0);
  const gestureStartT = useRef(0);

  const angleAt = useCallback(
    (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      return Math.atan2(clientY - cy, clientX - cx);
    },
    [gl],
  );

  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.current.setFromCamera(ndc, camera);
      const planeNormal = new THREE.Vector3(0, 0, -1)
        .applyQuaternion(camera.quaternion)
        .normalize();
      const planePoint = camera.position
        .clone()
        .add(planeNormal.clone().multiplyScalar(TRAIL_PLANE_DISTANCE));
      plane.current.setFromNormalAndCoplanarPoint(planeNormal, planePoint);
      const hit = new THREE.Vector3();
      raycaster.current.ray.intersectPlane(plane.current, hit);
      return hit;
    },
    [camera, gl],
  );

  useEffect(() => {
    const el = gl.domElement;
    if (!active) return;

    const recordAngular = (clientX: number, clientY: number, t: number) => {
      const theta = angleAt(clientX, clientY);
      const prev = lastSample.current;
      if (prev) {
        let d = theta - prev.theta;
        if (d > Math.PI) d -= 2 * Math.PI;
        if (d < -Math.PI) d += 2 * Math.PI;
        gestureUnwrapped.current += Math.abs(d);
      }
      lastSample.current = { theta, t };
      windowSamples.current.push({ theta, t });
      const cutoff = t - ANGULAR_WINDOW_MS;
      while (
        windowSamples.current.length > 1 &&
        windowSamples.current[0]!.t < cutoff
      ) {
        windowSamples.current.shift();
      }
      let live = 0;
      if (windowSamples.current.length >= 2) {
        let unwrapped = 0;
        for (let i = 1; i < windowSamples.current.length; i++) {
          const a = windowSamples.current[i - 1]!.theta;
          const b = windowSamples.current[i]!.theta;
          let d = b - a;
          if (d > Math.PI) d -= 2 * Math.PI;
          if (d < -Math.PI) d += 2 * Math.PI;
          unwrapped += Math.abs(d);
        }
        const dt =
          (windowSamples.current[windowSamples.current.length - 1]!.t -
            windowSamples.current[0]!.t) /
          1000;
        live = dt > 0 ? unwrapped / dt : 0;
      }
      const elapsed = Math.max(0.001, (t - gestureStartT.current) / 1000);
      const mean = gestureUnwrapped.current / elapsed;
      onAngular({ live, mean });
    };

    const accept = (clientX: number, clientY: number) => {
      sampleCounter.current += 1;
      const keep = Math.max(0.01, brush.pointKeepRate);
      if (keep < 1) {
        const stride = Math.round(1 / keep);
        if (sampleCounter.current % stride !== 0) return;
      }
      onPoint(screenToWorld(clientX, clientY));
    };

    const handleDown = (e: PointerEvent) => {
      drawing.current = true;
      sampleCounter.current = 0;
      lastSample.current = null;
      windowSamples.current = [];
      gestureUnwrapped.current = 0;
      gestureStartT.current = e.timeStamp;
      onGestureStart();
      el.setPointerCapture(e.pointerId);
      recordAngular(e.clientX, e.clientY, e.timeStamp);
      accept(e.clientX, e.clientY);
    };
    const handleMove = (e: PointerEvent) => {
      if (!drawing.current) return;
      recordAngular(e.clientX, e.clientY, e.timeStamp);
      accept(e.clientX, e.clientY);
    };
    const handleUp = (e: PointerEvent) => {
      if (!drawing.current) return;
      drawing.current = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // pointer already released.
      }
      const elapsed = Math.max(
        0.001,
        (e.timeStamp - gestureStartT.current) / 1000,
      );
      const mean = gestureUnwrapped.current / elapsed;
      onCommit(mean);
    };

    el.addEventListener("pointerdown", handleDown);
    el.addEventListener("pointermove", handleMove);
    el.addEventListener("pointerup", handleUp);
    el.addEventListener("pointercancel", handleUp);

    return () => {
      el.removeEventListener("pointerdown", handleDown);
      el.removeEventListener("pointermove", handleMove);
      el.removeEventListener("pointerup", handleUp);
      el.removeEventListener("pointercancel", handleUp);
    };
  }, [
    active,
    gl,
    onCommit,
    onPoint,
    onAngular,
    onGestureStart,
    screenToWorld,
    angleAt,
    brush.pointKeepRate,
  ]);

  return liveTrail.length > 1 ? (
    <TrailLine
      points={liveTrail}
      maxVertices={MAX_TRAIL_VERTICES}
      color={brush.color}
      opacity={brush.opacity}
    />
  ) : null;
}

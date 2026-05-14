"use client";

/**
 * components/play/scenes/module-scene-draw-surface.tsx — Pointer-driven
 * draw surface for the Module level. Raycasts onto an in-camera plane.
 * Respects the brush's `pointKeepRate` so the "dotted" module thins its
 * sample rate to give discrete marks; other modules keep every sample.
 */

import { useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";

import type { Brush } from "./module-scene-brushes";

const TRAIL_PLANE_DISTANCE = 1;

export function MouseDrawSurface({
  active,
  onPoint,
  brush,
}: {
  active: boolean;
  onPoint: (p: THREE.Vector3) => void;
  brush: Brush;
}) {
  const { camera, gl } = useThree();
  const drawing = useRef(false);
  const sampleCounter = useRef(0);
  const raycaster = useRef(new THREE.Raycaster());
  const plane = useRef(
    new THREE.Plane(new THREE.Vector3(0, 0, 1), TRAIL_PLANE_DISTANCE),
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
      el.setPointerCapture(e.pointerId);
      accept(e.clientX, e.clientY);
    };
    const handleMove = (e: PointerEvent) => {
      if (!drawing.current) return;
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
  }, [active, gl, onPoint, screenToWorld, brush.pointKeepRate]);

  return null;
}

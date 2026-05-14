"use client";

/**
 * components/play/scenes/loop-scene-draw-surface.tsx — Pointer-driven
 * draw surface for the Loop level. Raycasts onto an in-camera plane and
 * reports world-space points + commit boundaries. State + storage live
 * in the parent scene.
 */

import { useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";

const TRAIL_PLANE_DISTANCE = 1;

export function MouseDrawSurface({
  active,
  onPoint,
  onCommit,
}: {
  active: boolean;
  onPoint: (p: THREE.Vector3) => void;
  onCommit: () => void;
}) {
  const { camera, gl } = useThree();
  const drawing = useRef(false);
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

    const handleDown = (e: PointerEvent) => {
      drawing.current = true;
      el.setPointerCapture(e.pointerId);
      onPoint(screenToWorld(e.clientX, e.clientY));
    };
    const handleMove = (e: PointerEvent) => {
      if (!drawing.current) return;
      onPoint(screenToWorld(e.clientX, e.clientY));
    };
    const handleUp = (e: PointerEvent) => {
      if (!drawing.current) return;
      drawing.current = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // pointer already released.
      }
      onCommit();
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
  }, [active, gl, onCommit, onPoint, screenToWorld]);

  return null;
}

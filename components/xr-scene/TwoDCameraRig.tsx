"use client";

/**
 * components/xr-scene/TwoDCameraRig.tsx — 2D-mode camera + input rig.
 *
 * Active when SceneStage is rendering to a monitor (no XR session).
 * Two driving modes, picked at runtime:
 *
 *   - Tracking-driven: lerps the camera position toward a target
 *     derived from the viewer's head pose (lib/tracking). Same
 *     idea as MeshSceneProvider's camera lerp — the page reads
 *     like a window onto the scene rather than a flat image.
 *
 *   - OrbitControls fallback: when no tracking source has resolved,
 *     drei's `OrbitControls` give the user mouse-driven inspection.
 *     Bounded to keep the camera within reasonable distance of the
 *     scene origin.
 *
 * The rig is the only component allowed to touch the R3F camera in
 * 2D mode. SceneStage children should declare meshes only.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { useViewerPose } from "hooks/useViewerPose";
import { useSceneStage } from "hooks/useSceneStageContext";

const CAMERA_LERP = 0.08;
const TARGET_LERP = 0.12;

export type TwoDCameraRigProps = {
  /** Base camera position before tracking offset. */
  position?: [number, number, number];
  /** Look-at target. */
  target?: [number, number, number];
  /** Vertical FOV in degrees. Default 35. */
  fov?: number;
  /** Tracking parallax strength, 0 = static, 1 = full pose mapping.
   *  Default 0.4 — readable on a monitor without nausea. */
  trackingStrength?: number;
  /** Show OrbitControls when no tracker resolved. Default true. */
  orbit?: boolean;
};

export function TwoDCameraRig({
  position = [0, 1, 3.5],
  target = [0, 1, 0],
  fov = 35,
  trackingStrength = 0.4,
  orbit = true,
}: TwoDCameraRigProps) {
  const { camera } = useThree();
  const { pose, source } = useViewerPose();
  const ctx = useSceneStage();

  const basePosition = useMemo(() => position, [position]);
  const lookTarget = useMemo(() => target, [target]);

  // FOV + initial pose on mount. The dep array intentionally re-runs
  // when the camera object itself swaps (rare — happens once if the
  // Canvas remounts) or when the consumer passes new defaults.
  useEffect(() => {
    if (!camera) return;
    camera.position.set(basePosition[0], basePosition[1], basePosition[2]);
    (camera as import("three").PerspectiveCamera).fov = fov;
    (camera as import("three").PerspectiveCamera).updateProjectionMatrix?.();
    camera.lookAt(lookTarget[0], lookTarget[1], lookTarget[2]);
  }, [camera, basePosition, lookTarget, fov]);

  // Pulse on recenter request.
  const lastRecenterRef = useRef(0);
  useEffect(() => {
    if (!ctx) return;
    if (ctx.recenterTick === lastRecenterRef.current) return;
    lastRecenterRef.current = ctx.recenterTick;
    camera.position.set(basePosition[0], basePosition[1], basePosition[2]);
    camera.lookAt(lookTarget[0], lookTarget[1], lookTarget[2]);
  }, [ctx, camera, basePosition, lookTarget]);

  // Per-frame: lerp toward (basePosition + tracking offset). Skip
  // entirely when the orbit controls are driving — the user's hand
  // wins over the pose stream when they're actively dragging.
  const orbitActive = orbit && !source;
  const targetRef = useRef<[number, number, number]>([
    basePosition[0],
    basePosition[1],
    basePosition[2],
  ]);

  useFrame(() => {
    if (orbitActive) return;
    const t = targetRef.current;
    if (pose) {
      // Map normalised pose into world offsets. The user's head moves
      // ±1 horizontally / vertically → camera shifts a fraction of
      // the scene width. The z mapping reduces depth as the viewer
      // leans in — the scene grows on their retina, same as a window.
      t[0] = basePosition[0] + pose.x * trackingStrength;
      t[1] = basePosition[1] + pose.y * trackingStrength * 0.6;
      t[2] = basePosition[2] - pose.z * trackingStrength * 0.8;
    } else {
      t[0] = basePosition[0];
      t[1] = basePosition[1];
      t[2] = basePosition[2];
    }
    camera.position.x += (t[0] - camera.position.x) * CAMERA_LERP;
    camera.position.y += (t[1] - camera.position.y) * CAMERA_LERP;
    camera.position.z += (t[2] - camera.position.z) * CAMERA_LERP;
    camera.lookAt(
      lookTarget[0],
      lookTarget[1] +
        (pose ? pose.y * trackingStrength * 0.2 : 0) * TARGET_LERP,
      lookTarget[2],
    );
  });

  // OrbitControls only when no pose source is available. Mounting
  // them while tracking is live would let the user drag against the
  // pose lerp, producing a tug-of-war between the cursor and the
  // head — the pose source wins by design.
  if (orbitActive) {
    return (
      <OrbitControls
        target={lookTarget}
        minDistance={0.4}
        maxDistance={12}
        maxPolarAngle={Math.PI * 0.6}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
      />
    );
  }
  return null;
}

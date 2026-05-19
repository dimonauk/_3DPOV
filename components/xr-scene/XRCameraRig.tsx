"use client";

/**
 * components/xr-scene/XRCameraRig.tsx — WebXR session camera rig.
 *
 * Wraps the scene origin in an <XROrigin> group that the WebXR
 * session can locomote. Inside an XR session, the runtime drives the
 * head camera directly via the headset pose — our job is to position
 * the RIG so the user starts somewhere sensible, and to wire the
 * standard controller-thumbstick locomotion.
 *
 * Controllers themselves come from the `createXRStore({ controller })`
 * default — see SceneStage. Mounting an explicit `<XRControllerModel>`
 * is only needed for scenes that style their own controllers; the
 * store's defaults render a usable model on every supported headset.
 *
 * The rig also reacts to the SceneStage's recenter pulse: when the
 * operator hits "Recenter" on the toolbar (typically before entering
 * the session) we snap the rig back to its configured origin so the
 * next entry starts clean.
 */

import { useEffect, useRef } from "react";
import {
  XROrigin,
  useXRControllerLocomotion,
} from "@react-three/xr";
import type { Group } from "three";

import { useSceneStage } from "hooks/useSceneStageContext";

export type XRCameraRigProps = {
  /** Starting position of the rig in the scene. */
  position?: [number, number, number];
  /** Optional yaw (radians) for the rig's initial facing. */
  rotationY?: number;
  /**
   * Enable thumbstick locomotion via the XR controllers. Default
   * true — turn off for seated scenes (cockpits, dioramas).
   */
  locomotion?: boolean;
  /** Movement speed in m/s for thumbstick translation. Default 1.2. */
  speed?: number;
};

export function XRCameraRig({
  position = [0, 0, 1.6],
  rotationY = 0,
  locomotion = true,
  speed = 1.2,
}: XRCameraRigProps) {
  const ctx = useSceneStage();
  const originRef = useRef<Group>(null);

  // Initial pose. Re-applies when the props change (rare) or when
  // the operator triggers a recenter from the toolbar. Inside an
  // active session this snap is invisible to the user — the
  // headset pose runs on top — but it sets the world-space anchor.
  useEffect(() => {
    const origin = originRef.current;
    if (!origin) return;
    origin.position.set(position[0], position[1], position[2]);
    origin.rotation.y = rotationY;
  }, [position, rotationY, ctx?.recenterTick]);

  // Smooth thumbstick locomotion. The hook from @react-three/xr
  // wires translation onto the left stick and snap-turn onto the
  // right by default, with vendor-appropriate dead-zones already
  // applied. Pass false to disable either axis.
  useXRControllerLocomotion(
    originRef,
    locomotion ? { speed } : false,
    locomotion ? undefined : false,
  );

  return <XROrigin ref={originRef} />;
}

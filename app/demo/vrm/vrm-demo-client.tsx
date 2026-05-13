"use client";

/**
 * app/demo/vrm/vrm-demo-client.tsx — Client component for the VRM demo route.
 *
 * One-line role: mount the R3F Canvas, wire VRMAvatar + named-pose application together.
 * Full purpose in vrm-demo-client.PURPOSE.md.
 */

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useState } from "react";

import { VRMAvatar } from "components/three/VRMAvatar";
import { setNamedPose } from "lib/capabilities/vrm/pose";
import { startIdle, stopIdle } from "lib/capabilities/motion/idle";
import { vrmStore } from "lib/state/vrm";

export default function VRMDemoClient({ url }: { url: string }) {
  const [handleId, setHandleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let appliedFor: string | null = null;
    const unsubscribe = vrmStore.subscribe((state) => {
      const firstId = Object.keys(state.handles)[0];
      if (firstId && firstId !== appliedFor) {
        appliedFor = firstId;
        setHandleId(firstId);
        setNamedPose(firstId, "auraDefault");
        startIdle(firstId);
      }
    });
    return () => {
      unsubscribe();
      if (appliedFor) stopIdle(appliedFor);
    };
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 1.4, 2.2], fov: 30 }}
      onError={(e) => setError(String(e))}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 4, 3]} intensity={1.2} />
      <directionalLight position={[-2, 2, -2]} intensity={0.4} color="#ff66cc" />
      <OrbitControls target={[0, 1.0, 0]} enablePan={false} />
      <VRMAvatar url={url} />
      {error && null}
    </Canvas>
  );
}

"use client";

/**
 * app/atelier/cube-composer/scene.tsx — Scene shell mounted inside the
 * R3F Canvas.
 *
 * Extracted from cube-composer-client.tsx. Holds the ambient + key
 * light, the world-axis tripod, the CubeShell + FrustumGizmo, and
 * the OrbitControls; the main client wraps this in <Canvas /> and
 * threads the active-frame + face-status state through.
 */

import { OrbitControls } from "@react-three/drei";
import type { Texture } from "three";

import { CubeShell } from "./cube-shell";
import { FrustumGizmo } from "./frustum-gizmo";
import type { CubeFace } from "./types";

export function Scene({
  frame,
  playing,
  onAdvance,
  faceStatus,
  equirect,
}: {
  frame: number;
  playing: boolean;
  onAdvance: () => void;
  faceStatus: Record<CubeFace, "active" | "done" | "pending">;
  equirect: Texture | null;
}) {
  return (
    <>
      <color attach="background" args={["#0a0a0d"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={0.6} />

      {/* Tiny world-axis tripod at the origin for orientation. */}
      <axesHelper args={[0.4]} />

      <CubeShell faceStatus={faceStatus} equirect={equirect} />
      <FrustumGizmo frame={frame} playing={playing} onAdvance={onAdvance} />

      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={0.5}
        maxDistance={6}
      />
    </>
  );
}

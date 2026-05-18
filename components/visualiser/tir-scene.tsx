"use client";

/**
 * components/visualiser/tir-scene.tsx — Ray-traced visualiser for total
 * internal reflection.
 *
 * Slim wrapper: mounts the Canvas, OrbitControls, and the Stage from
 * `./tir-scene-stage`. Pure geometry builders live in
 * `./tir-scene-geometry`; presentational HTML labels in
 * `./tir-scene-labels`.
 */

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { Stage } from "./tir-scene-stage";

type Props = {
  n1: number;
  n2: number;
  incidentDeg: number;
};

export default function TIRScene({ n1, n2, incidentDeg }: Props) {
  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-sm border border-warm-black-800"
      style={{ backgroundColor: "#0c0a12" }}
      role="img"
      aria-label={`Total Internal Reflection visualiser: upper half-space (medium 1, n=${n1.toFixed(2)}), lower half-space (medium 2, n=${n2.toFixed(2)}), incident ray at ${incidentDeg.toFixed(1)} degrees from the normal. Drag to rotate, scroll to zoom.`}
    >
      <Canvas
        camera={{ position: [0, 0.4, 4.2], fov: 50 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
      >
        <ambientLight intensity={0.7} />
        <Stage n1={n1} n2={n2} incidentDeg={incidentDeg} />
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={2.2}
          maxDistance={9}
          autoRotate={false}
        />
      </Canvas>
      <div
        className="pointer-events-none absolute bottom-3 left-3 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-chrome-500"
        aria-hidden
      >
        Drag to rotate &middot; scroll to zoom
      </div>
    </div>
  );
}

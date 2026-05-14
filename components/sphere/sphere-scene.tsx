"use client";

/**
 * components/sphere/sphere-scene.tsx — The 3D cross-reference sphere.
 *
 * Lays the site's graph out as a sphere via a small inline spring-force
 * simulation (`./sphere-scene-layout`), renders it as additive-blended
 * edges + sphere markers with hover highlighting + click-to-route
 * (`./sphere-scene-graph-mesh`), and falls back to a degree-ranked text
 * list when WebGL is unavailable (`./sphere-scene-fallback`).
 */

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";

import { WebglFallback } from "./sphere-scene-fallback";
import { GraphMesh } from "./sphere-scene-graph-mesh";
import { computeLayout, detectWebgl } from "./sphere-scene-layout";

export default function SphereScene() {
  const positionedNodes = useMemo(() => computeLayout(), []);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [webglOk, setWebglOk] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglOk(detectWebgl());
    return () => {
      document.body.style.cursor = "";
    };
  }, []);

  if (webglOk === false) return <WebglFallback />;

  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-sm border border-warm-black-800"
      style={{ backgroundColor: "#0c0a12" }}
    >
      <Canvas
        camera={{ position: [0, 0, 14], fov: 55 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
      >
        <ambientLight intensity={0.6} />
        <GraphMesh
          nodes={positionedNodes}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
        />
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={7}
          maxDistance={28}
        />
      </Canvas>
      <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-chrome-500">
        Drag to rotate &middot; scroll to zoom &middot; click a node to follow
      </div>
    </div>
  );
}

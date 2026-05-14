"use client";

/**
 * components/viewers/splat-viewer-spark.tsx — `<SplatViewerSpark>`.
 *
 * R3F-native 3D Gaussian Splat viewer. Loads a `.ply` via Spark
 * (sparkjsdev/spark — three.js gaussian-splat renderer, MIT) and adds
 * it to the scene as a `SplatMesh` Object3D. The page that renders
 * this MUST wrap it in `next/dynamic` with `ssr: false` because
 * SplatMesh allocates GPU resources at construction time.
 *
 * Implements the `viz.splat-render` capability's "spark-js" target
 * (see `lib/capabilities/viz/splat-render.ts`).
 */

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { SplatMesh } from "@sparkjsdev/spark";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";

import type { SplatViewerProps } from "lib/capabilities/viz/splat-render";

function SplatLoader({ url }: { url: string }) {
  const { scene } = useThree();
  const [mesh, setMesh] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    const splat = new SplatMesh({ url });
    splat.quaternion.set(1, 0, 0, 0);
    splat.position.set(0, 0, -3);
    scene.add(splat);
    setMesh(splat);
    return () => {
      scene.remove(splat);
      // Spark's SplatMesh owns GPU buffers; dispose hook below.
      const disposable = splat as THREE.Object3D & {
        dispose?: () => void;
      };
      if (typeof disposable.dispose === "function") disposable.dispose();
    };
  }, [scene, url]);

  // The mesh is added to the scene imperatively; no JSX needed.
  return mesh ? null : null;
}

export default function SplatViewerSpark({
  record,
  aspect = 16 / 9,
  autoRotate = true,
  background = "#0a0a0f",
  lazy = true,
}: SplatViewerProps) {
  // `lazy` is honoured by the caller via IntersectionObserver; this
  // component renders unconditionally when mounted.
  void lazy;

  return (
    <div
      style={{ aspectRatio: aspect, background }}
      className="w-full overflow-hidden rounded-sm border border-warm-black-800"
    >
      <Canvas
        camera={{ position: [0, 0, 0.1], fov: 60, near: 0.01, far: 1000 }}
        dpr={[1, 2]}
        gl={{ antialias: false, alpha: false }}
      >
        <color attach="background" args={[background]} />
        <Suspense fallback={null}>
          <SplatLoader url={record.plyUrl} />
        </Suspense>
        <OrbitControls
          enablePan
          enableZoom
          autoRotate={autoRotate}
          autoRotateSpeed={0.6}
          minDistance={0.5}
          maxDistance={20}
        />
      </Canvas>
    </div>
  );
}

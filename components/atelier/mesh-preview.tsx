"use client";

import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Suspense } from "react";
import type { MeshAsset } from "lib/assets/meshes";

function GLBModel({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url);
  return <primitive object={gltf.scene} />;
}

/**
 * Inline 3D mesh preview. Loads the .glb on the client only; the
 * page that renders this MUST wrap it in `next/dynamic` with
 * `ssr: false` because GLTFLoader does not run during SSR.
 */
export default function MeshPreview({ mesh }: { mesh: MeshAsset }) {
  return (
    <div className="aspect-square w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
      <Canvas
        camera={{ position: [1.5, 1.2, 1.5], fov: 35 }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Stage
            adjustCamera
            intensity={0.6}
            shadows={false}
            preset="rembrandt"
            environment="city"
          >
            <GLBModel url={mesh.url} />
          </Stage>
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={1.2}
        />
      </Canvas>
    </div>
  );
}

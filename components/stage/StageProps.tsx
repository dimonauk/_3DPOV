"use client";

/**
 * components/stage/StageProps.tsx — GLB / GLTF prop loader.
 *
 * Renders an array of PropSpecs as scene meshes. Uses Drei's `useGLTF`,
 * which wraps three's GLTFLoader and de-duplicates loads (a prop
 * referenced multiple times only downloads once).
 *
 * Each prop is wrapped in a <group> so position / rotation / scale apply
 * uniformly. Shadows are opt-in per prop; defaults to both cast and
 * receive (most non-character meshes benefit from both).
 *
 * Source of GLBs: drop into public/props/<name>.glb. Generate from
 * images via the ComfyUI Hunyuan3D-2mv-turbo workflow (see
 * [[dollyos-comfyui-3d]] skill) — ~53 seconds per 15 MB mesh.
 */

import { Suspense } from "react";
import { useGLTF } from "@react-three/drei";

import type { PropSpec, Vec3 } from "lib/stage/types";

function toScaleTuple(s: PropSpec["scale"]): Vec3 {
  if (s === undefined) return [1, 1, 1];
  if (typeof s === "number") return [s, s, s];
  return s;
}

function Prop({ spec }: { spec: PropSpec }) {
  const gltf = useGLTF(spec.url);
  const scale = toScaleTuple(spec.scale);
  const cast = spec.castShadow ?? true;
  const receive = spec.receiveShadow ?? true;

  // useGLTF returns a singleton; clone the scene so the same GLB can
  // appear multiple times with different transforms / shadow flags.
  const cloned = gltf.scene.clone(true);
  cloned.traverse((obj) => {
    if ("isMesh" in obj && (obj as { isMesh: boolean }).isMesh) {
      const mesh = obj as unknown as { castShadow: boolean; receiveShadow: boolean };
      mesh.castShadow = cast;
      mesh.receiveShadow = receive;
    }
  });

  return (
    <group
      position={spec.position ?? [0, 0, 0]}
      rotation={spec.rotation ?? [0, 0, 0]}
      scale={scale}
    >
      <primitive object={cloned} />
    </group>
  );
}

export function StageProps({ specs }: { specs: PropSpec[] | undefined }) {
  if (!specs || specs.length === 0) return null;
  return (
    <Suspense fallback={null}>
      {specs.map((spec, i) => (
        <Prop key={`${spec.url}-${i}`} spec={spec} />
      ))}
    </Suspense>
  );
}

"use client";

/**
 * components/sculpture-gallery/SculptureMesh.tsx — Primitive fallback
 * mesh + GLB loader for a single catalogue entry.
 *
 * Pulled out of SculptureGalleryScene to keep each file under 300
 * lines. Decides at render time whether the entry has a usable GLB
 * URL or whether to render the primitive shape. The primitive
 * fallback is what the demo runs on until real assets land.
 *
 * The picked-up state is owned by the parent — this mesh just renders
 * what it's told. Rotation is applied to the mesh itself so the
 * plinth stays still while the piece spins under WebXR pick-up.
 */

import { Suspense, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import {
  DoubleSide,
  IcosahedronGeometry,
  TorusGeometry,
  TorusKnotGeometry,
  SphereGeometry,
} from "three";

import type { SculpturePrimitive } from "lib/sculpture-gallery/catalogue";

export type SculptureMeshProps = {
  modelUrl?: string;
  primitive?: SculpturePrimitive;
  accent: string;
  /** Y-axis rotation in radians, applied to the mesh (not the plinth). */
  spin?: number;
  /** Wall reliefs read flat — scale down + thin. */
  flat?: boolean;
};

/**
 * The waveguide primitive — a clear, slightly internally-textured
 * sphere read as a resin-printed wave channel. Built from an
 * icosphere subdivision to give the surface enough triangles for the
 * specular hits to feel solid.
 */
function WaveguidePrimitive({ accent, scale }: { accent: string; scale: number }) {
  const geometry = useMemo(() => new IcosahedronGeometry(0.5, 4), []);
  return (
    <mesh geometry={geometry} scale={scale}>
      <meshPhysicalMaterial
        color={accent}
        roughness={0.15}
        metalness={0.05}
        transmission={0.7}
        thickness={0.9}
        ior={1.45}
        clearcoat={0.6}
        clearcoatRoughness={0.2}
        side={DoubleSide}
      />
    </mesh>
  );
}

function IcospherePrimitive({ accent, scale }: { accent: string; scale: number }) {
  const geometry = useMemo(() => new IcosahedronGeometry(0.5, 2), []);
  return (
    <mesh geometry={geometry} scale={scale}>
      <meshPhysicalMaterial
        color={accent}
        roughness={0.28}
        metalness={0.15}
        clearcoat={0.4}
        clearcoatRoughness={0.2}
      />
    </mesh>
  );
}

function TorusPrimitive({ accent, scale }: { accent: string; scale: number }) {
  const geometry = useMemo(() => new TorusGeometry(0.4, 0.13, 24, 96), []);
  return (
    <mesh geometry={geometry} scale={scale} rotation={[Math.PI * 0.35, 0, 0]}>
      <meshPhysicalMaterial
        color={accent}
        roughness={0.25}
        metalness={0.4}
        clearcoat={0.5}
        clearcoatRoughness={0.15}
      />
    </mesh>
  );
}

function KnotPrimitive({ accent, scale }: { accent: string; scale: number }) {
  const geometry = useMemo(
    () => new TorusKnotGeometry(0.35, 0.1, 160, 24, 2, 3),
    [],
  );
  return (
    <mesh geometry={geometry} scale={scale}>
      <meshPhysicalMaterial
        color={accent}
        roughness={0.22}
        metalness={0.3}
        clearcoat={0.55}
        clearcoatRoughness={0.18}
      />
    </mesh>
  );
}

/**
 * Loaded-GLB renderer. Wrapped in its own component so the calling
 * code can keep Suspense boundaries tight and fall back to the
 * primitive on error.
 */
function LoadedGLB({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  // Clone the scene so the same GLB can appear at multiple plinths
  // without sharing transforms.
  const cloned = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={cloned} />;
}

/**
 * Pick the primitive renderer for a `SculpturePrimitive.kind`. Falls
 * back to a small sphere so a malformed entry still has something on
 * the plinth.
 */
function PrimitiveByKind({
  primitive,
  accent,
  flat,
}: {
  primitive: SculpturePrimitive | undefined;
  accent: string;
  flat: boolean;
}) {
  const scale = (primitive?.scale ?? 1) * (flat ? 0.55 : 1);
  const kind = primitive?.kind ?? "icosphere";
  switch (kind) {
    case "waveguide":
      return <WaveguidePrimitive accent={accent} scale={scale} />;
    case "torus":
      return <TorusPrimitive accent={accent} scale={scale} />;
    case "knot":
      return <KnotPrimitive accent={accent} scale={scale} />;
    case "icosphere":
    default:
      return <IcospherePrimitive accent={accent} scale={scale} />;
  }
}

/**
 * Stub fallback for the GLB Suspense boundary. Renders a low-poly
 * placeholder sphere in the accent colour so the plinth is never
 * empty while the model resolves (or while it 404s — see error
 * handling in the parent).
 */
function GLBSuspenseFallback({ accent }: { accent: string }) {
  const geometry = useMemo(() => new SphereGeometry(0.3, 16, 16), []);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={accent} roughness={0.5} metalness={0.1} />
    </mesh>
  );
}

export function SculptureMesh({
  modelUrl,
  primitive,
  accent,
  spin = 0,
  flat = false,
}: SculptureMeshProps) {
  // Group so the parent can apply the spin/pick-up rotation cleanly.
  return (
    <group rotation-y={spin}>
      {modelUrl ? (
        <Suspense fallback={<GLBSuspenseFallback accent={accent} />}>
          <LoadedGLB url={modelUrl} />
        </Suspense>
      ) : (
        <PrimitiveByKind primitive={primitive} accent={accent} flat={flat} />
      )}
    </group>
  );
}

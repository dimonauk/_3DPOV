"use client";

/**
 * components/devices/DeviceMesh.tsx — GLB loader + category-shaped
 * primitive fallback for a single device catalogue entry.
 *
 * Mirrors the sculpture-gallery split: when `entry.modelPresent` is
 * true and the GLB resolves, we render it; otherwise we render a
 * category-tinted primitive whose proportions hint at the device
 * shape — flat slab for consoles, wider pad for controllers, blocky
 * visor for headsets, twin batons for VR controllers.
 *
 * The primitive is good enough to walk the gallery before any GLB has
 * landed under `public/models/devices/`. The placard reads the same
 * either way.
 */

import { Suspense, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { BoxGeometry, CylinderGeometry, MeshStandardMaterial } from "three";

import type { DeviceCategory, DeviceEntry } from "lib/devices/catalogue";

export type DeviceMeshProps = {
  entry: DeviceEntry;
  /** Y-axis rotation in radians applied around the device. */
  spin?: number;
};

/**
 * Approximate physical footprint (metres) per category. The plinth
 * top sits at 1.0 m; the device is lifted a touch above that, so the
 * visual centre lands near 1.15–1.3 m — comfortable for standing
 * inspection.
 */
function primitiveDimensions(
  category: DeviceCategory,
): { w: number; h: number; d: number } {
  switch (category) {
    case "console":
      // Flat-ish slab — most consoles are wider than they are tall.
      return { w: 0.32, h: 0.07, d: 0.22 };
    case "console-controller":
      // Pad — wide, shallow, hand-shaped.
      return { w: 0.18, h: 0.05, d: 0.11 };
    case "vr-headset":
      // Visor — taller and deeper than a pad, sloped on the front.
      return { w: 0.20, h: 0.10, d: 0.13 };
    case "vr-controller":
      // Two short batons placed side by side.
      return { w: 0.22, h: 0.08, d: 0.08 };
  }
}

function ConsolePrimitive({ accent }: { accent: string }) {
  const dims = primitiveDimensions("console");
  const geometry = useMemo(
    () => new BoxGeometry(dims.w, dims.h, dims.d),
    [dims.w, dims.h, dims.d],
  );
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: accent,
        roughness: 0.55,
        metalness: 0.2,
      }),
    [accent],
  );
  return <mesh geometry={geometry} material={material} castShadow />;
}

function ControllerPrimitive({ accent }: { accent: string }) {
  const dims = primitiveDimensions("console-controller");
  // Slight rounding via two stacked boxes — central body and grips.
  const bodyGeom = useMemo(
    () => new BoxGeometry(dims.w, dims.h, dims.d),
    [dims.w, dims.h, dims.d],
  );
  const gripGeom = useMemo(
    () => new BoxGeometry(dims.w * 0.35, dims.h * 1.4, dims.d * 0.7),
    [dims.w, dims.h, dims.d],
  );
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: accent,
        roughness: 0.6,
        metalness: 0.15,
      }),
    [accent],
  );
  return (
    <group>
      <mesh geometry={bodyGeom} material={material} castShadow />
      <mesh
        geometry={gripGeom}
        material={material}
        position={[-dims.w * 0.45, -dims.h * 0.2, 0]}
        rotation={[0, 0, 0.25]}
        castShadow
      />
      <mesh
        geometry={gripGeom}
        material={material}
        position={[dims.w * 0.45, -dims.h * 0.2, 0]}
        rotation={[0, 0, -0.25]}
        castShadow
      />
    </group>
  );
}

function HeadsetPrimitive({ accent }: { accent: string }) {
  const dims = primitiveDimensions("vr-headset");
  const bodyGeom = useMemo(
    () => new BoxGeometry(dims.w, dims.h, dims.d),
    [dims.w, dims.h, dims.d],
  );
  const facePlateGeom = useMemo(
    () => new BoxGeometry(dims.w * 1.02, dims.h * 0.95, dims.d * 0.15),
    [dims.w, dims.h, dims.d],
  );
  const strapGeom = useMemo(
    () =>
      new CylinderGeometry(dims.h * 0.18, dims.h * 0.18, dims.w * 1.3, 16),
    [dims.w, dims.h],
  );
  const body = useMemo(
    () =>
      new MeshStandardMaterial({
        color: accent,
        roughness: 0.45,
        metalness: 0.3,
      }),
    [accent],
  );
  const face = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#0a0a12",
        roughness: 0.2,
        metalness: 0.4,
      }),
    [],
  );
  return (
    <group>
      <mesh geometry={bodyGeom} material={body} castShadow />
      <mesh
        geometry={facePlateGeom}
        material={face}
        position={[0, 0, dims.d * 0.55]}
        castShadow
      />
      <mesh
        geometry={strapGeom}
        material={body}
        position={[0, 0, -dims.d * 0.4]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      />
    </group>
  );
}

function VrControllerPrimitive({ accent }: { accent: string }) {
  const dims = primitiveDimensions("vr-controller");
  // Two batons side by side, each with a tracking ring on top.
  const batonGeom = useMemo(
    () =>
      new CylinderGeometry(dims.h * 0.45, dims.h * 0.5, dims.w * 0.85, 12),
    [dims.w, dims.h],
  );
  const ringGeom = useMemo(
    () => new CylinderGeometry(dims.h * 0.65, dims.h * 0.65, dims.h * 0.1, 24),
    [dims.h],
  );
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: accent,
        roughness: 0.55,
        metalness: 0.2,
      }),
    [accent],
  );
  return (
    <group>
      {[-1, 1].map((side) => (
        <group
          key={side}
          position={[side * dims.w * 0.45, 0, 0]}
          rotation={[Math.PI * 0.45 * side, 0, 0]}
        >
          <mesh geometry={batonGeom} material={material} castShadow />
          <mesh
            geometry={ringGeom}
            material={material}
            position={[0, dims.w * 0.5, 0]}
            castShadow
          />
        </group>
      ))}
    </group>
  );
}

function PrimitiveByCategory({
  category,
  accent,
}: {
  category: DeviceCategory;
  accent: string;
}) {
  switch (category) {
    case "console":
      return <ConsolePrimitive accent={accent} />;
    case "console-controller":
      return <ControllerPrimitive accent={accent} />;
    case "vr-headset":
      return <HeadsetPrimitive accent={accent} />;
    case "vr-controller":
      return <VrControllerPrimitive accent={accent} />;
  }
}

function LoadedGLB({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={cloned} />;
}

function GLBFallback({
  category,
  accent,
}: {
  category: DeviceCategory;
  accent: string;
}) {
  return <PrimitiveByCategory category={category} accent={accent} />;
}

export function DeviceMesh({ entry, spin = 0 }: DeviceMeshProps) {
  const accent = entry.presentation.accent;
  const scale = entry.presentation.scale ?? 1;
  return (
    <group rotation-y={spin} scale={scale}>
      {entry.modelPresent ? (
        <Suspense
          fallback={<GLBFallback category={entry.category} accent={accent} />}
        >
          <LoadedGLB url={entry.modelUrl} />
        </Suspense>
      ) : (
        <PrimitiveByCategory category={entry.category} accent={accent} />
      )}
    </group>
  );
}

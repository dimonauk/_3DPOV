"use client";

/**
 * components/devices/DeviceGalleryScene.tsx — The OSS device gallery
 * as a walkable scene.
 *
 * Four parallel rows of plinths under SceneStage's WebXR-first dual-
 * mode wrapper — consoles at the front, then console controllers, VR
 * headsets, VR controllers along negative z. Same scene graph runs in
 * 2D on a monitor and in stereo inside a WebXR session.
 *
 * Reuses the sculpture-gallery's posture: TeleportTarget over the
 * floor, hover-ray placard, optional pick-up spin on click. Bloom is
 * gated the same way — skipped inside an XR session, skipped under
 * WebGPU until our postprocessing pass moves over.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { TeleportTarget, useXR } from "@react-three/xr";
import type { Vector3 } from "three";

import SceneStage from "components/xr-scene/SceneStage";
import { useSceneStage } from "hooks/useSceneStageContext";

import {
  DEVICE_CATALOGUE,
  type DeviceEntry,
} from "lib/devices/catalogue";
import { layoutDevices } from "lib/devices/gallery-layout";

import { DevicePlinth } from "./DevicePlinth";

export type DeviceGallerySceneProps = {
  /** Override the seed catalogue. */
  catalogue?: DeviceEntry[];
  height?: string;
  initialCamera?: {
    position?: [number, number, number];
    target?: [number, number, number];
  };
};

const FLOOR_HALF = 9;
const WALL_HEIGHT = 4;
const BACK_WALL_Z = -12;

export function DeviceGalleryScene({
  catalogue,
  height = "78vh",
  initialCamera,
}: DeviceGallerySceneProps) {
  const entries = catalogue ?? [...DEVICE_CATALOGUE];
  const layout = useMemo(() => layoutDevices(entries), [entries]);

  return (
    <SceneStage
      label="Device gallery"
      webxr
      ambient={false}
      camera={{
        position: initialCamera?.position ?? [0, 1.6, 3.8],
        target: initialCamera?.target ?? [0, 1.1, -3],
        fov: 48,
      }}
      height={height}
      background="#0a0810"
    >
      <GalleryContents layout={layout} />
    </SceneStage>
  );
}

function GalleryContents({
  layout,
}: {
  layout: ReturnType<typeof layoutDevices>;
}) {
  const router = useRouter();
  const session = useXR((s) => s.session);
  const stageCtx = useSceneStage();
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [spinningSlug, setSpinningSlug] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!spinningSlug || reducedMotion) return;
    const id = window.setInterval(() => {
      setSpinAngle((a) => (a + 0.045) % (Math.PI * 2));
    }, 30);
    return () => window.clearInterval(id);
  }, [spinningSlug, reducedMotion]);

  const onPlinthClick = useCallback(
    (entry: DeviceEntry) => {
      if (session) {
        // Inside XR, click toggles the spin on the device — same
        // pattern as the sculpture gallery. Loaded GLBs do spin here
        // (devices are usually presented rotating in product shots).
        setSpinningSlug((current) =>
          current === entry.slug ? null : entry.slug,
        );
        return;
      }
      router.push(`/atelier/devices/${entry.slug}`);
    },
    [router, session],
  );

  const onTeleport = useCallback((point: Vector3) => {
    const x = Math.max(
      -FLOOR_HALF + 0.4,
      Math.min(FLOOR_HALF - 0.4, point.x),
    );
    const z = Math.max(
      -FLOOR_HALF + 0.4,
      Math.min(FLOOR_HALF - 0.4, point.z),
    );
    point.set(x, 0, z);
  }, []);

  return (
    <>
      {/* Cool accent light from above the rows. */}
      <pointLight position={[0, 4.0, 0]} intensity={0.35} color="#bcd6ff" />
      <pointLight
        position={[-4, 3.0, -3]}
        intensity={0.25}
        color="#ffd0e7"
      />

      <TeleportTarget onTeleport={onTeleport}>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0, -4]} receiveShadow>
          <planeGeometry args={[FLOOR_HALF * 2, FLOOR_HALF * 2]} />
          <meshStandardMaterial
            color="#14121a"
            roughness={0.88}
            metalness={0.05}
          />
        </mesh>
      </TeleportTarget>

      {/* Back wall — slightly cooler than the floor so the rows
          read against it from the visitor's position. */}
      <mesh position={[0, WALL_HEIGHT * 0.5, BACK_WALL_Z]} receiveShadow>
        <planeGeometry args={[FLOOR_HALF * 2.4, WALL_HEIGHT]} />
        <meshStandardMaterial
          color="#181522"
          roughness={0.92}
          metalness={0.03}
        />
      </mesh>

      {layout.rows.map((row) =>
        row.devices.map((placed) => {
          const isSpinning = spinningSlug === placed.entry.slug;
          return (
            <DevicePlinth
              key={placed.entry.slug}
              entry={placed.entry}
              position={placed.position}
              rotationY={placed.rotationY}
              spin={isSpinning ? spinAngle : 0}
              showPlacard={hoveredSlug === placed.entry.slug}
              onHover={(h) =>
                setHoveredSlug(h ? placed.entry.slug : null)
              }
              onClick={() => onPlinthClick(placed.entry)}
            />
          );
        }),
      )}

      {!session && !stageCtx?.isWebGPU && (
        <EffectComposer enableNormalPass={false}>
          <Bloom
            intensity={0.28}
            luminanceThreshold={0.8}
            luminanceSmoothing={0.25}
            mipmapBlur
          />
        </EffectComposer>
      )}
    </>
  );
}

export default DeviceGalleryScene;

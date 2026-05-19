"use client";

/**
 * components/sculpture-gallery/SculptureGalleryScene.tsx — The walk-
 * through gallery.
 *
 * Wraps `SceneStage` (our WebXR-first dual-mode wrapper) and feeds it
 * floor + walls + plinths + wall reliefs assembled from the catalogue
 * via the pure `layoutGallery` function. The same R3F children render
 * identically in 2D on a monitor and in stereo inside a WebXR
 * session — SceneStage owns the camera rigs, the toolbar, and the
 * renderer choice.
 *
 * WebXR-specific extras layered on top:
 *
 *   - `<TeleportTarget>` over the floor, so the visitor can hop with
 *     the controller ray. Reduced-motion users get teleport only —
 *     SceneStage's XRCameraRig disables thumbstick locomotion when
 *     the OS asks for it (see the `locomotion` prop wiring below).
 *
 *   - Hover-ray highlight: each plinth's onPointerOver/Out drives the
 *     placard popover above the piece, which works for both mouse
 *     and the XR controller ray.
 *
 *   - Pick-up + rotate (primitive entries only): controller A-button
 *     toggles a spin on the hovered piece. GLB-loaded entries are
 *     left alone — the catalogue's GLBs are authored upright and the
 *     studio doesn't want them tumbling under accidental input.
 *
 * Postprocessing:
 *   - Optional Bloom for the waveguide pieces' glow. Skipped inside a
 *     WebXR session because stereoscopic bloom doubles the GPU cost
 *     and produces dropped frames on Quest-class headsets — same
 *     gate StagePost.tsx documents.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { TeleportTarget, useXR } from "@react-three/xr";
import type { Vector3 } from "three";

import SceneStage from "components/xr-scene/SceneStage";
import { useSceneStage } from "hooks/useSceneStageContext";

import {
  CATALOGUE,
  type SculptureEntry,
} from "lib/sculpture-gallery/catalogue";
import { layoutGallery } from "lib/sculpture-gallery/gallery-layout";

import { SculpturePlinth } from "./SculpturePlinth";
import { WallRelief } from "./WallRelief";

export type SculptureGallerySceneProps = {
  /** Override the seed catalogue. Defaults to the full set. */
  catalogue?: SculptureEntry[];
  /** Wrapper height. Default 80vh. */
  height?: string;
  /** 2D-mode camera defaults forwarded to SceneStage. */
  initialCamera?: {
    position?: [number, number, number];
    target?: [number, number, number];
  };
};

const FLOOR_HALF = 8;
const WALL_HEIGHT = 4;
const BACK_WALL_Z = -7.5;

export function SculptureGalleryScene({
  catalogue,
  height = "80vh",
  initialCamera,
}: SculptureGallerySceneProps) {
  const entries = catalogue ?? [...CATALOGUE];
  const layout = useMemo(() => layoutGallery(entries), [entries]);

  return (
    <SceneStage
      label="Sculpture gallery"
      webxr
      ambient={false}
      camera={{
        position: initialCamera?.position ?? [0, 1.6, 4.5],
        target: initialCamera?.target ?? [0, 1.1, 0],
        fov: 45,
      }}
      height={height}
      background="#0a0810"
    >
      <GalleryContents layout={layout} />
    </SceneStage>
  );
}

/**
 * Inside the Canvas — the scene graph proper. Lifted out so we can
 * call `useXR` to gate the post-processing pass on the XR session
 * state without polluting the wrapper component.
 */
function GalleryContents({
  layout,
}: {
  layout: ReturnType<typeof layoutGallery>;
}) {
  const router = useRouter();
  const session = useXR((s) => s.session);
  const stageCtx = useSceneStage();
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [spinningSlug, setSpinningSlug] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);

  // Reduced motion — disables the spin animation on the picked-up
  // piece. Teleport remains; thumbstick locomotion is disabled by the
  // XR rig when the OS asks for it.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Drive the spin angle on the picked-up piece. Cheap — a single
  // setState per frame is acceptable here because only one piece can
  // spin at a time, and we only run the interval when something is
  // actually picked up.
  useEffect(() => {
    if (!spinningSlug || reducedMotion) return;
    const id = window.setInterval(() => {
      setSpinAngle((a) => (a + 0.04) % (Math.PI * 2));
    }, 30);
    return () => window.clearInterval(id);
  }, [spinningSlug, reducedMotion]);

  const onPlinthClick = useCallback(
    (entry: SculptureEntry) => {
      // Inside an XR session, click is the pick-up toggle (primitive
      // entries only — GLB pieces stay upright). Outside a session,
      // click navigates to the single-piece view.
      if (session) {
        if (!entry.primitive || entry.modelUrl) return;
        setSpinningSlug((current) =>
          current === entry.slug ? null : entry.slug,
        );
        return;
      }
      router.push(`/atelier/sculpture-gallery/${entry.slug}`);
    },
    [router, session],
  );

  const onTeleport = useCallback((point: Vector3) => {
    // Clamp the landing to the floor square. TeleportTarget mutates
    // the Vector3 in place after the callback returns.
    const x = Math.max(-FLOOR_HALF + 0.4, Math.min(FLOOR_HALF - 0.4, point.x));
    const z = Math.max(-FLOOR_HALF + 0.4, Math.min(FLOOR_HALF - 0.4, point.z));
    point.set(x, 0, z);
  }, []);

  return (
    <>
      {/* Soft accent lighting — pink/lavender feel. SceneStage already
          mounts a base ambient + directional; these add the gallery
          colour temperature. */}
      <pointLight position={[0, 3.2, 2.5]} intensity={0.45} color="#ffd0e7" />
      <pointLight
        position={[-3.5, 2.8, -2]}
        intensity={0.35}
        color="#c8b1ff"
      />

      {/* Floor — matt. Wide enough that the teleport ray always lands
          on it before the camera clips through. */}
      <TeleportTarget onTeleport={onTeleport}>
        <mesh
          rotation-x={-Math.PI / 2}
          position={[0, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[FLOOR_HALF * 2, FLOOR_HALF * 2]} />
          <meshStandardMaterial color="#16131c" roughness={0.85} metalness={0.05} />
        </mesh>
      </TeleportTarget>

      {/* Back wall — host for the wall reliefs. Same matt finish as
          the floor so the reliefs read against it without glare. */}
      <mesh
        position={[0, WALL_HEIGHT * 0.5, BACK_WALL_Z]}
        receiveShadow
      >
        <planeGeometry args={[FLOOR_HALF * 2, WALL_HEIGHT]} />
        <meshStandardMaterial color="#1a1622" roughness={0.9} metalness={0.02} />
      </mesh>

      {/* Floor plinths from the layout. */}
      {layout.floor.map((placed) => {
        const isSpinning = spinningSlug === placed.entry.slug;
        return (
          <SculpturePlinth
            key={placed.entry.slug}
            entry={placed.entry}
            position={placed.position}
            rotationY={placed.rotationY}
            spin={isSpinning ? spinAngle : 0}
            showPlacard={hoveredSlug === placed.entry.slug}
            onHover={(h) => setHoveredSlug(h ? placed.entry.slug : null)}
            onClick={() => onPlinthClick(placed.entry)}
          />
        );
      })}

      {/* Wall reliefs from the layout. */}
      {layout.wall.map((placed) => (
        <WallRelief
          key={placed.entry.slug}
          entry={placed.entry}
          position={placed.position}
          rotationY={placed.rotationY}
          showPlacard={hoveredSlug === placed.entry.slug}
          onHover={(h) => setHoveredSlug(h ? placed.entry.slug : null)}
          onClick={() => onPlinthClick(placed.entry)}
        />
      ))}

      {/* Post — Bloom for the waveguide glow. Gated on:
            - the XR session state (stereoscopic bloom is too expensive
              on Quest-class hardware — same gate StagePost.tsx uses),
            - the WebGPU detection (postprocessing v3 still targets the
              WebGL renderer; skipping under WebGPU keeps the renderer
              swap safe — the waveguides still glow under their tinted
              spots even without bloom). */}
      {!session && !stageCtx?.isWebGPU && (
        <EffectComposer enableNormalPass={false}>
          <Bloom
            intensity={0.35}
            luminanceThreshold={0.78}
            luminanceSmoothing={0.25}
            mipmapBlur
          />
        </EffectComposer>
      )}
    </>
  );
}

export default SculptureGalleryScene;

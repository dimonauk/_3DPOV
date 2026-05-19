"use client";

/**
 * app/atelier/scene-stage-demo/scene-stage-demo-client.tsx
 *
 * Client surface for the SceneStage showcase. Holds the R3F scene
 * graph (floor + three focal meshes + a low-poly skybox), wires the
 * Html labels, mounts <SceneStage> with ambient + WebXR enabled, and
 * exposes the WebXR support pill below the canvas so a desktop
 * visitor can see at a glance what view modes their hardware allows.
 *
 * Reduced-motion: read once on mount via matchMedia. The foil drift
 * slows to a stroll; the chrome knot freezes outright (no rotation).
 * Each PresetMesh forwards the flag into buildPreset so its uniform
 * animation pauses too — belt and braces.
 */

import { Html } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import { BackSide, type Mesh } from "three";

import { SceneStage } from "components/xr-scene/SceneStage";
import { useWebXRSupport } from "hooks/useWebXRSupport";

import { PresetMesh } from "components/scene-stage-demo/PresetMesh";

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "10px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#ffc4d9",
  background: "rgba(12, 10, 18, 0.78)",
  border: "1px solid rgba(255, 196, 217, 0.35)",
  padding: "3px 7px",
  borderRadius: "2px",
  whiteSpace: "nowrap",
  pointerEvents: "none",
};

function PresetLabel({
  position,
  children,
}: {
  position: [number, number, number];
  children: React.ReactNode;
}) {
  return (
    <Html position={position} center style={{ pointerEvents: "none" }}>
      <div style={LABEL_STYLE}>{children}</div>
    </Html>
  );
}

export default function SceneStageDemoClient() {
  const support = useWebXRSupport();
  const [reducedMotion, setReducedMotion] = useState(false);

  // Read prefers-reduced-motion once and watch for changes — same
  // pattern AmbientField uses so the whole page agrees on motion.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Drift speeds — the foil drifts slowly under normal motion; the
  // factor pulls way down under reduced-motion so the mesh sits
  // near-still but the gentle bob keeps the depth cue alive.
  const foilSpin = reducedMotion ? 0.05 : 0.35;
  const cubeBob = reducedMotion ? 0 : 1;

  const onFoilFrame = useMemo(
    () => (mesh: Mesh, t: number) => {
      mesh.rotation.x = t * foilSpin * 0.4;
      mesh.rotation.y = t * foilSpin;
    },
    [foilSpin],
  );

  const onCubeFrame = useMemo(
    () => (mesh: Mesh, t: number) => {
      mesh.position.y = 0.4 + Math.sin(t * 0.6) * 0.08 * cubeBob;
      mesh.rotation.y = t * 0.12 * cubeBob;
    },
    [cubeBob],
  );

  return (
    <div className="space-y-6">
      <SceneStage
        label="Scene-Stage demo"
        webxr
        ambient
        height="68vh"
        camera={{ position: [0, 1.4, 4.2], target: [0, 0.6, 0], fov: 38 }}
      >
        {/* Backdrop low-poly skybox — inside-out icosahedron painted
            with the matte preset for a faceted warm-black dome. */}
        <PresetMesh preset="matte" scale={24}>
          <icosahedronGeometry args={[1, 1]} />
        </PresetMesh>
        {/* The matte preset uses double-sided lighting weakly; we need
            BackSide for the skybox. Apply via a second mesh that
            shares the geometry but overrides material side. The
            additional mesh keeps PresetMesh portable for the floor. */}
        <SkyboxBackface />

        {/* Floor — flat matte plate. */}
        <PresetMesh preset="matte" position={[0, -0.01, 0]}>
          <cylinderGeometry args={[5, 5, 0.02, 64]} />
        </PresetMesh>
        <PresetLabel position={[0, 0.05, 2.4]}>Floor · matte</PresetLabel>

        {/* Foil icosahedron — drifts slowly. */}
        <PresetMesh
          preset="foil"
          position={[-1.3, 0.9, 0]}
          scale={0.55}
          reducedMotion={reducedMotion}
          onFrame={onFoilFrame}
        >
          <icosahedronGeometry args={[1, 0]} />
        </PresetMesh>
        <PresetLabel position={[-1.3, 1.7, 0]}>Foil · holographic</PresetLabel>

        {/* Chrome torus knot — static. Catches the directional light. */}
        <PresetMesh
          preset="chrome"
          position={[0, 0.95, -0.4]}
          scale={0.42}
        >
          <torusKnotGeometry args={[1, 0.32, 180, 32]} />
        </PresetMesh>
        <PresetLabel position={[0, 1.75, -0.4]}>Chrome · polished</PresetLabel>

        {/* Glass cube — refracting, bobs gently. */}
        <PresetMesh
          preset="glass"
          position={[1.3, 0.4, 0]}
          scale={0.55}
          reducedMotion={reducedMotion}
          onFrame={onCubeFrame}
        >
          <boxGeometry args={[1, 1, 1]} />
        </PresetMesh>
        <PresetLabel position={[1.3, 1.2, 0]}>Glass · transmission</PresetLabel>

        {/* Backstop key light. The SceneStage already mounts an
            ambient + directional pair, but the chrome highlight
            wants a second hot source slightly off-axis to read. */}
        <pointLight position={[-3, 4, 2]} intensity={0.5} color="#ffc4d9" />
      </SceneStage>

      <SupportPill support={support} />
    </div>
  );
}

/**
 * Backside skybox. Same icosahedron geometry as the matte primitive,
 * but with explicit BackSide so the camera sees the inner faces. The
 * preset's material isn't reused — a cheap inline standard-material
 * keeps the bundle clean and lets the matte primitive stay as a
 * forward-facing reference object outside.
 */
function SkyboxBackface() {
  return (
    <mesh scale={36}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color="#1c1626"
        roughness={1}
        metalness={0}
        side={BackSide}
      />
    </mesh>
  );
}

function SupportPill({
  support,
}: {
  support: ReturnType<typeof useWebXRSupport>;
}) {
  const message = !support.ready
    ? "Probing WebXR…"
    : !support.vr && !support.ar
      ? "This browser has no WebXR session. Open in Quest, Vision Pro, or a phone with ARCore for VR/AR buttons."
      : support.vr && support.ar
        ? "Both VR and AR sessions are reachable from this browser."
        : support.vr
          ? "VR is reachable. AR is not."
          : "AR is reachable. VR is not.";

  return (
    <div className="flex flex-wrap items-center gap-2 text-[0.7rem]">
      <span className="chrome-label">WebXR support</span>
      <span className="rounded-sm border border-warm-black-800 bg-warm-black-900/60 px-3 py-1 font-mono text-chrome-200">
        {message}
      </span>
      <span
        className={`rounded-sm border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider ${
          support.vr
            ? "border-pink-200/50 text-pink-200"
            : "border-warm-black-700 text-chrome-500"
        }`}
      >
        VR · {support.vr ? "ok" : "no"}
      </span>
      <span
        className={`rounded-sm border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider ${
          support.ar
            ? "border-pink-200/50 text-pink-200"
            : "border-warm-black-700 text-chrome-500"
        }`}
      >
        AR · {support.ar ? "ok" : "no"}
      </span>
    </div>
  );
}

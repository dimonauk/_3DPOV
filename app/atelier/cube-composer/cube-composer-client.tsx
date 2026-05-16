"use client";

/**
 * app/atelier/cube-composer/cube-composer-client.tsx
 *
 * Pure-client visualiser for the CubeComposer paper. Renders a 360-sphere
 * as a cubemap (six square faces around the viewer), parks a perspective
 * camera frustum inside it, and animates that frustum along a recorded
 * yaw/pitch/roll trajectory. As frames advance the chamber highlights
 * which of the five missing faces is "being generated" in the current
 * temporal window — left/right/up/down/back. Front follows the camera
 * because front IS the input perspective video.
 *
 * No actual diffusion happens here. The bench reference at
 * D:/The_Hangar/engines/CubeComposer/ does the real generation in
 * Python; this chamber explains the geometry + autoregressive order.
 */

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BackSide,
  type Group,
  type Mesh,
  MathUtils,
  PerspectiveCamera,
  Quaternion,
  Vector3,
} from "three";

import { createLogger } from "lib/log";
import { useActiveChamber } from "lib/state/atelier-hooks";

const log = createLogger("atelier:cube-composer");

// ---- Trajectory ---------------------------------------------------------

// Sampled subset of the rotation trajectory shipped with the bench
// reference at
// engines/CubeComposer/assets/trajectory_rotation_fov90_2wp_20samples.json
// (video_id "003", 27 frames). Inlined so the chamber has no fetch
// dependency; degrees, exactly as the JSON stores them.
const TRAJECTORY_DEG: ReadonlyArray<{
  frame: number;
  roll: number;
  pitch: number;
  yaw: number;
}> = [
  { frame: 0, roll: 17.79, pitch: 36.15, yaw: 96.0 },
  { frame: 1, roll: 18.28, pitch: 33.29, yaw: 88.57 },
  { frame: 2, roll: 18.83, pitch: 30.58, yaw: 81.2 },
  { frame: 3, roll: 19.27, pitch: 27.56, yaw: 73.84 },
  { frame: 4, roll: 19.7, pitch: 24.87, yaw: 66.38 },
  { frame: 5, roll: 20.18, pitch: 22.05, yaw: 59.04 },
  { frame: 6, roll: 20.87, pitch: 19.38, yaw: 51.52 },
  { frame: 7, roll: 21.38, pitch: 16.64, yaw: 44.09 },
  { frame: 8, roll: 21.79, pitch: 13.91, yaw: 36.6 },
  { frame: 9, roll: 22.09, pitch: 11.2, yaw: 29.21 },
  { frame: 10, roll: 22.31, pitch: 8.42, yaw: 21.76 },
  { frame: 11, roll: 22.45, pitch: 5.68, yaw: 14.36 },
  { frame: 12, roll: 22.5, pitch: 2.86, yaw: 6.91 },
  { frame: 13, roll: 22.47, pitch: 0.0, yaw: 0.0 },
  { frame: 14, roll: 22.36, pitch: -2.86, yaw: -6.91 },
  { frame: 15, roll: 22.18, pitch: -5.68, yaw: -14.36 },
  { frame: 16, roll: 21.92, pitch: -8.42, yaw: -21.76 },
  { frame: 17, roll: 21.59, pitch: -11.2, yaw: -29.21 },
  { frame: 18, roll: 21.19, pitch: -13.91, yaw: -36.6 },
  { frame: 19, roll: 20.72, pitch: -16.64, yaw: -44.09 },
  { frame: 20, roll: 20.19, pitch: -19.38, yaw: -51.52 },
  { frame: 21, roll: 19.6, pitch: -22.05, yaw: -59.04 },
  { frame: 22, roll: 18.94, pitch: -24.87, yaw: -66.38 },
  { frame: 23, roll: 18.24, pitch: -27.56, yaw: -73.84 },
  { frame: 24, roll: 17.48, pitch: -30.58, yaw: -81.2 },
  { frame: 25, roll: 16.68, pitch: -33.29, yaw: -88.57 },
  { frame: 26, roll: 15.83, pitch: -36.15, yaw: -96.0 },
];

const NUM_FRAMES = TRAJECTORY_DEG.length;

// Temporal window — CubeComposer-3k uses 9 frames per autoregressive
// step, CubeComposer-4k uses 5. We use 9 to match the included asset.
const WINDOW_LENGTH = 9;

// Autoregressive face order — the paper generates front first
// (because front IS the input perspective frame), then sides, then
// back, then top/bottom. The Python pipeline uses this kind of order
// for `active_faces` traversal; the exact list here is an explanatory
// one, not literal from the codebase.
type CubeFace = "front" | "right" | "left" | "back" | "up" | "down";

const FACE_ORDER: ReadonlyArray<CubeFace> = [
  "front",
  "right",
  "left",
  "back",
  "up",
  "down",
];

const FACE_LABELS: Record<CubeFace, string> = {
  front: "Front (input)",
  right: "Right",
  left: "Left",
  back: "Back",
  up: "Up",
  down: "Down",
};

const FACE_COLOR_ACTIVE: Record<CubeFace, string> = {
  front: "#67e8f9",
  right: "#f9a8d4",
  left: "#c026d3",
  back: "#7c3aed",
  up: "#fbbf24",
  down: "#5eead4",
};

const FACE_COLOR_DONE = "#3a3a44";
const FACE_COLOR_PENDING = "#1a1a22";

// Face → position + orientation on a unit cube centred at the origin,
// rendered as a 2x2 plane two units out (so the cube has side length
// 4 — comfortable orbit distance from the inside).
const CUBE_RADIUS = 2;

const FACE_TRANSFORMS: Record<
  CubeFace,
  { position: [number, number, number]; rotation: [number, number, number] }
> = {
  // Camera default look direction in three is -Z, so "front" sits at
  // -Z and faces +Z (inward).
  front: { position: [0, 0, -CUBE_RADIUS], rotation: [0, 0, 0] },
  back: { position: [0, 0, CUBE_RADIUS], rotation: [0, Math.PI, 0] },
  right: { position: [CUBE_RADIUS, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  left: { position: [-CUBE_RADIUS, 0, 0], rotation: [0, Math.PI / 2, 0] },
  up: { position: [0, CUBE_RADIUS, 0], rotation: [Math.PI / 2, 0, 0] },
  down: { position: [0, -CUBE_RADIUS, 0], rotation: [-Math.PI / 2, 0, 0] },
};

// ---- Frustum gizmo -----------------------------------------------------

type FrustumProps = {
  frame: number;
  playing: boolean;
  onAdvance: () => void;
};

function FrustumGizmo({ frame, playing, onAdvance }: FrustumProps) {
  const groupRef = useRef<Group>(null);
  const camRef = useRef<PerspectiveCamera>(new PerspectiveCamera(90, 1, 0.1, CUBE_RADIUS));

  // Re-orient the gizmo whenever the active frame changes. Stored as
  // a target quaternion so we can lerp toward it for smoothness.
  const targetQ = useMemo(() => {
    const q = new Quaternion();
    const f = TRAJECTORY_DEG[frame];
    if (!f) return q;
    // Three uses radians; trajectory file uses degrees in roll/pitch/yaw.
    // Apply in YXZ order so yaw is "rotate around world up", pitch is
    // "look up/down", roll is "twist". Matches how the equilib lib
    // (used bench-side) consumes its Euler angles.
    const yaw = MathUtils.degToRad(f.yaw);
    const pitch = MathUtils.degToRad(f.pitch);
    const roll = MathUtils.degToRad(f.roll);
    q.setFromAxisAngle(new Vector3(0, 1, 0), yaw);
    const qPitch = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pitch);
    const qRoll = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), roll);
    q.multiply(qPitch).multiply(qRoll);
    return q;
  }, [frame]);

  // Smooth frame advance while playing — one frame per 200ms.
  const accumRef = useRef(0);
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.quaternion.slerp(targetQ, 0.2);
    }
    if (!playing) return;
    accumRef.current += delta;
    if (accumRef.current >= 0.2) {
      accumRef.current = 0;
      onAdvance();
    }
  });

  return (
    <group ref={groupRef}>
      {/* Camera body: a small cyan box where the lens sits. */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.18, 0.14, 0.22]} />
        <meshStandardMaterial
          color="#67e8f9"
          emissive="#67e8f9"
          emissiveIntensity={0.6}
        />
      </mesh>
      {/* Frustum cone — a thin pyramid pointing along -Z (the camera
          forward direction). Built from a cone scaled to read as a
          90deg frustum that touches the front face of the cube. */}
      <mesh position={[0, 0, -CUBE_RADIUS / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[CUBE_RADIUS / 1.05, CUBE_RADIUS, 4, 1, true]} />
        <meshBasicMaterial
          color="#67e8f9"
          wireframe
          transparent
          opacity={0.45}
        />
      </mesh>
      {/* Reference primitive so React keeps camRef alive (avoids
          unused-import noise; the camera object is meaningful in the
          inspector even if we don't render it). */}
      <primitive object={camRef.current} visible={false} />
    </group>
  );
}

// ---- Cubemap shell -----------------------------------------------------

type CubeShellProps = {
  faceStatus: Record<CubeFace, "active" | "done" | "pending">;
};

function CubeShell({ faceStatus }: CubeShellProps) {
  return (
    <group>
      {FACE_ORDER.map((face) => {
        const xf = FACE_TRANSFORMS[face];
        const status = faceStatus[face];
        const color =
          status === "active"
            ? FACE_COLOR_ACTIVE[face]
            : status === "done"
              ? FACE_COLOR_DONE
              : FACE_COLOR_PENDING;
        const opacity = status === "active" ? 0.55 : status === "done" ? 0.4 : 0.15;
        return (
          <FacePanel
            key={face}
            position={xf.position}
            rotation={xf.rotation}
            color={color}
            opacity={opacity}
            label={face}
          />
        );
      })}
    </group>
  );
}

function FacePanel({
  position,
  rotation,
  color,
  opacity,
  label,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  opacity: number;
  label: string;
}) {
  const ref = useRef<Mesh>(null);
  return (
    <mesh ref={ref} position={position} rotation={rotation} name={label}>
      <planeGeometry args={[CUBE_RADIUS * 2, CUBE_RADIUS * 2]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={BackSide}
      />
    </mesh>
  );
}

// ---- Scene shell -------------------------------------------------------

function Scene({
  frame,
  playing,
  onAdvance,
  faceStatus,
}: {
  frame: number;
  playing: boolean;
  onAdvance: () => void;
  faceStatus: Record<CubeFace, "active" | "done" | "pending">;
}) {
  return (
    <>
      <color attach="background" args={["#0a0a0d"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={0.6} />

      {/* Tiny world-axis tripod at the origin for orientation. */}
      <axesHelper args={[0.4]} />

      <CubeShell faceStatus={faceStatus} />
      <FrustumGizmo frame={frame} playing={playing} onAdvance={onAdvance} />

      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={0.5}
        maxDistance={6}
      />
    </>
  );
}

// ---- Client component --------------------------------------------------

export default function CubeComposerClient() {
  useActiveChamber("cube-composer");

  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [windowStart, setWindowStart] = useState(0);
  const [autoregressiveStep, setAutoregressiveStep] = useState(0);

  // Each "temporal window" of WINDOW_LENGTH frames cycles through the
  // six faces in FACE_ORDER one at a time. Once all six are generated
  // the window advances. This is the explanatory simplification of
  // the paper's pipeline — the real codebase generates one face per
  // window per pass and uses several windows; we collapse the timing
  // so the chamber is readable.
  useEffect(() => {
    const w = Math.floor(frame / WINDOW_LENGTH);
    if (w !== windowStart) {
      setWindowStart(w);
      setAutoregressiveStep(0);
      log.debug("temporal window advanced", { window: w, frame });
      return;
    }
    const stepInWindow = frame % WINDOW_LENGTH;
    // Spread the six faces across the WINDOW_LENGTH frames; integer
    // division so the step holds for a few frames before moving on.
    const nextStep = Math.min(
      FACE_ORDER.length - 1,
      Math.floor((stepInWindow * FACE_ORDER.length) / WINDOW_LENGTH),
    );
    if (nextStep !== autoregressiveStep) {
      setAutoregressiveStep(nextStep);
    }
  }, [frame, windowStart, autoregressiveStep]);

  const faceStatus = useMemo<Record<CubeFace, "active" | "done" | "pending">>(() => {
    const out: Record<CubeFace, "active" | "done" | "pending"> = {
      front: "pending",
      right: "pending",
      left: "pending",
      back: "pending",
      up: "pending",
      down: "pending",
    };
    for (let i = 0; i < FACE_ORDER.length; i += 1) {
      const face = FACE_ORDER[i];
      if (!face) continue;
      if (i < autoregressiveStep) out[face] = "done";
      else if (i === autoregressiveStep) out[face] = "active";
      else out[face] = "pending";
    }
    return out;
  }, [autoregressiveStep]);

  const onAdvance = useCallback(() => {
    setFrame((f) => (f + 1) % NUM_FRAMES);
  }, []);

  const onScrub = useCallback((value: number) => {
    setFrame(value);
  }, []);

  const onReset = useCallback(() => {
    setFrame(0);
    setAutoregressiveStep(0);
    setWindowStart(0);
    setPlaying(false);
    log.info("trajectory reset to frame 0");
  }, []);

  const togglePlay = useCallback(() => {
    setPlaying((p) => !p);
  }, []);

  const current = TRAJECTORY_DEG[frame];
  const activeFace = FACE_ORDER[autoregressiveStep] ?? "front";

  return (
    <div className="flex flex-col gap-6">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
        <Canvas
          dpr={[1, 2]}
          camera={{
            position: [3.5, 2.2, 3.5],
            fov: 50,
            near: 0.1,
            far: 50,
          }}
        >
          <Scene
            frame={frame}
            playing={playing}
            onAdvance={onAdvance}
            faceStatus={faceStatus}
          />
        </Canvas>

        {/* Floating control panel — bottom-right. */}
        <div className="pointer-events-auto absolute bottom-3 right-3 flex w-[260px] flex-col gap-3 rounded-sm border border-warm-black-700 bg-warm-black-950/85 p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="chrome-label text-chrome-400">Trajectory</span>
            <span className="font-mono text-[10px] text-chrome-500">
              frame {frame + 1}/{NUM_FRAMES}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={NUM_FRAMES - 1}
            value={frame}
            onChange={(e) => onScrub(Number(e.target.value))}
            className="w-full accent-pink-200"
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
            >
              {playing ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="rounded-sm border border-warm-black-700 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-chrome-300 transition-colors hover:border-chrome-500"
            >
              Reset
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <span className="chrome-label text-chrome-500">
              Window {windowStart + 1} &middot; step {autoregressiveStep + 1}/
              {FACE_ORDER.length}
            </span>
            <div className="grid grid-cols-6 gap-1">
              {FACE_ORDER.map((face) => {
                const status = faceStatus[face];
                const bg =
                  status === "active"
                    ? FACE_COLOR_ACTIVE[face]
                    : status === "done"
                      ? FACE_COLOR_DONE
                      : FACE_COLOR_PENDING;
                return (
                  <div
                    key={face}
                    title={FACE_LABELS[face]}
                    className="aspect-square w-full rounded-sm border border-warm-black-700"
                    style={{ backgroundColor: bg, opacity: status === "pending" ? 0.5 : 1 }}
                  />
                );
              })}
            </div>
          </div>

          <p className="font-mono text-[10px] leading-relaxed text-chrome-500">
            Drag to orbit &middot; scroll to zoom &middot; faces light up
            in autoregressive order as each temporal window resolves.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-chrome-400 sm:grid-cols-4">
        <Stat label="Yaw" value={`${current?.yaw.toFixed(1) ?? "0.0"}°`} />
        <Stat label="Pitch" value={`${current?.pitch.toFixed(1) ?? "0.0"}°`} />
        <Stat label="Roll" value={`${current?.roll.toFixed(1) ?? "0.0"}°`} />
        <Stat label="Active face" value={FACE_LABELS[activeFace]} />
        <Stat label="Window length" value={`${WINDOW_LENGTH} frames`} />
        <Stat label="Trajectory" value="rotation, fov 90°" />
        <Stat label="Source mode" value="3k variant" />
        <Stat label="Composer" value="CubeComposer (Wan2.2)" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-sm border border-warm-black-800 bg-warm-black-950 px-3 py-2">
      <span className="chrome-label text-chrome-500">{label}</span>
      <span className="font-mono text-chrome-200">{value}</span>
    </div>
  );
}

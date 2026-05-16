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
  ClampToEdgeWrapping,
  type Group,
  LinearFilter,
  type Mesh,
  MathUtils,
  PerspectiveCamera,
  Quaternion,
  RepeatWrapping,
  type Texture,
  TextureLoader,
  Vector3,
} from "three";

import { createLogger } from "lib/log";
import { useActiveChamber, pushAtelierOutput } from "lib/state/atelier-hooks";
import { useAuth } from "components/auth/auth-provider";

const log = createLogger("atelier:cube-composer");
const panoLog = createLogger("atelier:cube-composer:panorama");

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

// ---- Equirect → cube-face projection shader ----------------------------

/**
 * Each face plane samples an equirectangular texture by reconstructing a
 * unit world-space direction from the face's local UVs.
 *
 * Convention nailed down (subtle gotchas):
 *  - We render the planes with `side: BackSide` so the visitor inside
 *    the cube sees them. The vertex shader runs in the plane's local
 *    space — UV (0..1) maps to (-1..+1) on the face. We pass per-face
 *    basis vectors so the same shader covers all six faces.
 *  - World ray dir = right * u + up * v + forward  (then normalised).
 *  - Equirect mapping uses the OpenGL/three convention: longitude
 *    runs around +X-forward / -Z by convention, latitude is asin(y).
 *    We use atan2(dir.z, dir.x) for longitude so a panorama whose
 *    centre column is "front" sits at -Z (which is what three's
 *    default camera looks at, and what our `front` face occupies).
 *    The +0.5 offset rotates the seam to the back face — equirects
 *    conventionally put the seam at lon = ±π, which is exactly behind.
 *  - We flip latitude because the texture's +V is "down" in image
 *    space but we want "up" in world space.
 */
const FACE_VERT_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FACE_FRAG_SHADER = /* glsl */ `
  precision highp float;

  uniform sampler2D uEquirect;
  uniform vec3 uRight;
  uniform vec3 uUp;
  uniform vec3 uForward;
  uniform float uTint;
  uniform vec3 uTintColor;
  uniform float uOpacity;

  varying vec2 vUv;

  void main() {
    // UV 0..1 → -1..+1 on the face plane.
    vec2 s = vUv * 2.0 - 1.0;
    vec3 dir = normalize(uRight * s.x + uUp * s.y + uForward);

    // Equirect sampling. lon ∈ [-π, π], lat ∈ [-π/2, π/2].
    float lon = atan(dir.z, dir.x);
    float lat = asin(clamp(dir.y, -1.0, 1.0));

    // Map to UV. +0.5 places the seam at the back face. The 0.25
    // rotation aligns the panorama centre with -Z (our front face).
    vec2 uv = vec2(
      0.5 + lon / (2.0 * 3.14159265359) + 0.25,
      0.5 - lat / 3.14159265359
    );
    // Wrap longitude (texture wraps in U).
    uv.x = fract(uv.x);

    vec4 col = texture2D(uEquirect, uv);
    // Optional tint mixes the autoregressive face colour in slightly
    // when this face is "active", so the operator can still read the
    // ordering even after the panorama lands.
    vec3 rgb = mix(col.rgb, col.rgb * uTintColor, uTint);
    gl_FragColor = vec4(rgb, col.a * uOpacity);
  }
`;

// Per-face basis vectors used by the projection shader. These describe
// the face's local (u, v, forward) frame in WORLD space — i.e. what
// "right" and "up" mean on each face when the face is rendered with
// BackSide so the visitor inside sees it. Hand-derived from
// FACE_TRANSFORMS; commented to make the next debugger's life easier.
const FACE_BASIS: Record<
  CubeFace,
  { right: [number, number, number]; up: [number, number, number]; forward: [number, number, number] }
> = {
  // Front face sits at -Z, the visitor looks toward -Z. The face plane
  // is oriented so its +U runs left→right in screen space and +V runs
  // bottom→top. Because we render BackSide, the "outside" forward (i.e.
  // the world ray we want to look up in the equirect) is also -Z.
  // But the FacePanel mirrors U when BackSide — so we flip U here.
  front: { right: [-1, 0, 0], up: [0, 1, 0], forward: [0, 0, -1] },
  back: { right: [1, 0, 0], up: [0, 1, 0], forward: [0, 0, 1] },
  right: { right: [0, 0, 1], up: [0, 1, 0], forward: [1, 0, 0] },
  left: { right: [0, 0, -1], up: [0, 1, 0], forward: [-1, 0, 0] },
  // Top face: looking up, +U world-x, +V world-z (into the back of room).
  up: { right: [-1, 0, 0], up: [0, 0, -1], forward: [0, 1, 0] },
  down: { right: [-1, 0, 0], up: [0, 0, 1], forward: [0, -1, 0] },
};

// ---- Cubemap shell -----------------------------------------------------

type CubeShellProps = {
  faceStatus: Record<CubeFace, "active" | "done" | "pending">;
  equirect: Texture | null;
};

function CubeShell({ faceStatus, equirect }: CubeShellProps) {
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
        const opacity = status === "active" ? 0.85 : status === "done" ? 0.7 : 0.4;
        const placeholderOpacity =
          status === "active" ? 0.55 : status === "done" ? 0.4 : 0.15;
        return (
          <FacePanel
            key={face}
            face={face}
            position={xf.position}
            rotation={xf.rotation}
            color={color}
            opacity={equirect ? opacity : placeholderOpacity}
            equirect={equirect}
            isActive={status === "active"}
          />
        );
      })}
    </group>
  );
}

function FacePanel({
  face,
  position,
  rotation,
  color,
  opacity,
  equirect,
  isActive,
}: {
  face: CubeFace;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  opacity: number;
  equirect: Texture | null;
  isActive: boolean;
}) {
  const ref = useRef<Mesh>(null);

  // Build uniforms once per (face, equirect) pair. The shader is created
  // lazily so the colour-only path still works when no panorama has
  // landed yet.
  const uniforms = useMemo(() => {
    const basis = FACE_BASIS[face];
    return {
      uEquirect: { value: equirect },
      uRight: { value: new Vector3(...basis.right) },
      uUp: { value: new Vector3(...basis.up) },
      uForward: { value: new Vector3(...basis.forward) },
      uTint: { value: isActive ? 0.35 : 0.0 },
      uTintColor: { value: new Vector3(1, 1, 1) },
      uOpacity: { value: opacity },
    };
  }, [face, equirect, isActive, opacity]);

  // Keep uniforms live without re-mounting the material.
  useEffect(() => {
    uniforms.uEquirect.value = equirect;
    uniforms.uTint.value = isActive ? 0.35 : 0.0;
    uniforms.uOpacity.value = opacity;
  }, [uniforms, equirect, isActive, opacity]);

  return (
    <mesh ref={ref} position={position} rotation={rotation} name={face}>
      <planeGeometry args={[CUBE_RADIUS * 2, CUBE_RADIUS * 2]} />
      {equirect ? (
        <shaderMaterial
          vertexShader={FACE_VERT_SHADER}
          fragmentShader={FACE_FRAG_SHADER}
          uniforms={uniforms}
          transparent
          side={BackSide}
        />
      ) : (
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          side={BackSide}
        />
      )}
    </mesh>
  );
}

// ---- Scene shell -------------------------------------------------------

function Scene({
  frame,
  playing,
  onAdvance,
  faceStatus,
  equirect,
}: {
  frame: number;
  playing: boolean;
  onAdvance: () => void;
  faceStatus: Record<CubeFace, "active" | "done" | "pending">;
  equirect: Texture | null;
}) {
  return (
    <>
      <color attach="background" args={["#0a0a0d"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={0.6} />

      {/* Tiny world-axis tripod at the origin for orientation. */}
      <axesHelper args={[0.4]} />

      <CubeShell faceStatus={faceStatus} equirect={equirect} />
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

type PanoramaState =
  | { status: "idle" }
  | { status: "loading"; prompt: string; startedAt: number }
  | { status: "ready"; url: string; prompt: string; durationMs: number }
  | { status: "error"; message: string };

export default function CubeComposerClient() {
  useActiveChamber("cube-composer");
  const { user } = useAuth();

  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [windowStart, setWindowStart] = useState(0);
  const [autoregressiveStep, setAutoregressiveStep] = useState(0);

  // Panorama state + the loaded three Texture mapped onto the cube faces.
  const [panorama, setPanorama] = useState<PanoramaState>({ status: "idle" });
  const [panoramaPrompt, setPanoramaPrompt] = useState("");
  const [equirectTexture, setEquirectTexture] = useState<Texture | null>(null);

  // Load the equirect URL into a three Texture as soon as it lands.
  // The TextureLoader handles cross-origin Blob URLs fine; we configure
  // the wrap modes so the projection shader's `fract(u)` produces a
  // seamless wrap at the back face.
  useEffect(() => {
    if (panorama.status !== "ready") return;
    let cancelled = false;
    const loader = new TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      panorama.url,
      (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.wrapS = RepeatWrapping;
        tex.wrapT = ClampToEdgeWrapping;
        tex.minFilter = LinearFilter;
        tex.magFilter = LinearFilter;
        tex.needsUpdate = true;
        setEquirectTexture((prev) => {
          if (prev) prev.dispose();
          return tex;
        });
        panoLog.info("texture loaded", { url: panorama.url });
      },
      undefined,
      (err) => {
        if (cancelled) return;
        panoLog.error("texture load failed", { err, url: panorama.url });
        setPanorama({
          status: "error",
          message: "Loaded panorama URL but failed to decode the image.",
        });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [panorama]);

  // Dispose the texture on unmount so the GPU doesn't keep it alive.
  useEffect(() => {
    return () => {
      setEquirectTexture((prev) => {
        if (prev) prev.dispose();
        return null;
      });
    };
  }, []);

  const onGeneratePanorama = useCallback(async () => {
    const prompt = panoramaPrompt.trim();
    if (!prompt) {
      setPanorama({
        status: "error",
        message: "Type a prompt before hitting Generate.",
      });
      return;
    }
    if (!user) {
      setPanorama({
        status: "error",
        message: "Sign in as an operator to generate on the bench.",
      });
      return;
    }
    const startedAt = Date.now();
    setPanorama({ status: "loading", prompt, startedAt });
    panoLog.info("generate requested", {
      promptPreview: prompt.slice(0, 80),
    });
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(
        "/api/atelier/cube-composer/generate-panorama",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ prompt }),
        },
      );
      const data = (await res.json()) as {
        url?: string;
        bytes?: number;
        generatedAt?: string;
        durationMs?: number;
        error?: string;
        code?: string;
      };
      if (!res.ok || !data.url) {
        throw new Error(
          data.error ?? `Bench returned HTTP ${res.status}.`,
        );
      }
      const durationMs = data.durationMs ?? Date.now() - startedAt;
      setPanorama({
        status: "ready",
        url: data.url,
        prompt,
        durationMs,
      });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      pushAtelierOutput({
        chamberSlug: "cube-composer",
        kind: "image",
        label: `cube-composer-panorama-${stamp}.png`,
        blobUrl: data.url,
        mimeType: "image/png",
        sizeBytes: data.bytes ?? 0,
      });
      panoLog.info("generate done", {
        durationMs,
        bytes: data.bytes ?? 0,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown generation error.";
      panoLog.error("generate failed", { err });
      setPanorama({ status: "error", message });
    }
  }, [panoramaPrompt, user]);

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
            equirect={equirectTexture}
          />
        </Canvas>

        {/* Panorama generator — top-left, so it doesn't fight the trajectory panel. */}
        <div className="pointer-events-auto absolute left-3 top-3 flex w-[280px] flex-col gap-2 rounded-sm border border-warm-black-700 bg-warm-black-950/85 p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="chrome-label text-chrome-400">
              Source material
            </span>
            <span className="font-mono text-[10px] text-chrome-500">
              flux-equirect-lora-v3
            </span>
          </div>
          <label
            className="flex flex-col gap-1"
            htmlFor="cube-composer-panorama-prompt"
          >
            <span className="sr-only">Panorama prompt</span>
            <textarea
              id="cube-composer-panorama-prompt"
              value={panoramaPrompt}
              onChange={(e) => setPanoramaPrompt(e.target.value)}
              placeholder="e.g. abandoned warehouse interior at dawn"
              rows={2}
              disabled={panorama.status === "loading"}
              className="w-full resize-none rounded-sm border border-warm-black-700 bg-warm-black-950 px-2 py-1.5 font-mono text-[11px] text-chrome-200 placeholder:text-chrome-600 focus:border-pink-200 focus:outline-none disabled:opacity-50"
            />
          </label>
          <button
            type="button"
            onClick={onGeneratePanorama}
            disabled={panorama.status === "loading"}
            className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {panorama.status === "loading"
              ? "Generating…"
              : "Generate panorama"}
          </button>
          {panorama.status === "loading" ? (
            <p className="font-mono text-[10px] leading-relaxed text-chrome-400">
              generating 360° on the bench… ~45-90s
            </p>
          ) : null}
          {panorama.status === "ready" ? (
            <p className="font-mono text-[10px] leading-relaxed text-chrome-500">
              Mapped onto six faces &middot; {Math.round(panorama.durationMs / 1000)}s
            </p>
          ) : null}
          {panorama.status === "error" ? (
            <p className="font-mono text-[10px] leading-relaxed text-pink-300">
              {panorama.message}
            </p>
          ) : null}
        </div>

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

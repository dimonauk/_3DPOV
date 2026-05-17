"use client";

/**
 * app/atelier/cube-composer/cube-composer-client.tsx
 *
 * Orchestrator for the CubeComposer chamber. Owns the panorama
 * generation API call, the equirect Texture lifecycle, frame +
 * autoregressive-step playback state, and the face-status derivation;
 * delegates everything else.
 *
 * Geometry/shader/scene live in sibling files (scene.tsx,
 * frustum-gizmo.tsx, cube-shell.tsx, face-panel.tsx, shaders.ts,
 * types.ts); the two floating UI panels + Stat tile live in
 * panels.tsx. Per ARCHITECTURE.md Rule 1.
 *
 * No actual diffusion runs in the browser — the bench reference at
 * D:/The_Hangar/engines/CubeComposer/ does the real generation in
 * Python. This chamber explains the geometry + autoregressive order
 * and renders the resulting equirectangular panorama onto the cube.
 */

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClampToEdgeWrapping,
  LinearFilter,
  RepeatWrapping,
  type Texture,
  TextureLoader,
} from "three";

import { useAuth } from "components/auth/auth-provider";
import { createLogger } from "lib/log";
import { pushAtelierOutput, useActiveChamber } from "lib/state/atelier-hooks";

import {
  PanoramaGeneratorPanel,
  Stat,
  TrajectoryControlPanel,
} from "./panels";
import { Scene } from "./scene";
import {
  type CubeFace,
  FACE_LABELS,
  FACE_ORDER,
  NUM_FRAMES,
  type PanoramaState,
  TRAJECTORY_DEG,
  WINDOW_LENGTH,
} from "./types";

const log = createLogger("atelier:cube-composer");
const panoLog = createLogger("atelier:cube-composer:panorama");

export default function CubeComposerClient() {
  useActiveChamber("cube-composer");
  const { user } = useAuth();

  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [windowStart, setWindowStart] = useState(0);
  const [autoregressiveStep, setAutoregressiveStep] = useState(0);

  const [panorama, setPanorama] = useState<PanoramaState>({ status: "idle" });
  const [panoramaPrompt, setPanoramaPrompt] = useState("");
  const [equirectTexture, setEquirectTexture] = useState<Texture | null>(null);

  // Load the equirect URL into a three Texture as soon as it lands.
  // The wrap config makes the projection shader's `fract(u)` produce
  // a seamless wrap at the back face.
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
    panoLog.info("generate requested", { promptPreview: prompt.slice(0, 80) });
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
        throw new Error(data.error ?? `Bench returned HTTP ${res.status}.`);
      }
      const durationMs = data.durationMs ?? Date.now() - startedAt;
      setPanorama({ status: "ready", url: data.url, prompt, durationMs });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      pushAtelierOutput({
        chamberSlug: "cube-composer",
        kind: "image",
        label: `cube-composer-panorama-${stamp}.png`,
        blobUrl: data.url,
        mimeType: "image/png",
        sizeBytes: data.bytes ?? 0,
      });
      panoLog.info("generate done", { durationMs, bytes: data.bytes ?? 0 });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown generation error.";
      panoLog.error("generate failed", { err });
      setPanorama({ status: "error", message });
    }
  }, [panoramaPrompt, user]);

  // Each "temporal window" of WINDOW_LENGTH frames cycles through the
  // six faces in FACE_ORDER one at a time. Explanatory simplification
  // of the paper's pipeline — the real codebase generates one face
  // per window per pass over several windows; we collapse the timing
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
    const nextStep = Math.min(
      FACE_ORDER.length - 1,
      Math.floor((stepInWindow * FACE_ORDER.length) / WINDOW_LENGTH),
    );
    if (nextStep !== autoregressiveStep) {
      setAutoregressiveStep(nextStep);
    }
  }, [frame, windowStart, autoregressiveStep]);

  const faceStatus = useMemo<
    Record<CubeFace, "active" | "done" | "pending">
  >(() => {
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

        <PanoramaGeneratorPanel
          panorama={panorama}
          prompt={panoramaPrompt}
          onPromptChange={setPanoramaPrompt}
          onGenerate={onGeneratePanorama}
        />

        <TrajectoryControlPanel
          frame={frame}
          playing={playing}
          windowStart={windowStart}
          autoregressiveStep={autoregressiveStep}
          faceStatus={faceStatus}
          onScrub={onScrub}
          onTogglePlay={togglePlay}
          onReset={onReset}
        />
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

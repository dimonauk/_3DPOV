"use client";

/**
 * components/studio/EquirectViewer.tsx — three.js + R3F equirect / dual-fisheye
 * viewer.
 *
 * v0 capabilities:
 *   - Equirect image / video → inside-of-sphere projection, virtual camera
 *     driven by yaw/pitch/FOV.
 *   - Dual-fisheye (single side-by-side stream) — for v0 we feed the
 *     viewer the as-shot frame; the cubemap-style remapping shader lands
 *     when the v360 ffmpeg.wasm path is wired.
 *   - OSV / INSV — operator-triggered ffmpeg.wasm stitch (hstack + v360
 *     dfisheye). After the stitch lands we hot-swap the source to an
 *     equirect-video and continue with the normal viewer path.
 *   - Splat — separate `<SplatViewer>` path; placeholder for v0.
 *
 * Operator interactions:
 *   - Mouse drag — yaw / pitch
 *   - Mouse wheel — FOV (zoom)
 *   - The displayed keyframe is the one being edited; drags push back
 *     via `onKeyframeChange`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { createLogger } from "lib/log";
import type { Keyframe, SourceAsset } from "lib/studio/types";
import { useHoloFlowDesktop } from "lib/studio/desktop";

const log = createLogger("studio.EquirectViewer");

type Props = {
  source: SourceAsset;
  keyframes: Keyframe[];
  activeIndex: number;
  onKeyframeChange: (kf: Keyframe) => void;
  /**
   * Optional — when set, the viewer will call this with a new source
   * asset after an in-browser stitch finishes, so the parent can swap
   * the OSV/INSV source for the resulting equirect.
   */
  onSourceReplace?: (next: SourceAsset) => void;
};

export default function EquirectViewer(props: Props) {
  // For splat / unknown — punt to a placeholder for v0.
  if (props.source.kind === "splat") {
    return <PlaceholderPanel message={`Splat preview lands in M2. (${props.source.label})`} />;
  }
  if (props.source.kind === "osv-video" || props.source.kind === "insv-video") {
    return <StitchPanel source={props.source} onSourceReplace={props.onSourceReplace} />;
  }
  if (props.source.kind === "unknown") {
    return <PlaceholderPanel message={`Unknown format — ${props.source.label}`} />;
  }
  return <CanvasViewer {...props} />;
}

function CanvasViewer({ source, keyframes, activeIndex, onKeyframeChange }: Props) {
  return (
    <div className="relative h-full w-full">
      <Canvas
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        camera={{ position: [0, 0, 0.0001], fov: keyframes[activeIndex]?.fov ?? 75 }}
        className="bg-warm-black-950"
      >
        <Scene
          source={source}
          activeKeyframe={keyframes[activeIndex]!}
          onKeyframeChange={onKeyframeChange}
        />
      </Canvas>
      <ViewportHUD active={keyframes[activeIndex]!} />
    </div>
  );
}

function Scene({
  source,
  activeKeyframe,
  onKeyframeChange,
}: {
  source: SourceAsset;
  activeKeyframe: Keyframe;
  onKeyframeChange: (kf: Keyframe) => void;
}) {
  const { camera, gl } = useThree();
  const yawRef = useRef(activeKeyframe.yaw);
  const pitchRef = useRef(activeKeyframe.pitch);
  const fovRef = useRef(activeKeyframe.fov);

  // Push keyframe values into the imperative refs whenever the active
  // keyframe changes (e.g. the user picks a different keyframe).
  useEffect(() => {
    yawRef.current = activeKeyframe.yaw;
    pitchRef.current = activeKeyframe.pitch;
    fovRef.current = activeKeyframe.fov;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = activeKeyframe.fov;
      camera.updateProjectionMatrix();
    }
  }, [activeKeyframe, camera]);

  // Mouse drag → yaw / pitch.
  useEffect(() => {
    const canvas = gl.domElement;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      // Slow down rotation as FOV gets narrow — feels right with a telephoto crop.
      const sensitivity = (fovRef.current / 75) * 0.2;
      yawRef.current -= dx * sensitivity;
      pitchRef.current -= dy * sensitivity;
      pitchRef.current = Math.max(-89, Math.min(89, pitchRef.current));
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      canvas.releasePointerCapture(e.pointerId);
      // Commit the new view back into the active keyframe.
      onKeyframeChange({
        ...activeKeyframe,
        yaw: yawRef.current,
        pitch: pitchRef.current,
        fov: fovRef.current,
      });
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 2 : -2;
      fovRef.current = Math.max(20, Math.min(120, fovRef.current + delta));
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = fovRef.current;
        camera.updateProjectionMatrix();
      }
      onKeyframeChange({
        ...activeKeyframe,
        yaw: yawRef.current,
        pitch: pitchRef.current,
        fov: fovRef.current,
      });
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [activeKeyframe, camera, gl, onKeyframeChange]);

  // Apply yaw/pitch to the camera every frame.
  useFrame(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const yawR = THREE.MathUtils.degToRad(yawRef.current);
    const pitchR = THREE.MathUtils.degToRad(pitchRef.current);
    const dir = new THREE.Vector3(
      Math.cos(pitchR) * Math.sin(yawR),
      Math.sin(pitchR),
      -Math.cos(pitchR) * Math.cos(yawR),
    );
    camera.lookAt(dir);
  });

  return <EquirectSphere source={source} />;
}

function EquirectSphere({ source }: { source: SourceAsset }) {
  const texture = useEquirectTexture(source);
  const meshRef = useRef<THREE.Mesh>(null!);

  if (!texture) return null;

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 64, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} toneMapped={false} />
    </mesh>
  );
}

/**
 * Build a Three.js texture from the source. Stills use ImageTexture;
 * videos use VideoTexture (with a hidden <video> element).
 */
function useEquirectTexture(source: SourceAsset): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let mounted = true;
    let videoEl: HTMLVideoElement | null = null;

    if (source.kind === "equirect-image" || source.kind === "dual-fisheye-image") {
      const loader = new THREE.TextureLoader();
      loader.load(source.objectUrl, (t) => {
        if (!mounted) return;
        t.colorSpace = THREE.SRGBColorSpace;
        t.minFilter = THREE.LinearFilter;
        t.magFilter = THREE.LinearFilter;
        setTex(t);
      });
    } else if (
      source.kind === "equirect-video" ||
      source.kind === "dual-fisheye-video"
    ) {
      videoEl = document.createElement("video");
      videoEl.src = source.objectUrl;
      videoEl.crossOrigin = "anonymous";
      videoEl.muted = true;
      videoEl.loop = true;
      videoEl.playsInline = true;
      void videoEl.play();
      const t = new THREE.VideoTexture(videoEl);
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      setTex(t);
    }
    return () => {
      mounted = false;
      if (videoEl) {
        videoEl.pause();
        videoEl.src = "";
      }
    };
  }, [source]);

  return tex;
}

function ViewportHUD({ active }: { active: Keyframe }) {
  return (
    <div className="pointer-events-none absolute left-3 top-3 rounded-sm border border-warm-black-800 bg-warm-black-950/70 px-2 py-1 font-mono text-[10px] text-chrome-300 backdrop-blur">
      yaw {active.yaw.toFixed(1)}° · pitch {active.pitch.toFixed(1)}° · fov {active.fov.toFixed(0)}°
    </div>
  );
}

function PlaceholderPanel({ message }: { message: string }) {
  return (
    <div className="grid h-full place-items-center bg-warm-black-950 px-6 text-center">
      <div>
        <div className="chrome-label text-pink-200">NOT YET</div>
        <div className="mt-3 max-w-md text-sm text-chrome-200">{message}</div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// OSV / INSV stitch flow
// ───────────────────────────────────────────────────────────────────────

type StitchState =
  | { phase: "idle" }
  | { phase: "loading"; ratio: number; abort: AbortController }
  | { phase: "done"; blob: Blob }
  | { phase: "error"; message: string };

/**
 * Wraps the OSV/INSV ingest path. Surfaces:
 *
 *   - the in-browser ffmpeg.wasm stitch button (always available)
 *   - an alternative "use HoloFlow Desktop" handoff (when reachable),
 *     which is faster, sidesteps the WASM heap ceiling, and keeps the
 *     full-res source local to the operator's box.
 *
 * On stitch completion, the resulting equirect MP4 Blob is wrapped in a
 * fresh `equirect-video` SourceAsset and pushed back up through
 * `onSourceReplace` so the parent can re-render with the normal viewer.
 */
function StitchPanel({
  source,
  onSourceReplace,
}: {
  source: Extract<SourceAsset, { kind: "osv-video" | "insv-video" }>;
  onSourceReplace: ((next: SourceAsset) => void) | undefined;
}) {
  const [state, setState] = useState<StitchState>({ phase: "idle" });
  const desktop = useHoloFlowDesktop();

  const kindLabel = source.kind === "osv-video" ? "OSV" : "INSV";
  const lensFov = 200;
  const outWidth = 4096;

  // Estimate file size & duration for the warning UI.
  const fileMB = useMemo(() => source.raw.size / 1_000_000, [source.raw.size]);
  const duration = source.durationSeconds;
  const longClip = duration > 60;

  const onStitch = useCallback(async () => {
    const abort = new AbortController();
    setState({ phase: "loading", ratio: 0, abort });
    try {
      const mod = await import("lib/studio/stitch");
      const stitch =
        source.kind === "osv-video"
          ? mod.stitchOsvToEquirect
          : mod.stitchInsvToEquirect;
      const blob = await stitch(source.raw, {
        lensFov,
        outWidth,
        signal: abort.signal,
        onProgress: (ratio) => {
          setState((prev) =>
            prev.phase === "loading" ? { ...prev, ratio } : prev,
          );
        },
      });
      setState({ phase: "done", blob });

      // Promote the result to an equirect-video and ask the parent to swap.
      if (onSourceReplace) {
        const newUrl = URL.createObjectURL(blob);
        // The stitched output keeps the original duration. Width/height
        // come from `outWidth` (height is W/2).
        const stitchedFile = new File(
          [blob],
          source.label.replace(/\.(osv|insv)$/i, ".stitched.mp4"),
          { type: "video/mp4" },
        );
        const next: SourceAsset = {
          kind: "equirect-video",
          label: stitchedFile.name,
          objectUrl: newUrl,
          width: outWidth,
          height: Math.round(outWidth / 2),
          durationSeconds: duration,
          raw: stitchedFile,
        };
        onSourceReplace(next);
      }
    } catch (err) {
      if (abort.signal.aborted) {
        setState({ phase: "idle" });
        return;
      }
      const message =
        err instanceof Error ? err.message : "Unknown stitch error";
      setState({ phase: "error", message });
    }
  }, [source, duration, onSourceReplace]);

  const onCancel = useCallback(() => {
    if (state.phase === "loading") {
      state.abort.abort();
    }
  }, [state]);

  const onDesktopHandoff = useCallback(() => {
    // Stubbed for v0 — POST happens once the desktop /api/jobs schema
    // for the stitch job is finalised. The structure is wired so this
    // upgrade is a single-file change.
    log.info("desktop handoff requested", {
      sourceLabel: source.label,
      desktop,
      lensFov,
      outWidth,
    });
  }, [source, desktop]);

  const desktopAvailable = desktop.status === "available";

  return (
    <div className="grid h-full place-items-center bg-warm-black-950 px-6">
      <div className="w-full max-w-xl">
        <div className="chrome-label text-pink-200">{kindLabel} INGEST</div>
        <div className="mt-2 font-mono text-xs text-chrome-400">{source.label}</div>
        <div className="mt-1 font-mono text-[10px] text-chrome-500">
          {fileMB.toFixed(1)} MB · {duration > 0 ? `${duration.toFixed(1)} s` : "duration unknown"} ·
          {" "}two-stream dual fisheye · needs hstack + v360
        </div>

        {longClip && state.phase === "idle" && (
          <div className="mt-4 rounded-sm border border-amber-400/40 bg-amber-400/5 px-3 py-2 text-xs text-amber-200">
            This clip is over 60 s. In-browser stitch may run out of memory.
            {desktopAvailable
              ? " HoloFlow Desktop is reachable and recommended."
              : " Consider installing HoloFlow Desktop for clips this long."}
          </div>
        )}

        {state.phase === "idle" && (
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={onStitch}
              className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-2 text-sm text-pink-100 transition-colors hover:bg-pink-200/20"
            >
              Stitch via ffmpeg.wasm
            </button>
            <div className="text-[10px] text-chrome-500">
              Runs entirely in your browser. ~5–15× slower than native;
              uses up to ~800 MB of memory per 30 s of 8K source.
            </div>

            {desktopAvailable && (
              <button
                type="button"
                onClick={onDesktopHandoff}
                className="rounded-sm border border-green-400/40 bg-green-400/5 px-4 py-2 text-sm text-green-100 transition-colors hover:bg-green-400/15"
              >
                Use HoloFlow Desktop instead (faster, no in-browser memory limits)
              </button>
            )}
          </div>
        )}

        {state.phase === "loading" && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-chrome-300">
              <span>Stitching… {(state.ratio * 100).toFixed(0)}%</span>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-sm border border-warm-black-700 px-2 py-0.5 font-mono text-[10px] text-chrome-300 hover:border-pink-200/60"
              >
                cancel
              </button>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-warm-black-800">
              <div
                className="h-full bg-pink-200 transition-[width] duration-150"
                style={{ width: `${Math.max(2, state.ratio * 100)}%` }}
              />
            </div>
            <div className="mt-2 text-[10px] text-chrome-500">
              ffmpeg.wasm boot (~30 MB WASM) + hstack + v360 dfisheye → equirect MP4.
            </div>
          </div>
        )}

        {state.phase === "done" && (
          <div className="mt-6 rounded-sm border border-green-400/40 bg-green-400/5 px-3 py-2 text-xs text-green-200">
            Stitched {(state.blob.size / 1_000_000).toFixed(1)} MB equirect MP4 ready —
            loading into viewer…
          </div>
        )}

        {state.phase === "error" && (
          <div className="mt-6 rounded-sm border border-red-400/40 bg-red-400/5 px-3 py-2 text-xs text-red-200">
            Stitch failed: {state.message}
            <button
              type="button"
              onClick={() => setState({ phase: "idle" })}
              className="ml-3 underline"
            >
              try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

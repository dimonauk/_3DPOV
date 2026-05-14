"use client";

/**
 * app/spatial/video/spatial-video-demo-client.tsx — Client for the 2D→3D video demo.
 *
 * One-line role: per-frame depth + stereo pair + SBS-MP4 stitch over an uploaded
 * video, with progress reporting + a SHARP-video commission alternative.
 * Full purpose in spatial-video-demo-client.PURPOSE.md.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  probeDepthSupport,
  estimateDepth,
  type DepthSupport,
} from "lib/capabilities/viz/depth-estimation";
import { generateStereoPair } from "lib/capabilities/viz/stereo-pair";
import {
  probeSpatialFormats,
  startSpatialRecording,
  type SpatialRecordingHandle,
} from "lib/capabilities/viz/spatial-export";
import {
  isSharpVideoServiceAvailable,
  submitSharpVideoJob,
  type SharpVideoJobHandle,
  type SharpVideoJobStatus,
} from "lib/capabilities/commerce/sharp-video-job";

/** Sampling rate for the free in-browser path — keeps clip processing
 * tractable on phone hardware. 12fps is a perceptual floor for motion. */
const TARGET_FPS = 12;

/** Hard cap on free-path clip length — beyond this, gently steer the
 * visitor toward the SHARP commission. */
const MAX_FREE_DURATION_S = 8;

type Phase =
  | "idle"
  | "probing"
  | "ready"
  | "ready-no-support"
  | "loading-video"
  | "processing"
  | "done"
  | "commissioning"
  | "error";

type Progress = {
  framesDone: number;
  framesTotal: number;
  lastInferenceMs: number;
};

type Result = {
  blob: Blob;
  downloadUrl: string;
  durationSeconds: number;
  framesTotal: number;
};

export default function SpatialVideoDemoClient() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [depthSupport, setDepthSupport] = useState<DepthSupport | null>(null);
  const [videoSupport, setVideoSupport] = useState<{ sbsMp4: boolean } | null>(null);
  const [sharpAvailable, setSharpAvailable] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [sharpStatus, setSharpStatus] = useState<SharpVideoJobStatus | null>(null);

  const cancelRef = useRef<boolean>(false);
  const handleRef = useRef<SpatialRecordingHandle | null>(null);
  const sharpHandleRef = useRef<SharpVideoJobHandle | null>(null);

  // Feature-detect once on mount.
  useEffect(() => {
    let cancelled = false;
    setPhase("probing");
    (async () => {
      const [depth, spatial, sharp] = await Promise.all([
        probeDepthSupport(),
        Promise.resolve(probeSpatialFormats()),
        isSharpVideoServiceAvailable(),
      ]);
      if (cancelled) return;
      setDepthSupport(depth);
      setVideoSupport({ sbsMp4: spatial.sbsMp4 });
      setSharpAvailable(sharp.available);
      if (depth.recommended && spatial.sbsMp4) {
        setPhase("ready");
      } else {
        setPhase("ready-no-support");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Clean up object URLs when the result changes / unmounts.
  useEffect(() => {
    return () => {
      if (result?.downloadUrl) URL.revokeObjectURL(result.downloadUrl);
    };
  }, [result]);

  const onFile = useCallback(
    async (file: File) => {
      cancelRef.current = false;
      setError(null);
      setProgress(null);
      setResult(null);
      setPhase("loading-video");
      try {
        const blob = await processVideo(file, (p) => {
          if (cancelRef.current) throw new Error("cancelled");
          setProgress(p);
        }, handleRef);
        if (cancelRef.current) {
          setPhase("ready");
          return;
        }
        const downloadUrl = URL.createObjectURL(blob);
        setResult({
          blob,
          downloadUrl,
          durationSeconds: progress?.framesTotal
            ? progress.framesTotal / TARGET_FPS
            : 0,
          framesTotal: progress?.framesTotal ?? 0,
        });
        setPhase("done");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setPhase("error");
      }
    },
    [progress?.framesTotal],
  );

  const onCancel = useCallback(() => {
    cancelRef.current = true;
    handleRef.current?.cancel();
    handleRef.current = null;
  }, []);

  const onCommissionSharp = useCallback(async (file: File) => {
    setError(null);
    setSharpStatus(null);
    setPhase("commissioning");
    try {
      const handle = await submitSharpVideoJob({ videoBlob: file });
      sharpHandleRef.current = handle;
      // Poll until done; update status as it changes.
      const final = await handle.waitForCompletion(5000);
      setSharpStatus(final);
      if (final.state === "done") {
        setPhase("done");
      } else {
        setPhase("error");
        setError(final.state === "error" ? final.message : "commission cancelled");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("error");
    }
  }, []);

  // ---------- render ----------

  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-6">
      <FeatureBar
        depthSupport={depthSupport}
        videoSupport={videoSupport}
        sharpAvailable={sharpAvailable}
      />

      {phase === "ready" || phase === "idle" || phase === "probing" ? (
        <DropZone disabled={phase !== "ready"} onFile={onFile} />
      ) : null}

      {phase === "ready-no-support" ? (
        <NoSupportPanel
          depthSupport={depthSupport}
          videoSupport={videoSupport}
          sharpAvailable={sharpAvailable}
          onCommission={onCommissionSharp}
        />
      ) : null}

      {(phase === "loading-video" || phase === "processing") && progress ? (
        <ProcessingPanel progress={progress} onCancel={onCancel} />
      ) : null}

      {phase === "commissioning" ? (
        <CommissioningPanel status={sharpStatus} />
      ) : null}

      {phase === "done" && result ? (
        <ResultPanel
          result={result}
          sharpAvailable={sharpAvailable}
          onCommissionSharp={(file) => onCommissionSharp(file)}
          sharpStatus={sharpStatus}
        />
      ) : null}

      {phase === "error" && error ? <ErrorPanel message={error} /> : null}
    </div>
  );
}

// ─── Per-frame pipeline ──────────────────────────────────────────────────────

async function processVideo(
  file: File,
  onProgress: (p: Progress) => void,
  handleRef: React.MutableRefObject<SpatialRecordingHandle | null>,
): Promise<Blob> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = url;
  video.muted = true;
  video.preload = "auto";

  try {
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(
        () => reject(new Error("video metadata didn't load (5s)")),
        5000,
      );
      video.onloadedmetadata = () => {
        clearTimeout(t);
        resolve();
      };
      video.onerror = () => {
        clearTimeout(t);
        reject(new Error("video failed to load"));
      };
    });

    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("invalid video duration");
    }
    if (duration > MAX_FREE_DURATION_S) {
      throw new Error(
        `clip is ${duration.toFixed(1)}s — free in-browser path caps at ${MAX_FREE_DURATION_S}s. Use the SHARP commission for full-length conversions.`,
      );
    }

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w === 0 || h === 0) throw new Error("video has zero dimensions");

    const framesTotal = Math.max(1, Math.floor(duration * TARGET_FPS));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("2D context unavailable");

    const handle = await startSpatialRecording(w, h, {
      format: "sbs-mp4",
      fps: TARGET_FPS,
    });
    handleRef.current = handle;

    for (let i = 0; i < framesTotal; i++) {
      const t = i / TARGET_FPS;
      await seek(video, t);
      ctx.drawImage(video, 0, 0, w, h);
      const bitmap = await createImageBitmap(canvas);
      const t0 = performance.now();
      const depth = await estimateDepth(bitmap);
      const t1 = performance.now();
      const sourceImg = ctx.getImageData(0, 0, w, h);
      const pair = generateStereoPair(sourceImg, depth.depthMap);
      await handle.addFrame(pair, t);
      bitmap.close();
      onProgress({
        framesDone: i + 1,
        framesTotal,
        lastInferenceMs: t1 - t0,
      });
    }

    const blob = await handle.stop();
    handleRef.current = null;
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function seek(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };
    const onError = () => {
      video.removeEventListener("error", onError);
      reject(new Error(`seek to ${t.toFixed(2)}s failed`));
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.currentTime = t;
  });
}

// ─── Sub-panels ──────────────────────────────────────────────────────────────

function FeatureBar({
  depthSupport,
  videoSupport,
  sharpAvailable,
}: {
  depthSupport: DepthSupport | null;
  videoSupport: { sbsMp4: boolean } | null;
  sharpAvailable: boolean;
}) {
  if (!depthSupport || !videoSupport) {
    return (
      <div className="chrome-label text-chrome-400">
        probing browser features…
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-3 text-xs text-chrome-300">
      <Pill
        ok={depthSupport.recommended}
        label={`depth · ${depthSupport.recommendedBackend}`}
      />
      <Pill ok={videoSupport.sbsMp4} label="sbs-mp4 encode" />
      <Pill
        ok={sharpAvailable}
        label={sharpAvailable ? "SHARP video bench online" : "SHARP video bench offline"}
        secondary
      />
    </div>
  );
}

function Pill({
  ok,
  label,
  secondary,
}: {
  ok: boolean;
  label: string;
  secondary?: boolean;
}) {
  if (secondary) {
    return (
      <span
        className={`rounded-full border px-3 py-1 font-mono ${
          ok
            ? "border-pink-200/60 text-pink-200"
            : "border-warm-black-800 text-chrome-500"
        }`}
      >
        {ok ? "●" : "○"} {label}
      </span>
    );
  }
  return (
    <span
      className={`rounded-full border px-3 py-1 font-mono ${
        ok
          ? "border-mint-300/60 text-mint-200"
          : "border-rose-300/40 text-rose-200"
      }`}
    >
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

function DropZone({
  disabled,
  onFile,
}: {
  disabled: boolean;
  onFile: (f: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <div className="mt-6">
      <label
        className={`block cursor-pointer rounded-sm border border-dashed border-warm-black-700 bg-warm-black-950/60 p-8 text-center transition-colors hover:border-pink-200/60 ${
          disabled ? "cursor-not-allowed opacity-50" : ""
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
          className="sr-only"
        />
        <span className="chrome-label text-pink-200">drop a video</span>
        <span className="mt-2 block text-xs text-chrome-400">
          mp4 / mov / webm · ≤ {MAX_FREE_DURATION_S}s for the free path
        </span>
      </label>
    </div>
  );
}

function ProcessingPanel({
  progress,
  onCancel,
}: {
  progress: Progress;
  onCancel: () => void;
}) {
  const pct = progress.framesTotal
    ? Math.round((progress.framesDone / progress.framesTotal) * 100)
    : 0;
  return (
    <div className="mt-6 rounded-sm border border-warm-black-800 bg-warm-black-950/50 p-5 font-mono text-sm">
      <div className="flex justify-between text-chrome-200">
        <span>
          frame {progress.framesDone} / {progress.framesTotal}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-warm-black-900">
        <div
          className="h-full bg-pink-200"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-3 text-xs text-chrome-400">
        last depth inference: {progress.lastInferenceMs.toFixed(0)} ms
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="mt-4 rounded-sm border border-warm-black-700 px-3 py-1 chrome-label text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
      >
        cancel
      </button>
    </div>
  );
}

function ResultPanel({
  result,
  sharpAvailable,
  onCommissionSharp: _onCommissionSharp,
  sharpStatus: _sharpStatus,
}: {
  result: Result;
  sharpAvailable: boolean;
  onCommissionSharp: (file: File) => void;
  sharpStatus: SharpVideoJobStatus | null;
}) {
  return (
    <div className="mt-6 flex flex-col gap-4">
      <video
        src={result.downloadUrl}
        controls
        playsInline
        className="aspect-video w-full rounded-sm border border-warm-black-800 bg-warm-black-950"
      />
      <div className="font-mono text-xs text-chrome-300">
        {result.framesTotal} frames · {result.durationSeconds.toFixed(1)}s ·{" "}
        side-by-side MP4 · {(result.blob.size / 1024).toFixed(0)} KB
      </div>
      <div className="flex flex-wrap gap-3">
        <a
          href={result.downloadUrl}
          download={`holoflow-spatial-video-${Date.now()}.mp4`}
          className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-2 chrome-label text-pink-100 hover:bg-pink-200/20"
        >
          download SBS-MP4
        </a>
        {sharpAvailable ? (
          <span className="rounded-sm border border-warm-black-700 px-5 py-2 chrome-label text-chrome-300">
            commission SHARP video (full-length editioned path) — drop the
            same clip again to start
          </span>
        ) : (
          <span className="rounded-sm border border-warm-black-800 px-5 py-2 chrome-label text-chrome-500">
            SHARP-video bench offline
          </span>
        )}
      </div>
    </div>
  );
}

function CommissioningPanel({
  status,
}: {
  status: SharpVideoJobStatus | null;
}) {
  return (
    <div className="mt-6 rounded-sm border border-pink-200/30 bg-warm-black-950/50 p-5 font-mono text-sm">
      <div className="chrome-label text-pink-200">
        commissioning · SHARP video bench
      </div>
      <div className="mt-3 text-chrome-200">
        {!status && "submitting to the studio's 3080 Ti…"}
        {status?.state === "queued" &&
          `queued · position ${status.positionInQueue}`}
        {status?.state === "decoding" &&
          `decoding video · ${status.progressPct.toFixed(0)}%`}
        {status?.state === "running" &&
          `running · frame ${status.framesDone} / ${status.framesTotal} · stage ${status.currentFrameStage}`}
        {status?.state === "cancelled" && "cancelled"}
      </div>
    </div>
  );
}

function NoSupportPanel({
  depthSupport,
  videoSupport,
  sharpAvailable,
  onCommission,
}: {
  depthSupport: DepthSupport | null;
  videoSupport: { sbsMp4: boolean } | null;
  sharpAvailable: boolean;
  onCommission: (file: File) => void;
}) {
  const reason = useMemo(() => {
    if (!depthSupport?.recommended) return depthSupport?.reason ?? "depth estimation isn't supported in this browser";
    if (!videoSupport?.sbsMp4) return "MP4 encoding isn't supported in this browser";
    return "browser features missing";
  }, [depthSupport, videoSupport]);

  return (
    <div className="mt-6 rounded-sm border border-warm-black-800 bg-warm-black-950/50 p-5 text-sm text-chrome-300">
      <div className="chrome-label text-rose-200">free path unavailable</div>
      <p className="mt-2">
        {reason}. The free in-browser path needs WebGPU or a recent
        WebGL2 + Safari 26+ / Chrome 113+ for hardware-accelerated H.264
        encoding via WebCodecs.
      </p>
      {sharpAvailable ? (
        <>
          <p className="mt-3">
            The studio&rsquo;s SHARP video bench is online — drop a clip to
            commission a full-length editioned conversion on the 3080 Ti.
          </p>
          <DropZone disabled={false} onFile={onCommission} />
        </>
      ) : (
        <p className="mt-3">
          The SHARP video bench is also offline. Come back when the
          studio&rsquo;s on the bench, or try this page from a phone with
          WebGPU support.
        </p>
      )}
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="mt-6 rounded-sm border border-rose-300/40 bg-warm-black-950/50 p-5 text-sm text-rose-200">
      <div className="chrome-label">conversion failed</div>
      <p className="mt-2 font-mono">{message}</p>
    </div>
  );
}

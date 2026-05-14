"use client";

/**
 * app/spatial/video/spatial-video-panels.tsx — UI sub-panels for the
 * /spatial/video client. FeatureBar, Pill, DropZone, ProcessingPanel,
 * ResultPanel, CommissioningPanel, NoSupportPanel, ErrorPanel —
 * presentational only; state + lifecycle lives in the parent.
 */

import { useMemo, useRef } from "react";

import type { DepthSupport } from "lib/capabilities/viz/depth-estimation";
import type { SharpVideoJobStatus } from "lib/capabilities/commerce/sharp-video-job";

import {
  MAX_FREE_DURATION_S,
  type Progress,
  type Result,
} from "./spatial-video-pipeline";

export function FeatureBar({
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
        label={
          sharpAvailable
            ? "SHARP video bench online"
            : "SHARP video bench offline"
        }
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

export function DropZone({
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

export function ProcessingPanel({
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
        <div className="h-full bg-pink-200" style={{ width: `${pct}%` }} />
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

export function ResultPanel({
  result,
  sharpAvailable,
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
        {result.framesTotal} frames · {result.durationSeconds.toFixed(1)}s ·
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

export function CommissioningPanel({
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

export function NoSupportPanel({
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
    if (!depthSupport?.recommended)
      return (
        depthSupport?.reason ??
        "depth estimation isn't supported in this browser"
      );
    if (!videoSupport?.sbsMp4)
      return "MP4 encoding isn't supported in this browser";
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

export function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="mt-6 rounded-sm border border-rose-300/40 bg-warm-black-950/50 p-5 text-sm text-rose-200">
      <div className="chrome-label">conversion failed</div>
      <p className="mt-2 font-mono">{message}</p>
    </div>
  );
}

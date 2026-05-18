"use client";

/**
 * app/atelier/veo/veo/result-panels.tsx — Running state (elapsed
 * ticker + ETA + job id), error state (with no_key + studio_capped
 * branches), ready state (autoplaying video grid + downloads).
 *
 * Extracted from veo-client.tsx per ARCHITECTURE.md Rule 1.
 */

import { type OutputState, POLL_INTERVAL_MS } from "./types";

export function ResultPanels({
  output,
  elapsedSec,
  onOpenSettings,
  onDownload,
}: {
  output: OutputState;
  elapsedSec: number;
  onOpenSettings: () => void;
  onDownload: (dataUrl: string, mimeType: string, i: number) => void;
}) {
  if (output.kind === "idle") return null;

  if (output.kind === "running") {
    return (
      <section className="rounded-sm border border-pink-200/40 bg-pink-900/10 px-4 py-4 text-sm text-chrome-200">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-pink-200">
          Job in flight &middot; {elapsedSec}s elapsed &middot; ETA ~
          {output.etaSeconds}s
        </p>
        <p className="mt-2 text-chrome-300">
          Veo is rendering. Don&rsquo;t close the tab. Most jobs return in
          60&ndash;120 seconds; complex prompts can take longer. The
          chamber polls every {POLL_INTERVAL_MS / 1000}s and will surface
          the clip the moment it&rsquo;s ready.
        </p>
        <p className="mt-2 break-all font-mono text-[0.6rem] text-chrome-500">
          job: {output.jobId}
        </p>
      </section>
    );
  }

  if (output.kind === "error") {
    return (
      <section className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-sm text-pink-100">
        <p>{output.message}</p>
        {output.code === "no_key" ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="mt-3 rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-pink-200 hover:bg-pink-200/20"
          >
            Open settings
          </button>
        ) : null}
        {output.code === "studio_capped" ? (
          <p className="mt-2 text-xs text-pink-200/80">
            Cap resets in roughly{" "}
            {output.retryAfterSec
              ? `${Math.ceil(output.retryAfterSec / 60)} min`
              : "an hour"}
            . Or open settings and paste your own AI Studio key for
            unbounded use.
          </p>
        ) : null}
      </section>
    );
  }

  // ready
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="chrome-label text-chrome-400">
          Ready &middot; {output.videos.length} clip
          {output.videos.length === 1 ? "" : "s"} &middot;{" "}
          {(output.durationMs / 1000).toFixed(1)}s wall-clock
        </span>
      </div>
      <div
        className={`grid gap-4 ${
          output.videos.length === 1
            ? "grid-cols-1"
            : "grid-cols-1 sm:grid-cols-2"
        }`}
      >
        {output.videos.map((v, i) => (
          <figure
            key={`${v.mimeType}-${i}`}
            className="flex flex-col gap-2 rounded-sm border border-warm-black-700 bg-warm-black-950 p-2"
          >
            <video
              src={v.dataUrl}
              controls
              autoPlay
              loop
              playsInline
              className="w-full rounded-sm bg-warm-black-950"
            />
            <figcaption className="flex flex-wrap items-center justify-between gap-2 px-1">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-chrome-500">
                {v.mimeType}
              </span>
              <button
                type="button"
                onClick={() => onDownload(v.dataUrl, v.mimeType, i)}
                className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-pink-200 hover:bg-pink-200/20"
              >
                Download
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="text-xs text-chrome-500">
        The clip is dropped into the recent-outputs drawer at the
        bottom-right of the page.
      </p>
    </section>
  );
}

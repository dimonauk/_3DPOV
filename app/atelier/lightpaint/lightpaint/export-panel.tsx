"use client";

/**
 * app/atelier/lightpaint/lightpaint/export-panel.tsx — MP4 export
 * section: encode button, status copy for each ExportState branch,
 * download tile when ready.
 *
 * Extracted from lightpaint-client.tsx per ARCHITECTURE.md Rule 1.
 */

import type { ExportState } from "./types";

export function ExportPanel({
  exportState,
  frameCount,
  fps,
  onExport,
  onDownload,
}: {
  exportState: ExportState;
  frameCount: number;
  fps: number;
  onExport: () => void;
  onDownload: () => void;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="chrome-label text-chrome-400">Export</span>
        <button
          type="button"
          onClick={onExport}
          disabled={exportState.kind === "running"}
          className="rounded-sm border border-pink-200/60 bg-pink-900/40 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
        >
          {exportState.kind === "running"
            ? `Encoding ${Math.round(exportState.progress * 100)}%`
            : "→ Encode MP4"}
        </button>
      </div>
      {exportState.kind === "idle" ? (
        <p className="text-xs leading-relaxed text-chrome-400">
          MP4 export at the chosen FPS via WebCodecs (H.264). Runs entirely
          in the browser; no upload. Output dimensions match the first
          frame.
        </p>
      ) : null}
      {exportState.kind === "running" ? (
        <p className="text-xs leading-relaxed text-chrome-300">
          Encoding {frameCount} frames at {fps} fps&hellip;
        </p>
      ) : null}
      {exportState.kind === "error" ? (
        <p className="text-xs leading-relaxed text-pink-200">
          {exportState.message}
        </p>
      ) : null}
      {exportState.kind === "ready" ? (
        <div className="flex flex-wrap items-center gap-3 rounded-sm border border-emerald-400/30 bg-emerald-900/10 px-4 py-3">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-emerald-200">
            Ready &middot; {exportState.sizeMb.toFixed(1)} MB
          </span>
          <button
            type="button"
            onClick={onDownload}
            className="rounded-sm border border-emerald-300/60 bg-emerald-300/10 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-emerald-100 hover:bg-emerald-300/20"
          >
            Download .mp4
          </button>
        </div>
      ) : null}
    </section>
  );
}

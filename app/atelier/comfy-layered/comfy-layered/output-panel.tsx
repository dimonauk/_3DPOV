"use client";

/**
 * app/atelier/comfy-layered/comfy-layered/output-panel.tsx — Run /
 * cancel button, queue-progress meter, error strip, output image
 * preview, download button.
 *
 * Extracted from comfy-layered-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import type { RunState } from "./types";

export function OutputPanel({
  run,
  prompt,
  progress,
  currentStep,
  previewImages,
  onRun,
  onCancel,
  onDownload,
}: {
  run: RunState;
  prompt: string;
  progress: number;
  currentStep: string;
  previewImages: string[];
  onRun: () => void;
  onCancel: () => void;
  onDownload: () => void;
}) {
  return (
    <>
      {/* Run / cancel */}
      <section className="flex flex-col gap-3">
        <button
          type="button"
          onClick={run.kind === "running" ? onCancel : onRun}
          disabled={run.kind !== "running" && !prompt.trim()}
          className={
            run.kind === "running"
              ? "self-start rounded-sm border border-pink-400/60 bg-pink-900/30 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-200 hover:bg-pink-900/50"
              : "self-start rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-50"
          }
        >
          {run.kind === "running" ? "Cancel queue" : "→ Run workflow"}
        </button>

        {run.kind === "running" ? (
          <div className="flex flex-col gap-2 rounded-sm border border-warm-black-700 bg-warm-black-950 px-4 py-3">
            <div className="flex justify-between font-mono text-xs text-chrome-300">
              <span>queue progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-warm-black-800">
              <div
                className="h-full bg-pink-200 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {currentStep ? (
              <p className="font-mono text-[10px] text-chrome-500">
                {currentStep}
              </p>
            ) : null}
          </div>
        ) : null}

        {run.kind === "error" ? (
          <p className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-xs text-pink-200">
            {run.message}
          </p>
        ) : null}
      </section>

      {/* Output */}
      <section className="flex flex-col gap-3">
        <span className="chrome-label text-chrome-400">Output</span>
        <div className="relative aspect-square overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
          {run.kind === "done" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={run.imageUrl}
              alt="generated"
              className="h-full w-full object-contain"
            />
          ) : previewImages.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewImages[previewImages.length - 1]}
              alt="preview"
              className="h-full w-full object-contain opacity-80"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-chrome-500">
              <span className="font-mono text-xs uppercase tracking-[0.2em]">
                no image yet
              </span>
            </div>
          )}
        </div>
        {run.kind === "done" ? (
          <button
            type="button"
            onClick={onDownload}
            className="self-start rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-pink-200 hover:bg-pink-200/20"
          >
            Download image
          </button>
        ) : null}
      </section>
    </>
  );
}

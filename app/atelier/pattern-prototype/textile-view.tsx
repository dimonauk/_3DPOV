"use client";

/**
 * app/atelier/pattern-prototype/textile-view.tsx — Second creation
 * mode for the chamber. Visitor types a textile/fabric prompt; the
 * page POSTs to `/api/atelier/pattern-prototype/generate-textile`
 * which calls `viz.generate-comfyui` with the `flux1-dev-fp8`
 * workflow on the studio bench; the resulting raster comes back as
 * a Vercel-Blob URL and we render it as both a wall-art preview
 * (full-bleed) and a tile preview (CSS `background-size: 25%`) so
 * the visitor sees how the pattern repeats across a surface.
 *
 * Extracted from pattern-prototype-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import { Icon, ICON_SPARKLES } from "./icons";
import type { TextileState } from "./types";

export function TextileView({
  prompt,
  setPrompt,
  textile,
  onGenerate,
  hasUser,
}: {
  prompt: string;
  setPrompt: (s: string) => void;
  textile: TextileState;
  onGenerate: () => void;
  hasUser: boolean;
}) {
  const isLoading = textile.kind === "loading";
  const buttonLabel = isLoading ? "generating…" : "Generate textile";

  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left column: prompt + wall-art preview */}
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-chrome-400">
            Textile prompt
          </span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. tessellated honeycomb in copper and ink"
            rows={3}
            className="w-full rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2 font-mono text-xs text-chrome-100 placeholder:text-chrome-500 focus:border-pink-200 focus:outline-none"
          />
        </label>

        {hasUser ? null : (
          <p className="rounded-sm border border-warm-black-700 bg-warm-black-900/50 px-3 py-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
            sign in as an operator to generate on the bench.
          </p>
        )}

        <button
          type="button"
          onClick={onGenerate}
          disabled={isLoading || !prompt.trim()}
          className="flex items-center justify-center gap-2 rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-pink-200 transition-colors hover:border-pink-200 hover:bg-pink-200/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon d={ICON_SPARKLES} size={12} />
          {buttonLabel}
        </button>

        {textile.kind === "loading" ? (
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400">
            generating on the bench… ~10-30s
          </p>
        ) : null}

        {textile.kind === "error" ? (
          <p className="rounded-sm border border-pink-400/50 bg-pink-900/20 px-3 py-2 font-mono text-[0.7rem] text-pink-200">
            {textile.message}
          </p>
        ) : null}

        <div className="flex flex-1 flex-col gap-1.5">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-chrome-400">
            Wall-art preview
          </span>
          <div className="relative flex min-h-[280px] flex-1 items-center justify-center overflow-hidden rounded-sm border border-warm-black-700 bg-warm-black-900">
            {textile.kind === "ready" ? (
              // The bench-hosted URL is intentionally rendered as a raw
              // <img>; we don't need next/image's optimizer for a
              // generated artefact and `unoptimized` would still go
              // through the loader.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={textile.url}
                alt={textile.prompt}
                className="max-h-[420px] w-full object-contain"
              />
            ) : (
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-500">
                {textile.kind === "loading"
                  ? "waiting on bench…"
                  : "no textile yet."}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right column: tile preview */}
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-chrome-400">
          Tile preview
        </span>
        <div
          className="min-h-[420px] flex-1 rounded-sm border border-warm-black-700 bg-warm-black-900"
          style={
            textile.kind === "ready"
              ? {
                  backgroundImage: `url(${textile.url})`,
                  backgroundSize: "25%",
                  backgroundRepeat: "repeat",
                }
              : undefined
          }
          aria-label="tile preview"
        >
          {textile.kind === "ready" ? null : (
            <div className="flex h-full items-center justify-center">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-500">
                tile preview appears here.
              </span>
            </div>
          )}
        </div>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-chrome-500">
          this is how it repeats
        </span>
        {textile.kind === "ready" ? (
          <div className="mt-2 flex flex-wrap gap-3 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-chrome-500">
            <span>{(textile.bytes / 1024).toFixed(0)} kB</span>
            <span>{(textile.durationMs / 1000).toFixed(1)} s</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

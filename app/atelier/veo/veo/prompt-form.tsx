"use client";

/**
 * app/atelier/veo/veo/prompt-form.tsx — Prompt textarea + advanced
 * (negative prompt, audio toggle, prompt-enhance toggle) + aspect/
 * duration selects + Generate button.
 *
 * Extracted from veo-client.tsx per ARCHITECTURE.md Rule 1.
 */

import { useId } from "react";

import type { AspectRatio, OutputState } from "./types";

export function PromptForm({
  prompt,
  setPrompt,
  negativePrompt,
  setNegativePrompt,
  showAdvanced,
  setShowAdvanced,
  aspectRatio,
  setAspectRatio,
  durationSeconds,
  setDurationSeconds,
  generateAudio,
  setGenerateAudio,
  enhancePrompt,
  setEnhancePrompt,
  output,
  onGenerate,
}: {
  prompt: string;
  setPrompt: (s: string) => void;
  negativePrompt: string;
  setNegativePrompt: (s: string) => void;
  showAdvanced: boolean;
  setShowAdvanced: (v: boolean | ((v: boolean) => boolean)) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (a: AspectRatio) => void;
  durationSeconds: number;
  setDurationSeconds: (n: number) => void;
  generateAudio: boolean;
  setGenerateAudio: (v: boolean) => void;
  enhancePrompt: boolean;
  setEnhancePrompt: (v: boolean) => void;
  output: OutputState;
  onGenerate: () => void;
}) {
  const promptFieldId = useId();
  const negativeFieldId = useId();
  return (
    <section className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5" htmlFor={promptFieldId}>
        <span className="chrome-label text-chrome-400">Prompt</span>
        <textarea
          id={promptFieldId}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A pewter cuttlefish ring rotating on a turntable, museum lighting, macro lens. The light catches the metal as it turns."
          rows={4}
          className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
        />
      </label>

      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="self-start font-mono text-[0.65rem] uppercase tracking-[0.18em] text-chrome-400 hover:text-pink-200"
      >
        {showAdvanced ? "Hide" : "Show"} advanced &middot; negative prompt
        &middot; audio &middot; prompt-enhance
      </button>

      {showAdvanced ? (
        <div className="flex flex-col gap-4 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-4">
          <label className="flex flex-col gap-1.5" htmlFor={negativeFieldId}>
            <span className="chrome-label text-chrome-400">
              Negative prompt (what to avoid)
            </span>
            <textarea
              id={negativeFieldId}
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="text, watermark, low quality, motion blur"
              rows={2}
              className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-chrome-200">
            <input
              type="checkbox"
              checked={generateAudio}
              onChange={(e) => setGenerateAudio(e.target.checked)}
              className="accent-pink-200"
            />
            Generate native audio (ambient + foley)
          </label>
          <label className="flex items-center gap-2 text-sm text-chrome-200">
            <input
              type="checkbox"
              checked={enhancePrompt}
              onChange={(e) => setEnhancePrompt(e.target.checked)}
              className="accent-pink-200"
            />
            Let Veo rewrite the prompt for better results
          </label>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="chrome-label text-chrome-400">Aspect ratio</span>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          >
            <option value="16:9">16:9 &middot; landscape</option>
            <option value="9:16">9:16 &middot; portrait</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="chrome-label text-chrome-400">
            Duration (seconds)
          </span>
          <select
            value={durationSeconds}
            onChange={(e) => setDurationSeconds(Number(e.target.value))}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          >
            <option value={4}>4 s</option>
            <option value={5}>5 s</option>
            <option value={6}>6 s</option>
            <option value={7}>7 s</option>
            <option value={8}>8 s</option>
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={output.kind === "running"}
        className="self-start rounded-sm border border-pink-200/60 bg-pink-900/40 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
      >
        {output.kind === "running" ? "Cooking…" : "→ Generate"}
      </button>
    </section>
  );
}

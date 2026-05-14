"use client";

/**
 * components/play/scenes/module-scene-overlays.tsx — Presentational pieces
 * for the Module level. PromptCard, BrushPicker, FloorReference (R3F),
 * PassPanel, FailPanel. State + lifecycle lives in the parent.
 */

import { BRUSH_NAME_TINT, type Brush, type BrushSlug } from "./module-scene-brushes";
import type { Prompt } from "./module-scene-prompts";

export function FloorReference() {
  return (
    <gridHelper
      args={[10, 20, "#1a1530", "#13101e"]}
      position={[0, -1.2, 0]}
    />
  );
}

export function PromptCard({ prompt }: { prompt: Prompt }) {
  return (
    <div className="mb-5 rounded-sm border border-pink-200/30 bg-pink-200/[0.04] p-4">
      <div className="chrome-label mb-1 text-chrome-500">Prompt</div>
      <p className="text-lg text-chrome-100">{prompt.text}</p>
      <p className="mt-2 max-w-prose text-xs text-chrome-400">
        Pick the module that fits the prompt before you swing. That choice
        is the gesture &mdash; the drawing is its echo.
      </p>
    </div>
  );
}

export function BrushPicker({
  brushes,
  selected,
  onSelect,
}: {
  brushes: Brush[];
  selected: BrushSlug;
  onSelect: (slug: BrushSlug) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {brushes.map((b) => {
        const isActive = b.slug === selected;
        return (
          <button
            key={b.slug}
            type="button"
            onClick={() => onSelect(b.slug)}
            className={
              isActive
                ? "rounded-sm border border-pink-200/60 bg-pink-200/5 p-4 text-left transition-colors"
                : "rounded-sm border border-warm-black-700 bg-warm-black-900/60 p-4 text-left transition-colors hover:border-pink-200/40"
            }
          >
            <div className="chrome-label text-chrome-500">
              {isActive ? "Selected" : "Module"}
            </div>
            <div
              className={
                isActive
                  ? `mt-1 text-lg ${BRUSH_NAME_TINT[b.slug]}`
                  : "mt-1 text-lg text-chrome-300"
              }
            >
              {b.name}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-chrome-400">
              {b.blurb}
            </p>
          </button>
        );
      })}
    </div>
  );
}

export function PassPanel({
  brush,
  prompt,
  onReroll,
}: {
  brush: Brush;
  prompt: Prompt;
  onReroll: () => void;
}) {
  return (
    <div className="mt-5 rounded-sm border border-pink-200/60 bg-pink-200/[0.06] p-5">
      <div className="chrome-label mb-2 text-pink-200">
        Pass &middot; the module fits
      </div>
      <p className="text-sm text-chrome-200">
        {prompt.reason} The module choice is the gesture. The trail is its
        echo.
      </p>
      <p className="mt-3 text-xs text-chrome-400">
        Saved your module choice. The Trail level will draw with the{" "}
        {brush.name.toLowerCase()} when you arrive.
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={onReroll}
          className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 text-[0.6rem] text-chrome-300 hover:text-pink-200"
        >
          New prompt
        </button>
      </div>
    </div>
  );
}

export function FailPanel({
  chose,
  prompt,
  onClear,
  onReroll,
}: {
  chose: Brush;
  prompt: Prompt;
  onClear: () => void;
  onReroll: () => void;
}) {
  return (
    <div className="mt-5 rounded-sm border border-warm-black-700 bg-warm-black-900/60 p-5">
      <div className="chrome-label mb-2 text-chrome-300">
        Try again &middot; wrong tool
      </div>
      <p className="text-sm text-chrome-200">{prompt.reason}</p>
      <p className="mt-3 text-xs text-chrome-400">
        You chose {chose.name.toLowerCase()}. The level cannot pass without
        the right module &mdash; that is the modular-first thesis.
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={onClear}
          className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 text-[0.6rem] text-chrome-300 hover:text-pink-200"
        >
          Clear the trail
        </button>
        <button
          type="button"
          onClick={onReroll}
          className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 text-[0.6rem] text-chrome-300 hover:text-pink-200"
        >
          New prompt
        </button>
      </div>
    </div>
  );
}

"use client";

/**
 * app/atelier/procedural-city/controls.tsx
 *
 * Pure presentational controls. The orchestrator passes state and
 * onChange handlers; this file holds no scene logic. Styled to match
 * app/atelier/poi-sculptor/controls.tsx — chrome / warm-black / pink-200.
 */

import type { LayoutMode } from "lib/procedural-city/palette";
import { LAYOUT_PRESETS } from "lib/procedural-city/palette";

export type CityControlsState = {
  layout: LayoutMode;
  size: number;
  seed: number;
  traffic: number;
  speed: number;
};

export type CityControlsHandlers = {
  onLayout: (id: LayoutMode) => void;
  onSize: (v: number) => void;
  onTraffic: (v: number) => void;
  onSpeed: (v: number) => void;
  onReseed: () => void;
};

export function CityControls({
  state,
  handlers,
}: {
  state: CityControlsState;
  handlers: CityControlsHandlers;
}) {
  return (
    <div className="space-y-6 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5">
      <div>
        <div className="chrome-label text-chrome-300">layout · 3 morphologies</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {LAYOUT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlers.onLayout(p.id)}
              className={`rounded-sm border px-3 py-1 font-mono text-xs ${
                state.layout === p.id
                  ? "border-pink-200 text-pink-100"
                  : "border-warm-black-700 text-chrome-300 hover:border-pink-200/40"
              }`}
              aria-pressed={state.layout === p.id}
              title={p.description}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="mt-2 font-mono text-[0.65rem] text-chrome-500">
          {LAYOUT_PRESETS.find((p) => p.id === state.layout)?.description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Slider
          label="grid size"
          value={state.size}
          min={16}
          max={64}
          step={2}
          format={(v) => `${v}`}
          onChange={handlers.onSize}
        />
        <Slider
          label="traffic"
          value={state.traffic}
          min={0}
          max={0.4}
          step={0.01}
          format={(v) => v.toFixed(2)}
          onChange={handlers.onTraffic}
        />
        <Slider
          label="speed"
          value={state.speed}
          min={0}
          max={3}
          step={0.05}
          format={(v) => v.toFixed(2)}
          onChange={handlers.onSpeed}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handlers.onReseed}
          className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-2 chrome-label text-pink-100 hover:bg-pink-200/20"
        >
          re-roll skyline
        </button>
        <span className="font-mono text-[0.65rem] text-chrome-500">
          seed: {state.seed}
        </span>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="chrome-label text-chrome-300">
        {label}: <span className="text-pink-200">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="mt-2 w-full accent-pink-300"
      />
    </label>
  );
}

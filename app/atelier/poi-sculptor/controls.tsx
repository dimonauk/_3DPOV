"use client";

/**
 * app/atelier/poi-sculptor/controls.tsx
 *
 * Pure presentational controls. The orchestrator (poi-sculptor-client)
 * passes current state and onChange handlers. Holds no scene logic.
 */

import { ANCHOR_PATHS } from "lib/poi-sculptor/anchor-paths";
import type { TrailMaterial } from "lib/poi-sculptor/materials";
import { TRAIL_MATERIALS } from "lib/poi-sculptor/materials";
import { MOVES } from "lib/poi-sculptor/moves";

export type ControlsState = {
  move: string;
  materialIdx: number;
  anchorPath: string;
  anchorSpeed: number;
  heat: number;
  rim: number;
  pulse: number;
  thick: number;
  curl: number;
  bloom: boolean;
  film: boolean;
};

export type ControlsHandlers = {
  onMove: (id: string) => void;
  onMaterial: (idx: number) => void;
  onAnchorPath: (id: string) => void;
  onAnchorSpeed: (v: number) => void;
  onUniform: (key: "heat" | "rim" | "pulse" | "thick" | "curl", v: number) => void;
  onFx: (key: "bloom" | "film", v: boolean) => void;
};

export function Controls({
  state,
  handlers,
  disabled,
}: {
  state: ControlsState;
  handlers: ControlsHandlers;
  disabled: boolean;
}) {
  return (
    <div className="space-y-6 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5">
      <div>
        <div className="chrome-label text-chrome-300">flow library · 21 moves</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {MOVES.map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={disabled}
              onClick={() => handlers.onMove(m.id)}
              className={`rounded-sm border px-2 py-1 font-mono text-xs ${
                state.move === m.id
                  ? "border-pink-200 text-pink-100"
                  : "border-warm-black-700 text-chrome-300 hover:border-pink-200/40"
              } disabled:opacity-40`}
              aria-pressed={state.move === m.id}
            >
              {m.label}
              <span className="ml-1 text-chrome-500">·{m.diff}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="chrome-label text-chrome-300">surface palette</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {TRAIL_MATERIALS.map((m: TrailMaterial, i) => (
            <button
              key={m.id}
              type="button"
              disabled={disabled}
              onClick={() => handlers.onMaterial(i)}
              className={`flex items-center gap-2 rounded-sm border px-3 py-1 font-mono text-xs ${
                state.materialIdx === i
                  ? "border-pink-200 text-pink-100"
                  : "border-warm-black-700 text-chrome-300 hover:border-pink-200/40"
              } disabled:opacity-40`}
              aria-pressed={state.materialIdx === i}
            >
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: m.dot }}
              />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="chrome-label text-chrome-300">anchor path</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {ANCHOR_PATHS.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={disabled}
              onClick={() => handlers.onAnchorPath(p.id)}
              className={`rounded-sm border px-3 py-1 font-mono text-xs ${
                state.anchorPath === p.id
                  ? "border-pink-200 text-pink-100"
                  : "border-warm-black-700 text-chrome-300 hover:border-pink-200/40"
              } disabled:opacity-40`}
              aria-pressed={state.anchorPath === p.id}
            >
              {p.label}
            </button>
          ))}
        </div>
        <label className="mt-3 block">
          <span className="chrome-label text-chrome-300">
            speed: <span className="text-pink-200">{state.anchorSpeed.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={state.anchorSpeed}
            disabled={disabled}
            onChange={(e) => handlers.onAnchorSpeed(Number(e.target.value))}
            aria-label="Anchor path speed"
            className="mt-2 w-full accent-pink-300"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Slider
          label="heat"
          value={state.heat}
          min={0}
          max={1.2}
          step={0.01}
          disabled={disabled}
          onChange={(v) => handlers.onUniform("heat", v)}
        />
        <Slider
          label="rim"
          value={state.rim}
          min={0}
          max={1.5}
          step={0.01}
          disabled={disabled}
          onChange={(v) => handlers.onUniform("rim", v)}
        />
        <Slider
          label="pulse"
          value={state.pulse}
          min={0}
          max={1}
          step={0.01}
          disabled={disabled}
          onChange={(v) => handlers.onUniform("pulse", v)}
        />
        <Slider
          label="thick"
          value={state.thick}
          min={0.4}
          max={2}
          step={0.05}
          disabled={disabled}
          onChange={(v) => handlers.onUniform("thick", v)}
        />
        <Slider
          label="curl"
          value={state.curl}
          min={0}
          max={1.5}
          step={0.01}
          disabled={disabled}
          onChange={(v) => handlers.onUniform("curl", v)}
        />
      </div>

      <div>
        <div className="chrome-label text-chrome-300">post fx</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <FxToggle
            label="bloom"
            on={state.bloom}
            disabled={disabled}
            onChange={(v) => handlers.onFx("bloom", v)}
          />
          <FxToggle
            label="film"
            on={state.film}
            disabled={disabled}
            onChange={(v) => handlers.onFx("film", v)}
          />
        </div>
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
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="chrome-label text-chrome-300">
        {label}: <span className="text-pink-200">{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="mt-2 w-full accent-pink-300"
      />
    </label>
  );
}

function FxToggle({
  label,
  on,
  disabled,
  onChange,
}: {
  label: string;
  on: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`rounded-sm border px-3 py-1 font-mono text-xs ${
        on
          ? "border-pink-200 text-pink-100"
          : "border-warm-black-700 text-chrome-400 hover:border-pink-200/40"
      } disabled:opacity-40`}
      aria-pressed={on}
    >
      {label}
    </button>
  );
}

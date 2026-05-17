"use client";

/**
 * app/atelier/modal-lattice/modal-lattice/sub-controls.tsx — Tiny
 * presentation helpers: Slider with inline label/value, Stat
 * key/value tile, clampDim (1..8 round-trip).
 *
 * Extracted from modal-lattice-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

export function clampDim(n: number): number {
  return Math.max(1, Math.min(8, Math.round(n)));
}

export function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 font-mono text-xs uppercase tracking-[0.2em] text-chrome-300">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-pink-200"
      />
    </label>
  );
}

export function Stat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-[0.2em] text-chrome-500">
        {label}
      </span>
      <span className="text-pink-200">{value}</span>
    </div>
  );
}

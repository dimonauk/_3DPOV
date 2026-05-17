"use client";

/**
 * app/atelier/waveguide-forge/waveguide-forge/slider.tsx — Compact
 * labelled range slider used across the right-side controls.
 *
 * Extracted from waveguide-forge-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 font-mono text-[0.65rem] text-chrome-400">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-32 accent-pink-200"
      />
      <span className="w-10 text-right tabular-nums text-chrome-300">
        {value.toFixed(2)}
      </span>
    </label>
  );
}

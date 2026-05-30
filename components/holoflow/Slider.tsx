/**
 * Slider — labeled range input with live readout.
 *
 * "Complexity  0.62" style — label on the left, value on the right,
 * native range underneath. Source HTML's .sl-r/.sl-l. Designed for
 * evolution-engine genome control panels.
 */

"use client";

import type { ChangeEvent } from "react";

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  format = (v) => v.toFixed(2),
  accent = "teal",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
  accent?: "teal" | "gold" | "pink" | "lavender";
}) {
  const valueColor = {
    teal: "text-teal-400",
    gold: "text-gold-400",
    pink: "text-pink-400",
    lavender: "text-lavender-200",
  }[accent];

  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-chrome-500">
        {label}
        <span className={valueColor}>{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(parseFloat(e.target.value))
        }
        className="h-0.5 w-full appearance-none bg-warm-black-700 accent-teal-400 outline-none"
      />
    </label>
  );
}

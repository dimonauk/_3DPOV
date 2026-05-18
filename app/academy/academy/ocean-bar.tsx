"use client";

/**
 * app/academy/academy/ocean-bar.tsx — Tiny OCEAN/Big-Five readout
 * row: name, filled bar, integer percentage.
 *
 * Extracted from academy-client.tsx per ARCHITECTURE.md Rule 1.
 */

function pct(n: number): number {
  return Math.round(n * 100);
}

export function OceanBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-[10px] text-chrome-400">
      <span className="w-20 font-mono uppercase tracking-wider">{label}</span>
      <div className="relative h-1 flex-1 bg-warm-black-800">
        <div
          className="absolute inset-y-0 left-0 bg-pink-200/40"
          style={{ width: `${pct(value)}%` }}
        />
      </div>
      <span className="w-8 text-right font-mono">{pct(value)}</span>
    </div>
  );
}

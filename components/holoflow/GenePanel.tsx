/**
 * GenePanel — labeled key/value list with a fitness progress bar at
 * the bottom. Used by BY-GEN (genome), Poi (motion genome), and
 * anywhere a parametric object's parameters need a tight display.
 *
 *   <GenePanel
 *     title="Live motion genome"
 *     rows={[
 *       { k: 'spin_ratio', v: '1.00' },
 *       { k: 'arm_length', v: '0.80' },
 *     ]}
 *     fitness={0.74}
 *   />
 */

import type { ReactNode } from "react";

export type GeneRow = { k: string; v: ReactNode };

export function GenePanel({
  title,
  rows,
  fitness,
  accent = "lavender",
}: {
  title: string;
  rows: GeneRow[];
  /** 0..1 — drawn as a progress bar at the bottom. Omit to skip. */
  fitness?: number;
  accent?: "lavender" | "teal" | "gold" | "pink";
}) {
  const valueColor = {
    lavender: "text-lavender-200",
    teal:     "text-teal-400",
    gold:     "text-gold-300",
    pink:     "text-pink-400",
  }[accent];
  const titleColor = valueColor;

  const pct = fitness === undefined ? 0 : Math.max(0, Math.min(1, fitness)) * 100;

  return (
    <div className="border border-warm-black-700 bg-warm-black-950 p-3">
      <div className={`font-mono text-[10px] uppercase tracking-[0.18em] ${titleColor}`}>
        {title}
      </div>
      <div className="mt-2 flex flex-col gap-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-baseline justify-between text-[10px]">
            <span className="text-chrome-500">{r.k}</span>
            <span className={`font-mono font-semibold ${valueColor}`}>{r.v}</span>
          </div>
        ))}
      </div>
      {fitness !== undefined && (
        <div className="mt-3 h-0.5 w-full bg-warm-black-700">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-lavender-300 transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

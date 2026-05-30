/**
 * PopulationGrid — selectable thumbnail grid with scores.
 *
 * BY-GEN's population display: 10 candidates, each rendered as a
 * miniature with a fitness score. Click selects; the parent re-runs
 * its full-size render with the chosen genome.
 *
 * Caller supplies a renderCell function — keeps this component free
 * of any rendering opinion (Canvas, SVG, image, glyph all work).
 */

"use client";

import type { ReactNode } from "react";

export type PopulationMember = {
  key: string;
  score: number; // 0..1
  cell: ReactNode;
};

export function PopulationGrid({
  members,
  selected,
  onSelect,
  columns = 5,
}: {
  members: PopulationMember[];
  selected: string;
  onSelect: (key: string) => void;
  columns?: number;
}) {
  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {members.map((m) => {
        const active = m.key === selected;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onSelect(m.key)}
            className={`group relative aspect-square overflow-hidden border bg-warm-black-925 transition-colors ${
              active
                ? "border-teal-400"
                : "border-transparent hover:border-teal-400/40"
            }`}
          >
            <div className="absolute inset-0">{m.cell}</div>
            <div className="absolute inset-x-0 bottom-0 bg-warm-black-950/80 py-0.5 text-center font-mono text-[8px] text-teal-400">
              {Math.round(m.score * 100)}
            </div>
          </button>
        );
      })}
    </div>
  );
}

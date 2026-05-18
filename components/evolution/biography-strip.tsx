"use client";

/**
 * components/evolution/biography-strip.tsx — Horizontal scrollable strip
 * of ancestor thumbnails. One disc per ancestor of the current ego, in
 * descending generation order. Click pans the fan chart to that
 * ancestor; hover lights the corresponding wedge.
 */

import type * as React from "react";

import type { Genome } from "lib/evolution/genome";

import { KINGDOM_COLOURS } from "./kingdom-palette";

export type BiographyStripProps = {
  ego: Genome;
  ancestors: ReadonlyArray<Genome>;
  selectedId?: string | null;
  hoveredId?: string | null;
  onSelect: (id: string) => void;
  onHover?: (id: string | null) => void;
};

export function BiographyStrip(props: BiographyStripProps): React.JSX.Element {
  const { ego, ancestors, selectedId, hoveredId, onSelect, onHover } = props;

  const sorted = [...ancestors].sort((a, b) => {
    if (a.generation !== b.generation) return b.generation - a.generation;
    return a.sequenceId.localeCompare(b.sequenceId);
  });

  const entries = [ego, ...sorted.filter((g) => g.sequenceId !== ego.sequenceId)];

  return (
    <div
      role="list"
      aria-label="Ancestor biography strip"
      className="flex gap-3 overflow-x-auto pb-2"
    >
      {entries.map((g) => {
        const isEgo = g.sequenceId === ego.sequenceId;
        const isHovered = g.sequenceId === hoveredId;
        const isSelected = g.sequenceId === selectedId;
        return (
          <button
            key={g.sequenceId}
            type="button"
            role="listitem"
            onClick={() => onSelect(g.sequenceId)}
            onMouseEnter={() => onHover?.(g.sequenceId)}
            onMouseLeave={() => onHover?.(null)}
            className={[
              "shrink-0 w-28 rounded-sm border bg-warm-black-900/40 px-3 py-3 text-left transition-colors",
              isEgo
                ? "border-pink-200/70"
                : isSelected
                ? "border-pink-200/60"
                : isHovered
                ? "border-chrome-200"
                : "border-warm-black-800 hover:border-chrome-500",
            ].join(" ")}
          >
            <div className="flex items-center justify-between">
              <span
                aria-hidden="true"
                className="inline-block h-6 w-6 rounded-full"
                style={{
                  backgroundColor: KINGDOM_COLOURS[g.kingdom],
                  boxShadow:
                    "inset 0 0 8px rgba(0,0,0,0.45), 0 0 6px rgba(255,255,255,0.06)",
                }}
              />
              <span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-chrome-500">
                {isEgo ? "ego" : `gen ${g.generation}`}
              </span>
            </div>
            <div className="mt-2 text-[0.7rem] text-chrome-200 truncate">
              {g.kingdom}
            </div>
            <div className="mt-1 font-mono text-[0.55rem] text-chrome-500 truncate">
              {g.sequenceId}
            </div>
          </button>
        );
      })}
    </div>
  );
}

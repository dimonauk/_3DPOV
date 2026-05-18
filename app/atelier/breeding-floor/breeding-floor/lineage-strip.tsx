"use client";

/**
 * app/atelier/breeding-floor/breeding-floor/lineage-strip.tsx —
 * Rolling history strip showing the last N generations as rows of
 * tinted dots; favourited genomes get a pink border + glow so the
 * drift is legible at a glance.
 *
 * Extracted from breeding-floor-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import type { LineageEntry } from "./types";

export function LineageStrip({ lineage }: { lineage: LineageEntry[] }) {
  return (
    <div>
      <div className="chrome-label text-chrome-400">
        Lineage &mdash; last {lineage.length} generation
        {lineage.length === 1 ? "" : "s"}
      </div>
      <div className="mt-3 flex flex-col gap-3">
        {lineage.map((entry) => (
          <div
            key={entry.generation}
            className="flex items-center gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/20 px-3 py-2"
          >
            <span className="w-24 shrink-0 font-mono text-[0.7rem] text-chrome-500">
              Generation {entry.generation}
            </span>
            <div className="flex flex-1 flex-wrap gap-1.5">
              {entry.thumbs.map((thumb) => (
                <span
                  key={thumb.uid}
                  title={`Generation ${entry.generation}, ${
                    thumb.favourite ? "favourited" : "unfavourited"
                  }`}
                  className={`inline-block h-4 w-4 rounded-full border ${
                    thumb.favourite
                      ? "border-pink-200"
                      : "border-warm-black-700"
                  }`}
                  style={{
                    backgroundColor: thumb.colour,
                    boxShadow: thumb.favourite
                      ? `0 0 6px ${thumb.colour}`
                      : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

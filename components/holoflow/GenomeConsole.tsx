/**
 * GenomeConsole — mutation panel for BY-GEN-style engines.
 *
 * Combines the GenePanel rows + a "MUTATE ↻" button + an append-only
 * log strip. The parent owns the genome state; this component just
 * surfaces it and emits onMutate. Bars render via the same gradient
 * as GenePanel for visual consistency.
 *
 *   <GenomeConsole
 *     title="Genome Mutation Console"
 *     genes={[{ k: 'spine_curl', v: 0.42 }, ...]}
 *     log={["[GENE] 14-float vector loaded", ...]}
 *     onMutate={() => evolve()}
 *   />
 */

"use client";

import type { ReactNode } from "react";

export type Gene = { k: string; v: number };

export function GenomeConsole({
  title = "Genome Mutation Console",
  genes,
  log,
  onMutate,
}: {
  title?: string;
  genes: Gene[];
  log: ReactNode[];
  onMutate: () => void;
}) {
  return (
    <div className="border border-warm-black-700 bg-warm-black-950 p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-teal-400">
          {title}
        </span>
        <button
          type="button"
          onClick={onMutate}
          className="border border-teal-400 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.13em] text-teal-400 transition-colors hover:bg-teal-400 hover:text-warm-black-950"
        >
          MUTATE ↻
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        {genes.map((g) => (
          <div
            key={g.k}
            className="grid grid-cols-[100px_1fr_36px] items-center gap-2"
          >
            <span className="font-mono text-[10px] text-chrome-500">{g.k}</span>
            <span className="h-0.5 bg-warm-black-700">
              <span
                className="block h-full bg-gradient-to-r from-teal-400 to-lavender-300 transition-[width] duration-500"
                style={{ width: `${Math.round(clamp01(g.v) * 100)}%` }}
              />
            </span>
            <span className="text-right font-mono text-[10px] text-lavender-200">
              {g.v.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {log.length > 0 && (
        <div className="mt-4 border-t border-warm-black-700 pt-3 font-mono text-[10px] leading-loose text-chrome-500">
          {log.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

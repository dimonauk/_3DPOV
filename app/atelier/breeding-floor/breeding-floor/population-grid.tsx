"use client";

/**
 * app/atelier/breeding-floor/breeding-floor/population-grid.tsx —
 * Grid of population cards: tinted disc thumbnail, generation +
 * genome index label, sequence id, favourite toggle.
 *
 * Extracted from breeding-floor-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import { genomeToColour } from "./genome-builder";
import type { ChamberGenome } from "./types";

export function PopulationGrid({
  population,
  favourites,
  generation,
  onToggleFavourite,
}: {
  population: ChamberGenome[];
  favourites: Set<string>;
  generation: number;
  onToggleFavourite: (uid: string) => void;
}) {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      role="list"
      aria-label={`Population of generation ${generation}`}
    >
      {population.map((g, i) => {
        const fav = favourites.has(g.uid);
        const colour = genomeToColour(g);
        const label = `Generation ${g.generation} · Genome ${i + 1}`;
        return (
          <article
            key={g.uid}
            role="listitem"
            className={`flex flex-col gap-2 rounded-sm border ${
              fav
                ? "border-pink-200/70 bg-warm-black-900/70"
                : "border-warm-black-800 bg-warm-black-900/30"
            } p-3 transition-colors`}
          >
            {/* Placeholder thumbnail: a tinted disc. */}
            <div
              aria-hidden
              className="relative aspect-square w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950"
            >
              <div
                className="absolute left-1/2 top-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  backgroundColor: colour,
                  boxShadow: `0 0 40px ${colour}`,
                }}
              />
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-xs text-chrome-200">{label}</h3>
              <span className="font-mono text-[0.6rem] text-chrome-500">
                {g.sequenceId.slice(0, 12)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onToggleFavourite(g.uid)}
              aria-pressed={fav ? "true" : "false"}
              className={`mt-1 rounded-sm border px-2 py-1 text-[0.65rem] uppercase tracking-[0.18em] ${
                fav
                  ? "border-pink-200/70 bg-pink-200/10 text-pink-200"
                  : "border-warm-black-800 bg-warm-black-950/60 text-chrome-400 hover:border-pink-200/40 hover:text-pink-200"
              }`}
            >
              {fav ? "Favourited" : "Favourite this genome"}
            </button>
          </article>
        );
      })}
    </div>
  );
}

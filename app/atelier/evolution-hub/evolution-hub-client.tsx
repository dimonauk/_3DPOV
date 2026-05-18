"use client";

/**
 * app/atelier/evolution-hub/evolution-hub-client.tsx — Client-side state
 * shell for the evolution hub. Owns the current ego, the breadcrumb back
 * to the original ego, hover state shared between the fan chart and the
 * biography strip, and the depth control.
 */

import type * as React from "react";
import { useMemo, useState } from "react";

import { FanChart } from "components/evolution/fan-chart";
import { BiographyStrip } from "components/evolution/biography-strip";
import type { Genome } from "lib/evolution/genome";

export type EvolutionHubClientProps = {
  population: ReadonlyArray<Genome>;
  rootEgoId: string;
};

const MAX_DEPTH = 4;

function indexById(pop: ReadonlyArray<Genome>): Map<string, Genome> {
  const m = new Map<string, Genome>();
  for (const g of pop) m.set(g.sequenceId, g);
  return m;
}

function collectAncestorsBfs(
  ego: Genome,
  byId: Map<string, Genome>,
  depth: number,
): Genome[] {
  const seen = new Set<string>();
  const out: Genome[] = [];
  let frontier: Genome[] = [ego];
  for (let d = 0; d < depth; d++) {
    const next: Genome[] = [];
    for (const cur of frontier) {
      for (const pid of cur.parentIds) {
        if (seen.has(pid)) continue;
        const p = byId.get(pid);
        if (!p) continue;
        seen.add(pid);
        out.push(p);
        next.push(p);
      }
    }
    frontier = next;
    if (frontier.length === 0) break;
  }
  return out;
}

export default function EvolutionHubClient(
  props: EvolutionHubClientProps,
): React.JSX.Element {
  const { population, rootEgoId } = props;
  const byId = useMemo(() => indexById(population), [population]);

  const rootEgo = byId.get(rootEgoId);
  const [egoStack, setEgoStack] = useState<string[]>([rootEgoId]);
  const [depth, setDepth] = useState<number>(3);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const currentEgoId = egoStack[egoStack.length - 1] ?? rootEgoId;
  const ego = byId.get(currentEgoId) ?? rootEgo;

  const ancestors = useMemo(() => {
    if (!ego) return [] as Genome[];
    return collectAncestorsBfs(ego, byId, depth);
  }, [ego, byId, depth]);

  const ancestorMap = useMemo(() => {
    const m = new Map<string, Genome>();
    for (const g of ancestors) m.set(g.sequenceId, g);
    return m;
  }, [ancestors]);

  if (!ego) {
    return (
      <p className="text-chrome-300">No ego genome — population is empty.</p>
    );
  }

  const handleSelect = (id: string) => {
    if (id === currentEgoId) return;
    if (!byId.has(id)) return;
    setEgoStack((prev) => [...prev, id]);
  };

  const handleCrumb = (idx: number) => {
    setEgoStack((prev) => prev.slice(0, idx + 1));
  };

  const crumbs = egoStack
    .map((id) => byId.get(id))
    .filter((g): g is Genome => Boolean(g));

  return (
    <div className="mt-10 flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2 text-[0.7rem]">
        <span className="chrome-label text-chrome-500">path</span>
        {crumbs.map((g, i) => (
          <span key={`${g.sequenceId}-${i}`} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCrumb(i)}
              className={[
                "rounded-sm border px-2 py-0.5 font-mono text-[0.65rem] transition-colors",
                i === crumbs.length - 1
                  ? "border-pink-200/60 text-pink-200"
                  : "border-warm-black-800 text-chrome-300 hover:border-chrome-500 hover:text-chrome-100",
              ].join(" ")}
            >
              {g.kingdom}/g{g.generation}
            </button>
            {i < crumbs.length - 1 ? (
              <span className="text-chrome-500">&rarr;</span>
            ) : null}
          </span>
        ))}
        <div className="ml-auto flex items-center gap-2 text-chrome-300">
          <label htmlFor="fan-depth" className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-chrome-500">
            depth
          </label>
          <input
            id="fan-depth"
            type="range"
            min={1}
            max={MAX_DEPTH}
            step={1}
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            className="h-1 w-32 accent-pink-200"
          />
          <span className="font-mono text-[0.7rem] text-chrome-200">{depth}</span>
        </div>
      </div>

      <div
        className="relative rounded-md border border-warm-black-800 bg-warm-black-900/40 p-4"
        style={{ backdropFilter: "blur(8px)" }}
      >
        <div className="mx-auto w-full max-w-[640px] aspect-square">
          <FanChart
            ego={ego}
            ancestors={ancestorMap}
            depth={depth}
            onSelect={handleSelect}
            hoveredId={hoveredId}
            onHover={setHoveredId}
          />
        </div>
        <p className="mt-3 text-center text-[0.7rem] text-chrome-500">
          click a wedge to recentre &middot; hover to highlight descendants
        </p>
      </div>

      <section>
        <div className="chrome-label text-pink-200 mb-2">Biography strip</div>
        <h2 className="text-xl text-chrome-100">Ancestors of {ego.kingdom} g{ego.generation}.</h2>
        <p className="mt-2 max-w-2xl text-sm text-chrome-300">
          One disc per ancestor in the current fan, sorted youngest first. Click a card to jump the chart to that ancestor; mesh thumbnails come later.
        </p>
        <div className="mt-4">
          <BiographyStrip
            ego={ego}
            ancestors={ancestors}
            hoveredId={hoveredId}
            onSelect={handleSelect}
            onHover={setHoveredId}
          />
        </div>
      </section>
    </div>
  );
}

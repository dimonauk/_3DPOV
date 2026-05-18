"use client";

/**
 * app/atelier/breeding-floor/breeding-floor-client.tsx — Interactive
 * client for the breeding-floor chamber.
 *
 * Orchestrator only. Constants + types in breeding-floor/types.ts;
 * genome construction + tint helpers in genome-builder.ts; state
 * machine + handlers in use-population.ts; R3F Floor3D in
 * floor-3d.tsx; cards grid in population-grid.tsx; history strip
 * in lineage-strip.tsx. Per ARCHITECTURE.md Rule 1.
 *
 * Engine wiring: imports `mutateGenome`, `crossover`, and the typed
 * `Genome` model from `lib/evolution`. The chamber never reaches into
 * the engine's internals; everything goes through the library's
 * public surface.
 */

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { XR, createXRStore } from "@react-three/xr";
import { useMemo } from "react";

import { NarrationPlate } from "components/aura/narration-plate";
import { ChamberXRBar } from "components/three/ChamberXRBar";

import { Floor3D } from "./breeding-floor/floor-3d";
import { LineageStrip } from "./breeding-floor/lineage-strip";
import { PopulationGrid } from "./breeding-floor/population-grid";
import { LINEAGE_DEPTH } from "./breeding-floor/types";
import { usePopulation } from "./breeding-floor/use-population";

// TODO(print-bar): chamber cards are flat-tinted placeholder discs —
// no real splat thumbnails, no per-genome printable artefact. The
// PURPOSE.md "what's queued for later" already flags "Real splat
// thumbnails" as the next pass. Wire <PrintBar source={{ kind: "glb"
// | "ply", url, label }} /> per-card (or for a selected genome) once
// the chamber's `Genome` is bound to a real splat / mesh render.

export default function BreedingFloorClient() {
  const p = usePopulation();

  // Stable XR store — recreating it would tear down any live session.
  const xrStore = useMemo(() => createXRStore(), []);

  const favouriteCount = p.favourites.size;
  const mutateLabel =
    favouriteCount === 0
      ? "Mutate selected (favourite a card first)"
      : `Mutate selected (${favouriteCount})`;
  const breedLabel =
    favouriteCount < 2
      ? "Breed selected (need at least two favourites)"
      : `Breed selected (${favouriteCount})`;

  // Aura narration plate context — summarises the breeding floor's
  // current state. Updates as the generation advances or the operator
  // changes their favourites; the plate refetches on every change.
  const auraContext = `Breeding floor · generation ${p.generation} · ${favouriteCount} favourite${favouriteCount === 1 ? "" : "s"} of ${p.population.length} · lineage depth ${Math.min(p.lineage.length, LINEAGE_DEPTH)}`;

  return (
    <section
      aria-label="Breeding floor"
      className="flex flex-col gap-8 rounded-sm border border-warm-black-800 bg-warm-black-950/40 p-6"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="chrome-label text-pink-200">Genome breeding</div>
          <h2 className="mt-1 text-2xl text-chrome-100">
            Generation {p.generation}
          </h2>
          <p className="mt-1 text-xs text-chrome-400">
            Seed {p.seed.toString(16)} &middot; population{" "}
            {p.population.length} &middot; {favouriteCount} favourite
            {favouriteCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={p.handleMutate}
            disabled={favouriteCount === 0}
            className="rounded-sm border border-warm-black-700 bg-warm-black-900/60 px-3 py-2 text-sm text-chrome-200 hover:border-pink-200/60 hover:text-pink-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-warm-black-700 disabled:hover:text-chrome-200"
          >
            {mutateLabel}
          </button>
          <button
            type="button"
            onClick={p.handleBreed}
            disabled={favouriteCount < 2}
            className="rounded-sm border border-warm-black-700 bg-warm-black-900/60 px-3 py-2 text-sm text-chrome-200 hover:border-pink-200/60 hover:text-pink-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-warm-black-700 disabled:hover:text-chrome-200"
          >
            {breedLabel}
          </button>
          <button
            type="button"
            onClick={p.handleReset}
            className="rounded-sm border border-warm-black-700 bg-warm-black-900/60 px-3 py-2 text-sm text-chrome-200 hover:border-pink-200/60 hover:text-pink-200"
          >
            Reset
          </button>
        </div>
      </header>

      <div className="relative aspect-[2/1] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
        <div className="absolute right-3 top-3 z-20">
          <ChamberXRBar store={xrStore} />
        </div>
        <NarrationPlate contextSummary={auraContext} />
        <Canvas camera={{ position: [0, 1.4, 2.4], fov: 45 }} dpr={[1, 2]}>
          <color attach="background" args={["#05030a"]} />
          <XR store={xrStore}>
            <Floor3D population={p.population} />
          </XR>
          <OrbitControls enablePan={false} target={[0, 0, 0]} />
        </Canvas>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-baseline justify-between gap-3 bg-gradient-to-t from-warm-black-950/90 to-transparent px-3 py-2 font-mono text-[0.65rem] text-chrome-300">
          <span>floor &middot; generation {p.generation}</span>
          <span className="text-chrome-500">
            {p.population.length} genomes &middot; walkable in VR
          </span>
        </div>
      </div>

      <PopulationGrid
        population={p.population}
        favourites={p.favourites}
        generation={p.generation}
        onToggleFavourite={p.toggleFavourite}
      />

      <LineageStrip lineage={p.lineage} />
    </section>
  );
}

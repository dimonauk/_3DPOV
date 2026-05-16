"use client";

/**
 * app/atelier/breeding-floor/breeding-floor-client.tsx — Interactive
 * client for the breeding-floor chamber.
 *
 * # What this does
 * Holds a population of 12 sculpture genomes in React state. Each
 * card carries a placeholder render (a flat-tinted disc whose colour
 * comes from the genome's own `tint_r/tint_g/tint_b` genes), the
 * human-readable label "Generation N · Genome K", and a favourite
 * toggle. The top bar exposes three actions:
 *   - Mutate selected — every favourite is replaced by a mutated child
 *     of itself; non-favourites stay put. Generation advances.
 *   - Breed selected — favourites pair off via the crossover op; the
 *     remaining slots are filled with bred + mutated children of the
 *     parent pool.
 *   - Reset — re-seed from scratch.
 *
 * The lineage strip down the bottom keeps the last 5 generations as
 * a row of small thumbs so the user can see drift.
 *
 * Engine wiring: imports `mutateGenome`, `crossover`, and the typed
 * `Genome` model from `lib/evolution`. The chamber never reaches into
 * the engine's internals; everything goes through the library's
 * public surface.
 */

import { useCallback, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { createXRStore, XR } from "@react-three/xr";

import { NarrationPlate } from "components/aura/narration-plate";
import { ChamberXRBar } from "components/three/ChamberXRBar";
import {
  GENE_NAMES,
  cloneGenome,
  crossover,
  mutateGenome,
  seededRng,
  type Gene,
  type Genome,
} from "lib/evolution";
import { createLogger } from "lib/log";

const log = createLogger("atelier:breeding-floor");

// TODO(print-bar): chamber cards are flat-tinted placeholder discs —
// no real splat thumbnails, no per-genome printable artefact. The
// PURPOSE.md "what's queued for later" already flags "Real splat
// thumbnails" as the next pass. Wire <PrintBar source={{ kind: "glb"
// | "ply", url, label }} /> per-card (or for a selected genome) once
// the chamber's `Genome` is bound to a real splat / mesh render.

const POPULATION_SIZE = 12;
const LINEAGE_DEPTH = 5;
const MUTATION_RATE = 0.25;

type ChamberGenome = Genome & {
  /** Stable client-side id for React keys (separate from the breeding
   * sequenceId which collides easily after a mutate + breed cycle). */
  uid: string;
};

type LineageEntry = {
  generation: number;
  thumbs: Array<{ uid: string; colour: string; favourite: boolean }>;
};

// ------------------------------------------------------------------
// Genome construction
// ------------------------------------------------------------------

function buildSeedGenome(seqId: string, rng: () => number): Genome {
  const genes: Gene<unknown>[] = GENE_NAMES.map((name) => ({
    id: name,
    kind: "form",
    value: rng(),
  }));
  return {
    sequenceId: seqId,
    kingdom: "biomech",
    genes,
    generation: 0,
    parentIds: [],
    parentageChain: [],
  };
}

function withUid(g: Genome): ChamberGenome {
  return {
    ...g,
    uid:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${g.sequenceId}-${Math.random().toString(36).slice(2, 8)}`,
  };
}

function buildInitialPopulation(seed: number): ChamberGenome[] {
  const rng = seededRng(seed);
  const out: ChamberGenome[] = [];
  for (let i = 0; i < POPULATION_SIZE; i++) {
    const g = buildSeedGenome(`gen0-${i}`, rng);
    out.push(withUid(g));
  }
  return out;
}

// ------------------------------------------------------------------
// Tint extraction for the placeholder thumbnail
// ------------------------------------------------------------------

function geneValue(g: Genome, name: string, fallback: number): number {
  const found = g.genes.find((x) => x.id === name);
  if (!found) return fallback;
  return typeof found.value === "number" ? found.value : fallback;
}

function genomeToColour(g: Genome): string {
  // Pull the tint genes directly; they're already [0..1]. We HSV-drift
  // by the genome's hue_drift so two genomes with identical tint genes
  // still diverge as the lineage walks.
  const r = Math.round(geneValue(g, "tint_r", 0.5) * 255);
  const gg = Math.round(geneValue(g, "tint_g", 0.5) * 255);
  const b = Math.round(geneValue(g, "tint_b", 0.5) * 255);
  return `rgb(${r}, ${gg}, ${b})`;
}

// ------------------------------------------------------------------
// The component
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// Floor3D — a small R3F visualisation of the current population as
// a 4x3 grid of glowing spheres. Wraps inside <XR> so a visitor can
// walk the floor in a headset; flat-mode is the default desktop view.
// ------------------------------------------------------------------

function Floor3D({ population }: { population: ChamberGenome[] }) {
  const cols = 4;
  const spacing = 0.6;
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[3, 3, 3]} intensity={0.8} />
      <pointLight position={[-3, 2, -3]} intensity={0.5} color="#ff66cc" />
      {/* Floor plane */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.4, 0]} receiveShadow>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial color="#0a0a12" roughness={0.9} />
      </mesh>
      {population.map((g, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = (col - (cols - 1) / 2) * spacing;
        const z = (row - 1) * spacing;
        const colour = genomeToColour(g);
        return (
          <mesh key={g.uid} position={[x, 0, z]}>
            <sphereGeometry args={[0.18, 24, 24]} />
            <meshStandardMaterial
              color={colour}
              emissive={colour}
              emissiveIntensity={1.4}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </>
  );
}

export default function BreedingFloorClient() {
  const [seed, setSeed] = useState<number>(0xc0ffee);
  const [generation, setGeneration] = useState<number>(0);
  // Build the initial population once; the lineage strip mirrors it
  // so the on-screen thumbs share uids with the cards above them.
  const initialPopulation = useMemo(
    () => buildInitialPopulation(0xc0ffee),
    [],
  );
  const [population, setPopulation] =
    useState<ChamberGenome[]>(initialPopulation);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());

  // Stable XR store — recreating it would tear down any live session.
  const xrStore = useMemo(() => createXRStore(), []);
  const [lineage, setLineage] = useState<LineageEntry[]>(() => [
    {
      generation: 0,
      thumbs: initialPopulation.map((g) => ({
        uid: g.uid,
        colour: genomeToColour(g),
        favourite: false,
      })),
    },
  ]);

  const pushLineage = useCallback(
    (genNumber: number, pop: ChamberGenome[], favs: Set<string>) => {
      setLineage((prev) => {
        const entry: LineageEntry = {
          generation: genNumber,
          thumbs: pop.map((g) => ({
            uid: g.uid,
            colour: genomeToColour(g),
            favourite: favs.has(g.uid),
          })),
        };
        const next = [...prev, entry];
        return next.length > LINEAGE_DEPTH
          ? next.slice(next.length - LINEAGE_DEPTH)
          : next;
      });
    },
    [],
  );

  const toggleFavourite = useCallback((uid: string) => {
    setFavourites((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }, []);

  const handleMutate = useCallback(() => {
    if (favourites.size === 0) {
      log.warn("mutate called with no favourites", { generation });
      return;
    }
    const rng = seededRng(seed + generation * 31 + 1);
    const nextGen = generation + 1;
    const next: ChamberGenome[] = population.map((g) => {
      if (!favourites.has(g.uid)) return g;
      const mutated = mutateGenome(cloneGenome(g), MUTATION_RATE, rng);
      return withUid({ ...mutated, generation: nextGen });
    });
    log.info("mutate selected", {
      generation: nextGen,
      mutatedCount: favourites.size,
    });
    setGeneration(nextGen);
    setPopulation(next);
    pushLineage(nextGen, next, favourites);
  }, [favourites, generation, population, seed, pushLineage]);

  const handleBreed = useCallback(() => {
    if (favourites.size < 2) {
      log.warn("breed called with fewer than two favourites", {
        favourites: favourites.size,
      });
      return;
    }
    const rng = seededRng(seed + generation * 37 + 2);
    const nextGen = generation + 1;
    const parents = population.filter((g) => favourites.has(g.uid));
    const next: ChamberGenome[] = population.map((g) => {
      if (favourites.has(g.uid)) return g; // elite favourites survive
      // Pick two distinct parents from the favourite pool.
      const a = parents[Math.floor(rng() * parents.length)]!;
      let b = parents[Math.floor(rng() * parents.length)]!;
      // Try once to draw a distinct second parent so children aren't
      // identical to A; if there's only one parent, fall through and
      // let crossover degenerate to a clone (still a valid genome).
      if (parents.length > 1 && b.uid === a.uid) {
        b = parents[(parents.indexOf(a) + 1) % parents.length]!;
      }
      const child = crossover(a, b, rng);
      const mutated = mutateGenome(child, MUTATION_RATE, rng);
      return withUid({ ...mutated, generation: nextGen });
    });
    log.info("breed selected", {
      generation: nextGen,
      parents: parents.length,
      children: next.filter((g) => !favourites.has(g.uid)).length,
    });
    setGeneration(nextGen);
    setPopulation(next);
    pushLineage(nextGen, next, favourites);
  }, [favourites, generation, population, seed, pushLineage]);

  const handleReset = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 0xffffff);
    const fresh = buildInitialPopulation(newSeed);
    log.info("reset", { newSeed });
    setSeed(newSeed);
    setGeneration(0);
    setFavourites(new Set());
    setPopulation(fresh);
    setLineage([
      {
        generation: 0,
        thumbs: fresh.map((g) => ({
          uid: g.uid,
          colour: genomeToColour(g),
          favourite: false,
        })),
      },
    ]);
  }, []);

  const favouriteCount = favourites.size;
  const mutateLabel = useMemo(
    () =>
      favouriteCount === 0
        ? "Mutate selected (favourite a card first)"
        : `Mutate selected (${favouriteCount})`,
    [favouriteCount],
  );
  const breedLabel = useMemo(
    () =>
      favouriteCount < 2
        ? "Breed selected (need at least two favourites)"
        : `Breed selected (${favouriteCount})`,
    [favouriteCount],
  );

  // Aura narration plate context — summarises the breeding floor's
  // current state. Updates as the generation advances or the operator
  // changes their favourites; the plate refetches on every change.
  const auraContext = useMemo(() => {
    return `Breeding floor · generation ${generation} · ${favouriteCount} favourite${favouriteCount === 1 ? "" : "s"} of ${population.length} · lineage depth ${Math.min(lineage.length, LINEAGE_DEPTH)}`;
  }, [favouriteCount, generation, lineage.length, population.length]);

  return (
    <section
      aria-label="Breeding floor"
      className="flex flex-col gap-8 rounded-sm border border-warm-black-800 bg-warm-black-950/40 p-6"
    >
      {/* Top bar -------------------------------------------------- */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="chrome-label text-pink-200">Genome breeding</div>
          <h2 className="mt-1 text-2xl text-chrome-100">
            Generation {generation}
          </h2>
          <p className="mt-1 text-xs text-chrome-400">
            Seed {seed.toString(16)} &middot; population {population.length}{" "}
            &middot; {favouriteCount} favourite
            {favouriteCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleMutate}
            disabled={favouriteCount === 0}
            className="rounded-sm border border-warm-black-700 bg-warm-black-900/60 px-3 py-2 text-sm text-chrome-200 hover:border-pink-200/60 hover:text-pink-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-warm-black-700 disabled:hover:text-chrome-200"
          >
            {mutateLabel}
          </button>
          <button
            type="button"
            onClick={handleBreed}
            disabled={favouriteCount < 2}
            className="rounded-sm border border-warm-black-700 bg-warm-black-900/60 px-3 py-2 text-sm text-chrome-200 hover:border-pink-200/60 hover:text-pink-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-warm-black-700 disabled:hover:text-chrome-200"
          >
            {breedLabel}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-sm border border-warm-black-700 bg-warm-black-900/60 px-3 py-2 text-sm text-chrome-200 hover:border-pink-200/60 hover:text-pink-200"
          >
            Reset
          </button>
        </div>
      </header>

      {/* 3D floor view --------------------------------------------
          Twelve genomes laid out as a 4x3 grid of glowing spheres.
          WebXR wrap lets a visitor walk the floor in a headset; flat
          mode is the default desktop view. */}
      <div className="relative aspect-[2/1] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
        <div className="absolute right-3 top-3 z-20">
          <ChamberXRBar store={xrStore} />
        </div>
        <NarrationPlate contextSummary={auraContext} />
        <Canvas camera={{ position: [0, 1.4, 2.4], fov: 45 }} dpr={[1, 2]}>
          <color attach="background" args={["#05030a"]} />
          <XR store={xrStore}>
            <Floor3D population={population} />
          </XR>
          <OrbitControls enablePan={false} target={[0, 0, 0]} />
        </Canvas>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-baseline justify-between gap-3 bg-gradient-to-t from-warm-black-950/90 to-transparent px-3 py-2 font-mono text-[0.65rem] text-chrome-300">
          <span>floor &middot; generation {generation}</span>
          <span className="text-chrome-500">
            {population.length} genomes &middot; walkable in VR
          </span>
        </div>
      </div>

      {/* Population grid ----------------------------------------- */}
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
                onClick={() => toggleFavourite(g.uid)}
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

      {/* Lineage strip ------------------------------------------- */}
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
    </section>
  );
}

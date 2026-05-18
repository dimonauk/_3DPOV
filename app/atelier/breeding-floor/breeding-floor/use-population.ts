"use client";

/**
 * app/atelier/breeding-floor/breeding-floor/use-population.ts —
 * State machine for the breeding-floor chamber: seed, generation,
 * population, favourites, lineage strip + all handlers (mutate,
 * breed, reset, toggleFavourite, pushLineage).
 *
 * Extracted from breeding-floor-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import { useCallback, useMemo, useState } from "react";

import {
  cloneGenome,
  crossover,
  mutateGenome,
  seededRng,
} from "lib/evolution";
import { createLogger } from "lib/log";

import {
  buildInitialPopulation,
  genomeToColour,
  withUid,
} from "./genome-builder";
import {
  type ChamberGenome,
  LINEAGE_DEPTH,
  type LineageEntry,
  MUTATION_RATE,
} from "./types";

const log = createLogger("atelier:breeding-floor");

export function usePopulation() {
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

  return {
    seed,
    generation,
    population,
    favourites,
    lineage,
    toggleFavourite,
    handleMutate,
    handleBreed,
    handleReset,
  };
}

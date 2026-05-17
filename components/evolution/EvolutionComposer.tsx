"use client";

/**
 * components/evolution/EvolutionComposer.tsx — Product-aware breeding-
 * floor primitive that the wall-piece, wall-array, and jewellery
 * designer chambers all mount.
 *
 * Compose-from-existing: extends the breeding-floor mechanic
 * (population → pick → mutate / breed → next generation) with
 * product-specific scale, kingdoms, gene bias, and output arrangement.
 *
 * State + UI in one place so each chamber stays a thin shell —
 * page.tsx + a 30-line wrapper that picks the preset and renders the
 * commission CTA.
 *
 * The placeholder per-genome render is a tinted sphere driven by the
 * genome's `tint_r/g/b` + `gem_hue` genes. Once a real splat-render
 * capability is wired (viz.splat-render's design-time variant), each
 * card swaps to a live mesh preview.
 */

import { useCallback, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Link from "next/link";

import {
  cloneGenome,
  crossover,
  GENE_NAMES,
  mutateGenome,
  seededRng,
  type Gene,
  type Genome,
} from "lib/evolution";
import type { EvolutionProductPreset } from "lib/evolution/product-presets";

const MUTATION_RATE = 0.25;
const LINEAGE_DEPTH = 5;

type ChamberGenome = Genome & {
  uid: string;
};

type LineageEntry = {
  generation: number;
  thumbs: Array<{ uid: string; colour: string; picked: boolean }>;
};

function withUid(g: Genome): ChamberGenome {
  return {
    ...g,
    uid:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${g.sequenceId}-${Math.random().toString(36).slice(2, 8)}`,
  };
}

function buildSeedGenome(
  seqId: string,
  rng: () => number,
  preset: EvolutionProductPreset,
): Genome {
  const genes: Gene<unknown>[] = GENE_NAMES.map((name) => {
    const bias = preset.geneBias?.[name];
    // Tilt around bias toward bias-value with low jitter; otherwise uniform.
    const value =
      typeof bias === "number"
        ? Math.max(0, Math.min(1, bias + (rng() - 0.5) * 0.2))
        : rng();
    return { id: name, kind: "form", value };
  });
  const kingdom = preset.kingdoms[Math.floor(rng() * preset.kingdoms.length)]!;
  return {
    sequenceId: seqId,
    kingdom,
    genes,
    generation: 0,
    parentIds: [],
    parentageChain: [],
  };
}

function buildInitialPopulation(
  seed: number,
  preset: EvolutionProductPreset,
): ChamberGenome[] {
  const rng = seededRng(seed);
  const out: ChamberGenome[] = [];
  for (let i = 0; i < preset.populationSize; i++) {
    out.push(withUid(buildSeedGenome(`gen0-${i}`, rng, preset)));
  }
  return out;
}

function geneValue(g: Genome, name: string, fallback: number): number {
  const found = g.genes.find((x) => x.id === name);
  if (!found) return fallback;
  return typeof found.value === "number" ? found.value : fallback;
}

function genomeColour(g: Genome): string {
  const r = Math.round(geneValue(g, "tint_r", 0.5) * 255);
  const gg = Math.round(geneValue(g, "tint_g", 0.5) * 255);
  const b = Math.round(geneValue(g, "tint_b", 0.5) * 255);
  return `rgb(${r}, ${gg}, ${b})`;
}

function Preview({ genome }: { genome: ChamberGenome }) {
  const colour = genomeColour(genome);
  const gemCount = geneValue(genome, "gem_count", 0);
  const showGems = gemCount > 0.3;
  return (
    <Canvas camera={{ position: [0, 0, 2.5], fov: 40 }}>
      <ambientLight intensity={0.4} />
      <pointLight position={[3, 3, 3]} intensity={0.8} />
      <pointLight position={[-3, 2, -3]} intensity={0.5} color="#ff66cc" />
      <mesh>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color={colour}
          emissive={colour}
          emissiveIntensity={0.6}
          roughness={0.25}
          metalness={0.3}
        />
      </mesh>
      {showGems && (
        <mesh position={[0, 0.7, 0.7]} scale={0.18}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#fff"
            emissive={`hsl(${geneValue(genome, "gem_hue", 0) * 360}, 80%, 65%)`}
            emissiveIntensity={1.5}
            roughness={0.05}
          />
        </mesh>
      )}
      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.6} />
    </Canvas>
  );
}

export default function EvolutionComposer({
  preset,
}: {
  preset: EvolutionProductPreset;
}) {
  const initial = useMemo(() => buildInitialPopulation(0xc0ffee, preset), [preset]);
  const [seed, setSeed] = useState<number>(0xc0ffee);
  const [generation, setGeneration] = useState(0);
  const [population, setPopulation] = useState<ChamberGenome[]>(initial);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [committed, setCommitted] = useState<ChamberGenome | null>(null);
  const [lineage, setLineage] = useState<LineageEntry[]>(() => [
    {
      generation: 0,
      thumbs: initial.map((g) => ({
        uid: g.uid,
        colour: genomeColour(g),
        picked: false,
      })),
    },
  ]);

  const pushLineage = useCallback(
    (gen: number, pop: ChamberGenome[], picks: Set<string>) => {
      setLineage((prev) => {
        const entry: LineageEntry = {
          generation: gen,
          thumbs: pop.map((g) => ({
            uid: g.uid,
            colour: genomeColour(g),
            picked: picks.has(g.uid),
          })),
        };
        const next = [...prev, entry];
        return next.length > LINEAGE_DEPTH ? next.slice(next.length - LINEAGE_DEPTH) : next;
      });
    },
    [],
  );

  const togglePick = useCallback((uid: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }, []);

  const handleMutate = useCallback(() => {
    if (picked.size === 0) return;
    const rng = seededRng(seed + generation * 31 + 1);
    const nextGen = generation + 1;
    const next: ChamberGenome[] = population.map((g) => {
      if (!picked.has(g.uid)) return g;
      const mutated = mutateGenome(cloneGenome(g), MUTATION_RATE, rng);
      return withUid({ ...mutated, generation: nextGen });
    });
    setGeneration(nextGen);
    setPopulation(next);
    pushLineage(nextGen, next, picked);
  }, [picked, generation, population, seed, pushLineage]);

  const handleBreed = useCallback(() => {
    if (picked.size < 2) return;
    const rng = seededRng(seed + generation * 37 + 2);
    const nextGen = generation + 1;
    const parents = population.filter((g) => picked.has(g.uid));
    const next: ChamberGenome[] = population.map((g) => {
      if (picked.has(g.uid)) return g;
      const a = parents[Math.floor(rng() * parents.length)]!;
      let b = parents[Math.floor(rng() * parents.length)]!;
      if (parents.length > 1 && b.uid === a.uid) {
        b = parents[(parents.indexOf(a) + 1) % parents.length]!;
      }
      const child = crossover(a, b, rng);
      const mutated = mutateGenome(child, MUTATION_RATE, rng);
      return withUid({ ...mutated, generation: nextGen });
    });
    setGeneration(nextGen);
    setPopulation(next);
    pushLineage(nextGen, next, picked);
  }, [picked, generation, population, seed, pushLineage]);

  const handleReset = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 0xffffff);
    const fresh = buildInitialPopulation(newSeed, preset);
    setSeed(newSeed);
    setGeneration(0);
    setPicked(new Set());
    setPopulation(fresh);
    setCommitted(null);
    setLineage([
      {
        generation: 0,
        thumbs: fresh.map((g) => ({ uid: g.uid, colour: genomeColour(g), picked: false })),
      },
    ]);
  }, [preset]);

  const handleCommit = useCallback(() => {
    if (picked.size === 0) return;
    const chosen = population.find((g) => picked.has(g.uid));
    if (chosen) setCommitted(chosen);
  }, [picked, population]);

  const gridCols =
    preset.outputArrangement === "grid-4x4"
      ? "lg:grid-cols-4"
      : preset.outputArrangement === "grid-3x3"
        ? "lg:grid-cols-3"
        : "lg:grid-cols-4";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3 text-xs text-chrome-300">
        <span className="font-mono text-chrome-100">
          generation · {generation}
        </span>
        <span className="font-mono">picked · {picked.size}</span>
        <span className="font-mono text-chrome-500">
          scale {preset.scaleRangeMm[0]}–{preset.scaleRangeMm[1]} mm · kingdoms {preset.kingdoms.join(", ")}
        </span>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={handleMutate}
            disabled={picked.size === 0}
            className="rounded-sm border border-warm-black-700 px-3 py-1 hover:border-pink-200/40 disabled:opacity-30"
          >
            mutate picks
          </button>
          <button
            type="button"
            onClick={handleBreed}
            disabled={picked.size < 2}
            className="rounded-sm border border-warm-black-700 px-3 py-1 hover:border-pink-200/40 disabled:opacity-30"
          >
            breed picks
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-sm border border-warm-black-700 px-3 py-1 hover:border-pink-200/40"
          >
            reset
          </button>
          <button
            type="button"
            onClick={handleCommit}
            disabled={picked.size === 0}
            className="rounded-sm border border-pink-200 px-3 py-1 text-pink-100 hover:bg-pink-200/15 disabled:opacity-30"
          >
            keep this →
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${gridCols}`}>
        {population.map((g) => {
          const isPicked = picked.has(g.uid);
          return (
            <button
              key={g.uid}
              type="button"
              onClick={() => togglePick(g.uid)}
              className={`relative aspect-square overflow-hidden rounded-sm border transition-colors ${
                isPicked
                  ? "border-pink-200"
                  : "border-warm-black-800 hover:border-pink-200/40"
              } bg-warm-black-950`}
            >
              <Preview genome={g} />
              <div className="pointer-events-none absolute bottom-1 left-1 right-1 flex items-baseline justify-between gap-2 px-1 text-[10px] text-chrome-400">
                <span className="font-mono">{g.kingdom}</span>
                <span className="font-mono">{g.sequenceId.slice(-6)}</span>
              </div>
              {isPicked && (
                <span className="absolute top-1 right-1 rounded-full bg-pink-200 px-2 py-0.5 text-[9px] font-bold text-warm-black-950">
                  PICKED
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-3">
        <div className="chrome-label mb-2 text-chrome-300">Lineage</div>
        <div className="flex flex-col gap-2">
          {lineage.map((entry) => (
            <div key={entry.generation} className="flex items-center gap-2">
              <span className="w-16 font-mono text-xs text-chrome-500">
                gen {entry.generation}
              </span>
              <div className="flex flex-1 flex-wrap gap-1">
                {entry.thumbs.map((t) => (
                  <span
                    key={t.uid}
                    className={`h-4 w-4 rounded-full ${t.picked ? "ring-1 ring-pink-200" : ""}`}
                    style={{ backgroundColor: t.colour }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {committed && (
        <div className="rounded-sm border border-pink-200 bg-pink-200/5 p-5">
          <div className="chrome-label mb-2 text-pink-200">Kept genome</div>
          <p className="font-mono text-sm text-chrome-100">
            {committed.kingdom} · {committed.sequenceId} · generation {committed.generation}
          </p>
          <p className="mt-2 text-xs text-chrome-400">
            {preset.cta.note}
          </p>
          <Link
            href={preset.cta.href}
            className="mt-4 inline-block rounded-sm border border-pink-200 bg-pink-200/15 px-4 py-2 text-sm text-pink-100 hover:bg-pink-200/30"
          >
            {preset.cta.label} →
          </Link>
        </div>
      )}
    </div>
  );
}

"use client";

/**
 * app/demo/evolution/evolution-demo-client.tsx — Client for the evolution-engine demo.
 *
 * One-line role: drive the typed evolve() loop under user control, paint best+avg
 * fitness on Canvas2D, and paint the leading individual's 28 normalised genes as a
 * bar row. Pure pieces live in evolution-demo-loop.ts; this file is React + paint.
 * Full purpose in evolution-demo-client.PURPOSE.md.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { evolve, seededRng, type GenerationSnapshot } from "lib/evolution";

import {
  BATCH_CHUNK,
  POPULATION_SIZE,
  RUN_BATCH,
  buildInitial,
  findBest,
  gaussianMutate,
  fitness,
  initialSnapshot,
  selectTournament,
  uniformCrossover,
  type EvolveSubject,
} from "./evolution-demo-loop";

const CANVAS_W = 960;
const CANVAS_H = 280;

function paintChart(
  ctx: CanvasRenderingContext2D,
  history: ReadonlyArray<GenerationSnapshot>,
): void {
  ctx.fillStyle = "#070710";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.strokeStyle = "#1a1a26";
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = (CANVAS_H * i) / 4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_W, y);
    ctx.stroke();
  }
  if (history.length < 2) return;

  const last = history[history.length - 1];
  const maxGen = Math.max(1, last?.generation ?? 1);
  const xOf = (g: number) => (g / maxGen) * (CANVAS_W - 8) + 4;
  const yOf = (v: number) =>
    CANVAS_H - 4 - Math.max(0, Math.min(1, v)) * (CANVAS_H - 8);

  ctx.strokeStyle = "rgba(255, 145, 200, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  history.forEach((s, i) => {
    const x = xOf(s.generation);
    const y = yOf(s.avgFitness);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.strokeStyle = "#ff66aa";
  ctx.lineWidth = 2;
  ctx.beginPath();
  history.forEach((s, i) => {
    const x = xOf(s.generation);
    const y = yOf(s.bestFitness);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

export default function EvolutionDemoClient() {
  const [seed, setSeed] = useState(1);
  const [gen, setGen] = useState(0);
  const [population, setPopulation] = useState<EvolveSubject[]>(() =>
    buildInitial(1),
  );
  const [history, setHistory] = useState<GenerationSnapshot[]>(() => [
    initialSnapshot(buildInitial(1)),
  ]);
  const [running, setRunning] = useState(false);

  const rngRef = useRef<() => number>(seededRng(2));
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const runCancelRef = useRef(false);

  const stepOnce = useCallback(() => {
    setPopulation((prev) => {
      const result = evolve<EvolveSubject>({
        initial: prev,
        crossover: uniformCrossover,
        mutate: gaussianMutate,
        fitness,
        select: selectTournament,
        generations: 1,
        populationSize: POPULATION_SIZE,
        seed: Math.floor(rngRef.current() * 0x7fffffff),
      });
      const nextGen = result.history[result.history.length - 1];
      if (nextGen) {
        setHistory((h) => {
          const last = h[h.length - 1];
          const baseGen = last ? last.generation : 0;
          return [
            ...h,
            {
              generation: baseGen + 1,
              bestFitness: nextGen.bestFitness,
              avgFitness: nextGen.avgFitness,
            },
          ];
        });
      }
      setGen((g) => g + 1);
      return result.finalPopulation;
    });
  }, []);

  const runBatch = useCallback(() => {
    if (running) return;
    setRunning(true);
    runCancelRef.current = false;
    let done = 0;
    const tick = () => {
      if (runCancelRef.current) {
        setRunning(false);
        return;
      }
      const chunk = Math.min(BATCH_CHUNK, RUN_BATCH - done);
      for (let i = 0; i < chunk; i++) stepOnce();
      done += chunk;
      if (done >= RUN_BATCH) {
        setRunning(false);
        return;
      }
      window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  }, [running, stepOnce]);

  const reset = useCallback(() => {
    runCancelRef.current = true;
    setRunning(false);
    rngRef.current = seededRng(seed + 1);
    const fresh = buildInitial(seed);
    setPopulation(fresh);
    setGen(0);
    setHistory([initialSnapshot(fresh)]);
  }, [seed]);

  useEffect(() => {
    runCancelRef.current = true;
    setRunning(false);
    rngRef.current = seededRng(seed + 1);
    const fresh = buildInitial(seed);
    setPopulation(fresh);
    setGen(0);
    setHistory([initialSnapshot(fresh)]);
  }, [seed]);

  const { best, score: bestScore } = useMemo(
    () => findBest(population),
    [population],
  );

  useEffect(() => {
    const canvas = chartRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    paintChart(ctx, history);
  }, [history]);

  const bestGenes = best.genome.genes;

  return (
    <div className="mt-12 flex flex-col gap-6">
      <div className="rounded-sm border border-warm-black-800 bg-warm-black-950 p-4">
        <div className="mb-2 flex items-baseline justify-between text-xs text-chrome-400">
          <span className="chrome-label">
            best &amp; avg fitness per generation
          </span>
          <span className="font-mono">
            gen {gen} &middot; best {bestScore.toFixed(4)}
          </span>
        </div>
        <canvas
          ref={chartRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="block h-[280px] w-full"
        />
      </div>

      <div className="rounded-sm border border-warm-black-800 bg-warm-black-950 p-4">
        <div className="mb-3 flex items-baseline justify-between text-xs text-chrome-400">
          <span className="chrome-label">
            leading individual &middot; 28 normalised genes
          </span>
          <span className="font-mono text-chrome-500">
            {best.genome.sequenceId}
          </span>
        </div>
        <div className="flex h-24 items-end gap-1">
          {bestGenes.map((gene, i) => {
            const v =
              typeof gene.value === "number"
                ? Math.max(0, Math.min(1, gene.value))
                : 0;
            return (
              <div
                key={`${gene.id}-${i}`}
                title={`${gene.id} = ${v.toFixed(3)}`}
                className="flex-1 bg-pink-300/70"
                style={{ height: `${Math.max(2, v * 100)}%` }}
              />
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <button
          type="button"
          onClick={stepOnce}
          disabled={running}
          className="rounded-sm border border-pink-200/40 bg-pink-200/10 px-4 py-2 text-pink-100 hover:border-pink-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          step 1
        </button>
        <button
          type="button"
          onClick={runBatch}
          disabled={running}
          className="rounded-sm border border-pink-200/40 bg-pink-200/10 px-4 py-2 text-pink-100 hover:border-pink-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {running ? "running…" : "run 50"}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={running}
          className="rounded-sm border border-warm-black-800 px-4 py-2 text-chrome-300 hover:border-pink-200/60 hover:text-pink-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          reset
        </button>

        <label className="ml-2 flex items-center gap-2 text-chrome-300">
          <span className="chrome-label">seed</span>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value) || 0)}
            className="w-24 rounded-sm border border-warm-black-800 bg-warm-black-950 px-3 py-1 font-mono text-chrome-100 outline-none focus:border-pink-200/60"
          />
        </label>
      </div>
    </div>
  );
}

"use client";

/**
 * components/play/scenes/witness-scene.tsx — Solo 4, "The Witness."
 *
 * Aura watches the visitor's trail and reports what she sees with no priming.
 * The cold-eye reading is a deterministic narration generator at v0.1 —
 * geometric heuristics over the trail (length, mean direction, curvature,
 * velocity, self-intersection) map to a pool of Aura-register observations.
 * No Gemini call; an async API hit per drawing second is wrong on cost & UX.
 *
 * Pass-condition: the visitor reads the summary, accepts it (button) or
 * redraws. The lesson lands on the gap between intent and trace.
 *
 * Logic in `./witness-scene-narration.ts`; pointer surface in
 * `./witness-scene-draw-surface.tsx`; presentational overlays in
 * `./witness-scene-overlay.tsx`.
 */

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { TrailLine } from "../trail-line";

import { MouseDrawSurface } from "./witness-scene-draw-surface";
import {
  MAX_TRAIL_VERTICES,
  NARRATION_INTERVAL_MS,
  computeHeuristics,
  pickObservation,
  summaryFor,
  type Observation,
} from "./witness-scene-narration";
import {
  LessonFooter,
  NarrationOverlay,
  ReviewPanel,
} from "./witness-scene-overlay";

type Phase = "draw" | "review";

export function WitnessScene() {
  const [phase, setPhase] = useState<Phase>("draw");
  const [points, setPoints] = useState<THREE.Vector3[]>([]);
  const [times, setTimes] = useState<number[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const gestureStart = useRef<number>(0);
  const observationsSeen = useRef<Set<string>>(new Set());

  const appendPoint = useCallback((p: THREE.Vector3, t: number) => {
    setPoints((prev) => {
      const next =
        prev.length >= MAX_TRAIL_VERTICES
          ? prev.slice(prev.length - MAX_TRAIL_VERTICES + 1)
          : prev.slice();
      next.push(p);
      return next;
    });
    setTimes((prev) => {
      const next =
        prev.length >= MAX_TRAIL_VERTICES
          ? prev.slice(prev.length - MAX_TRAIL_VERTICES + 1)
          : prev.slice();
      next.push(t);
      return next;
    });
  }, []);

  const onGestureStart = useCallback(() => {
    setDrawing(true);
    setObservations([]);
    setPoints([]);
    setTimes([]);
    setPhase("draw");
    setAccepted(false);
    observationsSeen.current = new Set();
    gestureStart.current = performance.now();
  }, []);

  const onCommit = useCallback(() => {
    setDrawing(false);
    setPhase("review");
  }, []);

  const pointsRef = useRef(points);
  pointsRef.current = points;
  const timesRef = useRef(times);
  timesRef.current = times;

  useEffect(() => {
    if (!drawing) return;
    const id = window.setInterval(() => {
      setObservations((current) => {
        const ps = pointsRef.current;
        const ts = timesRef.current;
        if (ps.length < 8) return current;
        const h = computeHeuristics({ points: ps, times: ts });
        const elapsed = (performance.now() - gestureStart.current) / 1000;
        const next = pickObservation(h, observationsSeen.current, elapsed);
        if (!next) return current;
        observationsSeen.current.add(next.text);
        return [...current, next];
      });
    }, NARRATION_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [drawing]);

  const heuristics = useMemo(
    () => computeHeuristics({ points, times }),
    [points, times],
  );
  const summary = useMemo(() => summaryFor(heuristics), [heuristics]);

  const reset = useCallback(() => {
    setPoints([]);
    setTimes([]);
    setObservations([]);
    setPhase("draw");
    setAccepted(false);
    observationsSeen.current = new Set();
  }, []);

  const accept = useCallback(() => {
    setAccepted(true);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("holoflow.play.witness.passed", "1");
      } catch {
        // localStorage may be unavailable.
      }
    }
  }, []);

  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
      <div className="chrome-label mb-3 text-pink-200">
        Witness level &middot; preview
      </div>
      <p className="mb-6 max-w-prose text-sm text-chrome-300">
        Aura watches your trail with no priming. She describes what is on the
        canvas, not what you intended. The gap between intent and trace is the
        lesson.
      </p>

      <div className="relative h-[60vh] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-[#0c0a12]">
        <div className="absolute right-3 top-3 z-10 flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 text-[0.6rem] text-chrome-300 hover:text-pink-200"
          >
            Reset
          </button>
        </div>

        <Canvas
          camera={{ position: [0, 0, 2.4], fov: 55 }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
          }}
        >
          <color attach="background" args={["#0c0a12"]} />
          <gridHelper
            args={[10, 20, "#1a1530", "#13101e"]}
            position={[0, -1.2, 0]}
          />
          {points.length > 1 ? (
            <TrailLine points={points} maxVertices={MAX_TRAIL_VERTICES} />
          ) : null}
          <MouseDrawSurface
            active={phase === "draw" || (phase === "review" && !accepted)}
            onPoint={appendPoint}
            onCommit={onCommit}
            onGestureStart={onGestureStart}
          />
        </Canvas>

        <NarrationOverlay observations={observations} />
      </div>

      {phase === "review" ? (
        <ReviewPanel
          summary={summary}
          accepted={accepted}
          onAccept={accept}
          onReset={reset}
        />
      ) : null}

      <LessonFooter />
    </div>
  );
}

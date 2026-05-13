"use client";

import { Canvas, useThree } from "@react-three/fiber";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

import { TrailLine } from "../trail-line";
import { chronoModes } from "lib/chrono-protocol";

/**
 * WitnessScene &mdash; Solo 4, "The Witness."
 *
 * Aura watches the visitor&rsquo;s trail and reports what she sees
 * with no priming. The cold-eye reading is a deterministic narration
 * generator at v0.1 &mdash; geometric heuristics over the trail
 * (length, mean direction, curvature, velocity, self-intersection)
 * map to a pool of Aura-register observations. No Gemini call; an
 * async API hit per drawing second is wrong on cost and on UX.
 *
 * Each observation is colour-coded by the gesture trait it names,
 * borrowing the Beat-Saber mode-coded-targets pattern adapted to the
 * five-mode chrono palette: AMBER for kinetic, AZURE for slow-flow,
 * AMETHYST for rupture, CRIMSON for force, VERIDIAN for pattern.
 * The colour-coding is the bridge between this level&rsquo;s lesson
 * (intent vs trace) and the chrono protocol the studio is shipping
 * into.
 *
 * Pass-condition: the visitor reads the summary, accepts it (button)
 * or redraws. The lesson lands on the gap between what they wanted
 * and what the trail actually says.
 *
 * The audio synth pass (ElevenLabs + viseme) is queued. When wired,
 * each observation will also be spoken in Aura&rsquo;s voice. For
 * v0.1 text-only is honest about the prototype state.
 */

const MAX_TRAIL_VERTICES = 2000;
const TRAIL_PLANE_DISTANCE = 1;
const NARRATION_INTERVAL_MS = 1100;
const MIN_VERTICES_FOR_SUMMARY = 40;

type ChronoSlug =
  | "amber"
  | "azure"
  | "amethyst"
  | "crimson"
  | "veridian";

type Observation = {
  /** The observation text, Aura register. */
  text: string;
  /** Which chrono mode the observation reads as. */
  mode: ChronoSlug;
  /** Monotonic timestamp this observation was generated. */
  t: number;
};

function modeHex(slug: ChronoSlug): string {
  return chronoModes.find((m) => m.slug === slug)?.hexColor ?? "#cccccc";
}

function MouseDrawSurface({
  active,
  onPoint,
  onCommit,
  onGestureStart,
}: {
  active: boolean;
  onPoint: (p: THREE.Vector3, t: number) => void;
  onCommit: () => void;
  onGestureStart: () => void;
}) {
  const { camera, gl } = useThree();
  const drawing = useRef(false);
  const raycaster = useRef(new THREE.Raycaster());
  const plane = useRef(
    new THREE.Plane(new THREE.Vector3(0, 0, 1), TRAIL_PLANE_DISTANCE),
  );

  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.current.setFromCamera(ndc, camera);
      const planeNormal = new THREE.Vector3(0, 0, -1)
        .applyQuaternion(camera.quaternion)
        .normalize();
      const planePoint = camera.position
        .clone()
        .add(planeNormal.clone().multiplyScalar(TRAIL_PLANE_DISTANCE));
      plane.current.setFromNormalAndCoplanarPoint(planeNormal, planePoint);
      const hit = new THREE.Vector3();
      raycaster.current.ray.intersectPlane(plane.current, hit);
      return hit;
    },
    [camera, gl],
  );

  useEffect(() => {
    const el = gl.domElement;
    if (!active) return;

    const handleDown = (e: PointerEvent) => {
      drawing.current = true;
      el.setPointerCapture(e.pointerId);
      onGestureStart();
      onPoint(screenToWorld(e.clientX, e.clientY), e.timeStamp);
    };
    const handleMove = (e: PointerEvent) => {
      if (!drawing.current) return;
      onPoint(screenToWorld(e.clientX, e.clientY), e.timeStamp);
    };
    const handleUp = (e: PointerEvent) => {
      if (!drawing.current) return;
      drawing.current = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // pointer already released.
      }
      onCommit();
    };

    el.addEventListener("pointerdown", handleDown);
    el.addEventListener("pointermove", handleMove);
    el.addEventListener("pointerup", handleUp);
    el.addEventListener("pointercancel", handleUp);

    return () => {
      el.removeEventListener("pointerdown", handleDown);
      el.removeEventListener("pointermove", handleMove);
      el.removeEventListener("pointerup", handleUp);
      el.removeEventListener("pointercancel", handleUp);
    };
  }, [active, gl, onCommit, onPoint, onGestureStart, screenToWorld]);

  return null;
}

type TrailWithTime = {
  points: THREE.Vector3[];
  times: number[];
};

type Heuristics = {
  /** Trail length in metres. */
  arcLength: number;
  /** Net translation magnitude. */
  netTranslation: number;
  /** Number of detected "turns" (curvature spikes). */
  turnCount: number;
  /** Mean speed in m/s. */
  meanSpeed: number;
  /** Lowest speed seen during the gesture (m/s). */
  minSpeed: number;
  /** Highest speed seen during the gesture (m/s). */
  maxSpeed: number;
  /** Whether the trail visibly crosses itself. */
  selfIntersects: boolean;
  /** Dominant compass direction text. */
  dominantDirection: string;
  /** Number of vertices. */
  vertexCount: number;
  /** Duration of the gesture in seconds. */
  durationS: number;
};

function compassFromVector(dx: number, dy: number): string {
  // R3F screen coords: positive y = up. Map to compass.
  const angle = Math.atan2(dy, dx);
  const deg = (angle * 180) / Math.PI;
  if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) return "no settled direction";
  if (deg >= -22.5 && deg < 22.5) return "rightward";
  if (deg >= 22.5 && deg < 67.5) return "up and to the right";
  if (deg >= 67.5 && deg < 112.5) return "upward";
  if (deg >= 112.5 && deg < 157.5) return "up and to the left";
  if (deg >= -67.5 && deg < -22.5) return "down and to the right";
  if (deg >= -112.5 && deg < -67.5) return "downward";
  if (deg >= -157.5 && deg < -112.5) return "down and to the left";
  return "leftward";
}

function computeHeuristics(trail: TrailWithTime): Heuristics {
  const { points, times } = trail;
  if (points.length < 2) {
    return {
      arcLength: 0,
      netTranslation: 0,
      turnCount: 0,
      meanSpeed: 0,
      minSpeed: 0,
      maxSpeed: 0,
      selfIntersects: false,
      dominantDirection: "no settled direction",
      vertexCount: points.length,
      durationS: 0,
    };
  }
  let arcLength = 0;
  let turnCount = 0;
  const speeds: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    const step = Math.sqrt(dx * dx + dy * dy + dz * dz);
    arcLength += step;
    const dt = Math.max(1e-3, (times[i]! - times[i - 1]!) / 1000);
    speeds.push(step / dt);
  }
  // Curvature: count direction changes greater than ~30 degrees.
  for (let i = 2; i < points.length; i++) {
    const a = points[i - 2]!;
    const b = points[i - 1]!;
    const c = points[i]!;
    const ax = b.x - a.x,
      ay = b.y - a.y;
    const bx = c.x - b.x,
      by = c.y - b.y;
    const na = Math.hypot(ax, ay) || 1e-6;
    const nb = Math.hypot(bx, by) || 1e-6;
    const dot = (ax * bx + ay * by) / (na * nb);
    if (dot < 0.85) turnCount++;
  }
  const net = points[points.length - 1]!.clone().sub(points[0]!);
  const netTranslation = net.length();
  const meanSpeed =
    speeds.reduce((s, v) => s + v, 0) / Math.max(1, speeds.length);
  const minSpeed = Math.min(...speeds);
  const maxSpeed = Math.max(...speeds);
  // Self-intersection: very cheap O(n) approximation &mdash; the
  // trail&rsquo;s arc length far exceeds its net translation.
  const selfIntersects = arcLength > netTranslation * 3 && points.length > 100;
  const durationS = Math.max(
    0,
    (times[times.length - 1]! - times[0]!) / 1000,
  );
  return {
    arcLength,
    netTranslation,
    turnCount,
    meanSpeed,
    minSpeed,
    maxSpeed,
    selfIntersects,
    dominantDirection: compassFromVector(net.x, net.y),
    vertexCount: points.length,
    durationS,
  };
}

/**
 * Decide which observation to emit, based on the most recent
 * heuristics + a "what has Aura already said" set to avoid repetition.
 */
function pickObservation(
  h: Heuristics,
  alreadySaid: Set<string>,
  elapsedS: number,
): Observation | null {
  type Candidate = {
    text: string;
    mode: ChronoSlug;
    priority: number;
  };

  const candidates: Candidate[] = [];

  if (elapsedS < 1.2) {
    candidates.push({
      text: `A trail beginning. The line moves ${h.dominantDirection}.`,
      mode: "azure",
      priority: 1,
    });
  }
  if (h.turnCount >= 1 && h.turnCount < 4) {
    candidates.push({
      text: "The line turns &mdash; sharper than the segment before it.",
      mode: "amethyst",
      priority: 2,
    });
  }
  if (h.turnCount >= 4 && h.turnCount < 10) {
    candidates.push({
      text: "Several turns now. The line is not committing to one direction.",
      mode: "amethyst",
      priority: 3,
    });
  }
  if (h.turnCount >= 10) {
    candidates.push({
      text: "The line is restless. Many turns. Whatever pattern is here, it is hard to name.",
      mode: "amethyst",
      priority: 3,
    });
  }
  if (h.minSpeed < 0.05 && h.vertexCount > 30) {
    candidates.push({
      text: "The hand slowed. The line is breathing.",
      mode: "azure",
      priority: 2,
    });
  }
  if (h.maxSpeed > 2 && h.meanSpeed > 1) {
    candidates.push({
      text: "The line is moving with speed. The trail comes out kinetic.",
      mode: "amber",
      priority: 2,
    });
  }
  if (h.selfIntersects) {
    candidates.push({
      text: "A return. The line has met its own past.",
      mode: "veridian",
      priority: 4,
    });
  }
  if (
    h.netTranslation > 0.5 &&
    h.arcLength / Math.max(1e-3, h.netTranslation) < 1.4 &&
    h.vertexCount > 60
  ) {
    candidates.push({
      text: `The line travels far in one direction, mostly ${h.dominantDirection}.`,
      mode: "veridian",
      priority: 3,
    });
  }
  if (
    h.arcLength > 1 &&
    h.maxSpeed - h.minSpeed > 2 &&
    h.vertexCount > 80
  ) {
    candidates.push({
      text: "The pace breaks. The line was steady, then it shoved.",
      mode: "crimson",
      priority: 3,
    });
  }
  if (h.turnCount > 0 && h.vertexCount > 150) {
    candidates.push({
      text: "Pattern, perhaps. The same turn appears again.",
      mode: "veridian",
      priority: 3,
    });
  }

  const fresh = candidates.filter((c) => !alreadySaid.has(c.text));
  if (fresh.length === 0) return null;
  fresh.sort((a, b) => b.priority - a.priority);
  const top = fresh[0]!;
  return { text: top.text, mode: top.mode, t: performance.now() };
}

function summaryFor(h: Heuristics): string {
  if (h.vertexCount < MIN_VERTICES_FOR_SUMMARY) {
    return "The trail is too short to say anything settled. Draw a little more.";
  }
  const shape = h.selfIntersects
    ? "a knotted figure"
    : h.turnCount >= 4
      ? "a winding line"
      : h.turnCount >= 1
        ? "a curving line"
        : "a straight line";
  const pace =
    h.meanSpeed > 1.5
      ? "quickly"
      : h.meanSpeed > 0.6
        ? "at a moderate pace"
        : "slowly";
  return `What I saw: ${shape}, drawn ${pace}, with ${h.turnCount} turn${
    h.turnCount === 1 ? "" : "s"
  } over ${h.vertexCount} samples.`;
}

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

  // While drawing, run the narration loop once a second.
  useEffect(() => {
    if (!drawing) return;
    const id = window.setInterval(() => {
      // Snapshot the latest trail and run heuristics on it.
      // We pull from React state via the function form below.
      setObservations((current) => {
        // Use the current snapshot of points/times via closure
        // refs. To avoid TDZ on points/times here, we read from
        // the outer scope by checking lengths.
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

  // Refs so the interval reads the latest trail without re-binding.
  const pointsRef = useRef(points);
  pointsRef.current = points;
  const timesRef = useRef(times);
  timesRef.current = times;

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
        Aura watches your trail with no priming. She describes what is
        on the canvas, not what you intended. The gap between intent
        and trace is the lesson.
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

        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 max-w-md rounded-sm border border-pink-200/40 bg-warm-black-950/90 p-4 backdrop-blur-sm md:max-w-sm">
          <div className="chrome-label mb-2 text-pink-200">
            What Aura sees
          </div>
          {observations.length === 0 ? (
            <p className="text-xs italic text-chrome-400">
              Draw a trail. Aura will narrate as you go.
            </p>
          ) : (
            <ul className="space-y-1.5 text-xs leading-relaxed text-chrome-200">
              {observations.map((obs, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    className="mt-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full"
                    aria-hidden
                    ref={(el) => {
                      if (el) el.style.backgroundColor = modeHex(obs.mode);
                    }}
                  />
                  <span dangerouslySetInnerHTML={{ __html: obs.text }} />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[0.6rem] uppercase tracking-[0.18em] text-chrome-500">
            Cold-eye reading &middot; deterministic heuristics &middot;
            audio synth pending
          </p>
        </div>
      </div>

      {phase === "review" ? (
        <div className="mt-5 rounded-sm border border-pink-200/40 bg-pink-200/[0.04] p-5">
          <div className="chrome-label mb-2 text-pink-200">
            Aura&rsquo;s summary
          </div>
          <p className="text-sm text-chrome-200">{summary}</p>
          <p className="mt-3 text-xs text-chrome-400">
            Compare this to what you intended. The gap between intent
            and trace is the level. Accept what the trail actually
            says, or redraw &mdash; both are passes.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={accept}
              disabled={accepted}
              className={
                accepted
                  ? "chrome-label rounded-sm border border-pink-200/30 bg-pink-200/[0.06] px-3 py-1.5 text-[0.6rem] text-chrome-400"
                  : "chrome-label rounded-sm border border-pink-200/50 bg-pink-200/10 px-3 py-1.5 text-[0.6rem] text-pink-200 hover:bg-pink-200/20"
              }
            >
              {accepted ? "Accepted" : "Accept what the trail says"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 text-[0.6rem] text-chrome-300 hover:text-pink-200"
            >
              Redraw
            </button>
          </div>
          {accepted ? (
            <p className="mt-3 text-xs text-pink-200">
              Pass &mdash; the body has seen its own trace.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 rounded-sm border border-warm-black-700 bg-warm-black-900/40 p-4">
        <p className="text-xs leading-relaxed text-chrome-400">
          The narration runs on geometric heuristics &mdash; arc
          length, curvature spikes, speed, self-intersection. Each
          observation is colour-coded by which chrono mode the gesture
          trait reads as (AMBER kinetic, AZURE slow-flow, AMETHYST
          rupture, CRIMSON force, VERIDIAN pattern). The Gemini
          cold-eye prompt and ElevenLabs voice synth land in v0.2; the
          v0.1 narration is deterministic on purpose, to keep the
          lesson on the gap between intent and trace rather than on
          the API.
        </p>
        <Link
          href="/watch"
          className="chrome-label mt-3 inline-block text-chrome-500 underline-offset-4 hover:text-pink-200 hover:underline"
        >
          /watch &mdash; Aura&rsquo;s eyes on video &rarr;
        </Link>
      </div>
    </div>
  );
}

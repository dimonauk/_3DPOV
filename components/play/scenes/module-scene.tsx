"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { TrailLine } from "../trail-line";

/**
 * ModuleScene — Solo 1, "The Module."
 *
 * The level&rsquo;s thesis is modular-first: pick the rig before you
 * swing it. Four brush modules (thin line, fat brush, dotted, additive
 * smear), one prompt drawn from a small bank, and a pass-condition that
 * gates on the module choice, not the drawing accuracy.
 *
 * This is Tilt Brush&rsquo;s curated-palette philosophy at v0.1 scale:
 * four brushes, each chosen for clear differentiation. The roadmap in
 * docs/PLAY_GAME_PLAN.md names the v0.2 expansion to ~20 and the v0.3+
 * Rookery-tier path for community-contributed brushes.
 *
 * The pass-condition is the module choice. Pick the right tool, pass.
 * Pick the wrong tool, no matter how well the trail is drawn, fail.
 * The lesson lands on the modular-first thesis &mdash; not on
 * draftsmanship.
 *
 * Persists the passed module to localStorage under
 * `holoflow.play.module.choice` so the Trail level can read it and
 * render with the matching brush parameters.
 */

const MAX_TRAIL_VERTICES = 2000;
const TRAIL_PLANE_DISTANCE = 1;
const MIN_VERTICES_TO_SUBMIT = 32;

type BrushSlug = "thin" | "fat" | "dotted" | "additive";

type Brush = {
  slug: BrushSlug;
  name: string;
  blurb: string;
  /** Hex colour for the live trail. */
  color: string;
  /** Trail opacity (additive blending; values >1 read as brighter). */
  opacity: number;
  /** Multiplier for sampled point density on draw &mdash; "dotted" thins the stream. */
  pointKeepRate: number;
};

/**
 * Tailwind tint per brush slug, used for the card title when the
 * brush is the active selection. Kept as a static map so the brush
 * card avoids an inline style.
 */
const BRUSH_NAME_TINT: Record<BrushSlug, string> = {
  thin: "text-[#00f3ff]",
  fat: "text-[#ffb3d9]",
  dotted: "text-chrome-100",
  additive: "text-[#ffcc66]",
};

const BRUSHES: Brush[] = [
  {
    slug: "thin",
    name: "Thin line",
    blurb:
      "One-pixel chrome curve. The default trail &mdash; good for diagrams, calligraphy, anything that wants the gesture read as a path.",
    color: "#00f3ff",
    opacity: 0.9,
    pointKeepRate: 1,
  },
  {
    slug: "fat",
    name: "Fat brush",
    blurb:
      "Wide additive stroke. For mass &mdash; a sword, a beam, a thrown shape. The same module the bench uses for the silhouette pieces.",
    color: "#ffb3d9",
    opacity: 0.95,
    pointKeepRate: 1,
  },
  {
    slug: "dotted",
    name: "Dotted",
    blurb:
      "Discrete marks, one per pointer-frame. Reads as rhythm &mdash; staccato gestures, beats, the persistence-of-vision counter-example.",
    color: "#e6e6e6",
    opacity: 1,
    pointKeepRate: 0.18,
  },
  {
    slug: "additive",
    name: "Additive smear",
    blurb:
      "Long-exposure simulation. The trail accumulates and bleeds; the brush is closer to fire poi than to a pen. Bright where the body lingered.",
    color: "#ffcc66",
    opacity: 0.7,
    pointKeepRate: 1,
  },
];

type Prompt = {
  /** Short instruction the player reads. */
  text: string;
  /** Which brush is the right one for this prompt. */
  correct: BrushSlug;
  /** One-line reason, shown on pass or fail. */
  reason: string;
};

const PROMPTS: Prompt[] = [
  {
    text: "Draw a sword.",
    correct: "thin",
    reason:
      "A sword is a line. The blade reads as edge &mdash; the thin line is the edge module.",
  },
  {
    text: "Draw a beam of light.",
    correct: "fat",
    reason:
      "A beam has mass and breadth. The fat brush carries the body of the beam; a thin line is only its centre.",
  },
  {
    text: "Draw a fire trail.",
    correct: "additive",
    reason:
      "Fire reads through long exposure, brightest where the body lingers. The additive smear is the fire module.",
  },
  {
    text: "Draw a field of stars.",
    correct: "dotted",
    reason:
      "A star field is discrete marks. The dotted module is the only one that gives the gaps as well as the points.",
  },
  {
    text: "Draw a thrown shape.",
    correct: "fat",
    reason:
      "A throw has weight. The fat brush carries the mass; a thin line reads as a thread, not a thrown object.",
  },
  {
    text: "Draw a calligraphic curve.",
    correct: "thin",
    reason:
      "Calligraphy is the path itself. The thin line is the path module.",
  },
  {
    text: "Draw a glow.",
    correct: "additive",
    reason:
      "A glow is light that bleeds. The additive smear bleeds; the other modules only mark.",
  },
  {
    text: "Draw a rhythm of beats.",
    correct: "dotted",
    reason:
      "Beats are discrete. The dotted module is the rhythm; the others are continuous.",
  },
];

const MODULE_CHOICE_STORAGE_KEY = "holoflow.play.module.choice";
const MODULE_PASS_STORAGE_KEY = "holoflow.play.module.passed";

function pickPrompt(): Prompt {
  const i = Math.floor(Math.random() * PROMPTS.length);
  return PROMPTS[i] ?? PROMPTS[0]!;
}

function MouseDrawSurface({
  active,
  onPoint,
  brush,
}: {
  active: boolean;
  onPoint: (p: THREE.Vector3) => void;
  brush: Brush;
}) {
  const { camera, gl } = useThree();
  const drawing = useRef(false);
  const sampleCounter = useRef(0);
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

    const accept = (clientX: number, clientY: number) => {
      // The "dotted" module thins its sample rate so the trail is the
      // discrete-marks brush the picker promises. Other modules keep
      // every sample.
      sampleCounter.current += 1;
      const keep = Math.max(0.01, brush.pointKeepRate);
      if (keep < 1) {
        const stride = Math.round(1 / keep);
        if (sampleCounter.current % stride !== 0) return;
      }
      onPoint(screenToWorld(clientX, clientY));
    };

    const handleDown = (e: PointerEvent) => {
      drawing.current = true;
      sampleCounter.current = 0;
      el.setPointerCapture(e.pointerId);
      accept(e.clientX, e.clientY);
    };
    const handleMove = (e: PointerEvent) => {
      if (!drawing.current) return;
      accept(e.clientX, e.clientY);
    };
    const handleUp = (e: PointerEvent) => {
      if (!drawing.current) return;
      drawing.current = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // pointer already released.
      }
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
  }, [active, gl, onPoint, screenToWorld, brush.pointKeepRate]);

  return null;
}

function FloorReference() {
  return (
    <gridHelper
      args={[10, 20, "#1a1530", "#13101e"]}
      position={[0, -1.2, 0]}
    />
  );
}

type Verdict =
  | { kind: "idle" }
  | { kind: "pass"; brush: Brush; prompt: Prompt }
  | { kind: "fail"; chose: Brush; prompt: Prompt };

export function ModuleScene() {
  const [prompt, setPrompt] = useState<Prompt>(() => pickPrompt());
  const [selected, setSelected] = useState<BrushSlug>("thin");
  const [points, setPoints] = useState<THREE.Vector3[]>([]);
  const [verdict, setVerdict] = useState<Verdict>({ kind: "idle" });

  const brush = useMemo(
    () => BRUSHES.find((b) => b.slug === selected) ?? BRUSHES[0]!,
    [selected],
  );

  // Single appendPoint, captures the live brush by ref so the surface
  // doesn&rsquo;t remount on every selection flip.
  const brushRef = useRef(brush);
  brushRef.current = brush;

  const appendPoint = useCallback((p: THREE.Vector3) => {
    setPoints((prev) => {
      const next =
        prev.length >= MAX_TRAIL_VERTICES
          ? prev.slice(prev.length - MAX_TRAIL_VERTICES + 1)
          : prev.slice();
      next.push(p);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setPoints([]);
    setVerdict({ kind: "idle" });
  }, []);

  const reroll = useCallback(() => {
    setPrompt(pickPrompt());
    setPoints([]);
    setVerdict({ kind: "idle" });
  }, []);

  const submit = useCallback(() => {
    if (points.length < MIN_VERTICES_TO_SUBMIT) {
      setVerdict({
        kind: "fail",
        chose: brush,
        prompt: {
          ...prompt,
          reason:
            "The trail is too short to read. Pick a module and draw the prompt before submitting.",
        },
      });
      return;
    }
    if (brush.slug === prompt.correct) {
      setVerdict({ kind: "pass", brush, prompt });
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(MODULE_CHOICE_STORAGE_KEY, brush.slug);
          window.localStorage.setItem(MODULE_PASS_STORAGE_KEY, "1");
        } catch {
          // localStorage may be unavailable; the pass still reads in-session.
        }
      }
    } else {
      setVerdict({ kind: "fail", chose: brush, prompt });
    }
  }, [brush, points.length, prompt]);

  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
      <div className="chrome-label mb-3 text-pink-200">
        Module level &middot; preview
      </div>

      <div className="mb-5 rounded-sm border border-pink-200/30 bg-pink-200/[0.04] p-4">
        <div className="chrome-label mb-1 text-chrome-500">Prompt</div>
        <p className="text-lg text-chrome-100">{prompt.text}</p>
        <p className="mt-2 max-w-prose text-xs text-chrome-400">
          Pick the module that fits the prompt before you swing.
          That choice is the gesture &mdash; the drawing is its echo.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {BRUSHES.map((b) => {
          const isActive = b.slug === selected;
          return (
            <button
              key={b.slug}
              type="button"
              onClick={() => setSelected(b.slug)}
              className={
                isActive
                  ? "rounded-sm border border-pink-200/60 bg-pink-200/5 p-4 text-left transition-colors"
                  : "rounded-sm border border-warm-black-700 bg-warm-black-900/60 p-4 text-left transition-colors hover:border-pink-200/40"
              }
            >
              <div className="chrome-label text-chrome-500">
                {isActive ? "Selected" : "Module"}
              </div>
              <div
                className={
                  isActive
                    ? `mt-1 text-lg ${BRUSH_NAME_TINT[b.slug]}`
                    : "mt-1 text-lg text-chrome-300"
                }
              >
                {b.name}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-chrome-400">
                {b.blurb}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-6 relative h-[50vh] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-[#0c0a12]">
        <div className="pointer-events-none absolute left-3 top-3 z-10">
          <div className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 text-[0.6rem] text-chrome-400">
            {points.length} vertices &middot; {brush.name}
          </div>
        </div>
        <div className="absolute right-3 top-3 z-10 flex gap-2">
          <button
            type="button"
            onClick={clear}
            className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 text-[0.6rem] text-chrome-300 hover:text-pink-200"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={submit}
            className="chrome-label rounded-sm border border-pink-200/50 bg-pink-200/10 px-3 py-1.5 text-[0.6rem] text-pink-200 hover:bg-pink-200/20"
          >
            Submit
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
          <FloorReference />
          {points.length > 1 ? (
            <TrailLine
              points={points}
              maxVertices={MAX_TRAIL_VERTICES}
              color={brush.color}
              opacity={brush.opacity}
            />
          ) : null}
          <MouseDrawSurface active onPoint={appendPoint} brush={brush} />
        </Canvas>
      </div>

      {verdict.kind === "pass" ? (
        <div className="mt-5 rounded-sm border border-pink-200/60 bg-pink-200/[0.06] p-5">
          <div className="chrome-label mb-2 text-pink-200">
            Pass &middot; the module fits
          </div>
          <p className="text-sm text-chrome-200">
            {verdict.prompt.reason} The module choice is the gesture.
            The trail is its echo.
          </p>
          <p className="mt-3 text-xs text-chrome-400">
            Saved your module choice. The Trail level will draw with
            the {verdict.brush.name.toLowerCase()} when you arrive.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={reroll}
              className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 text-[0.6rem] text-chrome-300 hover:text-pink-200"
            >
              New prompt
            </button>
          </div>
        </div>
      ) : null}

      {verdict.kind === "fail" ? (
        <div className="mt-5 rounded-sm border border-warm-black-700 bg-warm-black-900/60 p-5">
          <div className="chrome-label mb-2 text-chrome-300">
            Try again &middot; wrong tool
          </div>
          <p className="text-sm text-chrome-200">{verdict.prompt.reason}</p>
          <p className="mt-3 text-xs text-chrome-400">
            You chose {verdict.chose.name.toLowerCase()}. The level
            cannot pass without the right module &mdash; that is the
            modular-first thesis.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={clear}
              className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 text-[0.6rem] text-chrome-300 hover:text-pink-200"
            >
              Clear the trail
            </button>
            <button
              type="button"
              onClick={reroll}
              className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 text-[0.6rem] text-chrome-300 hover:text-pink-200"
            >
              New prompt
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

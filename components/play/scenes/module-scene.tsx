"use client";

/**
 * components/play/scenes/module-scene.tsx — Solo 1, "The Module."
 *
 * The level's thesis is modular-first: pick the rig before you swing it.
 * Four brush modules, one prompt from a small bank, pass-condition that
 * gates on the module choice — not on draftsmanship. Persists the passed
 * module to localStorage so the Trail level can read it.
 *
 * Pieces live in sibling modules:
 *   - `./module-scene-brushes`     — Brush registry + storage keys
 *   - `./module-scene-prompts`     — Prompt bank + pickPrompt()
 *   - `./module-scene-draw-surface`— pointer raycast, brush-aware stride
 *   - `./module-scene-overlays`    — PromptCard, BrushPicker, Pass/Fail
 */

import { Canvas } from "@react-three/fiber";
import { useCallback, useMemo, useState } from "react";
import * as THREE from "three";

import { TrailLine } from "../trail-line";

import {
  BRUSHES,
  MODULE_CHOICE_STORAGE_KEY,
  MODULE_PASS_STORAGE_KEY,
  type Brush,
  type BrushSlug,
} from "./module-scene-brushes";
import { MouseDrawSurface } from "./module-scene-draw-surface";
import {
  BrushPicker,
  FailPanel,
  FloorReference,
  PassPanel,
  PromptCard,
} from "./module-scene-overlays";
import { pickPrompt, type Prompt } from "./module-scene-prompts";

const MAX_TRAIL_VERTICES = 2000;
const MIN_VERTICES_TO_SUBMIT = 32;

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

      <PromptCard prompt={prompt} />

      <BrushPicker brushes={BRUSHES} selected={selected} onSelect={setSelected} />

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
        <PassPanel
          brush={verdict.brush}
          prompt={verdict.prompt}
          onReroll={reroll}
        />
      ) : null}

      {verdict.kind === "fail" ? (
        <FailPanel
          chose={verdict.chose}
          prompt={verdict.prompt}
          onClear={clear}
          onReroll={reroll}
        />
      ) : null}
    </div>
  );
}

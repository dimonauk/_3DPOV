"use client";

/**
 * components/pipelines/MoodFaceDemo.tsx — Live composition of the
 * `mood-face` pipeline (vrm.expressions.blend reading aura.mood).
 *
 * One-line role: render Aura, expose a mood picker, watch her face
 * shift on each selection. The composition is one capability deep but
 * proves the cross-slice read pattern works end-to-end without
 * audio or TTS in the loop.
 *
 * # The flow
 *
 *   1. VRMAvatar loads /dimona.vrm into the vrm slice via vrm.load.
 *   2. On mount, startBlend(VRM_ID) kicks the per-frame loop in
 *      vrm.expressions.blend. The loop reads audio.visemes (empty
 *      here — no TTS running) AND auraStore.mood, writes the
 *      combined weights into vrm.expressions.
 *   3. Click a mood button → auraStore.setMood(next) → next frame
 *      the blend loop reads the new mood and applies the
 *      faceForMood() weight set.
 *   4. VRMAvatar's useFrame applies expression weights to the VRM's
 *      expressionManager → the face shifts.
 *
 * Mouth slots stay at zero because audio.visemes is at REST — the
 * blend loop merges only mouth+face slots it owns and preserves
 * other expression keys (e.g. blink owned by motion.idle).
 *
 * # Cleanup
 *
 * Blend loop stopped on unmount. Mood reset to "neutral" on unmount
 * so navigating away doesn't leave Aura's mood pinned for whatever
 * other surface mounts next.
 */

import { useEffect, useMemo, useState } from "react";
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";

import { VRMAvatar } from "components/three/VRMAvatar";
import { useAuraStore, type AuraMood } from "lib/state/aura";
import {
  startBlend,
  stopBlend,
} from "lib/capabilities/vrm/expression";

const VRM_ID = "pipelines.mood-face.aura";

// Order = the order they appear in the picker. Matches the AuraMood
// union; "neutral" first as the reset state.
const MOODS: { id: AuraMood; label: string; glyph: string }[] = [
  { id: "neutral", label: "neutral", glyph: "·" },
  { id: "delighted", label: "delighted", glyph: "✦" },
  { id: "playful", label: "playful", glyph: "◇" },
  { id: "alert", label: "alert", glyph: "△" },
  { id: "focused", label: "focused", glyph: "◯" },
  { id: "tender", label: "tender", glyph: "♡" },
  { id: "agitated", label: "agitated", glyph: "⌇" },
];

export default function MoodFaceDemo() {
  // Subscribe to the mood so the picker highlights the active button.
  const mood = useAuraStore((s) => s.mood);
  const setMood = useAuraStore((s) => s.setMood);

  // Stable initial mood snapshot — restored on unmount so we don't
  // leave Aura's mood pinned for whatever mounts after navigation.
  const initialMood = useMemo(() => useAuraStore.getState().mood, []);

  useEffect(() => {
    startBlend(VRM_ID);
    return () => {
      stopBlend(VRM_ID);
      useAuraStore.getState().setMood(initialMood);
    };
  }, [initialMood]);

  return (
    <div className="grid gap-6 md:grid-cols-[2fr_3fr]">
      <Stage />

      <div className="flex flex-col gap-5">
        <div>
          <div className="chrome-label text-chrome-300">Mood</div>
          <p className="mt-2 text-sm text-chrome-300">
            Each button writes to <code className="text-chrome-100">aura.mood</code>.
            The blend loop notices on the next frame and rewrites the
            face slots in <code className="text-chrome-100">vrm.expressions</code>.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MOODS.map((m) => {
            const active = m.id === mood;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMood(m.id)}
                className={
                  active
                    ? "flex items-center justify-center gap-2 rounded-sm border border-pink-200 bg-pink-200/20 px-3 py-2 text-xs uppercase tracking-wider text-pink-100"
                    : "flex items-center justify-center gap-2 rounded-sm border border-warm-black-800 bg-warm-black-950/70 px-3 py-2 text-xs uppercase tracking-wider text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
                }
                aria-pressed={active}
              >
                <span aria-hidden className="text-base leading-none">
                  {m.glyph}
                </span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4 text-xs text-chrome-300">
          <div className="chrome-label">Active</div>
          <div className="mt-2 font-mono text-chrome-100">
            aura.mood ={" "}
            <span className="text-pink-200">&ldquo;{mood}&rdquo;</span>
          </div>
          <p className="mt-2 text-chrome-400">
            The mouth slots stay flat — no viseme stream is feeding
            them. Open <code>/pipelines/lipsync</code> to drive mouth
            + face together.
          </p>
        </div>

        <Legend />
      </div>
    </div>
  );
}

function Stage() {
  return (
    <div
      className="relative aspect-[3/4] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950"
      style={{
        background:
          "linear-gradient(180deg, rgba(255, 111, 181, 0.15), rgba(10, 10, 15, 0.95))",
      }}
    >
      <Canvas
        camera={{ position: [0, 1.4, 1.2], fov: 30, near: 0.1, far: 20 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.0} color={0xffffff} />
        <directionalLight
          position={[1.5, 2.5, 1.5]}
          intensity={1.2}
          color={0xffffff}
        />
        <directionalLight
          position={[-1.2, 1.8, -0.6]}
          intensity={0.4}
          color={0xb8d4f0}
        />
        <Suspense fallback={null}>
          <FacingVRM />
        </Suspense>
      </Canvas>
    </div>
  );
}

function FacingVRM() {
  return (
    <group rotation={[0, Math.PI, 0]}>
      <VRMAvatar url="/dimona.vrm" id={VRM_ID} />
    </group>
  );
}

function Legend() {
  return (
    <ol className="mt-1 space-y-2 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4 text-xs text-chrome-300">
      <li>
        <span className="font-mono text-chrome-100">vrm.load</span> · loads{" "}
        <code className="text-pink-200">/dimona.vrm</code> into the{" "}
        <code className="text-chrome-100">vrm</code> slice.
      </li>
      <li>
        <span className="font-mono text-chrome-100">vrm.expressions.blend</span>{" "}
        · per-frame loop reads{" "}
        <code className="text-chrome-100">aura.mood</code> via{" "}
        <code className="text-chrome-100">faceForMood()</code> and writes
        face weights to <code className="text-chrome-100">vrm.expressions</code>.
        Mouth weights stay at zero while no viseme is active.
      </li>
    </ol>
  );
}

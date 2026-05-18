"use client";

/**
 * app/atelier/aura-tron/aura-tron-client.tsx
 *
 * Orchestrator for the AuraTron study. Mounts the R3F <Canvas> with the
 * vertex-shader terrain inside it, lays the mood-tinted background canvas
 * behind it, and exposes a four-button mood switcher. No dynamic-import
 * dance — plain R3F / Three.js works fine on the client without the SSR-safe
 * dance the WebGPU TSL paths need.
 */
import { Canvas } from "@react-three/fiber";
import { useState } from "react";

import { AuraTronBackground } from "components/aura-tron/AuraTronBackground";
import { AuraTronLandscape } from "components/aura-tron/AuraTronLandscape";
import { DEFAULT_MOOD, type Mood } from "lib/aura-tron/terrain";

const MOODS: ReadonlyArray<{ id: Mood; label: string; gloss: string }> = [
  { id: "calm", label: "calm", gloss: "cool indigo, slow lights" },
  { id: "alert", label: "alert", gloss: "magenta wash, pulse sharpened" },
  { id: "warm", label: "warm", gloss: "the studio default — orange ground" },
  { id: "cold", label: "cold", gloss: "mint-glass, distant horizon" },
];

export default function AuraTronClient() {
  const [mood, setMood] = useState<Mood>(DEFAULT_MOOD);

  return (
    <div className="flex flex-col gap-5">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
        <AuraTronBackground mood={mood} />
        <Canvas
          camera={{ position: [0, 6, 18], fov: 55, near: 0.1, far: 600 }}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          dpr={[1, 2]}
          className="!absolute inset-0"
        >
          <AuraTronLandscape mood={mood} />
        </Canvas>

        <div className="pointer-events-none absolute right-3 top-3 rounded-sm border border-warm-black-800/80 bg-warm-black-950/70 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-chrome-300">
          aura-tron · {mood}
        </div>
      </div>

      <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5">
        <div className="chrome-label text-chrome-300">mood register</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {MOODS.map((m) => {
            const active = mood === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMood(m.id)}
                aria-pressed={active}
                className={`rounded-sm border px-3 py-1 font-mono text-xs transition-colors ${
                  active
                    ? "border-pink-200 text-pink-100"
                    : "border-warm-black-700 text-chrome-300 hover:border-pink-200/40"
                }`}
              >
                {m.label}
                <span className="ml-2 text-chrome-500">·{m.gloss}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-4 max-w-2xl text-xs text-chrome-400">
          The mood prop biases the wire grid toward a tint colour and recolours
          the aurora at the horizon. The terrain itself is one piece of
          geometry; the GPU vertex shader rebuilds it every frame from the
          same five sine terms regardless of mood.
        </p>
      </div>
    </div>
  );
}

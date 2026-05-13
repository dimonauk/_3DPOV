"use client";

/**
 * app/demo/aura-talks/aura-talks-client.tsx — Client for the lipsync chain demo.
 *
 * One-line role: mount Canvas + VRMAvatar, expose a "speak" button that runs the full TTS+visemes+blend chain.
 * Full purpose in aura-talks-client.PURPOSE.md.
 */

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useState } from "react";

import { VRMAvatar } from "components/three/VRMAvatar";
import { setNamedPose } from "lib/capabilities/vrm/pose";
import { startIdle, stopIdle } from "lib/capabilities/motion/idle";
import { startBlend, stopBlend } from "lib/capabilities/vrm/expression";
import { speak } from "lib/capabilities/audio/tts";
import * as visemes from "lib/capabilities/audio/visemes";
import { useAuraStore, type AuraMood } from "lib/state/aura";
import { vrmStore } from "lib/state/vrm";

const MOODS: AuraMood[] = [
  "neutral",
  "delighted",
  "playful",
  "focused",
  "alert",
  "tender",
  "agitated",
];

export default function AuraTalksClient({
  url,
  defaultLine,
}: {
  url: string;
  defaultLine: string;
}) {
  const [handleId, setHandleId] = useState<string | null>(null);
  const [line, setLine] = useState(defaultLine);
  const [speaking, setSpeaking] = useState(false);
  const mood = useAuraStore((s) => s.mood);
  const setMood = useAuraStore((s) => s.setMood);

  useEffect(() => {
    let appliedFor: string | null = null;
    const unsubscribe = vrmStore.subscribe((state) => {
      const firstId = Object.keys(state.handles)[0];
      if (firstId && firstId !== appliedFor) {
        appliedFor = firstId;
        setHandleId(firstId);
        setNamedPose(firstId, "auraDefault");
        startIdle(firstId);
        startBlend(firstId);
      }
    });
    return () => {
      unsubscribe();
      if (appliedFor) {
        stopIdle(appliedFor);
        stopBlend(appliedFor);
      }
    };
  }, []);

  async function handleSpeak() {
    if (!line.trim() || speaking) return;
    setSpeaking(true);
    const duration = visemes.estimateDurationMs(line);
    visemes.start(line, duration);
    try {
      await speak(line, { locale: "en-GB", pitch: 1.08, rate: 0.96 });
    } finally {
      visemes.stop();
      setSpeaking(false);
    }
  }

  return (
    <div className="mt-12 flex flex-col gap-6">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
        <Canvas camera={{ position: [0, 1.4, 2.2], fov: 30 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 4, 3]} intensity={1.2} />
          <directionalLight
            position={[-2, 2, -2]}
            intensity={0.4}
            color="#ff66cc"
          />
          <OrbitControls target={[0, 1.0, 0]} enablePan={false} />
          <VRMAvatar url={url} />
        </Canvas>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={line}
          onChange={(e) => setLine(e.target.value)}
          className="min-w-0 flex-1 rounded-sm border border-warm-black-800 bg-warm-black-950 px-4 py-3 font-mono text-sm text-chrome-100 outline-none focus:border-pink-200/60"
        />
        <button
          type="button"
          disabled={speaking || !handleId}
          onClick={handleSpeak}
          className="rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-3 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {speaking ? "speaking…" : "speak →"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-chrome-300">
        <span className="chrome-label">mood</span>
        {MOODS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMood(m)}
            className={`rounded-sm border px-3 py-1 ${
              m === mood
                ? "border-pink-200 bg-pink-200/10 text-pink-100"
                : "border-warm-black-800 hover:border-pink-200/40 hover:text-pink-200"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}

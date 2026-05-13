"use client";

/**
 * components/visualiser/strange-attractor-shell.tsx — Client shell for the strange-attractor visualiser.
 *
 * One-line role: mount R3F Canvas, render the live trajectory as Points, expose mood buttons that swap engines.
 * Full purpose in strange-attractor-shell.PURPOSE.md.
 */

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import { BufferAttribute, BufferGeometry } from "three";

import {
  generateAttractor,
  engineFromMood,
} from "lib/capabilities/viz/attractor";
import { useAuraStore, type AuraMood } from "lib/state/aura";
import { useVizStore } from "lib/state/viz";

const MOODS: AuraMood[] = [
  "neutral",
  "delighted",
  "playful",
  "focused",
  "alert",
  "tender",
  "agitated",
];

const POINT_COUNT = 32_000;

function AttractorPoints({ generation }: { generation: number }) {
  const engine = useVizStore((s) => s.attractor.engine);

  const geometry = useMemo(() => {
    const { positions } = generateAttractor(engine, { count: POINT_COUNT });
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(positions, 3));
    geo.computeBoundingSphere();
    const bs = geo.boundingSphere;
    if (bs && bs.radius > 0) {
      const s = 1.4 / bs.radius;
      geo.scale(s, s, s);
      geo.translate(-bs.center.x * s, -bs.center.y * s, -bs.center.z * s);
    }
    return geo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, generation]);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={0.008}
        color="#ff66cc"
        transparent
        opacity={0.85}
        sizeAttenuation
      />
    </points>
  );
}

export default function StrangeAttractorShell() {
  const mood = useAuraStore((s) => s.mood);
  const setMood = useAuraStore((s) => s.setMood);
  const engine = useVizStore((s) => s.attractor.engine);
  const setAttractorEngine = useVizStore((s) => s.setAttractorEngine);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const next = engineFromMood(mood);
    if (next !== engine) {
      setAttractorEngine(next);
      setGeneration((g) => g + 1);
    }
  }, [mood, engine, setAttractorEngine]);

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, 0, 3.6], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.4} />
        <AttractorPoints generation={generation} />
      </Canvas>

      <div className="pointer-events-none absolute left-3 top-3 rounded-sm border border-warm-black-800 bg-warm-black-950/80 px-3 py-1 font-mono text-xs text-chrome-100">
        engine: <span className="text-pink-200">{engine}</span>
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-1 text-[10px] text-chrome-300">
        <span className="chrome-label mr-2">mood</span>
        {MOODS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMood(m)}
            className={`rounded-sm border px-2 py-0.5 ${
              m === mood
                ? "border-pink-200 bg-pink-200/10 text-pink-100"
                : "border-warm-black-800 bg-warm-black-950/80 hover:border-pink-200/40 hover:text-pink-200"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}

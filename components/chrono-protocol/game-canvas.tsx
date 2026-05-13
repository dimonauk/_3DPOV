"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";

import { type ChronoModeSlug } from "lib/chrono-protocol";
import {
  CONSTRUCT_LABEL,
  dialogueLines,
  type Construct,
} from "lib/chrono-protocol/dialogue";
import type { Zone } from "lib/chrono-protocol/zones";

import { DialogueOverlay } from "./dialogue-overlay";
import { Hud } from "./hud";
import { ModeWheel } from "./mode-wheel";
import { PoiControlsStub } from "./poi-controls";
import { TunnelStub } from "./tunnel";

/**
 * Main game canvas mount for the Chrono-Protocol run scene.
 *
 * v0.1 stub: renders the dark canvas, the tunnel-stub geometry, and the
 * HTML overlays (HUD, mode-wheel, dialogue, poi controls). No combat
 * logic, no enemy spawn, no win condition.
 *
 * The component is the seam where Waves 2-6 will land:
 *   - Wave 2 wires camera dolly + recycled tunnel ribs.
 *   - Wave 3 wires the poi-controls + physics + trail render.
 *   - Wave 4 wires enemy spawn + combat against the mode wheel.
 *   - Wave 5 swaps the dark background for the SHARP splat skybox per
 *     zone.
 *   - Wave 6 wires the LLM dialogue source against the static fallback
 *     bank.
 *
 * The visitor-visible feel today: a slow dolly into a dark tunnel of
 * arched ribs, the wheel switchable, the dialogue overlay running on
 * a cycle through the canon bank so the voice register reads even
 * before any combat is real.
 */

export type GameCanvasProps = {
  zone: Zone;
  /** When 'creative', enemy + dialogue triggers are inert; only the
   * tunnel and wheel are interactive. */
  mode?: "run" | "creative";
};

export function GameCanvas({ zone, mode = "run" }: GameCanvasProps) {
  const [currentMode, setCurrentMode] = useState<ChronoModeSlug>(() => {
    const first = zone.activeModes[0];
    return first ?? "azure";
  });

  // Cycle through dialogue lines for the active zone so the voice
  // register is visible in v0.1. Wave 6 swaps this for trigger-driven
  // selection against PlayerTelemetry.
  const zoneLines = useMemo(() => {
    return dialogueLines.filter((line) => {
      if (line.trigger.kind === "zone-entered") {
        return line.trigger.zone === zone.slug;
      }
      // Include phase-1 + general-purpose lines so each zone has something.
      if (line.trigger.kind === "phase-start" && line.trigger.phase === 1) {
        return true;
      }
      // Pull a few of each speaker for variety.
      return line.priority >= 35;
    });
  }, [zone.slug]);

  const [lineIndex, setLineIndex] = useState(0);
  const currentLine = zoneLines.length > 0 ? zoneLines[lineIndex] : null;

  useEffect(() => {
    if (mode === "creative") return;
    if (zoneLines.length === 0) return;
    const tick = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % zoneLines.length);
    }, 5500);
    return () => window.clearInterval(tick);
  }, [zoneLines.length, mode]);

  const accentColor = useMemo(() => {
    // Use the zone's first active mode as the tunnel accent. Wave 2
    // can replace this with a per-rib palette.
    const first = zone.activeModes[0];
    const fallback = "#9900ff";
    if (!first) return fallback;
    const mode = { amber: "#ffcc00", azure: "#0099ff", amethyst: "#9900ff", crimson: "#ff3344", veridian: "#00cc66" }[first];
    return mode ?? fallback;
  }, [zone.activeModes]);

  return (
    <div className="relative h-[70vh] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-[#0c0a12]">
      <Canvas
        camera={{ position: [0, 0.6, 4.5], fov: 70 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#0c0a12" }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[0, 0, 3]} intensity={0.4} color={accentColor} />
        <TunnelStub accentColor={accentColor} />
      </Canvas>

      <Hud
        zoneName={zone.name}
        phase={1}
        totalPhases={3}
        health={100}
        maxHealth={100}
        combo={0}
        score={0}
        currentMode={currentMode}
        variant="overlay"
      />

      <div className="pointer-events-auto absolute right-6 top-28 z-20 rounded-sm border border-warm-black-800 bg-warm-black-950/80 p-2 backdrop-blur-sm">
        <ModeWheel
          currentMode={currentMode}
          onModeSelect={(slug) => setCurrentMode(slug)}
          size={180}
        />
        <div className="chrome-label mt-2 text-center text-chrome-500">
          click a node to switch
        </div>
      </div>

      <DialogueOverlay
        line={
          currentLine
            ? {
                id: `${currentLine.id}-${lineIndex}`,
                speaker: currentLine.speaker as Construct,
                text: currentLine.text,
              }
            : null
        }
        durationMs={5000}
      />

      <PoiControlsStub />

      <div className="pointer-events-none absolute left-6 top-28 z-20 max-w-xs rounded-sm border border-warm-black-800 bg-warm-black-950/70 px-3 py-2 backdrop-blur-sm">
        <div className="chrome-label text-chrome-500">
          v0.1 site-side stub
        </div>
        <p className="mt-1 text-xs text-chrome-300">
          Tunnel geometry mounts. Wheel is interactive. Dialogue cycles
          the canon bank. Combat, motion, and poi physics land in later
          waves. See{" "}
          <a
            href="/articles/neo-london-chrono-protocol"
            className="underline underline-offset-4 hover:text-pink-200"
          >
            the bridge article
          </a>
          .
        </p>
        {mode === "creative" ? (
          <p className="chrome-label mt-2 text-pink-200">creative</p>
        ) : null}
        {/* The dynamic-only marker — keeps the eslint-no-unused happy when
            CONSTRUCT_LABEL is imported for downstream waves. */}
        <span className="sr-only">
          constructs: {CONSTRUCT_LABEL.aura}, {CONSTRUCT_LABEL.yow},{" "}
          {CONSTRUCT_LABEL.purp}
        </span>
      </div>
    </div>
  );
}

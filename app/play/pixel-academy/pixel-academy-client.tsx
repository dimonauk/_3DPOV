"use client";

/**
 * app/play/pixel-academy/pixel-academy-client.tsx
 *
 * The Pixel Academy chamber — a tile-based pixel-art office with the
 * Headmistress (Aura) seated at her desk on the right. Ports the Vite
 * bench app at `D:/The_Hangar/apps/pixel-academy/src/` (App.tsx +
 * OfficeCanvas.tsx + ToolOverlay.tsx). The engine lives under
 * `lib/pixel-academy/` (vendored from `@hanger/pixel-engine`).
 *
 * Orchestrator only. Constants in pixel-academy/constants.ts;
 * Aura-seeded OfficeState builder in office-init.ts; the canvas
 * renderer in office-canvas.tsx; the floating activity overlay in
 * tool-overlay.tsx. Per ARCHITECTURE.md Rule 1.
 *
 * Notes vs the bench version:
 *
 *   - The Scribe Bridge socket (`useScribeLink`, ws://localhost:9001)
 *     is intentionally NOT wired in. The bridge ships with the
 *     desktop Hangar shell, not with the public site; on the site
 *     the room stands as a single-occupant tableau (the Headmistress
 *     at her desk). When the bridge is re-introduced as a Holoflow
 *     capability, this client re-mounts the hook.
 *   - The bench app rendered fullscreen (`100vw / 100vh`); the
 *     chamber renders inside a sized container so it composes with
 *     the article above it. The renderer is DPR-aware via a
 *     ResizeObserver.
 *   - All `console.*` calls go through `createLogger("play:pixel-academy")`
 *     per the holoflow-testing-logging convention.
 */

import { useRef, useState } from "react";

import { createLogger } from "lib/log";
import type { OfficeState } from "lib/pixel-academy";

import {
  AURA_ID,
  CHAMBER_HEIGHT,
  type SubagentCharacter,
} from "./pixel-academy/constants";
import { OfficeCanvas } from "./pixel-academy/office-canvas";
import { createOfficeWithAura } from "./pixel-academy/office-init";
import { ToolOverlay } from "./pixel-academy/tool-overlay";

const log = createLogger("play:pixel-academy");

export default function PixelAcademyClient() {
  // Lazy-init: OfficeState mutates internal sprite caches via canvas
  // pre-render, which is browser-only. The lazy initial value keeps
  // construction off the server.
  const [officeState] = useState<OfficeState | null>(() =>
    typeof window === "undefined" ? null : createOfficeWithAura(),
  );
  const [zoom, setZoom] = useState(2);
  const panRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  if (!officeState) {
    return (
      <div
        style={{
          height: CHAMBER_HEIGHT,
          background: "#1a1a1a",
        }}
      />
    );
  }

  const agents: number[] = [AURA_ID];
  const agentTools: Record<number, never[]> = {};
  const subagentCharacters: SubagentCharacter[] = [
    { id: AURA_ID, label: "Headmistress" },
  ];

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: CHAMBER_HEIGHT,
        background: "#1a1a1a",
        overflow: "hidden",
      }}
    >
      <OfficeCanvas
        officeState={officeState}
        zoom={zoom}
        onZoomChange={setZoom}
        panRef={panRef}
        onClick={(id) => log.info("agent clicked", { id })}
      />
      <ToolOverlay
        officeState={officeState}
        agents={agents}
        agentTools={agentTools}
        subagentCharacters={subagentCharacters}
        containerRef={containerRef}
        zoom={zoom}
        panRef={panRef}
        onCloseAgent={(id) => {
          // Aura is permanent — she cannot be dismissed.
          if (id === AURA_ID) return;
          log.info("close agent", { id });
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "white",
          fontFamily: "monospace",
          pointerEvents: "none",
          textShadow: "0 0 5px cyan",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "22px", letterSpacing: "0.12em" }}>
          PIXEL ACADEMY
        </h2>
        <p style={{ margin: "4px 0 0", opacity: 0.7, fontSize: "12px" }}>
          headmistress aura is watching
        </p>
      </div>
    </div>
  );
}

"use client";

/**
 * app/play/agent-town/agent-town-client.tsx — Interactive Canvas + chat island for Agent Town.
 *
 * # Purpose
 * Render the named cast on a top-down floor (Canvas 2D), drive a small
 * wander loop, surface a click-to-inspect side panel, and call the
 * agent.banter server action when the user asks the cast to react.
 * Ported from D:/The_Hangar/apps/agent-town/ — the source used Phaser;
 * Phaser is not a Holoflow dep, so the renderer is plain Canvas 2D here.
 *
 * # Why this shape
 * - Single client island. The cast roster, the wander state, and the
 *   draw loop all live here because they're tightly coupled and the
 *   whole thing is presentational. No zustand slice — the simulation
 *   has no listeners outside this island.
 * - Cast roster is derived from `lib/cast` so the floor renders only
 *   voices that have bibles (the source app had three extra shapes
 *   without bibles; they're dropped here).
 * - Banter goes through the server action passed in by the page.
 *
 * Orchestrator only. Tunables + types in agent-town/types.ts;
 * floor data in roster.ts; helpers in sim-helpers.ts; Canvas 2D
 * draw routines in canvas-draw.ts; init + tick loop + click hit-test
 * in use-sim.ts; right-side inspect/banter/log panel in
 * inspect-panel.tsx. Per ARCHITECTURE.md Rule 1.
 */

import { useCallback, useRef, useState } from "react";

import type {
  BanterContext,
  BanterResult,
  BanterTurn,
} from "lib/capabilities/agent/banter";
import type { CastMemberId } from "lib/cast";
import { createLogger } from "lib/log";

import { InspectPanel } from "./agent-town/inspect-panel";
import { ROSTER } from "./agent-town/roster";
import { timestamp } from "./agent-town/sim-helpers";
import { H, type LogLine, W } from "./agent-town/types";
import { useSim } from "./agent-town/use-sim";

const log = createLogger("client:play.agent-town");

type Props = {
  available: boolean;
  generate: (context: BanterContext) => Promise<BanterResult>;
};

export default function AgentTownClient({ available, generate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectedRef = useRef<CastMemberId | null>(null);

  const [selected, setSelected] = useState<CastMemberId | null>(null);
  const [logLines, setLogLines] = useState<LogLine[]>([
    { ts: timestamp(), text: "boot — agent town initialising." },
  ]);
  const [turns, setTurns] = useState<BanterTurn[]>([]);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pushLog = useCallback((line: string) => {
    setLogLines((prev) => {
      const next = [{ ts: timestamp(), text: line }, ...prev];
      return next.slice(0, 80);
    });
  }, []);

  const { rosterById, handleCanvasClick } = useSim({
    canvasRef,
    selectedRef,
    pushLog,
  });

  const onCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const hitId = handleCanvasClick(e);
      selectedRef.current = hitId;
      setSelected(hitId);
      if (hitId) {
        const townie = rosterById.get(hitId);
        if (townie) {
          pushLog(`-> ${townie.name}: "${townie.task}"`);
          log.info("agent selected", { id: hitId });
        }
      } else {
        pushLog("deselected. tap a shape to inspect.");
      }
    },
    [handleCanvasClick, pushLog, rosterById],
  );

  // ---- banter the room ----
  const handleBanter = useCallback(async () => {
    if (thinking) return;
    setThinking(true);
    setError(null);
    const onMic: CastMemberId[] = selected
      ? // prioritise the selected agent + two near-by roommates
        Array.from(
          new Set<CastMemberId>([
            selected,
            ...ROSTER.filter(
              (t) =>
                t.id !== selected &&
                rosterById.get(selected)?.home.x === t.home.x &&
                rosterById.get(selected)?.home.y === t.home.y,
            )
              .slice(0, 2)
              .map((t) => t.id),
          ]),
        )
      : ROSTER.slice(0, 3).map((t) => t.id);

    const speakers =
      onMic.length >= 2 ? onMic : ROSTER.slice(0, 3).map((t) => t.id);

    const tasks = speakers
      .map((id) => {
        const t = rosterById.get(id);
        return t ? `${t.name} is ${t.task}` : null;
      })
      .filter((s): s is string => Boolean(s))
      .join("; ");

    const lastEvent = `On the floor right now: ${tasks}. The viewer is watching. React briefly, stay in voice.`;

    pushLog(`banter request — ${speakers.length} on-mic.`);
    log.info("banter request", { speakers, available });

    try {
      const result = await generate({
        activeSpeakers: speakers,
        telemetry: { chronoMode: "amber", phase: "hub", tickMs: 30_000 },
        lastEvent,
      });
      if (result.turns.length === 0) {
        if (!available) {
          setError("banter unavailable — GOOGLE_AI_API_KEY is not set.");
          pushLog("banter empty — google key absent.");
        } else {
          setError("banter returned no turns.");
          pushLog("banter empty.");
        }
        setTurns([]);
      } else {
        setTurns(result.turns);
        for (const turn of result.turns) {
          const speaker = rosterById.get(turn.speaker as CastMemberId);
          const name = speaker?.name ?? turn.speaker;
          pushLog(`${name} (${turn.emotion}): "${turn.text}"`);
        }
        log.info("banter ok", { count: result.turns.length });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "banter call failed";
      setError(message);
      pushLog(`banter error — ${message}`);
      log.error("banter call failed", { err: message });
    } finally {
      setThinking(false);
    }
  }, [available, generate, pushLog, rosterById, selected, thinking]);

  const selectedTownie = selected ? (rosterById.get(selected) ?? null) : null;

  return (
    <section className="mt-12 flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex-1">
        <div className="overflow-hidden rounded-sm border border-warm-black-800 bg-[#0a0a0f]">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onClick={onCanvasClick}
            className="block h-auto w-full cursor-crosshair"
            aria-label="Agent town floor — click a shape to inspect"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-chrome-400">
          <button
            type="button"
            disabled={thinking}
            onClick={handleBanter}
            className="rounded-full border border-pink-200/40 bg-pink-200/10 px-5 py-2 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {thinking ? "thinking…" : "ask the room to banter →"}
          </button>
          {!available && (
            <span>google ai key absent — banter will return empty.</span>
          )}
          {error && <span className="text-pink-200">{error}</span>}
        </div>
      </div>

      <InspectPanel
        selectedTownie={selectedTownie}
        turns={turns}
        rosterById={rosterById}
        logLines={logLines}
      />
    </section>
  );
}

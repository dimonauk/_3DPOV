"use client";

/**
 * templates/webxr-game-starter/client-shell.tsx — Client wrapper that
 * mounts the SceneStage + the HTML HUD overlay + the Restart button.
 *
 * The HUD is HTML positioned absolutely over the canvas. The pickup
 * count + the live timer subscribe to the game store; React re-renders
 * the small overlay each tick without touching the R3F render loop.
 *
 * Restart calls `resetGame()` and bumps a `runId` so the GameScene
 * remounts (which clears its local `collected` set without us having
 * to wire a reset prop through every subcomponent).
 */

import { useEffect, useState } from "react";

import { SceneStage } from "components/xr-scene/SceneStage";

import GameScene from "./scene";
import { gameStore, resetGame, type GameStateShape } from "./state";

export default function ClientShell() {
  const [state, setState] = useState<GameStateShape>(gameStore.get());
  const [runId, setRunId] = useState(0);
  const [now, setNow] = useState<number>(() => Date.now());

  // Subscribe to the game store. The framework's subscriber API
  // gives us (next, prev) so we can React-set on every change. We
  // also seed state from `.get()` on initial render for the first
  // paint — the framework subscriber does not fire immediately.
  useEffect(() => {
    setState(gameStore.get());
    return gameStore.subscribe((next) => setState(next));
  }, []);

  // Tick the wall-clock for the timer display. 200 ms is enough for
  // a tenths-of-a-second readout without burning a frame per tick.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, []);

  function handleRestart() {
    resetGame();
    setRunId((n) => n + 1);
  }

  const elapsedMs = computeElapsed(state, now);
  const elapsedDisplay = formatElapsed(elapsedMs);
  const done = state.finishedAt !== null;

  return (
    <div className="relative">
      <SceneStage
        label="WebXR Game Starter"
        webxr
        height="64vh"
        camera={{ position: [0, 1.6, 3.2], target: [0, 0.6, 0], fov: 50 }}
      >
        {/* The scene remounts on restart so its internal `collected`
            set resets without prop-drilling. */}
        <GameScene key={runId} />
      </SceneStage>

      <HudOverlay
        collected={state.pickups.collected}
        total={state.pickups.total}
        elapsed={elapsedDisplay}
        done={done}
        onRestart={handleRestart}
      />
    </div>
  );
}

function HudOverlay({
  collected,
  total,
  elapsed,
  done,
  onRestart,
}: {
  collected: number;
  total: number;
  elapsed: string;
  done: boolean;
  onRestart: () => void;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 md:p-4"
      aria-live="polite"
    >
      <div className="pointer-events-auto rounded-sm border border-warm-black-700 bg-warm-black-950/80 px-3 py-2 font-mono text-xs text-chrome-200 backdrop-blur-sm">
        <div>
          <span className="text-chrome-500">PICKUPS</span>{" "}
          <span className="text-pink-200">
            {collected} / {total}
          </span>
        </div>
        <div className="mt-1">
          <span className="text-chrome-500">TIME</span>{" "}
          <span className={done ? "text-pink-200" : "text-chrome-100"}>
            {elapsed}
          </span>
        </div>
        {done && (
          <div className="mt-1 text-pink-200">RUN COMPLETE</div>
        )}
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="pointer-events-auto rounded-sm border border-warm-black-700 bg-warm-black-950/80 px-3 py-2 font-mono text-xs uppercase tracking-wider text-chrome-200 backdrop-blur-sm hover:border-pink-200/50 hover:text-pink-200"
      >
        Restart
      </button>
    </div>
  );
}

function computeElapsed(state: GameStateShape, now: number): number {
  if (state.startedAt === null) return 0;
  const end = state.finishedAt ?? now;
  return Math.max(0, end - state.startedAt);
}

function formatElapsed(ms: number): string {
  const totalSeconds = ms / 1000;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds - m * 60;
  if (m > 0) return `${m}m ${s.toFixed(1)}s`;
  return `${s.toFixed(1)}s`;
}

/**
 * lib/chrono-protocol/game-loop.ts — Headless state machine for the runtime.
 *
 * # Purpose
 *
 * The prototype's `App.tsx` mixes the game-state machine, the tunnel
 * speed-ramp, the banter scheduler, and the React tree into one
 * stateful component. The site-side migration splits those concerns:
 *
 *   - This file is the *pure* state-machine — transitions and ticks.
 *     Headless. No React, no DOM, no zustand reads. Takes a
 *     `GameLoopContext`, returns the next one.
 *   - The zustand slice (`lib/state/chrono-protocol.ts`) is the
 *     persistent surface other consumers subscribe to.
 *   - The runner (`components/chrono-protocol/game-loop-runner.tsx`)
 *     calls these functions every frame, then writes the result into
 *     the slice.
 *
 * Keeping the transitions pure means tests can drive the machine
 * synchronously against arbitrary `GameLoopEvent` sequences without
 * mounting React or polluting the slice.
 *
 * # Why this shape
 *
 * - Event-driven `advancePhase` mirrors the prototype's discrete
 *   transitions (boot → hub → run → game-over).
 * - Time-driven `tickTunnel` mirrors the prototype's two intervals
 *   (the 100ms score tick + the 12s banter tick), expressed as a
 *   single delta-ms function so the runner can drive both at one
 *   request-animation-frame cadence.
 */

import type { ChronoModeSlug } from "../chrono-protocol";
import {
  BANTER_TICK_MS,
  INITIAL_SPEED_MULTIPLIER,
  MAX_SPEED_MULTIPLIER,
  SCORE_TICK_MS,
  SCORE_TICK_VALUE,
  SPEED_RAMP_PER_TICK,
  TUNNEL_SPEED,
  comboToScoreMultiplier,
} from "./constants";
import type { GameState } from "./state";
import type { ZoneSlug } from "./zones";

/**
 * The headless mirror of the slice. The runner builds this from the
 * slice's snapshot, runs a tick, and writes the diff back.
 */
export type GameLoopContext = {
  phase: GameState;
  currentZone: ZoneSlug | null;
  activeMode: ChronoModeSlug;
  /** World-units-per-second. Equals `TUNNEL_SPEED * speedMultiplier`. */
  tunnelSpeed: number;
  speedMultiplier: number;
  combo: number;
  health: number;
  maxHealth: number;
  score: number;
  /** Milliseconds since the last banter call. Resets to zero on fire. */
  msSinceBanter: number;
  /** Milliseconds accumulated below the score-tick threshold. */
  msSinceScoreTick: number;
};

export type GameLoopEvent =
  | { kind: "boot-complete" }
  | { kind: "start-run"; zone: ZoneSlug }
  | { kind: "enter-creative" }
  | { kind: "open-briefing"; zone: ZoneSlug }
  | { kind: "enter-encounter" }
  | { kind: "win" }
  | { kind: "lose" }
  | { kind: "abort-to-hub" }
  | { kind: "game-over" }
  | { kind: "mode-switch"; to: ChronoModeSlug };

/**
 * Pure transition function. Given the current context and an event,
 * return the next context. Unrecognised transitions are no-ops — the
 * machine never throws.
 */
export function advancePhase(
  ctx: GameLoopContext,
  event: GameLoopEvent,
): GameLoopContext {
  switch (event.kind) {
    case "boot-complete":
      return ctx.phase === "boot" ? { ...ctx, phase: "hub" } : ctx;

    case "open-briefing":
      return { ...ctx, phase: "briefing", currentZone: event.zone };

    case "start-run":
      return {
        ...ctx,
        phase: "run",
        currentZone: event.zone,
        speedMultiplier: INITIAL_SPEED_MULTIPLIER,
        tunnelSpeed: TUNNEL_SPEED * INITIAL_SPEED_MULTIPLIER,
        combo: 0,
        score: 0,
        msSinceBanter: 0,
        msSinceScoreTick: 0,
      };

    case "enter-creative":
      return { ...ctx, phase: "creative" };

    case "enter-encounter":
      return ctx.phase === "run" ? { ...ctx, phase: "encounter" } : ctx;

    case "win":
      return { ...ctx, phase: "victory" };

    case "lose":
      return { ...ctx, phase: "defeat" };

    case "abort-to-hub":
      return { ...ctx, phase: "hub", currentZone: null };

    case "game-over":
      return { ...ctx, phase: "game_over" };

    case "mode-switch":
      return { ...ctx, activeMode: event.to };
  }
}

export type TunnelTickResult = {
  /** Updated context. */
  context: GameLoopContext;
  /** True on the tick a banter call should fire. */
  shouldBanter: boolean;
  /** Score awarded this tick. Zero if no score-tick boundary crossed. */
  scoreDelta: number;
};

/**
 * Drive the time-based bits of the loop forward by `deltaMs`. Ramps
 * speed, awards score every SCORE_TICK_MS, accumulates msSinceBanter
 * and flags `shouldBanter` once it crosses BANTER_TICK_MS.
 *
 * Only mutates the context when the run is in motion (`phase === "run"
 * || phase === "encounter"`). In all other phases this is a no-op
 * pass-through so the runner can call it unconditionally from rAF.
 */
export function tickTunnel(
  ctx: GameLoopContext,
  deltaMs: number,
): TunnelTickResult {
  if (ctx.phase !== "run" && ctx.phase !== "encounter") {
    return { context: ctx, shouldBanter: false, scoreDelta: 0 };
  }

  let msSinceScoreTick = ctx.msSinceScoreTick + deltaMs;
  let speedMultiplier = ctx.speedMultiplier;
  let score = ctx.score;
  let scoreDelta = 0;

  while (msSinceScoreTick >= SCORE_TICK_MS) {
    msSinceScoreTick -= SCORE_TICK_MS;
    speedMultiplier = Math.min(
      MAX_SPEED_MULTIPLIER,
      speedMultiplier + SPEED_RAMP_PER_TICK,
    );
    const delta = Math.round(
      SCORE_TICK_VALUE * comboToScoreMultiplier(ctx.combo),
    );
    score += delta;
    scoreDelta += delta;
  }

  const msSinceBanter = ctx.msSinceBanter + deltaMs;
  const shouldBanter = msSinceBanter >= BANTER_TICK_MS;
  const tunnelSpeed = TUNNEL_SPEED * speedMultiplier;

  return {
    context: {
      ...ctx,
      speedMultiplier,
      tunnelSpeed,
      score,
      msSinceScoreTick,
      msSinceBanter: shouldBanter ? 0 : msSinceBanter,
    },
    shouldBanter,
    scoreDelta,
  };
}

/** Build a fresh context. Used by the runner on mount + on reset. */
export function makeInitialContext(): GameLoopContext {
  return {
    phase: "boot",
    currentZone: null,
    activeMode: "azure",
    tunnelSpeed: TUNNEL_SPEED * INITIAL_SPEED_MULTIPLIER,
    speedMultiplier: INITIAL_SPEED_MULTIPLIER,
    combo: 0,
    health: 100,
    maxHealth: 100,
    score: 0,
    msSinceBanter: 0,
    msSinceScoreTick: 0,
  };
}

/** True when the game-loop should be ticking at all. */
export function isLoopActive(phase: GameState): boolean {
  return phase === "run" || phase === "encounter";
}

/**
 * lib/state/chrono-protocol.ts — Zustand slice: live game-loop state for the Chrono-Protocol runtime.
 *
 * One-line role: shared state-bus for the live run — phase, zone, mode, tunnel speed, combo, health, tick.
 * Full purpose in chrono-protocol.PURPOSE.md.
 *
 * Provenance: Hangar `apps/prototypes/neo-london-chrono-protocol/App.tsx`
 * — the per-run refs (speedRef, scoreRef, health) atomised here so the
 * runner is a pure orchestrator over a typed slice rather than a
 * stateful React tree.
 */

import { create } from "zustand";

import type { ChronoModeSlug } from "lib/chrono-protocol";
import {
  INITIAL_HEALTH,
  INITIAL_SPEED_MULTIPLIER,
  MAX_SPEED_MULTIPLIER,
  TUNNEL_SPEED,
} from "lib/chrono-protocol/constants";
import type { GameState } from "lib/chrono-protocol/state";
import type { ZoneSlug } from "lib/chrono-protocol/zones";

/** Snake-cased lifecycle alias for the banter telemetry shape. */
export type BanterPhase = "boot" | "hub" | "run" | "end";

export type ChronoProtocolState = {
  /** Current game-state phase. Mirrors lib/chrono-protocol/state.ts. */
  phase: GameState;
  /** Active zone slug. Null until the player picks one. */
  currentZone: ZoneSlug | null;
  /** Active mode on the wheel. */
  activeMode: ChronoModeSlug;
  /**
   * Tunnel speed in world-units-per-second. Reads as
   * `TUNNEL_SPEED * speedMultiplier`. Stored pre-multiplied so frame
   * code can read it without re-deriving.
   */
  tunnelSpeed: number;
  /** Speed multiplier in [1.0..MAX_SPEED_MULTIPLIER]. */
  speedMultiplier: number;
  /** Run-streak counter. Resets on damage. */
  combo: number;
  /** Health in [0..maxHealth]. */
  health: number;
  /** Health ceiling. */
  maxHealth: number;
  /** Cumulative score this run. */
  score: number;
  /** Last delta-ms the runner ticked with (for diagnostics). */
  tickMs: number;
  /** ISO 8601 of the most-recent state write. */
  lastEventAt: string;
};

export type ChronoProtocolActions = {
  setPhase: (phase: GameState) => void;
  setZone: (slug: ZoneSlug | null) => void;
  setMode: (mode: ChronoModeSlug) => void;
  /** Set the speed multiplier; tunnelSpeed is recomputed from it. */
  setSpeed: (multiplier: number) => void;
  /** Bump combo by one. Returns new count. */
  incCombo: () => number;
  /** Reset combo to zero (e.g. on damage). */
  resetCombo: () => void;
  /** Drop health by `amount`. Clamps to zero. Returns new health. */
  dropHealth: (amount: number) => number;
  /** Restore health by `amount`. Clamps to maxHealth. */
  restoreHealth: (amount: number) => number;
  /** Add `value` to score. */
  addScore: (value: number) => void;
  /** Stamp the most-recent tick interval. */
  setTickMs: (ms: number) => void;
  /** Reset to initial run state but keep zone + mode + phase. */
  resetTelemetry: () => void;
  /** Full reset — phase back to "boot". */
  reset: () => void;
};

/** Translate the canonical GameState into the banter phase enum. */
export function toBanterPhase(phase: GameState): BanterPhase {
  switch (phase) {
    case "boot":
      return "boot";
    case "hub":
    case "briefing":
      return "hub";
    case "run":
    case "encounter":
      return "run";
    case "victory":
    case "defeat":
    case "game_over":
    case "creative":
      return "end";
  }
}

const initial: ChronoProtocolState = {
  phase: "boot",
  currentZone: null,
  activeMode: "azure",
  tunnelSpeed: TUNNEL_SPEED * INITIAL_SPEED_MULTIPLIER,
  speedMultiplier: INITIAL_SPEED_MULTIPLIER,
  combo: 0,
  health: INITIAL_HEALTH,
  maxHealth: INITIAL_HEALTH,
  score: 0,
  tickMs: 0,
  lastEventAt: "1970-01-01T00:00:00.000Z",
};

const clampMultiplier = (n: number): number =>
  Math.max(INITIAL_SPEED_MULTIPLIER, Math.min(MAX_SPEED_MULTIPLIER, n));

const stamp = (): string => new Date().toISOString();

export const useChronoProtocolStore = create<
  ChronoProtocolState & ChronoProtocolActions
>()((set, get) => ({
  ...initial,
  setPhase: (phase) => set({ phase, lastEventAt: stamp() }),
  setZone: (currentZone) => set({ currentZone, lastEventAt: stamp() }),
  setMode: (activeMode) => set({ activeMode, lastEventAt: stamp() }),
  setSpeed: (multiplier) => {
    const m = clampMultiplier(multiplier);
    set({
      speedMultiplier: m,
      tunnelSpeed: TUNNEL_SPEED * m,
      lastEventAt: stamp(),
    });
  },
  incCombo: () => {
    const next = get().combo + 1;
    set({ combo: next, lastEventAt: stamp() });
    return next;
  },
  resetCombo: () => set({ combo: 0, lastEventAt: stamp() }),
  dropHealth: (amount) => {
    const next = Math.max(0, get().health - amount);
    set({ health: next, combo: 0, lastEventAt: stamp() });
    return next;
  },
  restoreHealth: (amount) => {
    const s = get();
    const next = Math.min(s.maxHealth, s.health + amount);
    set({ health: next, lastEventAt: stamp() });
    return next;
  },
  addScore: (value) =>
    set((s) => ({ score: s.score + value, lastEventAt: stamp() })),
  setTickMs: (ms) => set({ tickMs: ms }),
  resetTelemetry: () =>
    set({
      speedMultiplier: INITIAL_SPEED_MULTIPLIER,
      tunnelSpeed: TUNNEL_SPEED * INITIAL_SPEED_MULTIPLIER,
      combo: 0,
      health: INITIAL_HEALTH,
      maxHealth: INITIAL_HEALTH,
      score: 0,
      tickMs: 0,
      lastEventAt: stamp(),
    }),
  reset: () => set({ ...initial, lastEventAt: stamp() }),
}));

export const chronoProtocolStore = useChronoProtocolStore;

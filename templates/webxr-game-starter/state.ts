/**
 * templates/webxr-game-starter/state.ts — Game state for the starter.
 *
 * Pickup-counter + start/finish timestamps. Deliberately small so it
 * fits in your head while you read the rest of the template; the
 * shape is what you replace first when you fork this.
 *
 * Built on `createGameState` from the framework
 * (`lib/game/game-state.ts`) — a vanilla-TS store with a tiny API
 * (`get` / `set` / `subscribe` / `save` / `load` / `reset`) and a
 * localStorage save handle.
 *
 * `save()` is not wired here. The starter is short enough that a
 * single run does not need persistence; once you fork and add
 * something worth remembering (best time, unlocked levels), throttle
 * a `save()` on tab-hide and a `load()` on mount.
 */

import { createGameState, type GameState as GameStateStore } from "lib/game/game-state";

export type GameStateShape = {
  pickups: { collected: number; total: number };
  /** Wall-clock ms when the player first crossed the start line. */
  startedAt: number | null;
  /** Wall-clock ms when the win condition fired. */
  finishedAt: number | null;
};

export const INITIAL_GAME_STATE: GameStateShape = {
  pickups: { collected: 0, total: 3 },
  startedAt: null,
  finishedAt: null,
};

/**
 * The game store. Exported as a module-level singleton because the
 * starter only ever mounts one scene at a time. A fork that runs
 * multiple scenes side-by-side would construct a fresh store per
 * scene and hand it down via context.
 */
export const gameStore: GameStateStore<GameStateShape> = createGameState(
  INITIAL_GAME_STATE,
  // `saveKey` is left undefined so `save()` is a no-op. Set this to
  // a stable string like "holoflow.webxr-game-starter.v1" once you
  // have state worth persisting.
);

/**
 * Player crossed the start line. Idempotent — only records the first
 * call so re-entering the start volume does not reset the clock.
 */
export function startGame(now: number = Date.now()): void {
  gameStore.set((prev) => (prev.startedAt ? {} : { startedAt: now }));
}

/**
 * Increment the pickup counter and fire the finish timestamp once the
 * total is reached. The scene's `onPickup` callback wraps this.
 */
export function recordPickup(now: number = Date.now()): void {
  gameStore.set((prev) => {
    const collected = Math.min(
      prev.pickups.collected + 1,
      prev.pickups.total,
    );
    const finishedAt =
      collected >= prev.pickups.total && !prev.finishedAt
        ? now
        : prev.finishedAt;
    return {
      pickups: { ...prev.pickups, collected },
      finishedAt,
    };
  });
}

export function resetGame(): void {
  gameStore.reset();
}

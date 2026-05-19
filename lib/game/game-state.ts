/**
 * lib/game/game-state.ts — A tiny vanilla-TS state store with
 * localStorage save/load, built for the WebXR Game Framework.
 *
 * Why this isn't zustand. Zustand already lives in package.json
 * (it's the state bus for Aura, audio, cast, viz — see
 * `lib/state/*`). What the *framework* needs is one step smaller:
 *
 *   - No React dependency. Game state is loop-driven and frequently
 *     read from a `useFrame` callback or a Web Worker, neither of
 *     which wants a React subscription wrapper.
 *   - A save/load handle. Zustand's persist middleware is fine but
 *     it wants its own JSON shape; we want one shape per game and a
 *     short API surface.
 *   - Replaceable per-scene. A "scene" in the framework owns its
 *     own state instance and tears it down with the scene — there
 *     is no global singleton fighting other scenes.
 *
 * Design points worth defending:
 *
 *   - `set(updater)` takes a partial-returning function rather than
 *     a draft. Immer-style drafts would be nicer but pull in a
 *     dependency; the partial pattern matches the studio's own
 *     `lib/state/*` zustand slices and reads the same way.
 *
 *   - `subscribe(handler)` fires on every successful set. No
 *     selector — selectors are an optimisation for React renders,
 *     and a loop-driven consumer can read what it needs from the
 *     handler argument directly.
 *
 *   - `save()` is explicit. Autosaving on every set would chew the
 *     localStorage quota during a frame-driven write storm; the
 *     caller can throttle on its own clock (the framework recipe
 *     in the doc suggests once per second + on tab hide).
 *
 *   - SSR safety. Every storage path short-circuits when `window`
 *     is undefined — the store works in tests under happy-dom and
 *     in Vitest without rigging.
 *
 * No external deps. Under 200 lines including the docblock.
 */

export type StateUpdater<T> = (current: T) => Partial<T>;
export type StateHandler<T> = (next: T, prev: T) => void;

export type GameState<T extends object> = {
  /** Current snapshot. Treat as read-only. */
  get(): T;
  /**
   * Merge a partial returned by the updater into the current state.
   * Subscribers fire synchronously after the merge.
   */
  set(updater: StateUpdater<T>): void;
  /** Subscribe to changes. Returns an unsubscribe function. */
  subscribe(handler: StateHandler<T>): () => void;
  /** Write the current state to localStorage under `saveKey`. */
  save(): void;
  /**
   * Read from localStorage and return the stored snapshot without
   * applying it. Returns null when no save exists or parsing fails.
   * Use this to show a "Resume?" prompt before calling `set()` with
   * the loaded value.
   */
  load(): T | null;
  /** Replace the state with the initial snapshot. */
  reset(): void;
};

export function createGameState<T extends object>(
  initial: T,
  saveKey?: string,
): GameState<T> {
  // Shallow-clone the initial so the consumer-held reference cannot
  // mutate our baseline through `reset()`. We do NOT deep-clone —
  // game state typically holds plain numbers, strings, and small
  // arrays; deep cloning would obscure the cost.
  let current: T = { ...initial };
  const subscribers = new Set<StateHandler<T>>();

  const noopStorage =
    typeof window === "undefined" || typeof window.localStorage === "undefined";

  function get(): T {
    return current;
  }

  function set(updater: StateUpdater<T>): void {
    const patch = updater(current);
    if (!patch) return;
    const next = { ...current, ...patch };
    const prev = current;
    current = next;
    for (const sub of subscribers) {
      try {
        sub(next, prev);
      } catch (err) {
        console.warn("[game-state] subscriber threw:", err);
      }
    }
  }

  function subscribe(handler: StateHandler<T>): () => void {
    subscribers.add(handler);
    return () => {
      subscribers.delete(handler);
    };
  }

  function save(): void {
    if (noopStorage || !saveKey) return;
    try {
      const json = JSON.stringify(current);
      window.localStorage.setItem(saveKey, json);
    } catch (err) {
      // Quota exceeded, private-mode Safari, etc. Log and move on —
      // a failed save shouldn't crash the game loop.
      console.warn("[game-state] save failed:", err);
    }
  }

  function load(): T | null {
    if (noopStorage || !saveKey) return null;
    try {
      const raw = window.localStorage.getItem(saveKey);
      if (raw == null) return null;
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        // We do NOT validate the parsed shape against `initial` —
        // that's the caller's responsibility (use Zod or a hand-
        // rolled guard). Returning `unknown`-shaped data here would
        // poison every downstream read, so the assertion is the
        // documented price of using this API.
        return parsed as T;
      }
      return null;
    } catch (err) {
      console.warn("[game-state] load failed:", err);
      return null;
    }
  }

  function reset(): void {
    const prev = current;
    current = { ...initial };
    for (const sub of subscribers) {
      try {
        sub(current, prev);
      } catch (err) {
        console.warn("[game-state] reset subscriber threw:", err);
      }
    }
  }

  return { get, set, subscribe, save, load, reset };
}

/**
 * lib/state/world.ts — Zustand slice: current shell index (1–10) and parallax depth.
 *
 * One-line role: shared state-bus for the 10-shell Russian-doll parallax — where the user is in the depth stack.
 * Full purpose in world.PURPOSE.md.
 */

import { create } from "zustand";

/** Shell index 1..10. 1 = innermost (Aura's body / Pipeline Epsilon). 10 = outermost. */
export type ShellIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type WorldState = {
  /** The shell the user is currently focused on. Affects parallax and tab focus. */
  focusShell: ShellIndex;
  /** Per-shell parallax offset, driven by head-pose. */
  parallax: Record<ShellIndex, { x: number; y: number }>;
  /** Currently-visible shells, in render order (innermost-first). */
  visibleShells: ShellIndex[];
};

export type WorldActions = {
  setFocusShell: (n: ShellIndex) => void;
  setParallax: (n: ShellIndex, offset: { x: number; y: number }) => void;
  setVisibleShells: (shells: ShellIndex[]) => void;
};

const emptyParallax: WorldState["parallax"] = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: 0 },
  3: { x: 0, y: 0 },
  4: { x: 0, y: 0 },
  5: { x: 0, y: 0 },
  6: { x: 0, y: 0 },
  7: { x: 0, y: 0 },
  8: { x: 0, y: 0 },
  9: { x: 0, y: 0 },
  10: { x: 0, y: 0 },
};

const initial: WorldState = {
  focusShell: 5,
  parallax: emptyParallax,
  visibleShells: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
};

export const useWorldStore = create<WorldState & WorldActions>()((set) => ({
  ...initial,
  setFocusShell: (n) => set({ focusShell: n }),
  setParallax: (n, offset) =>
    set((s) => ({ parallax: { ...s.parallax, [n]: offset } })),
  setVisibleShells: (shells) => set({ visibleShells: shells }),
}));

export const worldStore = useWorldStore;

/** Scale factor for a given shell — 100% for shell 10 outward → 10% for shell 1. */
export function shellScale(n: ShellIndex): number {
  return n * 0.1;
}

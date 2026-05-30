/**
 * lib/theme/store.ts — Zustand store for the theme selection.
 *
 * The active selection is persisted to localStorage under
 * `holoflow.theme.<axis>` so it survives reloads. Server-side renders
 * fall back to DEFAULT_SELECTION (no localStorage there); the client
 * hydrates immediately on mount.
 */

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { DEFAULT_SELECTION, type Selection } from "./registry";

type State = {
  selection: Selection;
  set: <A extends keyof Selection>(axis: A, key: Selection[A]) => void;
  reset: () => void;
};

export const useTheme = create<State>()(
  persist(
    (set) => ({
      selection: DEFAULT_SELECTION,
      set: (axis, key) =>
        set((s) => ({ selection: { ...s.selection, [axis]: key } })),
      reset: () => set({ selection: DEFAULT_SELECTION }),
    }),
    {
      name: "holoflow.theme",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ selection: s.selection }),
    },
  ),
);

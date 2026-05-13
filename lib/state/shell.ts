/**
 * lib/state/shell.ts — Zustand slice: workshop shell panel open/closed state, persisted to localStorage.
 *
 * One-line role: the shared state-bus for the three workshop panels (left navigator, right inspector, bottom terminal).
 * Full purpose in shell.PURPOSE.md.
 *
 * Migrated from the previous module-scope load/save helpers at lib/shell/state.ts;
 * persistence now flows through zustand's `persist` middleware.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type PanelKey = "left" | "right" | "terminal";

export type ShellState = {
  open: Record<PanelKey, boolean>;
};

export type ShellActions = {
  toggle: (key: PanelKey) => void;
  setOpen: (key: PanelKey, open: boolean) => void;
};

const initial: ShellState = {
  open: { left: false, right: false, terminal: false },
};

export const defaultShellState: ShellState = initial;

export const useShellStore = create<ShellState & ShellActions>()(
  persist(
    (set) => ({
      ...initial,
      toggle: (key) =>
        set((s) => ({ open: { ...s.open, [key]: !s.open[key] } })),
      setOpen: (key, open) =>
        set((s) => ({ open: { ...s.open, [key]: open } })),
    }),
    {
      name: "holoflow-shell-v1",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          };
        }
        return window.localStorage;
      }),
      partialize: (state) => ({ open: state.open }),
    },
  ),
);

export const shellStore = useShellStore;

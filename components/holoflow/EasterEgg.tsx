/**
 * EasterEgg overlay + provider + content registry.
 *
 * The source HTML keeps an `EE = {key: {t,b,c}}` map and a `showEE(key)`
 * function. Many elements have `onClick="showEE('logo')"`. Same shape
 * here, React-flavoured.
 *
 * Usage:
 *   <EasterEggProvider entries={EGGS}>
 *     <button onClick={() => useEasterEgg.getState().show('logo')}>
 *       Holo-Flow Studio
 *     </button>
 *   </EasterEggProvider>
 *
 * The provider mounts the overlay; nothing renders until .show(key).
 * Honors the easterEggs theme axis — disabled = .show() is a no-op.
 */

"use client";

import { type ReactNode } from "react";
import { create } from "zustand";

import { useGlitchStore } from "lib/state/glitch";
import { useTheme } from "lib/theme/store";

export type EasterEgg = {
  /** Title in italic gold. */
  t: string;
  /** Body paragraph. */
  b: string;
  /** Optional code-styled block (rendered as <pre>). */
  c?: string;
};

type EggsState = {
  active: EasterEgg | null;
  registry: Record<string, EasterEgg>;
  setRegistry: (r: Record<string, EasterEgg>) => void;
  show: (key: string) => void;
  close: () => void;
};

export const useEasterEgg = create<EggsState>((set, get) => ({
  active: null,
  registry: {},
  setRegistry: (registry) => set({ registry }),
  show: (key) => {
    const enabled = useTheme.getState().selection.easterEggs === "on";
    if (!enabled) return;
    const egg = get().registry[key];
    if (!egg) return;
    set({ active: egg });
    // Credit the visitor's glitch signature — the post effect amplifies
    // the visual the next time something happens. The "logo" key is the
    // konami-triggered banner; everything else is a stub-box reveal.
    useGlitchStore.getState().fireEvent(
      key === "logo" ? "easter.konami" : "easter.stub-reveal",
      { eggKey: key },
    );
  },
  close: () => set({ active: null }),
}));

export function EasterEggProvider({
  entries,
  children,
}: {
  entries: Record<string, EasterEgg>;
  children: ReactNode;
}) {
  // Register once on mount.
  if (Object.keys(useEasterEgg.getState().registry).length !== Object.keys(entries).length) {
    useEasterEgg.getState().setRegistry(entries);
  }
  return (
    <>
      {children}
      <EasterEggOverlay />
    </>
  );
}

function EasterEggOverlay() {
  const active = useEasterEgg((s) => s.active);
  const close = useEasterEgg((s) => s.close);
  if (!active) return null;
  return (
    <div className="holoflow-fade-up fixed bottom-6 left-6 right-6 z-50 mx-auto max-w-2xl border border-lavender-400 bg-warm-black-950 p-6 shadow-2xl">
      <div className="font-display text-2xl italic text-gold-300">{active.t}</div>
      <p className="mt-3 font-mono text-[11px] leading-loose text-chrome-300">
        {active.b}
      </p>
      {active.c && (
        <pre className="mt-3 border-l-2 border-lavender-400 pl-3 font-mono text-[10px] leading-loose text-lavender-200">
          {active.c}
        </pre>
      )}
      <button
        type="button"
        onClick={close}
        className="mt-4 border border-warm-black-700 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-chrome-500 transition-colors hover:border-chrome-300 hover:text-chrome-100"
      >
        Close
      </button>
    </div>
  );
}

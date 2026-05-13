/**
 * lib/state/aura.ts — Zustand slice: Aura's OCEAN vector, mood, current ChronoMode.
 *
 * One-line role: the shared state-bus for Aura's psychology — what she's feeling, how, in which mode.
 * Full purpose in aura.PURPOSE.md.
 */

import { create } from "zustand";
import type { ChronoModeSlug } from "lib/chrono-protocol";

/** Big Five / OCEAN trait vector. Each component in [0..1]. */
export type OceanVector = {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
};

/** Aura's current mood reading — a coarse-grained label over the OCEAN+FFT pipeline. */
export type AuraMood =
  | "neutral"
  | "delighted"
  | "alert"
  | "playful"
  | "focused"
  | "agitated"
  | "tender";

export type AuraState = {
  /** Slow-moving baseline personality. Drifts on conversational ledger updates. */
  ocean: OceanVector;
  /** Short-term mood derived from OCEAN + recent input FFT. */
  mood: AuraMood;
  /** Active ChronoMode for the wheel — the way-of-being she's holding now. */
  mode: ChronoModeSlug;
  /** Recent OCEAN deltas, for the personality-drift ledger. Capped externally. */
  ledger: { at: string; delta: Partial<OceanVector>; reason: string }[];
};

export type AuraActions = {
  setOcean: (ocean: OceanVector) => void;
  nudgeOcean: (delta: Partial<OceanVector>, reason: string) => void;
  setMood: (mood: AuraMood) => void;
  setMode: (mode: ChronoModeSlug) => void;
  clearLedger: () => void;
};

const initial: AuraState = {
  ocean: {
    openness: 0.8,
    conscientiousness: 0.65,
    extraversion: 0.55,
    agreeableness: 0.7,
    neuroticism: 0.4,
  },
  mood: "neutral",
  mode: "azure",
  ledger: [],
};

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

export const useAuraStore = create<AuraState & AuraActions>()((set) => ({
  ...initial,
  setOcean: (ocean) => set({ ocean }),
  nudgeOcean: (delta, reason) =>
    set((s) => {
      const next: OceanVector = { ...s.ocean };
      (Object.keys(delta) as (keyof OceanVector)[]).forEach((k) => {
        const d = delta[k];
        if (typeof d === "number") next[k] = clamp01(s.ocean[k] + d);
      });
      return {
        ocean: next,
        ledger: [
          ...s.ledger,
          { at: new Date().toISOString(), delta, reason },
        ],
      };
    }),
  setMood: (mood) => set({ mood }),
  setMode: (mode) => set({ mode }),
  clearLedger: () => set({ ledger: [] }),
}));

export const auraStore = useAuraStore;

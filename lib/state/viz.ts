/**
 * lib/state/viz.ts — Zustand slice: attractor parameters, particle counts, active visualisations.
 *
 * One-line role: shared state-bus for the studio's running visualisations and their parameters.
 * Full purpose in viz.PURPOSE.md.
 */

import { create } from "zustand";

export type AttractorEngine = "clifford" | "thomas" | "lorenz" | "dequan-li";

export type AttractorParams = {
  engine: AttractorEngine;
  /** Per-engine parameter pack — opaque shape, the attractor capability narrows it. */
  values: Record<string, number>;
  /** Particle count for the current run. Capped by the capability per device profile. */
  particleCount: number;
};

export type ParticleField = {
  id: string;
  count: number;
  /** "bone-anchored" | "free" | "emitted" — emission source. */
  source: string;
};

export type VizState = {
  attractor: AttractorParams;
  particleFields: Record<string, ParticleField>;
  /** IDs of currently running visualisations. Used by the cleanup/lifecycle layer. */
  active: string[];
};

export type VizActions = {
  setAttractor: (params: AttractorParams) => void;
  setAttractorEngine: (engine: AttractorEngine) => void;
  setAttractorValue: (key: string, value: number) => void;
  upsertParticleField: (field: ParticleField) => void;
  removeParticleField: (id: string) => void;
  setActive: (ids: string[]) => void;
};

const initial: VizState = {
  attractor: {
    engine: "clifford",
    values: {},
    particleCount: 65_536,
  },
  particleFields: {},
  active: [],
};

export const useVizStore = create<VizState & VizActions>()((set) => ({
  ...initial,
  setAttractor: (params) => set({ attractor: params }),
  setAttractorEngine: (engine) =>
    set((s) => ({ attractor: { ...s.attractor, engine } })),
  setAttractorValue: (key, value) =>
    set((s) => ({
      attractor: {
        ...s.attractor,
        values: { ...s.attractor.values, [key]: value },
      },
    })),
  upsertParticleField: (field) =>
    set((s) => ({
      particleFields: { ...s.particleFields, [field.id]: field },
    })),
  removeParticleField: (id) =>
    set((s) => {
      const next = { ...s.particleFields };
      delete next[id];
      return { particleFields: next };
    }),
  setActive: (ids) => set({ active: ids }),
}));

export const vizStore = useVizStore;

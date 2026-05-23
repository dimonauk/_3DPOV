/**
 * lib/glitch/taxonomy.test.ts — Unit tests for the pure helpers.
 *
 * Covers the contract that the Zustand slice + post effect both rely
 * on:
 *
 *   - signatureWeight() is 0 on an empty signature
 *   - signatureWeight() saturates near 1 at high token counts
 *   - signatureWeight() rewards genre diversity over single-genre runs
 *   - resolveChain() starts a fresh chain when no existing or genre mismatch
 *   - resolveChain() compounds depth + intensity within one genre
 *   - resolveChain() caps depth at CHAIN_DEPTH_CAP
 *   - chainsWeight() is 0 on empty map
 *   - chainsWeight() is clamped to 1 at saturation
 *
 * No store / Firebase touched here — pure helpers only.
 */

import { describe, expect, it } from "vitest";

import {
  CHAIN_DEPTH_CAP,
  GlitchFamily,
  GlitchGenre,
  chainsWeight,
  resolveChain,
  signatureWeight,
  type GlitchChain,
  type GlitchSignature,
  type GlitchToken,
} from "./taxonomy";

const EMPTY_SIG: GlitchSignature = {
  tokenCounts: {} as GlitchSignature["tokenCounts"],
  genreCounts: {} as GlitchSignature["genreCounts"],
  totalTokens: 0,
  firstSeenAt: null,
  lastSeenAt: null,
};

function tok(family: keyof typeof GlitchFamily, firedAt = 1_000): GlitchToken {
  return {
    id: `${family}-${firedAt}`,
    family,
    genre: GlitchFamily[family].genre,
    firedAt,
    meta: {},
  };
}

describe("signatureWeight", () => {
  it("returns 0 for an empty signature", () => {
    expect(signatureWeight(EMPTY_SIG)).toBe(0);
  });

  it("returns a small positive weight for a single-genre handful of tokens", () => {
    const sig: GlitchSignature = {
      ...EMPTY_SIG,
      tokenCounts: { "atelier.chamber-open": 3 } as GlitchSignature["tokenCounts"],
      genreCounts: { [GlitchGenre.Atelier]: 3 } as GlitchSignature["genreCounts"],
      totalTokens: 3,
      firstSeenAt: 1_000,
      lastSeenAt: 2_000,
    };
    const w = signatureWeight(sig);
    expect(w).toBeGreaterThan(0);
    expect(w).toBeLessThan(0.3);
  });

  it("rewards genre diversity over single-genre accumulation", () => {
    const total = 50;
    const sigSingleGenre: GlitchSignature = {
      ...EMPTY_SIG,
      genreCounts: { [GlitchGenre.Atelier]: total } as GlitchSignature["genreCounts"],
      totalTokens: total,
    };
    const sigDiverse: GlitchSignature = {
      ...EMPTY_SIG,
      genreCounts: {
        [GlitchGenre.Atelier]: 8,
        [GlitchGenre.Navigation]: 8,
        [GlitchGenre.Lore]: 8,
        [GlitchGenre.Chrono]: 8,
        [GlitchGenre.Social]: 8,
        [GlitchGenre.Commerce]: 5,
        [GlitchGenre.Error]: 5,
      } as GlitchSignature["genreCounts"],
      totalTokens: total,
    };
    expect(signatureWeight(sigDiverse)).toBeGreaterThan(
      signatureWeight(sigSingleGenre),
    );
  });

  it("saturates near 1 for a very high token count + all genres touched", () => {
    const sig: GlitchSignature = {
      ...EMPTY_SIG,
      genreCounts: {
        [GlitchGenre.Atelier]: 200,
        [GlitchGenre.Navigation]: 200,
        [GlitchGenre.Lore]: 200,
        [GlitchGenre.Chrono]: 200,
        [GlitchGenre.Social]: 200,
        [GlitchGenre.Commerce]: 200,
        [GlitchGenre.Error]: 200,
      } as GlitchSignature["genreCounts"],
      totalTokens: 1400,
    };
    expect(signatureWeight(sig)).toBeCloseTo(1, 1);
  });

  it("never returns a value outside [0, 1]", () => {
    const sigHuge: GlitchSignature = {
      ...EMPTY_SIG,
      genreCounts: {
        [GlitchGenre.Atelier]: 10_000,
      } as GlitchSignature["genreCounts"],
      totalTokens: 10_000,
    };
    const w = signatureWeight(sigHuge);
    expect(w).toBeGreaterThanOrEqual(0);
    expect(w).toBeLessThanOrEqual(1);
  });
});

describe("resolveChain", () => {
  it("starts a fresh chain when nothing exists", () => {
    const t = tok("atelier.chamber-open", 5_000);
    const chain = resolveChain(undefined, t);
    expect(chain.depth).toBe(1);
    expect(chain.genre).toBe(GlitchGenre.Atelier);
    expect(chain.firstFiredAt).toBe(5_000);
    expect(chain.lastFiredAt).toBe(5_000);
    expect(chain.tokenIds).toHaveLength(1);
    expect(chain.intensity).toBe(GlitchFamily["atelier.chamber-open"].weight);
  });

  it("starts a fresh chain when an existing chain is in a different genre", () => {
    const navChain: GlitchChain = {
      genre: GlitchGenre.Navigation,
      depth: 3,
      intensity: 5,
      firstFiredAt: 100,
      lastFiredAt: 500,
      tokenIds: ["a", "b", "c"],
    };
    const t = tok("atelier.chamber-open", 1_000);
    const chain = resolveChain(navChain, t);
    expect(chain.genre).toBe(GlitchGenre.Atelier);
    expect(chain.depth).toBe(1);
    expect(chain.firstFiredAt).toBe(1_000);
  });

  it("compounds depth and intensity when same-genre", () => {
    const t1 = tok("atelier.chamber-open", 1_000);
    const t2 = tok("atelier.output-saved", 2_000);
    const c1 = resolveChain(undefined, t1);
    const c2 = resolveChain(c1, t2);
    expect(c2.depth).toBe(2);
    expect(c2.intensity).toBe(
      GlitchFamily["atelier.chamber-open"].weight +
        GlitchFamily["atelier.output-saved"].weight,
    );
    expect(c2.firstFiredAt).toBe(1_000);
    expect(c2.lastFiredAt).toBe(2_000);
    expect(c2.tokenIds).toHaveLength(2);
  });

  it("caps depth at CHAIN_DEPTH_CAP", () => {
    let chain: GlitchChain | undefined;
    for (let i = 0; i < CHAIN_DEPTH_CAP + 5; i++) {
      chain = resolveChain(chain, tok("atelier.chamber-open", i * 100));
    }
    expect(chain!.depth).toBe(CHAIN_DEPTH_CAP);
  });
});

describe("chainsWeight", () => {
  it("returns 0 on empty map", () => {
    expect(chainsWeight(new Map())).toBe(0);
  });

  it("is bounded to [0, 1]", () => {
    const m = new Map<GlitchGenre, GlitchChain>();
    for (const g of Object.values(GlitchGenre)) {
      m.set(g, {
        genre: g,
        depth: CHAIN_DEPTH_CAP,
        intensity: 10,
        firstFiredAt: 0,
        lastFiredAt: 1,
        tokenIds: [],
      });
    }
    const w = chainsWeight(m);
    expect(w).toBeGreaterThan(0.5);
    expect(w).toBeLessThanOrEqual(1);
  });

  it("scales with chain depth", () => {
    const shallow = new Map<GlitchGenre, GlitchChain>([
      [
        GlitchGenre.Atelier,
        {
          genre: GlitchGenre.Atelier,
          depth: 1,
          intensity: 1,
          firstFiredAt: 0,
          lastFiredAt: 1,
          tokenIds: [],
        },
      ],
    ]);
    const deep = new Map<GlitchGenre, GlitchChain>([
      [
        GlitchGenre.Atelier,
        {
          genre: GlitchGenre.Atelier,
          depth: CHAIN_DEPTH_CAP,
          intensity: 10,
          firstFiredAt: 0,
          lastFiredAt: 1,
          tokenIds: [],
        },
      ],
    ]);
    expect(chainsWeight(deep)).toBeGreaterThan(chainsWeight(shallow));
  });
});

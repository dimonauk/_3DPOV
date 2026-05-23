/**
 * lib/state/glitch.test.ts — Unit tests for the Zustand slice.
 *
 * Covers the runtime behaviour of fireEvent / tickDecay /
 * restoreSignature without touching Firestore. Persistence is
 * exercised indirectly: fireEvent's catch-block must not throw if
 * Firebase isn't configured (which it isn't in test).
 *
 * Each test resets the store via `clearSession()` + a manual
 * signature reset, and uses fake timers when chain TTL is involved.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  GlitchGenre,
  type GlitchSignature,
} from "lib/glitch/taxonomy";
import { useGlitchStore } from "./glitch";

const EMPTY_SIG: GlitchSignature = {
  tokenCounts: {} as GlitchSignature["tokenCounts"],
  genreCounts: {} as GlitchSignature["genreCounts"],
  totalTokens: 0,
  firstSeenAt: null,
  lastSeenAt: null,
};

beforeEach(() => {
  // Reset the singleton store before each test.
  useGlitchStore.setState({
    tokens: [],
    activeChains: new Map(),
    signature: EMPTY_SIG,
    signatureWeight: 0,
    uid: null,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("fireEvent", () => {
  it("creates a token and advances state for the first call", () => {
    const t = useGlitchStore.getState().fireEvent("atelier.chamber-open");
    const s = useGlitchStore.getState();
    expect(t.family).toBe("atelier.chamber-open");
    expect(t.genre).toBe(GlitchGenre.Atelier);
    expect(s.tokens).toHaveLength(1);
    expect(s.activeChains.get(GlitchGenre.Atelier)?.depth).toBe(1);
    expect(s.signature.totalTokens).toBe(1);
    expect(s.signatureWeight).toBeGreaterThan(0);
  });

  it("compounds same-genre chain depth across multiple events", () => {
    const fire = useGlitchStore.getState().fireEvent;
    fire("atelier.chamber-open");
    fire("atelier.output-saved");
    fire("atelier.cross-chamber");
    const chain = useGlitchStore.getState().activeChains.get(GlitchGenre.Atelier);
    expect(chain?.depth).toBe(3);
    expect(chain?.tokenIds).toHaveLength(3);
  });

  it("starts a new chain when a different-genre event fires", () => {
    const fire = useGlitchStore.getState().fireEvent;
    fire("atelier.chamber-open");
    fire("nav.page-change");
    const chains = useGlitchStore.getState().activeChains;
    expect(chains.size).toBe(2);
    expect(chains.get(GlitchGenre.Atelier)?.depth).toBe(1);
    expect(chains.get(GlitchGenre.Navigation)?.depth).toBe(1);
  });

  it("caps the session ring at SESSION_RING tokens", () => {
    const fire = useGlitchStore.getState().fireEvent;
    for (let i = 0; i < 200; i++) fire("nav.page-change");
    expect(useGlitchStore.getState().tokens.length).toBeLessThanOrEqual(120);
  });

  it("persists fire-and-forget — does not throw without Firebase env", () => {
    expect(() => useGlitchStore.getState().fireEvent("nav.page-change")).not.toThrow();
  });
});

describe("tickDecay", () => {
  it("removes chains whose lastFiredAt is older than the TTL", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    useGlitchStore.getState().fireEvent("atelier.chamber-open");
    expect(useGlitchStore.getState().activeChains.size).toBe(1);

    // Advance past the 12s TTL.
    vi.setSystemTime(new Date("2026-01-01T00:00:13Z"));
    useGlitchStore.getState().tickDecay();
    expect(useGlitchStore.getState().activeChains.size).toBe(0);
  });

  it("leaves a recent chain alone", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    useGlitchStore.getState().fireEvent("atelier.chamber-open");
    vi.setSystemTime(new Date("2026-01-01T00:00:05Z"));
    useGlitchStore.getState().tickDecay();
    expect(useGlitchStore.getState().activeChains.size).toBe(1);
  });
});

describe("restoreSignature", () => {
  it("loads a persisted signature and recomputes the visual weight", () => {
    const sig: GlitchSignature = {
      tokenCounts: {} as GlitchSignature["tokenCounts"],
      genreCounts: { [GlitchGenre.Atelier]: 30 } as GlitchSignature["genreCounts"],
      totalTokens: 30,
      firstSeenAt: 100,
      lastSeenAt: 9_000,
    };
    useGlitchStore.getState().restoreSignature(sig, "uid-abc");
    const s = useGlitchStore.getState();
    expect(s.uid).toBe("uid-abc");
    expect(s.signature.totalTokens).toBe(30);
    expect(s.signatureWeight).toBeGreaterThan(0);
  });
});

describe("clearSession", () => {
  it("clears tokens + chains but preserves signature and uid", () => {
    const fire = useGlitchStore.getState().fireEvent;
    fire("atelier.chamber-open");
    useGlitchStore.setState({ uid: "preserved-uid" });
    useGlitchStore.getState().clearSession();
    const s = useGlitchStore.getState();
    expect(s.tokens).toHaveLength(0);
    expect(s.activeChains.size).toBe(0);
    expect(s.signature.totalTokens).toBe(1);
    expect(s.uid).toBe("preserved-uid");
  });
});

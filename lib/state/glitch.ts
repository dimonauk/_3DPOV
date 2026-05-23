/**
 * lib/state/glitch.ts — Zustand slice: glitch event bus, token accumulation,
 * user signature, and active chain state.
 *
 * The glitch system is the site's native event language. Every meaningful
 * thing that happens in the Hangar fires a GlitchEvent. Events produce
 * GlitchTokens. Tokens accumulate into the user's GlitchSignature —
 * their permanent identity on the site, stored to Firestore and restored
 * on return visits. Chains of tokens from the same genre compound into
 * GlitchChains whose visual weight scales with depth.
 *
 * Persistence: signature is written to Firestore (anonymous uid) on every
 * token push. Chain state is session-only — it decays after CHAIN_TTL_MS.
 *
 * The TSL post layer reads `activeChains` and `signatureWeight` to drive
 * the glitch-composite effect in lib/tsl-post/effects/glitch-composite.ts.
 */

import { create } from "zustand";
import {
  GlitchGenre,
  GlitchFamily,
  type GlitchToken,
  type GlitchChain,
  type GlitchSignature,
  resolveChain,
  signatureWeight,
} from "lib/glitch/taxonomy";

export type { GlitchToken, GlitchChain, GlitchSignature };
export { GlitchGenre, GlitchFamily };

/** How long (ms) a chain stays hot before it cools and decays visually. */
const CHAIN_TTL_MS = 12_000;

/** Max tokens held in session ring-buffer (does not affect persisted signature). */
const SESSION_RING = 120;

export type GlitchState = {
  /** Session ring-buffer — most recent last. Capped at SESSION_RING. */
  tokens: GlitchToken[];
  /** Active chains — genre-keyed, decaying over time. */
  activeChains: Map<GlitchGenre, GlitchChain>;
  /** Accumulated user signature across all sessions. */
  signature: GlitchSignature;
  /** Scalar 0–1: overall visual weight for the post effect. */
  signatureWeight: number;
  /** Firestore uid bound to this signature (anonymous). Null until auth resolves. */
  uid: string | null;
};

export type GlitchActions = {
  /**
   * Fire a glitch event. Produces a token, advances the relevant chain,
   * and updates the signature weight. The UI layer calls this; Python
   * services call it via the /api/glitch/event route which calls this
   * on the server-push path.
   */
  fireEvent: (
    family: GlitchFamily,
    meta?: Record<string, unknown>,
  ) => GlitchToken;
  /** Decay stale chains — call from a requestAnimationFrame loop. */
  tickDecay: () => void;
  /** Restore a persisted signature on mount (from Firestore). */
  restoreSignature: (sig: GlitchSignature, uid: string) => void;
  /** Clear session state only (not the persisted signature). */
  clearSession: () => void;
};

const EMPTY_SIGNATURE: GlitchSignature = {
  tokenCounts: {} as Record<GlitchFamily, number>,
  genreCounts: {} as Record<GlitchGenre, number>,
  totalTokens: 0,
  firstSeenAt: null,
  lastSeenAt: null,
};

const initial: GlitchState = {
  tokens: [],
  activeChains: new Map(),
  signature: EMPTY_SIGNATURE,
  signatureWeight: 0,
  uid: null,
};

export const useGlitchStore = create<GlitchState & GlitchActions>()(
  (set, get) => ({
    ...initial,

    fireEvent: (family, meta = {}) => {
      const token: GlitchToken = {
        id: makeTokenId(),
        family,
        genre: GlitchFamily[family].genre,
        firedAt: Date.now(),
        meta,
      };

      set((s) => {
        // --- session ring ---
        const tokens = [...s.tokens, token].slice(-SESSION_RING);

        // --- chain advance ---
        const chains = new Map(s.activeChains);
        const existing = chains.get(token.genre);
        const chain = resolveChain(existing, token);
        chains.set(token.genre, chain);

        // --- signature ---
        const sig = advanceSignature(s.signature, token);
        const weight = signatureWeight(sig);

        return { tokens, activeChains: chains, signature: sig, signatureWeight: weight };
      });

      // Async-persist signature (fire-and-forget; errors logged by caller).
      persistSignature(get().signature, get().uid).catch(() => undefined);

      return token;
    },

    tickDecay: () => {
      const now = Date.now();
      set((s) => {
        let changed = false;
        const chains = new Map(s.activeChains);
        for (const [genre, chain] of chains) {
          if (now - chain.lastFiredAt > CHAIN_TTL_MS) {
            chains.delete(genre);
            changed = true;
          }
        }
        return changed ? { activeChains: chains } : s;
      });
    },

    restoreSignature: (sig, uid) => {
      set({ signature: sig, uid, signatureWeight: signatureWeight(sig) });
    },

    clearSession: () =>
      set({ tokens: [], activeChains: new Map() }),
  }),
);

export const glitchStore = useGlitchStore;

// ---------------------------------------------------------------------------
// Helpers (module-private)
// ---------------------------------------------------------------------------

/**
 * Stable token id. Uses the global Web Crypto `randomUUID` where it's
 * available (Node 18+, every modern browser) and falls back to a
 * timestamped pseudo-random string when it isn't (very old browsers,
 * non-crypto sandboxes). The fallback is non-collision-resistant but
 * good enough for ring-buffer deduping.
 */
function makeTokenId(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function advanceSignature(
  prev: GlitchSignature,
  token: GlitchToken,
): GlitchSignature {
  const tokenCounts = {
    ...prev.tokenCounts,
    [token.family]: (prev.tokenCounts[token.family] ?? 0) + 1,
  } as Record<GlitchFamily, number>;

  const genreCounts = {
    ...prev.genreCounts,
    [token.genre]: (prev.genreCounts[token.genre] ?? 0) + 1,
  } as Record<GlitchGenre, number>;

  return {
    tokenCounts,
    genreCounts,
    totalTokens: prev.totalTokens + 1,
    firstSeenAt: prev.firstSeenAt ?? token.firedAt,
    lastSeenAt: token.firedAt,
  };
}

async function persistSignature(
  sig: GlitchSignature,
  uid: string | null,
): Promise<void> {
  if (!uid) return;
  // Dynamic import — avoids Firebase SDK in non-browser bundles.
  const { doc, setDoc } = await import("firebase/firestore");
  const { getFirebaseDb } = await import("lib/firebase/client");
  const db = getFirebaseDb();
  // No Firestore in this environment (missing env vars in local dev) —
  // signature accumulates in memory until a configured session sees it.
  if (!db) return;
  await setDoc(
    doc(db, "glitch-signatures", uid),
    { ...sig, updatedAt: Date.now() },
    { merge: true },
  );
}

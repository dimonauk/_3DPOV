"use client";

/**
 * components/glitch/GlitchProvider.tsx
 *
 * Wires the glitch event system at the app shell:
 *
 *   1. Anonymous (or signed-in) Firebase uid → restoreSignature.
 *      When the visitor is signed in via Google, their existing uid is
 *      used so the signature follows them across devices. Otherwise
 *      `signInAnonymously` mints a per-device uid that persists across
 *      sessions on the same browser.
 *
 *   2. Signature restore from `glitch-signatures/<uid>`. Best-effort:
 *      a missing doc is normal for a first-time visitor and is treated
 *      as the empty signature.
 *
 *   3. A 500 ms tickDecay loop. Chain TTL is 12 s, so coarse ticks
 *      are fine. Uses setInterval rather than RAF so it keeps ticking
 *      while the tab is backgrounded (chains do age in the background).
 *
 * Mounted once inside `<AuthProvider>` in `app/layout.tsx`. Renders
 * `children` directly — there's no shared context value, the glitch
 * store is read by consumers via `useGlitchStore` directly.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { createLogger, errToObject } from "lib/log";
import { isFirebaseConfigured } from "lib/firebase/client";
import { useGlitchStore } from "lib/state/glitch";
import {
  ALL_FAMILIES,
  ALL_GENRES,
  type GlitchFamily,
  type GlitchSignature,
} from "lib/glitch/taxonomy";
import { useAuth } from "components/auth/auth-provider";

const log = createLogger("glitch:provider");

const DECAY_INTERVAL_MS = 500;

export function GlitchProvider({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  // --- Decay loop: cheap setInterval; survives tab-backgrounding. ---
  useEffect(() => {
    const tick = useGlitchStore.getState().tickDecay;
    const id = setInterval(tick, DECAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // --- Navigation + surface events: fire on every pathname change. ---
  // Skipped on the very first mount so a fresh page-load doesn't
  // count as a navigation event; subsequent transitions do, plus the
  // surface-specific family for whichever section the visitor landed on.
  useEffect(() => {
    if (lastPathRef.current === null) {
      lastPathRef.current = pathname;
      return;
    }
    if (lastPathRef.current === pathname) return;
    const previous = lastPathRef.current;
    lastPathRef.current = pathname;
    const fire = useGlitchStore.getState().fireEvent;
    fire("nav.page-change", { to: pathname, from: previous });
    const surface = detectSurfaceFamily(pathname);
    if (surface) fire(surface, { pathname });
  }, [pathname]);

  // --- Identity + signature restore. ---
  useEffect(() => {
    if (loading) return;
    if (!configured || !isFirebaseConfigured()) return;

    let cancelled = false;

    void (async () => {
      try {
        // Resolve a uid: the signed-in user's, or an anonymous one.
        const uid = user?.uid ?? (await ensureAnonymousUid());
        if (cancelled || !uid) return;

        const sig = await loadSignature(uid);
        if (cancelled) return;

        useGlitchStore.getState().restoreSignature(sig, uid);
        log.debug("signature_restored", {
          uid,
          totalTokens: sig.totalTokens,
        });
      } catch (err) {
        log.warn("glitch_provider:init_failed", { err: errToObject(err) });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loading, configured]);

  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Surface mapping — translate a destination pathname into the most
// specific GlitchFamily, or null if no family applies.
//
// Centralising this here means the chamber pages, codex routes,
// article pages etc. don't need to know about the glitch system at
// all. Adding a new surface family is a one-line entry in this map.
// ---------------------------------------------------------------------------

const SURFACE_MAP: ReadonlyArray<{
  match: RegExp;
  family: GlitchFamily;
}> = [
  { match: /^\/atelier\/[^/]+/, family: "atelier.chamber-open" },
  { match: /^\/codex\/[^/]+/, family: "lore.codex-read" },
  { match: /^\/articles\/[^/]+/, family: "lore.article-read" },
  { match: /^\/journal\/[^/]+/, family: "lore.canon-deep-link" },
  { match: /^\/tutorials\/[^/]+/, family: "lore.tutorial-completed" },
  { match: /^\/c\/[^/]+/, family: "social.card-scanned" },
  { match: /^\/cards\/[^/]+/, family: "social.card-scanned" },
  { match: /^\/holo-walk\/[^/]+/, family: "social.holo-walk-plaque" },
  { match: /^\/rookery(\/|$)/, family: "social.rookery-visit" },
  { match: /^\/bureau\/checkout\/[^/]+/, family: "commerce.bureau-quote" },
  { match: /^\/drops\/[^/]+\/claim/, family: "commerce.drop-claim" },
];

function detectSurfaceFamily(pathname: string): GlitchFamily | null {
  for (const entry of SURFACE_MAP) {
    if (entry.match.test(pathname)) return entry.family;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Helpers (module-private, lazy-imported so Firebase doesn't bloat the
// non-glitch bundle).
// ---------------------------------------------------------------------------

async function ensureAnonymousUid(): Promise<string | null> {
  const { getFirebaseAuth } = await import("lib/firebase/client");
  const auth = getFirebaseAuth();
  if (!auth) return null;
  if (auth.currentUser?.uid) return auth.currentUser.uid;

  const { signInAnonymously } = await import("firebase/auth");
  const cred = await signInAnonymously(auth);
  return cred.user.uid;
}

async function loadSignature(uid: string): Promise<GlitchSignature> {
  const { getFirebaseDb } = await import("lib/firebase/client");
  const db = getFirebaseDb();
  if (!db) return emptySignature();

  const { doc, getDoc } = await import("firebase/firestore");
  const snap = await getDoc(doc(db, "glitch-signatures", uid));
  if (!snap.exists()) return emptySignature();
  return coerceSignature(snap.data());
}

function emptySignature(): GlitchSignature {
  return {
    tokenCounts: Object.fromEntries(ALL_FAMILIES.map((f) => [f, 0])) as GlitchSignature["tokenCounts"],
    genreCounts: Object.fromEntries(ALL_GENRES.map((g) => [g, 0])) as GlitchSignature["genreCounts"],
    totalTokens: 0,
    firstSeenAt: null,
    lastSeenAt: null,
  };
}

/**
 * Defensive shape coercion — Firestore can return any shape, and the
 * stored doc may pre-date a taxonomy edit. We drop unknown keys, fill
 * missing keys with 0, and treat malformed fields as the empty
 * baseline. Missing/added genres do not crash the visitor's session.
 */
function coerceSignature(raw: unknown): GlitchSignature {
  const empty = emptySignature();
  if (!raw || typeof raw !== "object") return empty;
  const r = raw as Record<string, unknown>;

  const tokenCounts = { ...empty.tokenCounts };
  if (r.tokenCounts && typeof r.tokenCounts === "object") {
    for (const f of ALL_FAMILIES) {
      const v = (r.tokenCounts as Record<string, unknown>)[f];
      if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
        tokenCounts[f] = v;
      }
    }
  }

  const genreCounts = { ...empty.genreCounts };
  if (r.genreCounts && typeof r.genreCounts === "object") {
    for (const g of ALL_GENRES) {
      const v = (r.genreCounts as Record<string, unknown>)[g];
      if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
        genreCounts[g] = v;
      }
    }
  }

  const totalTokens =
    typeof r.totalTokens === "number" && r.totalTokens >= 0 ? r.totalTokens : 0;
  const firstSeenAt =
    typeof r.firstSeenAt === "number" ? r.firstSeenAt : null;
  const lastSeenAt =
    typeof r.lastSeenAt === "number" ? r.lastSeenAt : null;

  return { tokenCounts, genreCounts, totalTokens, firstSeenAt, lastSeenAt };
}

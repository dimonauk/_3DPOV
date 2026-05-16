/**
 * lib/state/atelier.ts — Zustand slice: cross-chamber state for /atelier/*.
 *
 * One-line role: remembered-params per chamber (persisted), recent-outputs
 * drawer (session), active chamber id (session).
 * Full purpose in atelier.PURPOSE.md.
 *
 * # Why this is a slice not per-chamber stores
 *
 * The chambers' own UI state (current source image, in-flight request,
 * error messages) is local and dies with the chamber instance — keep
 * that on useState. This slice handles state that crosses chamber
 * boundaries: settings the visitor would expect to see remembered on a
 * later visit, outputs they want to dip back into after navigating
 * away, the "which chamber are you in right now" that other surfaces
 * (Aura, nav) might want to read.
 *
 * # What's persisted
 *
 * Only `lastParamsByChamber`. Recent outputs hold blob URLs that don't
 * survive a reload, and `activeChamberId` is session by nature.
 *
 * # Param shape
 *
 * Each chamber stores its own params object under its slug. The slice
 * doesn't enforce a schema — chambers read with `getParams(slug)` and
 * narrow client-side. This avoids needing a discriminated union of every
 * chamber's params here; the chamber owns its own shape.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** A chamber's saved parameters. Opaque to this slice; each chamber
 *  defines + narrows its own shape on read. */
export type ChamberParams = Record<string, unknown>;

/** Kind of output. Determines how `<RecentOutputsDrawer>` renders the
 *  thumbnail + the click-back-into-chamber affordance. */
export type AtelierOutputKind =
  | "image"
  | "stl"
  | "ply"
  | "json"
  | "glb"
  | "audio"
  | "video"
  | "other";

export type AtelierOutput = {
  /** Stable id — chamber-slug + epoch-ms is fine. */
  id: string;
  /** Which chamber produced this. */
  chamberSlug: string;
  /** What it is — drives thumbnail rendering. */
  kind: AtelierOutputKind;
  /** Visitor-readable label for the drawer row. */
  label: string;
  /** Object URL (browser-only) for the artefact. Lifetimes:
   *  - Chamber that pushed it OWNS the underlying Blob/ObjectURL.
   *  - Drawer treats this as read-only; doesn't revoke it.
   *  - URL dies on page reload (session-scoped slice). */
  blobUrl?: string;
  /** Mime type, when known. */
  mimeType?: string;
  /** Size in bytes, when known. */
  sizeBytes?: number;
  /** ISO timestamp. */
  createdAt: string;
  /** Free-form payload for non-blob outputs (e.g. probe JSON). */
  payload?: unknown;
};

export type AtelierState = {
  /** Persisted: last-seen params per chamber slug. */
  lastParamsByChamber: Record<string, ChamberParams>;
  /** Session: ring of the N most-recent outputs across all chambers. */
  recentOutputs: AtelierOutput[];
  /** Session: which chamber the visitor is currently on. */
  activeChamberId: string | null;
};

export type AtelierActions = {
  /** Remember this chamber's current params. Replace, don't merge. */
  setParams: (chamberSlug: string, params: ChamberParams) => void;
  /** Read the saved params for a chamber. Returns null if none. */
  getParams: (chamberSlug: string) => ChamberParams | null;
  /** Push a fresh output. Caps the ring at MAX_RECENT_OUTPUTS. */
  pushOutput: (output: Omit<AtelierOutput, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  }) => void;
  /** Clear all recent outputs (visitor-initiated). */
  clearOutputs: () => void;
  /** Set which chamber the visitor is in. Pass null on unmount. */
  setActiveChamber: (chamberSlug: string | null) => void;
};

const MAX_RECENT_OUTPUTS = 12;

const initial: AtelierState = {
  lastParamsByChamber: {},
  recentOutputs: [],
  activeChamberId: null,
};

export const defaultAtelierState: AtelierState = initial;

export const useAtelierStore = create<AtelierState & AtelierActions>()(
  persist(
    (set, get) => ({
      ...initial,
      setParams: (chamberSlug, params) =>
        set((s) => ({
          lastParamsByChamber: {
            ...s.lastParamsByChamber,
            [chamberSlug]: params,
          },
        })),
      getParams: (chamberSlug) =>
        get().lastParamsByChamber[chamberSlug] ?? null,
      pushOutput: (output) =>
        set((s) => {
          const entry: AtelierOutput = {
            id:
              output.id ??
              `${output.chamberSlug}-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 6)}`,
            createdAt: output.createdAt ?? new Date().toISOString(),
            chamberSlug: output.chamberSlug,
            kind: output.kind,
            label: output.label,
            blobUrl: output.blobUrl,
            mimeType: output.mimeType,
            sizeBytes: output.sizeBytes,
            payload: output.payload,
          };
          const next = [entry, ...s.recentOutputs].slice(
            0,
            MAX_RECENT_OUTPUTS,
          );
          return { recentOutputs: next };
        }),
      clearOutputs: () => set({ recentOutputs: [] }),
      setActiveChamber: (chamberSlug) =>
        set({ activeChamberId: chamberSlug }),
    }),
    {
      name: "holoflow-atelier-v1",
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
      // Persist only the param memory. Recent outputs hold blob URLs
      // that die on reload; activeChamberId is session-scoped.
      partialize: (state) => ({
        lastParamsByChamber: state.lastParamsByChamber,
      }),
    },
  ),
);

export const atelierStore = useAtelierStore;

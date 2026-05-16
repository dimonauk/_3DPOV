/**
 * lib/state/atelier-hooks.ts — Convenience React hooks for the atelier slice.
 *
 * Two of these because every chamber needs them and the boilerplate
 * would otherwise repeat:
 *
 * - `useActiveChamber(slug)` — set the active chamber on mount,
 *   clear on unmount. Drives `<RecentOutputsDrawer>` highlighting +
 *   anything else (Aura, nav) that wants to know where the visitor is.
 *
 * - `pushAtelierOutput(...)` — non-hook helper that delegates to the
 *   slice. Use from event handlers (download click, fetch resolve).
 *
 * Chambers that DON'T produce outputs (voxel-world, isosurface — both
 * live renderers) still call `useActiveChamber` so the active-chamber
 * signal stays accurate.
 */

import { useEffect } from "react";

import { useAtelierStore, type AtelierOutput } from "./atelier";

export function useActiveChamber(slug: string): void {
  useEffect(() => {
    const store = useAtelierStore.getState();
    store.setActiveChamber(slug);
    return () => {
      // Only clear if we're still the active one — if the visitor has
      // already moved to another chamber, that chamber's mount will
      // have overwritten the field, and we shouldn't clobber it.
      const current = useAtelierStore.getState().activeChamberId;
      if (current === slug) store.setActiveChamber(null);
    };
  }, [slug]);
}

export function pushAtelierOutput(
  output: Omit<AtelierOutput, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  },
): void {
  useAtelierStore.getState().pushOutput(output);
}

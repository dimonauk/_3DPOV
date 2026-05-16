/**
 * lib/state/google-ai-key.ts — Zustand slice: visitor's bring-your-own
 * Google AI Studio API key, persisted to localStorage.
 *
 * One-line role: lets a visitor paste their own AI Studio key so the
 * AI generation chambers (Imagen, image-edit) call Google on their
 * quota instead of the studio's. Full purpose in
 * google-ai-key.PURPOSE.md.
 *
 * The key never leaves the visitor's browser server-side: when a
 * chamber call is in flight, the client passes the key in an
 * `X-Visitor-Google-Key` header which the Next.js route forwards to
 * Google verbatim and forgets. The studio's server doesn't store,
 * mirror, or log the key.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type GoogleAiKeyMode = "studio" | "byo";

export type GoogleAiKeyState = {
  /** Visitor's pasted AI Studio key. Empty string when not set. */
  key: string;
  /** Which mode is active right now. */
  mode: GoogleAiKeyMode;
};

export type GoogleAiKeyActions = {
  setKey: (key: string) => void;
  clearKey: () => void;
  setMode: (mode: GoogleAiKeyMode) => void;
};

const initial: GoogleAiKeyState = {
  key: "",
  mode: "studio",
};

export const defaultGoogleAiKeyState: GoogleAiKeyState = initial;

export const useGoogleAiKeyStore = create<
  GoogleAiKeyState & GoogleAiKeyActions
>()(
  persist(
    (set) => ({
      ...initial,
      setKey: (key) => set({ key }),
      clearKey: () => set({ key: "", mode: "studio" }),
      setMode: (mode) => set({ mode }),
    }),
    {
      name: "holoflow-google-ai-key-v1",
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
      // Persist both — the BYO key is the whole point of the slice,
      // and the mode toggle should survive a reload.
      partialize: (state) => ({ key: state.key, mode: state.mode }),
    },
  ),
);

export const googleAiKeyStore = useGoogleAiKeyStore;

/**
 * Headless helper for components calling the AI routes: returns the
 * key to send if the visitor's mode is "byo" and they've actually
 * pasted a key. Otherwise returns null and the route falls back to
 * the studio's server env.
 */
export function activeVisitorKey(state: GoogleAiKeyState): string | null {
  if (state.mode !== "byo") return null;
  const trimmed = state.key.trim();
  return trimmed.length > 0 ? trimmed : null;
}

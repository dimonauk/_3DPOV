/**
 * lib/state/zai-key.ts — Zustand slice: visitor's BYO Z.ai (GLM) API key.
 *
 * Mirrors `lib/state/google-ai-key.ts` and `./anthropic-key.ts`.
 * Z.ai's API is OpenAI-compatible; the chamber routes that accept
 * a Z.ai key forward it via `X-Visitor-Zai-Key`. The shared
 * `gatewayChat` helper at `lib/llm/gateway.ts` detects the `zai/*`
 * model prefix and hits Z.ai's endpoint directly with the visitor's
 * key (bypassing the studio gateway, billing the visitor).
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ZaiKeyMode = "studio" | "byo";

export type ZaiKeyState = {
  key: string;
  mode: ZaiKeyMode;
};

export type ZaiKeyActions = {
  setKey: (key: string) => void;
  clearKey: () => void;
  setMode: (mode: ZaiKeyMode) => void;
};

const initial: ZaiKeyState = { key: "", mode: "studio" };
export const defaultZaiKeyState: ZaiKeyState = initial;

export const useZaiKeyStore = create<ZaiKeyState & ZaiKeyActions>()(
  persist(
    (set) => ({
      ...initial,
      setKey: (key) => set({ key }),
      clearKey: () => set({ key: "", mode: "studio" }),
      setMode: (mode) => set({ mode }),
    }),
    {
      name: "holoflow-zai-key-v1",
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
      partialize: (state) => ({ key: state.key, mode: state.mode }),
    },
  ),
);

export const zaiKeyStore = useZaiKeyStore;

export function activeZaiVisitorKey(state: ZaiKeyState): string | null {
  if (state.mode !== "byo") return null;
  const trimmed = state.key.trim();
  return trimmed.length > 0 ? trimmed : null;
}

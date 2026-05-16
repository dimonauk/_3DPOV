/**
 * lib/state/anthropic-key.ts — Zustand slice: visitor's BYO Anthropic API key.
 *
 * Mirrors `lib/state/google-ai-key.ts` exactly. Persisted to
 * localStorage so the key survives reloads. Default mode is
 * "studio" — the site uses the studio's Vercel AI Gateway BYOK
 * (configured at the team level, never touches the visitor's
 * browser) unless the visitor explicitly opts into their own key.
 *
 * When set + mode is "byo", `activeAnthropicVisitorKey()` returns
 * the trimmed key. AI chambers forward it via the
 * `X-Visitor-Anthropic-Key` request header; the chamber's API route
 * passes that through `visitorKey` to `gatewayChat` from `lib/llm/gateway`,
 * which calls Anthropic's API directly with the visitor's key
 * (bypassing the studio gateway, billing the visitor).
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type AnthropicKeyMode = "studio" | "byo";

export type AnthropicKeyState = {
  key: string;
  mode: AnthropicKeyMode;
};

export type AnthropicKeyActions = {
  setKey: (key: string) => void;
  clearKey: () => void;
  setMode: (mode: AnthropicKeyMode) => void;
};

const initial: AnthropicKeyState = { key: "", mode: "studio" };
export const defaultAnthropicKeyState: AnthropicKeyState = initial;

export const useAnthropicKeyStore = create<
  AnthropicKeyState & AnthropicKeyActions
>()(
  persist(
    (set) => ({
      ...initial,
      setKey: (key) => set({ key }),
      clearKey: () => set({ key: "", mode: "studio" }),
      setMode: (mode) => set({ mode }),
    }),
    {
      name: "holoflow-anthropic-key-v1",
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

export const anthropicKeyStore = useAnthropicKeyStore;

/**
 * Headless helper: returns the visitor's Anthropic key when they've
 * pasted one + opted into BYO mode. Otherwise null and routes fall
 * back to the studio's gateway.
 */
export function activeAnthropicVisitorKey(state: AnthropicKeyState): string | null {
  if (state.mode !== "byo") return null;
  const trimmed = state.key.trim();
  return trimmed.length > 0 ? trimmed : null;
}

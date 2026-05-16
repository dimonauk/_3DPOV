// @vitest-environment happy-dom

/**
 * lib/state/google-ai-key.test.ts — Unit tests for the BYO API-key slice.
 *
 * Covers state defaults, mode + key transitions, the `activeVisitorKey`
 * selector contract (never returns a key in studio mode; trims whitespace
 * in byo mode; returns null for empty/whitespace keys), and the localStorage
 * persist side effect.
 */

import { beforeEach, describe, expect, it } from "vitest";

import {
  activeVisitorKey,
  useGoogleAiKeyStore,
} from "./google-ai-key";

function reset(): void {
  // Restore defaults; preserve actions by mutating state slots only.
  useGoogleAiKeyStore.setState({ key: "", mode: "studio" }, false);
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("holoflow-google-ai-key-v1");
  }
}

describe("google-ai-key slice", () => {
  beforeEach(() => {
    reset();
  });

  describe("defaults", () => {
    it("starts in studio mode with an empty key", () => {
      const s = useGoogleAiKeyStore.getState();
      expect(s.mode).toBe("studio");
      expect(s.key).toBe("");
    });
  });

  describe("setKey + setMode", () => {
    it("setKey stores the value verbatim", () => {
      useGoogleAiKeyStore.getState().setKey("AIza...");
      expect(useGoogleAiKeyStore.getState().key).toBe("AIza...");
    });

    it("setMode switches between studio and byo", () => {
      const { setMode } = useGoogleAiKeyStore.getState();
      setMode("byo");
      expect(useGoogleAiKeyStore.getState().mode).toBe("byo");
      setMode("studio");
      expect(useGoogleAiKeyStore.getState().mode).toBe("studio");
    });
  });

  describe("clearKey", () => {
    it("empties the key", () => {
      const { setKey, clearKey } = useGoogleAiKeyStore.getState();
      setKey("AIza-abc");
      clearKey();
      expect(useGoogleAiKeyStore.getState().key).toBe("");
    });
  });

  describe("activeVisitorKey selector", () => {
    it("returns null in studio mode even if a key is present", () => {
      useGoogleAiKeyStore.setState({ key: "AIza-abc", mode: "studio" });
      expect(activeVisitorKey(useGoogleAiKeyStore.getState())).toBeNull();
    });

    it("returns null in byo mode when key is empty", () => {
      useGoogleAiKeyStore.setState({ key: "", mode: "byo" });
      expect(activeVisitorKey(useGoogleAiKeyStore.getState())).toBeNull();
    });

    it("returns null in byo mode when key is only whitespace", () => {
      useGoogleAiKeyStore.setState({ key: "   \n  ", mode: "byo" });
      expect(activeVisitorKey(useGoogleAiKeyStore.getState())).toBeNull();
    });

    it("returns the trimmed key in byo mode when key is set", () => {
      useGoogleAiKeyStore.setState({
        key: "  AIza-abcdef  ",
        mode: "byo",
      });
      expect(activeVisitorKey(useGoogleAiKeyStore.getState())).toBe(
        "AIza-abcdef",
      );
    });
  });

  describe("localStorage persistence", () => {
    it("writes key + mode to the slice storage key", () => {
      useGoogleAiKeyStore.getState().setKey("AIza-abc");
      useGoogleAiKeyStore.getState().setMode("byo");
      const raw = window.localStorage.getItem("holoflow-google-ai-key-v1");
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!) as {
        state: { key: string; mode: string };
      };
      expect(parsed.state.key).toBe("AIza-abc");
      expect(parsed.state.mode).toBe("byo");
    });
  });
});

// @vitest-environment happy-dom

/**
 * lib/state/atelier.test.ts — Unit tests for the atelier slice.
 *
 * Covers the three pieces this slice owns:
 *   - persisted `lastParamsByChamber` (set, read, multi-chamber isolation)
 *   - session `recentOutputs` (push, ring cap, clear)
 *   - session `activeChamberId` (set, clear)
 *
 * Each test starts from a clean store state; the persist-to-localStorage
 * side effect is verified once.
 */

import { beforeEach, describe, expect, it } from "vitest";

import {
  defaultAtelierState,
  useAtelierStore,
  type AtelierOutput,
} from "./atelier";

function reset(): void {
  // Recreate the initial state; preserve actions by spreading current store.
  useAtelierStore.setState({ ...defaultAtelierState }, false);
  // Clear localStorage so persist-middleware reads from a fresh slate next
  // time the store hydrates.
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("holoflow-atelier-v1");
  }
}

describe("atelier slice", () => {
  beforeEach(() => {
    reset();
  });

  describe("lastParamsByChamber", () => {
    it("returns null for an unknown chamber slug", () => {
      expect(useAtelierStore.getState().getParams("nope")).toBeNull();
    });

    it("writes + reads params for a chamber", () => {
      const { setParams, getParams } = useAtelierStore.getState();
      setParams("lithophane", { scale: 0.5, levels: 10 });
      expect(getParams("lithophane")).toEqual({ scale: 0.5, levels: 10 });
    });

    it("setParams replaces rather than merging", () => {
      const { setParams, getParams } = useAtelierStore.getState();
      setParams("lithophane", { scale: 0.5, levels: 10 });
      setParams("lithophane", { scale: 1.0 });
      expect(getParams("lithophane")).toEqual({ scale: 1.0 });
    });

    it("isolates params across chambers", () => {
      const { setParams, getParams } = useAtelierStore.getState();
      setParams("lithophane", { scale: 0.5 });
      setParams("pixelify", { width: 96 });
      expect(getParams("lithophane")).toEqual({ scale: 0.5 });
      expect(getParams("pixelify")).toEqual({ width: 96 });
    });

    it("persists lastParamsByChamber to localStorage under the slice key", () => {
      useAtelierStore.getState().setParams("foo", { a: 1 });
      const raw = window.localStorage.getItem("holoflow-atelier-v1");
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!) as {
        state: { lastParamsByChamber: Record<string, unknown> };
      };
      expect(parsed.state.lastParamsByChamber["foo"]).toEqual({ a: 1 });
    });

    it("does NOT persist recentOutputs (they hold dead-on-reload object URLs)", () => {
      useAtelierStore.getState().pushOutput({
        chamberSlug: "pixelify",
        kind: "image",
        label: "x.png",
      });
      const raw = window.localStorage.getItem("holoflow-atelier-v1");
      // After the push, persist runs because the store moved. The
      // partialize config strips recentOutputs.
      if (raw !== null) {
        const parsed = JSON.parse(raw) as {
          state: { recentOutputs?: AtelierOutput[] };
        };
        expect(parsed.state.recentOutputs).toBeUndefined();
      }
    });
  });

  describe("recentOutputs ring", () => {
    it("pushOutput prepends a fresh entry", () => {
      useAtelierStore.getState().pushOutput({
        chamberSlug: "pixelify",
        kind: "image",
        label: "first.png",
      });
      useAtelierStore.getState().pushOutput({
        chamberSlug: "lithophane",
        kind: "stl",
        label: "second.stl",
      });
      const ring = useAtelierStore.getState().recentOutputs;
      expect(ring).toHaveLength(2);
      expect(ring[0]!.label).toBe("second.stl"); // newest first
      expect(ring[1]!.label).toBe("first.png");
    });

    it("synthesises id + createdAt when missing", () => {
      useAtelierStore.getState().pushOutput({
        chamberSlug: "pixelify",
        kind: "image",
        label: "x.png",
      });
      const entry = useAtelierStore.getState().recentOutputs[0]!;
      expect(entry.id).toMatch(/^pixelify-/);
      expect(entry.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO
    });

    it("honours caller-supplied id + createdAt", () => {
      const fixed = "2026-01-01T00:00:00.000Z";
      useAtelierStore.getState().pushOutput({
        id: "custom-id",
        createdAt: fixed,
        chamberSlug: "pixelify",
        kind: "image",
        label: "x.png",
      });
      const entry = useAtelierStore.getState().recentOutputs[0]!;
      expect(entry.id).toBe("custom-id");
      expect(entry.createdAt).toBe(fixed);
    });

    it("caps the ring at MAX_RECENT_OUTPUTS (12)", () => {
      const { pushOutput } = useAtelierStore.getState();
      for (let i = 0; i < 15; i++) {
        pushOutput({
          chamberSlug: "pixelify",
          kind: "image",
          label: `frame_${i}.png`,
        });
      }
      const ring = useAtelierStore.getState().recentOutputs;
      expect(ring).toHaveLength(12);
      // Newest first; entry 0 should be the 15th push (frame_14).
      expect(ring[0]!.label).toBe("frame_14.png");
      expect(ring[11]!.label).toBe("frame_3.png");
    });

    it("clearOutputs empties the ring", () => {
      const { pushOutput, clearOutputs } = useAtelierStore.getState();
      pushOutput({
        chamberSlug: "pixelify",
        kind: "image",
        label: "x.png",
      });
      clearOutputs();
      expect(useAtelierStore.getState().recentOutputs).toEqual([]);
    });
  });

  describe("activeChamberId", () => {
    it("starts null", () => {
      expect(useAtelierStore.getState().activeChamberId).toBeNull();
    });

    it("setActiveChamber sets and clears", () => {
      const { setActiveChamber } = useAtelierStore.getState();
      setActiveChamber("lithophane");
      expect(useAtelierStore.getState().activeChamberId).toBe("lithophane");
      setActiveChamber(null);
      expect(useAtelierStore.getState().activeChamberId).toBeNull();
    });

    it("setActiveChamber replaces — no stack", () => {
      const { setActiveChamber } = useAtelierStore.getState();
      setActiveChamber("a");
      setActiveChamber("b");
      expect(useAtelierStore.getState().activeChamberId).toBe("b");
    });
  });
});

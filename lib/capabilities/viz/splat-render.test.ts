/**
 * lib/capabilities/viz/splat-render.test.ts — Unit tests for the
 * splat-render capability's pure helpers.
 *
 * The capability is mostly a React component (tested via E2E) plus
 * two pure functions that gate which renderer / which PLY flavour is
 * allowed where. Those gates protect commerce surfaces from
 * research-only renderers and protect web targets from non-standard
 * PLY layouts — both worth pinning down.
 */

import { describe, expect, it } from "vitest";

import {
  pickSplatRenderer,
  RENDERER_FLAVOURS,
  RENDERER_TIER,
  type SplatRenderError,
} from "./splat-render";

describe("pickSplatRenderer", () => {
  it("picks spark-js by default for standard-3dgs records", () => {
    const r = pickSplatRenderer({ plyFlavour: "standard-3dgs" });
    expect(r).toBe("spark-js");
  });

  it("picks postshot-binary on bench-only contexts", () => {
    const r = pickSplatRenderer(
      { plyFlavour: "standard-3dgs" },
      { bench: true },
    );
    expect(r).toBe("postshot-binary");
  });

  it("throws flavour-mismatch for sharp-onnx-raw PLYs (must be converted first)", () => {
    expect(() => pickSplatRenderer({ plyFlavour: "sharp-onnx-raw" })).toThrow(
      /sharp-onnx-raw/,
    );
    try {
      pickSplatRenderer({ plyFlavour: "sharp-onnx-raw" });
    } catch (err) {
      const detail = err as Error & SplatRenderError;
      expect(detail.code).toBe("flavour-mismatch");
    }
  });

  it("throws flavour-mismatch for 4dgs PLYs (no web renderer supports them yet)", () => {
    expect(() =>
      pickSplatRenderer({ plyFlavour: "4dgs-deformable-mlp" }),
    ).toThrow(/4dgs-deformable-mlp/);
    expect(() =>
      pickSplatRenderer({ plyFlavour: "4dgs-canonical-time" }),
    ).toThrow(/4dgs-canonical-time/);
  });
});

describe("RENDERER_TIER + RENDERER_FLAVOURS invariants", () => {
  it("every renderer has a tier", () => {
    expect(RENDERER_TIER["spark-js"]).toBe("web");
    expect(RENDERER_TIER["gsplat-js"]).toBe("web");
    expect(RENDERER_TIER["postshot-binary"]).toBe("bench-only");
  });

  it("every web renderer accepts standard-3dgs (the format pickSplatRenderer guarantees)", () => {
    for (const [name, tier] of Object.entries(RENDERER_TIER)) {
      if (tier !== "web") continue;
      const allowed = RENDERER_FLAVOURS[name as keyof typeof RENDERER_FLAVOURS];
      expect(allowed).toContain("standard-3dgs");
    }
  });
});

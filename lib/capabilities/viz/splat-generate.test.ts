/**
 * lib/capabilities/viz/splat-generate.test.ts — Unit tests for the
 * splat-generate capability's licence helpers.
 *
 * The router itself lives in splat-generate.server.ts and would need
 * network mocking to test in isolation; that lands when we wire a
 * second provider. The licence map + commerce-eligibility predicate
 * are pure and load-bearing — surface code reads them when filtering
 * what can appear on a "buy" surface, and getting them wrong leaks
 * apple-amlr research outputs onto commerce, which we explicitly
 * cannot do.
 */

import { describe, expect, it } from "vitest";

import {
  isSplatCommerceEligible,
  PROVIDER_LICENCE,
  type SplatProvider,
  type SplatRecord,
} from "./splat-generate";

const baseRecord: Omit<SplatRecord, "provider" | "licence"> = {
  id: "test",
  plyFlavour: "standard-3dgs",
  plyUrl: "https://blob.example.com/test.ply",
  plyBytes: 1_000_000,
  gaussianCount: 100_000,
  generatedAt: "2026-05-16T00:00:00.000Z",
  meta: {},
};

describe("PROVIDER_LICENCE", () => {
  it("flags sharp-onnx outputs as research-only (apple-amlr)", () => {
    expect(PROVIDER_LICENCE["sharp-onnx"]).toBe("research-only");
  });

  it("flags studio-rig-native as commercial-ok (studio owns the IP)", () => {
    expect(PROVIDER_LICENCE["studio-rig-native"]).toBe("commercial-ok");
  });

  it("flags hangar-gsplat as commercial-ok (Apache/MIT throughout)", () => {
    expect(PROVIDER_LICENCE["hangar-gsplat"]).toBe("commercial-ok");
  });

  it("flags luma-genie as third-party-commercial (vendor terms apply)", () => {
    expect(PROVIDER_LICENCE["luma-genie"]).toBe("third-party-commercial");
  });

  it("covers every SplatProvider in the union", () => {
    const expected: SplatProvider[] = [
      "sharp-onnx",
      "postshot",
      "studio-rig-native",
      "luma-genie",
      "hangar-gsplat",
      "hangar-4dgs",
    ];
    for (const p of expected) {
      expect(PROVIDER_LICENCE[p]).toBeDefined();
    }
  });
});

describe("isSplatCommerceEligible", () => {
  it("rejects research-only records (apple-amlr SHARP output)", () => {
    const sharp: SplatRecord = {
      ...baseRecord,
      provider: "sharp-onnx",
      licence: "research-only",
    };
    expect(isSplatCommerceEligible(sharp)).toBe(false);
  });

  it("accepts commercial-ok records (studio-owned or Apache/MIT)", () => {
    const studio: SplatRecord = {
      ...baseRecord,
      provider: "studio-rig-native",
      licence: "commercial-ok",
    };
    expect(isSplatCommerceEligible(studio)).toBe(true);
  });

  it("accepts third-party-commercial records (Luma etc — vendor allows)", () => {
    const luma: SplatRecord = {
      ...baseRecord,
      provider: "luma-genie",
      licence: "third-party-commercial",
    };
    expect(isSplatCommerceEligible(luma)).toBe(true);
  });
});

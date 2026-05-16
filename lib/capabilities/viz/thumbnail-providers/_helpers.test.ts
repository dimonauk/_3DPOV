/**
 * lib/capabilities/viz/thumbnail-providers/_helpers.test.ts —
 * Unit tests for the thumbnail-splat helper pure functions.
 */

import { describe, expect, it } from "vitest";

import { bestSplatUrl, formatGaussianCount } from "./_helpers.server";

describe("bestSplatUrl", () => {
  const baseRecord = {
    id: "abc123",
    plyUrl: "https://blob.example/abc.ply",
    gaussianCount: 100_000,
  };

  it("prefers spzUrl when present", () => {
    const url = bestSplatUrl({
      ...baseRecord,
      spzUrl: "https://blob.example/abc.spz",
      ksplatUrl: "https://blob.example/abc.ksplat",
    });
    expect(url).toBe("https://blob.example/abc.spz");
  });

  it("falls back to ksplatUrl when spzUrl is absent", () => {
    const url = bestSplatUrl({
      ...baseRecord,
      ksplatUrl: "https://blob.example/abc.ksplat",
    });
    expect(url).toBe("https://blob.example/abc.ksplat");
  });

  it("falls back to plyUrl when neither compact format exists", () => {
    const url = bestSplatUrl(baseRecord);
    expect(url).toBe("https://blob.example/abc.ply");
  });
});

describe("formatGaussianCount", () => {
  it("formats millions with 2 decimal places + 'M gaussians'", () => {
    expect(formatGaussianCount(1_179_648)).toBe("1.18M gaussians");
    expect(formatGaussianCount(2_500_000)).toBe("2.50M gaussians");
  });

  it("formats thousands with 1 decimal place + 'K gaussians'", () => {
    expect(formatGaussianCount(12_345)).toBe("12.3K gaussians");
    expect(formatGaussianCount(1_000)).toBe("1.0K gaussians");
  });

  it("formats sub-thousand as a plain integer + ' gaussians'", () => {
    expect(formatGaussianCount(0)).toBe("0 gaussians");
    expect(formatGaussianCount(42)).toBe("42 gaussians");
    expect(formatGaussianCount(999)).toBe("999 gaussians");
  });
});

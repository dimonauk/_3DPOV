/**
 * lib/capabilities/ar/window.test.ts — computeARTransform pure-math tests.
 *
 * The transform turns a viewer GPS fix + compass heading + a target's
 * GPS position into a scene-space transform that places the target
 * inside three.js world coordinates. It is the load-bearing pure
 * function behind HoloWalk's outdoor AR.
 *
 * These tests pin down the contract WITHOUT touching browser APIs
 * (no MediaStream, no DeviceOrientation). Pure number-in, number-out.
 */

import { describe, expect, it } from "vitest";

import { computeARTransform } from "./window";

const TRAFALGAR_SQUARE = { lat: 51.50809, lon: -0.12806 };
// ~100 m north of Trafalgar Square (lat is ~111 km per degree).
const TRAFALGAR_100M_NORTH = {
  lat: TRAFALGAR_SQUARE.lat + 100 / 111_111,
  lon: TRAFALGAR_SQUARE.lon,
};

describe("computeARTransform", () => {
  it("reports zero distance when the target is the viewer's own position", () => {
    const t = computeARTransform(
      { ...TRAFALGAR_SQUARE, headingDegrees: 0 },
      { ...TRAFALGAR_SQUARE, renderFromM: 1000, renderToM: 0 },
    );
    expect(t.distanceMeters).toBeLessThan(0.5);
  });

  it("reports ~100m for a target 100m north", () => {
    const t = computeARTransform(
      { ...TRAFALGAR_SQUARE, headingDegrees: 0 },
      { ...TRAFALGAR_100M_NORTH, renderFromM: 1000, renderToM: 5 },
    );
    expect(t.distanceMeters).toBeGreaterThan(95);
    expect(t.distanceMeters).toBeLessThan(105);
  });

  it("places a north-of-viewer target in front of the viewer when facing north", () => {
    const t = computeARTransform(
      { ...TRAFALGAR_SQUARE, headingDegrees: 0 },
      { ...TRAFALGAR_100M_NORTH, renderFromM: 1000, renderToM: 5 },
    );
    // Scene convention: -Z is "forward" (the camera looks down -Z).
    // 100m north + heading 0 (also north) -> target sits in front of camera.
    expect(t.targetPos[2]).toBeLessThan(0);
    // Lateral offset should be tiny because target is dead-ahead.
    expect(Math.abs(t.targetPos[0])).toBeLessThan(2);
  });

  it("flags `arrived` when distance is inside renderToM (close enough)", () => {
    const t = computeARTransform(
      { ...TRAFALGAR_SQUARE, headingDegrees: 0 },
      { ...TRAFALGAR_100M_NORTH, renderFromM: 1000, renderToM: 200 },
    );
    expect(t.arrived).toBe(true); // 100m < renderToM 200m -> "you've arrived"
  });

  it("flags `outOfRange` when distance exceeds renderFromM (too far)", () => {
    const t = computeARTransform(
      { ...TRAFALGAR_SQUARE, headingDegrees: 0 },
      { ...TRAFALGAR_100M_NORTH, renderFromM: 50, renderToM: 10 },
    );
    expect(t.outOfRange).toBe(true); // 100m > renderFromM 50m -> "too far"
  });

  it("returns a finite, non-NaN position for every reasonable input", () => {
    const t = computeARTransform(
      { lat: 0.001, lon: 0.001, headingDegrees: 45 },
      { lat: 0.002, lon: 0.002, renderFromM: 10_000, renderToM: 10 },
    );
    expect(Number.isFinite(t.targetPos[0])).toBe(true);
    expect(Number.isFinite(t.targetPos[1])).toBe(true);
    expect(Number.isFinite(t.targetPos[2])).toBe(true);
    expect(Number.isFinite(t.distanceMeters)).toBe(true);
    expect(Number.isFinite(t.bearing)).toBe(true);
  });

  it("returns a bearing in [0, 360)", () => {
    const t = computeARTransform(
      { ...TRAFALGAR_SQUARE, headingDegrees: 0 },
      { ...TRAFALGAR_100M_NORTH, renderFromM: 1000, renderToM: 5 },
    );
    expect(t.bearing).toBeGreaterThanOrEqual(0);
    expect(t.bearing).toBeLessThan(360);
  });
});

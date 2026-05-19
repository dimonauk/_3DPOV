/**
 * lib/bureau/order.test.ts — pure-function tests.
 *
 * Persistence tests (createOrder, transitionStatus, getOrder) need
 * Firestore mocks — deferred until we have a test admin SDK fixture.
 * For now we cover the pure helpers: mintOrderId format + uniqueness
 * + priceFromQuote pass-through.
 */

import { describe, expect, it } from "vitest";

import { mintEventId, mintOrderId, priceFromQuote } from "./order";
import type { Quote } from "./types";

describe("mintOrderId", () => {
  it("returns a string with the expected shape", () => {
    const id = mintOrderId();
    expect(id).toMatch(/^bo-\d{8}-[0-9a-f]{8}$/);
  });

  it("encodes the date prefix in UTC", () => {
    const date = new Date(Date.UTC(2026, 4, 18, 23, 59, 0));
    const id = mintOrderId(date);
    expect(id.startsWith("bo-20260518-")).toBe(true);
  });

  it("zero-pads month and day", () => {
    const date = new Date(Date.UTC(2026, 0, 1, 12, 0, 0));
    const id = mintOrderId(date);
    expect(id.startsWith("bo-20260101-")).toBe(true);
  });

  it("generates distinct ids in the same millisecond", () => {
    const date = new Date();
    const ids = new Set(Array.from({ length: 100 }, () => mintOrderId(date)));
    // With 8 hex chars of entropy (~4.3B values), 100 IDs colliding
    // is astronomically unlikely. >=99 unique is the threshold we
    // accept to keep this test flake-free without relying on perfect
    // entropy.
    expect(ids.size).toBeGreaterThanOrEqual(99);
  });
});

describe("mintEventId", () => {
  it("matches the evt-<ISO compact>-<4hex> shape", () => {
    const id = mintEventId();
    expect(id).toMatch(/^evt-\d{8}T\d{6}-[0-9a-f]{4}$/);
  });

  it("encodes the timestamp in UTC", () => {
    const date = new Date(Date.UTC(2026, 4, 18, 23, 59, 7));
    const id = mintEventId(date);
    expect(id.startsWith("evt-20260518T235907-")).toBe(true);
  });

  it("zero-pads month / day / hour / minute / second", () => {
    const date = new Date(Date.UTC(2026, 0, 1, 0, 5, 9));
    const id = mintEventId(date);
    expect(id.startsWith("evt-20260101T000509-")).toBe(true);
  });

  it("sorts lexicographically in chronological order", () => {
    const a = mintEventId(new Date(Date.UTC(2026, 0, 1, 12, 0, 0)));
    const b = mintEventId(new Date(Date.UTC(2026, 0, 1, 12, 0, 1)));
    const c = mintEventId(new Date(Date.UTC(2026, 0, 2, 12, 0, 0)));
    expect([c, a, b].sort()).toEqual([a, b, c]);
  });

  it("generates distinct ids in the same second", () => {
    const date = new Date();
    const ids = new Set(Array.from({ length: 50 }, () => mintEventId(date)));
    // With 16 bits of entropy a 50-item set has a ~2% collision rate;
    // accept ≥48 unique to keep the test flake-free without depending
    // on perfect RNG distribution.
    expect(ids.size).toBeGreaterThanOrEqual(48);
  });
});

describe("priceFromQuote", () => {
  it("returns the quote's priceGbp in pence", () => {
    const quote: Quote = {
      quoteId: "q-test",
      imageId: "img-test",
      sizeChoice: "A2",
      paperChoice: "canson-baryta-photographique",
      edition: "limited",
      priceGbp: 28000,
      leadDays: 7,
      paperNotes: "Heavyweight matte. Test.",
      sizeLabel: "A2 — large, 420×594 mm",
      editionLabel: "Limited edition of 25",
      computedAt: "2026-05-18T17:00:00Z",
    };
    expect(priceFromQuote(quote)).toBe(28000);
  });
});

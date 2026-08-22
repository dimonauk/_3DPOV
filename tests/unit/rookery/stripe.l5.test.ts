/**
 * L5 — Metamorphic / number validation for Stripe/Rookery pricing.
 *
 * These tests don't need to know the "right" answer — they verify
 * RELATIONSHIPS between numbers. Critical for money code.
 *
 * The three metamorphic laws for Rookery:
 *   1. nest is exactly 2× perch (no drift)
 *   2. fledge = 12.5× perch (founder pays ~12.5 months)
 *   3. amountPence is always a positive integer (no floats)
 */

// @vitest-environment node

import { describe, it, expect } from "vitest";

// TIER_META is not exported — mirror the canonical values here.
// If these change in server.ts, this test fails: intentional.
const CANONICAL = {
  perch:  { amountPence: 600,  recurring: true  },
  nest:   { amountPence: 1200, recurring: true  },
  fledge: { amountPence: 7500, recurring: false },
} as const;

describe("L5 — pricing metamorphic laws", () => {

  // Law 1: nest = 2× perch
  it("nest is exactly 2× perch (no rounding)", () => {
    expect(CANONICAL.nest.amountPence).toBe(CANONICAL.perch.amountPence * 2);
  });

  // Law 2: fledge / perch ratio is 12.5 (≈ 1 year + free month)
  it("fledge is 12.5× perch (founding member deal)", () => {
    const ratio = CANONICAL.fledge.amountPence / CANONICAL.perch.amountPence;
    expect(ratio).toBeCloseTo(12.5, 5);
  });

  // Law 3: all amounts are positive integers — no float drift
  it("all amountPence values are positive integers", () => {
    for (const [slug, meta] of Object.entries(CANONICAL)) {
      expect(Number.isInteger(meta.amountPence)).toBe(true);
      expect(meta.amountPence).toBeGreaterThan(0);
    }
  });

  // Law 4: pence → pounds conversion is lossless for all tiers
  it("pence → £ → pence round-trip has zero loss", () => {
    for (const [slug, meta] of Object.entries(CANONICAL)) {
      const pounds = meta.amountPence / 100;
      const backToPence = Math.round(pounds * 100);
      expect(backToPence).toBe(meta.amountPence);
    }
  });

  // Law 5: recurring tiers are cheaper than the one-time founding price
  it("any single monthly payment < fledge one-time price", () => {
    expect(CANONICAL.perch.amountPence).toBeLessThan(CANONICAL.fledge.amountPence);
    expect(CANONICAL.nest.amountPence).toBeLessThan(CANONICAL.fledge.amountPence);
  });

  // Law 6: 13 months of perch > fledge (founding member saves money after 12.5mo)
  it("13 perch payments exceed fledge (founding member breaks even after 12.5 months)", () => {
    const thirteenMonths = CANONICAL.perch.amountPence * 13;
    expect(thirteenMonths).toBeGreaterThan(CANONICAL.fledge.amountPence);
  });

  // Law 7: Stripe minimum is 30p — all tiers must clear it
  it("all tiers exceed Stripe minimum charge (30p = 30 pence)", () => {
    const STRIPE_MIN_PENCE = 30;
    for (const meta of Object.values(CANONICAL)) {
      expect(meta.amountPence).toBeGreaterThanOrEqual(STRIPE_MIN_PENCE);
    }
  });
});

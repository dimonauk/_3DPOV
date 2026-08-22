/**
 * L1 — Rookery tier pricing invariants.
 * Pure data tests. No network, no Stripe SDK, no Firestore.
 *
 * These are the most important tests in the commerce codebase.
 * They catch pricing bugs before anything reaches Stripe.
 */

// @vitest-environment node

import { describe, it, expect } from "vitest";
import { tiers, PRICING_STATUS } from "lib/rookery/tiers";

const perch  = tiers.find(t => t.slug === "perch")!;
const nest   = tiers.find(t => t.slug === "nest")!;
const fledge = tiers.find(t => t.slug === "fledge")!;

// ── Tier existence ────────────────────────────────────────────────────────────

describe("tier catalogue completeness", () => {
  it("has exactly three tiers", () => expect(tiers).toHaveLength(3));
  it("perch exists",  () => expect(perch).toBeDefined());
  it("nest exists",   () => expect(nest).toBeDefined());
  it("fledge exists", () => expect(fledge).toBeDefined());
  it("all slugs are unique", () => {
    const slugs = tiers.map(t => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

// ── Cadence invariants ────────────────────────────────────────────────────────

describe("cadence invariants", () => {
  it("perch is recurring",  () => expect(perch.cadence).toBe("recurring"));
  it("nest is recurring",   () => expect(nest.cadence).toBe("recurring"));
  it("fledge is one-time",  () => expect(fledge.cadence).toBe("one-time"));
});

// ── Price string format ───────────────────────────────────────────────────────

describe("price string format", () => {
  it("perch price contains £", () => expect(perch.price).toContain("£"));
  it("nest price contains £",  () => expect(nest.price).toContain("£"));
  it("fledge price contains £", () => expect(fledge.price).toContain("£"));
  it("recurring tiers say / month", () => {
    for (const t of tiers.filter(t => t.cadence === "recurring")) {
      expect(t.price).toMatch(/month/i);
    }
  });
  it("one-time tiers do not say / month", () => {
    for (const t of tiers.filter(t => t.cadence === "one-time")) {
      expect(t.price).not.toMatch(/\/\s*month/i);
    }
  });
});

// ── Prose completeness ────────────────────────────────────────────────────────

describe("prose completeness", () => {
  for (const t of tiers) {
    it(`${t.slug} has a non-empty blurb`, () =>
      expect(t.blurb.trim().length).toBeGreaterThan(10));
    it(`${t.slug} has at least one inclusion bullet`, () =>
      expect(t.includes.length).toBeGreaterThan(0));
    it(`${t.slug} has a non-empty name`, () =>
      expect(t.name.trim().length).toBeGreaterThan(0));
  }
});

// ── PRICING_STATUS gate ───────────────────────────────────────────────────────

describe("pricing status", () => {
  it("PRICING_STATUS is either 'proposed' or 'live'", () =>
    expect(["proposed", "live"]).toContain(PRICING_STATUS));
});

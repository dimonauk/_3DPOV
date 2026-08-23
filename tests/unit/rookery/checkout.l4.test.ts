/**
 * tests/unit/rookery/checkout.l4.test.ts — L4 checkout route integration.
 *
 * L4 = route handler called directly, createCheckoutSession mocked.
 * Tests the full request/response contract of POST /api/stripe/checkout
 * without hitting the real Stripe API.
 *
 * Live tier (STRIPE_SECRET_KEY set): one additional test fires a real
 * Stripe test-mode call and asserts the returned URL shape.
 * Skipped when key is absent so CI stays green without credentials.
 *
 * Coverage:
 *   - 400 on invalid/missing tierSlug
 *   - 400 on missing/malformed email
 *   - 400 on invalid JSON body
 *   - 200 with { url } on valid input (mocked)
 *   - 503 when service-unavailable thrown (Stripe not configured)
 *   - 500 on unexpected Stripe error
 *   - URL contains tier slug + rookery path (shape contract)
 *   [live] real Stripe test-mode session URL starts with https://checkout.stripe.com
 */

// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Mock lib/stripe/server BEFORE the route import ──────────────────────────
vi.mock("lib/stripe/server", () => ({
  createCheckoutSession: vi.fn(),
}));

import { POST } from "app/api/stripe/checkout/route";
import { createCheckoutSession } from "lib/stripe/server";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeReq(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("https://holoflow.co.uk/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

const FAKE_SESSION = {
  id: "cs_test_fake1234",
  url: "https://checkout.stripe.com/c/pay/cs_test_fake1234",
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/stripe/checkout — L4 integration", () => {
  beforeEach(() => {
    vi.mocked(createCheckoutSession).mockResolvedValue(FAKE_SESSION);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Validation: tierSlug ─────────────────────────────────────────────────

  it("returns 400 when tierSlug is missing", async () => {
    const res = await POST(makeReq({ email: "test@example.com" }));
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/tierSlug/);
  });

  it("returns 400 when tierSlug is not a valid tier", async () => {
    const res = await POST(makeReq({ tierSlug: "gold", email: "test@example.com" }));
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/tierSlug/);
    expect(body.error).toMatch(/perch/);
  });

  it.each(["perch", "nest", "fledge"] as const)(
    "accepts valid tierSlug '%s'",
    async (tierSlug) => {
      const res = await POST(makeReq({ tierSlug, email: "test@example.com" }));
      expect(res.status).toBe(200);
    },
  );

  // ── Validation: email ────────────────────────────────────────────────────

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeReq({ tierSlug: "perch" }));
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/email/);
  });

  it("returns 400 when email has no @", async () => {
    const res = await POST(makeReq({ tierSlug: "perch", email: "notanemail" }));
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/email/);
  });

  // ── Validation: body ─────────────────────────────────────────────────────

  it("returns 400 on malformed JSON", async () => {
    const req = new Request("https://holoflow.co.uk/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ not valid json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/invalid JSON/i);
  });

  // ── Happy path ───────────────────────────────────────────────────────────

  it("returns 200 { url } on valid input", async () => {
    const res = await POST(makeReq({ tierSlug: "nest", email: "dolly@holoflow.co.uk" }));
    expect(res.status).toBe(200);
    const body = await res.json() as { url: string };
    expect(body.url).toBe(FAKE_SESSION.url);
  });

  it("calls createCheckoutSession with correct args", async () => {
    await POST(
      makeReq(
        { tierSlug: "fledge", email: "dolly@holoflow.co.uk" },
        { origin: "https://holoflow.co.uk" },
      ),
    );
    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        tierSlug: "fledge",
        customerEmail: "dolly@holoflow.co.uk",
        successUrl: expect.stringContaining("fledge"),
        cancelUrl: expect.stringContaining("rookery"),
      }),
    );
  });

  it("successUrl contains /rookery and the tier slug", async () => {
    const captor: { successUrl?: string } = {};
    vi.mocked(createCheckoutSession).mockImplementationOnce(async (input) => {
      captor.successUrl = input.successUrl;
      return FAKE_SESSION;
    });
    await POST(makeReq({ tierSlug: "perch", email: "test@example.com" }));
    expect(captor.successUrl).toMatch(/rookery/);
    expect(captor.successUrl).toMatch(/perch/);
  });

  // ── Error paths ──────────────────────────────────────────────────────────

  it("returns 503 when Stripe is not configured", async () => {
    vi.mocked(createCheckoutSession).mockRejectedValueOnce(
      Object.assign(new Error("not configured"), { code: "service-unavailable" }),
    );
    const res = await POST(makeReq({ tierSlug: "perch", email: "test@example.com" }));
    expect(res.status).toBe(503);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/not yet configured/i);
  });

  it("returns 500 on unexpected Stripe error", async () => {
    vi.mocked(createCheckoutSession).mockRejectedValueOnce(new Error("network timeout"));
    const res = await POST(makeReq({ tierSlug: "nest", email: "test@example.com" }));
    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/failed/i);
  });
});

// ── Live tier: real Stripe test-mode call ────────────────────────────────────

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY ?? "";
const isLive = STRIPE_KEY.startsWith("sk_test_");

describe.skipIf(!isLive)("POST /api/stripe/checkout — live Stripe test-mode", () => {
  beforeEach(() => {
    // Un-mock for live tier: real createCheckoutSession runs
    vi.restoreAllMocks();
  });

  it("creates a real test-mode session and returns a checkout.stripe.com URL", async () => {
    const res = await POST(
      makeReq({ tierSlug: "perch", email: "test-checkout@holoflow.co.uk" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json() as { url: string };
    expect(body.url).toMatch(/^https:\/\/checkout\.stripe\.com\//);
    expect(body.url).toContain("cs_test_");
  }, 15_000); // 15s timeout — real network call
});

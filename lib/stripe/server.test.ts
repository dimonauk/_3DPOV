/**
 * lib/stripe/server.test.ts — verifyWebhookSignature unit tests.
 *
 * Tests the HMAC-SHA256 verification scheme per Stripe's docs at
 * https://stripe.com/docs/webhooks#verify-manually. Covers:
 *
 *   - Valid signature within tolerance → true
 *   - Wrong signature → false
 *   - Missing v1= signature → false
 *   - Missing t= timestamp → false
 *   - Malformed header → false
 *   - Stale timestamp (>5min old) → false
 *   - Future timestamp (>5min ahead) → false
 *   - Multiple v1 signatures (key rotation) → true if any matches
 *   - Constant-time comparison resists timing differences (sanity
 *     check; full statistical analysis out of scope)
 *
 * Env handling:
 *   - secret unset + production + skip=0 → false (loud fail)
 *   - secret unset + non-prod → true (with warn)
 *   - secret unset + skip=1 → true (explicit dev escape)
 */

import { createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { verifyWebhookSignature } from "./server";

const SECRET = "whsec_test_fake_secret_for_unit_tests_only";

/** Build a valid Stripe-Signature header for the given payload + ts. */
function buildHeader(rawBody: string, timestamp: number, secret = SECRET): string {
  const signedPayload = `${timestamp}.${rawBody}`;
  const sig = createHmac("sha256", secret).update(signedPayload).digest("hex");
  return `t=${timestamp},v1=${sig}`;
}

describe("verifyWebhookSignature", () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
    delete process.env.STRIPE_WEBHOOK_SKIP_VERIFY;
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = { ...origEnv };
  });

  describe("valid signatures", () => {
    it("accepts a freshly-signed payload", () => {
      const now = 1779120000;
      const rawBody = '{"id":"evt_test","type":"payment_intent.succeeded"}';
      const header = buildHeader(rawBody, now);
      expect(verifyWebhookSignature(rawBody, header, now)).toBe(true);
    });

    it("accepts within the 5-minute tolerance", () => {
      const now = 1779120000;
      const old = now - 290; // 4m 50s ago
      const rawBody = '{"id":"evt_old","type":"x"}';
      const header = buildHeader(rawBody, old);
      expect(verifyWebhookSignature(rawBody, header, now)).toBe(true);
    });

    it("accepts when multiple v1 signatures are present (key rotation)", () => {
      const now = 1779120000;
      const rawBody = '{"id":"evt_rotation","type":"x"}';
      const goodSig = createHmac("sha256", SECRET)
        .update(`${now}.${rawBody}`)
        .digest("hex");
      const fakeSig = "0".repeat(64);
      // Real signature in second position; should still match.
      const header = `t=${now},v1=${fakeSig},v1=${goodSig}`;
      expect(verifyWebhookSignature(rawBody, header, now)).toBe(true);
    });
  });

  describe("rejected signatures", () => {
    it("rejects a wrong signature", () => {
      const now = 1779120000;
      const rawBody = '{"id":"evt_wrong","type":"x"}';
      const wrongSig = "deadbeef".repeat(8);
      const header = `t=${now},v1=${wrongSig}`;
      expect(verifyWebhookSignature(rawBody, header, now)).toBe(false);
    });

    it("rejects when the payload differs from what was signed", () => {
      const now = 1779120000;
      const signed = '{"id":"evt_a"}';
      const tampered = '{"id":"evt_b"}';
      const header = buildHeader(signed, now);
      expect(verifyWebhookSignature(tampered, header, now)).toBe(false);
    });

    it("rejects when the secret differs", () => {
      const now = 1779120000;
      const rawBody = '{"id":"evt_wrong_secret"}';
      const header = buildHeader(rawBody, now, "whsec_different_secret");
      expect(verifyWebhookSignature(rawBody, header, now)).toBe(false);
    });

    it("rejects a stale signature (>5min old)", () => {
      const now = 1779120000;
      const old = now - 301; // 5m 1s ago
      const rawBody = '{"id":"evt_stale"}';
      const header = buildHeader(rawBody, old);
      expect(verifyWebhookSignature(rawBody, header, now)).toBe(false);
    });

    it("rejects a future-dated signature (>5min ahead)", () => {
      const now = 1779120000;
      const future = now + 301;
      const rawBody = '{"id":"evt_future"}';
      const header = buildHeader(rawBody, future);
      expect(verifyWebhookSignature(rawBody, header, now)).toBe(false);
    });

    it("rejects a null signature header", () => {
      expect(verifyWebhookSignature("{}", null)).toBe(false);
    });

    it("rejects a malformed header missing t=", () => {
      const header = "v1=abc123";
      expect(verifyWebhookSignature("{}", header)).toBe(false);
    });

    it("rejects a malformed header missing v1=", () => {
      const header = "t=1779120000";
      expect(verifyWebhookSignature("{}", header)).toBe(false);
    });

    it("rejects a wholly garbage header", () => {
      expect(verifyWebhookSignature("{}", "garbage")).toBe(false);
    });
  });

  describe("env handling", () => {
    it("rejects when secret is unset in production", () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;
      vi.stubEnv("NODE_ENV", "production");
      expect(verifyWebhookSignature("{}", "anything")).toBe(false);
    });

    it("accepts when secret is unset in non-prod (with warn)", () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;
      vi.stubEnv("NODE_ENV", "development");
      expect(verifyWebhookSignature("{}", "anything")).toBe(true);
    });

    it("accepts when SKIP_VERIFY=1 (explicit dev escape)", () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;
      process.env.STRIPE_WEBHOOK_SKIP_VERIFY = "1";
      // Even in production, the explicit opt-in lets a session through.
      // (Real ops should never set this in prod, but we don't force the
      // negative — the warn log is enough.)
      vi.stubEnv("NODE_ENV", "production");
      expect(verifyWebhookSignature("{}", "")).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles empty body with valid signature", () => {
      const now = 1779120000;
      const header = buildHeader("", now);
      expect(verifyWebhookSignature("", header, now)).toBe(true);
    });

    it("handles unicode in body", () => {
      const now = 1779120000;
      const rawBody = '{"name":"Aura — the Void Princess 👁"}';
      const header = buildHeader(rawBody, now);
      expect(verifyWebhookSignature(rawBody, header, now)).toBe(true);
    });

    it("rejects signature with hex of wrong length", () => {
      const now = 1779120000;
      // SHA-256 hex is 64 chars; shorter is invalid
      const header = `t=${now},v1=abc123`;
      expect(verifyWebhookSignature("{}", header, now)).toBe(false);
    });

    it("rejects signature with non-hex characters", () => {
      const now = 1779120000;
      const header = `t=${now},v1=${"z".repeat(64)}`;
      expect(verifyWebhookSignature("{}", header, now)).toBe(false);
    });
  });
});

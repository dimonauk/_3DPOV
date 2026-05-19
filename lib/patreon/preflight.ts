/**
 * Startup preflight checks for the Patreon integration.
 *
 * Two non-obvious failure modes this guards against:
 *
 *   1. **Empty webhook secret is a forgeable-signature CVE.** When
 *      `PATREON_WEBHOOK_SECRET` is blank, HMAC-MD5 of any body with an
 *      empty-string key is deterministic and trivially computable by
 *      anyone — they can forge a valid `X-Patreon-Signature` and post
 *      arbitrary tier-claim events. (Discourse hit exactly this in
 *      2024; we refuse to start if the secret is unset.)
 *
 *   2. **Personal-campaign event leakage.** Without
 *      `PATREON_STUDIO_CAMPAIGN_ID`, the webhook can't filter events
 *      from the personal `patreon.com/dimonauk` campaign. If someone
 *      wires both webhooks to the same URL, members:* events from the
 *      personal campaign will be applied to studio claims.
 *
 * Returns `{ ok: true }` when safe to operate. Routes can call this and
 * 503 if false. The CI test suite calls this in setup; production
 * routes call it lazily on first hit so a misconfigured deploy 503s
 * loudly rather than silently mis-applying tier claims.
 */

import "server-only";

import { createLogger } from "lib/log";

const log = createLogger("patreon.preflight");

export type PreflightIssue =
  | "missing-webhook-secret"
  | "missing-studio-campaign-id"
  | "missing-oauth-client-id"
  | "missing-oauth-client-secret"
  | "missing-oauth-redirect-uri"
  | "missing-tier-member-id"
  | "missing-tier-patron-id"
  | "missing-tier-atelier-id"
  | "weak-webhook-secret";

export type PreflightResult =
  | { ok: true; warnings: PreflightIssue[] }
  | { ok: false; errors: PreflightIssue[]; warnings: PreflightIssue[] };

function isStrongSecret(secret: string): boolean {
  return secret.length >= 24;
}

/**
 * Hard requirements: webhook secret + studio campaign id.
 * Without these, the webhook MUST refuse to run.
 *
 * Soft requirements (warnings only): tier IDs + OAuth credentials.
 * Tier IDs can be added later (the webhook will resolve to `null` tier
 * and applyTier will write a `tier: null` claim, which is correct
 * behaviour for "this user has paid but I don't know what tier yet").
 * OAuth credentials are only needed for the user-link flow, not for
 * webhook receipt.
 */
export function patreonPreflight(): PreflightResult {
  const errors: PreflightIssue[] = [];
  const warnings: PreflightIssue[] = [];

  const secret = process.env.PATREON_WEBHOOK_SECRET ?? "";
  if (!secret) {
    errors.push("missing-webhook-secret");
  } else if (!isStrongSecret(secret)) {
    warnings.push("weak-webhook-secret");
  }

  if (!process.env.PATREON_STUDIO_CAMPAIGN_ID) {
    errors.push("missing-studio-campaign-id");
  }

  if (!process.env.PATREON_OAUTH_CLIENT_ID) warnings.push("missing-oauth-client-id");
  if (!process.env.PATREON_OAUTH_CLIENT_SECRET) warnings.push("missing-oauth-client-secret");
  if (!process.env.PATREON_OAUTH_REDIRECT_URI) warnings.push("missing-oauth-redirect-uri");
  if (!process.env.PATREON_TIER_MEMBER_ID) warnings.push("missing-tier-member-id");
  if (!process.env.PATREON_TIER_PATRON_ID) warnings.push("missing-tier-patron-id");
  if (!process.env.PATREON_TIER_ATELIER_ID) warnings.push("missing-tier-atelier-id");

  if (warnings.length) {
    log.warn("preflight warnings", { warnings });
  }

  if (errors.length) {
    log.error("preflight errors — Patreon endpoints will 503", { errors });
    return { ok: false, errors, warnings };
  }
  return { ok: true, warnings };
}

export function preflightMessage(issue: PreflightIssue): string {
  switch (issue) {
    case "missing-webhook-secret":
      return "PATREON_WEBHOOK_SECRET is unset. The webhook refuses to verify signatures with an empty key (an attacker could forge valid signatures).";
    case "weak-webhook-secret":
      return "PATREON_WEBHOOK_SECRET is shorter than 24 characters. Generate one with `openssl rand -hex 32` and paste both there and in the Patreon dashboard.";
    case "missing-studio-campaign-id":
      return "PATREON_STUDIO_CAMPAIGN_ID is unset. The webhook refuses to run without it (otherwise personal-campaign events leak into studio claims).";
    case "missing-oauth-client-id":
      return "PATREON_OAUTH_CLIENT_ID is unset. User-link flow disabled; webhooks still work.";
    case "missing-oauth-client-secret":
      return "PATREON_OAUTH_CLIENT_SECRET is unset. User-link flow disabled; webhooks still work.";
    case "missing-oauth-redirect-uri":
      return "PATREON_OAUTH_REDIRECT_URI is unset. User-link flow disabled; webhooks still work.";
    case "missing-tier-member-id":
      return "PATREON_TIER_MEMBER_ID is unset. Pledges at the Member tier will resolve to a null tier claim until set.";
    case "missing-tier-patron-id":
      return "PATREON_TIER_PATRON_ID is unset. Pledges at the Patron tier will resolve to a null tier claim until set.";
    case "missing-tier-atelier-id":
      return "PATREON_TIER_ATELIER_ID is unset. Pledges at the Atelier tier will resolve to a null tier claim until set.";
  }
}

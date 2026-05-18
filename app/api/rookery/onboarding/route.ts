import { NextResponse } from "next/server";

import { verifyIdToken } from "lib/firebase/admin";
import { createLogger } from "lib/log";
import { createFixedWindowLimiter } from "lib/rate-limit/fixed-window";
import {
  isRookeryEmailSlug,
  ROOKERY_EMAILS,
  type RookeryEmailSlug,
} from "lib/rookery/emails";
import { sendRookeryEmail } from "lib/rookery/mailer";
import { enqueueRookeryEmail } from "lib/rookery/pending-emails";

export const dynamic = "force-dynamic";

const log = createLogger("api.rookery.onboarding");

/**
 * Rookery onboarding email trigger.
 *
 * POST { email: string, slug: "welcome" | "orient" | "perch" }
 *  -> 200 { ok: true, id: string }      on success
 *  -> 400 { error: string }             on validation failure
 *  -> 401 { error: string }             on missing / bad bearer token
 *  -> 403 { error: string }             on email-mismatch
 *  -> 429 { error: string }             on per-email rate-limit
 *  -> 500 { error: string }             on provider/config failure
 *
 * # Auth posture
 *
 * Requires `Authorization: Bearer <firebaseIdToken>`. The token's
 * verified email must match the `email` field in the body — without
 * this guard, anonymous POSTs could spam any address with the studio's
 * branded mail (a classic email-bomb vector). When this route gains a
 * Stripe-webhook caller, the webhook handler should call
 * `sendRookeryEmail()` directly rather than re-using this route — the
 * route is for visitor-initiated sends only.
 *
 * # Rate limit
 *
 * 1 send per email address per 24 hours via the shared fixed-window
 * limiter. Prevents accidental double-fires (refresh, retry, double-
 * click) AND deliberate harassment via repeated identity-matched POSTs.
 * Auto-upgrades to Upstash Redis when env is set.
 *
 * # Idempotency
 *
 * Each send carries a stable Resend `Idempotency-Key` of
 * `rookery:<slug>:<email>` so even when the rate-limit window is open
 * a same-slug-same-recipient retry returns the original send id
 * rather than dispatching a second copy.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 1 send per email per 24h. The window is generous because the
// onboarding sequence (welcome / orient / perch) fires 3 emails total
// per recipient spaced over a week — no honest visitor needs to hit
// this route more than once per day.
const RATE_PER_EMAIL_PER_DAY = 1;
const limiter = createFixedWindowLimiter({
  scope: "api.rookery.onboarding",
  limit: RATE_PER_EMAIL_PER_DAY,
  windowMs: 24 * 60 * 60 * 1000,
});

type Payload = {
  email?: unknown;
  slug?: unknown;
};

export async function POST(req: Request) {
  // Auth check fires BEFORE the transport-configured check so
  // unauthenticated requests can't tell the difference between
  // "this route exists but has no mail transport" and "this route
  // is gated entirely" — the auth gate is the security boundary,
  // and reachability information leaks shouldn't depend on it.
  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json(
      { error: "Missing Authorization: Bearer <idToken>" },
      { status: 401 },
    );
  }
  const token = authHeader.slice("bearer ".length).trim();
  if (!token) {
    return NextResponse.json({ error: "Empty token" }, { status: 401 });
  }
  let authEmail: string | undefined;
  try {
    const decoded = await verifyIdToken(token);
    authEmail = decoded.email?.toLowerCase();
  } catch (err) {
    log.warn("token verify failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }
  if (!authEmail) {
    return NextResponse.json(
      { error: "Token has no email claim — sign in with a verified email." },
      { status: 401 },
    );
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const slugRaw = payload.slug;

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  // --- Identity guard: visitor can only trigger sends to themselves.
  // Comparison is case-insensitive — Firebase normalises but the
  // route's body input isn't trusted.
  if (email.toLowerCase() !== authEmail) {
    log.warn("email mismatch", { authEmail, requestedEmail: email });
    return NextResponse.json(
      { error: "Email must match the authenticated user." },
      { status: 403 },
    );
  }

  if (!isRookeryEmailSlug(slugRaw)) {
    return NextResponse.json(
      { error: "Invalid slug. Must be one of: welcome, orient, perch." },
      { status: 400 },
    );
  }

  const slug: RookeryEmailSlug = slugRaw;

  // --- Transport configured? Now is the right time — the caller has
  // passed auth + identity + slug checks. A missing transport is an
  // operational state, not a bad request; 503 reads that more
  // accurately than 500.
  if (!process.env.EMAIL_PROVIDER && !process.env.RESEND_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Mail transport not configured. Set EMAIL_PROVIDER (and the matching provider env, e.g. RESEND_API_KEY).",
      },
      { status: 503 },
    );
  }

  // --- Per-email rate-limit (1/day). Caps spam vectors even if the
  // auth layer is ever weakened, and also dedupes honest retries.
  const limitKey = `email:${email.toLowerCase()}`;
  const slot = await limiter.consume(limitKey);
  if (!slot.ok) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((slot.resetAt - Date.now()) / 1000),
    );
    log.info("rate_limited", {
      email,
      retryAfterSec,
      backend: limiter.backend,
    });
    return NextResponse.json(
      {
        error: "rate_limited",
        message: `Onboarding send cap: ${RATE_PER_EMAIL_PER_DAY} per day per email.`,
        retryAfterSec,
      },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  try {
    const { id } = await sendRookeryEmail(email, slug, {
      // Stable key per slug+email — Resend dedupes the send within
      // 24h if the same request fires twice (e.g. browser retry,
      // webhook replay). Caller picks the key, not Resend.
      idempotencyKey: `rookery:${slug}:${email.toLowerCase()}`,
    });
    log.info("sent", { slug, email, id });

    // After a successful Day-0 (welcome) send, enqueue the Day 3 +
    // Day 7 nurture sequence so the cron sweep at
    // /api/cron/rookery-pending-emails picks them up. We only do
    // this on the welcome slug — calling the route directly with
    // "orient" or "perch" shouldn't re-queue the sequence (those
    // are the destinations, not the trigger).
    //
    // Enqueue is fire-and-forget on its own error path — a failure
    // logs and returns ok:false from the enqueue helper but does
    // NOT fail the welcome response. The visitor already got their
    // welcome mail; missing the orient/perch is a graceful degrade.
    if (slug === "welcome") {
      const now = Date.now();
      const enqueueResults = await Promise.allSettled(
        ROOKERY_EMAILS.filter((e) => e.slug !== "welcome").map((e) => {
          const sendAfter = now + e.delayDays * 24 * 60 * 60 * 1000;
          return enqueueRookeryEmail({
            email,
            slug: e.slug,
            sendAfter,
          });
        }),
      );
      enqueueResults.forEach((r, i) => {
        const followUp = ROOKERY_EMAILS.filter((e) => e.slug !== "welcome")[i];
        if (!followUp) return;
        if (r.status === "rejected") {
          log.warn("nurture enqueue rejected", {
            slug: followUp.slug,
            email,
            reason: String(r.reason),
          });
        } else if (!r.value.ok) {
          log.warn("nurture enqueue failed", {
            slug: followUp.slug,
            email,
            error: r.value.error,
          });
        }
      });
    }

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to send email.";
    log.error("send failed", { slug, email, err: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * app/api/gdpr/request/route.ts — GDPR subject-access endpoint.
 *
 * POST { email, kind, details? } → forwards to the operator inbox.
 * Records the request in Firestore at `gdpr_requests/{id}` so the
 * 30-day response clock is auditable.
 *
 * # Request kinds
 *
 *   access      — "what data do you hold on me?"
 *   deletion    — "delete everything about me"
 *   rectification — "correct this specific data"
 *   portability — "send me my data in a portable format"
 *   objection   — "stop processing my data"
 *
 * Holoflow's data surfaces (member-tier-relevant):
 *   - Rookery member email + tier (Firestore)
 *   - Bureau orders (Firestore)
 *   - Printfile orders (Firestore)
 *   - AR card analytics (hashed IP; not directly identifying)
 *   - Newsletter signup (when Klaviyo wired)
 *
 * Per UK-GDPR Article 15, the studio has up to 30 days to respond.
 * The operator's actual response runs out-of-band (email reply); this
 * route just captures the request and timestamps it.
 */

import { NextResponse } from "next/server";

import { requireFirebaseAdminDb } from "lib/firebase/admin";
import { createLogger, errToObject } from "lib/log";
import { createFixedWindowLimiter } from "lib/rate-limit/fixed-window";

export const dynamic = "force-dynamic";

const log = createLogger("api.gdpr.request");

const KINDS = ["access", "deletion", "rectification", "portability", "objection"] as const;
type GdprRequestKind = (typeof KINDS)[number];

const limiter = createFixedWindowLimiter({
  scope: "api.gdpr.request",
  limit: 3,
  windowMs: 24 * 60 * 60 * 1000,
});

const RESEND_ENDPOINT = "https://api.resend.com/emails";

type Payload = {
  email?: string;
  kind?: string;
  details?: string;
};

export async function POST(req: Request): Promise<Response> {
  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes("@") || email.length > 320) {
    return NextResponse.json({ error: "valid email required" }, { status: 400 });
  }
  const kind = body.kind?.trim() as GdprRequestKind | undefined;
  if (!kind || !KINDS.includes(kind)) {
    return NextResponse.json(
      { error: "kind required", valid: KINDS },
      { status: 400 },
    );
  }
  const details = (body.details ?? "").slice(0, 4000);

  // 3 requests per email per day — generous enough for legit re-submits,
  // tight enough that an abuser can't flood the operator inbox.
  const rate = await limiter.consume(`email:${email}`);
  if (!rate.ok) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }

  const id = `gdpr-${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffffff).toString(16)}`;
  const receivedAt = new Date().toISOString();
  // 30-day clock per UK-GDPR Article 12(3). Display this in the
  // operator email so they know the deadline.
  const respondByMs = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const respondBy = new Date(respondByMs).toISOString();

  try {
    const db = requireFirebaseAdminDb();
    await db.collection("gdpr_requests").doc(id).set({
      id,
      email,
      kind,
      details,
      status: "received",
      receivedAt,
      respondBy,
    });
  } catch (err) {
    log.error("firestore write failed", { err: errToObject(err) });
    // Continue — the operator email below is the canonical record.
  }

  // Notify the operator. Best-effort; route returns ok regardless.
  const apiKey = process.env.RESEND_API_KEY;
  const operator =
    process.env.GDPR_INBOX_EMAIL ??
    process.env.CONTACT_INBOX_EMAIL ??
    "dimona@holoflow.co.uk";
  if (apiKey) {
    try {
      await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Holo-Flow Studio <noreply@holoflow.co.uk>",
          to: [operator],
          reply_to: email,
          subject: `[GDPR ${kind}] request ${id} — respond by ${respondBy.slice(0, 10)}`,
          text: `GDPR ${kind} request received.

Request id: ${id}
From: ${email}
Kind: ${kind}
Received: ${receivedAt}
Respond by: ${respondBy} (UK-GDPR Article 12(3) — 30 days)

Details:
${details || "(none provided)"}

Reply directly to this email to start the response thread.`,
        }),
      });
    } catch (err) {
      log.error("operator notification failed", { id, err: errToObject(err) });
    }
  } else {
    log.warn("RESEND_API_KEY unset — operator not notified", { id });
  }

  log.info("gdpr request received", { id, email, kind });
  return NextResponse.json({
    ok: true,
    id,
    respondBy,
    note: "We'll respond within 30 days per UK-GDPR.",
  });
}

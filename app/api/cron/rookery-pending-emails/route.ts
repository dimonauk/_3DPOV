/**
 * app/api/cron/rookery-pending-emails/route.ts — Daily sweep of the
 * Day 3 + Day 7 onboarding nurture queue.
 *
 * # What it does
 *
 * Picks up to `CRON_BATCH_CAP` rows from `pending_emails/` where
 * `sent === false && scheduledFor <= now() && attemptCount < MAX_ATTEMPTS`,
 * sends each via the existing Rookery mailer with a stable
 * Idempotency-Key, marks the row sent on success or records the
 * failure on miss. Returns a per-row summary so the operator can
 * read what fired in Vercel logs.
 *
 * # Auth posture
 *
 * Gated by `Authorization: Bearer ${CRON_SECRET}`. Vercel injects
 * this header automatically for cron-triggered invocations when the
 * `CRON_SECRET` env var is set in the project. A 401 fires on
 * anything else — manual curl, scraper, accidental browser hit.
 *
 * Per Vercel docs: cron secret is required for any cron route that
 * does real work; without it the route is publicly callable.
 * https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
 *
 * # Cadence
 *
 * Daily at 00:00 UTC (registered in vercel.json). The cron handles
 * Day 3 + Day 7 emails — a single visitor's scheduled sends will
 * fire within a 24h window of the planned moment, which is
 * comfortably within "a few days" / "a week in" copy from the
 * email bodies.
 *
 * # Idempotency
 *
 * Each send carries Idempotency-Key `rookery:${slug}:${email}` so if
 * the cron fires twice for the same row (network blip mid-update)
 * Resend returns the original message id instead of double-sending.
 */

import { NextResponse, type NextRequest } from "next/server";

import { createLogger, errToObject } from "lib/log";
import {
  listDuePendingEmails,
  markPendingEmailFailed,
  markPendingEmailSent,
  type PendingEmail,
} from "lib/rookery/pending-emails";
import { sendRookeryEmail } from "lib/rookery/mailer";

export const dynamic = "force-dynamic";
// Cron sweep is bounded by CRON_BATCH_CAP × per-send latency; 60s is
// ample headroom for 50 Resend calls.
export const maxDuration = 60;

const log = createLogger("api.cron.rookery-pending-emails");

type PerRowResult = {
  id: string;
  email: string;
  slug: string;
  status: "sent" | "failed" | "skipped";
  messageId?: string;
  error?: string;
};

/**
 * GET is the canonical Vercel Cron verb — the platform invokes
 * scheduled crons with GET requests by default.
 */
export async function GET(req: NextRequest) {
  // Auth gate. CRON_SECRET is the platform-managed secret Vercel
  // injects on cron-triggered calls. Without it we MUST refuse, or
  // the route is a public mailer.
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    log.error("CRON_SECRET not configured — refusing to send");
    return NextResponse.json(
      { error: "cron_not_configured" },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${expected}`) {
    log.warn("unauthorized cron call", {
      hasHeader: Boolean(auth),
    });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Transport gate. If the mailer isn't configured we'd just rack
  // attempt counts uselessly; surface a clean 503 instead.
  if (!process.env.EMAIL_PROVIDER && !process.env.RESEND_API_KEY) {
    log.warn("mail transport not configured");
    return NextResponse.json(
      { error: "mailer_not_configured" },
      { status: 503 },
    );
  }

  const startedAt = Date.now();
  let due: PendingEmail[];
  try {
    due = await listDuePendingEmails(startedAt);
  } catch (err) {
    log.error("failed to list due emails", { err: errToObject(err) });
    return NextResponse.json(
      { error: "list_due_failed" },
      { status: 500 },
    );
  }

  log.info("sweep starting", { dueCount: due.length });

  const results: PerRowResult[] = [];
  for (const row of due) {
    try {
      const { id: messageId } = await sendRookeryEmail(row.email, row.slug, {
        // Same key pattern as the visitor-facing onboarding route so
        // a manual Day 0 send + a cron-driven Day 3/7 send dedup
        // cleanly within Resend's 24h dedup window.
        idempotencyKey: `rookery:${row.slug}:${row.email}`,
      });
      try {
        await markPendingEmailSent(row.id, messageId);
      } catch (markErr) {
        // The mail did go out — the mark failure is a data-only
        // consistency problem. Log loud + report as 'sent' so the
        // operator sees both signals.
        log.error("mark-sent failed (email was sent)", {
          id: row.id,
          messageId,
          err: errToObject(markErr),
        });
      }
      results.push({
        id: row.id,
        email: row.email,
        slug: row.slug,
        status: "sent",
        messageId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      try {
        await markPendingEmailFailed(row.id, message);
      } catch (markErr) {
        log.error("mark-failed failed", {
          id: row.id,
          err: errToObject(markErr),
        });
      }
      results.push({
        id: row.id,
        email: row.email,
        slug: row.slug,
        status: "failed",
        error: message,
      });
    }
  }

  const durationMs = Date.now() - startedAt;
  const summary = {
    durationMs,
    swept: results.length,
    sent: results.filter((r) => r.status === "sent").length,
    failed: results.filter((r) => r.status === "failed").length,
  };
  log.info("sweep complete", summary);
  return NextResponse.json({ ok: true, ...summary, results });
}

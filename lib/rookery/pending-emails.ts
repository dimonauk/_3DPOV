import "server-only";

/**
 * lib/rookery/pending-emails.ts — Firestore queue for the Day 3 + Day
 * 7 onboarding nurture emails.
 *
 * # Why
 *
 * `lib/rookery/emails.ts` defines the three onboarding emails with a
 * `delayDays` field (0, 3, 7) but the value was data-only — the
 * onboarding route fired Day 0 immediately and shrugged at the rest.
 * This module turns those `delayDays` into a real schedule: enqueue
 * once at the welcome-send call site, let a daily Vercel Cron sweep
 * the queue.
 *
 * # Storage shape
 *
 * Collection: `pending_emails/{id}`. The id is deterministic per
 * `(email, slug)` pair (sha256 of `{email}|{slug}`, hex). Writes via
 * `enqueueRookeryEmail` use `.create()` so a second enqueue for the
 * same pair throws ALREADY_EXISTS — we treat that as a no-op (the
 * row is already queued; we never silently re-create it).
 *
 * Doc fields:
 *   - email: string                 // recipient
 *   - slug: RookeryEmailSlug        // which canned email
 *   - scheduledFor: Timestamp       // when the cron should send
 *   - sent: boolean                 // false until cron runs
 *   - sentAt: Timestamp | null      // ISO timestamp when sent
 *   - sentMessageId: string | null  // Resend message id
 *   - attemptCount: number          // bumped on each failed try
 *   - lastError: string | null      // most recent send failure
 *   - createdAt: Timestamp          // enqueue time
 *
 * # Why admin SDK only
 *
 * Visitors must not be able to read or write this collection — it
 * names email addresses and (would) reveal who's on the perch. All
 * writes flow through this module (admin SDK); reads via the cron
 * handler. `firestore.rules` denies client access entirely.
 */

import { createHash } from "node:crypto";

import { requireFirebaseAdminDb } from "lib/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { createLogger } from "lib/log";

import type { RookeryEmailSlug } from "./emails";

const log = createLogger("rookery.pending-emails");

/** Firestore collection name. */
const COLLECTION = "pending_emails";

/**
 * Cron sweep batch cap. Each run picks up at most this many overdue
 * sends — keeps a single cron invocation's runtime bounded even if
 * the queue backed up overnight. Anything beyond the cap fires on
 * the next run (24h later); for the studio's expected volume that's
 * comfortably above zero risk.
 */
export const CRON_BATCH_CAP = 50;

/** Per-attempt fail cap before the row is treated as permanently
 *  failed and skipped by subsequent cron runs. Operators can manually
 *  reset `attemptCount` in Firestore admin if they want a re-try. */
export const MAX_ATTEMPTS = 5;

export type PendingEmail = {
  id: string;
  email: string;
  slug: RookeryEmailSlug;
  /** Epoch ms — easier to consume across the cron handler than a Timestamp. */
  scheduledForMs: number;
  sent: boolean;
  sentAtMs: number | null;
  sentMessageId: string | null;
  attemptCount: number;
  lastError: string | null;
  createdAtMs: number;
};

export type EnqueueInput = {
  email: string;
  slug: RookeryEmailSlug;
  /** When the cron should send. Date or epoch ms. */
  sendAfter: Date | number;
};

export type EnqueueResult =
  | { ok: true; id: string; created: true }
  | { ok: true; id: string; created: false; reason: "already_queued" }
  | { ok: false; error: string };

/**
 * Deterministic doc ID from `(email, slug)`. The same recipient +
 * email slug always maps to the same id, which makes `.create()`
 * fail with ALREADY_EXISTS on a duplicate enqueue — that's the
 * behaviour we want (the welcome-send call site runs the enqueue
 * unconditionally; the queue is the source of truth).
 */
export function pendingEmailId(email: string, slug: RookeryEmailSlug): string {
  const normalised = `${email.trim().toLowerCase()}|${slug}`;
  return createHash("sha256").update(normalised).digest("hex");
}

/**
 * Enqueue a pending email. Idempotent — calling twice with the same
 * (email, slug) returns `{ created: false }` on the second call.
 */
export async function enqueueRookeryEmail(
  input: EnqueueInput,
): Promise<EnqueueResult> {
  const email = input.email.trim().toLowerCase();
  const id = pendingEmailId(email, input.slug);
  const scheduledFor =
    typeof input.sendAfter === "number"
      ? Timestamp.fromMillis(input.sendAfter)
      : Timestamp.fromDate(input.sendAfter);

  let db;
  try {
    db = requireFirebaseAdminDb();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.warn("admin not configured — skipping enqueue", { id, slug: input.slug });
    return { ok: false, error: message };
  }

  const ref = db.collection(COLLECTION).doc(id);
  try {
    await ref.create({
      email,
      slug: input.slug,
      scheduledFor,
      sent: false,
      sentAt: null,
      sentMessageId: null,
      attemptCount: 0,
      lastError: null,
      createdAt: FieldValue.serverTimestamp(),
    });
    log.info("enqueued", { id, slug: input.slug, scheduledForMs: scheduledFor.toMillis() });
    return { ok: true, id, created: true };
  } catch (err) {
    // ALREADY_EXISTS (code 6) is the expected duplicate-enqueue path.
    // Anything else is a real failure.
    const code = (err as { code?: number }).code;
    if (code === 6) {
      log.info("already queued", { id, slug: input.slug });
      return { ok: true, id, created: false, reason: "already_queued" };
    }
    const message = err instanceof Error ? err.message : String(err);
    log.error("enqueue failed", { id, slug: input.slug, err: message });
    return { ok: false, error: message };
  }
}

/**
 * Query the queue for sends due at or before `nowMs`. Returns at
 * most `CRON_BATCH_CAP` rows so a single cron run is bounded.
 * Rows where `attemptCount >= MAX_ATTEMPTS` are skipped (treated
 * as permanently failed; operator-resettable).
 */
export async function listDuePendingEmails(
  nowMs: number,
): Promise<PendingEmail[]> {
  const db = requireFirebaseAdminDb();
  const snap = await db
    .collection(COLLECTION)
    .where("sent", "==", false)
    .where("scheduledFor", "<=", Timestamp.fromMillis(nowMs))
    .orderBy("scheduledFor", "asc")
    .limit(CRON_BATCH_CAP * 2) // overfetch so we can filter out maxed-out rows and still hit the cap
    .get();

  const due: PendingEmail[] = [];
  snap.forEach((doc) => {
    if (due.length >= CRON_BATCH_CAP) return;
    const data = doc.data();
    const attemptCount = typeof data.attemptCount === "number" ? data.attemptCount : 0;
    if (attemptCount >= MAX_ATTEMPTS) return;
    const slug = data.slug;
    if (slug !== "welcome" && slug !== "orient" && slug !== "perch") return;
    const sentAt = data.sentAt as Timestamp | null;
    const createdAt = data.createdAt as Timestamp | undefined;
    due.push({
      id: doc.id,
      email: String(data.email ?? ""),
      slug,
      scheduledForMs: (data.scheduledFor as Timestamp).toMillis(),
      sent: Boolean(data.sent),
      sentAtMs: sentAt ? sentAt.toMillis() : null,
      sentMessageId: typeof data.sentMessageId === "string" ? data.sentMessageId : null,
      attemptCount,
      lastError: typeof data.lastError === "string" ? data.lastError : null,
      createdAtMs: createdAt ? createdAt.toMillis() : Date.now(),
    });
  });
  return due;
}

/** Mark a pending email as successfully sent. Idempotent. */
export async function markPendingEmailSent(
  id: string,
  sentMessageId: string,
): Promise<void> {
  const db = requireFirebaseAdminDb();
  await db.collection(COLLECTION).doc(id).update({
    sent: true,
    sentAt: FieldValue.serverTimestamp(),
    sentMessageId,
    lastError: null,
  });
}

/**
 * Record a send failure on a pending email. Increments `attemptCount`
 * and stores the most recent error message. The cron handler skips
 * rows that have hit MAX_ATTEMPTS on subsequent runs.
 */
export async function markPendingEmailFailed(
  id: string,
  error: string,
): Promise<void> {
  const db = requireFirebaseAdminDb();
  await db.collection(COLLECTION).doc(id).update({
    attemptCount: FieldValue.increment(1),
    lastError: error,
  });
}

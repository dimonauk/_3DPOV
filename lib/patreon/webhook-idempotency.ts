/**
 * Webhook idempotency for Patreon events.
 *
 * Why this exists (verified against the Patreon Developers forum):
 *
 *   1. Patreon's webhook bus does NOT guarantee in-order delivery.
 *      `members:pledge:create` can arrive after `members:pledge:update`
 *      for the same member; a naive last-write-wins handler will then
 *      apply a stale tier on top of the fresh one.
 *
 *   2. Patreon retries on non-2xx responses. A handler that 500s mid-way
 *      through Firestore work, then succeeds on the retry, will have
 *      double-applied the side effects unless we explicitly check.
 *
 * The dedupe key is `${eventName}:${memberId}:${bodyHash}`. We store
 * processed events in `patreon_webhook_events/{id}` with a TTL via a
 * Firestore timestamp field — a scheduled cleanup can scrub anything
 * older than 30 days. Storage cost is negligible (members:* events on
 * a small studio campaign top out at ~hundreds per month).
 *
 * The body hash collapses retries (same payload) while still letting
 * legitimate sequential updates through (different payload → different
 * hash → not deduped).
 */

import "server-only";

import { createHash } from "node:crypto";

import { getFirebaseAdminDb } from "lib/firebase/admin";
import { createLogger } from "lib/log";

const log = createLogger("patreon.webhook-idempotency");

const COLLECTION = "patreon_webhook_events";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type IdempotencyOutcome =
  | { ok: true; firstSeen: true; key: string }
  | { ok: true; firstSeen: false; key: string; processedAt: string }
  | { ok: false; key: string; error: string };

function bodyHash(rawBody: string): string {
  return createHash("sha256").update(rawBody).digest("hex").slice(0, 32);
}

function buildKey(eventName: string, memberId: string, rawBody: string): string {
  return `${eventName}:${memberId}:${bodyHash(rawBody)}`;
}

/**
 * Reserve the event key. If this is the first time we've seen the key,
 * returns `firstSeen: true` and the caller proceeds with handling. If
 * the key has been seen, returns `firstSeen: false` and the caller
 * short-circuits with a 200 OK.
 *
 * Implemented as a transactional create — if Firestore is unconfigured
 * (preview env, local dev without admin creds), we degrade to
 * `firstSeen: true` so the handler still runs. This is a deliberate
 * trade-off: better to risk a double-apply locally than to silently
 * drop events in prod.
 */
export async function reserveWebhookEvent(opts: {
  eventName: string;
  memberId: string;
  rawBody: string;
}): Promise<IdempotencyOutcome> {
  const key = buildKey(opts.eventName, opts.memberId, opts.rawBody);
  const db = getFirebaseAdminDb();
  if (!db) {
    log.warn("idempotency skipped — firestore not configured", { key });
    return { ok: true, firstSeen: true, key };
  }
  const ref = db.collection(COLLECTION).doc(key);
  try {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists) {
        const data = snap.data() as { processedAt?: string } | undefined;
        return {
          firstSeen: false as const,
          processedAt: data?.processedAt ?? new Date(0).toISOString(),
        };
      }
      tx.create(ref, {
        eventName: opts.eventName,
        memberId: opts.memberId,
        processedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + TTL_MS).toISOString(),
      });
      return { firstSeen: true as const };
    });
    if (result.firstSeen) {
      return { ok: true, firstSeen: true, key };
    }
    return { ok: true, firstSeen: false, key, processedAt: result.processedAt };
  } catch (err) {
    log.error("idempotency reservation failed", {
      key,
      err: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, key, error: err instanceof Error ? err.message : "unknown" };
  }
}

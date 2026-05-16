import "server-only";

/**
 * Card analytics — server-side event logging into Firestore at
 * cards/<slug>/events/<eventId>. All writes go through the admin SDK
 * (firestore.rules denies anonymous writes to this subcollection), so
 * we can lightly trust the shape of what gets stored.
 *
 * What we record per event:
 *   - type: 'view' | 'ar_launch' | 'hand_lock' | 'webxr' |
 *           'vcard_download' | 'recording' | 'lead_capture'
 *   - at: server timestamp
 *   - src: optional UTM-style source tag from `?src=` on the URL
 *   - ua: User-Agent string (truncated to 256 chars)
 *   - referrer: HTTP Referer (truncated to 512 chars)
 *   - ipHash: SHA-256 of (ip + IP_HASH_SALT) so we can dedupe + rate
 *     limit without storing raw IPs (GDPR-friendly default)
 *   - country: derived from Vercel's x-vercel-ip-country header, free
 *
 * Rate limiting:
 *   In-memory Map keyed by ipHash. Window: 60s. Max 30 events / IP /
 *   minute. Survives only within a single serverless instance; on
 *   Vercel, cold starts reset this. Good enough as a basic abuse
 *   floor — a determined spammer would still need to rotate IPs.
 *
 * Shape compatibility:
 *   Schema is forward-compatible — adding new fields is a non-breaking
 *   change because the read side uses optional chaining. Adding new
 *   `type` values is also non-breaking; the dashboard renders unknown
 *   types under an "other" bucket.
 */

import { requireFirebaseAdminDb } from "lib/firebase/admin";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { hashIp } from "lib/cards/ip-hash";

export { hashIp };

export type CardEventType =
  | "view"
  | "ar_launch"
  | "hand_lock"
  | "webxr"
  | "vcard_download"
  | "recording"
  | "lead_capture";

export type CardEvent = {
  type: CardEventType;
  src?: string;
  ua?: string;
  referrer?: string;
  ipHash?: string;
  country?: string;
  at: FirebaseFirestore.Timestamp;
};

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30;
const rateLog = new Map<string, number[]>();

function checkRate(ipHash: string): boolean {
  const now = Date.now();
  const list = rateLog.get(ipHash) ?? [];
  const recent = list.filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    rateLog.set(ipHash, recent);
    return false;
  }
  recent.push(now);
  rateLog.set(ipHash, recent);
  return true;
}

const ALLOWED_TYPES: CardEventType[] = [
  "view",
  "ar_launch",
  "hand_lock",
  "webxr",
  "vcard_download",
  "recording",
  "lead_capture",
];

type RecordInput = {
  slug: string;
  type: CardEventType;
  src?: string | null;
  ua?: string | null;
  referrer?: string | null;
  ip?: string | null;
  country?: string | null;
};

type RecordResult =
  | { ok: true; id: string }
  | { ok: false; error: "rate_limited" | "invalid" | "no_admin" };

/**
 * Persist a single card event. Returns ok:false on rate-limit or
 * config errors — the caller should respond 429 / 503 accordingly.
 */
export async function recordCardEvent(input: RecordInput): Promise<RecordResult> {
  if (!input.slug || !/^[a-z0-9-]+$/i.test(input.slug)) {
    return { ok: false, error: "invalid" };
  }
  if (!ALLOWED_TYPES.includes(input.type)) {
    return { ok: false, error: "invalid" };
  }

  const ipHash = input.ip ? hashIp(input.ip) : "anon";
  if (!checkRate(ipHash)) {
    return { ok: false, error: "rate_limited" };
  }

  let db: Firestore;
  try {
    db = requireFirebaseAdminDb();
  } catch {
    return { ok: false, error: "no_admin" };
  }

  const truncate = (s: string | null | undefined, max: number) =>
    s ? s.slice(0, max) : undefined;

  const doc = {
    type: input.type,
    src: truncate(input.src, 64),
    ua: truncate(input.ua, 256),
    referrer: truncate(input.referrer, 512),
    ipHash,
    country: truncate(input.country, 8),
    at: FieldValue.serverTimestamp(),
  };

  const ref = await db
    .collection("cards")
    .doc(input.slug)
    .collection("events")
    .add(doc);

  return { ok: true, id: ref.id };
}

/**
 * Aggregate counts for the dashboard. Server-side only — pulls all
 * events for the card and bucket-counts them. Bounded scan: max 5000
 * events per call. Beyond that, the dashboard prompts the owner to
 * export to CSV.
 */
export async function aggregateCardEvents(slug: string) {
  const db = requireFirebaseAdminDb();
  const snap = await db
    .collection("cards")
    .doc(slug)
    .collection("events")
    .orderBy("at", "desc")
    .limit(5000)
    .get();

  const byType: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const byCountry: Record<string, number> = {};
  const byDay: Record<string, number> = {};
  const uniqueIps = new Set<string>();
  const recent: Array<{
    id: string;
    type: string;
    src?: string;
    country?: string;
    at: number;
  }> = [];

  snap.forEach((d: FirebaseFirestore.QueryDocumentSnapshot) => {
    const data = d.data() as Record<string, unknown>;
    const type = String(data.type ?? "unknown");
    const src = (data.src as string | undefined) ?? "(direct)";
    const country = (data.country as string | undefined) ?? "?";
    const ipHash = (data.ipHash as string | undefined) ?? "";
    const atMs =
      data.at && typeof data.at === "object" && "toMillis" in data.at
        ? (data.at as { toMillis: () => number }).toMillis()
        : 0;

    byType[type] = (byType[type] ?? 0) + 1;
    bySource[src] = (bySource[src] ?? 0) + 1;
    byCountry[country] = (byCountry[country] ?? 0) + 1;
    if (ipHash) uniqueIps.add(ipHash);
    if (atMs > 0) {
      const day = new Date(atMs).toISOString().slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + 1;
    }
    if (recent.length < 100) {
      recent.push({
        id: d.id,
        type,
        src: (data.src as string | undefined),
        country: (data.country as string | undefined),
        at: atMs,
      });
    }
  });

  return {
    total: snap.size,
    truncated: snap.size === 5000,
    unique: uniqueIps.size,
    byType,
    bySource,
    byCountry,
    byDay,
    recent,
  };
}

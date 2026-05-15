import "server-only";

/**
 * Webhook delivery — per-card outbound webhooks for lead capture +
 * (optionally) scan events. Each card can configure:
 *
 *   webhookUrl     — POST target, https only
 *   webhookSecret  — shared secret used for HMAC-SHA256 signing
 *   webhookEvents  — array of event types to forward
 *                    (defaults to ['lead_capture'])
 *
 * On a configured event, we POST a JSON envelope to webhookUrl
 * with these headers:
 *
 *   Content-Type: application/json
 *   x-holoflow-signature: sha256=<hex hmac of body>
 *   x-holoflow-timestamp: <unix-ms>
 *   x-holoflow-event: <event type>
 *   x-holoflow-card: <slug>
 *   user-agent: HoloFlow-Webhooks/1.0
 *
 * Signature is HMAC-SHA256 over `${timestamp}.${body}` so the
 * receiver can re-verify with constant-time compare.
 *
 * Retry policy: one retry after 1s on 5xx or network error. 4xx
 * means the receiver rejected it — never retry. Failures are
 * logged and persisted to cards/<slug>/webhook-failures/<id>
 * so the owner can see what went wrong from the dashboard.
 *
 * This is best-effort, NEVER blocks the primary write to Firestore.
 * Lead capture works fine even if the webhook URL is dead.
 *
 * Compatibility with Zapier / Make / n8n / IFTTT:
 *   All four accept JSON POSTs with arbitrary headers, so the
 *   signed envelope above plugs into any of them with a simple
 *   "Webhooks by Zapier — Catch Hook" trigger. The signature is
 *   optional for them but recommended.
 *
 * Compatibility with HubSpot / Salesforce:
 *   These need their own auth flows + endpoints, but Zapier sits
 *   in front of them as a generic bridge. We keep the webhook
 *   payload generic; bridging to specific CRMs is the user's
 *   problem (or a future first-party integration layer).
 */

import { createHmac, randomUUID } from "node:crypto";
import { requireFirebaseAdminDb } from "lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export type WebhookEvent =
  | "lead_capture"
  | "view"
  | "ar_launch"
  | "hand_lock"
  | "webxr"
  | "vcard_download"
  | "recording";

export type WebhookPayload = {
  event: WebhookEvent;
  card: { slug: string; name?: string };
  occurredAt: string; // ISO
  /** Event-specific fields. For lead_capture: name, email, message, src, country. */
  data: Record<string, unknown>;
};

type DeliveryResult = {
  ok: boolean;
  status?: number;
  attempts: number;
  error?: string;
};

function signBody(secret: string, timestamp: number, body: string): string {
  return (
    "sha256=" +
    createHmac("sha256", secret)
      .update(`${timestamp}.${body}`)
      .digest("hex")
  );
}

async function singleDelivery(
  url: string,
  secret: string,
  payload: WebhookPayload,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const body = JSON.stringify(payload);
  const timestamp = Date.now();
  const signature = signBody(secret, timestamp, body);

  // 8-second hard cap so a slow receiver can't pile up serverless time.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-holoflow-signature": signature,
        "x-holoflow-timestamp": String(timestamp),
        "x-holoflow-event": payload.event,
        "x-holoflow-card": payload.card.slug,
        "user-agent": "HoloFlow-Webhooks/1.0",
      },
      body,
      signal: controller.signal,
    });
    clearTimeout(timer);
    return { ok: res.ok, status: res.status };
  } catch (err) {
    clearTimeout(timer);
    return {
      ok: false,
      error: (err as Error).message ?? "fetch_failed",
    };
  }
}

/**
 * Deliver with one retry on 5xx / network error. Total worst case:
 * 8s + 1s + 8s = 17s, but cancelled if the response is in.
 */
export async function deliverWebhook(
  url: string,
  secret: string,
  payload: WebhookPayload,
): Promise<DeliveryResult> {
  let attempt = await singleDelivery(url, secret, payload);
  let attempts = 1;
  const retriable =
    !attempt.ok && (attempt.error || (attempt.status ?? 0) >= 500);
  if (retriable) {
    await new Promise((r) => setTimeout(r, 1_000));
    attempt = await singleDelivery(url, secret, payload);
    attempts = 2;
  }
  return {
    ok: attempt.ok,
    status: attempt.status,
    attempts,
    error: attempt.error,
  };
}

type CardWebhookConfig = {
  webhookUrl?: string;
  webhookSecret?: string;
  webhookEvents?: WebhookEvent[];
};

/**
 * High-level fan-out called by API routes. Reads the card's webhook
 * config; if absent or disabled, returns a no-op result. Failures
 * are persisted to Firestore for the owner to inspect.
 */
export async function fanOutWebhook(
  slug: string,
  event: WebhookEvent,
  data: Record<string, unknown>,
): Promise<DeliveryResult | null> {
  let db: FirebaseFirestore.Firestore;
  try {
    db = requireFirebaseAdminDb();
  } catch {
    return null;
  }

  const cardSnap = await db.collection("cards").doc(slug).get();
  if (!cardSnap.exists) return null;
  const cardData = cardSnap.data() as Record<string, unknown>;

  const config =
    (cardData as { webhook?: CardWebhookConfig }).webhook ?? {};
  const url = config.webhookUrl;
  const secret = config.webhookSecret;
  if (!url || !secret) return null;

  // URL safety: only https + reject obvious internal targets.
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") {
    return null;
  }
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return null;
  }

  const allowedEvents = config.webhookEvents ?? ["lead_capture"];
  if (!allowedEvents.includes(event)) return null;

  const cardName =
    (cardData as { card?: { name?: string } }).card?.name ?? undefined;

  const payload: WebhookPayload = {
    event,
    card: { slug, name: cardName },
    occurredAt: new Date().toISOString(),
    data,
  };

  const result = await deliverWebhook(url, secret, payload);

  // Log result (success or failure) so the dashboard can show
  // delivery health. Bounded log — keep last 200 entries via TTL
  // (manual cleanup; Firestore has no built-in TTL on subcollection
  // entries unless we configure it on the field, which is overkill).
  try {
    await db
      .collection("cards")
      .doc(slug)
      .collection("webhook-log")
      .doc(randomUUID())
      .set({
        event,
        ok: result.ok,
        status: result.status ?? null,
        attempts: result.attempts,
        error: result.error ?? null,
        at: FieldValue.serverTimestamp(),
      });
  } catch {
    // Logging is best-effort.
  }

  return result;
}

/**
 * Owner-side: fetch recent webhook log entries.
 */
export async function listWebhookLog(slug: string, limit = 50) {
  const db = requireFirebaseAdminDb();
  const snap = await db
    .collection("cards")
    .doc(slug)
    .collection("webhook-log")
    .orderBy("at", "desc")
    .limit(limit)
    .get();
  return snap.docs.map(
    (d: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = d.data() as Record<string, unknown>;
      const atMs =
        data.at && typeof data.at === "object" && "toMillis" in data.at
          ? (data.at as { toMillis: () => number }).toMillis()
          : 0;
      return {
        id: d.id,
        event: data.event as string,
        ok: Boolean(data.ok),
        status: (data.status as number | null) ?? null,
        attempts: (data.attempts as number) ?? 0,
        error: (data.error as string | null) ?? null,
        at: atMs,
      };
    },
  );
}

/**
 * Fire a manually-triggered test event so the owner can verify their
 * webhook URL is wired up. Returns the delivery result for surfacing
 * in the UI immediately.
 */
export async function fireTestWebhook(slug: string): Promise<DeliveryResult | null> {
  return fanOutWebhook(slug, "lead_capture", {
    test: true,
    name: "Holo-Flow test",
    email: "test@holoflow.co.uk",
    message: "If you can read this, your webhook is wired correctly.",
    src: "webhook-test",
  });
}

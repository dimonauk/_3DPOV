import { NextResponse, type NextRequest } from "next/server";
import { verifyIdToken, requireFirebaseAdminDb } from "lib/firebase/admin";
import {
  fireTestWebhook,
  listWebhookLog,
} from "lib/cards/webhooks-server";
import { randomBytes } from "node:crypto";

/**
 * Webhook configuration + log + test endpoints for a card.
 *
 *   GET    /api/cards/[slug]/webhook         current config + recent log
 *   PATCH  /api/cards/[slug]/webhook         update config (url, secret, events)
 *   POST   /api/cards/[slug]/webhook/test    fire a test event
 *
 * All require Authorization: Bearer <firebaseIdToken> and the
 * caller's uid must match cards/<slug>.ownerUid.
 *
 * Secrets are stored in plain text in Firestore — Firestore is
 * not visible to anyone but admin SDK + owner reads, and the
 * owner's the one who set the secret. If we wanted to harden
 * further we'd encrypt with a KMS key at rest; not worth it for
 * a single-user-per-card model.
 */
export const runtime = "nodejs";

type Params = { params: Promise<{ slug: string }> };

async function authOwnership(
  req: NextRequest,
  slug: string,
): Promise<
  | { ok: true; uid: string; db: FirebaseFirestore.Firestore }
  | { ok: false; res: NextResponse }
> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    return {
      ok: false,
      res: NextResponse.json({ error: "unauthenticated" }, { status: 401 }),
    };
  }
  let uid: string;
  try {
    uid = (await verifyIdToken(token)).uid;
  } catch {
    return {
      ok: false,
      res: NextResponse.json({ error: "invalid_token" }, { status: 401 }),
    };
  }
  let db: FirebaseFirestore.Firestore;
  try {
    db = requireFirebaseAdminDb();
  } catch {
    return {
      ok: false,
      res: NextResponse.json({ error: "no_admin" }, { status: 503 }),
    };
  }
  const cardSnap = await db.collection("cards").doc(slug).get();
  if (!cardSnap.exists) {
    return {
      ok: false,
      res: NextResponse.json({ error: "not_found" }, { status: 404 }),
    };
  }
  const card = cardSnap.data() as { ownerUid?: string };
  if (card.ownerUid !== uid) {
    return {
      ok: false,
      res: NextResponse.json({ error: "forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, uid, db };
}

export async function GET(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const auth = await authOwnership(req, slug);
  if (!auth.ok) return auth.res;

  const snap = await auth.db.collection("cards").doc(slug).get();
  const card = snap.data() as Record<string, unknown>;
  const webhook = (card.webhook as Record<string, unknown> | undefined) ?? {};

  // NEVER return the secret on GET — only its presence.
  const secretSet = Boolean(webhook.webhookSecret);
  const log = await listWebhookLog(slug, 20);

  return NextResponse.json({
    webhook: {
      webhookUrl: (webhook.webhookUrl as string | undefined) ?? "",
      secretSet,
      webhookEvents:
        (webhook.webhookEvents as string[] | undefined) ?? ["lead_capture"],
    },
    log,
  });
}

const ALLOWED_EVENTS = new Set([
  "lead_capture",
  "view",
  "ar_launch",
  "hand_lock",
  "webxr",
  "vcard_download",
  "recording",
]);

export async function PATCH(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const auth = await authOwnership(req, slug);
  if (!auth.ok) return auth.res;

  let body: {
    webhookUrl?: string;
    webhookSecret?: string;
    rotateSecret?: boolean;
    webhookEvents?: string[];
    clear?: boolean;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Clear all webhook config.
  if (body.clear) {
    await auth.db
      .collection("cards")
      .doc(slug)
      .update({ webhook: null });
    return NextResponse.json({ ok: true, cleared: true });
  }

  // URL must be https + not an internal host (matches deliverWebhook's checks).
  if (body.webhookUrl !== undefined && body.webhookUrl.trim()) {
    try {
      const u = new URL(body.webhookUrl);
      if (u.protocol !== "https:") {
        return NextResponse.json(
          { error: "https_required" },
          { status: 400 },
        );
      }
      const host = u.hostname.toLowerCase();
      if (
        host === "localhost" ||
        host === "127.0.0.1" ||
        host.endsWith(".local") ||
        host.endsWith(".internal")
      ) {
        return NextResponse.json(
          { error: "internal_host_forbidden" },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json({ error: "invalid_url" }, { status: 400 });
    }
  }

  if (body.webhookEvents) {
    for (const ev of body.webhookEvents) {
      if (!ALLOWED_EVENTS.has(ev)) {
        return NextResponse.json(
          { error: "invalid_event", event: ev },
          { status: 400 },
        );
      }
    }
  }

  // Build the update patch. Use a nested object so we don't blow
  // away unrelated fields on the card document.
  const cardRef = auth.db.collection("cards").doc(slug);
  const snap = await cardRef.get();
  const current =
    ((snap.data() as { webhook?: Record<string, unknown> }).webhook as
      | Record<string, unknown>
      | undefined) ?? {};

  const next: Record<string, unknown> = { ...current };
  if (body.webhookUrl !== undefined) {
    next.webhookUrl = body.webhookUrl.trim() || null;
  }
  if (body.rotateSecret) {
    next.webhookSecret = randomBytes(32).toString("hex");
  } else if (body.webhookSecret !== undefined) {
    next.webhookSecret = body.webhookSecret.trim() || null;
  } else if (!current.webhookSecret && next.webhookUrl) {
    // First-time set: generate a secret automatically.
    next.webhookSecret = randomBytes(32).toString("hex");
  }
  if (body.webhookEvents) {
    next.webhookEvents = body.webhookEvents;
  }

  await cardRef.update({ webhook: next });

  // Return new state — INCLUDING the secret this time so the owner
  // can save it to their receiver config. This is the only path
  // that returns the secret.
  return NextResponse.json({
    ok: true,
    webhook: {
      webhookUrl: (next.webhookUrl as string | null) ?? "",
      webhookSecret: (next.webhookSecret as string | null) ?? "",
      webhookEvents:
        (next.webhookEvents as string[] | undefined) ?? ["lead_capture"],
    },
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  // Test path: /api/cards/[slug]/webhook with method=test in body.
  const { slug } = await params;
  const auth = await authOwnership(req, slug);
  if (!auth.ok) return auth.res;

  const result = await fireTestWebhook(slug);
  if (!result) {
    return NextResponse.json(
      { error: "webhook_not_configured" },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: result.ok, result });
}

/**
 * app/api/aura/history/route.ts — Aura's per-user conversation
 * persistence.
 *
 * Endpoints (auth required — Bearer Firebase ID token):
 *   GET    /api/aura/history       — return the user's conversation
 *   POST   /api/aura/history       — append a turn pair (user + model)
 *   DELETE /api/aura/history       — clear the user's conversation
 *
 * Anonymous visitors don't hit this endpoint at all — the launcher
 * keeps their history in localStorage only. Logged-in visitors get
 * cross-device + long-term persistence via Firestore.
 *
 * The POST endpoint is for the WebGPU path — the LLM runs in the
 * visitor's browser but the server still wants the persisted turn so
 * the conversation syncs across the visitor's devices.
 *
 * The chat endpoint (/api/aura/chat) persists its OWN turns when
 * called with auth, so this POST is only used by the WebGPU path.
 */

import { NextResponse } from "next/server";

import {
  getFirebaseAdminAuth,
  getFirebaseAdminDb,
} from "lib/firebase/admin";
import { createLogger, errToObject } from "lib/log";
import { createFixedWindowLimiter } from "lib/rate-limit/fixed-window";
import { rememberVectorServer } from "lib/capabilities/agent/memory-vector.server";

export const dynamic = "force-dynamic";

const log = createLogger("api.aura.history");

// Per-uid write quota. The route appends to a per-user Firestore doc;
// without a cap a single uid can hammer writes and burn quota / cost.
// 120 appends/hour comfortably covers an active conversation (one turn
// every 30 seconds non-stop) while shutting down scripted abuse.
// Auto-upgrades to Upstash Redis when env is set.
const WRITE_HOURLY_CAP = 120;
const writeLimiter = createFixedWindowLimiter({
  scope: "api.aura.history.write",
  limit: WRITE_HOURLY_CAP,
  windowMs: 60 * 60 * 1000,
});

type Turn = { role: "user" | "model"; text: string };

function isTurn(v: unknown): v is Turn {
  if (typeof v !== "object" || v === null) return false;
  const t = v as Record<string, unknown>;
  return (
    (t.role === "user" || t.role === "model") && typeof t.text === "string"
  );
}

function extractBearer(req: Request): string | null {
  const header =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header);
  return m && m[1] ? m[1].trim() : null;
}

async function requireUid(req: Request): Promise<string | null> {
  const token = extractBearer(req);
  if (!token) return null;
  const auth = getFirebaseAdminAuth();
  if (!auth) return null;
  try {
    const decoded = await auth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const uid = await requireUid(req);
  if (!uid) {
    return NextResponse.json(
      { error: "auth required" },
      { status: 401 },
    );
  }
  const db = getFirebaseAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "server not configured" },
      { status: 503 },
    );
  }
  try {
    const snap = await db.collection("auraConversations").doc(uid).get();
    if (!snap.exists) {
      return NextResponse.json({ turns: [], updatedAt: null });
    }
    const data = snap.data() ?? {};
    const turns: Turn[] = Array.isArray(data["turns"])
      ? (data["turns"] as unknown[]).filter(isTurn)
      : [];
    return NextResponse.json({
      turns,
      updatedAt: typeof data["updatedAt"] === "string" ? data["updatedAt"] : null,
    });
  } catch (err) {
    log.error("firestore read failed", { uid, err: errToObject(err) });
    return NextResponse.json(
      { error: "firestore_read_failed" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const uid = await requireUid(req);
  if (!uid) {
    return NextResponse.json(
      { error: "auth required" },
      { status: 401 },
    );
  }
  const slot = await writeLimiter.consume(`uid:${uid}`);
  if (!slot.ok) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((slot.resetAt - Date.now()) / 1000),
    );
    log.info("rate_limited", {
      uid,
      retryAfterSec,
      backend: writeLimiter.backend,
    });
    return NextResponse.json(
      {
        error: "rate_limited",
        message: `History write cap: ${WRITE_HOURLY_CAP}/hour/user.`,
        retryAfterSec,
      },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "expected application/json body" },
      { status: 400 },
    );
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: "body must be a JSON object" },
      { status: 400 },
    );
  }
  const obj = body as Record<string, unknown>;
  const newTurnsRaw = obj["turns"];
  if (!Array.isArray(newTurnsRaw)) {
    return NextResponse.json(
      { error: "turns array required" },
      { status: 400 },
    );
  }
  const newTurns = newTurnsRaw.filter(isTurn);
  if (newTurns.length === 0) {
    return NextResponse.json({ ok: true, appended: 0 });
  }
  const db = getFirebaseAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "server not configured" },
      { status: 503 },
    );
  }
  try {
    const ref = db.collection("auraConversations").doc(uid);
    const now = new Date().toISOString();
    const snap = await ref.get();
    const existing = snap.exists
      ? ((snap.data() ?? {})["turns"] as Turn[]) ?? []
      : [];
    const next = [...existing.filter(isTurn), ...newTurns];
    const capped = next.length > 200 ? next.slice(-200) : next;
    await ref.set(
      {
        turns: capped,
        updatedAt: now,
        ...(snap.exists ? {} : { createdAt: now }),
      },
      { merge: true },
    );

    // Fire-and-forget vector-memory embed of each new turn. We don't
    // await — vector embedding shouldn't slow the history write. We
    // also don't error on failure — the capability raises typed errors
    // for missing-index / missing-api-key / quota; log + carry on so a
    // misconfigured embedding pipeline never breaks the chat sync.
    void Promise.allSettled(
      newTurns.map((t) =>
        rememberVectorServer({
          uid,
          turn: {
            at: now,
            speaker: t.role === "user" ? "user" : "aura",
            text: t.text,
          },
        }),
      ),
    ).then((results) => {
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        log.info("vector-memory: some turns failed to embed", {
          uid,
          failed: failed.length,
          total: newTurns.length,
          firstReason:
            failed[0] && failed[0].status === "rejected"
              ? String(failed[0].reason)
              : undefined,
        });
      }
    });

    return NextResponse.json({ ok: true, appended: newTurns.length });
  } catch (err) {
    log.error("firestore write failed", { uid, err: errToObject(err) });
    return NextResponse.json(
      { error: "firestore_write_failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const uid = await requireUid(req);
  if (!uid) {
    return NextResponse.json(
      { error: "auth required" },
      { status: 401 },
    );
  }
  const db = getFirebaseAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "server not configured" },
      { status: 503 },
    );
  }
  try {
    await db.collection("auraConversations").doc(uid).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error("firestore delete failed", { uid, err: errToObject(err) });
    return NextResponse.json(
      { error: "firestore_delete_failed" },
      { status: 500 },
    );
  }
}

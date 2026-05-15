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

export const dynamic = "force-dynamic";

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
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `firestore read failed: ${message}` },
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
    return NextResponse.json({ ok: true, appended: newTurns.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `firestore write failed: ${message}` },
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
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `firestore delete failed: ${message}` },
      { status: 500 },
    );
  }
}

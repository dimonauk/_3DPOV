/**
 * app/api/aura/chat/route.ts — Aura's server-side chat endpoint.
 *
 * Used when the visitor's device can't run the WebGPU LLM locally
 * (iOS Safari ≤17, older Android, no compatible GPU). Calls the
 * existing `agent.dialogue` capability which routes to Gemini.
 *
 * # Auth posture
 * Anonymous visitors are allowed — no token required. The studio
 * eats the per-call cost as part of "the bench's hospitality" until
 * traffic warrants gating it.
 *
 * # Persistence
 * If the request carries a valid Firebase ID token, the conversation
 * turn pair (user message + Aura's reply) is appended to the user's
 * Firestore conversation doc. Anonymous turns are not persisted
 * server-side — they live in the visitor's localStorage only.
 *
 * # Body shape
 *   {
 *     "history": [{ "role": "user" | "model", "text": string }, ...],
 *     "userText": string,
 *     "context": string | null
 *   }
 */

import { NextResponse } from "next/server";

import { aura } from "lib/cast/aura";
import { respond } from "lib/capabilities/agent/dialogue";
import {
  getFirebaseAdminAuth,
  getFirebaseAdminDb,
} from "lib/firebase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

async function resolveUid(req: Request): Promise<string | null> {
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

async function persistTurn(
  uid: string,
  userTurn: Turn,
  modelTurn: Turn,
): Promise<void> {
  const db = getFirebaseAdminDb();
  if (!db) return;
  const ref = db.collection("auraConversations").doc(uid);
  const now = new Date().toISOString();
  try {
    const snap = await ref.get();
    const data = snap.exists ? (snap.data() ?? {}) : {};
    const existing = Array.isArray(data["turns"]) ? data["turns"] : [];
    const next = [...existing, userTurn, modelTurn];
    // Cap the persisted history at 200 turns — older drop off the head.
    const capped = next.length > 200 ? next.slice(-200) : next;
    await ref.set(
      {
        turns: capped,
        updatedAt: now,
        ...(snap.exists ? {} : { createdAt: now }),
      },
      { merge: true },
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("aura/chat: persistTurn failed", err);
  }
}

export async function POST(req: Request) {
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
  const userText = typeof obj["userText"] === "string" ? obj["userText"] : "";
  if (!userText.trim()) {
    return NextResponse.json(
      { error: "userText is required" },
      { status: 400 },
    );
  }
  const historyRaw = obj["history"];
  const history: Turn[] = Array.isArray(historyRaw)
    ? historyRaw.filter(isTurn)
    : [];
  const context =
    typeof obj["context"] === "string" && obj["context"].trim().length > 0
      ? obj["context"].trim()
      : undefined;

  const uid = await resolveUid(req);

  // Aura's existing `agent.dialogue` capability requires a speakerId
  // (used for slice writes). For the public chat we don't care about
  // the cast/agent slices — pass a sentinel that won't collide.
  let text: string;
  try {
    const result = await respond({
      speakerId: "aura.web-chat",
      bible: aura,
      userText,
      provider: "gemini",
      ...(context ? { contextSuffix: context } : {}),
    });
    text = typeof result.text === "string" ? result.text : "";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `dialogue failed: ${message}` },
      { status: 502 },
    );
  }

  if (uid) {
    void persistTurn(
      uid,
      { role: "user", text: userText },
      { role: "model", text },
    );
  }

  return NextResponse.json({ text, persisted: uid !== null });
}

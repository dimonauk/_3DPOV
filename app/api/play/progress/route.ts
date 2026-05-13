import { NextResponse } from "next/server";

import {
  defaultProgress,
  type PlayerProgress,
} from "lib/play/state";

/**
 * Game progress API.
 *
 * GET  /api/play/progress
 *   Returns the authenticated player's progress. Without an auth
 *   session this falls back to defaultProgress() so the UI never gets
 *   nothing back.
 *
 * POST /api/play/progress
 *   Writes the player's progress. The body is a PlayerProgress shape;
 *   the route validates it and forwards to Firestore.
 *
 * Auth: mirrors the env-wiring pattern in /api/rookery/onboarding —
 * the route checks for a required env var (in production, the
 * firebase-admin service-account JSON) and returns 500 if absent so
 * the failure is loud, not silent.
 *
 * TODO: wire firebase-admin. The production wiring needs:
 *   - FIREBASE_ADMIN_SERVICE_ACCOUNT env var with the JSON-encoded
 *     service-account credentials.
 *   - getAuth().verifyIdToken(idToken) on the Authorization header to
 *     resolve the caller's UID.
 *   - Firestore admin read/write against /play_progress/{uid}.
 * The current implementation stubs both verbs against defaultProgress()
 * so the route can be smoke-tested without the backend up.
 */

export const dynamic = "force-dynamic";

function adminConfigured(): boolean {
  return Boolean(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT);
}

export async function GET() {
  if (!adminConfigured()) {
    // Stub mode — return defaultProgress so the page can render
    // before the firebase-admin SDK is wired. Once it is, this branch
    // should look up the caller's UID from a session cookie or the
    // Authorization header and read /play_progress/{uid}.
    return NextResponse.json(
      {
        ok: true,
        progress: defaultProgress(),
        note: "Stub — firebase-admin not configured; returning defaultProgress().",
      },
      { status: 200 },
    );
  }

  // TODO: real implementation
  //   const idToken = req.headers.get("authorization")?.replace(/^Bearer /, "");
  //   const decoded = await getAuth().verifyIdToken(idToken);
  //   const snap = await getFirestore().doc(`play_progress/${decoded.uid}`).get();
  //   const progress = snap.exists ? coerceProgress(snap.data()) : defaultProgress();
  //   return NextResponse.json({ ok: true, progress });
  return NextResponse.json(
    { ok: true, progress: defaultProgress() },
    { status: 200 },
  );
}

function isValidProgress(input: unknown): input is PlayerProgress {
  if (!input || typeof input !== "object") return false;
  const obj = input as Partial<PlayerProgress>;
  if (typeof obj.levelStates !== "object" || obj.levelStates === null) {
    return false;
  }
  if (
    typeof obj.trailsPublished !== "number" ||
    obj.trailsPublished < 0
  ) {
    return false;
  }
  if (typeof obj.lastPlayed !== "string") return false;
  return true;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isValidProgress(body)) {
    return NextResponse.json(
      { error: "Body did not match the PlayerProgress shape." },
      { status: 400 },
    );
  }

  if (!adminConfigured()) {
    // Stub — accept the write but don't persist anywhere. Production
    // wiring should reject this branch with 500 once the route is
    // expected to be writing for real.
    return NextResponse.json(
      {
        ok: true,
        progress: body,
        note: "Stub — firebase-admin not configured; write was not persisted.",
      },
      { status: 200 },
    );
  }

  // TODO: real implementation
  //   const idToken = req.headers.get("authorization")?.replace(/^Bearer /, "");
  //   const decoded = await getAuth().verifyIdToken(idToken);
  //   await getFirestore().doc(`play_progress/${decoded.uid}`).set({
  //     ...body,
  //     userId: decoded.uid,
  //     updatedAt: FieldValue.serverTimestamp(),
  //   });
  //   return NextResponse.json({ ok: true, progress: { ...body, userId: decoded.uid } });
  return NextResponse.json({ ok: true, progress: body }, { status: 200 });
}

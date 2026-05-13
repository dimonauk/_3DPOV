import { NextResponse } from "next/server";

import { isZoneSlug, type ZoneSlug } from "lib/chrono-protocol/zones";

/**
 * Chrono-Protocol score submission.
 *
 * POST /api/chrono-protocol/score
 *   Body: {
 *     zone: ZoneSlug,
 *     score: number,
 *     telemetryAtEnd: { health, combo, phase, currentMode, ... },
 *     scoreEvents: ScoreEvent[],
 *   }
 *   Returns: { ok: true, position: number, id: string }
 *
 * v0.1: stub. Validates the body shape, logs to the console, returns a
 * synthetic { position: 1, id: "stub" }. The Firebase Firestore
 * integration wave will:
 *   - Verify the Authorization: Bearer <idToken> header against the
 *     firebase-admin SDK (mirrors /api/play/progress's pattern).
 *   - Append the score to /chrono_protocol_scores/{zone}/runs/{auto}.
 *   - Compute the player's leaderboard position from the live
 *     leaderboard collection.
 *   - Return the real id + position.
 */

export const dynamic = "force-dynamic";

type ScorePostBody = {
  zone: ZoneSlug;
  score: number;
  telemetryAtEnd?: unknown;
  scoreEvents?: unknown[];
};

function isValidBody(input: unknown): input is ScorePostBody {
  if (!input || typeof input !== "object") return false;
  const obj = input as Partial<ScorePostBody>;
  if (typeof obj.zone !== "string" || !isZoneSlug(obj.zone)) return false;
  if (
    typeof obj.score !== "number" ||
    !Number.isFinite(obj.score) ||
    obj.score < 0
  ) {
    return false;
  }
  return true;
}

function adminConfigured(): boolean {
  return Boolean(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isValidBody(body)) {
    return NextResponse.json(
      {
        error:
          "Body did not match the Chrono-Protocol score-post shape. Expected { zone, score, telemetryAtEnd?, scoreEvents? }.",
      },
      { status: 400 },
    );
  }

  if (!adminConfigured()) {
    console.log(
      "[chrono-protocol/score] stub-mode write:",
      JSON.stringify({ zone: body.zone, score: body.score }),
    );
    return NextResponse.json(
      {
        ok: true,
        position: 1,
        id: "stub",
        note: "Stub — firebase-admin not configured; score was not persisted.",
      },
      { status: 200 },
    );
  }

  // TODO — Wave 8 (persistence):
  //   const idToken = req.headers.get("authorization")?.replace(/^Bearer /, "");
  //   const decoded = await getAuth().verifyIdToken(idToken);
  //   const ref = await getFirestore()
  //     .collection(`chrono_protocol_scores/${body.zone}/runs`)
  //     .add({
  //       uid: decoded.uid,
  //       score: body.score,
  //       telemetryAtEnd: body.telemetryAtEnd ?? null,
  //       scoreEvents: body.scoreEvents ?? [],
  //       at: FieldValue.serverTimestamp(),
  //     });
  //   const position = await computeLeaderboardPosition(body.zone, body.score);
  //   return NextResponse.json({ ok: true, id: ref.id, position });
  return NextResponse.json(
    { ok: true, id: "stub-prod", position: 1 },
    { status: 200 },
  );
}

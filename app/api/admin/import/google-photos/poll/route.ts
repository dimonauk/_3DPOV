/**
 * app/api/admin/import/google-photos/poll/route.ts — Poll the Photos
 * Picker session and (when ready) return the picked items in one shot.
 *
 * GET /api/admin/import/google-photos/poll?sessionId=…
 *   Headers: Authorization: Bearer <firebase-id-token>
 *   Returns: { mediaItemsSet: boolean, mediaItems: PickedMediaItem[] }
 *
 * When `mediaItemsSet` is false the operator hasn't finished picking;
 * the client should keep polling on its own ~2s cadence. When true, we
 * also list all picked items in this same response so the client only
 * needs one round-trip.
 */

import { NextResponse } from "next/server";

import {
  adminGuardErrorBody,
  AdminGuardError,
  requireAdminUser,
} from "lib/integrations/google/admin-guard";
import { getOperatorAccessToken } from "lib/integrations/google/oauth";
import {
  listAllSelectedMediaItems,
  pollPickerSession,
} from "lib/integrations/google/photos-picker";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  let admin: { uid: string; email: string };
  try {
    admin = await requireAdminUser(req);
  } catch (err) {
    if (err instanceof AdminGuardError) {
      const { status, body } = adminGuardErrorBody(err);
      return NextResponse.json(body, { status });
    }
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing sessionId query parameter." },
      { status: 400 },
    );
  }

  try {
    const accessToken = await getOperatorAccessToken(admin.uid);
    const { mediaItemsSet } = await pollPickerSession(accessToken, sessionId);
    if (!mediaItemsSet) {
      return NextResponse.json(
        { mediaItemsSet: false, mediaItems: [] },
        { status: 200 },
      );
    }
    const mediaItems = await listAllSelectedMediaItems(accessToken, sessionId);
    return NextResponse.json(
      { mediaItemsSet: true, mediaItems },
      { status: 200 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Picker poll failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

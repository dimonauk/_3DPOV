/**
 * POST /api/discord/resync — re-run the Discord role sync for the
 * authenticated user. Used by the Re-sync button on /rookery/discord.
 *
 * Auth: Authorization: Bearer <Firebase ID token>.
 */

import { NextResponse } from "next/server";

import { verifyIdToken } from "lib/firebase/admin";
import { createLogger } from "lib/log";
import { discordPreflight, discordPreflightMessage } from "lib/discord/preflight";
import { syncDiscordRoleForUid } from "lib/discord/sync-role";

export const dynamic = "force-dynamic";

const log = createLogger("api.discord.resync");

export async function POST(req: Request): Promise<Response> {
  const preflight = discordPreflight();
  if (!preflight.ok) {
    return NextResponse.json(
      {
        error: "discord_not_configured",
        details: preflight.errors.map(discordPreflightMessage),
      },
      { status: 503 },
    );
  }

  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const idToken = authHeader.slice("bearer ".length).trim();

  let uid: string;
  try {
    const decoded = await verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "token_invalid" }, { status: 401 });
  }

  const result = await syncDiscordRoleForUid(uid);
  if (!result.ok) {
    log.warn("resync failed", { uid, error: result.error });
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  if ("deferred" in result && result.deferred) {
    return NextResponse.json({
      ok: true,
      deferred: true,
      reason: result.reason,
      inviteUrl:
        result.reason === "user-not-in-guild"
          ? result.inviteUrl ?? null
          : null,
    });
  }

  if ("applied" in result) {
    return NextResponse.json({
      ok: true,
      applied: result.applied,
      removed: result.removed,
    });
  }

  // unreachable given DiscordSyncResult union, but TS narrowing needs it
  return NextResponse.json({ ok: true });
}

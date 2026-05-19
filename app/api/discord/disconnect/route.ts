/**
 * POST /api/discord/disconnect — clear the Discord link from a user's
 * custom claims. Best-effort: also tries to remove all studio-managed
 * roles from the user on the Discord side so disconnect feels
 * immediate (no leftover Patron role hanging around for a day until
 * the reconciler catches up).
 *
 * Auth: Authorization: Bearer <Firebase ID token>.
 */

import { NextResponse } from "next/server";

import {
  requireFirebaseAdminAuth,
  verifyIdToken,
} from "lib/firebase/admin";
import { createLogger } from "lib/log";
import { discordFetch } from "lib/discord/rate-limit";
import {
  requireStudioGuildId,
  roleIdsManagedByStudio,
} from "lib/discord/role-map";
import { unlinkDiscordUser } from "lib/discord/sync-role";

export const dynamic = "force-dynamic";

const log = createLogger("api.discord.disconnect");

export async function POST(req: Request): Promise<Response> {
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

  // Find existing discord_user_id before clearing.
  const auth = requireFirebaseAdminAuth();
  const user = await auth.getUser(uid);
  const existing = (user.customClaims ?? {}) as Record<string, unknown>;
  const discordUserId =
    typeof existing.discord_user_id === "string"
      ? existing.discord_user_id
      : null;

  // Best-effort role cleanup on Discord side.
  if (discordUserId) {
    try {
      const guildId = requireStudioGuildId();
      for (const roleId of roleIdsManagedByStudio()) {
        await discordFetch(
          `/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
          {
            method: "DELETE",
            auth: "bot",
            headers: {
              "X-Audit-Log-Reason": encodeURIComponent(
                `holoflow-disconnect: uid=${uid}`,
              ),
            },
          },
        );
      }
    } catch (err) {
      log.warn("role cleanup on disconnect failed (continuing)", {
        uid,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  await unlinkDiscordUser(uid);
  log.info("discord link cleared", { uid, hadLink: Boolean(discordUserId) });
  return NextResponse.json({ ok: true });
}

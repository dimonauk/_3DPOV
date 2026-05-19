/**
 * GET /api/cron/discord-reconcile — daily safety net for Discord role
 * drift. Iterates every Firebase user with a `discord_user_id` custom
 * claim and re-runs `syncDiscordRoleForUid` for each.
 *
 * Why this exists in addition to the per-event sync from the Patreon
 * webhook:
 *   - A Discord role could be removed manually by an admin (drift
 *     against Firebase truth).
 *   - The webhook → sync chain could 500 between applyTier succeeding
 *     and syncDiscordRoleForUid being called.
 *   - A user could join the guild AFTER linking, in which case the
 *     initial sync was deferred ("user-not-in-guild") and a follow-up
 *     pass is needed.
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>` matching the existing
 * cron-route convention in this codebase.
 *
 * Pagination: Firebase Admin's `listUsers()` returns up to 1000 at a
 * time. The route accepts `?maxBatches=N` (default 5, max 20) to
 * bound the work per invocation.
 *
 * Rate limit: `await sleep(60)` between users to stay comfortably
 * under Discord's 50 req/sec global cap (each sync is ~1-3 requests
 * so this caps at ~16 syncs/sec).
 */

import { NextResponse } from "next/server";

import { requireFirebaseAdminAuth } from "lib/firebase/admin";
import { createLogger } from "lib/log";
import { discordPreflight } from "lib/discord/preflight";
import { syncDiscordRoleForUid } from "lib/discord/sync-role";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const log = createLogger("api.cron.discord-reconcile");

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function GET(req: Request): Promise<Response> {
  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "cron_not_configured" }, { status: 503 });
  }
  if (!authHeader?.startsWith("Bearer ") || authHeader.slice(7) !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const preflight = discordPreflight();
  if (!preflight.ok) {
    return NextResponse.json(
      { error: "discord_not_configured", details: preflight.errors },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const maxBatches = Math.min(
    20,
    Math.max(1, parseInt(url.searchParams.get("maxBatches") ?? "5", 10) || 5),
  );

  const auth = requireFirebaseAdminAuth();
  const summary = {
    scanned: 0,
    synced: 0,
    deferredNoLink: 0,
    deferredNotInGuild: 0,
    errors: 0,
  };

  let pageToken: string | undefined = undefined;
  let batch = 0;
  while (batch < maxBatches) {
    const page = await auth.listUsers(1000, pageToken);
    for (const user of page.users) {
      const claims = (user.customClaims ?? {}) as Record<string, unknown>;
      if (typeof claims.discord_user_id !== "string") continue;
      summary.scanned++;
      try {
        const res = await syncDiscordRoleForUid(user.uid);
        if (res.ok) {
          if ("deferred" in res && res.deferred) {
            if (res.reason === "user-not-in-guild")
              summary.deferredNotInGuild++;
            else summary.deferredNoLink++;
          } else {
            summary.synced++;
          }
        } else {
          summary.errors++;
        }
      } catch (err) {
        summary.errors++;
        log.warn("sync threw", {
          uid: user.uid,
          err: err instanceof Error ? err.message : String(err),
        });
      }
      await sleep(60);
    }
    pageToken = page.pageToken;
    batch++;
    if (!pageToken) break;
  }

  log.info("reconcile complete", summary);
  return NextResponse.json({ ok: true, ...summary });
}

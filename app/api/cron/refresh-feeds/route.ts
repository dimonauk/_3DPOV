/**
 * /api/cron/refresh-feeds — Pull all watched feeds, normalise, store.
 *
 * Skeleton route. The real runtime fetches each FeedSource in
 * `lib/social-feeds/sources.ts`, parses the response via
 * `feedsmith`, normalises into AggregatedPost shape, and writes
 * `data/aggregated-feed.json` (capped at 1000 entries).
 *
 * Auth: gated by `CRON_SECRET` header so only Vercel Cron + the
 * operator can hit it. Vercel Cron pings this hourly.
 *
 * Today the route is a stub — it validates the secret, lists the
 * sources, and returns a status report. The actual fetch/write loop
 * lands in a follow-up session.
 */

import { NextResponse, type NextRequest } from "next/server";

import { activeSources } from "lib/social-feeds/sources";
import { getLastRefresh } from "lib/social-feeds/store";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const sources = activeSources();

  // TODO: for each source, fetch + parse via feedsmith + write store.
  // Skeleton today; the loop ships in a follow-up session that adds:
  //   - fetch with timeout + retry
  //   - feedsmith.parseRSS / parseAtom / parseJSONFeed normalisation
  //   - Bluesky AT-proto + Mastodon API per-platform fetchers
  //   - de-duplication by post id
  //   - write to data/aggregated-feed.json (capped at 1000 entries)
  //   - revalidatePath("/feed")

  return NextResponse.json({
    ok: true,
    stub: true,
    sources_watched: sources.length,
    last_refresh: getLastRefresh(),
    note:
      "Refresh runtime not yet implemented; this route validates the cron contract and source registry only.",
  });
}

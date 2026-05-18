/**
 * /api/cron/refresh-feeds — Pull all watched feeds, normalise, store.
 *
 * Calls `refreshAggregatedFeed()` which:
 *   1. Reads every active FeedSource from lib/social-feeds/sources.ts.
 *   2. Dispatches per-platform fetcher (RSS / Atom / Bluesky /
 *      Mastodon / etc.).
 *   3. Merges, dedupes, sorts by date.
 *   4. Writes data/aggregated-feed.json capped at 1000 entries.
 *
 * Auth: gated by CRON_SECRET via the Authorization header so only
 * Vercel Cron + the operator can hit it. Vercel Cron pings this
 * hourly when wired into vercel.json's `crons` section.
 */

import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { refreshAggregatedFeed } from "lib/social-feeds/refresh";

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

  try {
    const summary = await refreshAggregatedFeed();
    // Bust the static cache on /feed so the next page render picks up
    // the fresh JSON.
    try {
      revalidatePath("/feed");
    } catch {
      /* revalidate is best-effort outside a request lifecycle */
    }
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

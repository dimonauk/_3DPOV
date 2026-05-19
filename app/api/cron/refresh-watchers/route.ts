/**
 * /api/cron/refresh-watchers — Hourly Vercel Cron job that runs every
 * polymaths-feed source and writes the merged snapshot.
 *
 * Auth: CRON_SECRET via the Authorization header. Matches the pattern
 * in /api/cron/refresh-feeds. After a successful run, the route calls
 * `revalidatePath("/news")` so the next render of /news picks up the
 * new entries.
 */
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { refreshWatchers } from "lib/watchers/refresh";

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
    const summary = await refreshWatchers();
    try {
      revalidatePath("/news");
      revalidatePath("/admin/watchers");
    } catch {
      /* revalidate best-effort outside a request */
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

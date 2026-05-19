/**
 * /api/internal/feed-ingest — Bearer-token POST endpoint the bench-side
 * git poller hits to ingest commits from Hangar + DollyOS.
 *
 * Auth: `FEED_INGEST_TOKEN` env var, matched against the `Authorization:
 * Bearer <token>` header. The bench-side script (`scripts/bench/
 * poll-git-activity.mjs`) is the only intended caller.
 *
 * Body: `{ entries: IngestEntry[] }`, validated by Zod. Each entry is
 * normalised into a `FeedEntry` and merged into the shared store via
 * `appendEntries`.
 */
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

import {
  IngestBatchSchema,
  normaliseIngestBatch,
} from "lib/watchers/sources/git-bench";
import { appendEntries } from "lib/watchers/store";

export const dynamic = "force-dynamic";

function isAuthorised(req: NextRequest): boolean {
  const token = process.env.FEED_INGEST_TOKEN;
  if (!token) return false; // closed by default — no token means no ingest
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${token}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = IngestBatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid batch", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const entries = normaliseIngestBatch(parsed.data);
  const stored = await appendEntries(entries);
  try {
    revalidatePath("/news");
  } catch {
    /* revalidate best-effort */
  }
  return NextResponse.json({
    ok: true,
    ingested: entries.length,
    stored,
  });
}

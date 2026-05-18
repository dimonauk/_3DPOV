import { NextResponse, type NextRequest } from "next/server";
import { verifyIdToken } from "lib/firebase/admin";
import {
  parseCsv,
  rowsToImportRows,
  importCards,
} from "lib/cards/bulk-import-server";
import { withRouteLogging, errToObject } from "lib/log";
import { createFixedWindowLimiter } from "lib/rate-limit/fixed-window";

/**
 * POST /api/cards/bulk-import — create or update multiple cards from CSV.
 *
 * Auth: signed-in user. The user's uid becomes ownerUid on every
 * created card.
 *
 * Body (multipart/form-data OR JSON):
 *   multipart: file field named "csv" — the CSV file
 *   JSON:      { csv: string } — raw CSV text
 *
 * Every response carries X-Request-Id for log correlation.
 *
 * Returns:
 *   200 { ok: true, counts, results: RowResult[] }
 *   400 → invalid body / no rows
 *   401 → unauthenticated
 *   413 → too many rows (>100) or CSV >1 MB
 *   500 → internal error (uncaught throw — request id in body)
 */

const MAX_ROWS = 100;
const MAX_CSV_BYTES = 1024 * 1024;

// Per-uid quota — 5 imports/hour. A single import can write 100 cards
// to Firestore; 5/hour caps a single user at 500 card writes/hour,
// which is more than the cleanup-and-republish workflow needs but
// keeps a runaway client from flooding the collection.
const HOURLY_CAP = 5;
const limiter = createFixedWindowLimiter({
  scope: "api.cards.bulk-import",
  limit: HOURLY_CAP,
  windowMs: 60 * 60 * 1000,
});

export const POST = withRouteLogging("cards.bulk-import", async (req: NextRequest, _ctx, log) => {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    log.info("auth:missing_token");
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  let uid: string;
  try {
    uid = (await verifyIdToken(token)).uid;
  } catch (err) {
    log.warn("auth:invalid_token", { err: errToObject(err) });
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  // Per-uid quota — bulk-import writes up to MAX_ROWS Firestore docs
  // in a single call; capping per-uid keeps a runaway client from
  // flooding the collection.
  const slot = await limiter.consume(`uid:${uid}`);
  if (!slot.ok) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((slot.resetAt - Date.now()) / 1000),
    );
    log.info("rate_limited", { uid, retryAfterSec, backend: limiter.backend });
    return NextResponse.json(
      {
        error: "rate_limited",
        message: `Bulk-import cap: ${HOURLY_CAP} imports per hour per user.`,
        retryAfterSec,
      },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  let csv = "";
  const contentType = req.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("csv");
      if (!(file instanceof File)) {
        log.info("body:missing_csv");
        return NextResponse.json({ error: "missing_csv" }, { status: 400 });
      }
      csv = await file.text();
    } else {
      const body = (await req.json()) as { csv?: string };
      if (!body.csv) {
        log.info("body:missing_csv");
        return NextResponse.json({ error: "missing_csv" }, { status: 400 });
      }
      csv = body.csv;
    }
  } catch (err) {
    log.warn("body:invalid", { err: errToObject(err) });
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (csv.length > MAX_CSV_BYTES) {
    log.info("csv_too_large", { bytes: csv.length, max: MAX_CSV_BYTES });
    return NextResponse.json(
      { error: "csv_too_large", maxBytes: MAX_CSV_BYTES },
      { status: 413 },
    );
  }

  let parsed: Array<Record<string, string>>;
  try {
    parsed = parseCsv(csv);
  } catch (err) {
    log.warn("csv:parse_failed", { err: errToObject(err) });
    return NextResponse.json(
      { error: "csv_parse_failed", message: (err as Error).message },
      { status: 400 },
    );
  }

  if (parsed.length === 0) {
    log.info("csv:no_rows");
    return NextResponse.json({ error: "no_rows" }, { status: 400 });
  }
  if (parsed.length > MAX_ROWS) {
    log.info("csv:too_many_rows", { rows: parsed.length, max: MAX_ROWS });
    return NextResponse.json(
      {
        error: "too_many_rows",
        maxRows: MAX_ROWS,
        gotRows: parsed.length,
      },
      { status: 413 },
    );
  }

  const rows = rowsToImportRows(parsed);
  log.info("import:start", { uid, rows: rows.length });

  try {
    const results = await importCards(rows, uid);
    const counts = {
      created: results.filter((r) => r.status === "created").length,
      updated: results.filter((r) => r.status === "updated").length,
      skipped: results.filter((r) => r.status === "skipped").length,
    };
    log.info("import:ok", { uid, ...counts });
    return NextResponse.json({ ok: true, counts, results });
  } catch (err) {
    log.error("import:failed", { uid, err: errToObject(err) });
    return NextResponse.json(
      { error: "import_failed", message: (err as Error).message },
      { status: 500 },
    );
  }
});

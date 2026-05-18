/**
 * GET /api/cron/sweep-scan-temp — daily janitor for scan-temp/* blobs
 * left behind when the scan function crashed before its finally{}
 * block could run.
 *
 * Trigger: declared in vercel.json under "crons" with schedule
 * "0 4 * * *" (daily at 04:00 UTC). Vercel auto-injects
 * Authorization: Bearer ${CRON_SECRET}, verified by middleware.ts
 * before this function runs.
 *
 * What it does:
 *   1. List every blob under wardrobe-storage at the scan-temp/ prefix
 *   2. Delete any blob older than ONE_HOUR_MS
 *   3. Return a summary { listed, deleted, errors }
 *
 * Defensive choices:
 *   - 1-hour grace window. A scan can legitimately run up to ~60s
 *     after upload; an hour is comfortably outside that. We never
 *     want to delete a blob that's still being processed.
 *   - Soft errors don't fail the whole sweep — we collect them and
 *     keep going.
 */

// BOM-strip the Blob token at module load (same pattern as the other
// blob-touching routes).
if (
  typeof process !== "undefined" &&
  process.env.BLOB_READ_WRITE_TOKEN &&
  process.env.BLOB_READ_WRITE_TOKEN.charCodeAt(0) === 0xfeff
) {
  process.env.BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN.slice(
    1,
  ).trim();
}

import { NextResponse, type NextRequest } from "next/server";
import { list, del as deleteBlob } from "@vercel/blob";
import { withRouteLogging, errToObject } from "lib/log";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ONE_HOUR_MS = 60 * 60 * 1000;

export const GET = withRouteLogging(
  "cron.sweep-scan-temp",
  async (_req: NextRequest, _ctx, log) => {
    const cutoff = Date.now() - ONE_HOUR_MS;
    let listed = 0;
    let deleted = 0;
    const errors: Array<{ url: string; message: string }> = [];

    try {
      let cursor: string | undefined;
      do {
        const page: { blobs: Array<{ url: string; uploadedAt: Date }>; cursor?: string; hasMore: boolean } =
          await list({
            prefix: "scan-temp/",
            limit: 1000,
            ...(cursor ? { cursor } : {}),
          });

        for (const blob of page.blobs) {
          listed++;
          const uploadedAt =
            blob.uploadedAt instanceof Date
              ? blob.uploadedAt.getTime()
              : new Date(blob.uploadedAt).getTime();
          if (uploadedAt < cutoff) {
            try {
              await deleteBlob(blob.url);
              deleted++;
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err);
              errors.push({ url: blob.url, message });
              log.warn("blob:delete_failed", {
                url: blob.url,
                err: errToObject(err),
              });
            }
          }
        }

        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);

      log.info("sweep:complete", { listed, deleted, errorCount: errors.length });
      return NextResponse.json({
        ok: true,
        listed,
        deleted,
        errorCount: errors.length,
        // Don't return the URLs in errors[] to anyone — even though
        // cron is auth-gated, no point in surfacing identifying info.
      });
    } catch (err) {
      log.error("sweep:failed", { err: errToObject(err) });
      return NextResponse.json(
        {
          error: "sweep_failed",
          message: err instanceof Error ? err.message : String(err),
          partial: { listed, deleted, errorCount: errors.length },
        },
        { status: 500 },
      );
    }
  },
);

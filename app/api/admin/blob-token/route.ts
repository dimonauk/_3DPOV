/**
 * One-shot token-exposure endpoint. Returns the BOM-stripped
 * BLOB_READ_WRITE_TOKEN so a local Node migration script can use
 * @vercel/blob's put() directly. Without this, the token in Vercel
 * env vars has a UTF-8 BOM at byte 0 that fetch() rejects with
 * "Cannot convert argument to a ByteString".
 *
 * REMOVE IMMEDIATELY AFTER THE WARDROBE MIGRATION COMPLETES.
 * Exposing the write token to anyone with MIGRATE_TOKEN is a
 * blast radius that should not exist a moment longer than needed.
 */

import { NextResponse, type NextRequest } from "next/server";
import { withRouteLogging } from "lib/log";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export const GET = withRouteLogging(
  "admin.blob-token",
  async (req: NextRequest, _ctx, log) => {
    const auth = req.headers.get("authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    const expected = process.env.MIGRATE_TOKEN;
    if (!expected || !token || token !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    let blob = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blob) {
      return NextResponse.json(
        { error: "BLOB_READ_WRITE_TOKEN not set" },
        { status: 503 },
      );
    }
    if (blob.charCodeAt(0) === 0xfeff) blob = blob.slice(1);
    blob = blob.trim();

    log.info("blob-token:issued", { length: blob.length });

    return NextResponse.json({
      ok: true,
      token: blob,
      length: blob.length,
      hint: "Use with @vercel/blob put() — DELETE this route after wardrobe migration completes.",
    });
  },
);

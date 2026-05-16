/**
 * app/api/admin/import/google-photos/to-splat/route.ts — Photo → SHARP →
 * Splat orchestrator.
 *
 * The marquee Google-Photos × studio-bench pipeline. For each picked
 * mediaItem the operator chose in the Picker:
 *
 *   1. Download the original photo bytes from Google Photos
 *      (`baseUrl=d`, Bearer auth — Picker URLs are operator-private).
 *   2. POST the bytes to the SHARP-ONNX bench service over the
 *      Tailscale-Funnel tunnel.
 *   3. Receive a 1.18 M-gaussian PLY back.
 *   4. Persist via `mediaUpload` with `source: "vercel-blob"` and the
 *      full splat metadata block (provider/licence/plyFlavour/gaussianCount).
 *
 * SHARP outputs carry an `apple-amlr` research-only licence — the splat
 * record's `sourceRef.splat.licence` field is hard-wired to
 * "research-only" so commerce surfaces never accidentally show them.
 *
 * Each picked photo costs ~90s of bench GPU time. The route holds the
 * Vercel function open for up to 5 minutes; for batches over ~3 items
 * the client should send them in serial waves rather than one big POST.
 *
 * POST /api/admin/import/google-photos/to-splat
 *   Headers: Authorization: Bearer <firebase-id-token>
 *   Body: { sessionId: string, mediaItemIds: string[] }
 *   Returns: { outcomes: Array<{ mediaItemId, ok, mediaId?, plyUrl?, error? }> }
 */

import { NextResponse } from "next/server";

import {
  generateViaSharpOnnxFromBytes,
  type SplatOutputTarget,
} from "lib/capabilities/viz/splat-generate.server";
import {
  adminGuardErrorBody,
  AdminGuardError,
  requireAdminUser,
} from "lib/integrations/google/admin-guard";
import { getOperatorAccessToken } from "lib/integrations/google/oauth";
import {
  deletePickerSession,
  listAllSelectedMediaItems,
  type PickedMediaItem,
} from "lib/integrations/google/photos-picker";
import { downloadMediaItem } from "lib/integrations/google/photos-picker-download";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // ~5 min ceiling — typical photo takes ~90s.

type Body = {
  sessionId?: unknown;
  mediaItemIds?: unknown;
  target?: unknown;
};

type TargetKind = "vercel-blob" | "google-drive";

function coerceBody(input: unknown): {
  sessionId: string;
  mediaItemIds: string[];
  target: TargetKind;
} | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Body;
  if (typeof o.sessionId !== "string" || !o.sessionId) return null;
  if (!Array.isArray(o.mediaItemIds)) return null;
  const ids = o.mediaItemIds.filter((x): x is string => typeof x === "string");
  if (!ids.length) return null;
  const target: TargetKind =
    o.target === "google-drive" ? "google-drive" : "vercel-blob";
  return { sessionId: o.sessionId, mediaItemIds: ids, target };
}

function isPhoto(item: PickedMediaItem): boolean {
  if (item.type === "PHOTO") return true;
  const mt = (item.mediaFile?.mimeType ?? "").toLowerCase();
  return mt.startsWith("image/");
}

export async function POST(req: Request) {
  let admin: { uid: string; email: string };
  try {
    admin = await requireAdminUser(req);
  } catch (err) {
    if (err instanceof AdminGuardError) {
      const { status, body } = adminGuardErrorBody(err);
      return NextResponse.json(body, { status });
    }
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const body = coerceBody(json);
  if (!body) {
    return NextResponse.json(
      { error: "Invalid body. Need sessionId + mediaItemIds[]." },
      { status: 400 },
    );
  }

  let accessToken: string;
  try {
    accessToken = await getOperatorAccessToken(admin.uid);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Access-token fetch failed." },
      { status: 500 },
    );
  }

  let session: PickedMediaItem[];
  try {
    session = await listAllSelectedMediaItems(accessToken, body.sessionId);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not re-list session media items.",
      },
      { status: 500 },
    );
  }
  const byId = new Map(session.map((m) => [m.id, m]));

  const outcomes: Array<{
    mediaItemId: string;
    ok: boolean;
    mediaId?: string;
    plyUrl?: string;
    error?: string;
  }> = [];

  for (const id of body.mediaItemIds) {
    const item = byId.get(id);
    if (!item) {
      outcomes.push({ mediaItemId: id, ok: false, error: "not-in-session" });
      continue;
    }
    if (!isPhoto(item)) {
      outcomes.push({
        mediaItemId: id,
        ok: false,
        error: "SHARP only accepts photos; this item is a video.",
      });
      continue;
    }
    try {
      const { bytes, mimeType, filename } = await downloadMediaItem(
        accessToken,
        item,
      );
      const outputTarget: SplatOutputTarget =
        body.target === "google-drive"
          ? { kind: "google-drive", operatorAccessToken: accessToken }
          : { kind: "vercel-blob" };
      const record = await generateViaSharpOnnxFromBytes({
        bytes,
        mimeType,
        filename,
        uploadedBy: admin.uid,
        sourceImageUrl: null, // Picker URLs are operator-private + transient.
        target: outputTarget,
      });
      outcomes.push({
        mediaItemId: id,
        ok: true,
        mediaId: typeof record.meta["mediaId"] === "string"
          ? (record.meta["mediaId"] as string)
          : record.id,
        plyUrl: record.plyUrl,
      });
    } catch (err) {
      outcomes.push({
        mediaItemId: id,
        ok: false,
        error: err instanceof Error ? err.message : "splat-failed",
      });
    }
  }

  // Best-effort session cleanup once we're done.
  void deletePickerSession(accessToken, body.sessionId).catch(() => {
    /* ignore */
  });

  return NextResponse.json({ outcomes }, { status: 200 });
}

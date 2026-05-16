/**
 * app/api/viz/text-to-3d/route.ts — Visitor-facing text → 3D mesh route.
 *
 * Accepts EITHER JSON `{ prompt, imageUrl?, seed? }` OR multipart
 * `prompt=<string>`, optional `image=<file>`, optional `seed=<number>`.
 * When an image file is supplied, it is uploaded to the media library
 * first, and the resulting URL is passed to the bench so TRELLIS can
 * fetch it. When `imageUrl` is supplied in JSON, it is forwarded
 * straight through.
 *
 * # Auth posture
 *
 * Operator-only via the existing google admin guard. TRELLIS is GPU-
 * bound and the bench would melt under anonymous traffic; rate-limiting
 * + quota would have to land before opening this up.
 *
 * # Timing
 *
 * The whole round trip — prompt dispatch, optional image upload, bench
 * inference, GLB upload to Vercel Blob — usually completes inside ~3
 * minutes on a 3090. Vercel function timeout is bumped to 300s.
 */

import { NextResponse } from "next/server";

import { createLogger } from "lib/log";
import { textTo3DServer } from "lib/capabilities/viz/text-to-3d.server";
import type { TextTo3DError } from "lib/capabilities/viz/text-to-3d";
import { mediaUpload } from "lib/capabilities/media/library";
import {
  adminGuardErrorBody,
  AdminGuardError,
  requireAdminUser,
} from "lib/integrations/google/admin-guard";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const log = createLogger("api:viz.text-to-3d");

function isTextTo3DError(err: unknown): err is TextTo3DError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
  );
}

type ParsedInput = {
  prompt: string;
  imageUrl: string | null;
  seed: number | null;
};

async function parseInput(
  req: Request,
  uploadedBy: string,
): Promise<ParsedInput | { error: string; status: number }> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return { error: "Expected multipart/form-data.", status: 400 };
    }
    const promptRaw = form.get("prompt");
    const prompt =
      typeof promptRaw === "string" ? promptRaw.trim() : "";
    if (!prompt) return { error: "Missing 'prompt'.", status: 400 };

    const seedRaw = form.get("seed");
    const seed =
      typeof seedRaw === "string" && seedRaw.length > 0 && Number.isFinite(Number(seedRaw))
        ? Number(seedRaw)
        : null;

    // Optional reference image: upload to the media library first, then
    // pass the resulting URL to the bench.
    let imageUrl: string | null = null;
    const file = form.get("image");
    const isBlobLike = (
      v: FormDataEntryValue | null,
    ): v is FormDataEntryValue & Blob =>
      v !== null &&
      typeof v !== "string" &&
      typeof (v as { arrayBuffer?: unknown }).arrayBuffer === "function";
    if (isBlobLike(file) && file.size > 0) {
      const filename =
        "name" in file && typeof (file as File).name === "string"
          ? (file as File).name
          : "reference.png";
      const mime = file.type || "image/png";
      const bytes = new Uint8Array(await file.arrayBuffer());
      const media = await mediaUpload({
        file: bytes,
        filename,
        mimeType: mime,
        kind: "photo",
        subject: "research",
        uploadedBy,
        source: "vercel-blob",
      });
      imageUrl = media.url;
    }
    return { prompt, imageUrl, seed };
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return { error: "Expected a JSON body or multipart form.", status: 400 };
  }
  const prompt =
    typeof payload["prompt"] === "string" ? payload["prompt"].trim() : "";
  if (!prompt) return { error: "Missing 'prompt'.", status: 400 };
  const imageUrl =
    typeof payload["imageUrl"] === "string" && payload["imageUrl"].length > 0
      ? (payload["imageUrl"] as string)
      : null;
  const seed =
    typeof payload["seed"] === "number" && Number.isFinite(payload["seed"])
      ? (payload["seed"] as number)
      : null;
  return { prompt, imageUrl, seed };
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

  const parsed = await parseInput(req, admin.uid);
  if ("error" in parsed) {
    return NextResponse.json(
      { error: parsed.error },
      { status: parsed.status },
    );
  }

  log.info("dispatch", {
    uploadedBy: admin.uid,
    promptPreview: parsed.prompt.slice(0, 80),
    hasImageUrl: Boolean(parsed.imageUrl),
    seed: parsed.seed,
  });

  try {
    const result = await textTo3DServer(
      {
        prompt: parsed.prompt,
        imageUrl: parsed.imageUrl,
        seed: parsed.seed,
      },
      { uploadedBy: admin.uid },
    );
    return NextResponse.json({ result });
  } catch (err) {
    if (isTextTo3DError(err)) {
      const status =
        err.code === "provider-unavailable"
          ? 503
          : err.code === "source-invalid"
            ? 400
            : err.code === "auth-required"
              ? 401
              : 500;
      log.warn("provider-error", { code: err.code });
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status },
      );
    }
    log.error("internal error", { err });
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error.",
        code: "generation-failed",
      },
      { status: 500 },
    );
  }
}

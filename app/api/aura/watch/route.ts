import { NextResponse } from "next/server";
import {
  WATCH_PROMPT_FLAT,
  WATCH_PROMPT_360,
} from "lib/aura/prompts";
import {
  uploadVideoFromUrl,
  generateColdEyeReading,
  parseColdEyeReading,
} from "lib/aura/gemini";

// `runtime = "nodejs"` is intentionally NOT exported here. As of Next.js
// 15.6, route segment config `runtime` is incompatible with the global
// `experimental.useCache` flag in next.config.ts (build fails with
// "Route segment config 'runtime' is not compatible with
//  nextConfig.experimental.useCache. Please remove it."). Since
// `'nodejs'` is the default route runtime anyway, omitting the export
// preserves the behaviour this route needs: the Gemini Files API
// upload uses Node-only streaming bytes, and that still runs under
// Node by default. See:
// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
// Video understanding passes can take 30–90s for a 1-minute clip.
export const maxDuration = 300;

/**
 * POST /api/aura/watch
 *
 * Body: { url: string, projection?: "flat" | "360", displayName?: string }
 *
 * Returns the cold-eye reading as JSON. The caller is responsible for
 * the read-back pass (Aura's voice rewrite) and the ElevenLabs synth.
 *
 * No upload UI here yet — paste a public Blob URL or any HTTPS URL the
 * Files API can fetch on its own. Vercel Blob, S3, R2 all work.
 */
export async function POST(req: Request) {
  let body: {
    url?: string;
    projection?: "flat" | "360";
    displayName?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const { url, projection = "flat", displayName = "watch-upload" } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json(
      { error: "Missing `url` field — pass a public HTTPS URL to a video file." },
      { status: 400 },
    );
  }
  if (projection !== "flat" && projection !== "360") {
    return NextResponse.json(
      { error: "`projection` must be 'flat' or '360'." },
      { status: 400 },
    );
  }

  try {
    const uploaded = await uploadVideoFromUrl(url, displayName);
    const prompt =
      projection === "360" ? WATCH_PROMPT_360 : WATCH_PROMPT_FLAT;
    const raw = await generateColdEyeReading(
      uploaded.uri,
      uploaded.mimeType,
      prompt,
    );
    const reading = parseColdEyeReading(raw);
    return NextResponse.json({
      ok: true,
      projection,
      reading,
      file: {
        uri: uploaded.uri,
        mimeType: uploaded.mimeType,
        expirationTime: uploaded.expirationTime,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}

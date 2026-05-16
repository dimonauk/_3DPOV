import { NextResponse, type NextRequest } from "next/server";
import {
  isScannerConfigured,
  scanCardImage,
  type ExtractedCardFields,
} from "lib/cards/scanner-server";
import { verifyIdToken } from "lib/firebase/admin";

/**
 * POST /api/cards/scan — extract contact fields from a card photo.
 *
 * Auth: signed-in users only — we use the user's identity for
 * rate-limiting (10 scans / hour / uid) to keep Anthropic spend
 * predictable. Visitors can't anonymously hammer this.
 *
 * Body (multipart/form-data OR JSON):
 *   multipart: file field named "image"
 *   JSON:      { imageBase64: string, mediaType?: string }
 *
 * Response:
 *   200 → ExtractedCardFields
 *   401 → not authenticated
 *   413 → image too large (>5 MB after decode)
 *   429 → rate limit exceeded
 *   503 → ANTHROPIC_API_KEY not configured
 *   502 → upstream Anthropic API error
 */

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const RATE_LIMIT_PER_HOUR = 10;

// In-memory sliding window. Process-local — busy user could hit a
// fresh counter on a new lambda. Move to Upstash Redis if it matters.
type Counter = { count: number; resetAt: number };
const counters = new Map<string, Counter>();

function checkRate(uid: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const c = counters.get(uid);
  if (!c || c.resetAt < now) {
    counters.set(uid, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return { ok: true, remaining: RATE_LIMIT_PER_HOUR - 1 };
  }
  if (c.count >= RATE_LIMIT_PER_HOUR) return { ok: false, remaining: 0 };
  c.count += 1;
  return { ok: true, remaining: RATE_LIMIT_PER_HOUR - c.count };
}

export async function POST(req: NextRequest) {
  if (!isScannerConfigured()) {
    return NextResponse.json(
      {
        error: "scanner_not_configured",
        message:
          "The AI scanner needs ANTHROPIC_API_KEY in Vercel env vars. Set it and the scanner activates everywhere.",
      },
      { status: 503 },
    );
  }

  // Auth: require a Firebase ID token so we can rate-limit by uid.
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  let uid: string;
  try {
    uid = (await verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  const limit = checkRate(uid);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "10 scans per hour per user." },
      { status: 429 },
    );
  }

  // Accept multipart or JSON.
  const contentType = req.headers.get("content-type") ?? "";
  let imageBase64 = "";
  let mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" =
    "image/jpeg";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("image");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "missing_image" }, { status: 400 });
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "image_too_large", maxBytes: MAX_IMAGE_BYTES },
          { status: 413 },
        );
      }
      const buf = Buffer.from(await file.arrayBuffer());
      imageBase64 = buf.toString("base64");
      const ft = (file.type || "").toLowerCase();
      if (ft === "image/png") mediaType = "image/png";
      else if (ft === "image/webp") mediaType = "image/webp";
      else if (ft === "image/gif") mediaType = "image/gif";
      else mediaType = "image/jpeg";
    } else {
      const body = (await req.json()) as {
        imageBase64?: string;
        mediaType?: string;
      };
      if (!body.imageBase64) {
        return NextResponse.json(
          { error: "missing_imageBase64" },
          { status: 400 },
        );
      }
      if (body.imageBase64.length * 0.75 > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "image_too_large" },
          { status: 413 },
        );
      }
      imageBase64 = body.imageBase64;
      if (body.mediaType === "image/png") mediaType = "image/png";
      else if (body.mediaType === "image/webp") mediaType = "image/webp";
      else if (body.mediaType === "image/gif") mediaType = "image/gif";
    }
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const extracted: ExtractedCardFields = await scanCardImage(
      imageBase64,
      mediaType,
    );
    return NextResponse.json(
      { ok: true, extracted, remaining: limit.remaining },
      {
        status: 200,
        headers: { "X-Holoflow-Scans-Remaining": String(limit.remaining) },
      },
    );
  } catch (err) {
    const msg = (err as Error).message ?? "unknown_error";
    console.error("Scanner error:", msg);
    return NextResponse.json(
      { error: "scan_failed", message: msg },
      { status: 502 },
    );
  }
}

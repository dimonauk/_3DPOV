/**
 * app/api/viz/splat-generate/route.ts — Submit an image-source
 * splat-generate job.
 *
 * JSON POST endpoint. Verifies the Firebase ID token from
 * `Authorization: Bearer <token>`, checks the email against the
 * operator allow-list, then delegates to `splatGenerateServer()`.
 *
 * # Provider gating
 *
 * The `SplatProvider` type union enumerates SIX providers
 * (sharp-onnx, hangar-gsplat, hangar-4dgs, luma-genie, postshot,
 * studio-rig-native). This route ACCEPTS only four —
 *
 *   sharp-onnx          (live, image-source)
 *   postshot            (stub; throws provider-unavailable)
 *   studio-rig-native   (stub; throws provider-unavailable)
 *   luma-genie          (live, luma-ref)
 *
 * — and rejects the hangar-* family at the gate. Hangar providers
 * consume VIDEO sources, and the operator UI for video → splat lives
 * at `/api/holo-walk/generate-splat`, which handles the multipart
 * video upload + per-operator rate-limit + admin guard appropriate
 * for that flow. Routing hangar-* through this image-only route would
 * accept a payload the parser silently downgrades to a "not supported
 * in this build" error — clearer to gate up-front.
 *
 * If a future use-case needs hangar-* through a JSON-source route
 * (e.g. submitting an existing Vercel Blob URL of a video), add the
 * provider here AND extend `parseInput` to accept `source.kind ===
 * "video"`.
 *
 * Body shape (JSON):
 *   {
 *     "provider": "sharp-onnx",
 *     "source": { "kind": "image-single", "url": "https://..." }
 *   }
 *
 * Returns the created `SplatRecord` (or an error JSON).
 *
 * Note: the request can take ~10–30 seconds end-to-end (image fetch +
 * bench inference + Vercel Blob upload + Firestore write). Vercel
 * function timeout is bumped to 300s to leave headroom.
 */

import { NextResponse } from "next/server";

import { verifyIdToken } from "lib/firebase/admin";
import { isAdminEmail } from "lib/auth/admin-emails";
import { splatGenerateServer } from "lib/capabilities/viz/splat-generate.server";
import type {
  SplatGenerateInput,
  SplatProvider,
} from "lib/capabilities/viz/splat-generate";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Intentionally narrower than the `SplatProvider` type union — see
// "Provider gating" in the file header. Hangar-* providers use the
// /api/holo-walk/generate-splat route instead.
const PROVIDERS: ReadonlySet<SplatProvider> = new Set([
  "sharp-onnx",
  "postshot",
  "studio-rig-native",
  "luma-genie",
]);

function extractBearer(req: Request): string | null {
  const header =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header);
  return m && m[1] ? m[1].trim() : null;
}

function parseInput(body: unknown): SplatGenerateInput | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "expected a JSON object body" };
  }
  const obj = body as Record<string, unknown>;
  const provider = obj["provider"];
  if (typeof provider !== "string" || !PROVIDERS.has(provider as SplatProvider)) {
    // Special-case hangar-* so the error message points the caller at
    // the route that actually handles those (instead of leaving them
    // hunting in the type union).
    if (provider === "hangar-gsplat" || provider === "hangar-4dgs") {
      return {
        error: `provider "${provider}" submits video sources via /api/holo-walk/generate-splat — this route only accepts image sources`,
      };
    }
    return {
      error: `provider must be one of ${Array.from(PROVIDERS).join(" | ")}`,
    };
  }
  const source = obj["source"];
  if (typeof source !== "object" || source === null) {
    return { error: "source is required" };
  }
  const s = source as Record<string, unknown>;
  const sourceKind = s["kind"];
  // Intentionally narrow: this route handles the image-single flow
  // (Apple SHARP, single-photo → 3D Gaussian Splat). Multi-image,
  // video, and luma-ref flows live on dedicated routes that do their
  // own multipart / external-ID validation. Adding kinds here means
  // also extending the providers gate above.
  if (sourceKind === "image-single") {
    if (typeof s["url"] !== "string") {
      return { error: "source.url is required for image-single" };
    }
    return {
      provider: provider as SplatProvider,
      source: { kind: "image-single", url: s["url"] },
      ...(typeof obj["recordId"] === "string"
        ? { recordId: obj["recordId"] }
        : {}),
    };
  }
  return {
    error: `source.kind "${String(sourceKind)}" is not supported in this build`,
  };
}

export async function POST(req: Request) {
  const token = extractBearer(req);
  if (!token) {
    return NextResponse.json(
      { error: "Missing Authorization: Bearer <idToken>" },
      { status: 401 },
    );
  }

  let decoded: { uid: string; email: string | undefined };
  try {
    decoded = await verifyIdToken(token);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Token verification failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
  if (!isAdminEmail(decoded.email)) {
    return NextResponse.json(
      { error: "Not authorised for operator routes" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "expected application/json body" },
      { status: 400 },
    );
  }

  const parsed = parseInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const record = await splatGenerateServer(parsed, { uploadedBy: decoded.uid });
    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: unknown }).code)
        : "unknown";
    const status =
      code === "provider-unavailable" ? 503 : code === "source-invalid" ? 400 : 500;
    return NextResponse.json({ error: message, code }, { status });
  }
}

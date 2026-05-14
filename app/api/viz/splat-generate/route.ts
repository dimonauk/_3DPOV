/**
 * app/api/viz/splat-generate/route.ts — Submit a splat-generate job.
 *
 * JSON POST endpoint. Verifies the Firebase ID token from
 * `Authorization: Bearer <token>`, checks the email against the
 * operator allow-list, then delegates to `splatGenerateServer()` —
 * which dispatches to the right provider (sharp-onnx today; postshot,
 * studio-rig-native, luma-genie are stubs that throw until wired).
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
import { splatGenerateServer } from "lib/capabilities/viz/splat-generate.server";
import type {
  SplatGenerateInput,
  SplatProvider,
} from "lib/capabilities/viz/splat-generate";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADMIN_EMAILS = new Set<string>(["dimonauk@gmail.com"]);

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
  if (!decoded.email || !ADMIN_EMAILS.has(decoded.email.toLowerCase())) {
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

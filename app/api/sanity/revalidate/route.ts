/**
 * app/api/sanity/revalidate/route.ts — Sanity publish webhook → cache
 * revalidation.
 *
 * One-line role: receives a webhook from Sanity on every publish and
 * invalidates the matching Next cache tag, so the public site sees new
 * content within a single request rather than waiting for the hourly
 * fallback revalidation in `lib/sanity/fetch.ts`.
 *
 * # Auth
 * Shared-secret. Configure the webhook in Sanity:
 *   - URL:    `${SITE_URL}/api/sanity/revalidate?secret=<SANITY_REVALIDATE_SECRET>`
 *   - Method: POST
 *   - Filter: any document type the schemas in `sanity/schemas/` define
 *   - Body:   `{ "_type": _type, "_id": _id, "slug": slug.current }`
 *
 * # Posture
 * Fail-closed on auth, fail-open on body: a missing `_type` is logged
 * and the request returns 200 (so Sanity doesn't retry forever) but no
 * tag is invalidated. The hourly fallback revalidation still catches
 * the change.
 */

import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { tagForType } from "../../../../lib/sanity/fetch";

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const expected = process.env.SANITY_REVALIDATE_SECRET;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "SANITY_REVALIDATE_SECRET not configured" },
      { status: 503 },
    );
  }

  // Accept secret via query (?secret=…) or header (sanity-webhook-secret).
  const querySecret = req.nextUrl.searchParams.get("secret") ?? "";
  const headerSecret = req.headers.get("sanity-webhook-secret") ?? "";
  const provided = querySecret || headerSecret;

  if (!provided || !constantTimeEqual(provided, expected)) {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }

  type WebhookBody = { _type?: string; _id?: string; slug?: string };
  let body: WebhookBody | null = null;
  try {
    const parsed = (await req.json()) as unknown;
    if (parsed && typeof parsed === "object") {
      body = parsed as WebhookBody;
    }
  } catch {
    body = null;
  }

  const type = body?._type;
  const tag = tagForType(type);

  if (!tag) {
    // eslint-disable-next-line no-console
    console.warn("[sanity revalidate] unknown _type:", type);
    return NextResponse.json({ ok: true, revalidated: false, reason: "unknown-type" });
  }

  // Next canary requires the second `profile` arg; "seconds" matches the
  // convention used elsewhere in the repo (see app/api/revalidate/route.ts).
  revalidateTag(tag, "seconds");
  return NextResponse.json({
    ok: true,
    revalidated: true,
    tag,
    now: Date.now(),
  });
}

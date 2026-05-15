import { NextResponse, type NextRequest } from "next/server";
import { recordCardEvent } from "lib/cards/analytics-server";

/**
 * POST /api/cards/[slug]/events — record a single analytics event.
 *
 * Body shape:
 *   { type: 'view' | 'ar_launch' | ..., src?: string }
 *
 * Headers used:
 *   x-forwarded-for / x-real-ip — IP source for hashing + rate limit
 *   x-vercel-ip-country — free country code from Vercel's edge
 *   user-agent / referer — recorded with the event
 *
 * Errors:
 *   400 — bad slug or invalid type
 *   429 — rate-limited (more than 30 events/minute from this IP hash)
 *   503 — admin SDK is misconfigured
 *
 * This is intentionally a one-call-per-event endpoint. Batching is
 * unnecessary at the per-card scale we expect (10s-100s scans/day);
 * if a card goes viral we'll revisit.
 */
type Params = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { slug } = await params;

  let body: { type?: string; src?: string };
  try {
    body = (await req.json()) as { type?: string; src?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.type) {
    return NextResponse.json({ error: "missing_type" }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";

  const result = await recordCardEvent({
    slug,
    type: body.type as Parameters<typeof recordCardEvent>[0]["type"],
    src: body.src ?? null,
    ua: req.headers.get("user-agent"),
    referrer: req.headers.get("referer"),
    ip,
    country: req.headers.get("x-vercel-ip-country"),
  });

  if (!result.ok) {
    if (result.error === "rate_limited") {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    if (result.error === "no_admin") {
      return NextResponse.json({ error: "no_admin" }, { status: 503 });
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Don't waste bandwidth on a body — the client doesn't need the
  // event id and we don't want to surface internal IDs.
  return new NextResponse(null, { status: 204 });
}

import { NextResponse, type NextRequest } from "next/server";
import { createCardLead, notifyOwnerOfLead } from "lib/cards/leads-server";
import { getCardServer } from "lib/cards/firestore-server";

/**
 * POST /api/cards/[slug]/leads — capture a visitor's contact details.
 *
 * Body:
 *   {
 *     email: string,            // required
 *     name?: string,
 *     message?: string,
 *     src?: string,             // optional UTM-style tag
 *   }
 *
 * Errors:
 *   400 — invalid email / missing email / invalid slug
 *   429 — rate-limited (more than 5 leads/min from this IP)
 *   503 — admin SDK misconfigured
 *
 * On success the lead lands in Firestore at cards/<slug>/leads/<id>,
 * and if Resend is configured + the card has an owner email, a
 * notification email fires to the owner (best-effort, non-blocking).
 */
export const runtime = "nodejs";

type Params = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { slug } = await params;

  let body: {
    email?: string;
    name?: string;
    message?: string;
    src?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";

  const result = await createCardLead({
    slug,
    email: body.email ?? "",
    name: body.name,
    message: body.message,
    src: body.src,
    ip,
    ua: req.headers.get("user-agent") ?? undefined,
    country: req.headers.get("x-vercel-ip-country") ?? undefined,
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

  // Fire notification email in the background — never blocks the
  // visitor's response. We still await so Vercel doesn't kill it
  // mid-request, but errors are swallowed inside notifyOwnerOfLead.
  try {
    const card = await getCardServer(slug);
    const ownerEmail =
      (card?.card as { contact?: { email?: string } } | undefined)?.contact?.email;
    const cardName =
      (card?.card as { name?: string } | undefined)?.name ?? slug;
    if (ownerEmail) {
      await notifyOwnerOfLead({
        ownerEmail,
        cardSlug: slug,
        cardName,
        leadName: body.name,
        leadEmail: (body.email ?? "").trim().toLowerCase(),
        leadMessage: body.message,
      });
    }
  } catch {
    // Notification is best-effort; lead is already stored.
  }

  return NextResponse.json({ ok: true, id: result.id });
}

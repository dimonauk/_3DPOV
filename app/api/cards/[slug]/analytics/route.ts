import { NextResponse, type NextRequest } from "next/server";
import { aggregateCardEvents } from "lib/cards/analytics-server";
import { getCardServer } from "lib/cards/firestore-server";
import { verifyIdToken } from "lib/firebase/admin";

/**
 * GET /api/cards/[slug]/analytics — owner-only analytics summary.
 *
 * Auth: requires `Authorization: Bearer <firebaseIdToken>`. Token is
 * verified server-side; if its uid doesn't match the card's ownerUid,
 * we 403 (no whoami leak). Card-not-found returns 404.
 *
 * Response: aggregateCardEvents result — totals + breakdowns by type,
 * source, country, day. Capped at 5000 events for the bucket scan.
 */
type Params = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  const card = await getCardServer(slug);
  if (!card) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (card.ownerUid !== uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const stats = await aggregateCardEvents(slug);
  const cardName =
    (card.card as { name?: string } | undefined)?.name ?? slug;

  return NextResponse.json({ stats, cardName });
}

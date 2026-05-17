import { NextResponse } from "next/server";
import { getCard } from "lib/ar/cards";

/**
 * GET /api/cards/[slug] — return the public Card JSON.
 *
 * No auth — card data is already public on the /c/<slug> landing.
 * Useful for the email-signature generator and any other client
 * surface that needs structured card data without scraping the
 * landing page.
 *
 * Returns 404 if the slug isn't found (file or Firestore).
 */

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  if (!/^[a-z0-9-]+$/i.test(slug)) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }
  const card = await getCard(slug);
  if (!card) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ card });
}

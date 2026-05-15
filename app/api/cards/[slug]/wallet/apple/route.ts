import { NextResponse, type NextRequest } from "next/server";
import { getCard } from "lib/ar/cards";
import {
  generateApplePass,
  isAppleWalletConfigured,
} from "lib/wallet/apple-pkpass";

/**
 * GET /api/cards/[slug]/wallet/apple — download the card as a signed
 * .pkpass that can be added to Apple Wallet.
 *
 * Returns:
 *   200 application/vnd.apple.pkpass  — pass binary, Content-Disposition attachment
 *   404                               — unknown slug
 *   503                               — Apple Wallet not configured (cert missing)
 *
 * No auth required — the pass is public information already shown on
 * the card landing. We don't want to gate the Add-to-Wallet flow
 * behind sign-in.
 *
 * If you want to disable wallet generation per-card (e.g. studio-only
 * pass type), gate on card.public or a card.appleWallet flag here.
 */

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;

  if (!isAppleWalletConfigured()) {
    return NextResponse.json(
      {
        error: "apple_wallet_not_configured",
        message:
          "Apple Wallet pass generation needs APPLE_PASS_TYPE_ID, APPLE_TEAM_ID, APPLE_PASS_CERT_PEM, APPLE_PASS_KEY_PEM, and APPLE_WWDR_CERT_PEM environment variables. Add them in Vercel project settings and the endpoint will start working.",
      },
      { status: 503 },
    );
  }

  const card = await getCard(slug);
  if (!card) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const buffer = await generateApplePass({
      card: {
        slug,
        name: card.name,
        role: card.role,
        studio: card.studio,
        tagline: card.tagline,
        brand: card.brand,
        contact: card.contact,
      },
      publicBaseUrl:
        process.env.PUBLIC_BASE_URL || "https://holoflow.co.uk",
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="${slug}.pkpass"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Apple Wallet pass generation failed:", err);
    return NextResponse.json(
      { error: "pass_generation_failed", message: (err as Error).message },
      { status: 500 },
    );
  }
}

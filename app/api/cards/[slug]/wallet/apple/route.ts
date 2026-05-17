import { NextResponse, type NextRequest } from "next/server";
import { getCard } from "lib/ar/cards";
import {
  generateApplePass,
  isAppleWalletConfigured,
} from "lib/wallet/apple-pkpass";
import { withRouteLogging, errToObject } from "lib/log";

/**
 * GET /api/cards/[slug]/wallet/apple — download the card as a signed
 * .pkpass that can be added to Apple Wallet.
 *
 * Every response carries X-Request-Id for log correlation.
 *
 * Returns:
 *   200 application/vnd.apple.pkpass  — pass binary, Content-Disposition attachment
 *   404                               — unknown slug
 *   503                               — Apple Wallet not configured (cert missing)
 *   500                               — uncaught error (request id in body)
 *
 * No auth required — the pass is public information already shown on
 * the card landing.
 */

type Params = { params: Promise<{ slug: string }> };

export const GET = withRouteLogging<Params>(
  "cards.wallet.apple",
  async (_req: NextRequest, { params }, log) => {
    const { slug } = await params;
    log.debug("slug", { slug });

    if (!isAppleWalletConfigured()) {
      log.info("apple_wallet:not_configured");
      return NextResponse.json(
        {
          error: "apple_wallet_not_configured",
          message:
            "Apple Wallet pass generation needs APPLE_PASS_TYPE_ID, APPLE_TEAM_ID, APPLE_PASS_CERT_PEM, APPLE_PASS_KEY_PEM, and APPLE_WWDR_CERT_PEM environment variables.",
        },
        { status: 503 },
      );
    }

    let card;
    try {
      card = await getCard(slug);
    } catch (err) {
      log.error("getCard:threw", { slug, err: errToObject(err) });
      return NextResponse.json(
        { error: "card_lookup_failed", message: (err as Error).message },
        { status: 500 },
      );
    }
    if (!card) {
      log.info("card:not_found", { slug });
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
      log.info("apple_wallet:generated", { slug, bytes: buffer.length });

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.apple.pkpass",
          "Content-Disposition": `attachment; filename="${slug}.pkpass"`,
          "Cache-Control": "no-cache",
        },
      });
    } catch (err) {
      log.error("apple_wallet:generation_failed", { slug, err: errToObject(err) });
      return NextResponse.json(
        { error: "pass_generation_failed", message: (err as Error).message },
        { status: 500 },
      );
    }
  },
);

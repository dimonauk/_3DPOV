import { NextResponse, type NextRequest } from "next/server";
import { getCard } from "lib/ar/cards";
import {
  buildGoogleWalletSaveUrl,
  isGoogleWalletConfigured,
} from "lib/wallet/google-wallet";
import { withRouteLogging, errToObject } from "lib/log";

/**
 * GET /api/cards/[slug]/wallet/google — return the Google Wallet save URL.
 *
 * Every response carries X-Request-Id for log correlation.
 *
 * Responses:
 *   200 application/json { saveUrl }    — pass JWT built, return URL
 *   302 redirect (when ?redirect=1)     — sends user straight to Wallet
 *   404                                  — unknown slug
 *   503                                  — Google Wallet not configured
 *   500                                  — uncaught error (request id in body)
 *
 * No auth — pass content is public.
 */

type Params = { params: Promise<{ slug: string }> };

export const GET = withRouteLogging<Params>(
  "cards.wallet.google",
  async (req: NextRequest, { params }, log) => {
    const { slug } = await params;
    log.debug("slug", { slug });

    if (!isGoogleWalletConfigured()) {
      log.info("google_wallet:not_configured");
      return NextResponse.json(
        {
          error: "google_wallet_not_configured",
          message:
            "Google Wallet generation needs GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_CLASS_ID, GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL, and GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY env vars.",
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
      const saveUrl = buildGoogleWalletSaveUrl({
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
      log.info("google_wallet:built", { slug, jwtLen: saveUrl.length });

      const wantsRedirect = req.nextUrl.searchParams.get("redirect") === "1";
      if (wantsRedirect) {
        return NextResponse.redirect(saveUrl, 302);
      }

      return NextResponse.json(
        { saveUrl },
        {
          status: 200,
          headers: { "Cache-Control": "no-cache" },
        },
      );
    } catch (err) {
      log.error("google_wallet:generation_failed", {
        slug,
        err: errToObject(err),
      });
      return NextResponse.json(
        { error: "pass_generation_failed", message: (err as Error).message },
        { status: 500 },
      );
    }
  },
);

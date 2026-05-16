import { NextResponse, type NextRequest } from "next/server";
import { getCard } from "lib/ar/cards";
import {
  buildGoogleWalletSaveUrl,
  isGoogleWalletConfigured,
} from "lib/wallet/google-wallet";

/**
 * GET /api/cards/[slug]/wallet/google — return the Google Wallet save URL.
 *
 * Responses:
 *   200 application/json { saveUrl }         — pass JWT built, return URL
 *   200 redirect (when ?redirect=1)          — sends user straight to Wallet
 *   404                                       — unknown slug
 *   503                                       — Google Wallet not configured
 *
 * The default JSON response lets the button component decide whether
 * to open the URL or display a QR for the user to scan with their
 * phone. ?redirect=1 makes the endpoint a one-click "go directly to
 * Wallet" URL, useful when embedding in QR codes or email links.
 *
 * No auth needed — pass content is public (same as Apple Wallet).
 */

type Params = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { slug } = await params;

  if (!isGoogleWalletConfigured()) {
    return NextResponse.json(
      {
        error: "google_wallet_not_configured",
        message:
          "Google Wallet generation needs GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_CLASS_ID, GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL, and GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY env vars.",
      },
      { status: 503 },
    );
  }

  const card = await getCard(slug);
  if (!card) {
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
    console.error("Google Wallet generation failed:", err);
    return NextResponse.json(
      { error: "pass_generation_failed", message: (err as Error).message },
      { status: 500 },
    );
  }
}

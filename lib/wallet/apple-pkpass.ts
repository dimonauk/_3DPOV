import "server-only";

/**
 * Apple Wallet pass generation for Holo-Flow cards.
 *
 * Generates a signed `.pkpass` bundle on demand. Activates only when
 * the four Apple-issued env vars are set; otherwise this module's
 * `isAppleWalletConfigured()` returns false and callers must respond
 * with a friendly 503.
 *
 *   APPLE_PASS_TYPE_ID         e.g. pass.co.uk.holoflow.cards
 *   APPLE_TEAM_ID              10-char Apple Developer Team ID
 *   APPLE_PASS_CERT_PEM        the Pass Type ID certificate (PEM)
 *   APPLE_PASS_KEY_PEM         the matching private key (PEM)
 *   APPLE_WWDR_CERT_PEM        Apple WWDR intermediate certificate (PEM)
 *
 *   APPLE_PASS_KEY_PASSPHRASE  optional, if the private key is encrypted
 *   APPLE_PASS_WEB_SERVICE_URL optional, for pass updates (we don't
 *                              currently implement the webservice, so
 *                              leaving this unset means the pass is
 *                              static — exactly what we want for a
 *                              business card).
 *
 * The pass type is generic (`generic.pkpass` template). Each pass
 * shows the card holder's name + role on the front, with the
 * studio + a "Tap for AR" CTA. Scan the embedded QR code (the
 * pass barcode) and the user is taken straight to /c/<slug>.
 *
 * Icons are generated per-pass with `sharp` using the card's
 * brand palette so each pass reads as part of the card's identity
 * rather than a generic Holo-Flow square.
 */

import { PKPass } from "passkit-generator";
import sharp from "sharp";

export type CardForPass = {
  slug: string;
  name: string;
  role?: string;
  studio?: string;
  tagline?: string;
  brand: {
    primary: string;
    secondary?: string;
    accent?: string;
    textOnBrand?: string;
  };
  contact?: {
    email?: string;
    website?: string;
  };
};

export function isAppleWalletConfigured(): boolean {
  return Boolean(
    process.env.APPLE_PASS_TYPE_ID &&
      process.env.APPLE_TEAM_ID &&
      process.env.APPLE_PASS_CERT_PEM &&
      process.env.APPLE_PASS_KEY_PEM &&
      process.env.APPLE_WWDR_CERT_PEM,
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalised = hex.replace("#", "").trim();
  if (normalised.length !== 6) return { r: 255, g: 111, b: 181 };
  const n = parseInt(normalised, 16);
  return {
    r: (n >> 16) & 0xff,
    g: (n >> 8) & 0xff,
    b: n & 0xff,
  };
}

function rgbForPass(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Render a solid + radial-gradient PNG icon for the pass. Apple
 * expects icon.png (29×29), icon@2x.png (58×58), icon@3x.png (87×87)
 * and a logo.png (160×50 max, white-friendly).
 */
async function renderIcon(
  size: number,
  primary: string,
  secondary: string,
): Promise<Buffer> {
  const { r: pr, g: pg, b: pb } = hexToRgb(primary);
  const { r: sr, g: sg, b: sb } = hexToRgb(secondary);
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="g" cx="40%" cy="35%" r="80%">
        <stop offset="0%" stop-color="rgb(${pr},${pg},${pb})"/>
        <stop offset="100%" stop-color="rgb(${sr},${sg},${sb})"/>
      </radialGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size * 0.22}" ry="${size * 0.22}" fill="url(#g)"/>
    <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.18}" fill="white" fill-opacity="0.9"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * Render the wide rectangular logo at the top of the pass. White
 * "Holo-Flow Studio" text on transparent background so it sits well
 * on the strip / header colour.
 */
async function renderLogo(scale: number): Promise<Buffer> {
  const width = 160 * scale;
  const height = 50 * scale;
  const fontSize = 18 * scale;
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="${height * 0.7}" font-family="Helvetica, Arial, sans-serif"
          font-size="${fontSize}" font-weight="700" fill="white">HOLO·FLOW</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

type GenerateOptions = {
  card: CardForPass;
  publicBaseUrl: string;
};

/**
 * Build a signed .pkpass buffer for a card. Throws if Apple env
 * vars aren't configured — callers should check isAppleWalletConfigured()
 * first.
 */
export async function generateApplePass({
  card,
  publicBaseUrl,
}: GenerateOptions): Promise<Buffer> {
  if (!isAppleWalletConfigured()) {
    throw new Error("apple_wallet_not_configured");
  }

  const passTypeIdentifier = process.env.APPLE_PASS_TYPE_ID!;
  const teamIdentifier = process.env.APPLE_TEAM_ID!;
  const wwdr = process.env.APPLE_WWDR_CERT_PEM!;
  const signerCert = process.env.APPLE_PASS_CERT_PEM!;
  const signerKey = process.env.APPLE_PASS_KEY_PEM!;
  const signerKeyPassphrase = process.env.APPLE_PASS_KEY_PASSPHRASE;
  const webServiceURL = process.env.APPLE_PASS_WEB_SERVICE_URL || undefined;

  const primary = card.brand.primary;
  const secondary = card.brand.secondary ?? primary;
  const url = `${publicBaseUrl.replace(/\/$/, "")}/c/${card.slug}`;

  // Pre-render the icons in parallel. Apple needs PNG, not SVG.
  const [icon, icon2x, icon3x, logo, logo2x] = await Promise.all([
    renderIcon(29, primary, secondary),
    renderIcon(58, primary, secondary),
    renderIcon(87, primary, secondary),
    renderLogo(1),
    renderLogo(2),
  ]);

  // pass.json content. Apple's "generic" pass type lets us define
  // a flexible field layout, which fits a business card well.
  const passData: Record<string, unknown> = {
    formatVersion: 1,
    passTypeIdentifier,
    teamIdentifier,
    serialNumber: card.slug,
    organizationName: card.studio ?? "Holo-Flow Studio",
    description: `${card.name} — AR business card`,
    foregroundColor: "rgb(255, 255, 255)",
    backgroundColor: rgbForPass(primary),
    labelColor: "rgb(255, 255, 255)",
    barcodes: [
      {
        format: "PKBarcodeFormatQR",
        message: url,
        messageEncoding: "iso-8859-1",
        altText: url,
      },
    ],
    generic: {
      primaryFields: [
        {
          key: "name",
          label: "NAME",
          value: card.name,
        },
      ],
      secondaryFields: [
        {
          key: "role",
          label: "ROLE",
          value: card.role ?? "",
        },
      ],
      auxiliaryFields: card.studio
        ? [
            {
              key: "studio",
              label: "STUDIO",
              value: card.studio,
            },
          ]
        : [],
      backFields: [
        ...(card.contact?.email
          ? [
              {
                key: "email",
                label: "Email",
                value: card.contact.email,
              },
            ]
          : []),
        ...(card.contact?.website
          ? [
              {
                key: "website",
                label: "Web",
                value: card.contact.website,
              },
            ]
          : []),
        {
          key: "ar-url",
          label: "Open in AR",
          value: url,
        },
        ...(card.tagline
          ? [{ key: "tagline", label: "About", value: card.tagline }]
          : []),
      ],
    },
  };
  if (webServiceURL) {
    passData.webServiceURL = webServiceURL;
    passData.authenticationToken = card.slug; // basic, not strong
  }

  const certificates: ConstructorParameters<typeof PKPass>[1] = {
    wwdr,
    signerCert,
    signerKey,
  };
  if (signerKeyPassphrase) {
    (
      certificates as { signerKeyPassphrase?: string }
    ).signerKeyPassphrase = signerKeyPassphrase;
  }

  // PKPass constructor signature: ({ pass.json buffer, additional file buffers }, certs, props)
  // The newest API uses PKPass.from for templates or new PKPass({}) for in-memory.
  // We'll use the buffer-map form: pass the pass.json + all images as Buffers.
  const pass = new PKPass(
    {
      "pass.json": Buffer.from(JSON.stringify(passData)),
      "icon.png": icon,
      "icon@2x.png": icon2x,
      "icon@3x.png": icon3x,
      "logo.png": logo,
      "logo@2x.png": logo2x,
    },
    certificates,
  );

  return pass.getAsBuffer();
}

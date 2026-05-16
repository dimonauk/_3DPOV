import "server-only";

/**
 * Google Wallet pass generation for Holo-Flow cards.
 *
 * Generates a signed JWT that, when opened in a browser, triggers
 * Google Wallet's "Save" flow. Unlike Apple Wallet, Google's passes
 * are not bundled binaries — they're a Pass Class (template defined
 * once in Google's Issuer Console) plus a Pass Object (per-card data)
 * embedded inside a JWT signed by our service account.
 *
 * Activates only when all four env vars are set:
 *
 *   GOOGLE_WALLET_ISSUER_ID                   numeric, e.g. 3388000000022123456
 *   GOOGLE_WALLET_CLASS_ID                    e.g. <issuerId>.holoflow_business_card
 *   GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL       sa@<project>.iam.gserviceaccount.com
 *   GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY full PEM, newlines preserved
 *
 * Otherwise `isGoogleWalletConfigured()` returns false and callers
 * respond with a friendly 503.
 *
 * Save URL pattern: `https://pay.google.com/gp/v/save/<signedJwt>`
 * When the user opens this URL in any browser (Android opens Wallet
 * directly; desktop and iOS open a "Save to phone" page), the pass
 * lands in their wallet linked to their Google account.
 *
 * Pass type: "generic" — Google's catch-all class that lets us
 * define our own card layout. Perfect for business cards.
 */

import jwt from "jsonwebtoken";

export type CardForGoogleWallet = {
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

export function isGoogleWalletConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_WALLET_ISSUER_ID &&
      process.env.GOOGLE_WALLET_CLASS_ID &&
      process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY,
  );
}

function normaliseHexColor(c: string): string {
  if (!c) return "#000000";
  let v = c.trim();
  if (!v.startsWith("#")) v = "#" + v;
  // Google Wallet wants 6-char hex.
  if (v.length === 4) {
    // #abc → #aabbcc
    const r = v[1]!,
      g = v[2]!,
      b = v[3]!;
    v = `#${r}${r}${g}${g}${b}${b}`;
  }
  return v.length === 7 ? v.toUpperCase() : "#000000";
}

type GenericObject = {
  id: string;
  classId: string;
  genericType: string;
  state?: string;
  cardTitle: { defaultValue: { language: string; value: string } };
  header: { defaultValue: { language: string; value: string } };
  subheader?: { defaultValue: { language: string; value: string } };
  textModulesData?: Array<{
    header: string;
    body: string;
    id: string;
  }>;
  linksModuleData?: {
    uris: Array<{ uri: string; description: string; id: string }>;
  };
  barcode: {
    type: string;
    value: string;
    alternateText?: string;
  };
  hexBackgroundColor: string;
  logo?: {
    sourceUri: { uri: string };
    contentDescription?: { defaultValue: { language: string; value: string } };
  };
};

type GenerateOptions = {
  card: CardForGoogleWallet;
  publicBaseUrl: string;
};

/**
 * Build a Google Wallet save URL for a card. Throws if env vars aren't
 * configured — check `isGoogleWalletConfigured()` first.
 *
 * The returned URL is meant to be opened in any browser. On Android
 * it deep-links to the Wallet app; on iOS / desktop it opens a
 * "Save to phone" landing where the user scans a QR.
 */
export function buildGoogleWalletSaveUrl({
  card,
  publicBaseUrl,
}: GenerateOptions): string {
  if (!isGoogleWalletConfigured()) {
    throw new Error("google_wallet_not_configured");
  }

  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID!;
  const classId = process.env.GOOGLE_WALLET_CLASS_ID!;
  const serviceAccountEmail =
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL!;
  // Private keys are usually pasted with \n escape sequences from a
  // JSON export — convert them to real newlines before signing.
  const privateKey = (
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY ?? ""
  ).replace(/\\n/g, "\n");

  const url = `${publicBaseUrl.replace(/\/$/, "")}/c/${card.slug}`;
  const objectId = `${issuerId}.${card.slug}`;
  const primary = normaliseHexColor(card.brand.primary);

  // Build the generic pass object. We use textModulesData for back-
  // of-pass detail fields and linksModuleData for the "open AR card"
  // and contact links.
  const textModules: GenericObject["textModulesData"] = [];
  if (card.studio) {
    textModules.push({
      id: "studio",
      header: "Studio",
      body: card.studio,
    });
  }
  if (card.tagline) {
    textModules.push({
      id: "tagline",
      header: "About",
      body: card.tagline,
    });
  }

  const links: NonNullable<GenericObject["linksModuleData"]>["uris"] = [
    {
      id: "ar",
      uri: url,
      description: "Open AR card",
    },
  ];
  if (card.contact?.email) {
    links.push({
      id: "email",
      uri: `mailto:${card.contact.email}`,
      description: card.contact.email,
    });
  }
  if (card.contact?.website) {
    const web = card.contact.website.startsWith("http")
      ? card.contact.website
      : `https://${card.contact.website}`;
    links.push({
      id: "website",
      uri: web,
      description: card.contact.website.replace(/^https?:\/\//, ""),
    });
  }

  const obj: GenericObject = {
    id: objectId,
    classId,
    genericType: "GENERIC_TYPE_UNSPECIFIED",
    state: "ACTIVE",
    cardTitle: {
      defaultValue: {
        language: "en",
        value: card.studio ?? "Holo-Flow Studio",
      },
    },
    header: { defaultValue: { language: "en", value: card.name } },
    subheader: card.role
      ? { defaultValue: { language: "en", value: card.role } }
      : undefined,
    textModulesData: textModules.length > 0 ? textModules : undefined,
    linksModuleData: { uris: links },
    barcode: {
      type: "QR_CODE",
      value: url,
      alternateText: url,
    },
    hexBackgroundColor: primary,
    logo: {
      sourceUri: { uri: `${publicBaseUrl.replace(/\/$/, "")}/logo.png` },
      contentDescription: {
        defaultValue: { language: "en", value: "Holo-Flow" },
      },
    },
  };

  // The payload Google expects, signed with the service account key.
  // typ: savetowallet is REQUIRED — it's how Google routes the JWT.
  const payload = {
    iss: serviceAccountEmail,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    payload: {
      genericObjects: [obj],
    },
  };

  const token = jwt.sign(payload, privateKey, { algorithm: "RS256" });
  return `https://pay.google.com/gp/v/save/${token}`;
}

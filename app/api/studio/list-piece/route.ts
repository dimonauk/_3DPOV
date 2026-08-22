/**
 * app/api/studio/list-piece/route.ts — List a new piece in the marketplace.
 *
 * Authenticated endpoint (Firebase ID token required).
 * Creates a draft Shopify product with the piece details and royalty metadata.
 *
 * POST {
 *   title: string,
 *   description: string,
 *   priceGbp: number,           // e.g. 85.00
 *   royaltyPercent: number,     // creator's cut, 0–70
 *   category: "jewellery" | "sculpture" | "desktop" | "wall",
 *   waveguideEmbedded: boolean, // true = premium waveguide tier
 *   imageBase64?: string,       // optional cover image (JPEG/PNG base64)
 * }
 *
 * Returns 200 { productId, adminUrl } on success.
 *
 * Royalty split (non-negotiable for this phase):
 *   Creator: royaltyPercent (capped at 70%)
 *   Platform: remainder
 *   Minimum platform cut: 30%
 *
 * Products are created as DRAFT status — operator reviews before publishing.
 * Aura watermark metadata is stamped on every piece.
 */

import "server-only";

import { NextResponse } from "next/server";
import { createLogger } from "lib/log";
import { verifyIdToken } from "lib/firebase/admin";

export const dynamic = "force-dynamic";

const log = createLogger("api.studio.list-piece");

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? "";
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ?? "";
const SHOPIFY_API_VERSION = "2024-04";

const VALID_CATEGORIES = new Set(["jewellery", "sculpture", "desktop", "wall"]);
const MAX_ROYALTY = 70;
const MIN_PLATFORM_CUT = 30;

type ListPieceBody = {
  title?: unknown;
  description?: unknown;
  priceGbp?: unknown;
  royaltyPercent?: unknown;
  category?: unknown;
  waveguideEmbedded?: unknown;
  imageBase64?: unknown;
};

function isConfigured(): boolean {
  return Boolean(SHOPIFY_DOMAIN && SHOPIFY_ADMIN_TOKEN);
}

async function createShopifyProduct(args: {
  title: string;
  description: string;
  priceGbp: number;
  category: string;
  waveguideEmbedded: boolean;
  royaltyPercent: number;
  creatorUid: string;
  creatorEmail: string;
}): Promise<{ productId: string; adminUrl: string }> {
  // Shopify Admin GraphQL — create a DRAFT product.
  const mutation = `
    mutation productCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          title
          status
        }
        userErrors { field message }
      }
    }
  `;

  const platformCut = 100 - args.royaltyPercent;
  const priceStr = args.priceGbp.toFixed(2);

  const input = {
    title: args.title,
    descriptionHtml: `<p>${args.description.replace(/\n/g, "</p><p>")}</p>`,
    status: "DRAFT",
    productType: args.category,
    tags: [
      args.category,
      args.waveguideEmbedded ? "waveguide" : "standard",
      "marketplace",
      "creator-piece",
    ],
    metafields: [
      {
        namespace: "studio",
        key: "creator_uid",
        value: args.creatorUid,
        type: "single_line_text_field",
      },
      {
        namespace: "studio",
        key: "creator_email",
        value: args.creatorEmail,
        type: "single_line_text_field",
      },
      {
        namespace: "studio",
        key: "royalty_percent",
        value: String(args.royaltyPercent),
        type: "number_integer",
      },
      {
        namespace: "studio",
        key: "platform_cut_percent",
        value: String(platformCut),
        type: "number_integer",
      },
      {
        namespace: "studio",
        key: "waveguide_embedded",
        value: String(args.waveguideEmbedded),
        type: "single_line_text_field",
      },
      {
        namespace: "studio",
        key: "aura_watermark",
        value: "Aura — Holo-Flow Studio",
        type: "single_line_text_field",
      },
    ],
    variants: [
      {
        price: priceStr,
        sku: `STUDIO-${Date.now()}`,
        inventoryManagement: null, // print-on-demand, no inventory tracking
        requiresShipping: true,
      },
    ],
  };

  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
      },
      body: JSON.stringify({ query: mutation, variables: { input } }),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Shopify ${res.status}: ${detail.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    data?: {
      productCreate?: {
        product?: { id?: string; title?: string };
        userErrors?: { field: string; message: string }[];
      };
    };
    errors?: unknown;
  };

  const userErrors = json.data?.productCreate?.userErrors ?? [];
  if (userErrors.length > 0) {
    throw new Error(userErrors.map((e) => `${e.field}: ${e.message}`).join("; "));
  }

  const productGid = json.data?.productCreate?.product?.id;
  if (!productGid) throw new Error("Shopify returned no product id");

  // GID format: gid://shopify/Product/123456789
  const numericId = productGid.split("/").pop() ?? productGid;
  const adminUrl = `https://${SHOPIFY_DOMAIN}/admin/products/${numericId}`;

  return { productId: numericId, adminUrl };
}

export async function POST(req: Request): Promise<Response> {
  // Auth: require Firebase ID token.
  const authHeader = req.headers.get("authorization") ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const tokenResult = await verifyIdToken(idToken);
  if (!tokenResult.ok) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  const { uid, email } = tokenResult;

  // Parse body.
  let body: ListPieceBody;
  try {
    body = (await req.json()) as ListPieceBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate.
  const { title, description, priceGbp, royaltyPercent, category, waveguideEmbedded } = body;

  if (typeof title !== "string" || title.trim().length < 3) {
    return NextResponse.json({ error: "title required (min 3 chars)" }, { status: 400 });
  }
  if (typeof description !== "string" || description.trim().length < 10) {
    return NextResponse.json({ error: "description required (min 10 chars)" }, { status: 400 });
  }
  if (typeof priceGbp !== "number" || priceGbp < 1) {
    return NextResponse.json({ error: "priceGbp must be >= 1" }, { status: 400 });
  }
  const royalty =
    typeof royaltyPercent === "number"
      ? Math.min(royaltyPercent, MAX_ROYALTY)
      : 50; // default 50/50 split
  if (royalty < 0 || royalty > MAX_ROYALTY) {
    return NextResponse.json(
      { error: `royaltyPercent must be 0–${MAX_ROYALTY}` },
      { status: 400 },
    );
  }
  if (typeof category !== "string" || !VALID_CATEGORIES.has(category)) {
    return NextResponse.json(
      { error: `category must be one of: ${[...VALID_CATEGORIES].join(", ")}` },
      { status: 400 },
    );
  }

  if (!isConfigured()) {
    log.warn("Shopify not configured — piece listing unavailable");
    return NextResponse.json(
      { error: "Marketplace not yet configured. Email studio@holoflow.co.uk to list a piece." },
      { status: 503 },
    );
  }

  try {
    const result = await createShopifyProduct({
      title: title.trim(),
      description: description.trim(),
      priceGbp,
      category,
      waveguideEmbedded: waveguideEmbedded === true,
      royaltyPercent: royalty,
      creatorUid: uid ?? "unknown",
      creatorEmail: email ?? "unknown",
    });

    log.info("piece listed", {
      productId: result.productId,
      title: title.trim(),
      creatorEmail: email,
      royalty,
    });

    return NextResponse.json({
      ok: true,
      productId: result.productId,
      adminUrl: result.adminUrl,
      message: `Draft product created. It'll appear in the marketplace after review (usually within 24 hours).`,
    });
  } catch (err) {
    log.error("list-piece failed", { err: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

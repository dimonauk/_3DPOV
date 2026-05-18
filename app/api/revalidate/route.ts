/**
 * Shopify webhook → cache revalidation.
 *
 * Logic was moved out of `lib/shopify/index.ts` so the route handler
 * can own the `NextRequest`/`NextResponse` contract directly. The
 * Shopify shopify library file is now a `"use server"` module (see
 * its top-of-file comment for why) and that directive makes its
 * exports Server Actions, which cannot use `NextRequest`-shaped
 * signatures.
 *
 * # Auth
 * Two paths, either of which authenticates the request:
 *   1. **HMAC-SHA256** (canonical Shopify path): the X-Shopify-Hmac-Sha256
 *      header is compared against an HMAC of the raw request body using
 *      `SHOPIFY_WEBHOOK_HMAC_SECRET`. This is what Shopify signs every
 *      webhook with regardless of how the subscription was configured.
 *   2. **URL-query `?secret=`** (legacy Vercel-commerce-template path):
 *      compared against `SHOPIFY_REVALIDATION_SECRET`. Kept for
 *      transitional safety — older webhooks still authenticate.
 *
 * Either path is sufficient; both are checked, fail-closed.
 */

import { TAGS } from "lib/constants";
import { createLogger } from "lib/log";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const log = createLogger("api.revalidate");

/** Base64-encode a buffer (Edge-compatible — no Buffer). */
function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin);
}

/** Constant-time string compare to avoid timing leaks. */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Verify the Shopify webhook HMAC. Body must be the raw bytes Shopify
 * POSTed (not re-serialised JSON). Returns false on any reason the
 * signature can't be confirmed — missing secret, bad input, etc.
 */
async function verifyShopifyHmac(
  rawBody: string,
  headerHmac: string | null,
  secret: string | undefined,
): Promise<boolean> {
  if (!headerHmac || !secret) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const computed = bufferToBase64(signature);
  return constantTimeEqual(computed, headerHmac);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // We always need to respond with a 200 status code to Shopify,
  // otherwise it will continue to retry the request.
  const collectionWebhooks = [
    "collections/create",
    "collections/delete",
    "collections/update",
  ];
  const productWebhooks = [
    "products/create",
    "products/delete",
    "products/update",
  ];
  const headerStore = await headers();
  const topic = headerStore.get("x-shopify-topic") || "unknown";
  const headerHmac = headerStore.get("x-shopify-hmac-sha256");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const isCollectionUpdate = collectionWebhooks.includes(topic);
  const isProductUpdate = productWebhooks.includes(topic);

  // Read body once — used for HMAC verification. Calling req.text()
  // exhausts the body stream, so we don't read it again later.
  const rawBody = await req.text();

  // Path 1: HMAC (canonical Shopify-trusted path).
  const hmacValid = await verifyShopifyHmac(
    rawBody,
    headerHmac,
    process.env.SHOPIFY_WEBHOOK_HMAC_SECRET,
  );

  // Path 2: URL-query secret (legacy Vercel-template path).
  const queryValid =
    typeof querySecret === "string" &&
    typeof process.env.SHOPIFY_REVALIDATION_SECRET === "string" &&
    constantTimeEqual(querySecret, process.env.SHOPIFY_REVALIDATION_SECRET);

  if (!hmacValid && !queryValid) {
    log.error("auth failed — neither HMAC nor URL secret valid", { topic });
    return NextResponse.json({ status: 401 });
  }

  if (!isCollectionUpdate && !isProductUpdate) {
    // We don't need to revalidate anything for any other topics.
    return NextResponse.json({ status: 200 });
  }

  if (isCollectionUpdate) {
    revalidateTag(TAGS.collections, "seconds");
  }

  if (isProductUpdate) {
    revalidateTag(TAGS.products, "seconds");
  }

  return NextResponse.json({ status: 200, revalidated: true, now: Date.now() });
}

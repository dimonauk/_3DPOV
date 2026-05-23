import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Prose from "components/prose";
import { getPage } from "lib/shopify";

// Opt this route out of PPR — under Next 15.6 canary + Turbopack,
// notFound() inside an async Suspense child hangs at 200 + 0 bytes
// instead of resolving to a 404. Same fix as /c/[slug] and the writing
// slug routes. Catalogue (which is /[page]/page.tsx?page=catalogue and
// is also missing in Shopify) returns 404 cleanly with this.
export const experimental_ppr = false;

// Defensive: never throw and never call notFound() here. If Shopify is
// slow or wedged, the 4s timeout in shopifyFetch will throw — we catch
// it and return basic metadata so the page render still gets a chance
// to fire its Suspense fallback. notFound() in generateMetadata was
// blocking the whole response under Next 15.6 canary + PPR.
export async function generateMetadata(props: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  try {
    const page = await getPage(params.page);
    if (!page) {
      return { title: `${params.page} — Holo-Flow Studio` };
    }
    return {
      title: page.seo?.title || page.title,
      description: page.seo?.description || page.bodySummary,
      openGraph: {
        publishedTime: page.createdAt,
        modifiedTime: page.updatedAt,
        type: "article",
      },
    };
  } catch {
    return { title: `${params.page} — Holo-Flow Studio` };
  }
}

// SYNC parent. Without this, Next 15.6 canary + Turbopack + PPR
// returns 200 headers + zero body for the whole route while the
// Shopify fetch resolves (or, if Shopify is misconfigured, indefinitely).
// The visitor sees a friendly fallback while the body resolves.
export default function Page(props: {
  params: Promise<{ page: string }>;
}) {
  return (
    <Suspense fallback={<ShopifyPageFallback />}>
      <ShopifyPageBody params={props.params} />
    </Suspense>
  );
}

async function ShopifyPageBody({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const resolved = await params;
  // If Shopify is slow or unreachable, shopifyFetch will timeout/throw
  // at 4s. Treat the throw the same as a missing page so the response
  // resolves to a 404 instead of a hung 200.
  let page: Awaited<ReturnType<typeof getPage>> | null = null;
  try {
    page = await getPage(resolved.page);
  } catch {
    page = null;
  }

  if (!page) notFound();

  return (
    <>
      <h1 className="mb-8 text-5xl font-bold">{page.title}</h1>
      <Prose className="mb-8" html={page.body} />
      <p className="text-sm italic">
        {`This document was last updated on ${new Intl.DateTimeFormat(
          undefined,
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          },
        ).format(new Date(page.updatedAt))}.`}
      </p>
    </>
  );
}

function ShopifyPageFallback() {
  return (
    <div className="space-y-4">
      <div className="h-12 w-3/4 animate-pulse rounded-sm bg-warm-black-800" />
      <div className="h-4 w-full animate-pulse rounded-sm bg-warm-black-800" />
      <div className="h-4 w-5/6 animate-pulse rounded-sm bg-warm-black-800" />
      <div className="h-4 w-4/6 animate-pulse rounded-sm bg-warm-black-800" />
    </div>
  );
}

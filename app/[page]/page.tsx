import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Prose from "components/prose";
import { getPage, getPages } from "lib/shopify";

// Opt this route out of PPR — see app/articles/[slug] for the canary
// rationale.
export const experimental_ppr = false;

// Pre-list every Shopify-CMS page handle at build time. Unlisted
// paths 404 directly (dynamicParams = false) without entering the
// broken dynamic-render path that hangs on this canary. `getPages` is
// defensive: if Shopify is unconfigured or unreachable, it returns
// an empty list and the route 404s cleanly for everything until a
// real handle is published.
export const dynamicParams = false;
export async function generateStaticParams() {
  try {
    const pages = await getPages();
    return pages.map((page) => ({ page: page.handle }));
  } catch {
    return [];
  }
}

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

// SYNC parent + a real static frame outside the Suspense boundary.
// Empirically, pages whose parent rendered only `<Suspense>` (no
// static content before it) still hung at 200 + 0 bytes on production
// under Next 15.6 canary + Turbopack + PPR. Wrapping the Suspense in
// an <article> shell flushes that frame on first byte, then the body
// fills in.
export default function Page(props: {
  params: Promise<{ page: string }>;
}) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <Suspense fallback={<ShopifyPageFallback />}>
        <ShopifyPageBody params={props.params} />
      </Suspense>
    </article>
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

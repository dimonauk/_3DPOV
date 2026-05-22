import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Prose from "components/prose";
import { getPage } from "lib/shopify";

export async function generateMetadata(props: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = await getPage(params.page);

  if (!page) return notFound();

  return {
    title: page.seo?.title || page.title,
    description: page.seo?.description || page.bodySummary,
    openGraph: {
      publishedTime: page.createdAt,
      modifiedTime: page.updatedAt,
      type: "article",
    },
  };
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
  const page = await getPage(resolved.page);

  if (!page) return notFound();

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

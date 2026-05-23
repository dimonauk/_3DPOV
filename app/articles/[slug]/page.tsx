import Footer from "components/layout/footer";
import { HeroPlate } from "components/writing/hero-plate";
import { RelatedBlock } from "components/writing/related-block";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getArticle } from "lib/articles";
import { formatEntryDate } from "lib/writing";

// Opt this route out of PPR. Under Next 15.6 canary + Turbopack, PPR's
// static-shell caching interacts badly with notFound() inside an async
// Suspense child — the response hangs at 200 + 0 bytes instead of
// resolving to either the entry body or a 404. Same fix as /c/[slug]
// uses for the same symptom. Page is still rendered per-request
// (awaits params + getArticle); just not PPR-prerendered.
export const experimental_ppr = false;

// No `dynamic = "force-dynamic"` — the directive itself produces
// 200 + zero-body hangs in this toolchain. experimental_ppr=false
// alone is sufficient to make notFound() resolve correctly.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getArticle(slug);
  if (!entry) return { title: "Not found" };
  return {
    title: `${entry.title} — Articles`,
    description: entry.excerpt,
  };
}

// Sync parent so PPR can flush the shell + Suspense fallback before the
// params Promise resolves. Async parent + force-dynamic was the pattern
// producing 200 + zero-body hangs on the slug routes.
export default function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <>
      <Suspense fallback={<ArticleBodyFallback />}>
        <ArticleBody params={params} />
      </Suspense>
      <Footer />
    </>
  );
}

async function ArticleBody({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getArticle(slug);
  if (!entry) notFound();

  const Body = entry.Body;

  return (
    <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <Link
        href="/articles"
        className="chrome-label text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
      >
        &larr; Articles
      </Link>
      <div className="mt-10 chrome-label text-pink-200">
        {formatEntryDate(entry.date)}
      </div>
      <h1 className="mt-4 text-4xl md:text-5xl leading-[1.05] text-chrome-100">
        {entry.title}
      </h1>
      <HeroPlate image={entry.heroImage} title={entry.title} />
      <div className="mt-12 prose-gallery text-chrome-200">
        <Body />
      </div>
      <RelatedBlock
        related={entry.related}
        furtherReading={entry.furtherReading}
      />
    </article>
  );
}

function ArticleBodyFallback() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <div className="space-y-4">
        <div className="h-4 w-20 animate-pulse rounded-sm bg-warm-black-800" />
        <div className="h-12 w-full animate-pulse rounded-sm bg-warm-black-800" />
        <div className="h-64 w-full animate-pulse rounded-md bg-warm-black-800" />
        <div className="space-y-2 pt-6">
          <div className="h-4 w-full animate-pulse rounded-sm bg-warm-black-800" />
          <div className="h-4 w-5/6 animate-pulse rounded-sm bg-warm-black-800" />
          <div className="h-4 w-4/6 animate-pulse rounded-sm bg-warm-black-800" />
        </div>
      </div>
    </article>
  );
}

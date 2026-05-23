import Footer from "components/layout/footer";
import { MeshSceneProvider } from "components/type3d/MeshSceneProvider";
import { HeroPlate } from "components/writing/hero-plate";
import { RelatedBlock } from "components/writing/related-block";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getJournalEntry } from "lib/journal";
import { formatEntryDate } from "lib/writing";

// Render-on-request; see /articles/[slug] for the rationale.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getJournalEntry(slug);
  if (!entry) return { title: "Not found" };
  return {
    title: `${entry.title} — Journal`,
    description: entry.excerpt,
  };
}

// Sync parent — see app/articles/[slug]/page.tsx for the rationale.
// MeshSceneProvider wraps the Suspense boundary so the provider's
// context is available to the streamed-in body without re-mounting.
export default function JournalEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <>
      <MeshSceneProvider>
        <Suspense fallback={<JournalBodyFallback />}>
          <JournalBody params={params} />
        </Suspense>
      </MeshSceneProvider>
      <Footer />
    </>
  );
}

async function JournalBody({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getJournalEntry(slug);
  if (!entry) notFound();

  const Body = entry.Body;

  return (
    <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <Link
        href="/journal"
        className="chrome-label text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
      >
        &larr; Journal
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

function JournalBodyFallback() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <div className="space-y-4">
        <div className="h-4 w-20 animate-pulse rounded-sm bg-warm-black-800" />
        <div className="h-12 w-full animate-pulse rounded-sm bg-warm-black-800" />
        <div className="h-64 w-full animate-pulse rounded-md bg-warm-black-800" />
        <div className="space-y-2 pt-6">
          <div className="h-4 w-full animate-pulse rounded-sm bg-warm-black-800" />
          <div className="h-4 w-5/6 animate-pulse rounded-sm bg-warm-black-800" />
        </div>
      </div>
    </article>
  );
}

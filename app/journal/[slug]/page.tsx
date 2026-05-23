import Footer from "components/layout/footer";
import { MeshSceneProvider } from "components/type3d/MeshSceneProvider";
import { HeroPlate } from "components/writing/hero-plate";
import { RelatedBlock } from "components/writing/related-block";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getJournalEntry, journal } from "lib/journal";
import { formatEntryDate } from "lib/writing";

// Pre-list every slug at build time. See app/articles/[slug] for the
// canary rationale.
export function generateStaticParams() {
  return journal.map((entry) => ({ slug: entry.slug }));
}

// Opt this route out of PPR — see app/articles/[slug] for the
// rationale. notFound() inside an async Suspense child hangs at 0
// bytes under PPR; experimental_ppr=false makes it resolve cleanly.
export const experimental_ppr = false;

// No `dynamic = "force-dynamic"` — see app/articles/[slug].

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

// Sync parent renders the static frame outside Suspense so the shell
// streams immediately. See app/articles/[slug]/page.tsx for the
// rationale. MeshSceneProvider wraps the whole shell so the provider's
// context is available to the streamed-in body without re-mounting.
export default function JournalEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <>
      <MeshSceneProvider>
        <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
          <Link
            href="/journal"
            className="chrome-label text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
          >
            &larr; Journal
          </Link>
          <Suspense fallback={<JournalEntryFallback />}>
            <JournalEntry params={params} />
          </Suspense>
        </article>
      </MeshSceneProvider>
      <Footer />
    </>
  );
}

async function JournalEntry({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getJournalEntry(slug);
  if (!entry) notFound();

  const Body = entry.Body;

  return (
    <>
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
    </>
  );
}

function JournalEntryFallback() {
  return (
    <div className="space-y-4 pt-10">
      <div className="h-4 w-20 animate-pulse rounded-sm bg-warm-black-800" />
      <div className="h-12 w-full animate-pulse rounded-sm bg-warm-black-800" />
      <div className="h-64 w-full animate-pulse rounded-md bg-warm-black-800" />
      <div className="space-y-2 pt-6">
        <div className="h-4 w-full animate-pulse rounded-sm bg-warm-black-800" />
        <div className="h-4 w-5/6 animate-pulse rounded-sm bg-warm-black-800" />
      </div>
    </div>
  );
}

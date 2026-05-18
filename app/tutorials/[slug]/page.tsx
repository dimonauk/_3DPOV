import Footer from "components/layout/footer";
import { Instructable } from "components/tutorials/Instructable";
import { HeroPlate } from "components/writing/hero-plate";
import { RelatedBlock } from "components/writing/related-block";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTutorial, tutorials } from "lib/tutorials";
import { formatEntryDate } from "lib/writing";

export function generateStaticParams() {
  return tutorials.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getTutorial(slug);
  if (!entry) return { title: "Not found" };
  return {
    title: `${entry.title} — Tutorials`,
    description: entry.excerpt,
  };
}

export default async function TutorialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getTutorial(slug);
  if (!entry) notFound();

  const Body = entry.Body;

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <Link
          href="/tutorials"
          className="chrome-label text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
        >
          &larr; Tutorials
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
        {entry.instructable && <Instructable meta={entry.instructable} />}
        <RelatedBlock
          related={entry.related}
          furtherReading={entry.furtherReading}
        />
      </article>
      <Footer />
    </>
  );
}

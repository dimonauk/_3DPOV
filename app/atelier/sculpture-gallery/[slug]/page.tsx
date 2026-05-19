/**
 * app/atelier/sculpture-gallery/[slug]/page.tsx — Single-piece focused
 * view inside the sculpture gallery.
 *
 * The same WebXR scene as the index, restricted to a single catalogue
 * entry so the visitor stands across from one piece on its plinth.
 * Useful as a direct-link target from the catalogue cards, from
 * articles, and from the magazine index — every piece has its own
 * URL and its own opener.
 *
 * Resolves the slug against the catalogue at request time; 404s when
 * the slug is unknown. Generates static params for every seeded entry
 * so the route is statically optimised by default.
 *
 * Server component. The scene is a client component (it has to be —
 * R3F + WebXR live in the browser); the rest is plain markup.
 */
import Link from "next/link";
import { notFound } from "next/navigation";

import Footer from "components/layout/footer";
import { IssueBand } from "components/luxe/IssueBand";
import { SculptureCard } from "components/sculpture-gallery/SculptureCard";
import { SculptureGalleryScene } from "components/sculpture-gallery/SculptureGalleryScene";
import { CATALOGUE, findEntry } from "lib/sculpture-gallery/catalogue";

type PageParams = { slug: string };

export function generateStaticParams(): PageParams[] {
  return CATALOGUE.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug } = await params;
  const entry = findEntry(slug);
  if (!entry) {
    return { title: "Sculpture gallery — piece not found" };
  }
  return {
    title: `${entry.title} (${entry.year}) — sculpture gallery`,
    description: entry.blurb,
  };
}

export default async function SculptureGallerySinglePiecePage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug } = await params;
  const entry = findEntry(slug);
  if (!entry) {
    notFound();
  }

  // Scene shows only this piece. Reuse the same gallery scene with a
  // single-entry catalogue — the layout function will pick the
  // circle arrangement (1 ≤ 6), placing the piece on the +x axis;
  // we point the camera at it so the visitor lands facing the piece.
  const focusCamera = {
    position: [1.6, 1.6, 3.2] as [number, number, number],
    target: [1.6, 1.2, 0] as [number, number, number],
  };

  return (
    <>
      <article className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <IssueBand
          label="ATELIER"
          issue="WING 01"
          date={`${entry.year}`}
          publisher="HOLOFLOW STUDIO"
        />

        <nav className="mt-6 text-xs text-chrome-500">
          <Link
            href="/atelier/sculpture-gallery"
            className="hover:text-pink-200"
          >
            &larr; back to the wing
          </Link>
        </nav>

        <header className="mt-6 mb-10 flex flex-col gap-3">
          <div className="chrome-label">
            Atelier &middot; Sculpture gallery &middot; Piece
          </div>
          <h1 className="font-display text-5xl leading-[0.95] md:text-6xl">
            {entry.title}
          </h1>
          <div className="chrome-label flex items-center gap-3 text-chrome-300">
            <span
              aria-hidden
              className="inline-block h-2 w-8"
              style={{ background: entry.accent }}
            />
            <span>
              {entry.year}
              {entry.edition ? (
                <>
                  {" · "}edition {entry.edition.number} of {entry.edition.of}
                </>
              ) : (
                " · open edition"
              )}
            </span>
          </div>
          <p className="max-w-2xl text-lg text-chrome-200 italic">
            {entry.blurb}
          </p>
        </header>

        <section className="w-full">
          <SculptureGalleryScene
            catalogue={[entry]}
            initialCamera={focusCamera}
            height="72vh"
          />
        </section>

        <section className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-[2fr_1fr]">
          <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
            <h2 className="font-display text-2xl">From the bench</h2>
            <p className="mt-4 text-sm text-chrome-300">{entry.note}</p>
          </div>
          <div>
            <SculptureCard entry={entry} linked={false} />
          </div>
        </section>

        <section className="mt-16">
          <h2 className="chrome-label text-chrome-300">Elsewhere in the wing</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {CATALOGUE.filter((other) => other.slug !== entry.slug)
              .slice(0, 3)
              .map((other) => (
                <SculptureCard key={other.slug} entry={other} variant="inline" />
              ))}
          </div>
        </section>
      </article>
      <Footer />
    </>
  );
}

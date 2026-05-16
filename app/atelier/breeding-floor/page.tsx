/**
 * app/atelier/breeding-floor/page.tsx — Server shell for the breeding floor.
 *
 * Pairs with breeding-floor-client.tsx (the interactive grid). This
 * file only carries the metadata, the page heading, and the framing
 * prose; the client takes over below the fold.
 */

import Footer from "components/layout/footer";
import Link from "next/link";

import BreedingFloorClient from "./breeding-floor-client";

export const metadata = {
  title:
    "Breeding Floor — the evolution engine, in motion",
  description:
    "A small population of sculpture genomes, alive on a page. Twelve cards, a mutate button, a breed button, a generation counter, a lineage strip down the bottom. The same engine the studio runs on the bench, running here in the browser, on you.",
};

export default function BreedingFloorPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Breeding floor</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          The breeding floor.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          Twelve genomes sit on the floor below, one card each. They
          were spawned by a seeded random walk through the
          twenty-eight-gene alphabet the studio breeds with. Pick one
          you like &mdash; favourite it &mdash; and either jitter it on
          its own (<em>mutate</em>) or let it pair off with another
          favourite (<em>breed</em>). Each press advances the generation
          counter and lays the new population on top of the old.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          The thumbnails are placeholders &mdash; flat-coloured spheres
          tinted from each genome&rsquo;s own tint genes. The
          full splat-renderer will land in a later pass; what runs here
          is the breeding engine itself, taken straight off the bench
          and bound to a UI for the first time.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/atelier/evolution"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            atelier &middot; the fourteen-station evolution suite
          </Link>
          <Link
            href="/articles/how-the-studio-breeds-sculptures"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            article &middot; how the studio breeds sculptures
          </Link>
          <Link
            href="/atelier"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            &larr; back to the atelier
          </Link>
        </div>

        <div className="mt-12">
          <BreedingFloorClient />
        </div>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">What the controls do</div>
          <p className="mt-3">
            <strong className="text-chrome-100">Mutate selected.</strong>{" "}
            Every favourited genome is replaced by a jittered child of
            itself. Numeric genes get a small Gaussian nudge; about one
            in twenty re-rolls to a fresh value. The remaining slots
            stay as they were &mdash; nothing breeds, generation
            advances by one. Use when you want to explore the
            neighbourhood of a card you almost like.
          </p>
          <p className="mt-4">
            <strong className="text-chrome-100">Breed selected.</strong>{" "}
            Favoured genomes pair off as parents; unfavoured slots are
            replaced by children of the parent pool. Each child is a
            uniform crossover (per-gene blend) of two favourites,
            followed by a light mutation pass. Use when you have at
            least two cards you like and want a generation of mongrels.
          </p>
          <p className="mt-4">
            <strong className="text-chrome-100">Reset.</strong> Throw
            the floor away and start from a fresh seeded random walk.
            Lineage strip resets too.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

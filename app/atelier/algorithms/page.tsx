import Footer from "components/layout/footer";
import Link from "next/link";
import {
  algorithms,
  algorithmFamilies,
  type AlgorithmCatalogueEntry,
  type AlgorithmFamily,
} from "lib/assets/algorithms";
import { isPorted } from "lib/algorithms";

export const metadata = {
  title:
    "The algorithm cabinet — thirty generators behind the jewellery line",
  description:
    "Thirty named algorithms drive the studio's jewellery-array system: spiral, gyroid, L-system, Voronoi, Penrose, wing-venation, reaction-diffusion, and twenty-three more. Each lives in one of eight style kingdoms. Browse the cabinet — each card opens its own detail page.",
};

const FAMILY_ORDER: AlgorithmFamily[] = [
  "BIOMIMETIC",
  "GEOMETRIC",
  "CULTURAL-HISTORICAL",
  "WITCHCORE",
  "MECHANICAL-ORGANIC",
  "RETROFUTURIST",
  "SURREAL-SCALE",
  "MEMPHIS-CYBER",
];

function familyMeta(id: AlgorithmFamily) {
  return algorithmFamilies.find((f) => f.id === id);
}

function byFamily(family: AlgorithmFamily): AlgorithmCatalogueEntry[] {
  return algorithms.filter((a) => a.family === family);
}

export default function AlgorithmsIndexPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Algorithms</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          The cabinet, drawer by drawer.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          Thirty named drawers, eight rooms. Each drawer is one
          algorithm &mdash; a generator the studio addresses by name
          when a commission opens the cabinet. Some are pure
          mathematics (Gyroid, Penrose, Enneper), some are biology
          formalised (Wing Venation, Diatom Hex, Reaction-Diffusion),
          some are cultural inheritance (Celtic Knot, Mon, Step Fret),
          some are deliberate clash (Memphis-Cyber, Witchcore).
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          The full list is below, grouped by kingdom. Drawers marked
          with a small chrome dot are ported into the site as
          runnable TypeScript and have a live preview on their own
          page; the rest are catalogued, with the source-port queued
          for a follow-up pass.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/atelier"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            &larr; back to the atelier
          </Link>
          <Link
            href="/articles/the-jewellery-algorithms"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            article &mdash; the jewellery algorithms
          </Link>
          <Link
            href="/articles/the-eight-kingdoms"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            article &mdash; the eight kingdoms
          </Link>
        </div>

        {FAMILY_ORDER.map((family) => {
          const items = byFamily(family);
          if (items.length === 0) return null;
          const meta = familyMeta(family);
          return (
            <section
              key={family}
              id={family.toLowerCase()}
              className="mt-16 scroll-mt-24"
            >
              <div className="flex items-baseline gap-3">
                <span
                  className="inline-block h-3 w-3 rounded-full ring-1 ring-warm-black-700"
                  style={{ backgroundColor: meta?.colorSignal ?? "#888" }}
                  aria-hidden
                />
                <h2 className="text-2xl text-chrome-100">
                  {meta?.name ?? family}
                </h2>
                <span className="font-mono text-xs text-chrome-500">
                  {items.length}
                </span>
              </div>
              {meta?.dna ? (
                <p className="mt-2 max-w-prose text-sm text-chrome-400">
                  {meta.dna}
                </p>
              ) : null}
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((algo) => (
                  <Link
                    key={algo.slug}
                    href={`/atelier/algorithms/${algo.slug}`}
                    className="flex flex-col gap-2 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-4 hover:border-pink-200/40 hover:bg-warm-black-900/50"
                  >
                    <header className="flex items-baseline justify-between gap-3">
                      <h3 className="text-base text-chrome-100">
                        {algo.name}
                      </h3>
                      <span className="font-mono text-[0.65rem] text-chrome-500">
                        #{algo.id.toString().padStart(2, "0")}
                      </span>
                    </header>
                    <p className="text-sm text-chrome-300">{algo.notes}</p>
                    <div className="mt-1 flex items-center gap-2 text-[0.65rem] text-chrome-500">
                      {isPorted(algo.slug) ? (
                        <>
                          <span
                            className="inline-block h-1.5 w-1.5 rounded-full bg-pink-300"
                            aria-hidden
                          />
                          <span className="text-pink-200/80">
                            live preview
                          </span>
                        </>
                      ) : (
                        <>
                          <span
                            className="inline-block h-1.5 w-1.5 rounded-full bg-chrome-700"
                            aria-hidden
                          />
                          <span>source port pending</span>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        <section className="mt-24 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
          <div className="chrome-label">Across the studio</div>
          <p className="mt-3 text-chrome-300">
            For the breeding engine that strings these algorithms
            together into named lineages, see{" "}
            <Link
              href="/atelier/evolution"
              className="text-pink-200 underline underline-offset-4"
            >
              the evolution suite
            </Link>
            . For the commission line that opens these drawers, see{" "}
            <Link
              href="/articles/the-jewellery-algorithms"
              className="text-pink-200 underline underline-offset-4"
            >
              the jewellery-algorithms article
            </Link>
            . For the prose argument that names the eight kingdoms,
            see{" "}
            <Link
              href="/articles/the-eight-kingdoms"
              className="text-pink-200 underline underline-offset-4"
            >
              the eight kingdoms
            </Link>
            .
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

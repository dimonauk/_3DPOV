/**
 * app/atelier/evolution-hub/page.tsx — Server shell for the interactive
 * lineage explorer. Generates a deterministic seed pedigree once on the
 * server and hands it to the client renderer below the intro prose.
 */

import Footer from "components/layout/footer";
import Link from "next/link";

import {
  pickEgo,
  sampleEvolutionPopulation,
} from "lib/evolution/sample-population";
import { createLogger } from "lib/log";

import EvolutionHubClient from "./evolution-hub-client";

const log = createLogger("atelier:evolution-hub");

const DEMO_SEED = 2026;

export const metadata = {
  title:
    "Evolution Hub — interactive lineage explorer",
  description:
    "A live ancestry fan for the studio's breeding engine. Concentric rings of ancestor wedges, kingdom-coloured, click-to-recentre, with a biography strip of every ancestor in the current fan. Deterministic seed pedigree across five generations.",
};

export default function EvolutionHubPage() {
  const population = sampleEvolutionPopulation(DEMO_SEED);
  const ego = pickEgo(population);
  log.info("evolution-hub:seed", {
    seed: DEMO_SEED,
    populationSize: population.length,
    egoId: ego.sequenceId,
  });

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Evolution hub</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          The lineage, on a fan.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          Every sculpture the studio breeds carries its ancestors in its
          gene vector. The fan below picks one descendant &mdash; the
          <em> ego</em> &mdash; and walks its pedigree outward in
          concentric rings. Two parents, four grandparents, eight
          great-grandparents, sixteen one-step-further. Each wedge is
          coloured by kingdom; arc width tracks ancestry contribution.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          Click any wedge to recentre on that ancestor. The breadcrumb
          above the chart traces your path; the biography strip below
          lists every ancestor in the current fan with its kingdom and
          generation. Mesh thumbnails are queued for a later pass.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/atelier/evolution"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            &larr; the fourteen-station architecture
          </Link>
          <Link
            href="/atelier/breeding-floor"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            atelier &middot; breeding floor
          </Link>
          <Link
            href="/articles/how-the-studio-breeds-sculptures"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            article &middot; how the studio breeds sculptures
          </Link>
        </div>

        <EvolutionHubClient
          population={population}
          rootEgoId={ego.sequenceId}
        />

        <section className="mt-24 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
          <div className="chrome-label">About the demo</div>
          <p className="mt-3 text-chrome-300">
            The lineage you&rsquo;re looking at is a deterministic seed
            pedigree &mdash; thirty-odd genomes across five generations,
            built from seed{" "}
            <span className="font-mono text-chrome-100">{DEMO_SEED}</span>{" "}
            so every visit reads the same chart. Live engine output and
            mesh thumbnails arrive in a later pass.
          </p>
          <p className="mt-3 text-chrome-300">
            Wedge arc width currently uses generation-decay weights
            (ring 1 = 0.5 per slot, ring 2 = 0.25 per slot, etc). The
            weight function is injectable so real mixture-genome
            contributions can replace it without touching the chart.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

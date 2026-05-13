import Footer from "components/layout/footer";
import Link from "next/link";
import EvolutionDemoClient from "./evolution-demo-client";

export const metadata = {
  title: "Evolution engine — typed loop, live in the browser",
  description:
    "The studio's typed evolution engine running end-to-end. A population of 24 genomes, tournament selection, uniform crossover, Gaussian mutation, stepped under user control. Best-fitness and average-fitness plotted per generation. Same seed in, same evolution out.",
};

export default function EvolutionDemoPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Demo &middot; the evolution engine</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Twenty-four genomes, breeding in your browser.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          The studio treats evolution as a substrate &mdash; everything
          genomic, everything breedable. This demo surfaces the typed
          engine at <span className="font-mono text-chrome-100">lib/evolution/</span>
          {" "}so you can watch it run. Twenty-four 28-gene individuals,
          tournament selection (k=3), uniform crossover, Gaussian
          mutation. The fitness function is a synthetic target: each
          gene is normalised to [0..1] and rewarded for proximity to
          the midpoint of its range. The population should crowd
          towards a population mean near 0.5 across all 28 genes.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          Step a single generation, run a batch of fifty, or reset
          with a new seed. The chart records best-fitness and
          average-fitness per generation. The bar row underneath
          shows the leading individual&rsquo;s normalised gene
          vector &mdash; twenty-eight values, the alphabet from{" "}
          <span className="font-mono text-chrome-100">GENE_NAMES</span>.
          Reproducibility is total: the same seed runs the same
          evolution, every time.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          The point isn&rsquo;t the synthetic target &mdash; the
          point is the loop. Population in, snapshot out. Plug a
          mesh-aware fitness function in and the same engine will
          breed sculpture. Plug a five-axis composite in and it
          will breed against printability, optics, complexity,
          coherence, novelty. The substrate is the same.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/capabilities"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            registry
          </Link>
          <Link
            href="/atelier/evolution"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            fourteen stations
          </Link>
          <Link
            href="/articles/how-the-studio-breeds-sculptures"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            how breeding works
          </Link>
        </div>

        <EvolutionDemoClient />

        <section className="mt-10 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">What the loop is doing</div>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>
              An initial population of twenty-four genomes is built
              from <span className="font-mono">seededRng(seed)</span>.
              Each carries the 28-gene alphabet from{" "}
              <span className="font-mono">GENE_NAMES</span>, every
              value uniform in [0..1].
            </li>
            <li>
              <span className="font-mono text-chrome-100">evolve()</span>
              {" "}runs a single generation: tournament selects
              elites, two parent picks per child run through uniform
              crossover, every child gets Gaussian mutation on one
              or two genes.
            </li>
            <li>
              <span className="font-mono text-chrome-100">snapshot()</span>
              {" "}records best and average fitness; the chart plots
              both pink-on-midnight. The bar row paints the leading
              individual.
            </li>
            <li>
              Same <span className="font-mono">seed</span> reruns
              the same evolution. The engine is pure.
            </li>
          </ol>
        </section>
      </article>
      <Footer />
    </>
  );
}

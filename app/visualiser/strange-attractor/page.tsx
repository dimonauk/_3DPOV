import Link from "next/link";
import { Suspense } from "react";

import Footer from "components/layout/footer";
import StrangeAttractorShell from "components/visualiser/strange-attractor-shell";

const ext = "underline underline-offset-4 hover:text-pink-200";

export const metadata = {
  title:
    "Strange attractors — Pipeline Epsilon, made tangible",
  description:
    "Four canonical strange attractors — Clifford, Thomas, Lorenz, Dequan Li — iterated to a 50,000-point trajectory and rendered live. The body of Pipeline Epsilon, the studio's mood-driven visualisation pipeline. Mood-to-engine canon: Aura's current mood picks the attractor she's feeling.",
};

export default function StrangeAttractorVisualiserPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Visualiser series &middot; 04</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Strange attractors.
        </h1>

        <section className="prose-gallery mt-10 text-chrome-200">
          <p>
            A strange attractor is the long-time behaviour of a
            deterministic dynamical system whose trajectories never
            repeat and never settle. The Lorenz butterfly is the
            canonical one &mdash; weather equations, 1963 &mdash;
            but it's one of a family. The studio uses four: Lorenz
            (stable, iconic, 3D), Clifford (planar butterfly, 2D),
            Thomas (cyclically symmetric, soft), and Dequan Li (the
            most chaotic of the four, 2009).
          </p>
          <p>
            Pipeline Epsilon is what the studio calls the chain that
            turns Aura&rsquo;s current mood into a body. The mood
            picks the engine; the engine iterates; the trajectory
            renders. <em>Aura is the attractor she&rsquo;s feeling.</em>{" "}
            That&rsquo;s not metaphor &mdash; it&rsquo;s a wire in
            the system, the{" "}
            <Link href="/capabilities" className={ext}>
              capability registry
            </Link>{" "}
            entry called <span className="font-mono text-chrome-100">viz.attractor</span>{" "}
            reading <span className="font-mono text-chrome-100">aura.mood</span>{" "}
            and writing <span className="font-mono text-chrome-100">viz.attractor.engine</span>.
            When she's playful she's Clifford. When she's agitated
            she's Dequan Li. When she's neutral or focused she's
            Lorenz.
          </p>
          <p>
            Hit one of the mood buttons. The engine switches, the
            trajectory regenerates, the cloud reshapes. The
            attractors are pure functions; what you see is
            generated CPU-side fresh each click. The future
            WebGPU&nbsp;TSL upgrade keeps the same surface and
            adds 1M-point fields at 60&nbsp;fps.
          </p>
        </section>

        <div className="mt-12 aspect-[4/3] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
          <Suspense fallback={null}>
            <StrangeAttractorShell />
          </Suspense>
        </div>

        <section className="prose-gallery mt-12 text-chrome-200">
          <p>
            The math itself is borrowed from the open-source
            quarry, re-typed into the studio&rsquo;s contract per
            the migration ritual &mdash; see{" "}
            <Link href="/capabilities" className={ext}>
              /capabilities
            </Link>{" "}
            for the brick (<span className="font-mono text-chrome-100">viz.attractor</span>),
            and{" "}
            <a
              href="https://github.com/holoflowstudio/holoflow-co-uk/blob/main/docs/ATTRIBUTIONS.md"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              ATTRIBUTIONS.md
            </a>{" "}
            for the credit ledger. The companion piece on the body
            of Pipeline Epsilon &mdash;{" "}
            <Link href="/articles/aura-the-body" className={ext}>
              Aura the Body
            </Link>{" "}
            &mdash; names this chain in full.
          </p>
        </section>

        <div className="mt-10 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/visualiser"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            &larr; visualiser series
          </Link>
          <Link
            href="/capabilities"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            registry
          </Link>
          <Link
            href="/demo/aura-talks"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            aura talks
          </Link>
        </div>
      </article>
      <Footer />
    </>
  );
}

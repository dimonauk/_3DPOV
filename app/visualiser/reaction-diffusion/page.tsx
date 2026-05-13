import Link from "next/link";
import { Suspense } from "react";

import Footer from "components/layout/footer";
import ReactionDiffusionShell from "components/visualiser/reaction-diffusion-shell";

const ext = "underline underline-offset-4 hover:text-pink-200";

export const metadata = {
  title:
    "Reaction-Diffusion — Gray-Scott chemistry, live in the browser",
  description:
    "The Gray-Scott reaction-diffusion equations simulated in real time on a 128×128 grid. Scrub F and k; watch the system march between solitons, spots, mitosis, leopard prints, and dissolved noise. The chemistry the jewellery atelier's algorithm catalogue lives next to.",
};

export default function ReactionDiffusionVisualiserPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Visualiser series &middot; 05</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Reaction-Diffusion.
        </h1>

        <section className="prose-gallery mt-10 text-chrome-200">
          <p>
            The Gray-Scott model is a pair of partial differential
            equations describing two chemicals reacting and diffusing on
            a plate. <span className="font-mono">u</span> feeds in;{" "}
            <span className="font-mono">v</span> grows by consuming{" "}
            <span className="font-mono">u</span>; both diffuse; both
            decay. The pair has been studied for forty years because
            small changes to two constants (<span className="font-mono">F</span>{" "}
            the feed rate, <span className="font-mono">k</span> the
            kill rate) march the system through an extraordinary range
            of pattern regimes &mdash; solitons, pulsating coral, spots,
            mitosis, leopard-prints, dissolved noise &mdash; without
            ever needing a random number.
          </p>
          <p>
            The studio uses this exact kernel as one of the thirty
            algorithms in the{" "}
            <Link href="/atelier/algorithms" className={ext}>
              atelier
            </Link>{" "}
            jewellery cabinet, lifted into a typed port at{" "}
            <span className="font-mono">lib/algorithms/reaction-diffusion.ts</span>{" "}
            that outputs the final{" "}
            <span className="font-mono">v</span>-field as a heightmap
            mesh. This page is the same kernel running live in a
            canvas, so you can <em>watch</em> the regimes happen rather
            than see only the final geometry. Pick a preset, or scrub
            <span className="font-mono"> F</span> and{" "}
            <span className="font-mono">k</span> yourself.
          </p>
        </section>

        <div className="mt-12 rounded-sm border border-warm-black-800 bg-warm-black-950 p-4">
          <Suspense fallback={null}>
            <ReactionDiffusionShell />
          </Suspense>
        </div>

        <section className="prose-gallery mt-12 text-chrome-200">
          <p>
            The visualiser runs at 60 fps on a 128×128 grid. Each frame
            takes two Gray-Scott update steps (a forward Euler
            integration with a five-point Laplacian) and paints the
            result via Canvas2D. The pink-on-midnight palette mirrors
            the studio&rsquo;s aesthetic; the actual field values are
            mapped to brightness, not hue.
          </p>
          <p>
            The companion article on the algorithm catalogue is{" "}
            <Link href="/articles/the-jewellery-algorithms" className={ext}>
              The Jewellery Algorithms
            </Link>
            ; the eight-kingdom framing for the catalogue is at{" "}
            <Link href="/articles/the-eight-kingdoms" className={ext}>
              The Eight Kingdoms
            </Link>
            .
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
            href="/atelier/algorithms/reaction-diffusion"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            the algorithm
          </Link>
        </div>
      </article>
      <Footer />
    </>
  );
}

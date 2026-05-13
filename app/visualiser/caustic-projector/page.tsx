import Link from "next/link";
import { Suspense } from "react";

import Footer from "components/layout/footer";
import CausticProjectorShell from "components/visualiser/caustic-projector-shell";

const ext = "underline underline-offset-4 hover:text-pink-200";

export const metadata = {
  title:
    "Caustic projector — Snell's Law turning a curved surface into a bright pattern",
  description:
    "Parallel rays of light shone through a curved refractive surface focus into a caustic pattern below — the same physics behind a swimming-pool floor and the studio's caustic discs. Live 2D simulation: scrub the surface curvature, watch the bright spots gather and disperse.",
};

export default function CausticProjectorVisualiserPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Visualiser series &middot; 06</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Caustic projector.
        </h1>

        <section className="prose-gallery mt-10 text-chrome-200">
          <p>
            A caustic is the bright pattern light makes when it
            refracts (or reflects) through a curved surface and
            focuses unevenly on whatever lies beneath. Pool floors
            in sunlight, the inside of a wine-glass cast onto a
            tablecloth, the chrome of a car catching the sun on the
            ceiling overhead &mdash; all caustics. The studio uses
            this same physics deliberately: a flat-sided acrylic
            disc with a precisely-curved top surface projects a
            target image as a focused caustic when held over a
            torch.
          </p>
          <p>
            This visualiser is the simplified 2D version. A bank of
            parallel rays falls onto a curved top surface; each ray
            refracts via Snell&rsquo;s Law (top medium is air
            n&thinsp;=&thinsp;1, bottom is resin n&thinsp;&asymp;&thinsp;1.5);
            the refracted rays hit a screen below; the count of
            rays landing per pixel <em>is</em> the caustic intensity.
            Scrub the surface amplitude and wavelength &mdash; watch
            bright bands and dark zones rearrange.
          </p>
          <p>
            The full inverse problem &mdash; <em>given a target
            caustic, what surface produces it?</em> &mdash; is the
            optimiser at{" "}
            <span className="font-mono text-chrome-100">
              python-services/caustic_optimizer.py
            </span>
            . That work lives behind the bench. This page is the
            forward direction: surface in, caustic out.
          </p>
        </section>

        <div className="mt-12 rounded-sm border border-warm-black-800 bg-warm-black-950 p-4">
          <Suspense fallback={null}>
            <CausticProjectorShell />
          </Suspense>
        </div>

        <section className="prose-gallery mt-12 text-chrome-200">
          <p>
            The companion article is{" "}
            <Link href="/articles/the-caustic-disc" className={ext}>
              The Caustic Disc
            </Link>{" "}
            &mdash; the studio&rsquo;s editioned proof-of-concept
            piece, where the inverse problem is the work and the
            visualiser is the explanation.
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
            href="/articles/the-caustic-disc"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            article
          </Link>
        </div>
      </article>
      <Footer />
    </>
  );
}

import Link from "next/link";
import { Suspense } from "react";

import Footer from "components/layout/footer";
import LabanVisualiserShell from "components/visualiser/laban-visualiser-shell";

const ext = "underline underline-offset-4 hover:text-pink-200";

export const metadata = {
  title:
    "Laban Effort dial &mdash; the four factors of human movement, made tangible",
  description:
    "An interactive Laban Effort visualiser: drag the four sliders &mdash; Space, Time, Weight, Flow &mdash; and watch the named Basic Efforts (Float, Wring, Punch, Dab, Press, Glide, Slash, Flick) emerge at the corners of the cube. The kinematic-extraction layer of the studio&rsquo;s choreography engine, made playable.",
};

export default function LabanDialVisualiserPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Visualiser series &middot; 03</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Laban Effort dial.
        </h1>

        <section className="prose-gallery mt-10 text-chrome-200">
          <p>
            Rudolf Laban spent the 1920s asking what the elements of human
            movement actually are. The answer he arrived at is four
            interlocking continua &mdash; Space (flexible &harr; direct),
            Time (sustained &harr; sudden), Weight (light &harr; strong),
            Flow (free &harr; bound) &mdash; and the observation that the
            corners of the resulting cube are the eight basic actions the
            body recognises: Float, Wring, Punch, Dab, Press, Glide,
            Slash, Flick. The studio uses the same four-axis decomposition
            as the kinematic-extraction layer of its choreography engine.
            A gesture comes in as a sequence of accelerometer readings; it
            comes out as a point inside this cube.
          </p>
          <p>
            The article version of this argument is{" "}
            <Link href="/articles/the-living-stage" className={ext}>
              The Living Stage
            </Link>{" "}
            &mdash; which is also where the gene-axes of the engine are
            named in full. The genetic counterpart, where Laban-Effort
            drift is one of the four morphing operations the breeding
            engine uses to interpolate between candidates, is{" "}
            <Link
              href="/articles/how-the-studio-breeds-sculptures"
              className={ext}
            >
              How the Studio Breeds Sculptures
            </Link>
            . Together those two pieces are the long-form. This page is
            the dial.
          </p>
          <p>
            Drag the sliders. Watch the pink point move inside the cube.
            When the point sits near one of the eight named corners,
            that corner&rsquo;s label lights up &mdash; the closest
            Basic Effort. When the point sits in the interior of the
            cube, the readout reads &ldquo;blend&rdquo;: this is the
            larger part of human movement, where real gestures actually
            live. The pink trail behind the point is conditioned by flow:
            bound flow shortens it; free flow lets it stretch.
          </p>
        </section>

        <div className="mt-12">
          <Suspense
            fallback={
              <div
                className="aspect-[4/3] w-full animate-pulse rounded-sm border border-warm-black-800"
                style={{ backgroundColor: "#0c0a12" }}
              />
            }
          >
            <LabanVisualiserShell />
          </Suspense>
        </div>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
          <div className="chrome-label text-pink-200">
            Where this matters in the studio
          </div>
          <p className="mt-3 text-chrome-300">
            Every captured gesture the studio holds &mdash; every spin on
            the cord, every drone trajectory, every motion-capture take
            &mdash; gets reduced to a path through this cube before it
            becomes anything else. The same four numbers feed the
            choreography genome, the song-structure mapper, and the
            evolution engine that breeds candidate gestures alongside
            candidate sculptures.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-chrome-300">
            <li>
              &mdash;{" "}
              <Link href="/articles/the-living-stage" className={ext}>
                The Living Stage
              </Link>{" "}
              &mdash; the long form. Laban as gesture vocabulary, Hall as
              spatial grammar, song structure as dramatic scaffold.
            </li>
            <li>
              &mdash;{" "}
              <Link
                href="/articles/how-the-studio-breeds-sculptures"
                className={ext}
              >
                How the Studio Breeds Sculptures
              </Link>{" "}
              &mdash; the same evolution engine, with Laban-Effort drift
              as one of four named morphing operations.
            </li>
            <li>
              &mdash;{" "}
              <Link href="/practice" className={ext}>
                Practice &mdash; the twelve-year arc
              </Link>{" "}
              &mdash; where the gesture vocabulary the engine learns from
              was built, on the cord, in advance of any of the maths.
            </li>
          </ul>
        </section>

        <section className="mt-12 text-xs leading-relaxed text-chrome-500">
          <p>
            The four-factor parameterisation is the standard Laban Movement
            Analysis taxonomy as refined across the twentieth century. The
            eight Basic Effort names at the corners of the cube are
            Laban&rsquo;s own. The maths is in{" "}
            <code className="font-mono">lib/visualiser/laban-math.ts</code>{" "}
            and is pure-function and testable.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

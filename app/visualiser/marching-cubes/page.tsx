import Link from "next/link";
import { Suspense } from "react";

import Footer from "components/layout/footer";
import MarchingCubesVisualiserShell from "components/visualiser/marching-cubes-visualiser-shell";

const ext = "underline underline-offset-4 hover:text-pink-200";

export const metadata = {
  title:
    "Marching cubes &mdash; step through the 256 cases, watch the surface emerge",
  description:
    "An interactive marching-cubes explainer: scrub the iso-value, step through individual cubes, watch the 0&ndash;255 case lookup pull triangles out of a scalar field. The algorithm that turns the studio&rsquo;s AI pipeline, breeding engine, and Loop output into printable mesh, made tangible.",
};

export default function MarchingCubesVisualiserPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Visualiser series &middot; 02</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Marching cubes.
        </h1>

        <section className="prose-gallery mt-10 text-chrome-200">
          <p>
            Every printable object the studio produces passes through this
            algorithm at least once. Marching cubes is the trick that
            turns a three-dimensional scalar field &mdash; a voxel grid
            full of numbers &mdash; into a triangle mesh sitting on the
            iso-surface where the numbers cross a chosen threshold. It is
            the 1987 paper that made volume rendering usable; it is what
            the in-browser pipeline in{" "}
            <Link
              href="/articles/nine-seconds-prompt-to-printable"
              className={ext}
            >
              Nine Seconds from Prompt to Printable
            </Link>{" "}
            runs as its load-bearing step; it is what the breeding engine
            in{" "}
            <Link
              href="/articles/how-the-studio-breeds-sculptures"
              className={ext}
            >
              How the Studio Breeds Sculptures
            </Link>{" "}
            calls inside its candidate-rendering loop; it is position
            four of{" "}
            <Link href="/the-loop" className={ext}>
              the Holoflow Loop
            </Link>
            , the moment a captured trail becomes a body that holds.
          </p>
          <p>
            The mechanism is small enough to fit on a postcard. Eight
            corners of a cube; each corner above or below the iso-value;
            eight booleans packed into a single 0&ndash;255 number; that
            number indexed into a 256-row table that says which edges
            the surface crosses and how the resulting points connect into
            triangles. Two hundred and fifty-six configurations reduce by
            symmetry to fifteen canonical cases; the algorithm itself is
            an O(1) lookup per cube, and a typical field has a few
            thousand cubes. The whole thing runs as a single tight inner
            loop with no branching.
          </p>
          <p>
            This page is that loop, slowed down. Pick a field: a centred
            sphere, the gyroid surface (the same{" "}
            <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
              sin(x)cos(y) + sin(y)cos(z) + sin(z)cos(x)
            </code>{" "}
            the studio&rsquo;s biomimetic waveguides are grown around),
            or a coherent noise field. Drag the iso-value and watch the
            surface contract or swell. Switch on step-mode and the scene
            highlights one cube; the eight corners light cyan (above iso)
            or pink (below iso); the case index appears in amber; the
            triangles that one cube contributes float in front of you,
            isolated. Step through the cubes with the arrow keys and the
            shape assembles itself piece by piece.
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
            <MarchingCubesVisualiserShell />
          </Suspense>
        </div>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
          <div className="chrome-label text-pink-200">
            Where this matters in the studio
          </div>
          <p className="mt-3 text-chrome-300">
            Marching cubes sits at the seam between the analytical and
            the manufactured. Anything the studio defines as a formula or
            a field &mdash; an SDF, a noise volume, a depth-lifted
            photograph, a gyroid lattice &mdash; comes out of the
            algorithm as a watertight, printable mesh. Three places on
            the site lean on it directly.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-chrome-300">
            <li>
              &mdash;{" "}
              <Link
                href="/articles/nine-seconds-prompt-to-printable"
                className={ext}
              >
                Nine Seconds from Prompt to Printable
              </Link>{" "}
              &mdash; the AI pipeline. SDXL &rarr; SAM2 mask &rarr;
              depth-lifted field &rarr; marching cubes &rarr; decimation
              &rarr; STL. Nine seconds.
            </li>
            <li>
              &mdash;{" "}
              <Link
                href="/articles/how-the-studio-breeds-sculptures"
                className={ext}
              >
                How the Studio Breeds Sculptures
              </Link>{" "}
              &mdash; the genetic algorithm. Every candidate in the
              twenty-five-per-generation population is a marched mesh
              evaluated for printability and aesthetic.
            </li>
            <li>
              &mdash;{" "}
              <Link href="/the-loop" className={ext}>
                The Holoflow Loop &mdash; position four, trail reified
              </Link>{" "}
              &mdash; where the captured photograph becomes the body
              that holds. Marching cubes is the bridge.
            </li>
          </ul>
        </section>

        <section className="mt-12 text-xs leading-relaxed text-chrome-500">
          <p>
            The 256-row triangulation table is the canonical
            Lorensen-Cline (SIGGRAPH 1987) / Bourke (1994) table,
            reproduced in TypeScript form. The explicit 256-row form was
            chosen over the 15-canonical-cases-plus-symmetry compression
            because the visualiser leans on the literal case-index
            readout. The maths is in{" "}
            <code className="font-mono">
              lib/visualiser/marching-cubes-math.ts
            </code>{" "}
            and is pure-function and testable.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

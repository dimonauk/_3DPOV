import Footer from "components/layout/footer";
import GraphStats from "components/sphere/graph-stats";
// The R3F canvas is client-only. The dynamic import + `ssr: false`
// lives in `sphere-scene-loader.tsx` because `next/dynamic` with
// `ssr: false` is not allowed in Server Components in the App
// Router (Next.js 15+). See that file for the full rationale.
import SphereScene from "components/sphere/sphere-scene-loader";
import { Suspense } from "react";

export const metadata = {
  title: "The sphere — the cross-reference graph",
  description:
    "Every page on the studio's site as a node, every cross-reference as an edge, laid out as a sphere. The most-connected pieces sit as central hubs; the structure underneath the catalogue is visible at once.",
};

export default function SpherePage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">The sphere</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          The cross-reference graph.
        </h1>

        <section className="prose-gallery mt-10 text-chrome-200">
          <p>
            The studio&rsquo;s site is a catalogue on first reading and
            something else underneath. Every article, journal entry,
            tutorial, loop position, stack section, play level, and
            top-level route is a node; every cross-reference between
            two of them is an edge. Read end-to-end the list is long.
            Drawn as a graph it is a single object &mdash; a sphere of
            pieces, linked under the surface.
          </p>
          <p>
            The layout below is a small inline spring-force simulation.
            Connected pieces attract; everything else repels; a soft
            sphere constraint keeps the whole thing bounded so the
            result reads as architecture rather than as a cloud. The
            pieces that get referenced from the most places sit larger
            and closer to the centre. The orphans, when there are any,
            float at the edge.
          </p>
          <p>
            Drag to rotate. Scroll to zoom. Hover a node to highlight
            its neighbours; click to follow the edge into the page
            itself. The stats underneath the canvas read the same graph
            as plain text &mdash; total nodes, total edges, the top
            five hubs, any pages that nothing yet points at.
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
            <SphereScene />
          </Suspense>
        </div>

        <GraphStats />

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
          <div className="chrome-label">Footnote</div>
          <p className="mt-3 text-chrome-300">
            The graph is built at module-load time from the registries
            under <span className="font-mono text-xs">/lib</span>. No
            crawler; no database; no separate index. The cross-reference
            structure is a property of the site&rsquo;s own source code,
            and the sphere is what that property looks like when you
            stand back far enough to see it.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

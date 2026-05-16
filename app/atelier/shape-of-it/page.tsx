import Footer from "components/layout/footer";
import Link from "next/link";

import { CHAMBERS } from "lib/shape-of-it/chambers";
import { THREADS } from "lib/shape-of-it/threads";
import { KNOW_NODES, LIFE_NODES, SYNTH_ARCS } from "lib/shape-of-it/labyrinth";

import ShapeOfItClient from "./shape-of-it-client";

export const metadata = {
  title: "The Shape of It — twelve years of poi, drawn as a sculpture",
  description:
    "The studio's working biography rendered as a WebGPU sculpture. Nine chambers stacked along a spine, six brush threads coiling round it, two labyrinths orbiting overhead, and a small crack at the place where the body broke. Drag to rotate. Watch the threads thread through the dark.",
};

export default function ShapeOfItPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier · The Shape of It</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          A working life,
          <br />
          drawn as a sculpture.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          The Princess insists on being introduced first. She would like
          you to know that what you are looking at is twelve years of
          studio practice arranged vertically, and that she has been
          quite generous about which bits she let in. Nine chambers
          stacked up the spine, each one a thing the studio actually
          went through; six threads of brushwork coiling around the
          spine because no working life is a single colour; two
          labyrinths orbiting above the mound, one for the things she
          read and one for the things that happened to her; eleven
          synthesis arcs stitched between them because the interesting
          work is what happens when the two halves agree.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          There is, if you look for it, a small crack at the level
          marked <em>The Break</em>. That is a real spinal injury and
          two years in bed, and the sculpture refuses to airbrush it.
          The threads dim across that height. The spine itself
          constricts. The crack is what the rest of the shape is
          built around &mdash; not in spite of, but in answer to. The
          studio is twelve years old; the answering is most of it.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/codex/marching-cubes"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            codex · marching cubes
          </Link>
          <Link
            href="/codex/gyroid-surfaces"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            codex · gyroid surfaces
          </Link>
          <Link
            href="/atelier/poi-sculptor"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            atelier · poi sculptor
          </Link>
          <Link
            href="/atelier/rig-simulator"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            atelier · rig simulator
          </Link>
        </div>

        <div className="mt-12">
          <ShapeOfItClient />
        </div>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">How to read the shape</div>
          <p className="mt-3">
            Vertical position is time, roughly. The Foundation sits at
            the bottom; the Convergence sits at the top; the rest of
            the chambers fall where they fall. Sphere size is roughly
            the weight the studio gives that period now &mdash; The
            Living Education (five years in London, learning the city
            with the eyes) is the largest chamber for a reason; The
            Break is the smallest because survival of it counts more
            than the duration of it. Colour is a mood rather than a
            spec.
          </p>
          <p className="mt-4">
            The threads &mdash; {THREADS.map((t) => t.name.toLowerCase()).join(", ")}{" "}
            &mdash; are six different ways of working that the studio
            has used and is still using. Each one has its own coil rate,
            its own radial fraction (how far out from the spine it sits),
            its own behaviour through The Break: some go dark and
            rekindle, some carry right through. They are not metaphors
            for anything in particular. They are the working palette.
          </p>
          <p className="mt-4">
            The two orbiting rings are an admission that no single
            studio practice fits in one ring. The knowledge labyrinth
            ({KNOW_NODES.length} nodes) is what the studio has read,
            taught itself, queued for the next attempt &mdash; waveguide
            optics, the Monge-Amp&egrave;re equation, Murray&rsquo;s
            radius law, all of it. The life labyrinth ({LIFE_NODES.length} nodes)
            is what the body actually did &mdash; a psychology degree
            at Hull, five years in London, a spinal break, two years in
            bed, a piece of sellotape and a VR controller that
            accidentally invented the work. The {SYNTH_ARCS.length} synthesis
            arcs threading between the two rings are the moments the
            studio went, oh &mdash; <em>this</em> reads <em>that</em>.
            Those are the moments worth keeping.
          </p>
          <p className="mt-4">
            The crown above the spine is a small bright point called The
            Now. The Princess regrets that it is the smallest object in
            the whole composition, because she would prefer a parade.
            The Now does, however, get to be at the top, which she
            concedes is fair enough.
          </p>
        </section>

        <section className="mt-12 rounded-sm border border-warm-black-800 bg-warm-black-900/20 p-8 text-xs text-chrome-400">
          <div className="chrome-label">What this is, technically</div>
          <p className="mt-3">
            WebGPU + Three.js TSL. Every emissive surface in the scene
            is a node material driven by fractal noise and a shared time
            uniform; nothing is a static texture. The spine is a
            variable-radius Catmull-Rom tube. Each chamber is a knotted
            sphere with a transmissive cast material on top of a
            wireframe glow shell. Each thread is a 500-segment spiral
            sleeved in two additive glow tubes and a per-thread spark
            cloud whose position attributes update every frame. The
            labyrinths&rsquo; nodes hover on independent sine offsets;
            the rings counter-rotate. The piece runs on a single
            persistent time uniform &mdash; the entire animation budget
            is one number, ticked up by dt every frame.
          </p>
          <p className="mt-3">
            Ported from the studio&rsquo;s prototype workshop into
            the public site so the working file isn&rsquo;t the only
            place it gets to live. If your browser refuses WebGPU, the
            sculpture sits this dance out; the index below still tells
            you what would have been there.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

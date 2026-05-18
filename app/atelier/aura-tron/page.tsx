import Footer from "components/layout/footer";
import Link from "next/link";

import AuraTronClient from "./aura-tron-client";

export const metadata = {
  title: "Aura-Tron — vertex-shader landscape, mood-tinted sky",
  description:
    "A generative-visual study from Holo-Flow Studio. One unindexed mesh, five sine terms in a vertex shader, a wire-pulse uniform travelling along every edge, and a mood prop that washes the grid in calm, alert, warm, or cold. Synthwave-on-grey, mid-grade GPU, lights at the horizon.",
};

export default function AuraTronPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier · Aura-Tron</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          A horizon
          <br />
          drawn by a sine wave.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          The Princess likes to keep the mathematics visible at the back of
          things. Here&rsquo;s a Tron-style landscape that doesn&rsquo;t
          actually exist: a flat grid of forty-eight by sixty-four index
          pairs, handed to the GPU once, then folded into hills and valleys
          every frame by five sine terms running on the vertex shader. The
          CPU writes two floats a frame &mdash; a time, and a slower time.
          That&rsquo;s the whole animation budget.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          The bright dots travelling along the wires are an illusion the
          Princess is rather pleased with. Each edge in the grid has a baked
          seed and a 0-to-1 parameter at its endpoints; the shader runs a
          tight gaussian on the difference between that parameter and a
          moving pulse position, and the rasteriser fills in the rest.
          Nothing moves through space &mdash; the brightness merely walks
          along the wire while everything stands quite still. The particles
          orbiting the grid are the same trick, parameterised the other way.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/codex/synthwave-grids"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            codex &middot; synthwave grids
          </Link>
          <Link
            href="/codex/vertex-shaders"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            codex &middot; vertex shaders
          </Link>
          <Link
            href="/atelier/poi-sculptor"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            atelier &middot; poi sculptor
          </Link>
        </div>

        <div className="mt-12">
          <AuraTronClient />
        </div>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">What the mood prop actually does</div>
          <p className="mt-3">
            Mood is not a story here. It&rsquo;s a tint and a horizon palette.
            The vertex shader for the wires takes a <code className="font-mono text-chrome-200">uTint</code>{" "}
            vec3 and a <code className="font-mono text-chrome-200">uTintAmount</code>{" "}
            float and mixes the baked-in lilac/blush/mint bands toward
            whatever the React prop currently is &mdash; warm orange, alert
            magenta, calm indigo, cold mint. The background canvas behind the
            scene reads the same palette and paints its horizon gradient and
            aurora blooms to match. Two uniforms, one palette table, no
            characters consulted.
          </p>
          <p className="mt-4">
            The Princess removed everything the original scene had picked up
            on its way through the Academy: the offscreen-canvas worker, the
            VRM bones, the DollyOS mood vocabulary, six modules of HUD
            decoration. What&rsquo;s left is the bare arithmetic of the
            landscape and a colour register attached to it &mdash; which, as
            it turns out, is most of what made the original look the way it
            did.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

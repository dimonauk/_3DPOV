import Footer from "components/layout/footer";
import Link from "next/link";

import PoiSculptorClient from "./poi-sculptor-client";

export const metadata = {
  title: "Poi sculptor — twelve years of practice as printable solid",
  description:
    "Twenty-one parametric poi-flow moves rendered as GPU-driven 3D sculpture in the browser. Pick a move, pick a surface, drive the hands along an anchor path, export STL or GLB for the print bureau. The studio's twelve-year poi practice, available as a printable solid.",
};

export default function PoiSculptorPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier · Poi sculptor</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          The poi move,
          <br />
          as printable solid.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          Twelve years of poi practice precomputed as twenty-one
          parametric flow moves &mdash; butterflies, weaves, antispin
          flowers, isolations, lissajous knots &mdash; each rendered as
          a pair of hand trails through space. Pick a move, pick a
          surface, drive the hands along an anchor path, and the GPU
          draws the move as a continuous tube. The result is a 3D
          object that holds twelve years of muscle memory at one
          instant of itself.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          Every move is parametric: t runs from 0 to 8π and the
          two-handed positions fall out of sines, cosines, and the
          shapes the body learned. The sculpture you see is not a
          recording of any particular spin &mdash; it&rsquo;s the
          mathematics of the move itself, made visible. Three hundred
          thousand compute-shader particles orbit the trail and reset
          toward the hand centres. Export STL or GLB, send it through
          the print bureau on the next panel.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/codex/poi"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            codex · poi
          </Link>
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
            codex · printable surfaces
          </Link>
        </div>

        <div className="mt-12">
          <PoiSculptorClient />
        </div>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">What the move actually is</div>
          <p className="mt-3">
            A poi move is a function of time over two hands. The
            butterfly is two opposing circles offset by π. A 3-beat
            weave is a translating sinusoid the body wraps around
            itself three times per revolution. An antispin flower is
            two angular velocities &mdash; the head spinning one way,
            the hand orbiting the other, the petal count is the
            difference. Each generator in this demo is the parametric
            equation the body learned through repetition.
          </p>
          <p className="mt-4">
            The trail you see is the same data the studio&rsquo;s POV
            rig writes into a long-exposure photograph &mdash; a
            two-hand event cloud in space and time. The rig{" "}
            <Link href="/atelier/rig-simulator" className="text-pink-200 underline underline-offset-4">draws it with light</Link>;
            this demo draws it as printable mass. Same maths, two
            outputs, both editioned.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

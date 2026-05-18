import Footer from "components/layout/footer";
import Link from "next/link";

import ProceduralCityClient from "./procedural-city-client";

export const metadata = {
  title:
    "Procedural city — a Neo-London grown from a seed",
  description:
    "A toy city builder. Pick a morphology, drag a slider, re-roll the seed; a fresh skyline falls out of the grid in a single draw. The studio's chrono-protocol playground at table-top scale, instanced and inspectable.",
};

export default function ProceduralCityPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier · Procedural city</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          A small Neo-London,
          <br />
          grown from a seed.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          The Princess will tell you that cities are not designed so
          much as <em>negotiated</em> &mdash; with terrain, with budget,
          with the people who have to live in them and the rats who
          have to live under them. None of that is happening here.
          What&rsquo;s happening here is a grid, a seed, and a handful
          of probability thresholds, conspiring to produce something
          that looks like an opinion about urban form.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          Three morphologies are offered. <em>Downtown</em> is dense,
          office-heavy, and unkind to the trees. <em>Suburb</em> is the
          opposite: wider blocks, more parks, almost no commercial,
          which the Princess maintains is a sort of slow violence in
          itself. <em>Manhattan</em> is a regular avenue grid that
          mostly wants to be an office. Drag the size slider; the
          skyline regenerates in one instanced draw call. Re-roll the
          seed; you get a different Tuesday. The cars are doing nothing
          useful and never were.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/codex/chrono-protocol"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            codex · chrono-protocol
          </Link>
          <Link
            href="/codex/neo-london"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            codex · Neo-London
          </Link>
          <Link
            href="/codex/instanced-meshes"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            codex · instanced meshes
          </Link>
        </div>

        <div className="mt-12">
          <ProceduralCityClient />
        </div>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">Why a city, on a long-exposure-light site</div>
          <p className="mt-3">
            The studio&rsquo;s photographs are mostly one body, moving,
            in the dark. This page is the other end of the same axis:
            a thousand small bodies, immobile, in the daylight.
            Procedural urbanism is the warm-up for the chrono-protocol
            playground &mdash; a future Neo-London the studio walks
            through with the POV rig in hand, lighting it up
            block-by-block from inside.
          </p>
          <p className="mt-4">
            The maths is humble. A deterministic PRNG (mulberry32) seeds
            three thresholds; road cells fall first, then parks, then
            commercial-or-office, then residential as the remainder.
            Each building&rsquo;s height is another draw from the same
            seed, so the skyline is reproducible: the same numbers in,
            the same Tuesday out. The Princess finds that comforting.
          </p>
          <p className="mt-4">
            What it is <em>not</em> is a simulation. The cars don&rsquo;t
            see each other, the offices don&rsquo;t cast lunch crowds,
            the parks don&rsquo;t attract anyone in particular. The point
            is to feel the dial &mdash; how a single threshold changes
            the silhouette of a place &mdash; and to keep that feeling
            handy for when the studio designs{" "}
            <Link
              href="/atelier/rig-simulator"
              className="text-pink-200 underline underline-offset-4"
            >
              the rig
            </Link>{" "}
            that will eventually walk one of these blocks at night.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

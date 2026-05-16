import Link from "next/link";

import Footer from "components/layout/footer";

import LightWeaverClient from "./light-weaver-client";

export const metadata = {
  title: "Light Weaver — luminous trails in 3D",
  description:
    "A live composer for woven light. Drive the head with the mouse, pick a shader and a tip, let the trail draw itself in space. The trail vocabulary the studio uses in poi, lifted out of the prop and into the browser.",
};

export default function LightWeaverPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Light Weaver</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Weaving with light,
          <br />
          live in the browser.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          A live light-trail composer. The mouse drives a luminous head;
          the head leaves a ribbon trail through 3D space. Pick a trail
          shader &mdash; flame, plasma, aurora, mycelium, ink &mdash;
          pick a tip geometry, drag the head, the weave draws itself.
          Twelve years of poi practice rendered as a draw tool, no prop
          required.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          The shader library is ported from the studio&rsquo;s bench
          app at{" "}
          <code className="font-mono text-chrome-200">
            apps/Light_Weiver/
          </code>
          . The chamber here is the focused composer surface &mdash;
          stripped of the game systems, kept honest to the trail. Pairs
          with{" "}
          <Link
            href="/atelier/lightpainting-forge"
            className="text-pink-200 underline underline-offset-4"
          >
            Lightpainting Forge
          </Link>{" "}
          (trails become printable mass) and{" "}
          <Link
            href="/atelier/poi-sculptor"
            className="text-pink-200 underline underline-offset-4"
          >
            Poi Sculptor
          </Link>{" "}
          (parametric poi moves as solid).
        </p>

        <div className="mt-12">
          <LightWeaverClient />
        </div>
      </article>
      <Footer />
    </>
  );
}

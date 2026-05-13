import Footer from "components/layout/footer";
import Link from "next/link";
import ParallaxShellsDemoClient from "./parallax-shells-demo-client";

export const metadata = {
  title: "Parallax shells — ten concentric layers, head-driven",
  description:
    "The 10-shell Russian-doll substrate demo. Move your mouse; the deeper shells drift less than the closer ones — classic multiplane parallax, but stacked. The v0.1 (CSS 3D) of what becomes the studio's WebGPU TSL world.",
};

export default function ParallaxShellsDemoPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Demo &middot; the world wrapper</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Ten shells, head-driven.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          The studio's world is a Russian doll &mdash; ten concentric
          layers, scaling from 100% (the outermost) down to 10% (the
          innermost), with a parallax offset per layer driven by where
          the user is looking. Shell 10 holds the workshop frame; shell
          9 is the condensed London caricature; shell 5 might be the
          Charming Academy; shell 1 is Aura&rsquo;s body. The user
          peers in.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          v0.1 is CSS 3D &mdash; pure <span className="font-mono">translate3d</span>{" "}
          + <span className="font-mono">scale</span> + <span className="font-mono">perspective</span>.
          The Wave D upgrade lifts the same prop surface to WebGPU TSL
          for fewer pixels and more depth.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/capabilities"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            registry
          </Link>
          <Link
            href="/demo/aura-talks"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            aura talks
          </Link>
          <Link
            href="/visualiser/strange-attractor"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            attractors
          </Link>
        </div>

        <div className="mt-12 aspect-[4/3] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
          <ParallaxShellsDemoClient />
        </div>

        <section className="mt-10 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">What you are looking at</div>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Each labelled box is one shell. Bigger boxes are closer
              shells (10 down to 6); smaller boxes are deeper (5 down
              to 1).
            </li>
            <li>
              Move your mouse around the viewport. The outer shells
              shift the most; the inner ones barely move &mdash; that
              difference is the parallax cue your brain reads as depth.
            </li>
            <li>
              The wiring uses three slices (<span className="font-mono">input</span>,{" "}
              <span className="font-mono">world</span>, plus the
              individual shells&rsquo; own content slices) + one
              capability (<span className="font-mono">input.headpose</span>) +
              two hooks (<span className="font-mono">useHeadPose</span>,{" "}
              <span className="font-mono">useParallaxFromHeadpose</span>).
              None of them import each other directly.
            </li>
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}

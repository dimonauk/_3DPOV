/**
 * app/atelier/scene-stage-demo/page.tsx — Showcase route for SceneStage.
 *
 * Server entry. Holds the magazine chrome (IssueBand, intro copy) +
 * delegates the canvas + WebXR-support pill to the client component.
 * Sits at /atelier/scene-stage-demo per the system layout — under the
 * atelier shell so RecentOutputsDrawer is available without ceremony.
 */

import Link from "next/link";

import Footer from "components/layout/footer";
import { IssueBand } from "components/luxe/IssueBand";

import SceneStageDemoClient from "./scene-stage-demo-client";

export const metadata = {
  title: "Scene-Stage demo — Holoflow Studio",
  description:
    "Four TSL presets, the ambient particle field, a WebXR session toggle, and a 2D monitor fallback — all in one scene.",
};

export default function SceneStageDemoPage() {
  return (
    <>
      <IssueBand
        label="ATELIER"
        issue="ISSUE 06"
        date="MAY 2026"
        publisher="SCENE-STAGE DEMO"
      />

      <article className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="chrome-label">Atelier &middot; Scene-Stage</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          One scene,
          <br />
          three doors in.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          The same four objects &mdash; a matte floor, a holographic
          foil rock, a polished chrome knot, a glass cube &mdash;
          rendered through the studio&rsquo;s WebGPU TSL stack first,
          WebGL 2 second, neither last. A 2D monitor is a view; a
          headset is another view; both must be good.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          The pills above the canvas are the view-mode controls. The
          GPU pill tells you which renderer landed. The track pill
          appears once a tracker resolves &mdash; webcam, Kinect,
          Ultraleap &mdash; and the camera will lerp to follow your
          head. The recentre button snaps it back. If your browser has
          a headset reachable, &ldquo;Enter VR&rdquo; opens an
          immersive session and the same scene composes into the
          headset&rsquo;s reference space; the controllers get
          thumbstick locomotion for free.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/atelier"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            &larr; atelier
          </Link>
          <Link
            href="/docs/scene-stage"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            doc &mdash; SCENE-STAGE.md
          </Link>
        </div>

        <div className="mt-12">
          <SceneStageDemoClient />
        </div>

        <section className="mt-12 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">What you are looking at</div>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <span className="text-chrome-100">Floor</span> &mdash;{" "}
              <span className="font-mono text-pink-200">matte</span>{" "}
              preset, a flat warm-black plate. The wrapper&rsquo;s
              backdrop is built from the same primitive on the inside
              of an icosahedron.
            </li>
            <li>
              <span className="text-chrome-100">Foil rock</span>{" "}
              &mdash; low-poly icosahedron with the{" "}
              <span className="font-mono text-pink-200">foil</span>{" "}
              TSL preset. A diagonal sine wave drives the highlight;
              reduced-motion freezes the spin and the wave both.
            </li>
            <li>
              <span className="text-chrome-100">Chrome knot</span>{" "}
              &mdash; torus knot under the{" "}
              <span className="font-mono text-pink-200">chrome</span>{" "}
              preset. Static. The pink point light off-axis is what
              you read as the highlight wrapping the geometry.
            </li>
            <li>
              <span className="text-chrome-100">Glass cube</span>{" "}
              &mdash; the{" "}
              <span className="font-mono text-pink-200">glass</span>{" "}
              preset is{" "}
              <span className="font-mono">MeshPhysicalMaterial</span>{" "}
              with transmission. Bobs gently under normal motion.
            </li>
            <li>
              The pink particle drift behind the scene is{" "}
              <span className="font-mono">AmbientField</span> in its
              pink palette. Toggle it off from the toolbar to confirm
              it pauses cleanly.
            </li>
          </ul>
        </section>

        <section className="mt-8 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">For the doc-curious</div>
          <p className="mt-3">
            Full architectural notes live in{" "}
            <code className="font-mono text-chrome-100">
              docs/SCENE-STAGE.md
            </code>{" "}
            &mdash; the dual-renderer pattern, the WebXR setup
            quirks, the tracking integration, how to wrap an existing
            R3F scene with{" "}
            <code className="font-mono text-chrome-100">
              &lt;SceneStage&gt;
            </code>{" "}
            without rewriting it.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

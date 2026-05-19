/**
 * app/atelier/audio-bus-demo/page.tsx — Showcase route for
 * `lib/game/audio-bus.ts`. Server entry; the client component owns
 * the bus + the demo controls.
 *
 * What this demonstrates: the spatial-audio bus rendering a short
 * generated tone at a random 3D position each click. No external
 * asset — the tone is synthesised in the browser the first time
 * the page loads and handed to the bus as a decoded AudioBuffer.
 * Headphone listeners get a believable left/right (and crude
 * front/back) image from the HRTF panning model.
 *
 * Sits alongside `/atelier/scene-stage-demo` and
 * `/atelier/material-library` as the framework's reference set.
 * Architectural notes for the whole framework live in
 * `docs/WEBXR-GAME-FRAMEWORK.md`.
 */

import Link from "next/link";

import Footer from "components/layout/footer";
import { IssueBand } from "components/luxe/IssueBand";

import AudioBusDemoClient from "./audio-bus-demo-client";

export const metadata = {
  title: "Audio bus demo — Holoflow Studio",
  description:
    "A spatial-audio demo for the WebXR Game Framework's audio bus. Click to fire a chime at a random 3D position; headphones recommended.",
};

export default function AudioBusDemoPage() {
  return (
    <>
      <IssueBand
        label="ATELIER"
        issue="ISSUE 06"
        date="MAY 2026"
        publisher="AUDIO-BUS DEMO"
      />

      <article className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="chrome-label">Atelier &middot; Audio-Bus</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          A chime
          <br />
          in space.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          The framework&rsquo;s spatial audio bus sits on top of Web
          Audio with HRTF panning. Every click below fires the same
          short tone at a random position in front of you; with
          headphones on, the L/R image moves with the position. No
          external asset &mdash; the tone is synthesised in the browser
          the first time you load the page.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          The bus is{" "}
          <code className="font-mono text-chrome-100">lib/game/audio-bus.ts</code>
          . It&rsquo;s framework-agnostic &mdash; no React, no R3F. The
          showcase here uses it from a small client component, but the
          same API works from a Web Worker, a Vitest test, or the
          eventual <em>holoflow-webxr-game</em> scaffolder.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/atelier"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            &larr; atelier
          </Link>
          <Link
            href="/docs/webxr-game-framework"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            doc &mdash; WEBXR-GAME-FRAMEWORK.md
          </Link>
        </div>

        <div className="mt-12">
          <AudioBusDemoClient />
        </div>

        <section className="mt-12 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">What this is showing</div>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <span className="text-chrome-100">Master volume</span>{" "}
              &mdash; the slider drives{" "}
              <code className="font-mono text-pink-200">
                bus.setMasterVolume()
              </code>
              . One gain node at the bus output, no per-sound gain
              juggling required.
            </li>
            <li>
              <span className="text-chrome-100">Position chips</span>{" "}
              &mdash; each click rolls a random{" "}
              <code className="font-mono">[x, y, z]</code> in front of
              the listener and passes it straight into{" "}
              <code className="font-mono">bus.play(id, &#123; position &#125;)</code>
              . The PannerNode renders HRTF where available, falls
              back to equal-power stereo otherwise.
            </li>
            <li>
              <span className="text-chrome-100">Listener pose</span>{" "}
              &mdash; the demo keeps the listener at origin looking
              down -Z, matching three.js. In a full scene the camera
              rig would call{" "}
              <code className="font-mono">bus.setListenerPose()</code>{" "}
              each frame with the head position + facing.
            </li>
            <li>
              <span className="text-chrome-100">Autoplay policy</span>{" "}
              &mdash; the bus lazily resumes the AudioContext on the
              first user gesture. The first click may be a beat slower
              than the rest while that handshake happens.
            </li>
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}

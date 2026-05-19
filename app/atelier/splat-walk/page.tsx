import Link from "next/link";

import Footer from "components/layout/footer";
import { SplatWalkScene } from "components/splat-walker/SplatWalkScene";

export const metadata = {
  title: "Splat walk — atelier",
  description:
    "Walk through a Gaussian-splat capture in WebXR (Quest, Vision Pro, Steam Frame) or inspect it on a 2D monitor. Bring your own .ply / .splat / .ksplat / .spz / .sog — the bytes stay on this device.",
};

export default function SplatWalkPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="chrome-label">Atelier · Splat walk</div>
        <h1 className="mt-4 text-4xl md:text-5xl leading-[1.05]">
          Splat walk.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          Step inside a Gaussian-splat capture. WebXR first — point a
          Quest or Vision Pro browser at this URL, hit{" "}
          <span className="font-mono text-pink-200">Enter VR</span>,
          and you&rsquo;ll be standing in the scene with controller
          teleport. On a 2D monitor it falls back to a drag-to-orbit
          inspector.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-chrome-300">
          Bytes stay on-device. We hand the splat to{" "}
          <a
            href="https://github.com/sparkjsdev/spark"
            className="text-pink-200 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Spark.js
          </a>{" "}
          through an object URL — no upload, no server proxy, no
          telemetry on the file you pick.
        </p>

        <section className="mt-10">
          <SplatWalkScene height="78vh" />
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-sm border border-warm-black-700 bg-warm-black-900/40 p-4">
            <div className="chrome-label">In a headset</div>
            <ul className="mt-3 space-y-2 text-sm text-chrome-300">
              <li>Tap <span className="font-mono text-pink-200">Enter VR</span> on the toolbar.</li>
              <li>
                Point the controller, press the trigger to teleport to
                the highlighted ground.
              </li>
              <li>
                Thumbstick for smooth walking + snap-turn (off when
                your OS asks for reduced motion).
              </li>
            </ul>
          </div>
          <div className="rounded-sm border border-warm-black-700 bg-warm-black-900/40 p-4">
            <div className="chrome-label">On a monitor</div>
            <ul className="mt-3 space-y-2 text-sm text-chrome-300">
              <li>Drag the canvas to orbit, wheel to zoom.</li>
              <li>
                If a webcam tracker is live the camera follows your
                head (see <Link href="/articles" className="text-pink-200 hover:underline">tracking notes</Link>).
              </li>
              <li>
                The <span className="font-mono text-pink-200">Recenter</span>{" "}
                pill snaps the camera back to its start pose.
              </li>
            </ul>
          </div>
        </section>

        <section className="mt-10 border-t border-warm-black-800 pt-8">
          <div className="chrome-label">Read first</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link
                href="/splats"
                className="text-pink-200 hover:underline"
              >
                All splats &rarr;
              </Link>
            </li>
            <li>
              <Link
                href="/articles/on-splat-licences"
                className="text-pink-200 hover:underline"
              >
                On splat licences &rarr;
              </Link>
            </li>
            <li>
              <Link
                href="/tutorials/from-360-to-splat"
                className="text-pink-200 hover:underline"
              >
                From 360 capture to splat &rarr;
              </Link>
            </li>
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}

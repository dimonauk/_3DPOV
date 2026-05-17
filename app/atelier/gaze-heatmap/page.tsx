/**
 * app/atelier/gaze-heatmap/page.tsx — chamber landing.
 *
 * Exercises input.gaze (sample buffer + dwell-zone clustering +
 * statistics) and viz.heatmap-equirect (render). Upload a recorded
 * gaze JSON, walk the timeline, switch between HEATMAP /
 * FOVEAL_VIEW / SCANPATH modes.
 *
 * Lifted from D:/.github/Shadrerapp GazeHeatmap app (Apache-2.0) per
 * docs/SHADRERAPP_MIGRATION.md as a minimum-viable chamber.
 */

import Footer from "components/layout/footer";
import Link from "next/link";

import GazeHeatmapClient from "./gaze-heatmap-client";

export const metadata = {
  title: "Gaze Heatmap — where the viewer actually looked",
  description:
    "An atelier chamber for replaying recorded gaze sessions on an equirectangular canvas. Three visualisation modes (heatmap, foveal mask, scanpath), live statistics, dwell-zone clustering. Useful for HoloWalk session review, WebXR scene tuning, and the question 'did they see it?'",
};

export default function GazeHeatmapPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier · Gaze Heatmap</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Where the viewer
          <br />
          actually looked.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          Drop a recorded gaze JSON — yaw + pitch + timestamp per sample
          — onto the canvas and watch the session as a heatmap, a
          foveal mask (what they did see, everything else darkened), or
          a scanpath trace. Three views of the same record, useful for
          the question every immersive piece eventually faces: did they
          look at the thing.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/capabilities"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            capabilities · the substrate
          </Link>
          <Link
            href="/holo-walk"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            holo-walk · where this gets used
          </Link>
          <Link
            href="/atelier/cctv-cross-reference"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            atelier · cctv cross-reference
          </Link>
        </div>

        <div className="mt-12">
          <GazeHeatmapClient />
        </div>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">What this chamber composes</div>
          <p className="mt-3">
            Two bricks click together here:{" "}
            <span className="font-mono text-chrome-200">input.gaze</span>{" "}
            holds the session buffer + statistics + dwell-zone
            clustering;{" "}
            <span className="font-mono text-chrome-200">
              viz.heatmap-equirect
            </span>{" "}
            walks samples to the 2D canvas in three modes. The
            algorithmic layer underneath is{" "}
            <span className="font-mono text-chrome-200">
              lib/algorithms/heatmap
            </span>{" "}
            (the gaussian accumulator), and the yaw/pitch → UV mapper is{" "}
            <span className="font-mono text-chrome-200">
              lib/math/spherical
            </span>
            . Each is browsable on the registry.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

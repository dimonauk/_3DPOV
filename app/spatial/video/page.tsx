import Footer from "components/layout/footer";
import Link from "next/link";
import SpatialVideoDemoClient from "./spatial-video-demo-client";

export const metadata = {
  title: "Spatial Video — 2D clip to stereo MP4, in the browser",
  description:
    "Drop a short video. The studio's pipeline runs Depth Anything V2 per frame in your browser, generates a stereo pair, and stitches a side-by-side MP4 for Quest 3 / Vision Pro playback. Premium SHARP→4D commission available on the studio's GPU for editioned-quality output.",
};

export default function SpatialVideoPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Spatial · video</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          A clip,
          <br />
          in stereo, in your phone.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          Drop a short video below. The studio&rsquo;s pipeline runs
          Depth Anything V2 per frame in your browser, generates a
          stereo pair, and stitches a side-by-side MP4 you can play on
          Quest 3 or Apple Vision Pro. Per-frame work happens entirely
          on your device &mdash; nothing leaves the page.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          Long clips are slow: per-frame depth inference takes a few
          hundred milliseconds even on capable hardware, so a 5-second
          clip processes in tens of seconds. Keep the input short for
          the free path, or commission the studio&rsquo;s 3080 Ti via
          the premium <span className="font-mono text-chrome-100">commerce.sharp-video-job</span>{" "}
          path for full-length editioned conversions (per-keyframe
          Apple SHARP + 4DGaussians temporal fit, a few minutes of
          bench time per piece).
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/spatial"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            ← still images
          </Link>
          <Link
            href="/holo-walk"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            holowalk
          </Link>
          <Link
            href="/capabilities"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            capabilities
          </Link>
        </div>

        <div className="mt-12">
          <SpatialVideoDemoClient />
        </div>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">How this works</div>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>
              The video file is decoded in-page via{" "}
              <span className="font-mono text-chrome-100">HTMLVideoElement</span>{" "}
              — frames are extracted by seeking + drawing to an offscreen
              canvas. To keep wall-clock reasonable, the pipeline
              downsamples to 12 fps regardless of the source clip&rsquo;s
              frame rate.
            </li>
            <li>
              <span className="font-mono text-chrome-100">viz.depth-estimation</span>{" "}
              runs Depth Anything V2 small on each sampled frame; the
              same model the still-image{" "}
              <Link href="/spatial" className="text-pink-200 underline underline-offset-4">
                /spatial
              </Link>{" "}
              route uses.
            </li>
            <li>
              <span className="font-mono text-chrome-100">viz.stereo-pair</span>{" "}
              applies the depth-weighted horizontal warp per frame to
              produce left/right eye images at the standard IPD baseline.
            </li>
            <li>
              <span className="font-mono text-chrome-100">viz.spatial-export</span>{" "}
              composites the per-frame stereo pairs into a side-by-side
              MP4 via Mediabunny + WebCodecs. Hardware-accelerated H.264
              on iOS Safari 26+ / Android Chrome.
            </li>
            <li>
              <span className="font-mono text-chrome-100">commerce.sharp-video-job</span>{" "}
              (when the studio service is reachable) submits the same
              input to the local 3080 Ti for a per-keyframe Apple SHARP +
              4DGaussians temporal-fit conversion — full-length, editioned
              quality, a few minutes of bench time per piece.
            </li>
          </ol>
          <p className="mt-4 text-chrome-400">
            Everything runs client-side except the SHARP-video
            commission. No upload, no tracking, no model on a stranger&rsquo;s
            server unless you ask for the premium path.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

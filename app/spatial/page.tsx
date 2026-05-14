import Footer from "components/layout/footer";
import Link from "next/link";
import SpatialDemoClient from "./spatial-demo-client";

export const metadata = {
  title:
    "Spatial — 2D to 3D in the browser, on your phone",
  description:
    "Drop a photo. The studio's pipeline estimates depth via Depth Anything V2 in your phone's browser, generates a stereo pair, and lets you place the result in AR Quick Look on iOS or download a side-by-side spatial photo for Vision Pro / Quest. Premium SHARP-quality conversion available on commission via the studio's GPU.",
};

export default function SpatialPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Spatial</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Any photograph,
          <br />
          in 3D, in your phone.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          Drop a photo below. The studio&rsquo;s pipeline estimates
          depth via Depth Anything V2 in your browser &mdash;
          WebGPU-accelerated on iPhone 15 Pro / Android Chrome 113+
          &mdash; generates a stereo pair, and lets you place the
          result in Apple AR Quick Look on iOS, or download a
          side-by-side spatial photo for Vision Pro and Meta Quest.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          The free in-browser path runs on your device and produces
          good results in seconds. For editioned-quality conversion,
          the studio also runs Apple&rsquo;s SHARP single-image
          Gaussian splat model on a dedicated GPU &mdash; same input
          photo, higher fidelity, a few minutes of bench time per
          piece. Available on request via the print bar.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/holo-walk"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            holowalk
          </Link>
          <Link
            href="/photographs"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            photographs
          </Link>
          <Link
            href="/capabilities"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            capabilities
          </Link>
          <Link
            href="/spatial/video"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            spatial video →
          </Link>
        </div>

        <div className="mt-12">
          <SpatialDemoClient />
        </div>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">How this works</div>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>
              <span className="font-mono text-chrome-100">
                viz.depth-estimation
              </span>{" "}
              runs <a
                href="https://huggingface.co/onnx-community/depth-anything-v2-small"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-200 underline underline-offset-4"
              >Depth Anything V2 small</a>{" "}
              (~50MB ONNX model) via Transformers.js. First run downloads
              the model; cached after.
            </li>
            <li>
              <span className="font-mono text-chrome-100">
                viz.stereo-pair
              </span>{" "}
              applies a depth-weighted horizontal warp to produce
              left/right eye images at the standard IPD baseline.
            </li>
            <li>
              <span className="font-mono text-chrome-100">
                viz.usdz-export
              </span>{" "}
              wraps the result in a USDZ file for iOS AR Quick Look,
              or{" "}
              <span className="font-mono text-chrome-100">
                viz.spatial-export
              </span>{" "}
              composites a side-by-side MP4 for Quest 3 / Vision Pro
              playback.
            </li>
            <li>
              <span className="font-mono text-chrome-100">
                commerce.sharp-job
              </span>{" "}
              (when available) submits the same input to the studio&rsquo;s
              local GPU for an Apple SHARP single-image Gaussian splat
              conversion &mdash; higher fidelity at the cost of a few
              minutes of bench time.
            </li>
          </ol>
          <p className="mt-4 text-chrome-400">
            Everything runs client-side except the SHARP commission.
            No upload, no tracking, no model on a stranger&rsquo;s
            server unless you ask for the premium path.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

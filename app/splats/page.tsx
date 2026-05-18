import Link from "next/link";

import Footer from "components/layout/footer";
import SplatViewer from "components/splats/SplatViewer";
import { allAssets } from "lib/assets/resolve";
import { formatAssetSize } from "lib/assets/resolve";

export const metadata = {
  title: "Splats — bring your own scan",
  description:
    "Gaussian splat viewer for the studio's venue + object captures. Browser-side rendering via Spark.js. Load a registry splat or pick your own .ply / .splat / .ksplat / .spz / .sog file from disk.",
};

// Splats live in the asset registry under `scan` (raw photogrammetry /
// splat output) with a splat-family format. Surface those whose
// format the Spark.js viewer can read.
const SPLAT_FORMATS = new Set(["ply", "splat", "ksplat", "spz", "sog"]);

export default function SplatsIndexPage() {
  const splats = allAssets().filter(
    (a) =>
      (a.kind === "scan" || a.kind === "mesh") &&
      SPLAT_FORMATS.has(a.format.toLowerCase()),
  );

  return (
    <>
      <article className="mx-auto max-w-4xl px-6 py-20 md:py-28">
        <div className="chrome-label">Simulation layer · Splats</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Splats.
        </h1>
        <p className="mt-8 max-w-2xl text-chrome-200">
          Gaussian-splat viewer for the studio&rsquo;s venue + object
          captures. Browser-side rendering via{" "}
          <a
            href="https://github.com/sparkjsdev/spark"
            className="text-pink-200 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Spark.js
          </a>
          {" "}— Three.js-based, WebGL2, no plugin, no upload.
        </p>
        <p className="mt-4 max-w-2xl text-sm text-chrome-300">
          Pick a registry capture below, or load your own
          {" "}<code className="text-pink-200">.ply</code> /
          {" "}<code className="text-pink-200">.splat</code> /
          {" "}<code className="text-pink-200">.ksplat</code> /
          {" "}<code className="text-pink-200">.spz</code> /
          {" "}<code className="text-pink-200">.sog</code> file
          directly into the viewer. Drag to rotate, wheel to zoom.
        </p>

        <section className="mt-12">
          <div className="chrome-label">Load your own</div>
          <div className="mt-4">
            <SplatViewer alt="Bring your own splat" height="60vh" />
          </div>
        </section>

        <section className="mt-16">
          <div className="chrome-label">From the registry</div>
          {splats.length === 0 ? (
            <p className="mt-4 text-sm text-chrome-400">
              No registry splats yet. As the studio publishes venue
              captures + object scans, they appear here.
            </p>
          ) : (
            <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {splats.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/splats/${s.id}`}
                    className="block rounded-sm border border-warm-black-700 bg-warm-black-900/30 px-4 py-3 transition-colors hover:border-pink-200"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-chrome-100">{s.name}</span>
                      <span className="chrome-label text-chrome-500">
                        .{s.format.toUpperCase()}
                      </span>
                    </div>
                    {s.bytes > 0 ? (
                      <div className="mt-1 text-xs text-chrome-400">
                        {formatAssetSize(s.bytes)}
                      </div>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-16 border-t border-warm-black-800 pt-10">
          <div className="chrome-label">House rules</div>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-chrome-300">
            <li>
              Your file stays in this tab. No upload, no server
              processing. The viewer reads the bytes via
              {" "}<code className="text-pink-200">URL.createObjectURL</code>
              {" "}and hands them to Spark.js client-side.
            </li>
            <li>
              The studio&rsquo;s own captures of public venues
              (foreshore, tunnels, the bench room) are licensed
              studio-proprietary unless marked otherwise.
              Research-only licences (e.g. SHARP / Apple AMLR) are
              flagged in the registry per{" "}
              <Link
                href="/articles/on-splat-licences"
                className="text-pink-200 hover:underline"
              >
                on splat licences
              </Link>
              .
            </li>
            <li>
              For large splats (&gt; 200 MB), expect a few seconds of
              parsing on first load. Spark caches geometry; subsequent
              orbits stay smooth.
            </li>
          </ul>
        </section>

        <section className="mt-12 border-t border-warm-black-800 pt-8">
          <div className="chrome-label">Read first</div>
          <ul className="mt-4 space-y-2 text-sm">
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
            <li>
              <Link
                href="/articles/from-picasso-forward"
                className="text-pink-200 hover:underline"
              >
                From Picasso forward &rarr;
              </Link>
            </li>
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}

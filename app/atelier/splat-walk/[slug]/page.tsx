import Link from "next/link";
import { notFound } from "next/navigation";

import Footer from "components/layout/footer";
import { SplatWalkScene } from "components/splat-walker/SplatWalkScene";
import {
  allAssets,
  formatAssetSize,
  getAsset,
} from "lib/assets/resolve";

const SPLAT_FORMATS = new Set(["ply", "splat", "ksplat", "spz", "sog"]);

export async function generateStaticParams() {
  return allAssets()
    .filter(
      (a) =>
        (a.kind === "scan" || a.kind === "mesh") &&
        SPLAT_FORMATS.has(a.format.toLowerCase()),
    )
    .map((a) => ({ slug: a.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const asset = getAsset(slug);
  if (!asset) return { title: "Splat walk — not found" };
  return {
    title: `${asset.name} — splat walk`,
    description: `WebXR splat walker on the ${asset.name} capture (.${asset.format}${asset.bytes > 0 ? ", " + formatAssetSize(asset.bytes) : ""}). Bytes stay on-device.`,
  };
}

export default async function SplatWalkBySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const asset = getAsset(slug);
  if (!asset) notFound();
  if (!SPLAT_FORMATS.has(asset.format.toLowerCase())) notFound();

  // Google-drive splats route through the in-house proxy so the
  // browser sees same-origin bytes (otherwise Spark.js can't fetch
  // the binary without a CORS preflight failure).
  const viewerSrc =
    asset.host === "google-drive"
      ? `/api/assets/proxy/${encodeURIComponent(asset.id)}`
      : asset.url;

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="chrome-label">Atelier · Splat walk</div>
        <div className="mt-4 flex items-baseline justify-between gap-4">
          <h1 className="text-4xl md:text-5xl leading-[1.05]">
            {asset.name}
          </h1>
          <Link
            href="/atelier/splat-walk"
            className="chrome-label text-chrome-400 hover:text-pink-200"
          >
            &larr; Splat walk
          </Link>
        </div>
        <p className="mt-4 max-w-2xl text-sm text-chrome-300">
          WebXR-first walker. Enter VR on a Quest / Vision Pro browser
          to step inside, or orbit on a monitor. Bytes streamed from
          the registry; not re-hosted by the walker.
        </p>

        <section className="mt-8">
          <SplatWalkScene
            src={viewerSrc}
            height="78vh"
            label={asset.name}
          />
        </section>

        <section className="mt-8 grid grid-cols-2 gap-6 border-t border-warm-black-800 pt-6 text-sm sm:grid-cols-4">
          <div>
            <div className="chrome-label">Format</div>
            <div className="mt-1 text-chrome-200">.{asset.format}</div>
          </div>
          <div>
            <div className="chrome-label">Size</div>
            <div className="mt-1 text-chrome-200">
              {asset.bytes > 0 ? formatAssetSize(asset.bytes) : "—"}
            </div>
          </div>
          <div>
            <div className="chrome-label">Host</div>
            <div className="mt-1 text-chrome-200">{asset.host}</div>
          </div>
          <div>
            <div className="chrome-label">Licence</div>
            <div className="mt-1 text-chrome-200">
              {asset.licence ?? "studio-proprietary"}
            </div>
          </div>
        </section>

        <section className="mt-10 border-t border-warm-black-800 pt-8">
          <div className="chrome-label">Read first</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link
                href={`/splats/${asset.id}`}
                className="text-pink-200 hover:underline"
              >
                Inspect this splat (2D) &rarr;
              </Link>
            </li>
            <li>
              <Link
                href="/atelier/splat-walk"
                className="text-pink-200 hover:underline"
              >
                Bring your own splat &rarr;
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
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}

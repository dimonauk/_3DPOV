import Link from "next/link";
import { notFound } from "next/navigation";

import Footer from "components/layout/footer";
import SplatViewer from "components/splats/SplatViewer";
import {
  allAssets,
  formatAssetSize,
  getAsset,
} from "lib/assets/resolve";

export const dynamic = "force-dynamic";

const SPLAT_FORMATS = new Set(["ply", "splat", "ksplat", "spz", "sog"]);

export async function generateStaticParams() {
  return allAssets()
    .filter(
      (a) =>
        (a.kind === "scan" || a.kind === "mesh") &&
        SPLAT_FORMATS.has(a.format.toLowerCase()),
    )
    .map((a) => ({ id: a.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const asset = getAsset(id);
  if (!asset) return { title: "Splat — not found" };
  return {
    title: `${asset.name} — splat`,
    description: `Gaussian-splat capture: ${asset.name}. ${asset.bytes > 0 ? formatAssetSize(asset.bytes) + ", " : ""}.${asset.format} format.`,
  };
}

export default async function SplatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const asset = getAsset(id);
  if (!asset) notFound();
  if (!SPLAT_FORMATS.has(asset.format.toLowerCase())) notFound();

  // For google-drive splats route through the proxy so the browser
  // sees same-origin bytes.
  const viewerSrc =
    asset.host === "google-drive"
      ? `/api/assets/proxy/${encodeURIComponent(asset.id)}`
      : asset.url;

  return (
    <>
      <article className="mx-auto max-w-4xl px-6 py-12 md:py-16">
        <div className="chrome-label">Simulation layer · Splat</div>
        <div className="mt-4 flex items-baseline justify-between gap-4">
          <h1 className="text-4xl md:text-5xl leading-[1.05]">
            {asset.name}
          </h1>
          <Link
            href="/splats"
            className="chrome-label text-chrome-400 hover:text-pink-200"
          >
            &larr; All splats
          </Link>
        </div>

        <section className="mt-8">
          <SplatViewer
            src={viewerSrc}
            alt={asset.name}
            height="68vh"
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

        {asset.attribution ? (
          <p className="mt-6 text-sm text-chrome-300">
            Attribution: {asset.attribution}
          </p>
        ) : null}

        {asset.tags && asset.tags.length > 0 ? (
          <div className="mt-6">
            <div className="chrome-label">Tags</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {asset.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-warm-black-700 px-2 py-0.5 text-xs text-chrome-400"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ) : null}

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

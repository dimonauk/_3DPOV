/**
 * app/gallery/[id]/page.tsx — Detail surface for a single Google
 * Photos album. Uses <PhotosAlbumAsset> for the embed card; adds
 * licence chip, attribution string, related-tag links, and a link
 * back to /gallery.
 *
 * Source of truth: data/assets.json via lib/assets/resolve.ts.
 */

import Footer from "components/layout/footer";
import PhotosAlbumAsset from "components/three/PhotosAlbumAsset";
import Link from "next/link";
import { notFound } from "next/navigation";

import { allAssets, getAsset } from "lib/assets/resolve";
import type { Asset } from "lib/assets/types";

import { GALLERY_STYLES } from "../gallery/styles";

const ABSOLUTE_BASE = "https://holoflow.co.uk/gallery";

function albums(): Asset[] {
  return allAssets().filter((a) => a.host === "google-photos");
}

export function generateStaticParams() {
  return albums().map((a) => ({ id: a.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const asset = getAsset(id);
  if (!asset || asset.host !== "google-photos") {
    return { title: "Album not found" };
  }
  const desc = `Photo album from Holo-Flow Studio${
    asset.tags && asset.tags.length > 0 ? ` — ${asset.tags.join(", ")}` : ""
  }.`;
  const canonical = `${ABSOLUTE_BASE}/${asset.id}`;
  return {
    title: `${asset.name} — Gallery`,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title: `${asset.name} — Holo-Flow Studio`,
      description: desc,
      url: canonical,
      siteName: "Holo-Flow Studio",
      type: "article" as const,
      locale: "en_GB",
    },
    twitter: {
      card: "summary_large_image" as const,
      title: `${asset.name} — Holo-Flow Studio`,
      description: desc,
    },
  };
}

function licenceLabel(l?: Asset["licence"]): string {
  if (!l) return "Studio proprietary";
  switch (l) {
    case "studio-proprietary":
      return "Studio proprietary";
    case "cc0":
      return "CC0";
    case "cc-by":
      return "CC BY";
    case "cc-by-nc":
      return "CC BY-NC";
    case "cc-by-sa":
      return "CC BY-SA";
    case "cc-by-nc-sa":
      return "CC BY-NC-SA";
    case "apache-2.0":
      return "Apache 2.0";
    case "mit":
      return "MIT";
    case "research-only":
      return "Research only";
    default:
      return l;
  }
}

function buildJsonLd(a: Asset, url: string): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: a.name,
    url,
    sameAs: a.url,
    ...(a.publishedAt ? { datePublished: a.publishedAt } : {}),
    ...(a.attribution ? { creditText: a.attribution } : {}),
    ...(a.tags && a.tags.length > 0 ? { keywords: a.tags.join(", ") } : {}),
    isPartOf: {
      "@type": "CollectionPage",
      name: "Gallery — Holo-Flow Studio",
      url: ABSOLUTE_BASE,
    },
  });
}

export default async function GalleryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const asset = getAsset(id);
  if (!asset || asset.host !== "google-photos") notFound();

  const canonical = `${ABSOLUTE_BASE}/${asset.id}`;
  const jsonLd = buildJsonLd(asset, canonical);

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />

        <Link
          href="/gallery"
          className="chrome-label text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
        >
          &larr; Gallery
        </Link>

        <div className="mt-10 chrome-label text-pink-200">Photo album</div>
        <h1 className="mt-4 text-4xl md:text-5xl leading-[1.05] text-chrome-100">
          {asset.name}
        </h1>

        <div className="gal-detail-meta">
          <span className="gal-licence">{licenceLabel(asset.licence)}</span>
        </div>

        <div className="mt-8">
          <PhotosAlbumAsset
            id={asset.id}
            hint="Hosted on Google Photos. Opens in a new tab."
          />
        </div>

        {asset.attribution ? (
          <p className="gal-attribution">Credit: {asset.attribution}</p>
        ) : null}

        {asset.tags && asset.tags.length > 0 ? (
          <section className="gal-related">
            <div className="gal-related-label">Tags</div>
            <div className="gal-related-list">
              {asset.tags.map((tag) => (
                <span key={tag} className="gal-related-tag">
                  {tag}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <p className="mt-10 text-sm text-chrome-300">
          <Link
            href="/gallery"
            className="text-pink-200 underline underline-offset-4"
          >
            Back to the gallery index
          </Link>{" "}
          for the rest of the catalogue.
        </p>

        <style>{GALLERY_STYLES}</style>
      </article>
      <Footer />
    </>
  );
}

/**
 * app/gallery/page.tsx — Photo-gallery index. Lists every Google
 * Photos shared-album entry from the asset registry as a card grid,
 * sorted by publishedAt descending. Server component, statically
 * rendered.
 *
 * Source of truth: data/assets.json via lib/assets/resolve.ts.
 * Card body: a single GoldenLink for the album. Detail at
 * /gallery/[id] uses <PhotosAlbumAsset>.
 */

import Footer from "components/layout/footer";
import Link from "next/link";

import { allAssets } from "lib/assets/resolve";
import type { Asset } from "lib/assets/types";

import { GALLERY_STYLES } from "./gallery/styles";

const ABSOLUTE_URL = "https://holoflow.co.uk/gallery";

export const metadata = {
  title: "Gallery — photo archives",
  description:
    "Photo archives from Holo-Flow Studio. Shared albums of bench work, field nights, prints and rigs. The catalogue, kept tidy.",
  alternates: { canonical: ABSOLUTE_URL },
  openGraph: {
    title: "Gallery — Holo-Flow Studio",
    description:
      "Photo archives from the studio. Shared albums of bench work, field nights, prints and rigs.",
    url: ABSOLUTE_URL,
    siteName: "Holo-Flow Studio",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Gallery — Holo-Flow Studio",
    description:
      "Photo archives from the studio. Shared albums of bench work, field nights, prints and rigs.",
  },
};

function albumDateValue(a: Asset): number {
  if (!a.publishedAt) return 0;
  const t = Date.parse(a.publishedAt);
  return Number.isNaN(t) ? 0 : t;
}

function getAlbums(): Asset[] {
  return allAssets()
    .filter((a) => a.host === "google-photos")
    .slice()
    .sort((a, b) => albumDateValue(b) - albumDateValue(a));
}

function buildJsonLd(albums: Asset[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Gallery — Holo-Flow Studio",
    url: ABSOLUTE_URL,
    hasPart: albums.map((a) => ({
      "@type": "ImageGallery",
      name: a.name,
      url: `${ABSOLUTE_URL}/${a.id}`,
      ...(a.publishedAt ? { datePublished: a.publishedAt } : {}),
      ...(a.attribution ? { creditText: a.attribution } : {}),
    })),
  });
}

export default function GalleryIndexPage() {
  const albums = getAlbums();
  const jsonLd = buildJsonLd(albums);

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />

        <div className="chrome-label">Photo archives</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Gallery.
        </h1>
        <p className="mt-8 max-w-xl text-chrome-200">
          The studio&rsquo;s shared albums, kept on Google Photos so the
          files outlive any one deploy. Each card opens its album in a
          new tab. Single images get mirrored into pieces and journal
          entries; the wider archive lives here.
        </p>

        {albums.length === 0 ? (
          <div className="gal-empty">
            No albums published yet. Entries land in
            <code> data/assets.json</code> with{" "}
            <code>host: &quot;google-photos&quot;</code>, then show up
            here.
          </div>
        ) : (
          <ul className="gal-grid" role="list">
            {albums.map((album) => (
              <li key={album.id}>
                <Link
                  href={`/gallery/${album.id}`}
                  className="gal-card"
                  prefetch={false}
                >
                  <div className="gal-card-eyebrow">Photo album</div>
                  <div className="gal-card-name">{album.name}</div>
                  {album.tags && album.tags.length > 0 ? (
                    <div className="gal-tags">
                      {album.tags.slice(0, 5).map((tag) => (
                        <span key={tag} className="gal-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="gal-card-cta">Open album &rarr;</div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <style>{GALLERY_STYLES}</style>
      </article>
      <Footer />
    </>
  );
}

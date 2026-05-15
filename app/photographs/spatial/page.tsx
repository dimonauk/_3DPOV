import Footer from "components/layout/footer";
import Link from "next/link";

import PhotoToSpatial, {
  type PhotoChoice,
} from "components/photographs/photo-to-spatial";
import { getCollectionProducts } from "lib/shopify/cached";

export const metadata = {
  title: "Photographs — Spatial",
  description:
    "Pick any editioned photograph and watch the studio's in-browser pipeline turn it into a spatial photo: depth-estimated, stereo-warped, and wrapped as USDZ for Vision Pro and iOS AR Quick Look. Zero server-side compute; your machine does the work.",
};

// Live-fetched (Shopify) at request time; per-render cost only.
export const dynamic = "force-dynamic";

const COLLECTION_HANDLE = "photographs";

export default async function PhotographsSpatialPage() {
  const products = await getCollectionProducts({
    collection: COLLECTION_HANDLE,
  }).catch(() => []);

  const photos: PhotoChoice[] = products
    .map((p) => {
      const image = p.images[0];
      if (!image) return null;
      return {
        handle: p.handle,
        title: p.title,
        imageUrl: image.url,
      };
    })
    .filter((p): p is PhotoChoice => p !== null);

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Photographs · Spatial</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Light, lifted into space.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          The studio&rsquo;s editioned photographs are single long
          exposures &mdash; flat by definition. The studio&rsquo;s in-
          browser pipeline can lift each of them into space without
          touching the original. Pick a print below; your machine
          estimates depth, warps the picture into a left-eye + right-
          eye stereo pair, and wraps the result as a Vision-Pro-ready
          USDZ that opens straight into iOS AR Quick Look. The
          photograph stays the photograph; the spatial version is a
          gift on top.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Zero server compute. The depth model and the wrap are
          running in your browser. First photo will download the
          ~50&thinsp;MB depth model into your cache; every subsequent
          photo reuses it.
        </p>

        <div className="mt-12">
          {photos.length === 0 ? (
            <div className="rounded-md border border-warm-black-800 bg-warm-black-950 p-6 text-sm text-chrome-400">
              No photographs in the catalogue yet, or the Shopify
              connection isn&rsquo;t configured in this environment.
              Try{" "}
              <Link
                href="/photographs"
                className="text-pink-200 underline underline-offset-4"
              >
                the main gallery
              </Link>{" "}
              once prints land.
            </div>
          ) : (
            <PhotoToSpatial photos={photos} />
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 border-t border-warm-black-800 pt-10 text-sm text-chrome-300 md:grid-cols-3">
          <div>
            <div className="chrome-label mb-2">What you get</div>
            <p>
              A USDZ file ready for AR Quick Look on iPhone / iPad /
              Vision Pro, plus a side-by-side stereo JPEG for use in
              other viewers (Quest 3 browser, immersive video tools).
            </p>
          </div>
          <div>
            <div className="chrome-label mb-2">What this is not</div>
            <p>
              Not a substitute for the print. The flat photograph is
              the work; this is a sketch in space of the same scene.
              Edge artefacts (occlusion fill) appear at depth
              boundaries &mdash; that&rsquo;s the depth-warp showing
              its hand.
            </p>
          </div>
          <div>
            <div className="chrome-label mb-2">Stack</div>
            <p>
              Depth Anything V2 via{" "}
              <Link
                href="/codex/persistence-of-vision"
                className="text-pink-200 underline underline-offset-4"
              >
                Transformers.js
              </Link>
              ; depth-warp stereo + USDZ scene construction via
              three.js + the studio&rsquo;s{" "}
              <code className="rounded bg-warm-black-900 px-1.5 py-0.5 text-xs text-pink-200">
                viz.spatial-export
              </code>{" "}
              capability.
            </p>
          </div>
        </div>
      </article>
      <Footer />
    </>
  );
}

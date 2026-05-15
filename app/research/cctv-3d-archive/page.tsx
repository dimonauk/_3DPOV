import Footer from "components/layout/footer";
import { isFirebaseAdminConfigured } from "lib/firebase/admin";
import { mediaList } from "lib/capabilities/media/library";
import type { Media } from "lib/capabilities/media/library-types";

// splat-viewer-spark.tsx is `"use client"` so the framework hydrates it
// on the client. `dynamic({ssr:false})` would be redundant here and is
// forbidden in Server Components from Next.js 15 onwards.
import SplatViewerSpark from "components/viewers/splat-viewer-spark";

export const metadata = {
  title: "CCTV 3D Archive — Research",
  description:
    "An archive of public-CCTV stills across London, each one converted into a 3D Gaussian Splat via Apple SHARP on the studio's bench. Research-only by licence; published here as the studio's notebook, not as a catalogue.",
};

// Force per-request rendering — the page reads from Firestore live,
// and the Firebase Admin env isn't available at build time on Vercel's
// prerender pass, so any static-generation attempt would throw.
export const dynamic = "force-dynamic";

// Server component — reads from Firestore at request time.
export default async function CctvThreeDArchivePage() {
  // Defence-in-depth: even with `force-dynamic`, wrap the fetch so a
  // transient Firestore error or missing env in any environment falls
  // through to the empty state rather than 500-ing the whole page.
  let records: Media[] = [];
  if (isFirebaseAdminConfigured()) {
    try {
      records = (
        await mediaList({ kind: "ply", subject: "research", limit: 50 })
      ).items;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("cctv-3d-archive: mediaList failed", err);
    }
  }

  const splats = records.filter(
    (r) => r.sourceRef?.splat?.provider === "sharp-onnx",
  );

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Research · CCTV 3D Archive</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          The city, in splats.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          Public-CCTV stills across London &mdash; Battersea Power
          Station, Borough Market, Burlington Arcade, the Wellington
          Arch &mdash; each one lifted into three dimensions by Apple
          SHARP and published here as a Gaussian splat. A study of
          what a city looks like when it sees itself.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Apple SHARP&rsquo;s licence is research-only. The outputs
          live here, on the notebook surface, and never on the
          catalogue. The companion writing is in{" "}
          <a
            href="/articles/on-splat-licences"
            className="underline underline-offset-4 hover:text-pink-200"
          >
            On Splat Licences
          </a>
          .
        </p>

        {splats.length === 0 ? (
          <section className="mt-16 rounded-md border border-warm-black-800 bg-warm-black-950 px-6 py-10">
            <div className="chrome-label">Pending</div>
            <p className="mt-3 max-w-xl text-sm text-chrome-300">
              The bench has the splats; the public surface is wired and
              waiting for them to be uploaded. The first batch (twenty
              scenes from the May 2026 run) will appear here as the
              studio promotes them from the local archive to public
              storage.
            </p>
            <p className="mt-3 text-xs text-chrome-500">
              Each scene is roughly 1.18 million gaussians (~280 MB of
              standard 3DGS PLY); decisions about which scenes
              warrant the storage are being made one at a time.
            </p>
          </section>
        ) : (
          <section className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-2">
            {splats.map((splat) => {
              const splatMeta = splat.sourceRef?.splat;
              return (
                <article key={splat.id} className="flex flex-col gap-3">
                  <SplatViewerSpark
                    record={{
                      plyUrl: splat.url,
                      plyFlavour: splatMeta?.plyFlavour ?? "standard-3dgs",
                      gaussianCount: splatMeta?.gaussianCount ?? 0,
                    }}
                    aspect={16 / 10}
                    autoRotate
                  />
                  <header>
                    <h2 className="text-lg">
                      {splat.title ?? splat.location?.name ?? "Untitled scene"}
                    </h2>
                    {splat.location?.slug ? (
                      <div className="text-xs text-chrome-500">
                        {splat.location.slug}
                      </div>
                    ) : null}
                  </header>
                  {splat.description ? (
                    <p className="text-sm text-chrome-300">
                      {splat.description}
                    </p>
                  ) : null}
                  <footer className="text-xs text-chrome-500">
                    {splatMeta?.gaussianCount?.toLocaleString() ?? "?"}{" "}
                    gaussians · {Math.round((splat.sizeBytes ?? 0) / 1024 / 1024)}{" "}
                    MB · {splatMeta?.licence ?? "unknown licence"}
                  </footer>
                </article>
              );
            })}
          </section>
        )}
      </article>
      <Footer />
    </>
  );
}

import Footer from "components/layout/footer";

import LightpaintClient from "./lightpaint-client";

export const metadata = {
  title: "Lightpaint — Atelier",
  description:
    "Animated light-painting editor. Drop a folder of long-exposure photographs; the chamber plays them back as a stop-motion animation. Phase 1: import, timeline, scrub, play, MP4 export. Later phases add per-frame layered editing.",
};

export default function LightpaintPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Lightpaint</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Long exposures
          <br />
          become animation.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          Drop a folder of long-exposure light paintings and the chamber
          stitches them into a stop-motion animation. Scrub the timeline,
          adjust frame rate, loop the playback, export to MP4. Each
          frame hangs on the studio&rsquo;s silk display by default;
          equirectangulars get the sphere wrap instead.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Phase 1: import + timeline + scrub + play + MP4 export. The
          per-frame layer editor (masks, erasers, painted-on synthetic
          trails) is queued for phase 2 per
          docs/LIGHTPAINT-PLAN.md. Frames are ordered by EXIF
          DateTimeOriginal when present; filename order otherwise.
        </p>

        <div className="mt-12">
          <LightpaintClient />
        </div>
      </article>
      <Footer />
    </>
  );
}

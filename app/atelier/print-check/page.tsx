import Footer from "components/layout/footer";

import PrintCheckClient from "./print-check-client";

export const metadata = {
  title: "Print Check — Atelier",
  description:
    "Drop a photograph; the chamber tells you the largest print size it'll cleanly make on the studio's A2 fine-art pipeline (Canon imagePROGRAF PRO-1100). 360 equirectangulars are flagged for reframing.",
};

export default function PrintCheckPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Print Check</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          How big will this print
          <br />
          before it starts to fall apart?
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          A small chamber that decodes a single image and tells you the
          largest ISO-A print size that meets the 240 PPI floor on the
          studio&rsquo;s Canon imagePROGRAF PRO-1100. The 300 PPI
          recommended size is reported too. The studio uses this to
          filter web-downscaled copies on Drive scans &mdash; the
          chamber here is the same check, run on a single upload.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          360 equirectangular shots (Osmo 360, Insta360, GoPro Max) are
          detected via their XMP tag and routed for reframing &mdash;
          a 2:1 panorama doesn&rsquo;t print as-is, but a flat crop
          from it does.
        </p>

        <div className="mt-12">
          <PrintCheckClient />
        </div>
      </article>
      <Footer />
    </>
  );
}

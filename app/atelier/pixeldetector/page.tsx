import Footer from "components/layout/footer";

import PixeldetectorClient from "./pixeldetector-client";

export const metadata = {
  title: "Pixel Detector — Atelier",
  description:
    "Drop a piece of pixel art, get its native resolution. Useful when retro game art has been upscaled or smoothed by another tool and you want the original grid back.",
};

export default function PixeldetectorPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Pixel Detector</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          What size was this
          <br />
          before someone upscaled it?
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          Retro game art lives on a small grid &mdash; 16&times;16, 32&times;32,
          maybe 64&times;48. Drop a piece of pixel art here, even after
          another tool has resized or smoothed it, and the chamber walks the
          divisor ladder to find the native resolution. The answer comes
          back as JSON: native width, native height, the integer upscale
          factor, and a confidence number.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Backed by a Firebase Function running Pillow + numpy. The original
          Python tool lives at{" "}
          <code className="font-mono text-chrome-200">
            services/pixeldetector/
          </code>
          ; the chamber here is its public front. The image you upload
          isn&rsquo;t stored &mdash; the function returns the metadata and
          forgets. Ported from{" "}
          <code className="font-mono text-chrome-200">
            D:/The_Hangar/tools/pixeldetector/
          </code>
          .
        </p>

        <div className="mt-12">
          <PixeldetectorClient />
        </div>
      </article>
      <Footer />
    </>
  );
}

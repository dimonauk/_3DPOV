import Footer from "components/layout/footer";

import ImageToStlClient from "./image-to-stl-client";

export const metadata = {
  title: "Image to STL — Atelier",
  description:
    "Threshold an image into ink and paper, extrude the ink as a printable plate. The studio's contour-extrusion transform, ported to a Firebase Function so visitors can run it for free.",
};

export default function ImageToStlPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Image to STL</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          A photograph becomes
          <br />
          a sheet of cut-outs.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          Lithophane down the hall makes a photograph into a smooth
          embossed slab; this chamber takes the other route. Drop an
          image, the studio&rsquo;s bench transform thresholds it into
          black and white, finds the outlines of every dark region,
          and extrudes them as a flat printable plate. Print it,
          backlight it &mdash; the picture appears in the cut-outs.
          Best for filament-style line art, logos, stencil portraits,
          and any image with crisp edges you want as physical geometry.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Backed by a Firebase Function running OpenCV + numpy +
          numpy-stl. The original Python tool lives at{" "}
          <code className="font-mono text-chrome-200">
            services/image-to-stl/
          </code>
          ; the chamber here is its public front. The image you upload
          isn&rsquo;t stored &mdash; the function returns the STL and
          forgets.
        </p>

        <div className="mt-12">
          <ImageToStlClient />
        </div>
      </article>
      <Footer />
    </>
  );
}

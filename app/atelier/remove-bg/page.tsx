import Footer from "components/layout/footer";

import RemoveBgClient from "./remove-bg-client";

export const metadata = {
  title: "Remove Background — Atelier",
  description:
    "Drop an image, get a PNG with the background stripped. The studio's bench rembg + U^2-Net pipeline, ported to a Firebase Function so visitors can run it for free.",
};

export default function RemoveBgPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Remove background</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          A photograph becomes
          <br />
          a cut-out.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          Background removal by salient-object segmentation. Drop an
          image, the chamber runs it through a U&sup2;-Net ONNX model
          via rembg, returns a PNG with the alpha channel carrying the
          mask. The studio uses this on product photographs and
          editorial portraits before they land on the site.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Backed by a Firebase Function running rembg + onnxruntime.
          The first call after a cold start downloads the chosen model
          (~170 MB) and takes ~30 seconds; warm calls finish in a
          second or two. The image you upload isn&rsquo;t stored
          &mdash; the function returns the PNG and forgets.
        </p>

        <div className="mt-12">
          <RemoveBgClient />
        </div>
      </article>
      <Footer />
    </>
  );
}

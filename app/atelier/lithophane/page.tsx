import Footer from "components/layout/footer";

import LithophaneClient from "./lithophane-client";

export const metadata = {
  title: "Lithophane — Atelier",
  description:
    "Drop a grayscale photograph, get a printable lithophane STL. The studio's bench mesh-from-image transform, ported to a Firebase Function so visitors can run it for free.",
};

export default function LithophanePage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Lithophane</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          A photograph becomes
          <br />
          a printable thing.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          A lithophane is an embossed translucent image: when a light
          shines through the back, the variable thickness reveals the
          photograph. Drop an image here, the studio&rsquo;s bench
          transform builds an STL with darker pixels embossed thicker.
          Slice with a translucent PLA or resin; print vertically;
          backlight; the picture appears in the wall.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Backed by a Firebase Function running OpenCV + scikit-image +
          numpy-stl. The original Python tool lives at{" "}
          <code className="font-mono text-chrome-200">
            services/lithophane/
          </code>
          ; the chamber here is its public front. The image you upload
          isn&rsquo;t stored &mdash; the function returns the STL and
          forgets.
        </p>

        <div className="mt-12">
          <LithophaneClient />
        </div>
      </article>
      <Footer />
    </>
  );
}

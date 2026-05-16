import Footer from "components/layout/footer";

import ClothingReverseClient from "./clothing-reverse-client";

export const metadata = {
  title: "Clothing Reverse — photo to sewing pattern",
  description:
    "Drop a clothing photograph, get a garment spec: type, style, measurements, pattern pieces, materials, and a construction sequence. Pairs with the fabric calculator and the print bureau.",
};

export default function ClothingReversePage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Clothing Reverse</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          From photo to
          <br />
          sewing pattern.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          Upload a clothing photograph. The chamber asks Gemini, with
          a pattern&ndash;maker&rsquo;s system prompt, to read the
          garment back as a spec: type, style, measurements at a
          typical M, the pattern pieces you&rsquo;d need to recreate
          it, materials and notions, and a construction sequence with
          stitch settings. Pairs with the fabric calculator (sizing the
          cuts) and the print bureau (output).
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          The photograph is sent once to the studio&rsquo;s Gemini
          route, the spec comes back, the route forgets. Five
          analyses per hour on the studio&rsquo;s quota; paste your
          own AI Studio key in settings for unbounded use.
        </p>

        <div className="mt-12">
          <ClothingReverseClient />
        </div>
      </article>
      <Footer />
    </>
  );
}

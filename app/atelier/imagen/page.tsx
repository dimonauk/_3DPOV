import Footer from "components/layout/footer";

import ImagenClient from "./imagen-client";

export const metadata = {
  title: "Imagen — Atelier",
  description:
    "Text becomes image. Google's Imagen 4, called from the browser. Five aspect ratios, up to four images per prompt. Free on the studio's small quota; paste your own AI Studio key for unbounded use.",
};

export default function ImagenPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Imagen</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Type a sentence.
          <br />
          Get a picture back.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          A small chamber over Google&rsquo;s Imagen 4. Write what you
          want; pick an aspect ratio; ask for one image or up to four.
          The result is a base64 PNG the page hands back, ready to
          download or pipe into another chamber. The studio covers a
          handful of calls per visitor per hour on its own quota;
          beyond that, paste your own AI Studio key in settings and
          the call goes browser &rarr; Google directly, no cap.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          The studio uses Imagen 4 on the bench for moodboard work and
          for early-stage texture sketches. The chamber here is the
          same model with the same defaults; what you get is what the
          bench gets. The image is generated, sent back, and the
          studio&rsquo;s server forgets &mdash; nothing is stored
          beyond the request lifetime.
        </p>

        <div className="mt-12">
          <ImagenClient />
        </div>
      </article>
      <Footer />
    </>
  );
}

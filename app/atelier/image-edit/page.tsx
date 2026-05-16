import Footer from "components/layout/footer";

import ImageEditClient from "./image-edit-client";

export const metadata = {
  title: "Image edit — Atelier",
  description:
    "Drop an image, write what you want changed, Gemini does the edit. Multimodal in-context generation with Gemini 2.5 Flash Image. Free on the studio's quota; bring your own AI Studio key for unbounded use.",
};

export default function ImageEditPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Image edit</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Drop a picture.
          <br />
          Tell it what to change.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          A chamber over Google&rsquo;s Gemini 2.5 Flash Image &mdash;
          the multimodal model that can take an image plus a sentence
          and return a re-rendered version. &ldquo;Make the sky
          pink.&rdquo; &ldquo;Add a moon.&rdquo; &ldquo;Remove the
          dog.&rdquo; You drop the picture; the model does the work.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          The studio covers a handful of calls per visitor per hour
          on its own quota; beyond that, paste your own AI Studio key
          in settings and the call goes browser &rarr; Google
          directly, no cap. The source image is sent inline as base64,
          the model returns the edited version, and nothing is stored
          beyond the request lifetime.
        </p>

        <div className="mt-12">
          <ImageEditClient />
        </div>
      </article>
      <Footer />
    </>
  );
}

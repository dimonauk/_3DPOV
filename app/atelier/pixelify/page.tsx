import Footer from "components/layout/footer";

import PixelifyClient from "./pixelify-client";

export const metadata = {
  title: "Pixelify — Atelier",
  description:
    "Drop an image, get pixel art back. Adjustable pixel width, six dithering modes, Lospec palette support. Runs entirely in your browser — your image never leaves your machine.",
};

export default function PixelifyPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Pixelify</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Drop a photograph.
          <br />
          Get pixel art back.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          A small chamber for the studio&rsquo;s palette work. Drag in
          an image, set the pixel width, pick a dither mode, optionally
          quantise to a Lospec palette &mdash; the canvas updates as
          you adjust. Everything runs in your browser; the image never
          touches a server.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Built on{" "}
          <a
            href="https://github.com/jonobr1/Image-to-Pixel"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-pink-200"
          >
            Image-to-Pixel
          </a>{" "}
          (MIT). Vendored under <code className="font-mono text-chrome-200">
            lib/image-to-pixel/
          </code>{" "}
          alongside the rest of the studio&rsquo;s atelier tools.
        </p>

        <div className="mt-12">
          <PixelifyClient />
        </div>
      </article>
      <Footer />
    </>
  );
}

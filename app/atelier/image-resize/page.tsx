import Footer from "components/layout/footer";

import ImageResizeClient from "./image-resize-client";

export const metadata = {
  title: "Resize — Atelier",
  description:
    "Resize and transcode an image. The studio's workhorse image-prep step, ported to a Firebase Function so visitors can use it for free.",
};

export default function ImageResizePage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Resize</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Every image gets
          <br />
          resized somewhere.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          The bureau wants 3000px on the long edge before it goes to
          print. The social card wants 1200&times;630 and a JPEG under
          200 KB. The print-bar product photograph wants WebP at quality
          82 because the page already has eight viewports on it. The
          studio runs every image through a resize step somewhere
          &mdash; this chamber is that step, broken out and made public.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Backed by a Firebase Function running Pillow. Pick a mode
          (width, height, or the longest edge), pick a target in
          pixels, pick a format, pick a quality. The function decodes,
          resamples with Lanczos, optionally drops the ICC profile, and
          returns the encoded bytes. The image you upload isn&rsquo;t
          stored &mdash; the function returns the result and forgets.
        </p>

        <div className="mt-12">
          <ImageResizeClient />
        </div>
      </article>
      <Footer />
    </>
  );
}

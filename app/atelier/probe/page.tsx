import Footer from "components/layout/footer";

import ProbeClient from "./probe-client";

export const metadata = {
  title: "Probe — Atelier",
  description:
    "Drop an image, pull out every paperwork field — dimensions, format, bit depth, EXIF, GPS, ICC profile. The studio's bench metadata reader, ported to a Firebase Function.",
};

export default function ProbePage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Probe</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Every photograph carries
          <br />
          a paperwork trail.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          The camera writes a small dossier into every file it makes:
          which body, which lens, what aperture, what shutter, what ISO,
          which way the lens was pointing, where on the earth, what time.
          Most of that survives upload &mdash; some apps strip it,
          most don&rsquo;t. Drop an image here and the chamber pulls the
          dossier back out, in a form a human can read.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Backed by a Firebase Function running Pillow + ExifRead.
          Fields are grouped into File, Image, Camera, Exposure, Location.
          GPS coordinates render as a Maps link. The image you upload
          isn&rsquo;t stored &mdash; the function reads it, returns the
          metadata, and forgets.
        </p>

        <div className="mt-12">
          <ProbeClient />
        </div>
      </article>
      <Footer />
    </>
  );
}

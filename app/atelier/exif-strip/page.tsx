import Footer from "components/layout/footer";
import Link from "next/link";

import ExifStripClient from "./exif-strip-client";

export const metadata = {
  title: "Strip metadata — Atelier",
  description:
    "Drop an image, get the same image back with every EXIF, ICC, XMP, IPTC sidecar removed. The studio's clean-export tool, ported to a Firebase Function.",
};

export default function ExifStripPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Strip metadata</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          A photograph, without
          <br />
          its paperwork trail.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          The studio&rsquo;s photographs carry GPS, camera serial number,
          the photographer&rsquo;s name, the software stack, the time of
          day. Sometimes you want them clean before publication &mdash;
          before a deploy on the Rookery, before sharing to an editor,
          before any &ldquo;I don&rsquo;t want my coordinates leaked&rdquo;
          use case. Drop an image here, the chamber strips EXIF, XMP, IPTC
          and (optionally) the ICC profile. The pixels themselves are
          unchanged.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Backed by a Firebase Function running Pillow. The original
          format is preserved &mdash; JPEG in, JPEG out; PNG in, PNG out.
          If you want to <em>see</em> what&rsquo;s embedded before you
          decide to strip it, use{" "}
          <Link
            href="/atelier/probe"
            className="text-pink-200 underline underline-offset-4"
          >
            /atelier/probe
          </Link>
          &mdash; this chamber is its inverse. The image you upload
          isn&rsquo;t stored &mdash; the function returns the clean copy
          and forgets.
        </p>

        <div className="mt-12">
          <ExifStripClient />
        </div>
      </article>
      <Footer />
    </>
  );
}

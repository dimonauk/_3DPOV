import Footer from "components/layout/footer";

import TrellisClient from "./trellis-client";

export const metadata = {
  title: "TRELLIS — text and image to 3D",
  description:
    "Type a prompt, optionally drop a reference image, get a 3D-printable mesh back. The studio's bench runs Microsoft's TRELLIS; the chamber here is its public front. Prompt in, GLB out, a couple of minutes on a 3090.",
};

export default function TrellisPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; TRELLIS</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Text to 3D.
          <br />
          Prompt &rarr; 3D mesh.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          Type what you want, get a mesh back. The studio&rsquo;s bench
          runs Microsoft&rsquo;s TRELLIS &mdash; a text- and image-to-3D
          pipeline that returns a textured GLB you can rotate, download,
          and slice for the print bureau. Drop in a reference image too
          if you want to steer the look.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Sibling chamber to{" "}
          <code className="font-mono text-chrome-200">/atelier/triposr</code>
          : TripoSR takes one photograph and finishes in about thirty
          seconds; TRELLIS takes a prompt (and optionally a reference
          image) and finishes in roughly a couple of minutes. Server
          seam at{" "}
          <code className="font-mono text-chrome-200">
            lib/capabilities/viz/text-to-3d.server.ts
          </code>
          , bench wrap at{" "}
          <code className="font-mono text-chrome-200">
            services/trellis/
          </code>{" "}
          on the studio&rsquo;s splat360 node.
        </p>

        <div className="mt-12">
          <TrellisClient />
        </div>
      </article>
      <Footer />
    </>
  );
}

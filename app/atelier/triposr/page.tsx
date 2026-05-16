import Footer from "components/layout/footer";

import TriposrClient from "./triposr-client";

export const metadata = {
  title: "TripoSR — single image to 3D mesh",
  description:
    "Drop a photograph, get a 3D-printable mesh back. The studio's bench runs Stability AI's TripoSR; the chamber here is its public front. One image in, one GLB out, ~30 seconds on a 3090.",
};

export default function TriposrPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; TripoSR</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Single image
          <br />
          to 3D mesh.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          Drop an image. The studio&rsquo;s bench runs Stability AI&rsquo;s
          TripoSR &mdash; a feed-forward reconstructor that takes one
          photograph and gives back a textured GLB you can rotate,
          download, and slice for the print bureau.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          One provider, one input, one output &mdash; the focused
          fast-path. The broader four-provider router lives at{" "}
          <code className="font-mono text-chrome-200">
            /atelier/image-to-mesh
          </code>
          ; this chamber is the wedge that proves the bench round-trip
          end-to-end. Server seam at{" "}
          <code className="font-mono text-chrome-200">
            lib/capabilities/viz/image-to-3d.server.ts
          </code>
          , bench wrap at{" "}
          <code className="font-mono text-chrome-200">
            services/triposr/
          </code>{" "}
          on the studio&rsquo;s splat360 node.
        </p>

        <div className="mt-12">
          <TriposrClient />
        </div>
      </article>
      <Footer />
    </>
  );
}

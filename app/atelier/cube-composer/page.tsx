import Footer from "components/layout/footer";

import CubeComposerClient from "./cube-composer-client";

export const metadata = {
  title:
    "Cube Composer — turn a perspective video into a 360 sphere, one face at a time",
  description:
    "A study chamber for Tencent's CubeComposer paper. A perspective camera flies along a recorded trajectory; the missing five cubemap faces are generated one at a time, autoregressively across short temporal windows, until the whole 360 sphere has been filled in.",
};

export default function CubeComposerPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Cube composer</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          A flat camera
          <br />
          becomes a sphere,
          <br />
          one face at a time.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          The CubeComposer paper (Tencent ARC, CVPR 2026) turns a normal
          perspective video into a native 4K 360&deg; video without
          melting any GPU. The trick is the cubemap. A 360&deg; frame is
          six square faces; the camera you started with already supplies
          one of them; the other five are generated one at a time across
          a short temporal window, then composed back into a single
          equirectangular video. This chamber visualises that loop.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          The bench reference lives at{" "}
          <code className="font-mono text-chrome-200">
            D:/The_Hangar/engines/CubeComposer/
          </code>{" "}
          &mdash; a Python research codebase (Wan2.2 + diffsynth +
          equilib) that does the actual generation. This is the
          web-side explainer: load the included rotation trajectory,
          scrub through frames, watch the front face track the
          perspective camera, watch the other five faces light up in
          generation order. No model is invoked here; the visualisation
          is the artefact.
        </p>

        <div className="mt-12">
          <CubeComposerClient />
        </div>
      </article>
      <Footer />
    </>
  );
}

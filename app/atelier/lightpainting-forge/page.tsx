import Link from "next/link";

import Footer from "components/layout/footer";

import LightpaintingForgeClient from "./lightpainting-forge-client";

export const metadata = {
  title: "Lightpainting Forge — Atelier",
  description:
    "A long-exposure light trail becomes a printable 3D sculpture. Drop a photograph, click the trail, get a GLB.",
};

export default function LightpaintingForgePage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Lightpainting Forge</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          A light trail becomes
          <br />
          a printable sculpture.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          The studio shoots long-exposure poi spirals on a fixed tripod.
          The photograph captures a 2D path painted through 3D space.
          This chamber lifts the trail back into 3D &mdash; click the
          trail in the photo, the segmenter pulls a mask, a monocular
          depth estimate places each pixel along Z, marching cubes
          builds a watertight mesh. Export a GLB; slice it; print it.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          The mask + depth backends are optional. Without them, the
          chamber falls back to a luminance threshold + a luminance
          depth proxy &mdash; the geometry is honest about its
          substitute origin, but the round-trip works for prototyping.
          Source lives at{" "}
          <code className="font-mono text-chrome-200">
            apps/lightpainting-forge/
          </code>
          ; SAM2 + Depth-Anything-V2 backend at{" "}
          <code className="font-mono text-chrome-200">
            tools/lightpainting-forge-backend/
          </code>
          . Crosses over with{" "}
          <Link
            href="/holo-walk"
            className="text-pink-200 underline underline-offset-4"
          >
            HoloWalk
          </Link>
          : the trails the operator forges here are the sculptures
          re-anchored at the spots the photographs were taken.
        </p>

        <div className="mt-12">
          <LightpaintingForgeClient />
        </div>
      </article>
      <Footer />
    </>
  );
}

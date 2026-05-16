import Footer from "components/layout/footer";

import VoxelImageClient from "./voxel-image-client";

export const metadata = {
  title: "Voxel Image — Atelier",
  description:
    "Every pixel of an image becomes one voxel in 3D space. Sphere layout for 360 equirectangulars; plane layout for flat images. Optional pixel-stream animation makes voxels travel to the opposite edge and back.",
};

export default function VoxelImagePage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Voxel Image</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          One pixel,
          <br />
          one voxel.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          The image, decomposed into a field of small cubes. No depth
          inference — each pixel just becomes a voxel at its
          corresponding spherical or planar position. Sphere layout for
          360 equirectangulars; plane layout for flat images. The
          chamber auto-detects which.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Toggle the animation: each voxel develops a phase that
          advances over time; it travels from its home position toward
          the mirror point on the opposite edge, then snaps back.
          Different per-voxel offsets stagger them into a constant
          flow.
        </p>

        <div className="mt-12">
          <VoxelImageClient />
        </div>
      </article>
      <Footer />
    </>
  );
}

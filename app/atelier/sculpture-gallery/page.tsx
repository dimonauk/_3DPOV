import Footer from "components/layout/footer";
import Link from "next/link";

import { meshes } from "lib/assets/meshes";
import MeshCard from "components/atelier/mesh-card";

import SculptureGalleryClient from "./sculpture-gallery-client";

export const metadata = {
  title: "Sculpture Gallery — the bench's working stock",
  description:
    "The wall of meshes the studio bench has produced, plus a marching-cubes workshop for turning voxel fields into watertight GLBs. The studio's sculpture catalogue and its sculpting bench, side by side.",
};

export default function SculptureGalleryPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Sculpture Gallery</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          The sculpture wall.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          Every mesh the bench has produced, surfaced as its own piece.
          Browse the wall the way you&rsquo;d browse a foundry&rsquo;s
          specimen book &mdash; each card is a finished asset, downloadable
          as a .glb, ready for a slicer or a viewport. The same data drives{" "}
          <Link
            href="/atelier#meshes"
            className="text-pink-200 underline underline-offset-4"
          >
            the atelier&rsquo;s meshes section
          </Link>
          ; this chamber gives it a wall of its own.
        </p>
        <p className="mt-4 max-w-2xl text-sm text-chrome-400">
          Below the wall, the workshop &mdash; a marching-cubes bench that
          turns a voxel scalar field (built-in synthetic, or your own .npy
          / .json upload) into a watertight GLB. The same pipeline behind
          the studio&rsquo;s sculpture authoring, running in the browser.
        </p>

        <section className="mt-12">
          <h2 className="chrome-label text-chrome-300">The wall</h2>
          <p className="mt-2 max-w-2xl text-sm text-chrome-400">
            {meshes.length} mesh{meshes.length === 1 ? "" : "es"} in the
            bench catalogue. Drag to orbit in any preview; click the
            download link for the .glb.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {meshes.map((mesh) => (
              <MeshCard key={mesh.slug} mesh={mesh} />
            ))}
          </div>
        </section>

        <section className="mt-20">
          <h2 className="chrome-label text-chrome-300">The workshop</h2>
          <p className="mt-2 max-w-2xl text-sm text-chrome-400">
            Marching-cubes over a scalar field. Adjust the iso threshold
            to find the surface; export as a watertight GLB sized to
            millimetres for the slicer.
          </p>
          <div className="mt-6">
            <SculptureGalleryClient />
          </div>
        </section>
      </article>
      <Footer />
    </>
  );
}

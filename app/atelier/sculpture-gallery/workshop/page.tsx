/**
 * app/atelier/sculpture-gallery/workshop/page.tsx — The voxel +
 * Hunyuan3D workshop, relocated from the gallery's root page so the
 * root can host the WebXR walk-through.
 *
 * The two surfaces share a name (sculpture-gallery) but answer
 * different needs: the root page is the editorial wing — pieces on
 * plinths, hover the placard, walk in VR. This page is the bench —
 * marching-cubes on a voxel field, image-to-GLB via the Hangar's
 * ComfyUI Hunyuan3D node. Both stay under the same atelier slug so
 * the chamber's tooling lives one click away from its wall.
 *
 * Imports come from the parent directory unchanged.
 */
import Footer from "components/layout/footer";
import Link from "next/link";

import { meshes } from "lib/assets/meshes";
import MeshCard from "components/atelier/mesh-card";

import SculptureGalleryClient from "../sculpture-gallery-client";

export const metadata = {
  title: "Sculpture Gallery workshop — the bench's marching-cubes table",
  description:
    "The voxel-to-GLB workshop behind the sculpture gallery. Marching-cubes on a scalar field, plus the operator-only image-to-Hunyuan3D path. The bench, exposed.",
};

export default function SculptureGalleryWorkshopPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Sculpture Gallery &middot; Workshop</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          The sculpture bench.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          The workshop behind the gallery wall &mdash; a marching-cubes
          bench that turns a voxel scalar field (built-in synthetic, or
          your own .npy / .json upload) into a watertight GLB. The same
          pipeline behind the studio&rsquo;s sculpture authoring,
          running in the browser. The gallery proper sits at{" "}
          <Link
            href="/atelier/sculpture-gallery"
            className="text-pink-200 underline underline-offset-4"
          >
            /atelier/sculpture-gallery
          </Link>
          &nbsp;&mdash; pieces on plinths, walk it in VR.
        </p>

        <section className="mt-12">
          <h2 className="chrome-label text-chrome-300">The wall (mesh catalogue)</h2>
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

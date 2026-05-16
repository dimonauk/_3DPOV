import Link from "next/link";

import Footer from "components/layout/footer";

import IsosurfaceClient from "./isosurface-client";

export const metadata = {
  title: "Isosurface — Atelier",
  description:
    "An equation becomes a surface. WebGPU marching cubes on three signed-distance fields, run live in the browser.",
};

export default function IsosurfacePage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Isosurface</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          An equation becomes
          <br />
          a surface.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          A{" "}
          <Link
            href="/codex/signed-distance-fields"
            className="text-pink-200 underline underline-offset-4"
          >
            signed-distance field
          </Link>{" "}
          assigns every point in space a single number: how far you are
          from a surface, negative if you&rsquo;re inside it. The shape
          isn&rsquo;t drawn anywhere &mdash; it&rsquo;s the boundary,
          the place where the number flips sign. Move the sliders below
          and that boundary moves with them.{" "}
          <Link
            href="/codex/marching-cubes"
            className="text-pink-200 underline underline-offset-4"
          >
            Marching cubes
          </Link>{" "}
          is the algorithm that finds the boundary and turns it into a
          mesh, one voxel cell at a time. The whole loop &mdash; sample
          the field, classify the cell, emit triangles &mdash; runs on
          your GPU.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          Three primitive fields are blended: a sphere, a torus, and a{" "}
          <em>gyroid</em> &mdash; the triply-periodic surface the
          studio uses for its waveguide work. Drag the threshold to
          shift the level set; the mesh regenerates entirely on the
          GPU. Adapted from the reference WebGPU marching-cubes
          implementation in{" "}
          <code className="font-mono text-chrome-200">
            services/webgpu-marching-cubes/
          </code>
          ; that library uses a five-pass scan-and-compact pipeline,
          this chamber runs a single compute pass with atomic-append
          to a vertex buffer, which is faster to wire up and plenty
          fast at the resolutions the sliders expose. Verified on
          Chrome on Windows; Firefox 141+ and Safari Tech Preview
          should also serve.
        </p>

        <div className="mt-12">
          <IsosurfaceClient />
        </div>
      </article>
      <Footer />
    </>
  );
}

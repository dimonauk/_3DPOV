import Footer from "components/layout/footer";

import VoxelWorldClient from "./voxel-world-client";

export const metadata = {
  title: "Voxel world — Atelier",
  description:
    "A small chamber for stacking cubes. Left-click to add, right-click to remove, drag to orbit. The smallest unit of sculpture is one voxel; this is the room to play with that.",
};

export default function VoxelWorldPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Voxel world</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          The smallest unit
          <br />
          of sculpture
          <br />
          is one cube.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          A starter sphere of voxels, suspended in the room. Left-click
          a face to add a cube next to it; right-click to carve one
          away. Drag to orbit, scroll to zoom. Pick a colour from the
          palette before placing &mdash; the swatch you choose is the
          one that lands. Nothing leaves your browser; nothing is saved
          unless you ask.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          The studio keeps a vendored copy of{" "}
          <a
            href="https://github.com/danielesteban/softxels"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-pink-200"
          >
            softxels
          </a>{" "}
          (MIT, Daniel Esteban Nombela) at{" "}
          <code className="font-mono text-chrome-200">
            services/softxels/
          </code>{" "}
          for marching-cubes worldgen experiments on the bench. This
          chamber is a lighter front door &mdash; raw stacked cubes on
          React Three Fiber. A softxels-backed isosurface variant will
          land in a follow-up.
        </p>

        <div className="mt-12">
          <VoxelWorldClient />
        </div>
      </article>
      <Footer />
    </>
  );
}

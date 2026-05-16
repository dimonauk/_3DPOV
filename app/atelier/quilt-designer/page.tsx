import Footer from "components/layout/footer";

import QuiltDesignerClient from "./quilt-designer-client";

export const metadata = {
  title: "Quilt Designer — fabric patterns for the wall",
  description:
    "Compose a quilt pattern from traditional blocks, recolour with a fabric palette, export an SVG cutting layout. Pairs with the print bureau when you'd rather have the studio run the fabric for you.",
};

export default function QuiltDesignerPage() {
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier &middot; Quilt Designer</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          A grid of blocks
          <br />
          becomes a quilt.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          A pattern composer. Pick a grid size, drop traditional quilt
          blocks into each cell, recolour them from the fabric palette,
          export an SVG cutting layout. The chamber is browser-only
          &mdash; nothing leaves your machine until you click download.
        </p>
        <p className="mt-4 max-w-xl text-sm text-chrome-400">
          The studio uses this when a wall-piece wants to land as fabric
          rather than as a print. Output pairs with the{" "}
          <a
            href="/bureau"
            className="underline underline-offset-4 hover:text-pink-200"
          >
            print bureau
          </a>{" "}
          for tactile work &mdash; quilts read at room scale where a
          flat print reads at hand scale. The block library here is the
          public-domain canon (Nine-Patch, Log Cabin, Bear&rsquo;s Paw,
          and friends); the recipe lives at{" "}
          <code className="font-mono text-chrome-200">
            app/atelier/quilt-designer/quilt-designer-client.tsx
          </code>
          .
        </p>

        <div className="mt-12">
          <QuiltDesignerClient />
        </div>
      </article>
      <Footer />
    </>
  );
}

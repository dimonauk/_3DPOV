/**
 * app/atelier/wall-array-designer/page.tsx
 *
 * Wall-array composer — 3x3 (default) or 4x4 grid of pieces sharing
 * one parental lineage. Mounts EvolutionComposer with the "wall-array"
 * preset. Same engine as the single-piece designer; the arrangement +
 * scale + CTA differ.
 */

import Footer from "components/layout/footer";
import Link from "next/link";

import EvolutionComposer from "components/evolution/EvolutionComposer";
import { getProductPreset } from "lib/evolution/product-presets";

export const metadata = {
  title: "Wall Array Designer — breed a coherent set",
  description:
    "Design a 9- or 16-piece wall array via the studio's evolution loop. Shared parent lineage means the array reads as a rhythm; the parent is the chord. Belt-printed in one production slot.",
};

export default function WallArrayDesignerPage() {
  const preset = getProductPreset("wall-array");
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier · Wall Array Designer</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          Many pieces,
          <br />
          one lineage.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          {preset.blurb}
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          An array of nine. Each tile is a sibling, not an identical
          copy; the family resemblance carries through because every
          tile descends from the same favoured parent pool. Pick two or
          three candidates, breed, watch the next generation cohere;
          mutate to break out of local minima. When the grid sings, hit{" "}
          <em>keep this</em> for the commission slot.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/atelier/wall-piece-designer"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            sibling · wall piece designer
          </Link>
          <Link
            href="/atelier/jewellery-designer"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            sibling · jewellery designer
          </Link>
          <Link
            href="/articles/wall-arrays-geometry-of-rooms"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            read · wall arrays + the geometry of rooms
          </Link>
        </div>

        <div className="mt-12">
          <EvolutionComposer preset={preset} />
        </div>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">Why nine, not one</div>
          <p className="mt-3">
            A wall array exploits the fact that a sculpture is more
            interesting in conversation with its siblings than in
            isolation. The same evolution engine that breeds a single
            wall piece can be steered to keep a population coherent —
            this chamber preserves the picked pool across generations,
            so every tile inherits from genomes you've explicitly
            chosen rather than drifting independently. The result is an
            array whose visual logic is in the lineage, not the layout.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

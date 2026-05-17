/**
 * app/atelier/wall-piece-designer/page.tsx
 *
 * Single-piece wall sculpture composer. Mounts EvolutionComposer with
 * the "wall-piece" product preset. Each generation, the breeding-floor
 * mechanic surfaces a fresh population; pick the one that holds the
 * room, mutate or breed to tighten, "keep this →" to surface the
 * commission CTA.
 */

import Footer from "components/layout/footer";
import Link from "next/link";

import EvolutionComposer from "components/evolution/EvolutionComposer";
import { getProductPreset } from "lib/evolution/product-presets";

export const metadata = {
  title: "Wall Piece Designer — breed a single waveguide sculpture",
  description:
    "Design a bespoke waveguide wall piece via the studio's evolution loop. Twelve genome candidates per generation; pick + mutate + breed until one piece holds the room, then commission the print.",
};

export default function WallPieceDesignerPage() {
  const preset = getProductPreset("wall-piece");
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier · Wall Piece Designer</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          One piece for
          <br />
          one wall.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          {preset.blurb}
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          The bench breeds sculptures the way breeders breed flowers — a
          population, a fitness call, a next generation. This chamber
          surfaces the same loop. Tap any candidate to pick it; mutate
          your picks to drift; breed picks to cross. When one piece
          looks right, hit <em>keep this</em> and the commission card
          opens.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/atelier/wall-array-designer"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            sibling · wall array designer
          </Link>
          <Link
            href="/atelier/jewellery-designer"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            sibling · jewellery designer
          </Link>
          <Link
            href="/atelier/breeding-floor"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            generic · breeding floor
          </Link>
          <Link
            href="/capabilities"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            substrate · evolution
          </Link>
        </div>

        <div className="mt-12">
          <EvolutionComposer preset={preset} />
        </div>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">What gets bred</div>
          <p className="mt-3">
            A waveguide sculpture genome carries 36 normalised genes —
            arm count, branching depth, wall thickness, channel ratio,
            grating pitch, IOR target, gem distribution, hue drift. The
            placeholder render here is a tinted sphere; the production
            pipeline (Blender + SLA) takes the same genome to a
            physical print at the chosen wall scale ({preset.scaleRangeMm[0]}–
            {preset.scaleRangeMm[1]} mm).
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

/**
 * app/atelier/jewellery-designer/page.tsx
 *
 * Wearable waveguide composer. Same evolution engine as the wall-piece
 * + wall-array designers; preset biases the gem genes high so the
 * candidates surface jewellery-shaped variants rather than wall-scale
 * sculpture.
 */

import Footer from "components/layout/footer";
import Link from "next/link";

import EvolutionComposer from "components/evolution/EvolutionComposer";
import { getProductPreset } from "lib/evolution/product-presets";

export const metadata = {
  title: "Jewellery Designer — breed a wearable",
  description:
    "Design a wearable waveguide piece via the studio's evolution loop. The same engine that breeds wall sculptures, biased for jewellery scale + gem-rich genomes. Twelve candidates per generation; pick + mutate + breed.",
};

export default function JewelleryDesignerPage() {
  const preset = getProductPreset("jewellery");
  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Atelier · Jewellery Designer</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          A wearable
          <br />
          waveguide.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          {preset.blurb}
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          Same chamber primitive as the wall designers; the preset tilts
          the genome distribution toward gem-rich, smaller-scale forms.
          Twelve candidates per generation, pick the ones with the right
          chord, mutate to drift along it, breed to cross-pollinate. The
          studio mounts the kept genome as a pendant by default;
          earrings + rings are sibling commissions starting from the
          same record.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/atelier/wall-piece-designer"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            sibling · wall piece designer
          </Link>
          <Link
            href="/atelier/wall-array-designer"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            sibling · wall array designer
          </Link>
          <Link
            href="/articles/jewellery-the-same-trace-wearable"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            read · jewellery, the same trace, wearable
          </Link>
          <Link
            href="/articles/the-jewellery-algorithms"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            read · the jewellery algorithms
          </Link>
        </div>

        <div className="mt-12">
          <EvolutionComposer preset={preset} />
        </div>

        <section className="mt-16 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">Wearable scale, same genome</div>
          <p className="mt-3">
            The waveguide-sculpture genome scales down to wearable
            without losing its physics — the same gratings, the same
            channel-ratio canons, the same gem distribution. The
            placeholder render is a tinted sphere with a gem when the
            gem-count gene is high enough; the production piece is
            SLA-printed at {preset.scaleRangeMm[0]}–{preset.scaleRangeMm[1]} mm
            and mounted in silver or steel as a pendant, earring set,
            or ring.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}

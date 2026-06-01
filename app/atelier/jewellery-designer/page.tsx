import { AtelierToolPage } from "components/ui";
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
    <AtelierToolPage
      label="Atelier · Jewellery Designer"
      headline={<>A wearable<br />waveguide.</>}
      body={preset.blurb}
      secondary="Same chamber primitive as the wall designers; the preset tilts the genome distribution toward gem-rich, smaller-scale forms. Twelve candidates per generation, pick the ones with the right chord, mutate to drift along it, breed to cross-pollinate. The studio mounts the kept genome as a pendant by default; earrings + rings are sibling commissions starting from the same record."
      chips={[
        { href: "/atelier/wall-piece-designer",                           label: "sibling · wall piece designer" },
        { href: "/atelier/wall-array-designer",                           label: "sibling · wall array designer" },
        { href: "/articles/jewellery-the-same-trace-wearable",            label: "read · jewellery, the same trace, wearable" },
        { href: "/articles/the-jewellery-algorithms",                     label: "read · the jewellery algorithms" },
      ]}
    >
      <EvolutionComposer preset={preset} />
    </AtelierToolPage>
  );
}

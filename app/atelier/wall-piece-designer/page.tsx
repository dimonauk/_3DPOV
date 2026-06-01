import { AtelierToolPage } from "components/ui";
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
    <AtelierToolPage
      label="Atelier · Wall Piece Designer"
      headline={<>One piece for<br />one wall.</>}
      body={preset.blurb}
      secondary="The bench breeds sculptures the way breeders breed flowers — a population, a fitness call, a next generation. This chamber surfaces the same loop. Tap any candidate to pick it; mutate your picks to drift; breed picks to cross. When one piece looks right, hit keep this and the commission card opens."
      chips={[
        { href: "/atelier/wall-array-designer",  label: "sibling · wall array designer" },
        { href: "/atelier/jewellery-designer",   label: "sibling · jewellery designer" },
        { href: "/atelier/breeding-floor",       label: "generic · breeding floor" },
        { href: "/capabilities",                 label: "substrate · evolution" },
      ]}
    >
      <EvolutionComposer preset={preset} />
    </AtelierToolPage>
  );
}

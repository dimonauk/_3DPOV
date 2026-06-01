import { AtelierToolPage } from "components/ui";
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
    <AtelierToolPage
      label="Atelier · Wall Array Designer"
      headline={<>Many pieces,<br />one lineage.</>}
      body={preset.blurb}
      secondary="An array of nine. Each tile is a sibling, not an identical copy; the family resemblance carries through because every tile descends from the same favoured parent pool. Pick two or three candidates, breed, watch the next generation cohere; mutate to break out of local minima. When the grid sings, hit keep this for the commission slot."
      chips={[
        { href: "/atelier/wall-piece-designer",                       label: "sibling · wall piece designer" },
        { href: "/atelier/jewellery-designer",                        label: "sibling · jewellery designer" },
        { href: "/articles/wall-arrays-geometry-of-rooms",            label: "read · wall arrays + the geometry of rooms" },
      ]}
    >
      <EvolutionComposer preset={preset} />
    </AtelierToolPage>
  );
}

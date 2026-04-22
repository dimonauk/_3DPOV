import type { Work } from "@/lib/works";
import { CERTIFICATE_NOTE, EDITION_AP_SUFFIX, SHIPS_FROM } from "@/lib/constants";

export function WorkSpec({ work }: { work: Work }) {
  return (
    <dl className="grid grid-cols-2 gap-y-3 text-sm">
      <dt className="text-ink/60">Edition</dt>
      <dd className="font-mono">{work.editionSize} {EDITION_AP_SUFFIX}</dd>

      <dt className="text-ink/60">Dimensions</dt>
      <dd>{work.dimensions}</dd>

      {work.type === "plate" && (
        <>
          <dt className="text-ink/60">Paper</dt>
          <dd>{work.paper}</dd>
          <dt className="text-ink/60">Price</dt>
          <dd className="font-mono">£{work.priceGBP}</dd>
        </>
      )}

      {work.type === "waveguide" && (
        <>
          <dt className="text-ink/60">Material</dt>
          <dd>{work.material}</dd>
          <dt className="text-ink/60">Light</dt>
          <dd>{work.ledSpec}</dd>
          <dt className="text-ink/60">Power</dt>
          <dd>{work.powerDraw}</dd>
          <dt className="text-ink/60">Price</dt>
          <dd className="font-mono">£{work.priceGBP}</dd>
        </>
      )}

      {work.type === "sculpture" && (
        <>
          <dt className="text-ink/60">Material</dt>
          <dd>{work.material}</dd>
          {work.base && (
            <>
              <dt className="text-ink/60">Base</dt>
              <dd>{work.base}</dd>
            </>
          )}
          <dt className="text-ink/60">Price</dt>
          <dd className="font-mono">£{work.priceGBP}</dd>
        </>
      )}

      {work.type === "array" && (
        <>
          <dt className="text-ink/60">Material</dt>
          <dd>{work.material}</dd>
          <dt className="text-ink/60">Panel</dt>
          <dd>{work.panelDimensions}</dd>
          <dt className="text-ink/60">From</dt>
          <dd className="font-mono">£{work.options[0].priceGBP}</dd>
        </>
      )}

      <dt className="text-ink/60">Certificate</dt>
      <dd>{CERTIFICATE_NOTE}</dd>
      <dt className="text-ink/60">Ships from</dt>
      <dd>{SHIPS_FROM}</dd>
    </dl>
  );
}

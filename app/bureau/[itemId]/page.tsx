import { Suspense } from "react";

import BureauClient from "./bureau-client";

/**
 * app/bureau/[itemId]/page.tsx — server entry for the print bureau
 * picker. Per docs/BUREAU-AR-LOOP-PLAN.md: any chamber output can
 * send a buyer to /bureau/<provenance-id> with one click; the page
 * pre-fills the picker with that imageId and lets the visitor pick
 * a size + paper + edition to see a quote.
 *
 * MVP: quote-only flow. The Stripe payment step (/api/bureau/order)
 * is on the roadmap; this page hands the visitor a quote and a
 * "buy" button that's wired to alert("coming soon") for now.
 *
 * No DB lookup on the imageId here — the quote endpoint is stateless
 * and the future order endpoint will validate provenance/{id}
 * existence before any payment.
 */

type Params = { params: Promise<{ itemId: string }> };

export default async function BureauPage({ params }: Params) {
  const { itemId } = await params;
  return (
    <Suspense
      fallback={
        <div className="bureau-loading" style={{ padding: "2rem 1.5rem" }}>
          Loading bureau…
        </div>
      }
    >
      <BureauClient itemId={itemId} />
    </Suspense>
  );
}

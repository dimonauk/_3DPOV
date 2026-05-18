"use client";

/**
 * app/bureau/[itemId]/bureau/quote-summary.tsx — Renders a successful
 * Quote: price (formatted GBP), lead time, paper notes, edition
 * status, plus the "Order this print" CTA (stubbed for now — the
 * Stripe step lands in a follow-up commit).
 */

import type { Quote } from "lib/bureau/types";

export function QuoteSummary({
  quote,
  onOrder,
}: {
  quote: Quote;
  onOrder: () => void;
}) {
  const formattedPrice = (quote.priceGbp / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  });

  return (
    <aside className="bp-quote">
      <div className="bp-quote-label">Quote</div>
      <div className="bp-quote-price">{formattedPrice}</div>

      <dl className="bp-quote-dl">
        <div className="bp-quote-row">
          <dt>Size</dt>
          <dd>{quote.sizeLabel}</dd>
        </div>
        <div className="bp-quote-row">
          <dt>Edition</dt>
          <dd>{quote.editionLabel}</dd>
        </div>
        <div className="bp-quote-row">
          <dt>Lead time</dt>
          <dd>
            {quote.leadDays} business day{quote.leadDays === 1 ? "" : "s"}{" "}
            before shipping
          </dd>
        </div>
      </dl>

      <p className="bp-quote-paper">{quote.paperNotes}</p>

      <button
        type="button"
        onClick={onOrder}
        className="bp-quote-order"
      >
        Order this print
      </button>

      <p className="bp-quote-fineprint">
        UK shipping included. International shipping quoted at checkout
        once it's switched on (Stripe Tax wires that in).
      </p>
    </aside>
  );
}

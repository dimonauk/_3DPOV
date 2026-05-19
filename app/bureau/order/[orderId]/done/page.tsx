/**
 * app/bureau/order/[orderId]/done/page.tsx — Post-payment confirmation.
 *
 * Stripe Elements redirects here after a successful payment (the
 * Checkout page passes `return_url={origin}/bureau/order/[orderId]/done`
 * to `stripe.confirmPayment`). The Stripe webhook may not have fired
 * yet by the time the visitor lands, so we surface the order in
 * whatever state Firestore has — typically `pending_payment` for a
 * few seconds before the webhook flips it to `paid`. Either is fine
 * from the visitor's perspective: their money's gone, their order
 * exists, the operator queue picks it up.
 *
 * Server-rendered (no client JS) so visitors landing without
 * JS-capable browsers still get the receipt page.
 */

import Link from "next/link";

import { getOrder } from "lib/bureau/order";
import {
  EDITION_LABELS,
  PAPER_LABELS,
  SIZE_LABELS,
} from "lib/bureau/pricing";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order confirmed — Holoflow bureau",
  robots: { index: false, follow: false },
};

export default async function BureauOrderDonePage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrder(orderId);

  if (!order) {
    return (
      <main className="bod-root">
        <div className="bod-card">
          <h1>Order not found</h1>
          <p>
            We can&rsquo;t find <code>{orderId}</code>. If you just paid,
            try refreshing in a moment — the confirmation may still be
            in flight.
          </p>
          <Link href="/bureau" className="bod-link">
            ← Back to the bureau
          </Link>
        </div>
        <BodStyles />
      </main>
    );
  }

  const priceFormatted = (order.priceGbp / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  });

  const paid = order.status === "paid" || !!order.paidAt;
  const pendingPayment = order.status === "pending_payment";

  return (
    <main className="bod-root">
      <div className="bod-card">
        <header>
          <span className="bod-tag">{paid ? "Paid" : pendingPayment ? "Processing" : order.status}</span>
          <h1>Thank you for the order</h1>
          <p className="bod-id">
            Reference <code>{orderId}</code>
          </p>
        </header>

        <section className="bod-summary">
          <div>
            <span>Print</span>
            <strong>
              {SIZE_LABELS[order.sizeChoice]} ·{" "}
              {EDITION_LABELS[order.edition]}
            </strong>
          </div>
          <div>
            <span>Paper</span>
            <strong>{PAPER_LABELS[order.paperChoice]}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>{priceFormatted}</strong>
          </div>
          <div>
            <span>Receipt sent to</span>
            <strong>{order.customerEmail}</strong>
          </div>
        </section>

        <section className="bod-next">
          <h2>What happens next</h2>
          <ol>
            <li>
              We print on demand from the studio&rsquo;s Canon PRO-1100 —
              expect dispatch within 3 business days for open + limited
              editions, 5 for unique.
            </li>
            <li>
              You&rsquo;ll get a shipping email with a Royal Mail tracking
              number when the parcel leaves the studio.
            </li>
            <li>
              Each print ships with a 6×4&rdquo; provenance card carrying
              a QR code that links to the artwork&rsquo;s HoloWalk anchor
              (when the AR side of the loop is live in your area).
            </li>
          </ol>
        </section>

        {pendingPayment && (
          <p className="bod-note">
            Payment confirmation is in flight — Stripe&rsquo;s webhook may
            take a few seconds to land. If this page still says
            &ldquo;Processing&rdquo; after a minute, your receipt email
            is the canonical source of truth; reply to it if anything
            looks wrong.
          </p>
        )}

        <footer>
          <Link href="/atelier" className="bod-link">
            ← Back to the studio
          </Link>
          <span className="bod-fineprint">
            Questions? Reply to your receipt email or write to{" "}
            <a href="mailto:hello@holoflow.co.uk">hello@holoflow.co.uk</a>
            .
          </span>
        </footer>
      </div>
      <BodStyles />
    </main>
  );
}

// Server Component — see app/bureau/checkout/[orderId]/page.tsx for the
// rationale; styled-jsx is client-only.
const BOD_CSS = `
      .bod-root {
        min-height: 100vh;
        background: linear-gradient(135deg, #1a0a1a, #0a0a1a);
        color: rgba(255, 255, 255, 0.92);
        padding: 4rem 1.5rem;
        display: flex;
        justify-content: center;
      }
      .bod-card {
        max-width: 640px;
        width: 100%;
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 111, 181, 0.25);
        border-radius: 0.75rem;
        padding: 2.5rem 2rem;
      }
      .bod-tag {
        display: inline-block;
        font-size: 0.7rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #ff6fb5;
        background: rgba(255, 111, 181, 0.12);
        border: 1px solid rgba(255, 111, 181, 0.3);
        padding: 0.25rem 0.7rem;
        border-radius: 999px;
        margin-bottom: 1rem;
      }
      .bod-card h1 {
        font-size: 1.6rem;
        font-weight: 700;
        margin: 0 0 0.4rem;
      }
      .bod-id {
        color: rgba(255, 255, 255, 0.55);
        font-size: 0.85rem;
      }
      .bod-id code {
        background: rgba(255, 111, 181, 0.12);
        padding: 0.05rem 0.4rem;
        border-radius: 0.25rem;
      }
      .bod-summary {
        margin: 1.5rem 0;
        padding: 1.25rem;
        background: rgba(0, 0, 0, 0.25);
        border-radius: 0.5rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.85rem;
      }
      .bod-summary > div {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }
      .bod-summary span {
        font-size: 0.7rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.5);
      }
      .bod-summary strong {
        font-size: 0.92rem;
        color: rgba(255, 255, 255, 0.92);
      }
      .bod-next h2 {
        font-size: 0.85rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(255, 111, 181, 0.85);
        margin: 1.5rem 0 0.6rem;
      }
      .bod-next ol {
        padding-left: 1.2rem;
        margin: 0;
        font-size: 0.92rem;
        color: rgba(255, 255, 255, 0.85);
        line-height: 1.5;
      }
      .bod-next li + li {
        margin-top: 0.6rem;
      }
      .bod-note {
        margin-top: 1.25rem;
        padding: 0.7rem 0.9rem;
        background: rgba(255, 209, 89, 0.06);
        border: 1px solid rgba(255, 209, 89, 0.3);
        color: #ffd159;
        border-radius: 0.4rem;
        font-size: 0.82rem;
      }
      .bod-card footer {
        margin-top: 2rem;
        padding-top: 1.25rem;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .bod-link {
        color: #ff6fb5;
        text-decoration: none;
        font-size: 0.88rem;
      }
      .bod-link:hover {
        text-decoration: underline;
      }
      .bod-fineprint {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
      }
      .bod-fineprint a {
        color: rgba(255, 255, 255, 0.85);
      }
`;

function BodStyles() {
  return <style dangerouslySetInnerHTML={{ __html: BOD_CSS }} />;
}

/**
 * app/bureau/checkout/[slug]/[edition]/page.tsx — Drop edition checkout
 * landing.
 *
 * This is where the buyer arrives after `POST /api/drops/[slug]/claim`
 * succeeds. The claim handler has already reserved the edition slot and
 * minted the entitlement at
 * `users/{uid}/editions/{slug}-{editionNumber}` with
 * `fulfillmentStatus: "pending-payment"`. The buyer's next step is to
 * pay via Stripe Checkout — we hand them off to a hosted Stripe session
 * for the actual card form (different from the bureau's per-order
 * Payment-Intent flow, which uses in-page Stripe Elements).
 *
 * Server-rendered shell:
 *   - Reads the public drop record so we can show title + variant +
 *     parentage even when the buyer isn't signed in yet.
 *   - The entitlement doc itself can only be read with the buyer's own
 *     credentials; the server doesn't carry those, so the entitlement
 *     fetch happens client-side via Firebase auth in the client child.
 *   - When `?paid=1` is on the URL (Stripe's success redirect), we
 *     surface a confirmation pane. The webhook (TODO) is what flips
 *     the doc to `paid`; this page handles the race by polling the
 *     entitlement until it lands.
 *
 * Catalogue voice: short sentences, no flourishes. The buyer just
 * spent money — they want the receipt, not a marketing tagline.
 */

import { redirect } from "next/navigation";

import { getDropBySlug } from "lib/drops/read";

import CheckoutClient from "./checkout-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Checkout — Holoflow drop",
  robots: { index: false, follow: false },
};

export default async function DropEditionCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; edition: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug, edition } = await params;
  const search = await searchParams;

  const editionNumber = Number.parseInt(edition, 10);
  if (!Number.isInteger(editionNumber) || editionNumber < 0) {
    redirect(`/drops/${encodeURIComponent(slug)}`);
  }

  const drop = await getDropBySlug(slug);
  if (!drop) {
    redirect("/drops");
  }

  const paidFlag = search.paid === "1";
  const sessionId =
    typeof search.session_id === "string" ? search.session_id : null;

  // The Limited size + parentage are useful catalogue context so the
  // buyer can confirm they're paying for the right edition. We render
  // it server-side so the page is meaningful even before client
  // hydration completes.
  const variantHint =
    editionNumber === 0
      ? "Unique"
      : editionNumber <= drop.edition.limitedSize
        ? `Limited #${editionNumber} of ${drop.edition.limitedSize}`
        : `Open #${editionNumber - drop.edition.limitedSize}`;

  return (
    <main className="dc-root">
      <article className="dc-card">
        <header className="dc-header">
          <span className="dc-tag">Drop checkout</span>
          <h1 className="dc-title">{drop.title}</h1>
          <p className="dc-variant">{variantHint}</p>
          {drop.summary ? <p className="dc-summary">{drop.summary}</p> : null}
        </header>

        <CheckoutClient
          slug={slug}
          editionNumber={editionNumber}
          variantHint={variantHint}
          initialPaid={paidFlag}
          stripeSessionId={sessionId}
        />

        <footer className="dc-footer">
          <a href={`/drops/${encodeURIComponent(slug)}`} className="dc-link">
            ← Back to the drop
          </a>
          <span>Holoflow Studio · Drops</span>
        </footer>
      </article>
      <Styles />
    </main>
  );
}

const CSS = `
.dc-root {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a0a1a, #0a0a1a);
  color: rgba(255, 255, 255, 0.92);
  padding: 4rem 1.5rem;
  display: flex;
  justify-content: center;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
.dc-card {
  max-width: 560px;
  width: 100%;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 111, 181, 0.25);
  border-radius: 0.75rem;
  padding: 2rem 1.75rem;
}
.dc-tag {
  display: inline-block;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #ff6fb5;
  background: rgba(255, 111, 181, 0.12);
  border: 1px solid rgba(255, 111, 181, 0.3);
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  margin-bottom: 0.85rem;
}
.dc-title {
  font-size: 1.5rem;
  margin: 0 0 0.4rem;
  font-weight: 600;
}
.dc-variant {
  color: #ff6fb5;
  font-size: 0.95rem;
  margin: 0 0 0.85rem;
  font-weight: 500;
}
.dc-summary {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.88rem;
  margin: 0 0 1.5rem;
  line-height: 1.55;
}
.dc-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.dc-footer {
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}
.dc-link {
  color: #ff6fb5;
  text-decoration: none;
}
.dc-link:hover {
  text-decoration: underline;
}
`;

function Styles() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}

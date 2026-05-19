/**
 * app/bureau/checkout/[orderId]/page.tsx — Stripe Elements checkout.
 *
 * Server-renders the order header, fetches the Payment Intent's
 * client_secret server-side (admin SDK), then mounts the
 * CheckoutClient (Stripe Elements) for the in-page card form.
 *
 * Flow:
 *   1. Order created at /api/bureau/order with metadata.kind=bureau
 *   2. Client redirects here with the orderId
 *   3. This page reads the order doc + retrieves the PI
 *   4. <CheckoutClient> mounts Elements, visitor pays
 *   5. Stripe's `confirmPayment` redirects to
 *      /bureau/order/[orderId]/done
 *   6. Webhook flips status to paid + fires emails (parallel)
 *
 * Gracefully handles two missing-credentials cases:
 *   - Order doc has no stripePaymentIntentId (Stripe was 503 at
 *     creation): show clear "checkout disabled" state.
 *   - PUBLISHABLE_KEY missing client-side: CheckoutClient renders
 *     a "not configured" notice.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getOrder } from "lib/bureau/order";
import {
  EDITION_LABELS,
  PAPER_LABELS,
  SIZE_LABELS,
} from "lib/bureau/pricing";
import { getPaymentIntent } from "lib/stripe/server";

import CheckoutClient from "./CheckoutClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Checkout — Holoflow bureau",
  robots: { index: false, follow: false },
};

function siteOrigin(headers: Headers): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    headers.get("origin") ||
    `https://${headers.get("host") ?? "holoflow.co.uk"}`
  );
}

export default async function BureauCheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrder(orderId);
  if (!order) redirect("/bureau");

  const priceFormatted = (order.priceGbp / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  });
  const summary = `${SIZE_LABELS[order.sizeChoice]} · ${PAPER_LABELS[order.paperChoice]} · ${EDITION_LABELS[order.edition]}`;

  if (order.status !== "pending_payment") {
    return (
      <main className="bc-root">
        <div className="bc-card">
          <span className="bc-tag">{order.status}</span>
          <h1>Order {orderId}</h1>
          <p>{summary} · {priceFormatted}</p>
          <p className="bc-note">
            This order is past the checkout step. Reply to your
            confirmation email if something looks off.
          </p>
          <a href="/bureau" className="bc-link">
            ← Back to the bureau
          </a>
        </div>
        <BcStyles />
      </main>
    );
  }

  const piId = order.stripePaymentIntentId;
  if (!piId) {
    return (
      <main className="bc-root">
        <div className="bc-card">
          <h1>Checkout not yet available</h1>
          <p>{summary} · {priceFormatted}</p>
          <p className="bc-note">
            This order was created before Stripe was configured. The
            operator can take payment manually — write to{" "}
            <a href="mailto:hello@holoflow.co.uk">hello@holoflow.co.uk</a>{" "}
            quoting reference <code>{orderId}</code>.
          </p>
        </div>
        <BcStyles />
      </main>
    );
  }

  const pi = await getPaymentIntent(piId);
  if (!pi || !pi.clientSecret) {
    return (
      <main className="bc-root">
        <div className="bc-card">
          <h1>Couldn&rsquo;t reach Stripe</h1>
          <p>{summary} · {priceFormatted}</p>
          <p className="bc-note">
            The order exists but we couldn&rsquo;t retrieve the payment
            session. Reply to your confirmation email or write to{" "}
            <a href="mailto:hello@holoflow.co.uk">hello@holoflow.co.uk</a>{" "}
            quoting <code>{orderId}</code> + PI <code>{piId}</code>.
          </p>
        </div>
        <BcStyles />
      </main>
    );
  }

  // Compose the return URL server-side so the redirect after
  // confirmPayment lands on the right host (preview vs production).
  const reqHeaders = await headers();
  const origin = siteOrigin(reqHeaders);
  const returnUrl = `${origin}/bureau/order/${encodeURIComponent(orderId)}/done`;

  return (
    <main className="bc-root">
      <div className="bc-card">
        <span className="bc-tag">Checkout</span>
        <h1>Order {orderId}</h1>
        <p className="bc-summary">{summary}</p>
        <p className="bc-price">{priceFormatted}</p>

        <CheckoutClient
          clientSecret={pi.clientSecret}
          returnUrl={returnUrl}
        />

        <footer>
          <a href="/bureau" className="bc-link">
            ← Bureau
          </a>
          <span>Holoflow Studio · Print Bureau</span>
        </footer>
      </div>
      <BcStyles />
    </main>
  );
}

// Server Component — `<style jsx>` from styled-jsx is client-only and
// pulls in `client-only` which fails the build here. A plain <style>
// tag with dangerouslySetInnerHTML is the standard server-safe pattern
// for one-page static CSS in the App Router.
const BC_CSS = `
.bc-root {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a0a1a, #0a0a1a);
  color: rgba(255, 255, 255, 0.92);
  padding: 4rem 1.5rem;
  display: flex;
  justify-content: center;
}
.bc-card {
  max-width: 540px;
  width: 100%;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 111, 181, 0.25);
  border-radius: 0.75rem;
  padding: 2rem 1.75rem;
}
.bc-tag {
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
.bc-card h1 {
  font-size: 1.3rem;
  margin: 0 0 0.6rem;
}
.bc-summary {
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 0.3rem;
  font-size: 0.88rem;
}
.bc-price {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0 0 1.5rem;
  color: #ff6fb5;
}
.bc-note {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  margin: 1rem 0;
}
.bc-note code {
  background: rgba(255, 111, 181, 0.12);
  padding: 0.05rem 0.35rem;
  border-radius: 0.25rem;
}
.bc-note a {
  color: #ff6fb5;
}
.bc-link {
  color: #ff6fb5;
  text-decoration: none;
  font-size: 0.85rem;
}
.bc-link:hover {
  text-decoration: underline;
}
.bc-card footer {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}
`;

function BcStyles() {
  return <style dangerouslySetInnerHTML={{ __html: BC_CSS }} />;
}

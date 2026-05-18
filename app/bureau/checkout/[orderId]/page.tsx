/**
 * app/bureau/checkout/[orderId]/page.tsx — Stripe Elements checkout.
 *
 * Skeleton scaffold — when the bureau order route returns a client
 * secret, this page mounts Stripe Elements and confirms the payment.
 * On success it redirects to /bureau/order/[orderId]/done.
 *
 * # What's NOT here yet
 *
 *   - The actual Stripe Elements integration (needs @stripe/stripe-js
 *     + @stripe/react-stripe-js packages added to package.json)
 *   - The post-payment success page
 *   - Receipt download via Stripe's hosted receipt URL
 *
 * The structure is in place; wire the SDK when you decide to add it.
 * Foundation-phase intentionally avoids the npm install until the
 * full flow is being built end-to-end.
 */

import { redirect } from "next/navigation";

import { getOrder } from "lib/bureau/order";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Checkout — Holo-Flow bureau",
  robots: { index: false, follow: false },
};

export default async function BureauCheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrder(orderId);
  if (!order) redirect("/bureau");

  if (order.status !== "pending_payment") {
    return (
      <main className="min-h-screen bg-warm-black-950 px-6 py-16 font-mono text-chrome-200">
        <div className="mx-auto flex max-w-md flex-col gap-4">
          <h1 className="text-xl uppercase tracking-[0.18em] text-chrome-100">
            Order {orderId}
          </h1>
          <p className="text-sm text-chrome-300">
            Status: <span className="text-pink-200">{order.status}</span>
          </p>
          <p className="text-xs text-chrome-400">
            This order is past the checkout step. If something looks
            off, reply to your confirmation email.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-warm-black-950 px-6 py-16 font-mono text-chrome-200">
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <header className="flex flex-col gap-2 border-b border-warm-black-700 pb-4">
          <span className="chrome-label text-chrome-400">Checkout</span>
          <h1 className="text-xl uppercase tracking-[0.18em] text-chrome-100">
            Order {orderId}
          </h1>
          <p className="text-sm text-chrome-300">
            {order.sizeChoice} · {order.paperChoice} · {order.edition} ·{" "}
            <span className="text-pink-200">
              £{(order.priceGbp / 100).toFixed(2)}
            </span>
          </p>
        </header>

        <section className="rounded-sm border border-warm-black-700 bg-warm-black-900/40 p-6 text-sm text-chrome-300">
          <p className="font-semibold text-chrome-100">
            Stripe Elements checkout not yet wired
          </p>
          <p className="mt-3 text-xs text-chrome-400">
            The order is created and a Payment Intent exists; the
            client-side Stripe Elements form is the next piece to land.
            Until then, the operator can take payment manually using the
            Payment Intent id{" "}
            <code>{order.stripePaymentIntentId ?? "—"}</code>{" "}
            in the Stripe dashboard.
          </p>
        </section>

        <footer className="flex justify-between text-xs text-chrome-500">
          <a href="/bureau" className="hover:text-pink-200">
            ← Bureau
          </a>
          <span>Holoflow Studio · Print Bureau</span>
        </footer>
      </div>
    </main>
  );
}

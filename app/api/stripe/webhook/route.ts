import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { renderOrderEmailHtml, sendOrderEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = getStripe();

  if (!secret || !stripe) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Signature verification failed: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handlePaidSession(session);
  }

  return NextResponse.json({ received: true });
}

async function handlePaidSession(session: Stripe.Checkout.Session) {
  const email = session.customer_details?.email;
  const name = session.customer_details?.name ?? null;
  const slug = session.metadata?.slug ?? "unknown";
  const code = session.metadata?.code ?? "CP-???";
  const amountGBP = Math.round((session.amount_total ?? 0) / 100);
  const orderRef = session.id.slice(-8).toUpperCase();

  if (!email) {
    console.warn(`[webhook] session ${session.id} has no customer email; skipping confirmation`);
    return;
  }

  const html = renderOrderEmailHtml({
    customerName: name,
    workTitle: (session.metadata?.title as string) ?? slug,
    workCode: code,
    amountGBP,
    orderRef,
  });

  const bcc = process.env.ORDER_NOTIFICATION_EMAIL || undefined;

  const result = await sendOrderEmail({
    to: email,
    bcc,
    subject: `Chrono-Protocol · Acquisition of ${code}`,
    html,
  });

  if (!result.sent) {
    console.error(`[webhook] order email failed for session ${session.id}: ${result.reason}`);
  }
}

import "server-only";

/**
 * lib/bureau/order-emails.ts — Resend-backed order notifications.
 *
 * Two emails per paid order:
 *
 *  1. Customer receipt — confirms the order, gives the reference id
 *     + summary + the "what happens next" beats. Mirrors the tone of
 *     the /bureau/order/[orderId]/done page so the visitor sees the
 *     same brand voice in their inbox.
 *
 *  2. Operator notification — to the studio mailbox so the operator
 *     can pull the order into the print queue. One line per order:
 *     ref, size + paper + edition, customer name + ship-to, price.
 *
 * Both are best-effort: if RESEND_API_KEY isn't set, the functions
 * log and return without throwing. The order doc on Firestore is
 * the canonical source of truth either way.
 *
 * Webhook integration point: `app/api/stripe/webhook/route.ts`
 * should call both `sendCustomerReceipt(order)` and
 * `sendOperatorNotification(order)` inside its
 * `payment_intent.succeeded` handler after `transitionStatus(...,
 * "paid", ...)` returns.
 */

import { createLogger, errToObject } from "lib/log";

import {
  EDITION_LABELS,
  PAPER_LABELS,
  SIZE_LABELS,
} from "./pricing";
import type { Order } from "./types";

const log = createLogger("bureau.order-emails");

function fromAddress(): string {
  return (
    process.env.RESEND_FROM_ADDRESS ||
    "Holoflow Bureau <bureau@holoflow.co.uk>"
  );
}

function operatorAddress(): string {
  return (
    process.env.BUREAU_OPERATOR_EMAIL ||
    process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ||
    "dimona@holoflow.co.uk"
  );
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://holoflow.co.uk";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function send(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    log.warn("resend not configured — email not sent", { to: opts.to });
    return { ok: false, error: "resend_not_configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      log.warn("resend non-2xx", { status: res.status, body: body.slice(0, 240) });
      return { ok: false, error: `resend_${res.status}` };
    }
    const json = (await res.json()) as { id?: string };
    return { ok: true, id: json.id };
  } catch (err) {
    log.error("resend threw", { err: errToObject(err) });
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function sendCustomerReceipt(
  order: Order,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!order.customerEmail) {
    return { ok: false, error: "no_customer_email" };
  }
  const formattedPrice = (order.priceGbp / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  });
  const sizeLabel = SIZE_LABELS[order.sizeChoice];
  const paperLabel = PAPER_LABELS[order.paperChoice];
  const editionLabel = EDITION_LABELS[order.edition];
  const doneUrl = `${siteUrl()}/bureau/order/${encodeURIComponent(order.id)}/done`;

  const text = [
    `Thank you for the order.`,
    ``,
    `Reference: ${order.id}`,
    `Print:     ${sizeLabel} · ${editionLabel}`,
    `Paper:     ${paperLabel}`,
    `Total:     ${formattedPrice}`,
    ``,
    `What happens next`,
    `-----------------`,
    `We print on demand from the studio's Canon PRO-1100 — expect`,
    `dispatch within 3 business days (5 for unique editions).`,
    `You'll get a tracking email when the parcel leaves the studio.`,
    `Each print ships with a 6x4" provenance card with a QR linking`,
    `to the artwork's HoloWalk anchor (when the AR side of the loop`,
    `is live in your area).`,
    ``,
    `Receipt page: ${doneUrl}`,
    ``,
    `Questions? Reply to this email or write to hello@holoflow.co.uk.`,
    ``,
    `— Holoflow Studio`,
  ].join("\n");

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, sans-serif; color: #2a1430; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 1.4rem; margin: 0 0 12px;">Thank you for the order</h1>
      <p style="color: #6b4974; font-size: 0.9rem; margin: 0 0 24px;">
        Reference <code style="background: #faecf3; padding: 2px 6px; border-radius: 3px;">${escapeHtml(order.id)}</code>
      </p>

      <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
        <tr>
          <td style="padding: 8px 0; color: #8a6196; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; width: 30%;">Print</td>
          <td style="padding: 8px 0; font-weight: 600;">${escapeHtml(sizeLabel)} · ${escapeHtml(editionLabel)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #8a6196; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em;">Paper</td>
          <td style="padding: 8px 0; font-weight: 600;">${escapeHtml(paperLabel)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #8a6196; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em;">Total</td>
          <td style="padding: 8px 0; font-weight: 600;">${escapeHtml(formattedPrice)}</td>
        </tr>
      </table>

      <h2 style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; color: #c2378c; margin: 0 0 8px;">What happens next</h2>
      <ol style="padding-left: 1.2rem; margin: 0 0 24px; line-height: 1.5; font-size: 0.92rem;">
        <li>We print on demand from the studio's Canon PRO-1100 &mdash; expect dispatch within 3 business days for open + limited editions, 5 for unique.</li>
        <li>You'll get a shipping email with a Royal Mail tracking number when the parcel leaves the studio.</li>
        <li>Each print ships with a 6&times;4&rdquo; provenance card carrying a QR code that links to the artwork's HoloWalk anchor.</li>
      </ol>

      <p style="margin: 0 0 24px;">
        <a href="${doneUrl}" style="display: inline-block; background: #c2378c; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">View your order</a>
      </p>

      <p style="color: #6b4974; font-size: 0.78rem; margin: 0; border-top: 1px solid #f3e2ec; padding-top: 16px;">
        Questions? Reply to this email or write to <a href="mailto:hello@holoflow.co.uk" style="color: #c2378c;">hello@holoflow.co.uk</a>.
      </p>
    </div>
  `;

  return send({
    to: order.customerEmail,
    subject: `Holoflow Studio · order confirmed (${formattedPrice})`,
    text,
    html,
    replyTo: "hello@holoflow.co.uk",
  });
}

export async function sendOperatorNotification(
  order: Order,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const formattedPrice = (order.priceGbp / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  });
  const sizeLabel = SIZE_LABELS[order.sizeChoice];
  const paperLabel = PAPER_LABELS[order.paperChoice];
  const editionLabel = EDITION_LABELS[order.edition];
  const adminUrl = `${siteUrl()}/admin/bureau`;
  const a = order.shippingAddress;
  const shipTo = a
    ? [a.name ?? "", a.line1, a.line2 ?? "", a.city, a.region ?? "", a.postcode, a.country]
        .filter(Boolean)
        .join(", ")
    : "(none provided — Stripe Checkout fallback)";

  const text = [
    `NEW BUREAU ORDER · ${formattedPrice}`,
    ``,
    `Ref:         ${order.id}`,
    `Print:       ${sizeLabel} · ${paperLabel} · ${editionLabel}`,
    `Image:       ${order.imageId}`,
    `Customer:    ${order.customerName ?? "(no name)"} <${order.customerEmail}>`,
    `Ship-to:     ${shipTo}`,
    `Stripe PI:   ${order.stripePaymentIntentId ?? "(pending)"}`,
    ``,
    `Pick it up at ${adminUrl}.`,
  ].join("\n");

  const html = `
    <div style="font-family: ui-monospace, SFMono-Regular, monospace; color: #1a0a1a; max-width: 600px; padding: 16px; font-size: 0.85rem; line-height: 1.5;">
      <h2 style="font-size: 1rem; margin: 0 0 12px; color: #c2378c;">NEW BUREAU ORDER · ${escapeHtml(formattedPrice)}</h2>
      <table cellpadding="2" cellspacing="0">
        <tr><td style="color: #6b4974; padding-right: 12px;">Ref</td><td><code>${escapeHtml(order.id)}</code></td></tr>
        <tr><td style="color: #6b4974; padding-right: 12px;">Print</td><td>${escapeHtml(sizeLabel)} · ${escapeHtml(paperLabel)} · ${escapeHtml(editionLabel)}</td></tr>
        <tr><td style="color: #6b4974; padding-right: 12px;">Image</td><td><code>${escapeHtml(order.imageId)}</code></td></tr>
        <tr><td style="color: #6b4974; padding-right: 12px;">Customer</td><td>${escapeHtml(order.customerName ?? "(no name)")} &lt;<a href="mailto:${escapeHtml(order.customerEmail)}">${escapeHtml(order.customerEmail)}</a>&gt;</td></tr>
        <tr><td style="color: #6b4974; padding-right: 12px;">Ship-to</td><td>${escapeHtml(shipTo)}</td></tr>
        <tr><td style="color: #6b4974; padding-right: 12px;">Stripe PI</td><td><code>${escapeHtml(order.stripePaymentIntentId ?? "(pending)")}</code></td></tr>
      </table>
      <p style="margin: 16px 0 0;"><a href="${adminUrl}">Open in /admin/bureau →</a></p>
    </div>
  `;

  return send({
    to: operatorAddress(),
    subject: `[bureau] ${formattedPrice} · ${sizeLabel} ${editionLabel} for ${order.customerEmail}`,
    text,
    html,
  });
}

/**
 * lib/printfarm/manual.ts — manual operator-email forwarder.
 *
 * The default print-farm provider for the v1 engine. Doesn't call any
 * third-party API; instead emails the operator with a packed-up order
 * summary and the customer's attachments (as Vercel Blob links the
 * operator can sign + download). Operator then forwards to whichever
 * farm they've chosen for that specific order, by hand.
 *
 * The dashboard supports marking the order as "sent-to-farm" once
 * the operator has actually forwarded, which closes the loop.
 */

import "server-only";

import { createLogger, errToObject } from "lib/log";

import type { PrintfilesOrder } from "lib/printfiles/types";

import type { ForwardResult, PrintfarmProviderModule } from "./_base";

const log = createLogger("printfarm.manual");

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_OPERATOR = "dimona@holoflow.co.uk";
const DEFAULT_FROM = "Holo-Flow Print Files <printfiles@holoflow.co.uk>";

function operatorEmail(): string {
  return process.env.PRINTFILES_OPERATOR_EMAIL ?? DEFAULT_OPERATOR;
}

function fromAddress(): string {
  return process.env.PRINTFILES_INBOX_EMAIL
    ? `Holo-Flow Print Files <${process.env.PRINTFILES_INBOX_EMAIL}>`
    : DEFAULT_FROM;
}

function buildOperatorPacket(order: PrintfilesOrder): { text: string; html: string } {
  const files = order.attachments
    .map((a) => {
      const sizeMb = (a.sizeBytes / 1024 / 1024).toFixed(2);
      const bbox = a.validation.boundingBoxMm
        ? `${a.validation.boundingBoxMm.x.toFixed(1)} × ${a.validation.boundingBoxMm.y.toFixed(1)} × ${a.validation.boundingBoxMm.z.toFixed(1)}`
        : "—";
      const tris = a.validation.triangleCount?.toLocaleString() ?? "—";
      return `${a.filename}
  Size: ${sizeMb} MB
  Format: ${a.inferredKind.toUpperCase()}
  Triangles: ${tris}
  Bounding box (units as sent): ${bbox}
  Validation: ${a.validation.ok ? "OK" : a.validation.issues.join(", ")}
  Blob: ${a.blobUrl}`;
    })
    .join("\n\n");

  const text = `New print-files order — manual provider.

Order: ${order.id}
Customer: ${order.sender.name ? order.sender.name + " " : ""}<${order.sender.address}>
Received: ${order.receivedAt}

Subject:
${order.subject}

Body:
${order.bodyText || "(empty)"}

Files (${order.attachments.length}):
${files}

Dashboard:
https://holoflow.co.uk/admin/printfiles/${order.id}

Forward the file(s) to your chosen print farm, then mark this order
"sent-to-farm" in the dashboard with the farm name + their order id.`;

  const filesHtml = order.attachments
    .map((a) => {
      const sizeMb = (a.sizeBytes / 1024 / 1024).toFixed(2);
      const bbox = a.validation.boundingBoxMm
        ? `${a.validation.boundingBoxMm.x.toFixed(1)} × ${a.validation.boundingBoxMm.y.toFixed(1)} × ${a.validation.boundingBoxMm.z.toFixed(1)}`
        : "&mdash;";
      const tris = a.validation.triangleCount?.toLocaleString() ?? "&mdash;";
      return `<li style="margin-bottom: 12px;">
<strong><code>${escapeHtml(a.filename)}</code></strong><br/>
<small>Size: ${sizeMb} MB &middot; Format: ${a.inferredKind.toUpperCase()} &middot; Triangles: ${tris} &middot; BBox: ${bbox}</small><br/>
<small>Validation: ${a.validation.ok ? "<span style='color:green'>OK</span>" : "<span style='color:#c33'>" + a.validation.issues.join(", ") + "</span>"}</small><br/>
<a href="${escapeHtml(a.blobUrl)}">Download from Blob</a>
</li>`;
    })
    .join("");

  const html = `<p><strong>New print-files order &mdash; manual provider.</strong></p>
<p><strong>Order:</strong> ${order.id}<br/>
<strong>Customer:</strong> ${order.sender.name ? escapeHtml(order.sender.name) + " " : ""}&lt;${escapeHtml(order.sender.address)}&gt;<br/>
<strong>Received:</strong> ${escapeHtml(order.receivedAt)}</p>
<p><strong>Subject:</strong> ${escapeHtml(order.subject)}</p>
<p><strong>Body:</strong></p>
<pre style="white-space: pre-wrap; background: #f6f6f6; padding: 8px; border-radius: 4px;">${escapeHtml(order.bodyText || "(empty)")}</pre>
<p><strong>Files (${order.attachments.length}):</strong></p>
<ul>${filesHtml}</ul>
<p><a href="https://holoflow.co.uk/admin/printfiles/${order.id}">Open in dashboard</a></p>
<p style="color:#555;font-size:13px;">Forward the file(s) to your chosen print farm, then mark this order "sent-to-farm" in the dashboard with the farm name + their order id.</p>`;

  return { text, html };
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function forwardOrder(order: PrintfilesOrder): Promise<ForwardResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "manual print-farm forwarder needs RESEND_API_KEY to email the operator.",
    );
  }
  const { text, html } = buildOperatorPacket(order);
  const payload = {
    from: fromAddress(),
    to: [operatorEmail()],
    subject: `[printfiles] New order ${order.id} — ${order.attachments.length} file(s) from ${order.sender.address}`,
    text,
    html,
  };

  log.info("forwarding to operator", {
    orderId: order.id,
    to: operatorEmail(),
  });
  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `printfarm-manual:${order.id}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    log.error("operator-packet send failed", {
      orderId: order.id,
      status: res.status,
      detail: detail.slice(0, 400),
    });
    throw new Error(
      `manual provider operator-send failed (${res.status})`,
    );
  }
  const data = (await res.json().catch(() => ({}))) as { id?: unknown };
  return {
    externalId: typeof data.id === "string" ? data.id : null,
    trackingUrl: null,
    notes: `Operator emailed at ${operatorEmail()} with order packet.`,
    newStatus: "queued",
  };
}

export const manualProvider: PrintfarmProviderModule = {
  id: "manual",
  label: "Manual operator forward",
  envRequirements: [
    "RESEND_API_KEY",
    "PRINTFILES_OPERATOR_EMAIL (optional; defaults to dimona@holoflow.co.uk)",
  ],
  forwardOrder,
};

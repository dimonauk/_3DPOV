/**
 * lib/printfiles/reply.ts — gracious reply via Resend.
 *
 * Sends the customer a confirmation email after their print files
 * land. Threads back to the original message via In-Reply-To +
 * References headers, so the customer's mail client groups our reply
 * with their send.
 *
 * Idempotency: Resend's `Idempotency-Key` header dedupes by key for
 * 24h. We key on `printfiles-reply:<orderId>` so a webhook replay or
 * retry doesn't double-reply.
 *
 * The reply intentionally does NOT include a payment link or quote
 * yet — v1 promises "we'll send a quote shortly". When a specific
 * print-farm provider's quote API is wired (slant3d, treatstock,
 * etc.), the reply will carry the quote inline.
 */

import "server-only";

import { createLogger, errToObject } from "lib/log";

import type { PrintfilesOrder } from "./types";

const log = createLogger("printfiles.reply");

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "Holo-Flow Print Files <printfiles@holoflow.co.uk>";
const DEFAULT_OPERATOR = "dimona@holoflow.co.uk";

export type GraciousReplyResult = { id: string };

function buildBody(order: PrintfilesOrder): { text: string; html: string } {
  const operator = process.env.PRINTFILES_OPERATOR_EMAIL ?? DEFAULT_OPERATOR;
  const fileLines = order.attachments
    .map((a) => {
      const size = (a.sizeBytes / 1024 / 1024).toFixed(2);
      return `  • ${a.filename} (${size} MB, ${a.inferredKind.toUpperCase()})`;
    })
    .join("\n");

  const filesHtml = order.attachments
    .map((a) => {
      const size = (a.sizeBytes / 1024 / 1024).toFixed(2);
      return `<li><code>${escapeHtml(a.filename)}</code> &mdash; ${size} MB &middot; ${a.inferredKind.toUpperCase()}</li>`;
    })
    .join("");

  const text = `Hi${order.sender.name ? " " + order.sender.name : ""},

Thank you — we received your print files. Here's what landed:

${fileLines}

Order id: ${order.id}
Sent: ${new Date(order.receivedAt).toUTCString()}

Next steps:
  1. We review the file (manifold check, scale check).
  2. We quote — usually within 24h on weekdays.
  3. You confirm + pay; we forward to our print partner; they
     print and ship directly to you.

Lead time is usually 5–10 working days from quote confirmation,
depending on size and material.

If you need to add notes (preferred material, colour, finish,
delivery address), reply to this email — it threads back to your
order automatically.

If you need to cancel or have any questions, just reply.

— Holo-Flow Studio
   ${operator}
`;

  const html = `<!doctype html><html><body style="font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 24px auto; color: #1a1a1a; line-height: 1.5;">
<p>Hi${order.sender.name ? " " + escapeHtml(order.sender.name) : ""},</p>
<p>Thank you &mdash; we received your print files. Here's what landed:</p>
<ul>${filesHtml}</ul>
<p style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; color: #555;">
Order id: <strong>${order.id}</strong><br/>
Sent: ${escapeHtml(new Date(order.receivedAt).toUTCString())}
</p>
<p><strong>Next steps:</strong></p>
<ol>
<li>We review the file (manifold check, scale check).</li>
<li>We quote &mdash; usually within 24h on weekdays.</li>
<li>You confirm + pay; we forward to our print partner; they print and ship directly to you.</li>
</ol>
<p>Lead time is usually 5&ndash;10 working days from quote confirmation, depending on size and material.</p>
<p>If you need to add notes (preferred material, colour, finish, delivery address), reply to this email &mdash; it threads back to your order automatically.</p>
<p>If you need to cancel or have any questions, just reply.</p>
<p>&mdash; Holo-Flow Studio<br/><a href="mailto:${escapeHtml(operator)}">${escapeHtml(operator)}</a></p>
</body></html>`;

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

export async function sendGraciousReply(
  order: PrintfilesOrder,
): Promise<GraciousReplyResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not set — gracious reply cannot send. " +
        "Set it in Vercel project env (Production + Preview).",
    );
  }

  const from = process.env.PRINTFILES_INBOX_EMAIL
    ? `Holo-Flow Print Files <${process.env.PRINTFILES_INBOX_EMAIL}>`
    : DEFAULT_FROM;

  const { text, html } = buildBody(order);

  // Thread back to the customer's original message.
  const headers: Record<string, string> = {};
  if (order.messageId) {
    headers["In-Reply-To"] = order.messageId;
    headers["References"] = order.messageId;
  }

  const payload = {
    from,
    to: [order.sender.address],
    reply_to: from,
    subject: `Re: ${order.subject || "Your print files"} — order ${order.id}`,
    text,
    html,
    headers,
  };

  log.info("sending gracious reply", {
    orderId: order.id,
    to: order.sender.address,
  });

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `printfiles-reply:${order.id}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    log.error("resend send failed", {
      orderId: order.id,
      status: res.status,
      detail: detail.slice(0, 400),
    });
    throw new Error(
      `Resend send failed (${res.status} ${res.statusText})${detail ? `: ${detail.slice(0, 200)}` : ""}`,
    );
  }

  const data = (await res.json().catch(() => ({}))) as { id?: unknown };
  if (typeof data.id !== "string" || data.id.length === 0) {
    throw new Error("Resend response missing id");
  }
  log.info("gracious reply sent", { orderId: order.id, resendId: data.id });
  return { id: data.id };
}

/**
 * For files that were rejected (size, validation), send a different
 * reply explaining what happened. The order isn't created in this
 * path — we just need to tell the sender.
 */
export async function sendRejectionReply(args: {
  to: string;
  toName: string | null;
  subject: string;
  messageId: string | null;
  reason: "too-large" | "unsupported-format" | "rate-limited" | "spam";
  maxMb: number;
}): Promise<GraciousReplyResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  const from = process.env.PRINTFILES_INBOX_EMAIL
    ? `Holo-Flow Print Files <${process.env.PRINTFILES_INBOX_EMAIL}>`
    : DEFAULT_FROM;
  const operator = process.env.PRINTFILES_OPERATOR_EMAIL ?? DEFAULT_OPERATOR;

  const reasons: Record<typeof args.reason, string> = {
    "too-large": `your file is over our current ${args.maxMb} MB cap. Email us at ${operator} with a WeTransfer / Google Drive link and we'll take it from there.`,
    "unsupported-format":
      "we only accept .stl, .glb, .gltf, .3mf, and .obj files. Send your file in one of those formats and we'll process it immediately.",
    "rate-limited":
      "you've hit our per-day intake limit (10 files / day). Please try again tomorrow, or email us directly if you need to send more.",
    spam: "the message tripped our spam filters. If this is a real order, email us directly and we'll look into it.",
  };

  const text = `Hi${args.toName ? " " + args.toName : ""},

Thanks for sending — but ${reasons[args.reason]}

— Holo-Flow Studio
   ${operator}
`;
  const html = `<p>Hi${args.toName ? " " + escapeHtml(args.toName) : ""},</p>
<p>Thanks for sending &mdash; but ${escapeHtml(reasons[args.reason])}</p>
<p>&mdash; Holo-Flow Studio<br/><a href="mailto:${escapeHtml(operator)}">${escapeHtml(operator)}</a></p>`;

  const headers: Record<string, string> = {};
  if (args.messageId) {
    headers["In-Reply-To"] = args.messageId;
    headers["References"] = args.messageId;
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `printfiles-reject:${args.to}:${args.reason}`,
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      reply_to: from,
      subject: `Re: ${args.subject || "Your print files"}`,
      text,
      html,
      headers,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    log.error("resend rejection-send failed", {
      to: args.to,
      reason: args.reason,
      status: res.status,
      detail: detail.slice(0, 400),
    });
    throw new Error(`Resend send failed (${res.status})`);
  }
  const data = (await res.json().catch(() => ({}))) as { id?: unknown };
  if (typeof data.id !== "string") throw new Error("Resend response missing id");
  log.info("rejection reply sent", {
    to: args.to,
    reason: args.reason,
    resendId: data.id,
  });
  return { id: data.id };
}

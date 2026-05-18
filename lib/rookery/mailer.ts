/**
 * Rookery transactional mailer.
 *
 * Thin wrapper around whichever provider EMAIL_PROVIDER points at.
 * Default: "resend" (small studio, low volume, no SDK dependency —
 * just fetch). Alternative: "smtp" (stub — not wired yet).
 *
 * Required env:
 *   EMAIL_PROVIDER     "resend" (default) | "smtp"
 *   EMAIL_FROM         e.g. "Holo-Flow Studio <noreply@holoflow.co.uk>"
 *                      (defaults to that string when unset)
 *   EMAIL_REPLY_TO     e.g. "Dimona <contact@holoflow.co.uk>"
 *                      (defaults to that string when unset)
 *
 * Resend path also needs:
 *   RESEND_API_KEY     a Resend project API key
 *
 * SMTP path will eventually need:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 *   (currently throws — implementation pending an SMTP client choice)
 *
 * No npm packages are required; native fetch handles Resend's REST API.
 */

import {
  getRookeryEmail,
  type RookeryEmail,
  type RookeryEmailSlug,
} from "./emails";

const DEFAULT_FROM = "Holo-Flow Studio <noreply@holoflow.co.uk>";
const DEFAULT_REPLY_TO = "Dimona <contact@holoflow.co.uk>";
const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type SendResult = { id: string };

type MailerProvider = "resend" | "smtp";

function resolveProvider(): MailerProvider {
  const raw = (process.env.EMAIL_PROVIDER ?? "").trim().toLowerCase();
  if (raw === "smtp") return "smtp";
  // Default to "resend" when unset OR explicitly set to "resend".
  if (raw === "" || raw === "resend") return "resend";
  throw new Error(
    `Unknown EMAIL_PROVIDER "${raw}". Set to "resend" or "smtp".`,
  );
}

/**
 * Trivial {token} substitution. Pass-through when no variables are
 * provided. Used for future personalisation ({firstName} etc.); not
 * exercised by the three canned onboarding emails yet.
 */
function applyVariables(
  source: string,
  variables: Record<string, string> | undefined,
): string {
  if (!variables) return source;
  let out = source;
  for (const [key, value] of Object.entries(variables)) {
    const safeKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`\\{${safeKey}\\}`, "g"), value);
  }
  return out;
}

// Pull the bare address out of "Display Name <addr@host>" or pass
// through if the value is already a bare address. Used for the
// List-Unsubscribe mailto: target.
function bareAddress(value: string): string {
  const m = /<([^>]+)>/.exec(value);
  return m ? m[1]! : value;
}

function buildPayload(
  to: string,
  email: RookeryEmail,
  variables: Record<string, string> | undefined,
) {
  // The unsubscribe address defaults to the reply-to address so a
  // visitor's "unsubscribe" gesture lands in the same inbox the
  // operator already reads. EMAIL_UNSUBSCRIBE_ADDRESS overrides
  // when a dedicated mailbox is wired.
  const unsubSource =
    process.env.EMAIL_UNSUBSCRIBE_ADDRESS ||
    process.env.EMAIL_REPLY_TO ||
    DEFAULT_REPLY_TO;
  const unsubBare = bareAddress(unsubSource);
  return {
    from: process.env.EMAIL_FROM || DEFAULT_FROM,
    reply_to: process.env.EMAIL_REPLY_TO || DEFAULT_REPLY_TO,
    to: [to],
    subject: applyVariables(email.subject, variables),
    text: applyVariables(email.text, variables),
    html: applyVariables(email.html, variables),
    // RFC 2369 + RFC 8058. List-Unsubscribe gives a mailto target
    // every modern mail client renders as an "Unsubscribe" button;
    // List-Unsubscribe-Post advertises that we honour one-click
    // unsubscribe gestures (Gmail / Yahoo bulk-sender requirements
    // since Feb 2024). The mailto goes to the operator inbox; the
    // operator is responsible for adding the address to a
    // suppression list and never re-sending.
    headers: {
      "List-Unsubscribe": `<mailto:${unsubBare}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

async function sendViaResend(
  payload: ReturnType<typeof buildPayload>,
  idempotencyKey?: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not set. Either set it or switch EMAIL_PROVIDER.",
    );
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  // Resend's Idempotency-Key header makes retries safe — duplicate
  // sends with the same key inside 24h return the original send id
  // instead of dispatching again. Without it a retry / webhook
  // replay / double-click on a "send" button could double-mail the
  // recipient. The caller picks the key (typically a hash of slug
  // + recipient address so a deliberate re-send is a clean miss).
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Resend send failed (${res.status} ${res.statusText})${
        detail ? `: ${detail}` : ""
      }`,
    );
  }

  const data = (await res.json().catch(() => ({}))) as { id?: unknown };
  if (typeof data.id !== "string" || data.id.length === 0) {
    throw new Error("Resend response missing id.");
  }
  return { id: data.id };
}

async function sendViaSmtp(
  _payload: ReturnType<typeof buildPayload>,
): Promise<SendResult> {
  // Intentionally unimplemented. Switch EMAIL_PROVIDER back to "resend"
  // for now, or wire an SMTP client (nodemailer is the obvious pick).
  throw new Error(
    "SMTP transport not implemented yet — set EMAIL_PROVIDER=resend.",
  );
}

export type SendRookeryEmailOptions = {
  /** Token substitutions for future personalisation. */
  variables?: Record<string, string>;
  /** Resend Idempotency-Key — duplicate sends with the same key
   *  within 24h return the original send id instead of dispatching
   *  again. The route layer picks a stable key (e.g. hash of slug +
   *  recipient) so retries don't double-mail. */
  idempotencyKey?: string;
};

/**
 * Send one of the three canned Rookery onboarding emails to `to`.
 * Pass-through `variables` for future personalisation tokens; not
 * used by the current email bodies. Pass `idempotencyKey` to make
 * the send safe to retry (Resend dedups by key for 24h).
 */
export async function sendRookeryEmail(
  to: string,
  emailSlug: RookeryEmailSlug,
  options: SendRookeryEmailOptions = {},
): Promise<SendResult> {
  const email = getRookeryEmail(emailSlug);
  if (!email) {
    throw new Error(`Unknown rookery email slug "${emailSlug}".`);
  }

  const payload = buildPayload(to, email, options.variables);
  const provider = resolveProvider();

  if (provider === "smtp") return sendViaSmtp(payload);
  return sendViaResend(payload, options.idempotencyKey);
}

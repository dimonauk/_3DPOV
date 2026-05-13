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

function buildPayload(
  to: string,
  email: RookeryEmail,
  variables: Record<string, string> | undefined,
) {
  return {
    from: process.env.EMAIL_FROM || DEFAULT_FROM,
    reply_to: process.env.EMAIL_REPLY_TO || DEFAULT_REPLY_TO,
    to: [to],
    subject: applyVariables(email.subject, variables),
    text: applyVariables(email.text, variables),
    html: applyVariables(email.html, variables),
  };
}

async function sendViaResend(payload: ReturnType<typeof buildPayload>) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not set. Either set it or switch EMAIL_PROVIDER.",
    );
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
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

/**
 * Send one of the three canned Rookery onboarding emails to `to`.
 * Pass-through `variables` for future personalisation tokens; not
 * used by the current email bodies.
 */
export async function sendRookeryEmail(
  to: string,
  emailSlug: RookeryEmailSlug,
  variables?: Record<string, string>,
): Promise<SendResult> {
  const email = getRookeryEmail(emailSlug);
  if (!email) {
    throw new Error(`Unknown rookery email slug "${emailSlug}".`);
  }

  const payload = buildPayload(to, email, variables);
  const provider = resolveProvider();

  if (provider === "smtp") return sendViaSmtp(payload);
  return sendViaResend(payload);
}

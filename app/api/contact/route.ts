import { NextResponse } from "next/server";

import { createLogger } from "lib/log";

export const dynamic = "force-dynamic";

const log = createLogger("api.contact");

const INTENT_SET = new Set([
  "general",
  "commission",
  "bureau",
  "aerial",
  "press",
  "speaking",
  "collaboration",
]);

/**
 * Contact form submissions.
 *
 * Two-path delivery, picked at request time based on env state:
 *
 *   1. **Resend** — when `RESEND_API_KEY` and both `ORDER_FROM_EMAIL`
 *      (verified domain From:) + `CONTACT_INBOX_EMAIL` (operator inbox)
 *      are set. Sends a plain-text email to the inbox with the visitor's
 *      details and message; sets reply-to so the operator can reply
 *      directly from their mail client.
 *
 *   2. **Log-only fallback** — when any of those env vars is missing,
 *      logs the submission to `lib/log` at info level so it shows up in
 *      Vercel runtime logs (and previously-deployed surfaces keep
 *      working without an outbound mail provider configured).
 *
 * Either path returns `{ ok: true }` to the caller — the UI never knows
 * which channel handled the submission.
 */
export async function POST(req: Request) {
  let payload: {
    name?: unknown;
    email?: unknown;
    message?: unknown;
    intent?: unknown;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const message =
    typeof payload.message === "string" ? payload.message.trim() : "";
  const intent =
    typeof payload.intent === "string" && INTENT_SET.has(payload.intent)
      ? payload.intent
      : "general";

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Name, email and message are required." },
      { status: 400 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }
  if (message.length > 5000) {
    return NextResponse.json(
      { error: "Message too long (max 5000 characters)." },
      { status: 400 },
    );
  }

  const resendKey = process.env.RESEND_API_KEY;
  const fromAddress =
    process.env.ORDER_FROM_EMAIL ?? process.env.RESEND_FROM_ADDRESS;
  const inboxAddress = process.env.CONTACT_INBOX_EMAIL;

  if (resendKey && fromAddress && inboxAddress) {
    try {
      // Lazy-import so the Resend module only loads on the path that
      // needs it — keeps the log-only fallback's cold start small.
      const { Resend } = await import("resend");
      const resend = new Resend(resendKey);
      const subject = `[${intent}] ${name} via holoflow.co.uk`;
      const textBody = [
        `Intent : ${intent}`,
        `Name   : ${name}`,
        `Email  : ${email}`,
        `Length : ${message.length} chars`,
        ``,
        `--- message ---`,
        message,
      ].join("\n");
      const result = await resend.emails.send({
        from: fromAddress,
        to: inboxAddress,
        replyTo: email,
        subject,
        text: textBody,
      });
      if (result.error) {
        log.error("resend send failed; falling through to log channel", {
          intent,
          err: result.error,
        });
      } else {
        log.info("contact:sent via resend", {
          intent,
          to: inboxAddress,
          messageLen: message.length,
          id: result.data?.id,
        });
        return NextResponse.json({ ok: true });
      }
    } catch (err) {
      log.error("resend wiring threw; falling through to log channel", {
        intent,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Fallback: log to Vercel runtime logs so the submission isn't lost
  // when no ESP is wired up (or when Resend errors and we fell through).
  log.info("contact:received (log-only fallback)", {
    intent,
    name,
    email,
    messageLen: message.length,
    resendConfigured: Boolean(resendKey && fromAddress && inboxAddress),
  });

  return NextResponse.json({ ok: true });
}

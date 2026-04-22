import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const INTENT_SET = new Set(["general", "commission", "bureau", "press"]);

/**
 * Contact form submissions. Today: validates + logs to console.
 * Tomorrow: forward to an inbox via Resend (or whatever ESP is chosen).
 * UI contract is stable; swap the body below.
 *
 * Example follow-up wiring (Resend):
 *   await resend.emails.send({
 *     from: process.env.ORDER_FROM_EMAIL!,
 *     to: "contact@holoflow.co.uk",
 *     subject: `[${intent}] ${name}`,
 *     html: ...
 *   });
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

  console.log(
    `[contact] intent=${intent} name=${name} email=${email} message_len=${message.length}`,
  );

  return NextResponse.json({ ok: true });
}

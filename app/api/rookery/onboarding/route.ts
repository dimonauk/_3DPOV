import { NextResponse } from "next/server";

import {
  isRookeryEmailSlug,
  type RookeryEmailSlug,
} from "lib/rookery/emails";
import { sendRookeryEmail } from "lib/rookery/mailer";

export const dynamic = "force-dynamic";

/**
 * Rookery onboarding email trigger.
 *
 * POST { email: string, slug: "welcome" | "orient" | "perch" }
 *  -> 200 { ok: true, id: string }   on success
 *  -> 400 { error: string }          on validation failure
 *  -> 500 { error: string }          on provider/config failure
 *
 * This is the route the Stripe checkout-success webhook will eventually
 * hit for the Day 0 email. Days 3 and 7 need a job runner (see README).
 * For now the route is callable directly so it can be smoke-tested with
 * curl before Stripe is wired.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Payload = {
  email?: unknown;
  slug?: unknown;
};

export async function POST(req: Request) {
  if (!process.env.EMAIL_PROVIDER && !process.env.RESEND_API_KEY) {
    // Either the provider is set, or Resend is implicitly the provider
    // and at minimum its API key needs to be present. If neither is
    // configured at all, this route has nothing to send through.
    return NextResponse.json(
      {
        error:
          "Mail transport not configured. Set EMAIL_PROVIDER (and the matching provider env, e.g. RESEND_API_KEY).",
      },
      { status: 500 },
    );
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const slugRaw = payload.slug;

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  if (!isRookeryEmailSlug(slugRaw)) {
    return NextResponse.json(
      { error: "Invalid slug. Must be one of: welcome, orient, perch." },
      { status: 400 },
    );
  }

  const slug: RookeryEmailSlug = slugRaw;

  try {
    const { id } = await sendRookeryEmail(email, slug);
    console.log(
      `[rookery/onboarding] sent slug=${slug} email=${email} id=${id}`,
    );
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to send email.";
    console.error(
      `[rookery/onboarding] send failed slug=${slug} email=${email}: ${message}`,
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

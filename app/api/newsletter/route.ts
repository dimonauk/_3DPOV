import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Newsletter subscription. Logs to console today; swap the body to
 * forward to Klaviyo / Mailchimp / ConvertKit / Resend Audiences when
 * the ESP is chosen. The UI and form contract don't need to change.
 *
 * Expected wire-up (Klaviyo example):
 *   await fetch(`https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs`,
 *     { method: "POST", headers: {...}, body: JSON.stringify({...}) })
 */
export async function POST(req: Request) {
  let email = "";
  let source = "";
  try {
    const body = await req.json();
    email = String(body.email ?? "").trim();
    source = String(body.source ?? "unknown");
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  console.log(`[newsletter] subscribe email=${email} source=${source}`);

  return NextResponse.json({ ok: true });
}

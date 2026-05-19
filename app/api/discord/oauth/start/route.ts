/**
 * GET /api/discord/oauth/start — kick off the Discord-link flow.
 *
 * The user must already be signed in to Firebase. The client passes
 * their ID token as a query param so the callback can re-bind the
 * Discord identity to the Firebase uid.
 *
 * Scopes: `identify` (lets us read the Discord user id + username
 * + email) and `guilds.join` is intentionally NOT requested — the
 * studio uses the simpler pattern of showing the user an invite URL
 * to join the guild themselves. `guilds.join` requires Discord's
 * approval for production apps and surfaces creepy "this app can
 * force you to join servers" prompts.
 *
 * State: base64url JSON with a nonce + the return path + the Firebase
 * ID token (short-lived; expires in ~1h). The cookie copy is the CSRF
 * defence — Discord echoes our state in the redirect, we compare
 * against the cookie.
 */

import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { createLogger } from "lib/log";

export const dynamic = "force-dynamic";

const log = createLogger("api.discord.oauth.start");

const DISCORD_AUTHORIZE = "https://discord.com/api/oauth2/authorize";

function safeReturn(target: string | null): string {
  if (!target || !target.startsWith("/") || target.startsWith("//")) {
    return "/rookery/discord";
  }
  return target;
}

export async function GET(req: Request): Promise<Response> {
  const clientId = process.env.DISCORD_OAUTH_CLIENT_ID;
  const redirectUri = process.env.DISCORD_OAUTH_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    log.error("oauth not configured", {
      hasClientId: Boolean(clientId),
      hasRedirect: Boolean(redirectUri),
    });
    return NextResponse.json(
      { error: "discord_oauth_not_configured" },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const returnPath = safeReturn(url.searchParams.get("return"));
  const idToken = url.searchParams.get("id_token") ?? "";
  if (!idToken) {
    return NextResponse.json({ error: "missing_id_token" }, { status: 400 });
  }

  const nonce = randomBytes(16).toString("base64url");
  const statePayload = JSON.stringify({ n: nonce, r: returnPath, t: idToken });
  const state = Buffer.from(statePayload, "utf8").toString("base64url");

  const authorize = new URL(DISCORD_AUTHORIZE);
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", "identify email");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("prompt", "consent");

  const response = NextResponse.redirect(authorize.toString());
  response.cookies.set("discord_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/discord/oauth",
    maxAge: 10 * 60,
  });
  return response;
}

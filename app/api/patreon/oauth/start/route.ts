/**
 * GET /api/patreon/oauth/start — kick off Patreon OAuth2.
 *
 * Sends the visitor to Patreon's authorize endpoint with the identity
 * scopes we need to read their membership. Patreon will redirect back
 * to PATREON_OAUTH_REDIRECT_URI (handled by ./callback/route.ts).
 *
 * Auth posture: the visitor's Firebase identity is captured by the
 * callback via the `state` parameter, which carries the Bearer-verified
 * uid forward across the Patreon round trip. Here we accept an optional
 * `?return=<path>` so the callback can redirect to the same place the
 * user came from after linking.
 */

import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

export const dynamic = "force-dynamic";

const PATREON_AUTHORIZE = "https://www.patreon.com/oauth2/authorize";

function safeReturnPath(raw: string | null): string {
  if (!raw) return "/rookery/my-wallet";
  if (!raw.startsWith("/")) return "/rookery/my-wallet";
  if (raw.startsWith("//")) return "/rookery/my-wallet";
  return raw;
}

export async function GET(req: Request): Promise<Response> {
  const clientId = process.env.PATREON_OAUTH_CLIENT_ID;
  const redirectUri = process.env.PATREON_OAUTH_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "patreon_oauth_not_configured" },
      { status: 503 },
    );
  }

  const incoming = new URL(req.url);
  const returnTo = safeReturnPath(incoming.searchParams.get("return"));
  const nonce = randomBytes(16).toString("hex");
  const state = Buffer.from(
    JSON.stringify({ n: nonce, r: returnTo }),
    "utf8",
  ).toString("base64url");

  const authorize = new URL(PATREON_AUTHORIZE);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("scope", "identity identity.memberships");
  authorize.searchParams.set("state", state);

  const response = NextResponse.redirect(authorize.toString());
  response.cookies.set("patreon_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/patreon/oauth",
    maxAge: 60 * 10,
  });
  return response;
}

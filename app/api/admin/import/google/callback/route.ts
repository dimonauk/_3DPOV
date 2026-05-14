/**
 * app/api/admin/import/google/callback/route.ts — OAuth callback.
 *
 * GET /api/admin/import/google/callback?code=...&state=...
 *
 * Google redirects the browser here after the operator approves the
 * scopes. We validate the state token (which we wrote in /start),
 * exchange the code for tokens, persist the refresh token in
 * operatorIntegrations/{uid}, then 302 back to the connect page with a
 * status flag.
 *
 * This route does NOT require a Bearer token — the operator is mid-flow
 * through Google's redirect, so we don't have one. Authorisation is
 * established entirely via the one-time state token + Firebase
 * service-account proof of identity (the uid in the state doc was
 * written under a verified-admin POST in /start).
 */

import { NextResponse } from "next/server";

import {
  consumeOAuthStateToken,
  exchangeCode,
  saveOperatorTokens,
} from "lib/integrations/google/oauth";

export const dynamic = "force-dynamic";

function buildRedirect(req: Request, query: Record<string, string>): URL {
  const url = new URL(req.url);
  const target = new URL("/admin/import/google/connect", url.origin);
  for (const [k, v] of Object.entries(query)) target.searchParams.set(k, v);
  return target;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const googleError = url.searchParams.get("error");

  if (googleError) {
    return NextResponse.redirect(
      buildRedirect(req, { status: "error", error: googleError }),
    );
  }
  if (!code || !state) {
    return NextResponse.redirect(
      buildRedirect(req, { status: "error", error: "missing-code-or-state" }),
    );
  }

  const payload = await consumeOAuthStateToken(state);
  if (!payload) {
    return NextResponse.redirect(
      buildRedirect(req, { status: "error", error: "invalid-or-expired-state" }),
    );
  }

  try {
    const tokens = await exchangeCode(code, payload.redirectUri);
    await saveOperatorTokens(payload.uid, tokens);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "exchange-failed";
    return NextResponse.redirect(
      buildRedirect(req, { status: "error", error: message.slice(0, 200) }),
    );
  }

  return NextResponse.redirect(buildRedirect(req, { status: "ok" }));
}

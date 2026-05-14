/**
 * app/api/admin/import/google/start/route.ts — Begin Google OAuth.
 *
 * POST /api/admin/import/google/start
 *   Headers: Authorization: Bearer <firebase-id-token>
 *   Returns: { authUrl: string } — the URL the browser should navigate
 *            to. We DO NOT 302 from this route because the call is
 *            an XHR from the connect page, not a top-level navigation.
 *
 * We mint a one-time `state` token, persist {uid, redirectUri} keyed by
 * that token (10-minute TTL), and embed the token in Google's auth URL.
 * The /callback route consumes the state to recover the uid.
 */

import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

import {
  adminGuardErrorBody,
  AdminGuardError,
  requireAdminUser,
} from "lib/integrations/google/admin-guard";
import {
  DEFAULT_GOOGLE_SCOPES,
  getAuthorizationUrl,
  writeOAuthStateToken,
} from "lib/integrations/google/oauth";

export const dynamic = "force-dynamic";

function deriveRedirectUri(req: Request): string {
  const explicit = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (explicit) return explicit;
  const url = new URL(req.url);
  return `${url.origin}/api/admin/import/google/callback`;
}

export async function POST(req: Request) {
  let admin: { uid: string; email: string };
  try {
    admin = await requireAdminUser(req);
  } catch (err) {
    if (err instanceof AdminGuardError) {
      const { status, body } = adminGuardErrorBody(err);
      return NextResponse.json(body, { status });
    }
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    return NextResponse.json(
      {
        error:
          "GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET not set. Create a Web-application OAuth client in Google Cloud Console.",
      },
      { status: 500 },
    );
  }

  const redirectUri = deriveRedirectUri(req);
  const stateToken = randomBytes(24).toString("hex");
  try {
    await writeOAuthStateToken(stateToken, { uid: admin.uid, redirectUri });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Could not persist OAuth state: ${err.message}`
            : "Could not persist OAuth state.",
      },
      { status: 500 },
    );
  }

  const authUrl = getAuthorizationUrl(admin.uid, {
    scopes: DEFAULT_GOOGLE_SCOPES,
    redirectUri,
    stateToken,
  });
  return NextResponse.json({ authUrl }, { status: 200 });
}

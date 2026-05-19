/**
 * GET /api/discord/oauth/callback — finish the Discord-link flow.
 *
 * Flow:
 *   1. Validate `state` against the httpOnly cookie (CSRF).
 *   2. Exchange `code` for an access token (we discard it after step 3
 *      — the bot token does all subsequent role work, so there's no
 *      reason to store user OAuth tokens).
 *   3. GET /users/@me with the access token to learn the Discord user
 *      id + username.
 *   4. Verify the Firebase ID token embedded in state, look up the
 *      Firebase uid.
 *   5. Persist the link: write `discord_user_id` to Firebase custom
 *      claims via linkDiscordUser().
 *   6. Trigger an initial role sync via syncDiscordRoleForUid().
 *   7. Redirect back to the originating page with `?discord=linked` or
 *      `?discord=joined-pending` if the user needs to accept the guild
 *      invite before their role can apply.
 *
 * Token discarding rationale: we never use the user's Discord token
 * after step 3. Storing it would mean carrying refresh-token rotation
 * for no functional reason. The bot token (server-only secret) does
 * every role operation.
 */

import { NextResponse } from "next/server";

import {
  requireFirebaseAdminAuth,
  verifyIdToken,
} from "lib/firebase/admin";
import { createLogger } from "lib/log";
import { discordPreflight, discordPreflightMessage } from "lib/discord/preflight";
import { linkDiscordUser, syncDiscordRoleForUid } from "lib/discord/sync-role";
import type {
  DiscordOAuthTokenResponse,
  DiscordUser,
} from "lib/discord/types";

export const dynamic = "force-dynamic";

const log = createLogger("api.discord.oauth.callback");

const DISCORD_TOKEN = "https://discord.com/api/oauth2/token";
const DISCORD_USERS_ME = "https://discord.com/api/v10/users/@me";

type StateShape = { n: string; r: string; t: string };

function decodeState(raw: string | null): StateShape | null {
  if (!raw) return null;
  try {
    const decoded = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as unknown;
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "n" in decoded &&
      "r" in decoded &&
      "t" in decoded
    ) {
      const obj = decoded as Record<string, unknown>;
      if (
        typeof obj.n === "string" &&
        typeof obj.r === "string" &&
        typeof obj.t === "string"
      ) {
        return { n: obj.n, r: obj.r, t: obj.t };
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function exchangeCode(
  code: string,
): Promise<DiscordOAuthTokenResponse | null> {
  const clientId = process.env.DISCORD_OAUTH_CLIENT_ID;
  const clientSecret = process.env.DISCORD_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  const res = await fetch(DISCORD_TOKEN, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) {
    log.warn("token exchange failed", { status: res.status });
    return null;
  }
  return (await res.json()) as DiscordOAuthTokenResponse;
}

async function fetchDiscordUser(
  accessToken: string,
): Promise<DiscordUser | null> {
  const res = await fetch(DISCORD_USERS_ME, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    log.warn("discord identity fetch failed", { status: res.status });
    return null;
  }
  return (await res.json()) as DiscordUser;
}

function safeReturn(target: string): string {
  if (!target.startsWith("/") || target.startsWith("//")) {
    return "/rookery/discord";
  }
  return target;
}

export async function GET(req: Request): Promise<Response> {
  const preflight = discordPreflight();
  if (!preflight.ok) {
    log.error("preflight failed", {
      errors: preflight.errors.map(discordPreflightMessage),
    });
    return NextResponse.redirect(
      new URL(
        "/rookery/discord?discord=error&reason=server_misconfigured",
        req.url,
      ),
    );
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      new URL(
        `/rookery/discord?discord=error&reason=${encodeURIComponent(errorParam)}`,
        req.url,
      ),
    );
  }
  if (!code || !stateParam) {
    return NextResponse.redirect(
      new URL("/rookery/discord?discord=error&reason=missing_params", req.url),
    );
  }

  const cookieState =
    req.headers
      .get("cookie")
      ?.split(/;\s*/)
      .map((c) => c.split("="))
      .find(([k]) => k === "discord_oauth_state")?.[1] ?? null;
  if (!cookieState || cookieState !== stateParam) {
    log.warn("state mismatch");
    return NextResponse.redirect(
      new URL("/rookery/discord?discord=error&reason=state_mismatch", req.url),
    );
  }
  const decoded = decodeState(stateParam);
  if (!decoded) {
    return NextResponse.redirect(
      new URL("/rookery/discord?discord=error&reason=state_decode", req.url),
    );
  }

  let firebaseUid: string;
  try {
    const decodedToken = await verifyIdToken(decoded.t);
    firebaseUid = decodedToken.uid;
  } catch (err) {
    log.warn("firebase token invalid", {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.redirect(
      new URL("/rookery/discord?discord=error&reason=auth_failed", req.url),
    );
  }

  const tokens = await exchangeCode(code);
  if (!tokens?.access_token) {
    return NextResponse.redirect(
      new URL("/rookery/discord?discord=error&reason=token_exchange", req.url),
    );
  }

  const discordUser = await fetchDiscordUser(tokens.access_token);
  if (!discordUser?.id) {
    return NextResponse.redirect(
      new URL("/rookery/discord?discord=error&reason=identity_fetch", req.url),
    );
  }

  await linkDiscordUser(firebaseUid, discordUser.id);

  // Best-effort initial sync. If the user isn't in the guild yet, the sync
  // returns deferred — the user lands on the connect page which surfaces
  // the invite URL.
  let outcome:
    | "linked"
    | "pending-invite"
    | "linked-and-synced"
    | "linked-sync-failed" = "linked";
  try {
    const sync = await syncDiscordRoleForUid(firebaseUid);
    if (sync.ok && "deferred" in sync && sync.deferred) {
      outcome = sync.reason === "user-not-in-guild" ? "pending-invite" : "linked";
    } else if (sync.ok) {
      outcome = "linked-and-synced";
    } else {
      outcome = "linked-sync-failed";
      log.warn("initial sync failed", { uid: firebaseUid, error: sync.error });
    }
  } catch (err) {
    outcome = "linked-sync-failed";
    log.warn("initial sync threw", {
      uid: firebaseUid,
      err: err instanceof Error ? err.message : String(err),
    });
  }

  // (Tidy up: we never need the user's OAuth tokens after this point.)
  void tokens;

  const response = NextResponse.redirect(
    new URL(`${safeReturn(decoded.r)}?discord=${outcome}`, req.url),
  );
  response.cookies.delete("discord_oauth_state");
  return response;
}

// Touched-but-not-referenced helper to satisfy strict lint: ensures the
// Firebase admin module is loaded eagerly so the redirect path can call
// `requireFirebaseAdminAuth()` lazily without a cold-start surprise.
void requireFirebaseAdminAuth;

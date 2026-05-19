/**
 * Creator-side OAuth token refresh.
 *
 * The studio's Patreon Creator Access Token is used by the cron
 * reconciler to paginate `/v2/campaigns/{id}/members`. Patreon's
 * creator access tokens last 1 month; refreshing them too aggressively
 * triggers `{"error":"invalid_grant"}` with a 401 (verified on the
 * Patreon Developers forum). The fix is to:
 *
 *   1. Cache the access_token + its expiry in Firestore so multiple
 *      cron runs in the same hour don't each independently refresh.
 *   2. Only refresh when the current token has < 24h of life left, or
 *      a force-flag is set.
 *
 * Storage: `patreon_creator_token/singleton` is the canonical doc.
 * It holds `{ access_token, refresh_token, expires_at, scope, refreshed_at }`.
 *
 * Bootstrap: paste the first-issue access_token + refresh_token + the
 * expires_in (in seconds) into the doc manually via the Firebase
 * console, or run the bootstrap script in `scripts/patreon-bootstrap-token.ts`
 * (not yet written — the runbook documents the manual paste).
 */

import "server-only";

import { getFirebaseAdminDb } from "lib/firebase/admin";
import { createLogger } from "lib/log";

import type { PatreonOAuthTokenResponse } from "./types";

const log = createLogger("patreon.refresh-token");

const DOC_PATH = ["patreon_creator_token", "singleton"] as const;
const REFRESH_WINDOW_MS = 24 * 60 * 60 * 1000;
const PATREON_TOKEN_URL = "https://www.patreon.com/api/oauth2/token";

export type CreatorTokenRecord = {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope?: string;
  refreshed_at: string;
};

function isStale(expiresAt: string): boolean {
  const t = Date.parse(expiresAt);
  if (!Number.isFinite(t)) return true;
  return t - Date.now() < REFRESH_WINDOW_MS;
}

async function loadCurrent(): Promise<CreatorTokenRecord | null> {
  const db = getFirebaseAdminDb();
  if (!db) return null;
  const ref = db.collection(DOC_PATH[0]).doc(DOC_PATH[1]);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data() as Partial<CreatorTokenRecord> | undefined;
  if (!data?.access_token || !data.refresh_token || !data.expires_at) {
    return null;
  }
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    scope: data.scope,
    refreshed_at: data.refreshed_at ?? new Date(0).toISOString(),
  };
}

async function persist(next: CreatorTokenRecord): Promise<void> {
  const db = getFirebaseAdminDb();
  if (!db) {
    log.warn("refresh succeeded but firestore unavailable; not persisting");
    return;
  }
  await db.collection(DOC_PATH[0]).doc(DOC_PATH[1]).set(next, { merge: true });
}

async function exchangeRefresh(
  refreshToken: string,
): Promise<PatreonOAuthTokenResponse | null> {
  const clientId = process.env.PATREON_OAUTH_CLIENT_ID;
  const clientSecret = process.env.PATREON_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    log.warn("PATREON_OAUTH_CLIENT_* not configured");
    return null;
  }
  const res = await fetch(PATREON_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    log.warn("creator token refresh failed", {
      status: res.status,
      body: body.slice(0, 500),
    });
    return null;
  }
  return (await res.json()) as PatreonOAuthTokenResponse;
}

/**
 * Returns a fresh creator access token. Refreshes from Firestore if
 * the cached one is within 24h of expiry. Pass `{ force: true }` to
 * always refresh (e.g. after a 401 from the API has invalidated the
 * cached token earlier than expected).
 */
export async function getCreatorAccessToken(
  opts: { force?: boolean } = {},
): Promise<string | null> {
  const current = await loadCurrent();
  if (!current) {
    log.warn(
      "no creator token in firestore — bootstrap via runbook before " +
        "calling this. See docs/patreon-runbook.md §Bootstrap.",
    );
    return null;
  }

  if (!opts.force && !isStale(current.expires_at)) {
    return current.access_token;
  }

  const next = await exchangeRefresh(current.refresh_token);
  if (!next?.access_token || !next.refresh_token) {
    log.error("refresh response missing tokens — keeping cached", {
      hadAccess: Boolean(next?.access_token),
      hadRefresh: Boolean(next?.refresh_token),
    });
    return current.access_token;
  }

  const expiresInMs = (next.expires_in ?? 30 * 24 * 60 * 60) * 1000;
  const record: CreatorTokenRecord = {
    access_token: next.access_token,
    refresh_token: next.refresh_token,
    expires_at: new Date(Date.now() + expiresInMs).toISOString(),
    scope: next.scope ?? current.scope,
    refreshed_at: new Date().toISOString(),
  };
  await persist(record);
  log.info("creator token refreshed", { expires_at: record.expires_at });
  return record.access_token;
}

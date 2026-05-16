/**
 * lib/integrations/google/oauth.ts — Google OAuth 2.0 helpers.
 *
 * One-line role: code-exchange + refresh-token plumbing for the
 * operator's connection to Google Photos Picker + Google Drive, plus
 * Firestore persistence of the refresh token.
 *
 * # 2025 reality check
 * Google Photos Library API broad-read scopes (`photoslibrary.readonly`
 * etc.) were deprecated on 31 March 2025. We use the **Google Photos
 * Picker API** instead — same OAuth scope (`photospicker.mediaitems.
 * readonly`) but the user explicitly picks items in Google's modal, not
 * the app. Drive is unchanged — `drive.readonly` works.
 *
 * # Config
 * ONE Google OAuth client (web application). Authorised redirect URIs:
 *   https://holoflow.co.uk/api/admin/import/google/callback
 *   http://localhost:3000/api/admin/import/google/callback
 * Env: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET.
 *
 * State parameter encodes the operator's Firebase uid so the callback
 * knows which operator's tokens to persist.
 */

import "server-only";

import { google } from "googleapis";
import type { Auth } from "googleapis";

type OAuth2Client = Auth.OAuth2Client;

import { requireFirebaseAdminDb } from "lib/firebase/admin";

/**
 * Scopes we ever request.
 *
 * - `photosPicker` — operator picks items in Google's own modal; we
 *   never see anything they didn't pick.
 * - `driveReadonly` — read access to the operator's Drive (listing /
 *   browsing / downloading).
 * - `driveFile` — write access, but only to files the app creates or
 *   opens. Required for landing SHARP-generated splats back on the
 *   operator's Drive instead of paying for Vercel Blob storage. Crucially
 *   narrower than full `drive` scope: we cannot touch the operator's
 *   existing files.
 */
export const GOOGLE_SCOPES = {
  photosPicker: "https://www.googleapis.com/auth/photospicker.mediaitems.readonly",
  driveReadonly: "https://www.googleapis.com/auth/drive.readonly",
  driveFile: "https://www.googleapis.com/auth/drive.file",
} as const;

export const DEFAULT_GOOGLE_SCOPES = [
  GOOGLE_SCOPES.photosPicker,
  GOOGLE_SCOPES.driveReadonly,
  GOOGLE_SCOPES.driveFile,
];

export type OperatorGoogleTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
  scopes: string[];
};

export type StoredOperatorTokens = {
  googleRefreshToken: string;
  googleScopes: string[];
  googleConnectedAt: string; // ISO
  /** Optional cached access token + expiry for short-circuit re-use. */
  googleAccessToken?: string;
  googleAccessTokenExpiresAt?: number;
};

function envClientId(): string {
  const v = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!v) {
    throw new Error(
      "google-oauth: GOOGLE_OAUTH_CLIENT_ID not set. Create a Web-application OAuth client in Google Cloud Console.",
    );
  }
  return v;
}

function envClientSecret(): string {
  const v = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!v) {
    throw new Error(
      "google-oauth: GOOGLE_OAUTH_CLIENT_SECRET not set. See https://console.cloud.google.com/apis/credentials.",
    );
  }
  return v;
}

/** Build a fresh OAuth2 client. The googleapis library mutates state on
 * the instance during refresh, so we never share one across requests. */
export function makeOAuthClient(redirectUri: string): OAuth2Client {
  return new google.auth.OAuth2(envClientId(), envClientSecret(), redirectUri);
}

/**
 * Build the authorisation URL the operator's browser should be redirected
 * to. We force `prompt=consent + access_type=offline` so Google always
 * mints a fresh refresh_token — important because Google omits the
 * refresh_token on the second-and-subsequent consent for the same scopes
 * (and we want to be able to reconnect cleanly).
 */
export function getAuthorizationUrl(
  uid: string,
  opts: { scopes?: string[]; redirectUri: string; stateToken: string },
): string {
  const client = makeOAuthClient(opts.redirectUri);
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: opts.scopes ?? DEFAULT_GOOGLE_SCOPES,
    // stateToken is a short-lived id we wrote to Firestore that maps to
    // {uid, redirectUri}; the callback verifies and consumes it.
    state: opts.stateToken,
    include_granted_scopes: true,
  });
}

/** Exchange the auth code for tokens. Throws on Google-side failure. */
export async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<OperatorGoogleTokens> {
  const client = makeOAuthClient(redirectUri);
  const { tokens } = await client.getToken(code);
  if (!tokens.access_token) {
    throw new Error("google-oauth: exchangeCode returned no access_token.");
  }
  if (!tokens.refresh_token) {
    throw new Error(
      "google-oauth: exchangeCode returned no refresh_token. Make sure the auth URL was built with prompt=consent + access_type=offline, and that the operator has not previously consented without revoking.",
    );
  }
  const scopes = typeof tokens.scope === "string" ? tokens.scope.split(" ") : [];
  // expiry_date is epoch ms when set by google-auth-library.
  const expiresAt = typeof tokens.expiry_date === "number"
    ? tokens.expiry_date
    : Date.now() + 3500 * 1000;
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt,
    scopes,
  };
}

/** Mint a fresh access token from a stored refresh token. */
export async function refreshAccessToken(
  refreshToken: string,
  redirectUri = "postmessage",
): Promise<{ accessToken: string; expiresAt: number }> {
  const client = makeOAuthClient(redirectUri);
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();
  if (!credentials.access_token) {
    throw new Error("google-oauth: refreshAccessToken returned no access_token.");
  }
  const expiresAt = typeof credentials.expiry_date === "number"
    ? credentials.expiry_date
    : Date.now() + 3500 * 1000;
  return { accessToken: credentials.access_token, expiresAt };
}

/** Persist the operator's tokens. Writes to operatorIntegrations/{uid}. */
export async function saveOperatorTokens(
  uid: string,
  tokens: OperatorGoogleTokens,
): Promise<void> {
  const db = requireFirebaseAdminDb();
  const data: StoredOperatorTokens = {
    googleRefreshToken: tokens.refreshToken,
    googleScopes: tokens.scopes,
    googleConnectedAt: new Date().toISOString(),
    googleAccessToken: tokens.accessToken,
    googleAccessTokenExpiresAt: tokens.expiresAt,
  };
  await db.collection("operatorIntegrations").doc(uid).set(data, { merge: true });
}

/** Read the stored tokens (or null if the operator never connected). */
export async function getStoredOperatorTokens(
  uid: string,
): Promise<StoredOperatorTokens | null> {
  const db = requireFirebaseAdminDb();
  const snap = await db.collection("operatorIntegrations").doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() as StoredOperatorTokens | undefined;
  if (!data || !data.googleRefreshToken) return null;
  return data;
}

/**
 * Return a valid access token for the operator. Uses the cached access
 * token when it has >60s of life left; otherwise refreshes via the
 * stored refresh token (and writes the new access token back).
 *
 * Throws if the operator has not connected Google yet.
 */
export async function getOperatorAccessToken(uid: string): Promise<string> {
  const stored = await getStoredOperatorTokens(uid);
  if (!stored) {
    throw new Error(
      "google-oauth: operator has not connected Google. Send them to /admin/import/google/connect first.",
    );
  }
  const now = Date.now();
  const skew = 60_000;
  if (
    stored.googleAccessToken &&
    typeof stored.googleAccessTokenExpiresAt === "number" &&
    stored.googleAccessTokenExpiresAt - skew > now
  ) {
    return stored.googleAccessToken;
  }
  const fresh = await refreshAccessToken(stored.googleRefreshToken);
  const db = requireFirebaseAdminDb();
  await db.collection("operatorIntegrations").doc(uid).set(
    {
      googleAccessToken: fresh.accessToken,
      googleAccessTokenExpiresAt: fresh.expiresAt,
    },
    { merge: true },
  );
  return fresh.accessToken;
}

/**
 * Write a short-lived state-token doc so the callback can recover the
 * operator's uid + the redirect URI used. TTL ~10 minutes; we let the
 * doc linger and check the createdAt on read.
 */
export async function writeOAuthStateToken(
  stateToken: string,
  payload: { uid: string; redirectUri: string },
): Promise<void> {
  const db = requireFirebaseAdminDb();
  await db.collection("operatorOAuthStates").doc(stateToken).set({
    uid: payload.uid,
    redirectUri: payload.redirectUri,
    createdAt: new Date().toISOString(),
    createdAtMs: Date.now(),
  });
}

export type OAuthStatePayload = { uid: string; redirectUri: string };

/** Read + delete (one-shot) the state-token doc. */
export async function consumeOAuthStateToken(
  stateToken: string,
): Promise<OAuthStatePayload | null> {
  const db = requireFirebaseAdminDb();
  const ref = db.collection("operatorOAuthStates").doc(stateToken);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data() as
    | { uid: string; redirectUri: string; createdAtMs: number }
    | undefined;
  if (!data) return null;
  await ref.delete().catch(() => {
    // Best-effort delete; the doc lives ~10min, then is irrelevant.
  });
  // 10-minute TTL window.
  if (Date.now() - (data.createdAtMs ?? 0) > 10 * 60 * 1000) {
    return null;
  }
  return { uid: data.uid, redirectUri: data.redirectUri };
}

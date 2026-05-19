/**
 * lib/federation/actor.ts — Single source of truth for the studio's
 * ActivityPub actor identity.
 *
 * The studio publishes one actor: `studio@holoflow.co.uk`. Mastodon /
 * Pixelfed / etc. resolve it via WebFinger and then GET the actor
 * document at `/users/studio`. That document carries the public key
 * used to verify HTTP signatures on Activities the studio sends to
 * followers' inboxes.
 *
 * Keys live in env, never on disk. See docs/FEDERATION.md for the
 * openssl command to provision them.
 */
import { SITE_URL } from "lib/feed/atom";

export const ACTOR_HANDLE = "studio";
export const ACTOR_DOMAIN = new URL(SITE_URL).host;

export const ACTOR_DISPLAY_NAME = "Holoflow Studio";
export const ACTOR_SUMMARY =
  "Articles, journal, and tutorials from a London studio building POV-LED, splat, and light-painting work.";

export type ActorUrls = {
  /** Stable ActivityPub id. Used as the actor's URI everywhere. */
  id: string;
  inbox: string;
  outbox: string;
  followers: string;
  following: string;
  /** Public profile URL on the magazine — alternate to the actor doc. */
  url: string;
  publicKeyId: string;
};

export function actorUrls(handle: string = ACTOR_HANDLE): ActorUrls {
  const base = `${SITE_URL}/users/${handle}`;
  return {
    id: base,
    inbox: `${base}/inbox`,
    outbox: `${base}/outbox`,
    followers: `${base}/followers`,
    following: `${base}/following`,
    url: `${SITE_URL}/`,
    publicKeyId: `${base}#main-key`,
  };
}

export type ActorKeys = {
  publicKeyPem: string;
  privateKeyPem: string;
};

/**
 * Reads PEM keys from env. Returns null when either is missing — the
 * route handlers turn that into a 503 with a helpful message instead
 * of crashing the build or serving an unsigned actor.
 *
 * Env values can be the raw PEM (with newlines) or with `\n`
 * escapes — Vercel's env UI mangles real newlines, so we unescape.
 */
export function readActorKeys(): ActorKeys | null {
  const pub = process.env.FEDIVERSE_ACTOR_PUBLIC_KEY;
  const priv = process.env.FEDIVERSE_ACTOR_PRIVATE_KEY;
  if (!pub || !priv) return null;
  return {
    publicKeyPem: unescapePem(pub),
    privateKeyPem: unescapePem(priv),
  };
}

function unescapePem(value: string): string {
  return value.includes("\\n") ? value.replace(/\\n/g, "\n") : value;
}

export function isKnownHandle(handle: string): boolean {
  return handle === ACTOR_HANDLE;
}

/** acct: form for WebFinger responses. */
export function actorAcct(handle: string = ACTOR_HANDLE): string {
  return `acct:${handle}@${ACTOR_DOMAIN}`;
}

/**
 * Discord REST v10 wire shapes.
 *
 * We only model what we touch — adding a role, checking guild
 * membership, exchanging OAuth codes. The rest of Discord's payloads
 * are preserved as `Record<string, unknown>`.
 *
 * Discord uses snake_case in JSON and our type names mirror it so
 * destructuring is one-line.
 */

import "server-only";

export type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
  email?: string | null;
  verified?: boolean;
};

export type DiscordGuildMember = {
  user?: DiscordUser;
  nick?: string | null;
  roles?: string[];
  joined_at?: string;
  pending?: boolean;
};

export type DiscordOAuthTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
};

export type DiscordRateLimitResponse = {
  message?: string;
  retry_after?: number;
  global?: boolean;
  code?: number;
};

/**
 * Mirrors `StudioTierClaim` from lib/patreon/types.ts. Re-exported here
 * (rather than imported) so the Discord lib can build/test without the
 * Patreon lib being present. The values must stay in sync.
 */
export type StudioTierClaim = "reader-plus" | "member" | "patron" | "atelier";

export type DiscordSyncResult =
  | { ok: true; applied: string[]; removed: string[]; uid: string }
  | { ok: true; deferred: true; reason: "user-not-in-guild"; inviteUrl?: string }
  | { ok: true; deferred: true; reason: "no-discord-link" }
  | { ok: false; error: string };

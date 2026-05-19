/**
 * Maps studio tier claims to Discord role IDs.
 *
 * The mapping is built lazily on env reads (so test runs see env
 * mutations). Each tier claim resolves to a single role ID; the
 * `roleIdsManagedByStudio()` helper returns every role this bot
 * actively manages so we can remove stale ones during a sync.
 *
 * Discord's role hierarchy gotcha (verified on Patreon's own
 * documentation): the bot's own role MUST sit above every role in
 * `roleIdsManagedByStudio()` in the server's Roles list. If any
 * managed role is above the bot, Discord returns 403 and the sync
 * silently fails. The preflight check warns about this; the runbook
 * walks the operator through fixing it.
 *
 * Reader+ is included as a real role because legacy `/dimonauk`
 * supporters get visible recognition on Discord too, not just a
 * Firebase claim.
 */

import "server-only";

import type { StudioTierClaim } from "./types";

export function roleIdForTier(tier: StudioTierClaim | null): string | null {
  if (!tier) return null;
  switch (tier) {
    case "reader-plus":
      return process.env.DISCORD_ROLE_READER_PLUS_ID || null;
    case "member":
      return process.env.DISCORD_ROLE_MEMBER_ID || null;
    case "patron":
      return process.env.DISCORD_ROLE_PATRON_ID || null;
    case "atelier":
      return process.env.DISCORD_ROLE_ATELIER_ID || null;
  }
}

/**
 * All role IDs the studio bot manages. Used to compute which roles to
 * REMOVE during a sync so a downgrade from Patron → Member doesn't
 * leave the Patron role attached.
 */
export function roleIdsManagedByStudio(): string[] {
  return [
    process.env.DISCORD_ROLE_READER_PLUS_ID,
    process.env.DISCORD_ROLE_MEMBER_ID,
    process.env.DISCORD_ROLE_PATRON_ID,
    process.env.DISCORD_ROLE_ATELIER_ID,
  ].filter((v): v is string => Boolean(v));
}

export function studioGuildId(): string | null {
  return process.env.DISCORD_GUILD_ID || null;
}

export function requireStudioGuildId(): string {
  const id = studioGuildId();
  if (!id) {
    throw new Error(
      "DISCORD_GUILD_ID is not set. Discord sync refuses to run without it.",
    );
  }
  return id;
}

export function studioInviteUrl(): string | null {
  return process.env.DISCORD_GUILD_INVITE_URL || null;
}

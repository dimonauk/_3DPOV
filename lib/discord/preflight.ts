/**
 * Startup preflight checks for the Discord integration.
 *
 * Hard requirements: bot token + guild id. Without these, the sync
 * endpoints refuse to run.
 *
 * Soft requirements (warnings only): tier role IDs, OAuth credentials,
 * the invite URL. Missing tier roles mean those tier upgrades won't
 * propagate to Discord; missing OAuth credentials disable the user-
 * link flow.
 */

import "server-only";

import { createLogger } from "lib/log";

const log = createLogger("discord.preflight");

export type DiscordPreflightIssue =
  | "missing-bot-token"
  | "missing-guild-id"
  | "missing-oauth-client-id"
  | "missing-oauth-client-secret"
  | "missing-oauth-redirect-uri"
  | "missing-role-reader-plus-id"
  | "missing-role-member-id"
  | "missing-role-patron-id"
  | "missing-role-atelier-id"
  | "missing-invite-url";

export type DiscordPreflightResult =
  | { ok: true; warnings: DiscordPreflightIssue[] }
  | {
      ok: false;
      errors: DiscordPreflightIssue[];
      warnings: DiscordPreflightIssue[];
    };

export function discordPreflight(): DiscordPreflightResult {
  const errors: DiscordPreflightIssue[] = [];
  const warnings: DiscordPreflightIssue[] = [];

  if (!process.env.DISCORD_BOT_TOKEN) errors.push("missing-bot-token");
  if (!process.env.DISCORD_GUILD_ID) errors.push("missing-guild-id");

  if (!process.env.DISCORD_OAUTH_CLIENT_ID)
    warnings.push("missing-oauth-client-id");
  if (!process.env.DISCORD_OAUTH_CLIENT_SECRET)
    warnings.push("missing-oauth-client-secret");
  if (!process.env.DISCORD_OAUTH_REDIRECT_URI)
    warnings.push("missing-oauth-redirect-uri");

  if (!process.env.DISCORD_ROLE_READER_PLUS_ID)
    warnings.push("missing-role-reader-plus-id");
  if (!process.env.DISCORD_ROLE_MEMBER_ID)
    warnings.push("missing-role-member-id");
  if (!process.env.DISCORD_ROLE_PATRON_ID)
    warnings.push("missing-role-patron-id");
  if (!process.env.DISCORD_ROLE_ATELIER_ID)
    warnings.push("missing-role-atelier-id");
  if (!process.env.DISCORD_GUILD_INVITE_URL)
    warnings.push("missing-invite-url");

  if (warnings.length) log.warn("preflight warnings", { warnings });
  if (errors.length) {
    log.error("preflight errors — Discord sync will 503", { errors });
    return { ok: false, errors, warnings };
  }
  return { ok: true, warnings };
}

export function discordPreflightMessage(issue: DiscordPreflightIssue): string {
  switch (issue) {
    case "missing-bot-token":
      return "DISCORD_BOT_TOKEN is unset. Create a bot in the Discord Developer Portal (Applications → New Application → Bot → Reset Token).";
    case "missing-guild-id":
      return "DISCORD_GUILD_ID is unset. Right-click the studio server in Discord (with Developer Mode on) → Copy Server ID.";
    case "missing-oauth-client-id":
      return "DISCORD_OAUTH_CLIENT_ID is unset. User-link flow disabled; bot role-sync still works for already-linked users.";
    case "missing-oauth-client-secret":
      return "DISCORD_OAUTH_CLIENT_SECRET is unset. User-link flow disabled.";
    case "missing-oauth-redirect-uri":
      return "DISCORD_OAUTH_REDIRECT_URI is unset. User-link flow disabled.";
    case "missing-role-reader-plus-id":
    case "missing-role-member-id":
    case "missing-role-patron-id":
    case "missing-role-atelier-id":
      return `${issue} — this tier's role IDs are unset. Members at that tier won't get a Discord role until the env is set.`;
    case "missing-invite-url":
      return "DISCORD_GUILD_INVITE_URL is unset. The connect page will skip showing supporters the invite link to join the guild.";
  }
}

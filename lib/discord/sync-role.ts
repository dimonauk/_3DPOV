/**
 * Sync a user's Discord role with their current studio tier claim.
 *
 * Flow:
 *   1. Read the user's tier claim from Firebase (source of truth).
 *   2. Read the user's `discord_user_id` from the same claims envelope
 *      (set during the Discord OAuth callback).
 *   3. If no Discord link: return `deferred: "no-discord-link"`.
 *   4. Check guild membership (`GET /guilds/{id}/members/{user_id}`).
 *      If 404, return `deferred: "user-not-in-guild"` with the invite
 *      URL so the caller can prompt the user.
 *   5. Compute the desired role from `roleIdForTier(currentTier)`.
 *   6. For every role in `roleIdsManagedByStudio()` that the user
 *      currently has but isn't the desired role, DELETE.
 *   7. If the desired role is set and the user doesn't already have
 *      it, PUT.
 *
 * Edge cases:
 *   - tier === null but user is in guild → remove all managed roles
 *     (no claim means no perks). This is what a former patron looks
 *     like.
 *   - tier === "reader-plus" but DISCORD_ROLE_READER_PLUS_ID is unset
 *     → log + treat as null. Don't error; the caller doesn't care.
 *
 * Idempotency: this function is safe to call repeatedly; if the user's
 * roles are already correct, the only request is the membership check.
 */

import "server-only";

import {
  getFirebaseAdminAuth,
  requireFirebaseAdminAuth,
} from "lib/firebase/admin";
import { createLogger } from "lib/log";

import { discordFetch } from "./rate-limit";
import {
  requireStudioGuildId,
  roleIdForTier,
  roleIdsManagedByStudio,
  studioInviteUrl,
} from "./role-map";
import type { DiscordGuildMember, DiscordSyncResult, StudioTierClaim } from "./types";

const log = createLogger("discord.sync-role");

function tierFromClaims(
  claims: Record<string, unknown> | null | undefined,
): StudioTierClaim | null {
  const t = claims?.tier;
  if (
    t === "reader-plus" ||
    t === "member" ||
    t === "patron" ||
    t === "atelier"
  ) {
    return t;
  }
  return null;
}

function discordIdFromClaims(
  claims: Record<string, unknown> | null | undefined,
): string | null {
  const d = claims?.discord_user_id;
  return typeof d === "string" && d.length > 0 ? d : null;
}

export async function syncDiscordRoleForUid(
  uid: string,
): Promise<DiscordSyncResult> {
  const auth = getFirebaseAdminAuth();
  if (!auth) return { ok: false, error: "firebase-admin-not-configured" };
  let claims: Record<string, unknown>;
  try {
    const user = await auth.getUser(uid);
    claims = (user.customClaims ?? {}) as Record<string, unknown>;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "user-fetch-failed",
    };
  }

  const tier = tierFromClaims(claims);
  const discordUserId = discordIdFromClaims(claims);
  if (!discordUserId) {
    return { ok: true, deferred: true, reason: "no-discord-link" };
  }

  const guildId = requireStudioGuildId();

  // 1. Membership check
  const memberRes = await discordFetch(
    `/guilds/${guildId}/members/${discordUserId}`,
    { auth: "bot" },
  );
  if (!memberRes.ok && memberRes.status === 404) {
    return {
      ok: true,
      deferred: true,
      reason: "user-not-in-guild",
      inviteUrl: studioInviteUrl() ?? undefined,
    };
  }
  if (!memberRes.ok) {
    log.error("guild member check failed", {
      uid,
      discordUserId,
      status: memberRes.status,
    });
    return { ok: false, error: memberRes.error };
  }

  const member = memberRes.body as DiscordGuildMember;
  const currentRoles = new Set(member.roles ?? []);
  const desiredRoleId = roleIdForTier(tier);
  const managedRoles = roleIdsManagedByStudio();

  const toRemove: string[] = [];
  const toAdd: string[] = [];

  for (const roleId of managedRoles) {
    if (roleId === desiredRoleId) continue;
    if (currentRoles.has(roleId)) toRemove.push(roleId);
  }
  if (desiredRoleId && !currentRoles.has(desiredRoleId)) {
    toAdd.push(desiredRoleId);
  }

  const reason = `holoflow-sync: tier=${tier ?? "none"} uid=${uid}`;
  const reasonHeader = {
    "X-Audit-Log-Reason": encodeURIComponent(reason),
  };

  for (const roleId of toRemove) {
    const res = await discordFetch(
      `/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
      { method: "DELETE", auth: "bot", headers: reasonHeader },
    );
    if (!res.ok) {
      log.warn("role remove failed", {
        uid,
        discordUserId,
        roleId,
        status: res.status,
      });
    }
  }
  for (const roleId of toAdd) {
    const res = await discordFetch(
      `/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
      { method: "PUT", auth: "bot", headers: reasonHeader },
    );
    if (!res.ok) {
      log.warn("role add failed", {
        uid,
        discordUserId,
        roleId,
        status: res.status,
      });
      return { ok: false, error: res.error };
    }
  }

  log.info("role synced", {
    uid,
    discordUserId,
    tier,
    added: toAdd,
    removed: toRemove,
  });
  return { ok: true, applied: toAdd, removed: toRemove, uid };
}

/**
 * Used during the Discord OAuth callback. Stores the discord_user_id
 * on the user's custom claims so later sync calls can find it.
 */
export async function linkDiscordUser(
  uid: string,
  discordUserId: string,
): Promise<void> {
  const auth = requireFirebaseAdminAuth();
  const user = await auth.getUser(uid);
  const existing = (user.customClaims ?? {}) as Record<string, unknown>;
  await auth.setCustomUserClaims(uid, {
    ...existing,
    discord_user_id: discordUserId,
  });
}

export async function unlinkDiscordUser(uid: string): Promise<void> {
  const auth = requireFirebaseAdminAuth();
  const user = await auth.getUser(uid);
  const existing = (user.customClaims ?? {}) as Record<string, unknown>;
  const next = { ...existing };
  delete next.discord_user_id;
  await auth.setCustomUserClaims(uid, next);
}

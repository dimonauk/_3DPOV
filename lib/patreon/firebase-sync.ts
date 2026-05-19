/**
 * Apply / revoke Patreon-derived tier claims on Firebase Auth users.
 *
 * Path A from the integration spec: email-match. The Patreon supporter's
 * email is looked up against Firebase Auth; on a hit, we merge the tier
 * fields into the user's custom claims (preserving anything else there).
 *
 * On a miss, we stash the payload into `patreon_pending_links/{patreonId}`
 * so when the same human eventually signs up to the Rookery + links via
 * OAuth (Path B), the callback handler can promote the stash into a
 * proper claim.
 *
 * Revoke deletes only the tier-shaped keys — `tier`, `tierStartedAt`,
 * `lifetimePledgeCents`, `patreonId` — and leaves the rest of the claim
 * envelope untouched. We deliberately do NOT delete `patreonId` on a
 * pledge:delete: an ex-patron may re-up, and keeping the id makes the
 * reconciler's job easier.
 */

import "server-only";

import {
  getFirebaseAdminAuth,
  getFirebaseAdminDb,
  requireFirebaseAdminAuth,
} from "lib/firebase/admin";
import { createLogger } from "lib/log";

import type { StudioTierClaim } from "./types";

/**
 * Optional Discord sync after a tier change. Imported lazily so the
 * Patreon lib stays loadable in environments without Discord
 * configured (preview deploys, local dev without a bot token).
 *
 * If the Discord stack is missing, the sync is silently skipped — the
 * Patreon side still applies the Firebase claim, and the daily Discord
 * cron reconciler will pick up the drift when next configured.
 */
async function maybePropagateDiscord(uid: string): Promise<void> {
  if (!process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_GUILD_ID) return;
  try {
    const mod = await import("lib/discord/sync-role");
    await mod.syncDiscordRoleForUid(uid);
  } catch (err) {
    log.warn("discord propagation failed", {
      uid,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}

const log = createLogger("patreon.firebase-sync");

const PENDING_COLLECTION = "patreon_pending_links";

export type ApplyTierInput = {
  email: string;
  tier: StudioTierClaim | null;
  patreonId: string;
  lifetimePledgeCents: number;
  tierStartedAt?: string | null;
};

export type ApplyTierResult =
  | { ok: true; matched: true; uid: string }
  | { ok: true; matched: false; stashed: boolean }
  | { ok: false; error: string };

export type RevokeTierInput = {
  email?: string | null;
  patreonId?: string | null;
};

export type RevokeTierResult =
  | { ok: true; revokedFor: string }
  | { ok: true; revokedFor: null; reason: string }
  | { ok: false; error: string };

function normaliseEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function stripTierKeys(
  claims: Record<string, unknown> | null | undefined,
  options: { keepPatreonId: boolean } = { keepPatreonId: true },
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...(claims ?? {}) };
  delete next.tier;
  delete next.tierStartedAt;
  delete next.lifetimePledgeCents;
  if (!options.keepPatreonId) delete next.patreonId;
  return next;
}

export async function applyTier(
  input: ApplyTierInput,
): Promise<ApplyTierResult> {
  if (!input.email) {
    return { ok: false, error: "missing-email" };
  }
  const email = normaliseEmail(input.email);

  const auth = getFirebaseAdminAuth();
  if (!auth) {
    log.warn("apply skipped — firebase admin not configured", { email });
    return { ok: false, error: "firebase-admin-not-configured" };
  }

  try {
    const user = await auth.getUserByEmail(email);
    const existing = (user.customClaims ?? {}) as Record<string, unknown>;
    const merged: Record<string, unknown> = {
      ...existing,
      tier: input.tier,
      tierStartedAt:
        input.tierStartedAt ?? (existing.tierStartedAt as string | undefined) ?? new Date().toISOString(),
      lifetimePledgeCents: input.lifetimePledgeCents,
      patreonId: input.patreonId,
    };
    await auth.setCustomUserClaims(user.uid, merged);
    log.info("tier applied", {
      uid: user.uid,
      email,
      tier: input.tier,
      patreonId: input.patreonId,
    });
    await maybePropagateDiscord(user.uid);
    return { ok: true, matched: true, uid: user.uid };
  } catch (err) {
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? String((err as { code?: unknown }).code)
        : "";
    if (code !== "auth/user-not-found") {
      log.error("apply failed", {
        email,
        err: err instanceof Error ? err.message : String(err),
      });
      return { ok: false, error: err instanceof Error ? err.message : "unknown" };
    }
  }

  const db = getFirebaseAdminDb();
  if (!db) {
    log.warn("no-firestore-for-stash", { email, patreonId: input.patreonId });
    return { ok: true, matched: false, stashed: false };
  }
  try {
    await db
      .collection(PENDING_COLLECTION)
      .doc(input.patreonId)
      .set({
        email,
        tier: input.tier,
        patreonId: input.patreonId,
        lifetimePledgeCents: input.lifetimePledgeCents,
        tierStartedAt:
          input.tierStartedAt ?? new Date().toISOString(),
        stashedAt: new Date().toISOString(),
      });
    log.info("stashed pending link", { email, patreonId: input.patreonId });
    return { ok: true, matched: false, stashed: true };
  } catch (err) {
    log.error("stash failed", {
      email,
      patreonId: input.patreonId,
      err: err instanceof Error ? err.message : String(err),
    });
    return { ok: true, matched: false, stashed: false };
  }
}

export async function revokeTier(
  input: RevokeTierInput,
): Promise<RevokeTierResult> {
  const auth = requireFirebaseAdminAuth();

  const email = input.email ? normaliseEmail(input.email) : null;
  if (email) {
    try {
      const user = await auth.getUserByEmail(email);
      const next = stripTierKeys(user.customClaims as Record<string, unknown>);
      await auth.setCustomUserClaims(user.uid, next);
      log.info("tier revoked by email", { uid: user.uid, email });
      await maybePropagateDiscord(user.uid);
      return { ok: true, revokedFor: user.uid };
    } catch (err) {
      const code =
        typeof err === "object" && err !== null && "code" in err
          ? String((err as { code?: unknown }).code)
          : "";
      if (code !== "auth/user-not-found") {
        log.error("revoke by email failed", {
          email,
          err: err instanceof Error ? err.message : String(err),
        });
        return { ok: false, error: err instanceof Error ? err.message : "unknown" };
      }
    }
  }

  if (input.patreonId) {
    const db = getFirebaseAdminDb();
    if (db) {
      try {
        await db.collection(PENDING_COLLECTION).doc(input.patreonId).delete();
      } catch (err) {
        log.warn("pending stash cleanup failed", {
          patreonId: input.patreonId,
          err: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  return {
    ok: true,
    revokedFor: null,
    reason: email ? "user-not-found" : "no-identifier",
  };
}

export async function consumePendingLink(
  patreonId: string,
  uid: string,
): Promise<boolean> {
  const auth = requireFirebaseAdminAuth();
  const db = getFirebaseAdminDb();
  if (!db) return false;
  const ref = db.collection(PENDING_COLLECTION).doc(patreonId);
  const snap = await ref.get();
  if (!snap.exists) return false;
  const data = snap.data() as
    | {
        email?: string;
        tier?: StudioTierClaim | null;
        patreonId?: string;
        lifetimePledgeCents?: number;
        tierStartedAt?: string;
      }
    | undefined;
  if (!data) return false;
  const user = await auth.getUser(uid);
  const existing = (user.customClaims ?? {}) as Record<string, unknown>;
  await auth.setCustomUserClaims(uid, {
    ...existing,
    tier: data.tier ?? null,
    tierStartedAt: data.tierStartedAt ?? new Date().toISOString(),
    lifetimePledgeCents: data.lifetimePledgeCents ?? 0,
    patreonId,
  });
  await ref.delete();
  log.info("pending link consumed", { uid, patreonId });
  await maybePropagateDiscord(uid);
  return true;
}

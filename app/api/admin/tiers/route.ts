/**
 * POST /api/admin/tiers — operator override for a user's tier claim.
 *
 * Use cases:
 *   - Comp tier (e.g. press, partner, collaborator) without making
 *     them go through Patreon.
 *   - Fix drift when Patreon's webhook hasn't fired (or while testing
 *     in a preview env with no live Patreon).
 *   - Revoke after a refund/chargeback before Patreon's
 *     `members:pledge:delete` lands.
 *
 * Auth: Authorization: Bearer <Firebase ID token>; the token's email
 * must be in the ADMIN_EMAILS allow-list (or carry role=operator).
 *
 * Body: { email: string, tier: "reader-plus"|"member"|"patron"|"atelier"|null, reason?: string }
 *
 * Effect:
 *   1. Look up the target user by email.
 *   2. Merge { tier, tierStartedAt: now, lifetimePledgeCents: 0 (kept
 *      if existing), patreonId: kept if existing, compTieredBy: <operator-uid>,
 *      compReason: <reason> } into custom claims.
 *   3. Trigger Discord propagation (no-op if env unset).
 *
 * The `compTieredBy` + `compReason` fields are written so the next
 * Patreon webhook for the same user doesn't quietly overwrite a comp.
 * applyTier/revokeTier read existing claims as a base, so the comp
 * survives — until an operator explicitly clears it (tier: null).
 */

import { NextResponse } from "next/server";

import { isAdminEmail } from "lib/auth/admin-emails";
import {
  getFirebaseAdminAuth,
  verifyIdToken,
} from "lib/firebase/admin";
import { createLogger } from "lib/log";

export const dynamic = "force-dynamic";

const log = createLogger("api.admin.tiers");

const VALID_TIERS = ["reader-plus", "member", "patron", "atelier", null] as const;
type RequestedTier = (typeof VALID_TIERS)[number];

function isValidTier(value: unknown): value is RequestedTier {
  return value === null || VALID_TIERS.includes(value as RequestedTier);
}

export async function POST(req: Request): Promise<Response> {
  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let operatorUid: string;
  let operatorEmail: string | null;
  let operatorRole: string | null = null;
  try {
    const decoded = await verifyIdToken(
      authHeader.slice("bearer ".length).trim(),
    );
    operatorUid = decoded.uid;
    operatorEmail = decoded.email?.toLowerCase() ?? null;
    operatorRole =
      typeof (decoded as unknown as Record<string, unknown>).role === "string"
        ? ((decoded as unknown as Record<string, unknown>).role as string)
        : null;
  } catch {
    return NextResponse.json({ error: "token_invalid" }, { status: 401 });
  }

  const isOperator =
    operatorRole === "operator" || isAdminEmail(operatorEmail);
  if (!isOperator) {
    log.warn("non-operator tried tier override", { operatorUid, operatorEmail });
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { email?: unknown; tier?: unknown; reason?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (typeof body.email !== "string" || body.email.trim().length === 0) {
    return NextResponse.json({ error: "missing_email" }, { status: 400 });
  }
  if (!isValidTier(body.tier)) {
    return NextResponse.json({ error: "invalid_tier" }, { status: 400 });
  }
  const reason =
    typeof body.reason === "string" && body.reason.trim().length > 0
      ? body.reason.trim().slice(0, 200)
      : null;

  const auth = getFirebaseAdminAuth();
  if (!auth) {
    return NextResponse.json(
      { error: "firebase_admin_unavailable" },
      { status: 503 },
    );
  }

  const targetEmail = body.email.trim().toLowerCase();
  let targetUid: string;
  let existing: Record<string, unknown>;
  try {
    const user = await auth.getUserByEmail(targetEmail);
    targetUid = user.uid;
    existing = (user.customClaims ?? {}) as Record<string, unknown>;
  } catch (err) {
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? String((err as { code?: unknown }).code)
        : "";
    if (code === "auth/user-not-found") {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }
    log.error("user lookup failed", { err: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "user_lookup_failed" }, { status: 500 });
  }

  const next: Record<string, unknown> = { ...existing };
  if (body.tier === null) {
    delete next.tier;
    delete next.tierStartedAt;
    delete next.compTieredBy;
    delete next.compReason;
  } else {
    next.tier = body.tier;
    next.tierStartedAt =
      typeof existing.tierStartedAt === "string"
        ? existing.tierStartedAt
        : new Date().toISOString();
    next.compTieredBy = operatorUid;
    if (reason) next.compReason = reason;
  }

  await auth.setCustomUserClaims(targetUid, next);
  log.info("tier override applied", {
    operatorUid,
    targetUid,
    targetEmail,
    tier: body.tier,
    reason,
  });

  // Propagate to Discord — same lazy-import pattern as
  // lib/patreon/firebase-sync.ts.
  if (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_GUILD_ID) {
    try {
      const mod = await import("lib/discord/sync-role");
      await mod.syncDiscordRoleForUid(targetUid);
    } catch (err) {
      log.warn("discord propagation failed", {
        targetUid,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    targetUid,
    tier: body.tier,
  });
}

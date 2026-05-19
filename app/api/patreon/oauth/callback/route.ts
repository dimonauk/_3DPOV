/**
 * GET /api/patreon/oauth/callback — Patreon OAuth2 redirect target.
 *
 * Flow:
 *   1. Validate the `state` returned by Patreon against the httpOnly
 *      cookie we set in ./start.
 *   2. Exchange `code` for an access token via Patreon's token endpoint.
 *   3. Call /v2/identity with memberships + currently_entitled_tiers to
 *      learn what the linker is entitled to on the studio campaign.
 *   4. Resolve the current Firebase user via the Authorization: Bearer
 *      <idToken> header. If absent, the caller must sign in first.
 *   5. Compute the tier:
 *        - membership on the studio campaign + matching tier id → tier
 *        - email match to a legacy patreon.com/dimonauk supporter →
 *          "reader-plus" claim (special case; not a paid tier)
 *        - otherwise → null
 *   6. Merge into the user's custom claims, then 302 to /rookery/my-wallet
 *      (or the original `return` path embedded in state).
 *
 * Legacy detection: we don't have direct access to the personal campaign,
 * so the heuristic is "the OAuth identity reports memberships but none of
 * them are on the studio campaign". That means the user authorised the
 * studio's OAuth app, has at least one Patreon membership somewhere, and
 * isn't on the studio campaign — most likely a legacy dimonauk supporter.
 */

import { NextResponse } from "next/server";

import {
  requireFirebaseAdminAuth,
  verifyIdToken,
} from "lib/firebase/admin";
import { createLogger } from "lib/log";
import { consumePendingLink } from "lib/patreon/firebase-sync";
import {
  requireStudioCampaignId,
  tierFromPatreonIds,
} from "lib/patreon/tier-map";
import type {
  PatreonIdentityEnvelope,
  PatreonMember,
  PatreonOAuthTokenResponse,
  StudioTierClaim,
} from "lib/patreon/types";

export const dynamic = "force-dynamic";

const log = createLogger("api.patreon.oauth.callback");

const PATREON_TOKEN = "https://www.patreon.com/api/oauth2/token";
const PATREON_IDENTITY =
  "https://www.patreon.com/api/oauth2/v2/identity" +
  "?include=memberships.currently_entitled_tiers" +
  "&fields%5Bmember%5D=lifetime_support_cents,pledge_relationship_start,patron_status,email" +
  "&fields%5Buser%5D=email,full_name";

type StateShape = { n: string; r: string };

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
      "r" in decoded
    ) {
      const obj = decoded as Record<string, unknown>;
      if (typeof obj.n === "string" && typeof obj.r === "string") {
        return { n: obj.n, r: obj.r };
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function exchangeCode(
  code: string,
): Promise<PatreonOAuthTokenResponse | null> {
  const clientId = process.env.PATREON_OAUTH_CLIENT_ID;
  const clientSecret = process.env.PATREON_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.PATREON_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;

  const res = await fetch(PATREON_TOKEN, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) {
    log.warn("token exchange failed", { status: res.status });
    return null;
  }
  return (await res.json()) as PatreonOAuthTokenResponse;
}

async function fetchIdentity(
  accessToken: string,
): Promise<PatreonIdentityEnvelope | null> {
  const res = await fetch(PATREON_IDENTITY, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    log.warn("identity fetch failed", { status: res.status });
    return null;
  }
  return (await res.json()) as PatreonIdentityEnvelope;
}

type ComputedTier = {
  tier: StudioTierClaim | null;
  studioMember: PatreonMember | null;
  hasAnyMembership: boolean;
  patreonEmail: string | null;
  patreonUserId: string;
};

function computeTier(
  identity: PatreonIdentityEnvelope,
  studioCampaignId: string,
): ComputedTier {
  const memberRefs =
    identity.data.relationships?.memberships?.data ?? [];
  const includedMembers = (identity.included ?? []).filter(
    (i): i is PatreonMember => i.type === "member",
  );
  const hasAnyMembership = memberRefs.length > 0;

  let studioMember: PatreonMember | null = null;
  for (const ref of memberRefs) {
    const m = includedMembers.find((x) => x.id === ref.id);
    if (!m) continue;
    const campaignRef = m.relationships?.campaign?.data;
    const campaignId =
      campaignRef && !Array.isArray(campaignRef) ? campaignRef.id : null;
    if (campaignId === studioCampaignId) {
      studioMember = m;
      break;
    }
  }

  let tier: StudioTierClaim | null = null;
  if (studioMember) {
    const tierIds = (
      studioMember.relationships?.currently_entitled_tiers?.data ?? []
    )
      .map((t) => t.id)
      .filter((id): id is string => typeof id === "string");
    tier = tierFromPatreonIds(tierIds);
  }

  return {
    tier,
    studioMember,
    hasAnyMembership,
    patreonEmail: identity.data.attributes?.email ?? null,
    patreonUserId: identity.data.id,
  };
}

function lifetimeOf(member: PatreonMember | null): number {
  const raw = member?.attributes?.lifetime_support_cents;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function safeReturn(target: string): string {
  if (!target.startsWith("/") || target.startsWith("//")) {
    return "/rookery/my-wallet";
  }
  return target;
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      new URL(
        `/rookery/my-wallet?patreon=error&reason=${encodeURIComponent(oauthError)}`,
        req.url,
      ),
    );
  }
  if (!code || !stateParam) {
    return NextResponse.redirect(
      new URL("/rookery/my-wallet?patreon=error&reason=missing_params", req.url),
    );
  }

  const cookieState =
    req.headers
      .get("cookie")
      ?.split(/;\s*/)
      .map((c) => c.split("="))
      .find(([k]) => k === "patreon_oauth_state")?.[1] ?? null;

  if (!cookieState || cookieState !== stateParam) {
    log.warn("state mismatch", {
      hasCookie: Boolean(cookieState),
      received: stateParam.slice(0, 12),
    });
    return NextResponse.redirect(
      new URL("/rookery/my-wallet?patreon=error&reason=state_mismatch", req.url),
    );
  }
  const decoded = decodeState(stateParam);
  if (!decoded) {
    return NextResponse.redirect(
      new URL("/rookery/my-wallet?patreon=error&reason=state_decode", req.url),
    );
  }

  let studioCampaignId: string;
  try {
    studioCampaignId = requireStudioCampaignId();
  } catch (err) {
    log.error("campaign id missing", {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.redirect(
      new URL(
        "/rookery/my-wallet?patreon=error&reason=server_misconfigured",
        req.url,
      ),
    );
  }

  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return NextResponse.redirect(
      new URL(
        `/rookery/sign-in?next=${encodeURIComponent("/api/patreon/oauth/start")}`,
        req.url,
      ),
    );
  }
  const idToken = authHeader.slice("bearer ".length).trim();

  let firebaseUid: string;
  let firebaseEmail: string | null;
  try {
    const decodedToken = await verifyIdToken(idToken);
    firebaseUid = decodedToken.uid;
    firebaseEmail = decodedToken.email?.toLowerCase() ?? null;
  } catch (err) {
    log.warn("firebase token invalid", {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.redirect(
      new URL("/rookery/my-wallet?patreon=error&reason=auth_failed", req.url),
    );
  }

  const tokens = await exchangeCode(code);
  if (!tokens?.access_token) {
    return NextResponse.redirect(
      new URL("/rookery/my-wallet?patreon=error&reason=token_exchange", req.url),
    );
  }

  const identity = await fetchIdentity(tokens.access_token);
  if (!identity) {
    return NextResponse.redirect(
      new URL("/rookery/my-wallet?patreon=error&reason=identity_fetch", req.url),
    );
  }

  const computed = computeTier(identity, studioCampaignId);

  let claimTier: StudioTierClaim | null = computed.tier;
  if (
    !claimTier &&
    computed.hasAnyMembership &&
    !computed.studioMember &&
    computed.patreonEmail &&
    firebaseEmail &&
    computed.patreonEmail.toLowerCase() === firebaseEmail
  ) {
    claimTier = "reader-plus";
  }

  const auth = requireFirebaseAdminAuth();
  const user = await auth.getUser(firebaseUid);
  const existing = (user.customClaims ?? {}) as Record<string, unknown>;
  const lifetimeCents = lifetimeOf(computed.studioMember);
  const tierStartedAt =
    computed.studioMember?.attributes?.pledge_relationship_start ??
    (existing.tierStartedAt as string | undefined) ??
    new Date().toISOString();

  await auth.setCustomUserClaims(firebaseUid, {
    ...existing,
    tier: claimTier,
    tierStartedAt: claimTier ? tierStartedAt : null,
    lifetimePledgeCents: lifetimeCents,
    patreonId: computed.patreonUserId,
  });

  // Propagate to Discord (no-op if env unset). Same lazy import pattern
  // as firebase-sync.ts so Patreon flow stays loadable without Discord.
  if (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_GUILD_ID) {
    try {
      const mod = await import("lib/discord/sync-role");
      await mod.syncDiscordRoleForUid(firebaseUid);
    } catch (err) {
      log.warn("discord propagation failed", {
        uid: firebaseUid,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (computed.studioMember) {
    try {
      await consumePendingLink(computed.studioMember.id, firebaseUid);
    } catch (err) {
      log.warn("pending-link consume failed", {
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  log.info("linked", {
    uid: firebaseUid,
    tier: claimTier,
    patreonUserId: computed.patreonUserId,
    hasStudioMembership: Boolean(computed.studioMember),
  });

  const response = NextResponse.redirect(
    new URL(`${safeReturn(decoded.r)}?patreon=linked`, req.url),
  );
  response.cookies.delete("patreon_oauth_state");
  return response;
}

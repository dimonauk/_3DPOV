/**
 * GET /api/cron/patreon-reconcile — daily drift-correction sweep.
 *
 * Webhooks occasionally drop events. Once a day Vercel Cron hits this
 * endpoint with `Authorization: Bearer ${CRON_SECRET}`. We:
 *
 *   1. Page through GET /v2/campaigns/{id}/members on the studio
 *      campaign using PATREON_STUDIO_API_KEY (creator-level token).
 *   2. For each active member, compute the expected tier from their
 *      currently_entitled_tiers and call applyTier (email-match) →
 *      brings drifted users back into the right tier and stashes any
 *      newly-supporting non-Rookery emails for later linking.
 *   3. For each former_patron, call revokeTier → catches missed
 *      pledge:delete events.
 *
 * Bounded by a `?limit` query param (default 500) so a one-off manual
 * curl doesn't blow the function budget on a campaign with thousands
 * of members. The daily run uses pagination cursors instead.
 */

import { NextResponse, type NextRequest } from "next/server";

import { createLogger } from "lib/log";
import { applyTier, revokeTier } from "lib/patreon/firebase-sync";
import { getCreatorAccessToken } from "lib/patreon/refresh-token";
import {
  requireStudioCampaignId,
  tierFromPatreonIds,
} from "lib/patreon/tier-map";
import type {
  PatreonMember,
  PatreonMembersListEnvelope,
} from "lib/patreon/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const log = createLogger("api.cron.patreon-reconcile");

const PATREON_API = "https://www.patreon.com/api/oauth2/v2";

function isAuthorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

function memberTierIds(member: PatreonMember): string[] {
  const list = member.relationships?.currently_entitled_tiers?.data;
  if (!Array.isArray(list)) return [];
  return list
    .map((t) => t.id)
    .filter((id): id is string => typeof id === "string");
}

function lifetimePledgeCents(member: PatreonMember): number {
  const raw = member.attributes?.lifetime_support_cents;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

async function fetchMembersPage(
  campaignId: string,
  cursor: string | null,
  opts: { forceRefresh?: boolean } = {},
): Promise<PatreonMembersListEnvelope | null> {
  const apiKey = await getCreatorAccessToken({ force: opts.forceRefresh });
  if (!apiKey) {
    log.error("no creator access token available; see runbook §Bootstrap");
    return null;
  }
  const url = new URL(`${PATREON_API}/campaigns/${campaignId}/members`);
  url.searchParams.set("include", "currently_entitled_tiers");
  url.searchParams.set(
    "fields[member]",
    "email,full_name,patron_status,lifetime_support_cents,pledge_relationship_start,last_charge_status",
  );
  url.searchParams.set("page[count]", "100");
  if (cursor) url.searchParams.set("page[cursor]", cursor);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });
  if (res.status === 401 && !opts.forceRefresh) {
    log.warn("members page 401 — forcing token refresh once");
    return fetchMembersPage(campaignId, cursor, { forceRefresh: true });
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    log.error("members page fetch failed", {
      status: res.status,
      body: text.slice(0, 200),
    });
    return null;
  }
  return (await res.json()) as PatreonMembersListEnvelope;
}

type ReconcileSummary = {
  pages: number;
  scanned: number;
  applied: number;
  revoked: number;
  stashed: number;
  errors: number;
};

async function reconcileMember(
  member: PatreonMember,
  summary: ReconcileSummary,
): Promise<void> {
  summary.scanned += 1;
  const email = member.attributes?.email ?? "";
  const patronStatus = member.attributes?.patron_status ?? null;

  if (patronStatus === "former_patron") {
    const result = await revokeTier({
      email: email || null,
      patreonId: member.id,
    });
    if (result.ok) summary.revoked += 1;
    else summary.errors += 1;
    return;
  }

  if (!email) {
    summary.errors += 1;
    return;
  }

  const tier = tierFromPatreonIds(memberTierIds(member));
  const result = await applyTier({
    email,
    tier,
    patreonId: member.id,
    lifetimePledgeCents: lifetimePledgeCents(member),
    tierStartedAt: member.attributes?.pledge_relationship_start ?? null,
  });
  if (!result.ok) {
    summary.errors += 1;
    return;
  }
  if (result.matched) {
    summary.applied += 1;
  } else if (result.stashed) {
    summary.stashed += 1;
  }
}

export async function GET(req: NextRequest): Promise<Response> {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  let campaignId: string;
  try {
    campaignId = requireStudioCampaignId();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "missing_campaign" },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? Math.max(1, Math.min(5000, parseInt(limitRaw, 10) || 500)) : 500;

  const summary: ReconcileSummary = {
    pages: 0,
    scanned: 0,
    applied: 0,
    revoked: 0,
    stashed: 0,
    errors: 0,
  };

  let cursor: string | null = null;
  try {
    while (summary.scanned < limit) {
      const page = await fetchMembersPage(campaignId, cursor);
      if (!page) {
        summary.errors += 1;
        break;
      }
      summary.pages += 1;
      for (const member of page.data) {
        if (summary.scanned >= limit) break;
        await reconcileMember(member, summary);
      }
      const nextCursor = page.meta?.pagination?.cursors?.next ?? null;
      if (!nextCursor) break;
      cursor = nextCursor;
    }
  } catch (err) {
    log.error("reconcile loop crashed", {
      err: err instanceof Error ? err.message : String(err),
      summary,
    });
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "unknown",
        summary,
      },
      { status: 500 },
    );
  }

  log.info("reconcile complete", summary);
  return NextResponse.json({ ok: true, summary });
}

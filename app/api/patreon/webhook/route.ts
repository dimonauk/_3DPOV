/**
 * POST /api/patreon/webhook — Patreon Creator API event receiver.
 *
 * Verifies HMAC-MD5 of the raw body against PATREON_WEBHOOK_SECRET,
 * filters to events from the studio campaign (so events from
 * patreon.com/dimonauk's personal campaign cannot leak in even if
 * someone wires both webhooks to this URL), then dispatches:
 *
 *   members:create / update         → applyTier
 *   members:pledge:create / update  → applyTier
 *   members:pledge:delete           → revokeTier
 *   members:delete                  → revokeTier
 *
 * # Setup on Patreon side
 *   Creator dashboard → Settings → Webhooks → Add webhook
 *   URL: https://holoflow.co.uk/api/patreon/webhook
 *   Trigger on: members:create, members:update, members:delete,
 *               members:pledge:create, members:pledge:update,
 *               members:pledge:delete
 *   Copy the signing secret → Vercel env PATREON_WEBHOOK_SECRET.
 */

import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

import { createLogger } from "lib/log";
import { applyTier, revokeTier } from "lib/patreon/firebase-sync";
import { patreonPreflight, preflightMessage } from "lib/patreon/preflight";
import {
  requireStudioCampaignId,
  tierFromPatreonIds,
} from "lib/patreon/tier-map";
import {
  isPatreonWebhookEvent,
  type PatreonMember,
  type PatreonWebhookEnvelope,
  type PatreonWebhookEventName,
} from "lib/patreon/types";
import { reserveWebhookEvent } from "lib/patreon/webhook-idempotency";

export const dynamic = "force-dynamic";

const log = createLogger("api.patreon.webhook");

function verifySignature(rawBody: string, sigHeader: string | null): boolean {
  const secret = process.env.PATREON_WEBHOOK_SECRET;
  if (!secret) return false;
  if (!sigHeader) return false;
  const computed = createHmac("md5", secret).update(rawBody).digest("hex");
  const a = Buffer.from(computed, "utf8");
  const b = Buffer.from(sigHeader, "utf8");
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function parseEnvelope(raw: string): PatreonWebhookEnvelope | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "data" in parsed &&
      typeof (parsed as { data: unknown }).data === "object"
    ) {
      return parsed as PatreonWebhookEnvelope;
    }
    return null;
  } catch {
    return null;
  }
}

function memberCampaignId(member: PatreonMember): string | null {
  const ref = member.relationships?.campaign?.data;
  if (!ref || Array.isArray(ref)) return null;
  return ref.id ?? null;
}

function memberTierIds(member: PatreonMember): string[] {
  const list = member.relationships?.currently_entitled_tiers?.data;
  if (!Array.isArray(list)) return [];
  return list.map((t) => t.id).filter((id): id is string => typeof id === "string");
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

export async function POST(req: Request): Promise<Response> {
  const preflight = patreonPreflight();
  if (!preflight.ok) {
    log.error("preflight failed — refusing webhook", {
      errors: preflight.errors.map(preflightMessage),
    });
    return NextResponse.json(
      { error: "patreon_not_configured", details: preflight.errors },
      { status: 503 },
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-patreon-signature");
  const eventHeader = req.headers.get("x-patreon-event") ?? "";

  if (!verifySignature(rawBody, signature)) {
    log.warn("signature verification failed", { event: eventHeader });
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  if (!isPatreonWebhookEvent(eventHeader)) {
    log.info("event type ignored", { event: eventHeader });
    return NextResponse.json({ ok: true, ignored: true });
  }
  const event: PatreonWebhookEventName = eventHeader;

  const envelope = parseEnvelope(rawBody);
  if (!envelope) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  let expectedCampaign: string;
  try {
    expectedCampaign = requireStudioCampaignId();
  } catch (err) {
    log.error("studio campaign id not configured", {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "studio_campaign_not_configured" },
      { status: 500 },
    );
  }

  const member = envelope.data;
  const memberCampaign = memberCampaignId(member);
  if (memberCampaign && memberCampaign !== expectedCampaign) {
    log.info("event from non-studio campaign skipped", {
      event,
      memberCampaign,
    });
    return NextResponse.json({ ok: true, skipped: "different_campaign" });
  }

  const idem = await reserveWebhookEvent({
    eventName: event,
    memberId: member.id,
    rawBody,
  });
  if (idem.ok && !idem.firstSeen) {
    log.info("duplicate event acked", {
      event,
      memberId: member.id,
      key: idem.key,
      processedAt: idem.processedAt,
    });
    return NextResponse.json({ ok: true, duplicate: true, key: idem.key });
  }

  const email = member.attributes?.email ?? "";
  const patreonId = member.id;

  if (event === "members:delete" || event === "members:pledge:delete") {
    if (!email && !patreonId) {
      return NextResponse.json({ ok: true, noop: "no_identifier" });
    }
    const result = await revokeTier({
      email: email || null,
      patreonId: patreonId || null,
    });
    if (!result.ok) {
      log.error("revoke failed", { event, error: result.error });
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, revoked: result.revokedFor ?? null });
  }

  if (!email) {
    log.warn("apply event missing email", { event, patreonId });
    return NextResponse.json({ ok: true, noop: "missing_email" });
  }

  const tier = tierFromPatreonIds(memberTierIds(member));
  const result = await applyTier({
    email,
    tier,
    patreonId,
    lifetimePledgeCents: lifetimePledgeCents(member),
    tierStartedAt: member.attributes?.pledge_relationship_start ?? null,
  });

  if (!result.ok) {
    log.error("apply failed", { event, email, error: result.error });
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    event,
    matched: result.matched,
    tier,
  });
}

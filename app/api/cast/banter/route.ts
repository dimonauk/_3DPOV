/**
 * app/api/cast/banter/route.ts — POST /api/cast/banter
 *
 * Surfaces the `agent.banter` capability to the public site. Takes a
 * subset of cast member ids + optional telemetry + a free-text last
 * event; returns the BanterResult (1-3 typed turns).
 *
 * Body:
 *   {
 *     activeSpeakers: CastMemberId[],     // 1..N subset of the cast
 *     telemetry?: BanterTelemetry,        // chronoMode + speed + ...
 *     lastEvent?: string                  // free-text context
 *   }
 *
 * Response:
 *   - 200 → BanterResult { turns, tickMs, followUpEta? }
 *   - 400 → malformed body
 *   - 429 → rate-limited
 *   - 503 → GOOGLE_AI_API_KEY missing (capability returns empty turns
 *           so callers don't crash; we report 503 + body anyway so
 *           the UI can show a graceful "banter offline" badge)
 *
 * Rate: 60 calls / hour / IP — comfortable for the 12-second tick of
 * a single Live Banter widget on the cast page (~300 ticks/hour), but
 * shuts down scripted abuse fast.
 */

import { NextResponse } from "next/server";

import { respondBanter, type BanterContext } from "lib/capabilities/agent/banter";
import { bibles, listCastIds, type CastMemberId } from "lib/cast";
import { createLogger, errToObject } from "lib/log";
import { createFixedWindowLimiter } from "lib/rate-limit/fixed-window";

export const dynamic = "force-dynamic";

const log = createLogger("api.cast.banter");
const HOURLY_CAP = 60;
const limiter = createFixedWindowLimiter({
  scope: "api.cast.banter",
  limit: HOURLY_CAP,
  windowMs: 60 * 60 * 1000,
});

const ALLOWED_IDS = new Set<CastMemberId>(listCastIds());

function isValidId(v: unknown): v is CastMemberId {
  return typeof v === "string" && ALLOWED_IDS.has(v as CastMemberId);
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const slot = await limiter.consume(`ip:${ip}`);
  if (!slot.ok) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((slot.resetAt - Date.now()) / 1000),
    );
    return NextResponse.json(
      {
        error: "rate_limited",
        message: `Banter cap is ${HOURLY_CAP}/hour/visitor. Try again shortly.`,
        retryAfterSec,
      },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "expected application/json body" },
      { status: 400 },
    );
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: "body must be a JSON object" },
      { status: 400 },
    );
  }
  const obj = body as Record<string, unknown>;

  const rawIds = Array.isArray(obj["activeSpeakers"]) ? obj["activeSpeakers"] : [];
  const activeSpeakers = rawIds.filter(isValidId);
  if (activeSpeakers.length === 0) {
    return NextResponse.json(
      {
        error: "activeSpeakers must be a non-empty array of cast member ids",
        validIds: Array.from(ALLOWED_IDS),
      },
      { status: 400 },
    );
  }

  const telemetryRaw =
    typeof obj["telemetry"] === "object" && obj["telemetry"] !== null
      ? (obj["telemetry"] as Record<string, unknown>)
      : {};
  const chronoMode =
    typeof telemetryRaw["chronoMode"] === "string"
      ? (telemetryRaw["chronoMode"] as BanterContext["telemetry"]["chronoMode"])
      : "azure";
  const telemetry: BanterContext["telemetry"] = {
    chronoMode,
    ...(typeof telemetryRaw["speed"] === "number"
      ? { speed: telemetryRaw["speed"] as number }
      : {}),
    ...(typeof telemetryRaw["combo"] === "number"
      ? { combo: telemetryRaw["combo"] as number }
      : {}),
    ...(typeof telemetryRaw["health"] === "number"
      ? { health: telemetryRaw["health"] as number }
      : {}),
    ...(typeof telemetryRaw["phase"] === "string"
      ? { phase: telemetryRaw["phase"] as BanterContext["telemetry"]["phase"] }
      : {}),
  };

  const lastEvent =
    typeof obj["lastEvent"] === "string" && obj["lastEvent"].trim().length > 0
      ? obj["lastEvent"].trim().slice(0, 500)
      : undefined;

  const context: BanterContext = {
    activeSpeakers,
    telemetry,
    ...(lastEvent ? { lastEvent } : {}),
  };

  try {
    const result = await respondBanter(context, bibles);
    return NextResponse.json(result);
  } catch (err) {
    log.error("banter capability failed", { err: errToObject(err) });
    return NextResponse.json(
      { error: "banter_failed" },
      { status: 502 },
    );
  }
}

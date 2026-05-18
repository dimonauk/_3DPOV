/**
 * app/api/inverse-kata/route.ts — Inverse-kata match endpoint.
 *
 * POST a polyline; receive the heuristic match against the studio's
 * kata library. Phase A only (no LLM, no ML). Phase B endpoint will be
 * a sibling at `/api/inverse-kata/orchestrate`.
 *
 * # Auth posture
 *
 * Open. Read-only, no upstream calls, no provider keys. Light per-IP
 * rate-limit to deter abuse.
 *
 * # Request shape
 *
 *   POST /api/inverse-kata
 *   Content-Type: application/json
 *   {
 *     "points": [[x,y], [x,y], ...],
 *     "timing": [0, 50, 110, ...],  // optional, ms from start
 *     "trailScale": 1.0             // optional metres-per-unit
 *   }
 *
 * # Response shape
 *
 *   { result: InverseKataResult }
 */

import { NextResponse } from "next/server";

import { createLogger } from "lib/log";
import { createFixedWindowLimiter } from "lib/rate-limit/fixed-window";
import {
  matchKataSequence,
  type TrailInput,
  type Vec2,
} from "lib/capabilities/inverse-kata/match";

const log = createLogger("api:inverse-kata");

export const dynamic = "force-dynamic";
export const maxDuration = 15;

// ---------- Rate limit ----------

const HOURLY_CAP = 120;
const HOUR_MS = 60 * 60 * 1000;

// Shared limiter — in-memory by default; auto-upgrades to Upstash Redis
// when UPSTASH_REDIS_REST_URL + _TOKEN are set.
const limiter = createFixedWindowLimiter({
  scope: "api.inverse-kata",
  limit: HOURLY_CAP,
  windowMs: HOUR_MS,
});

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

// ---------- Body parsing ----------

type Body = TrailInput & { trailScale?: number };

function parseBody(raw: unknown): Body | { error: string } {
  if (typeof raw !== "object" || raw === null) {
    return { error: "body must be a JSON object" };
  }
  const o = raw as Record<string, unknown>;
  const rawPoints = o["points"];
  if (!Array.isArray(rawPoints) || rawPoints.length < 2) {
    return { error: "points must be an array of at least 2 [x,y] pairs" };
  }
  const points: Vec2[] = [];
  for (let i = 0; i < rawPoints.length; i++) {
    const p = rawPoints[i];
    if (!Array.isArray(p) || p.length !== 2) {
      return { error: `points[${i}] must be a [x,y] pair` };
    }
    const x = p[0];
    const y = p[1];
    if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) {
      return { error: `points[${i}] must be two finite numbers` };
    }
    points.push([x, y]);
  }

  let timing: number[] | undefined;
  if (Array.isArray(o["timing"])) {
    timing = [];
    const rawTiming = o["timing"];
    for (let i = 0; i < rawTiming.length; i++) {
      const t = rawTiming[i];
      if (typeof t !== "number" || !Number.isFinite(t)) {
        return { error: `timing[${i}] must be a finite number (ms)` };
      }
      timing.push(t);
    }
    if (timing.length !== points.length) {
      return { error: "timing.length must equal points.length when supplied" };
    }
  }

  let trailScale: number | undefined;
  if (typeof o["trailScale"] === "number" && Number.isFinite(o["trailScale"])) {
    trailScale = o["trailScale"];
  }

  const out: Body = { points };
  if (timing !== undefined) out.timing = timing;
  if (trailScale !== undefined) out.trailScale = trailScale;
  return out;
}

// ---------- Handler ----------

export async function POST(req: Request) {
  const ip = clientIp(req);
  const slot = await limiter.consume(`ip:${ip}`);
  if (!slot.ok) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((slot.resetAt - Date.now()) / 1000),
    );
    return NextResponse.json(
      {
        error: `Rate-limited — ${HOURLY_CAP} requests per hour per visitor.`,
        code: "rate_limited",
        retryAfterSec,
      },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { error: "expected application/json body" },
      { status: 400 },
    );
  }

  const parsed = parseBody(raw);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const opts = parsed.trailScale !== undefined ? { trailScale: parsed.trailScale } : {};
  const result = matchKataSequence(
    parsed.timing !== undefined
      ? { points: parsed.points, timing: parsed.timing }
      : { points: parsed.points },
    opts,
  );

  log.info("matched", {
    segmentCount: result.segments.length,
    worstConfidence: result.worstConfidence.toFixed(2),
    meanConfidence: result.meanConfidence.toFixed(2),
  });

  return NextResponse.json({ result });
}

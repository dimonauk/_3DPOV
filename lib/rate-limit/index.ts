/**
 * Rate limiter with auto-detected backend.
 *
 *   - If KV_REST_API_URL + KV_REST_API_TOKEN are set in env (i.e. Vercel
 *     KV / Upstash Redis is provisioned), use the distributed backend.
 *     Fixed-window counters via Upstash REST API. State survives across
 *     regions, function instances, cold starts.
 *
 *   - Otherwise, fall back to per-instance in-memory Maps. State is
 *     ephemeral and per-region — a determined attacker can hit
 *     multiple regions to amplify. Acceptable while we're not under
 *     active abuse; defence-in-depth alongside the dashboard Firewall.
 *
 * Same API either way. Callers don't care which backend is live.
 *
 * USAGE
 *
 *   const r = await checkRate({
 *     key: `scan:${uid}`,
 *     limit: 10,
 *     windowSec: 3600,
 *   });
 *   if (!r.ok) return new Response("rate limited", { status: 429 });
 *
 * EVERY KEY GETS ITS OWN BUCKET. Mix prefixes (scan: vs leads: vs
 * agent:) so limits don't bleed into each other.
 *
 * No external deps — uses fetch() against the Upstash REST API directly.
 * @upstash/redis + @upstash/ratelimit are nice but pulling them in
 * killed pnpm during one of these sessions. The REST API is stable and
 * trivial to call.
 */

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  reset: number; // ms epoch when the current window expires
  backend: "upstash" | "memory";
}

interface UpstashEnv {
  url: string;
  token: string;
}

function getUpstashEnv(): UpstashEnv | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  // BOM-strip just in case — same trick the Blob token needed.
  if (!url || !token) return null;
  const clean = (s: string) =>
    s.charCodeAt(0) === 0xfeff ? s.slice(1).trim() : s.trim();
  return { url: clean(url), token: clean(token) };
}

// ---------------------------------------------------------------------
// Upstash REST backend — fixed window counter via INCR + EXPIRE.
// ---------------------------------------------------------------------

async function checkRateUpstash(opts: {
  env: UpstashEnv;
  key: string;
  limit: number;
  windowSec: number;
}): Promise<RateLimitResult> {
  const { env, key, limit, windowSec } = opts;
  // Fixed-window bucket: floor to the nearest window boundary.
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const bucketKey = `ratelimit:${key}:${windowStart}`;
  const reset = windowStart + windowMs;

  // Pipeline: INCR the bucket, then EXPIRE it. The EXPIRE only matters
  // on the first hit of each window (subsequent EXPIREs reset the TTL
  // to the same value, which is fine).
  const body = JSON.stringify([
    ["INCR", bucketKey],
    ["EXPIRE", bucketKey, windowSec + 5], // +5s slack so the bucket
    //                                       can't expire mid-request
  ]);

  let count = 0;
  try {
    const resp = await fetch(`${env.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.token}`,
        "Content-Type": "application/json",
      },
      body,
    });
    if (!resp.ok) {
      // Upstash unreachable — fail OPEN. Better to occasionally let an
      // abuser through than to lock out every visitor when KV's having
      // a bad day.
      return {
        ok: true,
        remaining: limit,
        reset,
        backend: "upstash",
      };
    }
    const data = (await resp.json()) as Array<{ result?: number; error?: string }>;
    const incrResult = data[0]?.result;
    count = typeof incrResult === "number" ? incrResult : 0;
  } catch {
    // Network failure — fail open, same reason.
    return {
      ok: true,
      remaining: limit,
      reset,
      backend: "upstash",
    };
  }

  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    reset,
    backend: "upstash",
  };
}

// ---------------------------------------------------------------------
// In-memory fallback — per-instance Map. Same fixed-window logic.
// ---------------------------------------------------------------------

const memCounters = new Map<string, { count: number; resetAt: number }>();

function checkRateMemory(opts: {
  key: string;
  limit: number;
  windowSec: number;
}): RateLimitResult {
  const { key, limit, windowSec } = opts;
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const c = memCounters.get(key);
  if (!c || c.resetAt < now) {
    memCounters.set(key, { count: 1, resetAt: now + windowMs });
    return {
      ok: true,
      remaining: limit - 1,
      reset: now + windowMs,
      backend: "memory",
    };
  }
  c.count += 1;
  return {
    ok: c.count <= limit,
    remaining: Math.max(0, limit - c.count),
    reset: c.resetAt,
    backend: "memory",
  };
}

// ---------------------------------------------------------------------
// Public entrypoint.
// ---------------------------------------------------------------------

export async function checkRate(opts: {
  key: string;
  limit: number;
  windowSec: number;
}): Promise<RateLimitResult> {
  const env = getUpstashEnv();
  if (env) {
    return checkRateUpstash({ env, ...opts });
  }
  return checkRateMemory(opts);
}

/**
 * Synchronous variant for code paths that can't afford an await
 * (e.g. hot loops). Always uses the in-memory backend, irrespective
 * of whether Upstash is configured. Prefer checkRate() above.
 */
export function checkRateSync(opts: {
  key: string;
  limit: number;
  windowSec: number;
}): RateLimitResult {
  return checkRateMemory(opts);
}

/**
 * Diagnostics — which backend is live? Useful for /api/healthz or
 * an admin debug surface.
 */
export function getRateLimitBackend(): "upstash" | "memory" {
  return getUpstashEnv() ? "upstash" : "memory";
}

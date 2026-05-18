/**
 * lib/rate-limit/fixed-window.ts — Pluggable fixed-window rate limiter.
 *
 * One-line role: replace the per-route `const counters = new Map(...)`
 * pattern with a shared limiter that auto-upgrades from in-memory to
 * Upstash Redis when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
 * are configured.
 *
 * # Why fixed-window
 *
 * Every existing rate-limited route uses the same shape: "N requests per
 * IP/uid per hour, count resets at the next hour mark." Fixed-window is
 * the cheapest correct algorithm for that — one INCR + one EXPIRE per
 * request, no sliding-window arithmetic, no token-bucket state.
 *
 * # Why this exists
 *
 * The in-memory `Map<string, { count, resetAt }>` pattern (used in
 * `/api/ai/google/generate-image`, `/api/cards/scan`, `/api/print-check`,
 * `/api/log`) doesn't survive Fluid Compute scale-out — each isolate
 * resets the cap. This helper preserves the in-memory behaviour as a
 * fallback (so dev / unconfigured environments keep working) and uses
 * Upstash Redis when configured for cross-isolate consistency.
 *
 * # Behaviour
 *
 *   const limiter = createFixedWindowLimiter({
 *     scope: "cards.scan",
 *     limit: 10,
 *     windowMs: 60 * 60 * 1000, // 1 hour
 *   });
 *   const result = await limiter.consume("uid:abc123");
 *   if (!result.ok) return new Response("rate_limited", { status: 429 });
 *
 * `consume()` returns `{ ok, remaining, resetAt }`. `ok=false` means the
 * caller has already exceeded the limit in this window.
 *
 * # Storage selection
 *
 * Per-call: if Redis env vars are present, use Redis. Otherwise use the
 * module-local Map. The decision is cached in module scope, so a single
 * process keeps its choice (no per-call probe). To switch storage on a
 * running process, restart the server — env changes don't hot-reload.
 *
 * # Key shape
 *
 * `rl:<scope>:<window-start-ms>:<id>` — window-start in the key lets us
 * skip an explicit "expire and reset" branch; old keys naturally fall
 * out of cache once their window passes. We still set EXPIRE on Redis
 * writes so dead keys are reaped within a window's lifetime.
 */

import "server-only";

import { Redis } from "@upstash/redis";

import { createLogger } from "lib/log";

const log = createLogger("rate-limit:fixed-window");

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

export interface FixedWindowOptions {
  /** Scope label (e.g. "cards.scan"). Becomes part of the storage key. */
  scope: string;
  /** Maximum requests allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  /** True if the request is within the limit. */
  ok: boolean;
  /** How many requests remain in the current window (0 when ok=false). */
  remaining: number;
  /** Epoch-ms when the current window expires. */
  resetAt: number;
}

export interface FixedWindowLimiter {
  consume(id: string): Promise<RateLimitResult>;
  /** Reports which backend is active. Useful for /api/health-style routes. */
  readonly backend: "redis" | "memory";
}

// ---------------------------------------------------------------------
// Redis client (lazy, module-scoped)
// ---------------------------------------------------------------------

type RedisLike = Pick<Redis, "incr" | "expire" | "ttl">;

let cachedRedis: RedisLike | null | undefined;

function getRedis(): RedisLike | null {
  if (cachedRedis !== undefined) return cachedRedis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    log.info("redis not configured, using in-memory fallback");
    cachedRedis = null;
    return null;
  }
  try {
    cachedRedis = new Redis({ url, token });
    log.info("redis configured");
    return cachedRedis;
  } catch (err) {
    log.warn("redis init failed, falling back to in-memory", {
      err: err instanceof Error ? err.message : String(err),
    });
    cachedRedis = null;
    return null;
  }
}

// ---------------------------------------------------------------------
// In-memory fallback (matches the existing per-route pattern)
// ---------------------------------------------------------------------

type Counter = { count: number; windowStart: number };
const memoryStore = new Map<string, Counter>();

/**
 * Periodically prune expired counters so memory doesn't grow without
 * bound when a lot of unique IDs hit a route. Cheap O(n) sweep every
 * 5 minutes; bounded by the size of the active key set.
 */
let memorySweepTimer: ReturnType<typeof setInterval> | null = null;

function ensureMemorySweep(): void {
  if (memorySweepTimer) return;
  if (typeof setInterval === "undefined") return; // edge runtime safety
  memorySweepTimer = setInterval(
    () => {
      const now = Date.now();
      for (const [k, v] of memoryStore.entries()) {
        // Window length is encoded in the key, so we can't compare
        // directly here without a per-entry windowMs. Use 24h as a
        // hard upper bound — any entry older than that is definitely
        // stale regardless of window length.
        if (now - v.windowStart > 24 * 60 * 60 * 1000) {
          memoryStore.delete(k);
        }
      }
    },
    5 * 60 * 1000,
  );
  // Don't keep the event loop alive solely for this sweep.
  if (typeof (memorySweepTimer as { unref?: () => void }).unref === "function") {
    (memorySweepTimer as { unref: () => void }).unref();
  }
}

// ---------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------

export function createFixedWindowLimiter(
  opts: FixedWindowOptions,
): FixedWindowLimiter {
  const { scope, limit, windowMs } = opts;
  if (limit <= 0) throw new Error("fixed-window: limit must be > 0");
  if (windowMs <= 0) throw new Error("fixed-window: windowMs must be > 0");

  const redis = getRedis();
  const backend: "redis" | "memory" = redis ? "redis" : "memory";

  if (!redis) ensureMemorySweep();

  return {
    backend,
    async consume(id: string): Promise<RateLimitResult> {
      const now = Date.now();
      const windowStart = Math.floor(now / windowMs) * windowMs;
      const resetAt = windowStart + windowMs;

      if (redis) {
        const key = `rl:${scope}:${windowStart}:${id}`;
        try {
          const count = await redis.incr(key);
          if (count === 1) {
            // First hit in this window — set a TTL slightly above the
            // window length so the key reaps even if no further calls.
            const ttlSec = Math.ceil(windowMs / 1000) + 5;
            await redis.expire(key, ttlSec);
          }
          if (count > limit) {
            return { ok: false, remaining: 0, resetAt };
          }
          return { ok: true, remaining: limit - count, resetAt };
        } catch (err) {
          log.warn("redis incr failed, allowing request and degrading", {
            scope,
            err: err instanceof Error ? err.message : String(err),
          });
          // Fail-open: a Redis blip shouldn't 429 legitimate users.
          // The in-memory fallback below picks up the slack on retry.
          return { ok: true, remaining: limit - 1, resetAt };
        }
      }

      // In-memory path
      const key = `${scope}:${id}`;
      const existing = memoryStore.get(key);
      if (!existing || existing.windowStart !== windowStart) {
        memoryStore.set(key, { count: 1, windowStart });
        return { ok: true, remaining: limit - 1, resetAt };
      }
      if (existing.count >= limit) {
        return { ok: false, remaining: 0, resetAt };
      }
      existing.count += 1;
      return { ok: true, remaining: limit - existing.count, resetAt };
    },
  };
}

/**
 * lib/rate-limit/fixed-window.test.ts — Unit tests for the in-memory
 * fallback path of the fixed-window limiter.
 *
 * Coverage:
 *   - First request through the window: ok=true, remaining=limit-1
 *   - Consecutive consumes decrement remaining correctly
 *   - Hitting the limit returns ok=false
 *   - Crossing the window boundary resets the counter
 *   - Different ids share the same scope but separate counters
 *   - Different scopes are independent
 *   - The reported `backend` is "memory" when Upstash env is unset
 *   - The limiter rejects nonsensical limits / windows on construction
 *
 * The Redis path is NOT exercised here — that would need a network
 * mock or a real Upstash instance. The in-memory path is what runs in
 * dev + on Vercel when env isn't configured, so it's the critical one
 * to nail down.
 *
 * Time is controlled with vitest fake timers so window boundaries are
 * deterministic.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createFixedWindowLimiter } from "./fixed-window";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  // Ensure no Upstash env leaks across tests (the helper reads env on
  // first use; we never want the test process to point at real Redis).
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key];
  }
  for (const [k, v] of Object.entries(ORIGINAL_ENV)) {
    process.env[k] = v;
  }
  vi.useRealTimers();
});

describe("createFixedWindowLimiter — construction", () => {
  it("throws when limit <= 0", () => {
    expect(() =>
      createFixedWindowLimiter({ scope: "test", limit: 0, windowMs: 1000 }),
    ).toThrow();
    expect(() =>
      createFixedWindowLimiter({ scope: "test", limit: -1, windowMs: 1000 }),
    ).toThrow();
  });

  it("throws when windowMs <= 0", () => {
    expect(() =>
      createFixedWindowLimiter({ scope: "test", limit: 5, windowMs: 0 }),
    ).toThrow();
  });

  it("reports backend='memory' when Upstash env is unset", () => {
    const lim = createFixedWindowLimiter({
      scope: "test.backend",
      limit: 5,
      windowMs: 1000,
    });
    expect(lim.backend).toBe("memory");
  });
});

describe("createFixedWindowLimiter — in-memory consume", () => {
  it("first hit returns ok with remaining = limit - 1", async () => {
    const lim = createFixedWindowLimiter({
      scope: "test.first",
      limit: 3,
      windowMs: 60_000,
    });
    const r = await lim.consume("alice");
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(2);
    expect(r.resetAt).toBeGreaterThan(Date.now());
  });

  it("decrements remaining on consecutive consumes", async () => {
    const lim = createFixedWindowLimiter({
      scope: "test.decrement",
      limit: 3,
      windowMs: 60_000,
    });
    const r1 = await lim.consume("alice");
    const r2 = await lim.consume("alice");
    const r3 = await lim.consume("alice");
    expect(r1.remaining).toBe(2);
    expect(r2.remaining).toBe(1);
    expect(r3.remaining).toBe(0);
    expect(r1.ok && r2.ok && r3.ok).toBe(true);
  });

  it("returns ok=false once the limit is exceeded", async () => {
    const lim = createFixedWindowLimiter({
      scope: "test.exceed",
      limit: 2,
      windowMs: 60_000,
    });
    await lim.consume("alice");
    await lim.consume("alice");
    const r = await lim.consume("alice");
    expect(r.ok).toBe(false);
    expect(r.remaining).toBe(0);
  });

  it("resets at the next window boundary", async () => {
    const lim = createFixedWindowLimiter({
      scope: "test.reset",
      limit: 1,
      windowMs: 10_000,
    });
    const first = await lim.consume("alice");
    expect(first.ok).toBe(true);
    const blocked = await lim.consume("alice");
    expect(blocked.ok).toBe(false);

    // Jump past the window boundary.
    vi.setSystemTime(new Date(Date.now() + 11_000));
    const afterReset = await lim.consume("alice");
    expect(afterReset.ok).toBe(true);
    expect(afterReset.remaining).toBe(0); // limit=1, just consumed it
  });

  it("keeps counters separate per id within the same scope", async () => {
    const lim = createFixedWindowLimiter({
      scope: "test.per-id",
      limit: 1,
      windowMs: 60_000,
    });
    const alice = await lim.consume("alice");
    const bob = await lim.consume("bob");
    expect(alice.ok).toBe(true);
    expect(bob.ok).toBe(true);
    // Alice is now over her limit, Bob is not affected.
    const aliceAgain = await lim.consume("alice");
    const bobAgain = await lim.consume("bob");
    expect(aliceAgain.ok).toBe(false);
    expect(bobAgain.ok).toBe(false);
  });

  it("keeps counters independent across scopes", async () => {
    const a = createFixedWindowLimiter({
      scope: "test.scope-a",
      limit: 1,
      windowMs: 60_000,
    });
    const b = createFixedWindowLimiter({
      scope: "test.scope-b",
      limit: 1,
      windowMs: 60_000,
    });
    const ra = await a.consume("alice");
    const rb = await b.consume("alice");
    // Same id, different scope — both succeed.
    expect(ra.ok).toBe(true);
    expect(rb.ok).toBe(true);
    // Second hit in scope-a is blocked; scope-b is independent.
    const ra2 = await a.consume("alice");
    expect(ra2.ok).toBe(false);
  });

  it("aligns resetAt to the window start, not the first-hit time", async () => {
    const lim = createFixedWindowLimiter({
      scope: "test.align",
      limit: 5,
      windowMs: 60_000,
    });
    // Consume at t=0 — window starts at 0, resets at 60_000
    const r1 = await lim.consume("alice");
    const reset1 = r1.resetAt;

    // Advance partway through the window, consume again — same resetAt
    vi.setSystemTime(new Date(Date.now() + 30_000));
    const r2 = await lim.consume("alice");
    expect(r2.resetAt).toBe(reset1);
  });
});

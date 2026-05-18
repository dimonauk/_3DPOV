/**
 * GET /api/healthz — operational liveness/readiness probe.
 *
 * Returns 200 with build identifiers so you can quickly verify
 * which commit is actually serving production traffic. The big
 * three:
 *
 *   - sha:        Vercel-injected VERCEL_GIT_COMMIT_SHA (short)
 *   - branch:     VERCEL_GIT_COMMIT_REF
 *   - buildTime:  module-init timestamp (frozen at cold start)
 *
 * Plus operational diagnostics:
 *   - rateLimit:  "upstash" or "memory" — which backend is live
 *
 * Use cases:
 *   - "Did my push actually deploy?" → curl this, compare sha to git log
 *   - "Is distributed rate limiting on?" → rateLimit field
 *   - Monitoring service liveness checks
 *   - Sanity-check the prod alias is current after every deploy
 *
 * No auth — safe to expose. We don't disclose anything an
 * attacker couldn't already read from the public site.
 *
 * Public-cache 60s on Vercel's edge so external probes can hit
 * this repeatedly without burning function invocations.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getRateLimitBackend } from "lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 5;

// Frozen at cold start so it's a stable "this lambda began at..."
// rather than "right now." Helps differentiate cold from warm starts
// when reading logs.
const BUILD_TIME = new Date().toISOString();

// Vercel exposes these at build time; they're inlined into the bundle
// so this endpoint is essentially constant.
const SHA = (process.env.VERCEL_GIT_COMMIT_SHA ?? "unknown").slice(0, 7);
const BRANCH = process.env.VERCEL_GIT_COMMIT_REF ?? "unknown";
const ENV = process.env.VERCEL_ENV ?? "unknown";

export async function GET(_req: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      sha: SHA,
      branch: BRANCH,
      env: ENV,
      buildTime: BUILD_TIME,
      rateLimit: getRateLimitBackend(),
      // ISO timestamp at request time, useful for clock-skew checks.
      now: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        // Short cache so monitoring tools can poll without burning
        // function invocations, while still picking up new builds
        // within a minute.
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    },
  );
}

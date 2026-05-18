import { NextResponse, type NextRequest } from "next/server";
import { withRouteLogging, errToObject, type LogLevel } from "lib/log";
import { createFixedWindowLimiter } from "lib/rate-limit/fixed-window";

/**
 * POST /api/log — receive client-side error reports.
 *
 * Used by the React error boundary (app/error.tsx) and by any
 * client component that wants to surface an error to the server
 * logs. Anyone can post — but rate-limited to 10 reports / min /
 * IP, and bounded size to prevent spam.
 *
 * Body:
 *   {
 *     level: "warn" | "error" | "fatal",
 *     scope: string,        // e.g. "client.error-boundary"
 *     message: string,
 *     meta?: object,        // serialisable, <= ~16 KB stringified
 *     recentLogs?: array,   // tail of the client's ring buffer
 *     pathname?: string,
 *     ua?: string,
 *   }
 *
 * Response:
 *   200 { ok: true, requestId }
 *   400 invalid body
 *   413 payload too large
 *   429 rate-limited
 *
 * The server-side log entry is tagged with `client:` prefix in the
 * scope so it's easy to filter in Vercel logs.
 */

const MAX_BODY_BYTES = 32 * 1024; // 32 KB hard cap
const RATE_LIMIT_PER_MIN = 10;

// Shared limiter — in-memory fallback when Upstash Redis env isn't
// configured (matches the previous local-Map behaviour); auto-upgrades
// to Redis when env is set so the cap holds across isolates.
const limiter = createFixedWindowLimiter({
  scope: "api.log",
  limit: RATE_LIMIT_PER_MIN,
  windowMs: 60_000,
});

export const POST = withRouteLogging("api.log", async (req: NextRequest, _ctx, log) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";

  const limit = await limiter.consume(`ip:${ip}`);
  if (!limit.ok) {
    log.info("client_log:rate_limited", { ip, backend: limiter.backend });
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  // Read raw body to enforce the size cap before parsing.
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    log.info("client_log:too_large", { ip, bytes: raw.length });
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  let body: {
    level?: string;
    scope?: string;
    message?: string;
    meta?: Record<string, unknown>;
    recentLogs?: Array<Record<string, unknown>>;
    pathname?: string;
    ua?: string;
  };
  try {
    body = JSON.parse(raw);
  } catch (err) {
    log.warn("client_log:invalid_json", { err: errToObject(err) });
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const level = (body.level ?? "error") as LogLevel;
  const scope = `client:${(body.scope ?? "unknown").slice(0, 64)}`;
  const message = (body.message ?? "client_error").slice(0, 1000);
  const childLog = log.child({
    ip,
    ua: body.ua?.slice(0, 200),
    pathname: body.pathname?.slice(0, 500),
  });

  // Re-emit on the server side at the requested level.
  switch (level) {
    case "warn":
      childLog.warn(`[${scope}] ${message}`, {
        meta: body.meta,
        recentLogs: body.recentLogs,
      });
      break;
    case "fatal":
      childLog.fatal(`[${scope}] ${message}`, {
        meta: body.meta,
        recentLogs: body.recentLogs,
      });
      break;
    case "error":
    default:
      childLog.error(`[${scope}] ${message}`, {
        meta: body.meta,
        recentLogs: body.recentLogs,
      });
      break;
  }

  return NextResponse.json({ ok: true });
});

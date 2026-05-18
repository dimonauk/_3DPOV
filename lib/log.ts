/**
 * Centralised structured logger for Holo-Flow.
 *
 * Works on BOTH the server (Node runtime) and the client. Server-side
 * logs go to Vercel's stdout (visible in `vercel logs`) and optionally
 * to Firestore for critical errors. Client-side logs ride a small
 * in-memory ring buffer that gets POSTed to /api/log when an error
 * occurs.
 *
 * Every log entry carries:
 *   - level: "debug" | "info" | "warn" | "error" | "fatal"
 *   - scope: short namespace (e.g. "cards.scan", "wallet.apple")
 *   - message: human-readable
 *   - meta: arbitrary structured data
 *   - requestId: per-request id when called from a route handler
 *   - at: ISO timestamp
 *
 * Usage from a server route:
 *
 *   import { logger, withRouteLogging } from "lib/log";
 *
 *   export const POST = withRouteLogging("cards.scan", async (req, log) => {
 *     log.info("Scan started", { contentType: req.headers.get("content-type") });
 *     try {
 *       const result = await scanCardImage(...);
 *       log.info("Scan succeeded", { confidence: result.confidence });
 *       return NextResponse.json(...);
 *     } catch (err) {
 *       log.error("Scan failed", { err: errToObject(err) });
 *       return NextResponse.json({ error: "scan_failed" }, { status: 502 });
 *     }
 *   });
 *
 * The `withRouteLogging` wrapper:
 *   - Generates a per-request requestId (8-char hex)
 *   - Adds it to the response as `X-Request-Id` for client correlation
 *   - Catches any uncaught throw and returns a 500 with the request id
 *   - Logs entry / exit + duration on every request
 */

// Uses the Web Crypto API (globalThis.crypto) instead of node:crypto so
// this module stays isomorphic — `withRouteLogging` is server-only but
// the file is also imported from client components for createLogger.

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export type LogEntry = {
  level: LogLevel;
  scope: string;
  message: string;
  meta?: Record<string, unknown>;
  requestId?: string;
  at: string;
};

export type Logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => void;
  info: (msg: string, meta?: Record<string, unknown>) => void;
  warn: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
  fatal: (msg: string, meta?: Record<string, unknown>) => void;
  /** Returns a child logger with extra default meta merged into every entry. */
  child: (extraMeta: Record<string, unknown>) => Logger;
};

// ---------------------------------------------------------------------
// Sink — where log entries go
// ---------------------------------------------------------------------

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

let runtimeLevel: LogLevel | null = null;

function minLevel(): LogLevel {
  if (runtimeLevel) return runtimeLevel;
  const env = (process.env.LOG_LEVEL ?? "").toLowerCase();
  if (env === "debug" || env === "info" || env === "warn" || env === "error" || env === "fatal") {
    return env;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

/**
 * Override the active log level at runtime. Mainly for tests that want
 * to silence below `error` (or assert on debug output). Passing `null`
 * restores the env/NODE_ENV-derived default.
 */
export function setLogLevel(level: LogLevel | null): void {
  runtimeLevel = level;
}

function shouldEmit(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel()];
}

function format(entry: LogEntry): string {
  const meta =
    entry.meta && Object.keys(entry.meta).length > 0
      ? " " + safeStringify(entry.meta)
      : "";
  const reqId = entry.requestId ? ` [${entry.requestId}]` : "";
  return `${entry.at} ${entry.level.toUpperCase()} ${entry.scope}${reqId}: ${entry.message}${meta}`;
}

function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj, (_k, v) => {
      if (v instanceof Error) return errToObject(v);
      if (typeof v === "bigint") return v.toString();
      return v as unknown;
    });
  } catch {
    return "<unserialisable meta>";
  }
}

/**
 * Convert an Error (or anything thrown) into a plain object suitable
 * for JSON logging. Preserves message + stack + name; drops circular refs.
 */
export function errToObject(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    const obj: Record<string, unknown> = {
      name: err.name,
      message: err.message,
    };
    if (err.stack) obj.stack = err.stack;
    const anyErr = err as unknown as Record<string, unknown>;
    for (const k of Object.keys(anyErr)) {
      if (k !== "name" && k !== "message" && k !== "stack") {
        obj[k] = anyErr[k];
      }
    }
    return obj;
  }
  if (typeof err === "object" && err !== null) {
    try {
      return JSON.parse(JSON.stringify(err));
    } catch {
      return { value: String(err) };
    }
  }
  return { value: String(err) };
}

function emit(entry: LogEntry): void {
  if (!shouldEmit(entry.level)) return;
  const line = format(entry);
  // Use the right console method so log aggregators colour them correctly.
  switch (entry.level) {
    case "debug":
      console.debug(line);
      break;
    case "info":
      console.info(line);
      break;
    case "warn":
      console.warn(line);
      break;
    case "error":
    case "fatal":
      console.error(line);
      break;
  }
  // Client-side: stash in ring buffer so error boundary can flush it.
  if (typeof window !== "undefined") {
    clientRing.push(entry);
    if (clientRing.length > CLIENT_RING_SIZE) clientRing.shift();
  }
}

// ---------------------------------------------------------------------
// Client-side ring buffer (for error reporting)
// ---------------------------------------------------------------------

const CLIENT_RING_SIZE = 50;
const clientRing: LogEntry[] = [];

/** Snapshot the recent client-side log entries. */
export function getClientLogSnapshot(): LogEntry[] {
  return [...clientRing];
}

/** Reset the client-side ring buffer. */
export function clearClientLogs(): void {
  clientRing.length = 0;
}

// ---------------------------------------------------------------------
// Logger factory
// ---------------------------------------------------------------------

function makeLogger(scope: string, requestId?: string, baseMeta?: Record<string, unknown>): Logger {
  const log = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
    emit({
      level,
      scope,
      message,
      meta: { ...(baseMeta ?? {}), ...(meta ?? {}) },
      requestId,
      at: new Date().toISOString(),
    });
  };
  return {
    debug: (m, meta) => log("debug", m, meta),
    info: (m, meta) => log("info", m, meta),
    warn: (m, meta) => log("warn", m, meta),
    error: (m, meta) => log("error", m, meta),
    fatal: (m, meta) => log("fatal", m, meta),
    child: (extra) => makeLogger(scope, requestId, { ...(baseMeta ?? {}), ...extra }),
  };
}

/**
 * Default top-level logger. For route handlers, prefer
 * `withRouteLogging` which injects a request-scoped logger.
 */
export const logger = makeLogger("app");

/**
 * Build a scoped logger directly (e.g. for a server-side library
 * called outside a route handler).
 */
export function createLogger(scope: string, meta?: Record<string, unknown>): Logger {
  return makeLogger(scope, undefined, meta);
}

// ---------------------------------------------------------------------
// Route-handler wrapper
// ---------------------------------------------------------------------

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export type RouteHandler<TContext = unknown> = (
  req: NextRequest,
  context: TContext,
  log: Logger,
) => Promise<Response>;

/**
 * Wrap a Next.js route handler with structured logging, a request id,
 * timing, and a top-level try/catch. The wrapped handler still controls
 * its own response shape — this only intervenes on uncaught throws.
 *
 * The request id is also written into the response as `X-Request-Id`
 * so client-side logs can correlate.
 *
 * Usage:
 *
 *   export const POST = withRouteLogging("cards.scan", async (req, ctx, log) => {
 *     log.info("starting");
 *     ...
 *   });
 */
export function withRouteLogging<TContext = unknown>(
  scope: string,
  handler: RouteHandler<TContext>,
) {
  return async (req: NextRequest, context: TContext): Promise<Response> => {
    const bytes = new Uint8Array(4);
    globalThis.crypto.getRandomValues(bytes);
    const requestId = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const log = makeLogger(scope, requestId);
    const start = Date.now();
    const method = req.method;
    const pathname = new URL(req.url).pathname;
    log.info("request:start", { method, pathname });
    try {
      const res = await handler(req, context, log);
      const dur = Date.now() - start;
      log.info("request:end", { method, pathname, status: res.status, durMs: dur });
      // Add the request id to the response so clients can refer to it.
      try {
        res.headers.set("X-Request-Id", requestId);
      } catch {
        // Some Response types are immutable — clone if so.
        const headers = new Headers(res.headers);
        headers.set("X-Request-Id", requestId);
        return new Response(res.body, {
          status: res.status,
          headers,
        });
      }
      return res;
    } catch (err) {
      const dur = Date.now() - start;
      log.error("request:failed", {
        method,
        pathname,
        durMs: dur,
        err: errToObject(err),
      });
      return NextResponse.json(
        {
          error: "internal_error",
          message: "An unexpected error occurred. Reference: " + requestId,
          requestId,
        },
        {
          status: 500,
          headers: { "X-Request-Id": requestId },
        },
      );
    }
  };
}

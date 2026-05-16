/**
 * app/api/log/route.ts — Client-log forwarding endpoint.
 *
 * Receives JSON batches from the browser logger (lib/log) and writes
 * each entry to the server-side logger so production-only client
 * errors land in Vercel Runtime Logs.
 *
 * Wire-up: in a top-level Client Component (e.g. app/layout.tsx via
 * a small Client Component child), call
 *
 *     enableRemoteLogging({ url: "/api/log" });
 *
 * Defaults forward `warn` and `error` only.
 *
 * The endpoint is intentionally permissive (no auth, no rate limit
 * at the route level) because:
 *   - It never echoes input back to the client
 *   - It does not write to any persistent store
 *   - It only flows into Vercel's existing runtime logs
 *
 * If the studio later wants to keep client logs around (Sentry-style),
 * swap the body of POST() to write to a real store.
 */

import { NextResponse } from "next/server";

import { createLogger, type LogEntry, type LogLevel } from "lib/log";

const log = createLogger("api:log");

// Cap how much we accept per request so a runaway client can't fill
// a Vercel log line with megabytes of garbage.
const MAX_ENTRIES_PER_BATCH = 100;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_FIELDS_BYTES = 8000;

function isLogLevel(v: unknown): v is LogLevel {
  return v === "debug" || v === "info" || v === "warn" || v === "error";
}

function clean(entry: unknown): LogEntry | null {
  if (!entry || typeof entry !== "object") return null;
  const e = entry as Record<string, unknown>;
  if (!isLogLevel(e.level)) return null;
  if (typeof e.namespace !== "string") return null;
  if (typeof e.message !== "string") return null;
  return {
    ts: typeof e.ts === "number" ? e.ts : Date.now(),
    level: e.level,
    namespace: e.namespace.slice(0, 200),
    message: e.message.slice(0, MAX_MESSAGE_LENGTH),
    fields:
      e.fields && typeof e.fields === "object"
        ? truncateFields(e.fields as Record<string, unknown>)
        : undefined,
    server: false,
  };
}

function truncateFields(
  fields: Record<string, unknown>,
): Record<string, unknown> {
  // If the serialised fields object is too big, replace it with a
  // marker. We don't try to recursively trim — the client should be
  // sending shaped, small payloads.
  try {
    const json = JSON.stringify(fields);
    if (json.length > MAX_FIELDS_BYTES) {
      return { _truncated: true, _bytes: json.length };
    }
    return fields;
  } catch {
    return { _unserialisable: true };
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid-json" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !Array.isArray((body as { entries?: unknown[] }).entries)) {
    return NextResponse.json({ ok: false, reason: "shape" }, { status: 400 });
  }

  const raw = (body as { entries: unknown[] }).entries.slice(0, MAX_ENTRIES_PER_BATCH);
  const entries = raw.map(clean).filter((e): e is LogEntry => e !== null);

  for (const entry of entries) {
    const child = createLogger(`client:${entry.namespace}`);
    child[entry.level](entry.message, entry.fields);
  }

  log.debug("ingested batch", { count: entries.length, dropped: raw.length - entries.length });
  return NextResponse.json({ ok: true, count: entries.length });
}

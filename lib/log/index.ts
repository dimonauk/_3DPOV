/**
 * lib/log/index.ts — Universal structured logger.
 *
 * One module, works server-side (Node, Edge, Vercel runtime) AND
 * client-side (browser). Zero dependencies — just `console` under
 * the hood, but with namespaces, levels, and JSON-shaped fields so
 * logs are greppable in Vercel runtime logs and in DevTools.
 *
 * # Usage
 *
 *     import { createLogger } from "lib/log";
 *
 *     const log = createLogger("capability:vrm.load");
 *     log.info("loading vrm", { url });
 *     log.warn("vrm load failed; retrying", { url, attempt });
 *     log.error("vrm load gave up", { url, err });
 *
 * # Where the logs go
 *
 * Server-side: writes to `console.*` -> Vercel Runtime Logs (visible
 * via `vercel logs` CLI or the Project Logs tab in the dashboard).
 *
 * Client-side: writes to `console.*` -> visible in DevTools. When
 * `enableRemoteLogging({ url, levels })` has been called (typically
 * in a top-level layout), errors and warnings ALSO get batched and
 * POSTed to `/api/log` so production-only client errors land in
 * Vercel logs too. Off by default to avoid surprise traffic.
 *
 * # Output shape
 *
 * Server (one line per call, prefixed):
 *     [info]  capability:vrm.load loading vrm { url: '/dimona.vrm' }
 *     [warn]  capability:vrm.load vrm load failed; retrying { url, attempt }
 *
 * Client: structured console group with the namespace as the label.
 *
 * # Levels
 *
 * - debug — verbose internals; off in production by default
 * - info  — normal operational events ("loaded", "started")
 * - warn  — recoverable problems ("retrying", "fell back to X")
 * - error — unrecoverable problems ("could not load", "threw")
 *
 * The threshold reads `process.env.LOG_LEVEL` (server) or
 * `localStorage.LOG_LEVEL` (client). Defaults to "info".
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const IS_SERVER = typeof window === "undefined";

function readThreshold(): LogLevel {
  if (IS_SERVER) {
    const env = (typeof process !== "undefined" ? process.env.LOG_LEVEL : "") ?? "";
    if (env === "debug" || env === "info" || env === "warn" || env === "error") {
      return env;
    }
    return "info";
  }
  try {
    const v = window.localStorage.getItem("LOG_LEVEL");
    if (v === "debug" || v === "info" || v === "warn" || v === "error") return v;
  } catch {
    // localStorage may be unavailable (private mode, cookies blocked).
  }
  return "info";
}

let _threshold: LogLevel | null = null;
function threshold(): LogLevel {
  if (_threshold === null) _threshold = readThreshold();
  return _threshold;
}

/**
 * Force the threshold at runtime. Useful for tests + for the
 * `?log=debug` URL-param escape-hatch consumers can implement.
 */
export function setLogLevel(level: LogLevel): void {
  _threshold = level;
}

// ---------- Remote forwarding (client-only) ----------

type RemoteConfig = {
  /** Endpoint to POST batches to. */
  url: string;
  /** Which levels to forward. Defaults to ["warn", "error"]. */
  levels?: LogLevel[];
  /** Max batch size before flush. Default 20. */
  batchSize?: number;
  /** Max ms between flushes. Default 5_000. */
  flushIntervalMs?: number;
};

let _remote: Required<RemoteConfig> | null = null;
let _remoteBuffer: LogEntry[] = [];
let _flushTimer: ReturnType<typeof setTimeout> | null = null;

export function enableRemoteLogging(config: RemoteConfig): void {
  if (IS_SERVER) return; // client-only feature
  _remote = {
    url: config.url,
    levels: config.levels ?? ["warn", "error"],
    batchSize: config.batchSize ?? 20,
    flushIntervalMs: config.flushIntervalMs ?? 5_000,
  };
}

export function disableRemoteLogging(): void {
  _remote = null;
  if (_flushTimer) {
    clearTimeout(_flushTimer);
    _flushTimer = null;
  }
  _remoteBuffer = [];
}

function scheduleFlush(): void {
  if (!_remote || _flushTimer) return;
  _flushTimer = setTimeout(flushRemote, _remote.flushIntervalMs);
}

function flushRemote(): void {
  if (_flushTimer) {
    clearTimeout(_flushTimer);
    _flushTimer = null;
  }
  if (!_remote || _remoteBuffer.length === 0) return;
  const batch = _remoteBuffer;
  _remoteBuffer = [];
  // Use keepalive so the request survives page-navigation. Errors
  // are silent — the logger must never throw, never block.
  try {
    fetch(_remote.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: batch }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignored — logging must never break the page
  }
}

if (!IS_SERVER && typeof window !== "undefined") {
  // Flush on tab close so the last batch isn't lost.
  window.addEventListener("pagehide", flushRemote);
  window.addEventListener("beforeunload", flushRemote);
}

// ---------- Core ----------

export type LogEntry = {
  /** Wall-clock time of the call (ms since epoch). */
  ts: number;
  level: LogLevel;
  namespace: string;
  message: string;
  /** Arbitrary structured payload. Never personally identifying. */
  fields?: Record<string, unknown>;
  /** True if this call originated server-side. */
  server: boolean;
};

export type Logger = {
  debug: (message: string, fields?: Record<string, unknown>) => void;
  info: (message: string, fields?: Record<string, unknown>) => void;
  warn: (message: string, fields?: Record<string, unknown>) => void;
  error: (message: string, fields?: Record<string, unknown>) => void;
  /** Returns a child logger that inherits + extends the namespace. */
  child: (suffix: string) => Logger;
};

function emit(entry: LogEntry): void {
  if (LEVEL_ORDER[entry.level] < LEVEL_ORDER[threshold()]) return;

  const tag = `[${entry.level}] ${entry.namespace}`;
  const payload = entry.fields && Object.keys(entry.fields).length > 0
    ? [tag, entry.message, entry.fields]
    : [tag, entry.message];

  // `console.error` writes to stderr in Node, which Vercel routes to
  // its error log channel. `console.warn` likewise. Info + debug go
  // to stdout. Matching the level keeps log filtering intuitive.
  switch (entry.level) {
    case "error":
      console.error(...payload);
      break;
    case "warn":
      console.warn(...payload);
      break;
    case "info":
      console.info(...payload);
      break;
    case "debug":
      console.debug(...payload);
      break;
  }

  // Client: forward warn/error to /api/log when configured.
  if (!IS_SERVER && _remote && _remote.levels.includes(entry.level)) {
    _remoteBuffer.push(entry);
    if (_remoteBuffer.length >= _remote.batchSize) {
      flushRemote();
    } else {
      scheduleFlush();
    }
  }
}

/**
 * Create a logger bound to a namespace.
 *
 * Namespace conventions used across the codebase:
 *   - `capability:<id>`       — capability internals (e.g. `capability:vrm.load`)
 *   - `route:<path>`          — page/server-component logs (e.g. `route:/stage`)
 *   - `api:<route>`           — route-handler logs (e.g. `api:/api/log`)
 *   - `service:<name>`        — long-lived service (e.g. `service:firebase`)
 *   - `slice:<name>`          — zustand slice writes
 */
export function createLogger(namespace: string): Logger {
  const make = (level: LogLevel) =>
    (message: string, fields?: Record<string, unknown>) =>
      emit({
        ts: Date.now(),
        level,
        namespace,
        message,
        fields,
        server: IS_SERVER,
      });

  return {
    debug: make("debug"),
    info: make("info"),
    warn: make("warn"),
    error: make("error"),
    child: (suffix: string) => createLogger(`${namespace}:${suffix}`),
  };
}

/** Default logger for ad-hoc use outside a namespaced module. */
export const log = createLogger("app");

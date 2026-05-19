/**
 * Discord REST client with rate-limit handling.
 *
 * Discord's REST API is rate-limited per-route (not globally for most
 * routes), and Discord returns the following headers on every response:
 *
 *   X-RateLimit-Remaining   — calls remaining in the current window
 *   X-RateLimit-Reset-After — seconds (float) until reset
 *   X-RateLimit-Bucket      — opaque bucket identifier
 *
 * On a 429 the body includes `retry_after` (float seconds). The fix is
 * to honour `retry_after` exactly (no exponential backoff — Discord
 * tells you how long to wait), with a small jitter to avoid thundering
 * herd if multiple requests fire concurrently.
 *
 * For our use case (role-sync at human-scale rates, ~one request per
 * patron-event), simple linear backoff with one retry is enough. The
 * cron reconciler spaces calls with `await sleep(60ms)` between
 * members so 50 req/sec global isn't a concern.
 */

import "server-only";

import { createLogger } from "lib/log";

const log = createLogger("discord.rate-limit");

const DISCORD_API = "https://discord.com/api/v10";

type DiscordFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
  /** "bot" uses DISCORD_BOT_TOKEN; "bearer:<token>" uses a user OAuth token; "none" sends no Authorization. */
  auth?: "bot" | `bearer:${string}` | "none";
  /** Number of times to retry on 429. Default 2. */
  maxRetries?: number;
};

export type DiscordFetchResult =
  | { ok: true; status: number; body: unknown }
  | { ok: false; status: number; error: string; body?: unknown };

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function authorizationHeader(
  auth: DiscordFetchOptions["auth"],
): string | null {
  if (auth === "none" || !auth) return null;
  if (auth === "bot") {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) return null;
    return `Bot ${token}`;
  }
  return `Bearer ${auth.slice("bearer:".length)}`;
}

export async function discordFetch(
  path: string,
  opts: DiscordFetchOptions = {},
): Promise<DiscordFetchResult> {
  const url = path.startsWith("http") ? path : `${DISCORD_API}${path}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers ?? {}),
  };
  if (opts.body !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const authHeader = authorizationHeader(opts.auth ?? "bot");
  if (authHeader) headers.Authorization = authHeader;

  const maxRetries = opts.maxRetries ?? 2;
  let attempt = 0;
  while (true) {
    const res = await fetch(url, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      cache: "no-store",
    });

    if (res.status === 429 && attempt < maxRetries) {
      const body = (await res.json().catch(() => ({}))) as {
        retry_after?: number;
      };
      const waitMs = Math.ceil((body.retry_after ?? 1) * 1000) + 100;
      log.warn("rate-limited; honouring retry_after", {
        path,
        attempt,
        waitMs,
      });
      await sleep(waitMs);
      attempt++;
      continue;
    }

    if (res.status === 204) {
      return { ok: true, status: 204, body: null };
    }

    const text = await res.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: `discord-${res.status}`,
        body: parsed,
      };
    }
    return { ok: true, status: res.status, body: parsed };
  }
}

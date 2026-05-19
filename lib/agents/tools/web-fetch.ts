import "server-only";

/**
 * lib/agents/tools/web-fetch.ts — `web.fetch` tool.
 *
 * Pulls a URL and extracts a plaintext blob the specialist can read. We
 * strip tags with a defensive regex (no cheerio in deps) and cap the
 * output at `maxBytes ?? 50000` characters so we don't blow the model's
 * context. The `<title>` tag is pulled out separately so the model can
 * cite where the text came from.
 */

import { createLogger } from "lib/log";

import type { Tool, ToolResult, ToolContext } from "./types";

const log = createLogger("agents.tools.web-fetch");

const FETCH_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_BYTES = 50_000;
const HARD_MAX_BYTES = 250_000;

type FetchArgs = { url: string; maxBytes?: number };

function parseArgs(raw: unknown): FetchArgs | string {
  if (typeof raw !== "object" || raw === null) {
    return "args must be an object";
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.url !== "string" || r.url.trim().length === 0) {
    return "args.url must be a non-empty string";
  }
  // Defensive URL validation — bail before we spend a timeout window on
  // a malformed input.
  try {
    const u = new URL(r.url);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return "args.url must be http:// or https://";
    }
  } catch {
    return "args.url is not a valid URL";
  }
  const maxBytes =
    typeof r.maxBytes === "number" &&
    Number.isFinite(r.maxBytes) &&
    r.maxBytes > 0
      ? Math.min(Math.floor(r.maxBytes), HARD_MAX_BYTES)
      : undefined;
  const result: FetchArgs = { url: r.url };
  if (maxBytes !== undefined) result.maxBytes = maxBytes;
  return result;
}

function extractTitle(html: string): string {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!m || !m[1]) return "";
  return decodeEntities(m[1].replace(/\s+/g, " ").trim());
}

/**
 * Best-effort plaintext extractor. Drops `<script>` and `<style>` blocks
 * wholesale, removes all remaining tags, decodes the common HTML
 * entities, and collapses whitespace. Not a sandboxed parser — assumes
 * the upstream is well-formed enough for a tag-strip pass.
 */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/?(?:p|br|div|li|h[1-6]|tr|td|th|section|article)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t\f\v]+/g, " ")
    .split("\n")
    .map((line) => decodeEntities(line).trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_m, n: string) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCharCode(code) : "";
    });
}

async function run(
  raw: unknown,
  ctx: ToolContext,
): Promise<ToolResult> {
  const parsed = parseArgs(raw);
  if (typeof parsed === "string") {
    return { ok: false, error: parsed };
  }
  const maxBytes = parsed.maxBytes ?? DEFAULT_MAX_BYTES;

  try {
    const res = await fetch(parsed.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; HoloFlowStudioAgent/1.0; +https://holoflow.co.uk)",
        Accept: "text/html,application/xhtml+xml,text/plain,*/*",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `fetch_http_${res.status}`,
      };
    }
    const contentType = (res.headers.get("content-type") ?? "").toLowerCase();
    const body = await res.text();
    let title = "";
    let text = body;
    if (contentType.includes("html") || /<html[\s>]/i.test(body)) {
      title = extractTitle(body);
      text = htmlToText(body);
    } else if (contentType.includes("json")) {
      // JSON — just pretty-print so the model can read the structure.
      try {
        text = JSON.stringify(JSON.parse(body), null, 2);
      } catch {
        text = body;
      }
    }
    if (text.length > maxBytes) text = text.slice(0, maxBytes);

    log.info("web.fetch ok", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      url: parsed.url,
      bytes: text.length,
    });
    return {
      ok: true,
      output: {
        url: res.url || parsed.url,
        title,
        text,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn("web.fetch failed", {
      taskId: ctx.taskId,
      specialist: ctx.callingSpecialist,
      url: parsed.url,
      err: msg,
    });
    return { ok: false, error: `web_fetch_failed: ${msg}` };
  }
}

export const webFetchTool: Tool = {
  name: "web.fetch",
  description:
    "Fetch a single URL and return its plaintext content. Use to read a specific page after web.search or when the user gives you a link.",
  argsSchema: `{
    "url": "string (required) — http(s) URL to fetch",
    "maxBytes": "number (optional, default 50000, max 250000) — character cap on the returned text"
  }`,
  run,
};

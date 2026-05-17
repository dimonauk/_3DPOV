/**
 * POST /api/csp-report — sink for Content-Security-Policy violation
 * reports while we run CSP in report-only mode.
 *
 * Browsers POST here with one of two content types:
 *   - application/csp-report           (legacy report-uri payload)
 *   - application/reports+json         (modern report-to / Reporting API)
 *
 * Both shapes are accepted. We log the violation to stdout via
 * lib/log so it shows up in Vercel function logs, then return 204.
 *
 * Rate-limited at 50 reports / 60s / IP to keep an attacker from
 * filling the log stream with noise. Real-browser report rates are
 * much lower than this — only a tight loop generates 50+/min.
 *
 * NEVER trust the report contents for security decisions. They're
 * client-supplied strings that can contain anything.
 */

import { NextResponse, type NextRequest } from "next/server";
import { withRouteLogging, errToObject } from "lib/log";

export const dynamic = "force-dynamic";
export const maxDuration = 5;

const RATE_LIMIT_PER_MIN = 50;
const counters = new Map<string, { count: number; resetAt: number }>();

function ipHash(req: NextRequest): string {
  // No PII — just enough to bucket reports for rate limiting.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  return ip;
}

function withinRate(key: string): boolean {
  const now = Date.now();
  const c = counters.get(key);
  if (!c || c.resetAt < now) {
    counters.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (c.count >= RATE_LIMIT_PER_MIN) return false;
  c.count += 1;
  return true;
}

export const POST = withRouteLogging(
  "csp.report",
  async (req: NextRequest, _ctx, log) => {
    const key = ipHash(req);
    if (!withinRate(key)) {
      // 429 with no body — the browser doesn't care.
      return new NextResponse(null, { status: 429 });
    }

    let payload: unknown = null;
    try {
      // Both content types are JSON-shaped.
      payload = await req.json();
    } catch (err) {
      log.warn("csp.report:bad_json", { err: errToObject(err) });
      return new NextResponse(null, { status: 204 });
    }

    // Two formats; normalise to a flat shape for logging.
    const reports = Array.isArray(payload)
      ? payload
      : [payload];

    for (const r of reports) {
      const flat: Record<string, unknown> = {};
      if (r && typeof r === "object") {
        // application/csp-report wrapper
        const cspReport = (r as Record<string, unknown>)["csp-report"];
        if (cspReport && typeof cspReport === "object") {
          Object.assign(flat, cspReport);
        }
        // application/reports+json wrapper
        const body = (r as Record<string, unknown>)["body"];
        if (body && typeof body === "object") {
          Object.assign(flat, body);
        }
        // No wrapper — already flat
        if (!cspReport && !body) {
          Object.assign(flat, r);
        }
      }

      log.info("csp:violation", {
        directive:
          flat["violated-directive"] ??
          flat["effectiveDirective"] ??
          "unknown",
        blocked:
          flat["blocked-uri"] ?? flat["blockedURL"] ?? "unknown",
        source:
          flat["source-file"] ?? flat["sourceFile"] ?? null,
        line: flat["line-number"] ?? flat["lineNumber"] ?? null,
        documentUri:
          flat["document-uri"] ?? flat["documentURL"] ?? null,
      });
    }

    return new NextResponse(null, { status: 204 });
  },
);

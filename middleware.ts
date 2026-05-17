/**
 * Edge middleware — runs on every request before Next.js route
 * resolution. Four responsibilities:
 *
 *   1. HOSTNAME ALLOWLIST
 *      Refuse requests whose Host header isn't holoflow.co.uk,
 *      a *.vercel.app preview, or localhost. Blocks the cheap-
 *      and-cheerful "scrape someone's site by spoofing their
 *      domain" attack and catches misrouted traffic early.
 *
 *   2. CRON AUTH
 *      Any request to /api/cron/* must carry the Vercel-issued
 *      Authorization: Bearer ${CRON_SECRET} header. Everything
 *      else gets 401 before the function spins up.
 *
 *   3. REQUEST-ID PROPAGATION
 *      Mint a short hex id and stamp it in X-Request-Id so log
 *      lines in the function and the response are correlatable
 *      end-to-end. Functions also generate their own request id
 *      via withRouteLogging; this one is upstream and survives
 *      even on 404s and other no-function paths.
 *
 *   4. CSP-REPORT-ONLY HEADER
 *      Stamp Content-Security-Policy-Report-Only on every HTML
 *      response so browsers POST violation reports to
 *      /api/csp-report. Audit phase — nothing breaks; we just see
 *      what would have broken if CSP were enforced. Skip on API
 *      routes (CSP doesn't apply to non-HTML) and on the report
 *      endpoint itself (avoid a loop where CSP on the report
 *      endpoint generates a CSP report on the report endpoint).
 *
 * Edge middleware runs in the Vercel Edge runtime — no Node APIs.
 * Keep it small. State is per-region per-instance and not shared,
 * which is why proper rate-limiting belongs in the Firewall layer
 * (dashboard), not here.
 */

import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, CSP_HEADER_NAME } from "lib/security/csp";

const ALLOWED_HOSTNAMES = new Set([
  "holoflow.co.uk",
  "www.holoflow.co.uk",
  "holo-flow-studio.vercel.app",
  "localhost:3000",
  "localhost:3001",
]);

function isAllowedHost(host: string | null): boolean {
  if (!host) return false;
  if (ALLOWED_HOSTNAMES.has(host)) return true;
  // Vercel preview deploys: *.vercel.app subdomain.
  if (/\.vercel\.app$/.test(host)) return true;
  return false;
}

function newRequestId(): string {
  // 8 hex chars — short enough not to clutter logs, long enough to
  // be unique across the volume we'll plausibly see.
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// CSP only goes on HTML responses, not API or asset responses.
// The report endpoint itself is excluded to avoid loops.
function shouldStampCsp(pathname: string): boolean {
  if (pathname.startsWith("/api/")) return false;
  if (pathname.startsWith("/_next/")) return false;
  if (pathname.startsWith("/cards/") && /\.(mind|glb|usdz|png|svg)$/.test(pathname)) {
    return false;
  }
  return true;
}

// Build the CSP header value once at module load. It's a pure
// function of static config — no per-request state needed.
const CSP_VALUE = buildCsp({ reportOnly: true });

export function middleware(req: NextRequest): NextResponse {
  const host = req.headers.get("host");
  if (!isAllowedHost(host)) {
    // Don't leak the allowlist. Just say no.
    return new NextResponse("Not found.", {
      status: 404,
      headers: { "X-Request-Id": newRequestId() },
    });
  }

  // Cron auth — Vercel auto-includes Authorization: Bearer ${CRON_SECRET}
  // for any cron-triggered request to a path declared in vercel.json.
  if (req.nextUrl.pathname.startsWith("/api/cron/")) {
    const auth = req.headers.get("authorization") ?? "";
    const expected = process.env.CRON_SECRET;
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!expected || !token || token !== expected) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: { "X-Request-Id": newRequestId() } },
      );
    }
  }

  const res = NextResponse.next();
  // Propagate a request id on every response that survives this
  // middleware. Functions can override with their own withRouteLogging
  // ids; this is a fallback for static pages and 404s.
  if (!res.headers.has("x-request-id")) {
    res.headers.set("X-Request-Id", newRequestId());
  }

  // CSP — report-only on HTML responses.
  if (shouldStampCsp(req.nextUrl.pathname)) {
    res.headers.set(CSP_HEADER_NAME, CSP_VALUE);
  }

  return res;
}

export const config = {
  // Match everything EXCEPT Next's own asset routes and source maps,
  // which need to flow through untouched.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

import { NextRequest, NextResponse } from "next/server";

// While the studio site is under construction, every public route is
// 302'd to /coming-soon. Whitelisted paths still resolve normally so
// Next internals, the OG image, the favicon, and API routes keep
// working. Remove this file (and app/coming-soon/) to lift the veil.

const PASS_THROUGH_PREFIXES = [
  "/_next/",
  "/c/",      // AR business card landing
  "/api/",
  "/cards/",  // AR card static assets
  "/icon",
  "/signin",
  "/rookery",
  "/learn",
  "/stack",
  "/watch",
  "/the-loop",
  "/aerial",
  "/bureau",
  "/bezel",
  "/services",
  "/play",
  "/chrono-protocol",
  "/sphere",
  "/visualiser",
  "/atelier",
];
const PASS_THROUGH_EXACT = new Set([
  "/coming-soon",
  "/favicon.ico",
  "/opengraph-image",
  "/sitemap.xml",
  "/robots.txt",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PASS_THROUGH_EXACT.has(pathname)) return NextResponse.next();
  if (PASS_THROUGH_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const target = new URL("/coming-soon", request.url);
  return NextResponse.redirect(target, 302);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};

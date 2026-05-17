/**
 * Content-Security-Policy assembly for Holo-Flow Studio.
 *
 * Shipped in REPORT-ONLY mode initially. Browsers evaluate the policy
 * and POST violation reports to /api/csp-report, but the page still
 * loads as if the policy didn't exist. After a week or two of seeing
 * what would have broken, we can either:
 *
 *   - Tighten the directives until violations drop to near-zero
 *   - Flip the header from Content-Security-Policy-Report-Only to
 *     Content-Security-Policy (enforce mode)
 *
 * The directives below are deliberately permissive on script-src and
 * style-src because Next.js inlines SSR hydration scripts + styled-jsx
 * emits inline styles. Once we adopt nonce-based CSP (a Next 16+ thing
 * the canary toolchain doesn't fully support yet), 'unsafe-inline' can
 * come out.
 *
 * Connect-src is the most interesting list — every external origin the
 * site talks to in production. If a new integration is added (e.g. a
 * different LLM provider, a new auth method), its hostname goes here.
 */

const CONNECT_SRC = [
  // Self.
  "'self'",
  // Vercel Blob — VRM models, scan-temp uploads.
  "https://*.public.blob.vercel-storage.com",
  // Firebase Auth + Firestore.
  "https://*.googleapis.com",
  "https://*.firebaseio.com",
  "https://*.firebaseapp.com",
  "https://identitytoolkit.googleapis.com",
  "https://securetoken.googleapis.com",
  "wss://*.firebaseio.com",
  "wss://s-usc1c-nss-*.firebaseio.com",
  // Vercel AI Gateway (server-to-server in functions; here for completeness
  // in case any client-side flow ever talks direct).
  "https://ai-gateway.vercel.sh",
  "https://gateway.ai.cloudflare.com",
  // Anthropic + Google direct (only if any client flow talks direct).
  "https://api.anthropic.com",
  "https://generativelanguage.googleapis.com",
  // Shopify Storefront (homepage products).
  "https://*.shopify.com",
  "https://*.myshopify.com",
  // Vercel Analytics + Speed Insights.
  "https://*.vercel-insights.com",
  "https://vitals.vercel-insights.com",
];

const IMG_SRC = [
  "'self'",
  "data:",
  "blob:",
  "https://*.public.blob.vercel-storage.com",
  "https://cdn.shopify.com",
  // Firebase user-uploaded avatars / Google account images.
  "https://*.googleusercontent.com",
];

const MEDIA_SRC = [
  "'self'",
  "blob:",
  "https://*.public.blob.vercel-storage.com",
];

const FRAME_SRC = [
  "'self'",
  // Booking iframes.
  "https://*.calendly.com",
  "https://*.cal.com",
  // Apple/Google wallet may iframe their pass viewer.
  "https://wallet.apple.com",
  "https://pay.google.com",
];

const SCRIPT_SRC = [
  "'self'",
  // Next.js SSR hydration uses inline event handlers + bootstrap script.
  // 'unsafe-inline' is the conservative choice here while we ship
  // report-only. To migrate to enforce-mode, swap for a per-request
  // nonce stamped into <script nonce={nonce}> tags via middleware.
  "'unsafe-inline'",
  // 'unsafe-eval' is required by some Three.js shader paths + the AI
  // SDK's streaming JSON parser. Worth re-auditing before enforcing.
  "'unsafe-eval'",
  // Vercel Analytics.
  "https://va.vercel-scripts.com",
];

const STYLE_SRC = [
  "'self'",
  // styled-jsx emits inline <style> tags.
  "'unsafe-inline'",
];

const WORKER_SRC = [
  "'self'",
  "blob:",
];

const FONT_SRC = [
  "'self'",
  "data:",
];

/**
 * Build the CSP header string. Pure function — no IO, no state.
 * Called from middleware on every request.
 */
export function buildCsp(opts?: { reportOnly?: boolean; reportPath?: string }): string {
  const reportPath = opts?.reportPath ?? "/api/csp-report";
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": SCRIPT_SRC,
    "style-src": STYLE_SRC,
    "img-src": IMG_SRC,
    "media-src": MEDIA_SRC,
    "connect-src": CONNECT_SRC,
    "frame-src": FRAME_SRC,
    "worker-src": WORKER_SRC,
    "font-src": FONT_SRC,
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'self'"],
  };

  const parts: string[] = [];
  for (const [name, values] of Object.entries(directives)) {
    parts.push(`${name} ${values.join(" ")}`);
  }
  // Reporting endpoint. Both report-uri (legacy) and report-to (new).
  parts.push(`report-uri ${reportPath}`);
  // upgrade-insecure-requests turns any http:// reference in HTML/CSS
  // into https://. Cheap belt-and-braces for mixed-content shenanigans.
  parts.push("upgrade-insecure-requests");

  return parts.join("; ");
}

/**
 * Which header name to use. Always start with the Report-Only variant
 * while we audit what would have broken.
 */
export const CSP_HEADER_NAME = "Content-Security-Policy-Report-Only";

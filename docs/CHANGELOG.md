# Holo-Flow Studio — Changelog

## 2026-05-17 — Pro-tier hardening pass (continued)

### Deferred items completed

The "deferred / not done" list from earlier today is now mostly done:

- **Content-Security-Policy in report-only mode**. Header stamped on every
  HTML response via `middleware.ts`. Violations POST to `/api/csp-report`
  and land in Vercel function logs (rate-limited at 50/min/IP to keep
  noise floor manageable). Directives in `lib/security/csp.ts` —
  permissive `script-src` / `style-src` ('unsafe-inline' + 'unsafe-eval'
  because Next.js inlines SSR hydration and styled-jsx emits inline
  styles), restrictive `connect-src` (explicit allowlist: Vercel Blob,
  Firebase, AI Gateway, Anthropic, Google AI, Shopify, Vercel Analytics).
  **Nothing breaks** — this is the audit phase. Watch logs for a week,
  tighten until violations drop to near-zero, then flip the header name
  from `Content-Security-Policy-Report-Only` to `Content-Security-Policy`.

- **Distributed rate limiter**. New `lib/rate-limit/` module with a single
  `checkRate({ key, limit, windowSec })` interface. Auto-detects:
  - **Upstash backend** when `KV_REST_API_URL` + `KV_REST_API_TOKEN` are
    set (Vercel KV or self-managed Upstash). Fixed-window counter via
    INCR+EXPIRE pipeline against the Upstash REST API. Cross-region
    consistent. Fails OPEN on Upstash errors (better to let an abuser
    through than to lock out every visitor when KV's down).
  - **In-memory fallback** when KV env vars aren't set. Same algorithm,
    per-function-instance state.
  - **Zero external deps** — uses raw `fetch()` against the Upstash REST
    API. `@upstash/redis` would be nice but pulling it in killed pnpm
    once and the API surface is trivial.
  - **`/api/healthz` now reports** `"rateLimit": "upstash" | "memory"`
    so you can verify which backend is live without log-trawling.
  - Wired into both `/api/cards/scan` and `lib/cards/leads-server.ts`.
    To turn on Upstash: provision Vercel KV in the dashboard
    (Storage → Create Database → KV), connect it to the project, and
    `KV_REST_API_URL` + `KV_REST_API_TOKEN` get auto-injected. No code
    change needed; the next deploy picks them up and `/api/healthz`
    will start reporting `"rateLimit":"upstash"`.

### Code quality

- **Dropped legacy multipart + imageBase64 paths in `/api/cards/scan`**.
  All clients have used the `blobUrl` path for one deploy cycle; the
  older code was dead weight + attack surface. Body parser now accepts
  only `{ blobUrl, mediaType? }`. ~70 lines deleted from the route.

- **`vercel.json` header-rule ordering fixed**. The `/api/(.*)` rule was
  being overridden by the global `/(.*)` rule for shared keys
  (Referrer-Policy). Vercel applies LATER matching rules over earlier
  ones in the array, so `/api/(.*)` is now last.

## 2026-05-17 — Pro-tier hardening pass

A single-day push to take advantage of the Vercel Pro upgrade. Seven shipped
commits, four areas of work: silent-failure bug fixes, perf headroom, the
Aura wardrobe feature, and the firewall baseline.

### Fixed

- **Firestore writes were silently failing** (`2f07666`). Two distinct bugs:
  1. `BLOB_READ_WRITE_TOKEN` had a UTF-8 BOM at byte 0 from Vercel's env-var UI
     paste, making the Firebase Admin SDK throw on init. Stripped at module
     load wherever the token is read.
  2. Once admin was working, `createCardLead` rejected payloads where optional
     fields (`message`, `src`) were undefined. Fixed with
     `ignoreUndefinedProperties: true` on Firestore admin init — covers the
     whole class of bug everywhere in the codebase.
  - **Impact**: every lead the site captured before this fix probably never
    reached Firestore. From this deploy forward, all leads persist.

### Performance

- **Function timeouts bumped to 60s** (`7fc55da`) on five AI-bound routes
  (`cards/scan`, `aura/chat`, `aura/agent`, `leads/[id]/enrich`,
  `cards/[slug]/chat`). Pro plan allows up to 300s; 60s is the sweet spot
  for AI vision + multi-tool agent loops.
- **Scanner uploads now go browser→Blob direct** (`2147636`). Bytes never
  touch our function; we only get a Blob URL via `/api/cards/scan`. Bypasses
  the 4.5MB function body limit, halves function CPU usage on big scans.
- **`next/image` on the print-preview page + Blob hostname in
  `remotePatterns`** (`3a97ac4`). Modest win — the site is structurally
  image-lean (CSS gradients, SVGs, dynamic API images).

### New features

- **Aura wardrobe** (`f683677` + `5367e8e`). 7 PBR outfit VRMs (~364 MB
  total) hosted on Vercel Blob. New outfit picker chip row on the Avatar
  tab. New `change_outfit` tool in `lib/cards/aura-card-tools.ts` so the
  agent can swap clothes mid-conversation (`"can you change into something
  more dance-floor?"` → `purple-dance` outfit, ~3-5s load).
- **`/api/healthz`** — operational endpoint returning the running build's
  `sha`, `branch`, `env`, and `buildTime`. Cheap monitoring + quick check
  that production alias is current after each deploy.

### Security

- **Edge middleware** (`2173cba`). Hostname allowlist (404 for Host headers
  other than `holoflow.co.uk`, `*.vercel.app`, `localhost:*`), cron auth
  check on `/api/cron/*`, `X-Request-Id` stamped on every response.
- **Security headers across the board** in `vercel.json`:
  `Strict-Transport-Security`, `X-Frame-Options: SAMEORIGIN`,
  `Cross-Origin-Opener-Policy`, `Permissions-Policy` (kills FLoC/Topics,
  payment/USB/Bluetooth/serial/etc. APIs we never use). API-specific:
  `Cache-Control: private, no-store`, `Cross-Origin-Resource-Policy:
  same-origin`, `Referrer-Policy: no-referrer`.
- **Daily blob janitor** at 04:00 UTC sweeps stranded `scan-temp/*` blobs
  older than 1 hour. Catches the blobs leaked when the scan function
  crashed before its `finally{}` could run `del()`.
- **Stale secrets cleaned up**:
  - `MIGRATE_TOKEN` removed from Vercel env vars (no endpoint reads it
    after the wardrobe-upload teardown).
  - `cards/dimona/aura.vrm` deleted from Blob (duplicated as
    `wardrobe/baby-pink-spice.vrm`).

### Migration notes

- Env vars added: `CRON_SECRET` (64-char hex, required for the daily cron).
- Env vars removed: `MIGRATE_TOKEN`.
- Blob bucket changes: +7 wardrobe outfits, -1 stale dimona VRM.
- No data migration required.
- **Breaking**: `/api/cards/scan` no longer accepts multipart or
  `{ imageBase64 }` bodies. All clients must POST `{ blobUrl }`. The
  shipped `CardScanner.tsx` already uses the Blob path.

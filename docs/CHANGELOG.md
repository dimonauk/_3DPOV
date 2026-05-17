# Holo-Flow Studio — Changelog

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

### Deferred / not done

- **Content-Security-Policy**: site uses Three.js + WebGL + MindAR camera +
  Web Speech + Vercel Blob cross-origin VRMs + Firebase + AI Gateway +
  embedded booking iframes. Strict CSP would break things until each origin
  is audited. Worth a separate session in report-only mode.
- **Dashboard-side firewall**: Bot Protection toggle, per-IP rate limits
  with cross-region state, optional defensive custom rules. See
  `docs/FIREWALL.md` for the exact rules to copy in.
- **Upstash Redis rate limiting**: overkill for current traffic. In-app
  limits + Firewall layer cover realistic abuse.

### Migration notes

- Env vars added: `CRON_SECRET` (64-char hex, required for the daily cron).
- Env vars removed: `MIGRATE_TOKEN`.
- Blob bucket changes: +7 wardrobe outfits, -1 stale dimona VRM.
- No data migration required. No breaking API changes (legacy multipart +
  imageBase64 paths in `/api/cards/scan` kept for backward compat).

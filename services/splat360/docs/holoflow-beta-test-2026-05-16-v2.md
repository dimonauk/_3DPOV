# Holoflow Studio — Playwright beta-test sweep — 2026-05-16 (v2)

Successor to `holoflow-beta-test-2026-05-16.md`, which crashed at boot because of the
`/studio` vs `/studio/[[...tool]]` route collision. That collision is fixed (the web
360 editor moved to `/edit`; Sanity Studio keeps `/studio`). This run actually
landed on every route.

**Method.** Headless Chromium via Playwright (Python). For each route: navigate,
wait for DOMContentLoaded, wait for network idle (15s soft-cap), full-viewport
screenshot at 1440×900, capture every `console` event and every `pageerror`,
record the HTTP status. Screenshots in
`D:\The_Hangar\engines\splat360\artifacts\beta-test-2026-05-16\`; raw JSON in
the same directory as `_results.json`.

**Scope.** 76 routes. Top-level public surfaces + the moved `/edit` + Sanity
`/studio` + every `/atelier`, `/visualiser`, `/chrono-protocol`, `/rookery`,
`/policies`, `/demo` route. Skipped: authenticated admin (`/admin/*`),
parameterised routes with no seeded data (`/c/[slug]`, `/journal/[slug]`,
`/holo-walk/[id]`, …), and `/signin/callback`.

## Boot status

The dev server now boots clean in ~1 s under Turbopack. No
route-collision error. Confirmed before sweep:

```
GET /edit   -> HTTP 200 (6.0s, first compile)
GET /studio -> HTTP 200 (9.3s, first compile)
```

Both routes still served 200 inside the sweep at warmed timings (2.7s and 1.7s).
Sanity Studio renders its `NotConfigured` fallback because
`NEXT_PUBLIC_SANITY_PROJECT_ID` is unset locally; that is expected, not a bug.

## Headline numbers

| Metric | Count |
|---|---|
| Routes hit | **76** |
| 200 OK | 75 |
| 500 | 1 (`/pipelines`) |
| Routes with `pageerror` (real exception escaped to React) | 4 |
| Routes with `console.error` | 75 (74 of those are the universal Firebase App Check 403 — see P2.1) |
| Routes with **route-specific** console errors | 9 |

## P0 — must-fix before a deploy

### P0.1 — `/pipelines` is broken (HTTP 500)

The page throws on render:

```
Error: Dynamic href `/holo-walk/[id]/ar` found in <Link> while using the
`/app` router, this is not supported.
Read more: https://nextjs.org/docs/messages/app-dir-dynamic-href
```

A `next/link` on the pipelines page has a literal `[id]` segment in its
`href`. App Router requires resolved paths — either resolve the id before
rendering (`/holo-walk/${id}/ar`) or move to a `useRouter().push(...)` call.

**Repro:** `curl -o /dev/null -w "%{http_code}" http://localhost:3000/pipelines`
→ 500.
**Screenshot:** `pipelines.png`.

## P1 — visible breakage on otherwise-loading pages

### P1.1 — `/play` and `/play/neo-london` — React hydration mismatch

Both throw a `Hydration failed because the server rendered HTML didn't match the
client` pageerror. Trees regenerate client-side, so the page is *eventually*
usable, but the first paint flashes wrong content and the React tree is
discarded — bad first-paint, double the rendering work, console-noisy.

**Likely cause:** a Client Component branching on `typeof window` or
`Date.now()` / `Math.random()` during render. Search `app/play/` and
`components/` for `typeof window !== 'undefined'`.

**Screenshots:** `play.png`, `play-neo-london.png`.

### P1.2 — `/cards/mine` — cross-origin frame access blocked

`Failed to read a named property 'toJSON' from 'Window': Blocked a frame with
origin "http://localhost:3000" from accessing a cross-origin frame.`

Either an embedded `<iframe>` is being introspected by JS, or a postMessage
handler is reaching into a cross-origin frame. Page still renders, but the
exception is uncaught.

**Screenshot:** `cards-mine.png`.

### P1.3 — `/visualiser/laban-dial` — null-property write

`TypeError: Cannot set properties of undefined (setting 'needsUpdate')`

Classic three.js shape: code is calling `material.map.needsUpdate = true` (or
`texture.needsUpdate`) before the resource exists. Add a guard, or await the
loader.

**Screenshot:** `visualiser-laban-dial.png`.

### P1.4 — `/atelier/poi-sculptor` — WebGL shader compile error

```
THREE.WebGLProgram: Shader Error 0 - VALIDATE_STATUS false
VERTEX  ERROR: 0:344: 'mod' : no matching overloaded function found
```

TSL is emitting `mod()` with a signature the WebGL2 GLSL ES 3.0 backend doesn't
have (most likely `mod(int, int)` or `mod(float, int)`). Almost certainly a
WebGPU-vs-WebGL fallback path that hasn't been smoke-tested under WebGL. Page
loads but the canvas stays black.

Page also takes 16.6s to settle (worst load in the sweep) and emits 55
warnings, mostly TSL shader fallback noise.

**Screenshot:** `atelier-poi-sculptor.png`.

### P1.5 — `/demo/vrm` and `/demo/aura-talks` — `/nanny.vrm` 404

Both demos fetch `http://localhost:3000/nanny.vrm` and get 404. `nanny.vrm`
needs to live in `public/` (or be served from a remote URL configured via env).
This is the demo's central asset — without it the VRM scene is empty.

**Screenshots:** `demo-vrm.png`, `demo-aura-talks.png`.

### P1.6 — `/research/cctv-3d-archive` — Firebase Admin not configured

```
cctv-3d-archive: mediaList failed Error: firebase-admin: FIREBASE_ADMIN_SERVICE_ACCOUNT
env not set. Set the JSON service-account key in Vercel project env
(Production + Preview + Development).
```

Server-side data fetch fails, the page renders an empty state instead. Expected
locally (the env var lives only in Vercel); flagging because production must
have it set or this page will be a ghost.

**Screenshot:** `research-cctv-3d-archive.png`.

## P2 — noise to clean up

### P2.1 — Firebase App Check debug-token exchange returns 403 on every page

74 of 76 routes log:

```
Failed to load resource: the server responded with a status of 403 ()
content-firebaseappcheck.googleapis.com/v1/projects/holoflow-studio/apps/.../exchangeDebugToken
```

The site initialises Firebase App Check globally; locally there is no
registered debug token, so the exchange returns 403. App Check is *meant* to
fail-closed here, but the noise drowns every other console message.

**Fixes** (cheapest first):

- Gate App Check init to skip when `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN`
  is unset (single-line guard at the init call).
- Or: register a localhost debug token in the Firebase console and put it in
  `.env.local`.

Until this is gated, every "errors=1" line in the sweep table is *this* error.
The two routes that escape it (`/atelier/shape-of-it` and `/contact` — the
latter has a different 403 from elsewhere) likely don't import the global
Firebase provider, worth a look.

### P2.2 — `/bureau` — CSP frame-ancestors violation framing google.com

```
Framing 'https://www.google.com/' violates the following report-only CSP
directive: "frame-ancestors 'self'".
```

Page embeds Google (probably a Maps embed) inside an iframe. CSP is in
report-only mode so it's a warning, not a block, but it means the iframe will
actually break if/when CSP moves to enforce. Either swap the embed for a
google.com/maps/embed URL (allowed) or update the CSP directive.

**Screenshot:** `bureau.png`.

### P2.3 — `/contact` and `/play/neo-london` — hydration *warning* (not error)

```
A tree hydrated but some attributes of the server rendered HTML didn't match the
client properties. This won't be patched up.
```

Less severe than the P1.1 hydration *failures* on `/play` — these are attribute
drifts, not whole-tree mismatches. Same root cause likely; same fix pattern.

### P2.4 — `/spatial/video` — `ERR_CONNECTION_REFUSED` on some fetch

A backend service is expected at a port that isn't listening locally (likely
the bench-bridge to a localhost AI / video service per
[[holoflow-bench-bridge]]). Not a code bug, just a missing dev-side service.

### P2.5 — Long first-load times on three.js / WebGPU pages

| Route | Load (ms) |
|---|---|
| `/atelier/poi-sculptor` | 16,603 |
| `/demo/aura-talks` | 16,117 |
| `/demo/vrm` | 15,841 |
| `/rookery` | 15,667 |

Cold Turbopack compile of large WebGL bundles. Not necessarily a *bug*, but
worth a follow-up: chunk-split the three.js/TSL/VRM bundles so the first paint
isn't waiting on the full graphics stack. `/rookery` is more surprising — it's
ostensibly a feed page; check whether it eagerly bundles the splat viewer.

## Things that worked (don't regress)

- **The `/studio` ⇄ `/edit` split.** Both serve 200. The editor's chrome-bypass
  layout works (`HOLOFLOW EDIT` header renders without site nav). Sanity's
  catch-all still resolves.
- **Every `/policies/*` page** renders fast (<2s) and clean — privacy, terms,
  print-bureau-terms are reachable and the only error is the universal P2.1.
- **All seven `/visualiser/*` routes except `laban-dial`** render clean.
- **All four `/atelier` algorithmic-art routes except `poi-sculptor`** render
  clean. `shape-of-it` is the only route in the entire sweep with zero
  console errors — the global Firebase noise can't reach it for some reason
  (single positive data point worth understanding when fixing P2.1).
- **`/aura/web-llm`** loads in 1.9s without WebGPU bring-up time (the model
  download must be lazy — good).
- **Sanity NotConfigured fallback** renders correctly. No crash, no white
  screen — the project-id-missing path is handled.

## Per-route table

The full per-route record is in `_results.json` next to the screenshots.
Summary (75 routes returning 200 OK; only the route-specific findings are
called out below — every "1 console error" is the Firebase 403 from P2.1):

| Route | Status | Notes |
|---|---|---|
| `/pipelines` | **500** | P0.1 — Dynamic Link href |
| `/play` | 200 | P1.1 — hydration failed |
| `/play/neo-london` | 200 | P1.1 — hydration failed |
| `/cards/mine` | 200 | P1.2 — cross-origin frame |
| `/visualiser/laban-dial` | 200 | P1.3 — `needsUpdate` on undefined |
| `/atelier/poi-sculptor` | 200 | P1.4 — TSL `mod()` shader error, 16.6s |
| `/demo/vrm` | 200 | P1.5 — `/nanny.vrm` 404, 15.8s |
| `/demo/aura-talks` | 200 | P1.5 — `/nanny.vrm` 404, 16.1s |
| `/research/cctv-3d-archive` | 200 | P1.6 — Firebase Admin env missing |
| `/contact` | 200 | P2.3 — hydration warning |
| `/bureau` | 200 | P2.2 — CSP frame-ancestors |
| `/spatial/video` | 200 | P2.4 — ERR_CONNECTION_REFUSED on backend |
| `/rookery` | 200 | P2.5 — 15.7s cold load |
| `/atelier/shape-of-it` | 200 | The only fully-clean route (zero errors) |
| All other 62 routes | 200 | Clean apart from the universal P2.1 |

## Recommended fix order

1. **Patch `/pipelines`** (P0.1) — single `<Link href="/holo-walk/[id]/ar">`
   somewhere on that page. 5-minute fix.
2. **Gate Firebase App Check on missing debug token** (P2.1) — single guard at
   init. This unmasks the real signal in 74 routes' console logs and makes
   future regressions actually visible.
3. **Drop `nanny.vrm` into `public/`** (P1.5) — fixes both VRM demos.
4. **Add `needsUpdate` guard on `/visualiser/laban-dial`** (P1.3).
5. **Hydration audit on `/play/*`** (P1.1) — search Client Components under
   `app/play/` and `components/play/` for `typeof window` / non-deterministic
   render values.
6. **TSL `mod()` polyfill or workaround on `/atelier/poi-sculptor`** (P1.4).
7. The rest are documentation / env-var setup, not code changes.

## Reproduction

```bash
# from D:\.github\_3DPOV
pnpm run dev          # leave running
"C:/Users/dimon/AppData/Local/Programs/Python/Python312/python.exe" \
  D:/tmp/holoflow-beta-sweep.py
# screenshots + _results.json land in
#   D:\The_Hangar\engines\splat360\artifacts\beta-test-2026-05-16\
```

The sweep script and its 403-finder helper live at `D:\tmp\holoflow-beta-sweep.py`
and `D:\tmp\find-403.py` — keep them out of the repo for now, promote to
`scripts/` if we want this as a CI gate.

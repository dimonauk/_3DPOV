# Holoflow beta-test runtime audit — 2026-05-16

Companion to `holoflow-audit-2026-05-16.md` (static audit, same day).
The brief was: boot the dev server, walk every route in headless
Chromium, screenshot each, capture console + network + hydration
errors, write up. The walk did not happen — `pnpm run dev` died on
boot with a third deploy-blocker the static audit missed.

## TL;DR

- **`pnpm run dev` aborts in < 5 s** with a route-specificity error
  the static audit did not catch:
  `Error: You cannot define a route with the same specificity as a
  optional catch-all route ("/studio" and "/studio[[...tool]]").`
  `app/studio/page.tsx:27` (the new web 360 editor) collides with
  `app/studio/[[...tool]]/page.tsx:25` (the Sanity Studio mount).
  This is **P0 #3** — sibling-level to the audit's `/holo-walk/[id]/qr`
  collision and the onnxruntime-node webpack bundle. Listed in
  the audit's "Recent-additions integrity" table line for
  `app/studio/page.tsx` as "client + server pages present" with no
  collision flag, because the static check looked at each file in
  isolation rather than at App Router's resolved tree.
- **0 routes walked, 0 screenshots taken** because the server never
  came up. The brief's own escape clause applied — "if it doesn't
  respond after 90 s, capture the log and stop. The dev-server
  failing to boot IS the top finding."
- **Two secondary runtime deltas vs. the prior audit**: (a) the
  navbar has been re-skinned since the audit was written —
  `components/layout/navbar-config.ts:19-74` now exposes 5 groups
  / ~25 destinations, not the "only `/` and `/stack`" the audit
  reported; (b) `next.config.ts` has no `turbopack` block at all,
  only `webpack`, so the audit's onnxruntime-node alias is **not
  in effect under `next dev --turbopack`** — that finding is build-
  time only, but worth flagging so nobody chases it the wrong way
  during dev-server debugging.

## Setup state

| Item | Value |
| --- | --- |
| Repo | `D:\.github\_3DPOV\` |
| Branch | `holoflow-commerce` (per prior audit; `git` denied by sandbox so not re-verified) |
| Package manager | `pnpm 9.15.0` on PATH |
| Dev command | `next dev --turbopack` (`package.json:5`) |
| First-compile time | n/a — server died before "Ready in" |
| Boot result | **failed, exit code 1** in ~3 s |
| Browser planned | Chromium 1217 from `C:/Users/dimon/AppData/Local/ms-playwright/chromium-1217/` (Playwright 1.60.0 via `npx`) |
| Viewport(s) planned | 1440×900 + 390×844 mobile pass on hero routes |
| Screenshot dir | `D:\The_Hangar\engines\splat360\docs\beta-test-shots-2026-05-16\` (created, **empty** — 0 PNGs) |
| Routes enumerated | 108 `page.tsx` files under `app/` (101 candidates after skipping 7 `app/admin/`) |
| Routes tested | 0 |
| Routes skipped | 108 (server boot failure) |

The walk was never executed. Everything below catalogues what was
discovered during the failed-boot phase + cross-references against
the static audit.

## The boot failure (the entire "P0" surface)

### Reproduction

```
cd D:\.github\_3DPOV
pnpm run dev
```

Full captured output (24 lines, all that was emitted before exit
code 1):

```
[baseline-browser-mapping] The data in this module is over two months old.
 ⚠ Warning: Next.js inferred your workspace root, but it may not be correct.
 We detected multiple lockfiles and selected the directory of D:\package-lock.json as the root directory.
 To silence this warning, set `turbopack.root` in your Next.js config, or consider removing one of the lockfiles if it's not needed.
 Detected additional lockfiles:
   * D:\.github\_3DPOV\pnpm-lock.yaml

   ▲ Next.js 15.6.0-canary.60 (Turbopack)
   - Local:        http://localhost:3000
   - Network:      http://100.122.69.49:3000
   - Environments: .env.local
   - Experiments (use with caution):
     ✓ ppr
     ✓ rdcForNavigations (enabled by `experimental.ppr`)
     ✓ useCache

 ✓ Starting...
Error: You cannot define a route with the same specificity as a optional catch-all route ("/studio" and "/studio[[...tool]]").
    at ignore-listed frames
```

Server exits. No port opened, no compilation attempted, no
"Ready in" line. `localhost:3000` is unreachable for the entire
session.

### Why it fires

`app/studio/page.tsx:27` defines the **`/studio` web 360 editor**:

```tsx
import StudioClient from "./studio-client";

export default function StudioPage() {
  return <StudioClient />;
}
```

`app/studio/[[...tool]]/page.tsx:25` defines the **`/studio` Sanity
Studio mount** (same path because `[[...tool]]` is an *optional*
catch-all and matches zero segments):

```tsx
import { StudioClient } from "./StudioClient";

export const dynamic = "force-static";
export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage(): React.ReactNode {
  ...
```

Both pages resolve to `/studio`. App Router's optional-catch-all
spec ([Next.js docs: Optional Catch-all
Segments](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes#optional-catch-all-segments))
forbids a sibling page at the parent path because there is no way
to disambiguate which page should render at the bare path.

### Why the static audit missed it

The audit's "Recent-additions integrity" table
(`holoflow-audit-2026-05-16.md:280-296`) lists both
`app/studio/page.tsx` and `app/studio/[[...tool]]/page.tsx` but
treats them as the same item ("client + server pages present, four
components wired"). The integrity check was per-file: does the
file import cleanly, does TypeScript pass, does the capability it
references exist. It did not run the App Router tree-resolution
pass that Next does at boot. The only sibling-route collision the
audit flagged was `/holo-walk/[id]/qr/{page.tsx,route.ts}` (P0
§1) — which is a different class (page vs route handler at the
same path, not page vs page at the same path through an optional
catch-all).

It also did not boot the dev server during the audit — it only ran
`pnpm run build`. The prior `D:\.github\_3DPOV\dev.log` shows that
**yesterday's dev session booted in 4.8 s** (May 15 22:03) with the
same `next dev --turbopack` command. So the collision was
introduced today, between yesterday's dev session and today's
audit, by whichever commit added `app/studio/page.tsx`.

### Fix shape (not implemented — read-only audit)

Three options, in increasing surgery:

1. **Move the Sanity Studio off `/studio`.** It is a separate
   product surface (CMS authoring) and the new web 360 editor at
   `/studio` is the public-marketed feature. Move
   `app/studio/[[...tool]]/` to `app/admin/sanity/[[...tool]]/`
   (it already lives behind operator gates per `app/studio/[[...tool]]/page.tsx:29-30`'s
   `NotConfigured` fallback). Update `sanity/sanity.config.ts` if
   it has a hard-coded `basePath: "/studio"`.
2. **Rename the new editor to `/composer`, `/editor`, or `/loom`.**
   Keep Sanity at `/studio`. Smaller diff (one route move + the
   navbar link + `PURPOSE.md` references) but the operator-facing
   word "Studio" probably belongs to the editor, not the CMS.
3. **Make `[[...tool]]` a required catch-all `[...tool]`.** Removes
   the collision (Next then forbids only same-name optional + page,
   not required-catch-all + page). But `app/studio/[[...tool]]/page.tsx:25`
   intentionally renders at the bare `/studio` for the CMS landing
   — switching to a required catch-all would 404 the CMS landing.

Option 1 is the cleanest if `/studio` is meant to ship as the web
editor (which all the `app/studio/PURPOSE.md` + the new `studio/PRINT.md`
suggest).

## P0 — page fails to load

Inapplicable: dev server never accepted a request. Every route is
P0 by definition (502 / connection refused). One **route** is the
direct trigger:

| Route | Status | Top error | Screenshot |
| --- | --- | --- | --- |
| `/studio` (and every other route) | server boot failure | `You cannot define a route with the same specificity as a optional catch-all route ("/studio" and "/studio[[...tool]]")` | none |

## P1 — page loads with errors

Inapplicable — see P0.

## P2 — page loads with warnings

Inapplicable — see P0.

## P3 — clean

Inapplicable — see P0.

## Studio `/studio` deep-dive

The brief asked to drop an OSV file on the editor's dropzone and
inspect the source-sniff, the StitchPanel, and `useHoloFlowDesktop()`.
None of that happened because `/studio` returns connection-refused.

Static evidence the editor would have rendered something:

- `app/studio/page.tsx:18` imports `StudioClient` from
  `./studio-client`.
- `app/studio/studio-client.tsx` exists (per directory listing) and
  the audit confirmed `components/studio/*` is "4 files wired".
- `lib/studio/source-detection.ts` and `lib/studio/stitch.ts` are
  registered in the audit's "Recent-additions integrity" table as
  "clean".
- The `useHoloFlowDesktop` hook is referenced in
  `app/studio/PURPOSE.md` but its actual hook file was not
  inspected today. The audit doesn't mention it. The brief's
  prediction that it would report "desktop helper not available"
  (because splat360 isn't running) cannot be checked.

## Mobile viewport (4 hero routes)

| Route | Issue |
| --- | --- |
| `/` | not testable — server down |
| `/studio` | not testable — server down (and the route is the trigger of the boot failure) |
| `/holo-walk` | not testable — server down |
| `/holo-walk/trafalgar-square-clifford/ar` | not testable — server down (id chosen from `lib/holo-walk/locations.ts:122`, first entry in the catalogue) |

## Dev-server log highlights

Three lines worth flagging from the 24-line dump above, beyond
the fatal one:

1. **Stale browser-mapping data** — `[baseline-browser-mapping] The
   data in this module is over two months old.` Cosmetic, but
   nothing in the audit had flagged it. Fired twice (boot + on the
   way down).

2. **Lockfile detection ambiguity** — the audit's P1 §3 finding
   reproduces verbatim:
   > We detected multiple lockfiles and selected the directory of
   > D:\package-lock.json as the root directory.
   The stray `D:\package-lock.json` is still there. The dev server
   warns and falls back to the wrong workspace root for `turbopack`
   path resolution — fortunately the next line
   ("Detected additional lockfiles: * D:\.github\_3DPOV\pnpm-lock.yaml")
   shows it does find the right one for module resolution.

3. **No `middleware` deprecation warning this run.** Yesterday's
   `dev.log` carried `⚠ The "middleware" file convention is
   deprecated. Please use "proxy" instead.` Today's run died
   before that compile step, so absence of the warning isn't proof
   it's gone — re-test once boot is restored.

No webpack compilation errors fired (Turbopack doesn't read the
`webpack` callback). Therefore neither the audit's P0 §2
(onnxruntime-node) nor the various polyfill fallbacks in
`next.config.ts:35-60` were exercised. **Those findings are
production-build only, not dev-server problems** — useful to keep
straight when triaging.

## Cross-reference with the static audit

### Findings matched

- **Lockfile ambiguity** (audit P1 §3) — reproduced exactly in the
  boot output above.
- **Canary Next.js in production** (audit P1 §2 + dependency
  table) — `Next.js 15.6.0-canary.60 (Turbopack)` confirmed in
  banner.
- **PPR + useCache experimental flags active** — confirmed in the
  experiments list in the boot banner. Audit didn't call them out
  but `next.config.ts:2-8` declared them.

### Findings the static audit predicted but couldn't fire today

- **Route collision `/holo-walk/[id]/qr/{page,route}`** (audit P0
  §1) — would have fired at a different layer (`page.tsx` vs
  `route.ts` at same path), but the studio collision is more
  specific and trips Next first. Once `/studio` is fixed, this
  collision will trip next on the very next dev start, then the
  audit's other P0s.
- **`onnxruntime-node` in client bundle** (audit P0 §2) — webpack-
  only, not exercised by Turbopack. Will fire on `pnpm run build`,
  not `pnpm run dev`.
- **kokoro / transformers dual-version** (audit P1 §4) — would
  surface in client-bundle output, not boot. Untested.
- **Stripe success → onboarding stub** (audit's "v1 deferrals" §2,
  `app/rookery/page.tsx:17`) — runtime path, would need server.

### Findings the static audit missed

- **`/studio` collision** (this report's whole P0) — net-new, not
  in the audit, and it dominates everything else by preventing the
  walk.
- **Navbar surface has been re-skinned.** Audit said:
  > Navbar exposes: `/`, `/stack` only (`components/layout/navbar.tsx:64,97`).
  Today, `components/layout/navbar-config.ts:19-74` declares **5
  groups** (Studio, Read, Work, Play, Community) totalling ~25
  destinations including `/about`, `/the-loop`, `/practice`,
  `/contact`, `/articles`, `/journal`, `/tutorials`, `/codex`,
  `/learn`, `/photographs`, `/aerial`, `/bureau`, `/bezel`,
  `/cards`, `/services`, `/play`, `/play/neo-london`, `/sphere`,
  `/atelier/cctv-cross-reference`, `/atelier/rig-simulator`,
  `/visualiser/total-internal-reflection`, `/watch`, `/rookery`,
  `/rookery/about`, `/rookery/tiers`, `/cards/mine`, `/signin`.
  The audit's "by design or by lag?" question is answered: the
  navbar got the lag pass. **`/studio` is still not in the
  navbar** — even after today's `/studio` work — which adds
  weight to the "rename the editor" fix-shape option above.
- **Stale navbar comment.** `components/layout/navbar-config.ts:58-60`
  says
  > The visualiser index doesn't exist yet — point to the only one shipped.
  > When a /visualiser index lands, change this to /visualiser.
  but `app/visualiser/page.tsx` exists today (per the route list).
  The navbar still points at
  `/visualiser/total-internal-reflection`. Cosmetic, but the
  comment misleads any future reader.
- **`app/research/engines/page.tsx`** exists — not in the audit's
  routes inventory (the audit listed `/research` plus 2 subs;
  there are now 2 subs *plus* `/research/engines`).
- **`app/admin/import/google/connect`, `app/admin/import/google-drive`,
  `app/admin/import/google-photos`, `app/admin/import/video-to-splat`**
  — four admin/import sub-routes not in the audit's `/admin/*` (6)
  count. Today's tally is 7 admin pages, not 6. The brief's "skip
  routes under `app/admin/`" rule still applies.
- **`turbopack` config block is missing.** `next.config.ts` only
  has `experimental`, `images`, and `webpack` keys — no `turbopack`
  block. Yet the dev script is `--turbopack`. The webpack callback's
  onnxruntime-node alias + the `fs:false / path:false / crypto:false`
  fallbacks **do not apply in dev**. If kokoro-worker or mind-ar
  ever loads on a dev-rendered page, those polyfills will be
  missing. The audit's "fix the webpack alias" recommendation
  needs a Turbopack-equivalent (`turbopack.resolveAlias` /
  `turbopack.conditions`) before the same fix works at dev time.

### Predictions that didn't show up (because boot failed)

- Hydration crashes, console.error noise, slow first compiles,
  per-route warnings — none observed. The walk would have answered.

## Healthy / no concerns

The boot output confirms a small amount of healthy state before
the crash:

- `pnpm 9.15.0` runs the dev script. No missing-binary issue.
- `Next.js 15.6.0-canary.60` self-reports cleanly from the binary.
- `.env.local` is detected (no "no environment file" warning).
- The lockfile in `D:\.github\_3DPOV\pnpm-lock.yaml` is found and
  used (the audit confirmed it was in sync).
- The `node_modules/@playwright/test` is **absent** — the project
  has no Playwright dev dep, so this walk would have needed a
  one-off `npx playwright` install. That actually worked
  (1.60.0 installed transparently) and the Chromium 1217 browser
  binary was already cached at
  `C:\Users\dimon\AppData\Local\ms-playwright\chromium-1217\chrome-win64`
  — meaning a future walk doesn't need a download, just one `npm
  exec`-shaped invocation. Worth noting for whoever picks this up.
- The two PURPOSE.md files for `/studio` (`PURPOSE.md` + `PRINT.md`)
  both exist and parse fine — the collision is structural, not a
  per-file problem.

## What the walk would have caught (and didn't)

Categories of finding the brief specifically asked for, that
remain **unknown** until the server boots:

- Hydration crashes / `Application error` overlays
- Per-route uncaught JS errors
- `requestfailed` events for missing assets (fonts, images,
  splats, GLBs, USDZs)
- console.error / console.warn noise on each route
- The `/studio` drop-zone behaviour with a real OSV
- The `useHoloFlowDesktop` status (was predicted "unavailable")
- `agent.dialogue-ollama` / `viz.generate-comfyui` bench bridges:
  the audit listed them as stubs but didn't try to hit them. A
  walk of `/aura/web-llm` and `/atelier/poi-sculptor` would have
  shown whether they crash or fall back gracefully.
- Mobile-viewport responsiveness on `/holo-walk` map and the
  `/studio` editor (panel collapse, dropzone visibility on a
  390-wide screen).
- Whether any of the `chrono-protocol/*` or `play/*` scaffold-
  phase pages render anything visible at all, or render the
  silent black screen typical of an un-mounted Three Canvas.

## Cleanup

No dev server is running at the end of this audit (it crashed on
boot and was never restarted — the brief said "if it dies twice,
stop and write up", and it died once + stayed down once the cause
was understood).

Background task `b1x8rwq95` exited with code 1; no PID survives.
The Playwright `npx` install of v1.60.0 left a small footprint in
the global npm cache (~150 MB) — not in `D:\.github\_3DPOV`. The
chromium-1217 browser binary was pre-existing, not added by this
session.

The screenshot directory
`D:\The_Hangar\engines\splat360\docs\beta-test-shots-2026-05-16\`
exists and is empty.

---

Summary: the new `app/studio/page.tsx` (Holoflow web 360 editor,
shipped today as the "absorb DJI Studio + Insta360 Studio" wedge)
collides with the existing `app/studio/[[...tool]]/page.tsx`
(Sanity CMS mount, present for weeks). Next.js App Router refuses
to start. Until one of the two moves off `/studio`, **no runtime
walk of the site is possible** and **no production deploy can
succeed**. This is sibling-level to the `/holo-walk/[id]/qr`
collision the static audit caught; the audit just didn't see this
one because it never tree-resolved the App Router or booted the
dev server. Pick the rename, fix the collision, restart `next
dev`, then a real beta-test walk can run.

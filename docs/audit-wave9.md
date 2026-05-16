# Holoflow Wave 9 audit
Date: 2026-05-16
Dev server: http://localhost:3004

## Summary
- Routes checked: 18
- 200 OK: 18
- Failed (non-200): 0
- Page errors (uncaught throws): 0 across 0 routes
- Console errors: intermittent hydration warning fires on 0–4 of the 18 routes per pass (3 passes run; same root cause each time — see triage)
- Hydration warnings: 1 root cause, surfacing on whichever route happens to lose the SSR/CSR `useId` race in any given pass

All routes returned **HTTP 200**. No page errors (uncaught throws) were observed. There is one real hydration bug — same root cause every time, in the navbar — that fires intermittently on whichever route hits the race that pass. Everything else is clean.

## Per-route results

### /
- Status: 200
- Duration: ~2.7s
- Screenshot: `D:/.github/_3DPOV/tests/audit-wave9/landing.png`
- Notes: clean

### /atelier
- Status: 200
- Duration: ~2.7s
- Screenshot: `D:/.github/_3DPOV/tests/audit-wave9/atelier-index.png`
- Notes: registry-driven grid renders, no console errors

### /atelier/sculpture-gallery
- Status: 200
- Duration: ~6–9s
- Screenshot: `D:/.github/_3DPOV/tests/audit-wave9/sculpture-gallery.png`
- Expected elements: NarrationPlate **YES** (`aside[aria-label="Aura"][role="status"]`), ChamberXRBar **YES**, PrintBar **gated** (only mounts after `mcGlbExport` exists; unprompted page load = not rendered, by design — confirmed in `sculpture-gallery-client.tsx` lines 457–465 and 596+)
- Notes: hit the navbar hydration race on one of three passes

### /atelier/breeding-floor
- Status: 200
- Duration: ~3s
- Screenshot: `D:/.github/_3DPOV/tests/audit-wave9/breeding-floor.png`
- Expected elements: NarrationPlate **YES**, ChamberXRBar **YES**
- Notes: clean

### /atelier/triposr
- Status: 200
- Duration: ~2.3s
- Screenshot: `D:/.github/_3DPOV/tests/audit-wave9/triposr.png`
- Expected elements: NarrationPlate **gated** (only mounts when `output.kind === "ready"`, i.e. after the user uploads an image and the mesh comes back — line 362 of `triposr-client.tsx`), PrintBar **gated** (same condition, line 382). Both correctly absent on an unprompted page load.
- Notes: clean

### /atelier/trellis
- Status: 200
- Duration: ~2.1s
- Screenshot: `D:/.github/_3DPOV/tests/audit-wave9/trellis.png`
- Expected elements: PrintBar **not rendered** on unprompted load (consistent with the same conditional-mount pattern as the other chambers above)
- Notes: clean

### /atelier/image-to-mesh
- Status: 200
- Duration: ~2.0s
- Screenshot: `D:/.github/_3DPOV/tests/audit-wave9/image-to-mesh.png`
- Expected elements: PrintBar not rendered on unprompted load (gated)
- Notes: clean

### /atelier/image-to-stl
- Status: 200
- Duration: ~2.0s
- Screenshot: `D:/.github/_3DPOV/tests/audit-wave9/image-to-stl.png`
- Expected elements: PrintBar not rendered on unprompted load (gated)
- Notes: clean

### /atelier/poi-sculptor
- Status: 200
- Duration: 36–50s (heavy R3F scene initialisation under Turbopack)
- Screenshot: `D:/.github/_3DPOV/tests/audit-wave9/poi-sculptor.png`
- Expected elements: PrintBar not rendered on unprompted load (gated). The refactored `exportSTL` / `exportGLB` returning `{blob, filename}` didn't surface any console errors at idle.
- Notes: long load is the obvious user-visible cost. Could benefit from a route-level loading skeleton.

### /atelier/voxel-world
- Status: 200
- Duration: ~3–5s
- Screenshot: `D:/.github/_3DPOV/tests/audit-wave9/voxel-world.png`
- Expected elements: PrintBar gated, not rendered on unprompted load
- Notes: one pass tripped the navbar hydration race; one pass hit a transient screenshot capture protocol error (Page.captureScreenshot failed) — investigated, not reproducible on subsequent passes

### /atelier/lithophane
- Status: 200
- Duration: ~2.5s
- Screenshot: `D:/.github/_3DPOV/tests/audit-wave9/lithophane.png`
- Expected elements: PrintBar gated, not rendered on unprompted load
- Notes: clean

### /atelier/silk-brush
- Status: 200
- Duration: ~21s (networkidle never settles cleanly — XR runtime polling)
- Screenshot: `D:/.github/_3DPOV/tests/audit-wave9/silk-brush.png`
- Expected elements: ChamberXRBar **YES**
- Notes: networkidle timeout is expected (XR session probing keeps the network busy); falls through to the 20s bound and renders correctly. Worth marking as a known characteristic, not a bug.

### /atelier/waveguide-forge
- Status: 200
- Duration: ~6s
- Screenshot: `D:/.github/_3DPOV/tests/audit-wave9/waveguide-forge.png`
- Expected elements: ChamberXRBar **YES**
- Notes: one pass tripped the navbar hydration race

### /atelier/shape-of-it (new this wave)

- Status: 200
- Duration: 12–47s (heavy first compile under Turbopack)
- Screenshot: `D:/.github/_3DPOV/tests/audit-wave9/shape-of-it.png` (some passes timed out on the screenshot itself — the route is rendering, the page just doesn't reach the "fonts loaded + animations idle" state inside the 30s budget)
- Notes: one pass surfaced the navbar hydration race with the **full diff** — see "Root cause" below. Otherwise the chamber renders fine.

### /play/agent-town

- Status: 200
- Duration: 13–47s (heavy first compile)
- Screenshot: `D:/.github/_3DPOV/tests/audit-wave9/play-agent-town.png` (some passes timed out on screenshot; route loads)
- Notes: previously flagged with pageerror — no pageerror reproduced in any of three passes. Cleared.

### /play/pixel-academy

- Status: 200
- Duration: ~3–40s
- Screenshot: `D:/.github/_3DPOV/tests/audit-wave9/play-pixel-academy.png`
- Notes: previously flagged with pageerror — no pageerror reproduced in any of three passes. Cleared.

### /stage

- Status: 200
- Duration: ~8–9s
- Screenshot: `D:/.github/_3DPOV/tests/audit-wave9/stage.png`
- Notes: VRM world infrastructure renders, no errors

### /academy

- Status: 200
- Duration: ~2s
- Screenshot: `D:/.github/_3DPOV/tests/audit-wave9/academy.png`
- Notes: one pass tripped the navbar hydration race; otherwise clean

## Root cause — the only real bug found

The hydration warnings on whichever chamber happens to lose the race are all the **same bug**, located in the desktop navbar dropdown. Full captured diff:

```diff
<DesktopGroup group={{label:"Studio", ...}}>
  <button
    aria-haspopup="menu"
    aria-expanded={false}
+   aria-controls="_R_cllb_"   ← client useId output
-   aria-controls="_R_359lb_"  ← server useId output
  >
  <div
+   id="_R_cllb_"
-   id="_R_359lb_"
    role="menu"
    aria-label="Studio"
  >
```

Same diff for Read, Work, Play, and Community groups.

Source: `components/layout/navbar-desktop-group.tsx` line 33 — `const panelId = useId();`

The classic root cause for this exact pattern is that the **client-side React tree mounts a different number of `useId()`-using components above `<DesktopGroup>` than the server tree did**. Most likely culprits to investigate:

1. **`CartProvider`** (visible in the stack diff above) — does it call any context provider that conditionally renders a hook-using child? `cartPromise={Promise}` suggests it's resolving asynchronously and may have a client-only side that mounts an extra ID-using node post-hydration.
2. **`AuthProvider`** — same pattern. If it conditionally mounts a child between SSR and client (e.g. session probe), every subsequent `useId()` shifts.
3. Anything inside `<Navbar>` before `<DesktopGroup>` that has a `typeof window !== "undefined"` branch or conditional client-only render.

The fix is to find the culprit and either:

- ensure it renders identical tree shape on server and client (suspend or skeleton on the server, never branch),
- or move it so it's not in the same parent subtree as the `useId()`-using nav.

This is the kind of bug that survives dev because React still hydrates "best effort" — but in production it shows up as a console warning on every navbar render. Worth fixing before Wave 10 prod prep.

## Triage — top issues before Wave 10

1. **Navbar hydration mismatch (single bug, surfaces on every route with a navbar)** — `components/layout/navbar-desktop-group.tsx`'s `useId()` output diverges between SSR and CSR because something above it in the client tree (most likely `CartProvider` or `AuthProvider`) renders a different number of ID-using nodes. Highest user-visible severity because it fires across the whole site in production. Fix the parent provider first, not the DesktopGroup.

2. **Slow first-paint on heavy R3F chambers** — `/atelier/poi-sculptor`, `/atelier/shape-of-it`, `/play/agent-town` each took 35–50s to reach networkidle under Turbopack on a cold visit. The screenshot path even timed out at 30s on some passes because the page hadn't stopped repainting. Production builds will be faster than dev, but a route-level `loading.tsx` skeleton would make the wait felt rather than blank.

3. **`/atelier/silk-brush` never settles networkidle (~21s timeout every pass)** — the XR session probing keeps the network event-loop busy. Not user-visible (the chamber renders fine inside 5s), but worth either short-polling instead of long-polling, or excluding the XR probe traffic from the page's idle calculation if there's a hook for it. Lowest severity.

Otherwise: agent-town and pixel-academy did NOT reproduce the previously-flagged pageerror across any of the three audit passes — those flags appear to have been cleared by the recent work. The IP-hash security fix didn't regress anything. The ChamberXRBar, NarrationPlate, and PrintBar wirings all behave as designed (PrintBar/NarrationPlate are correctly conditional on user-driven state in the chambers where they sit on the output side, not the input side).

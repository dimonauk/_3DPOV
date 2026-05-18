# `/edit` — Holoflow web 360 editor

The first concrete milestone of the
[unified-platform absorption sequence](../../../../The_Hangar/engines/splat360/docs/hosting-platforms-landscape.md):
a browser-native 360 editor that absorbs DJI Studio, Insta360 Studio,
and GoPro Quik's roles, with the differentiator that it accepts every
format and (eventually) outputs splats.

> Naming note: the route is `/edit`, not `/studio`. `/studio` is owned
> by the embedded Sanity Studio mount at `app/studio/[[...tool]]/` —
> the Sanity route landed first; the web editor is the intruder and
> moved out of the way.

## What it is

- An `/edit` route on the Holoflow site
- A drop-zone (`DropZone`) that accepts MP4, OSV, INSV, .360, DNG,
  PLY, KSplat, SPZ
- A format sniffer (`lib/studio/source-detection`) that classifies
  what was dropped
- A three.js equirect viewer (`EquirectViewer`) with mouse-drag yaw /
  pitch / FOV — the operator can frame any view in real time
- A minimal keyframe strip (`KeyframeStrip`) for the camera path
- An export panel (`ExportPanel`) that can grab the current view as
  PNG; video render + splat generate are next milestones

## What it ISN'T (yet)

- **Not an OSV / INSV stitcher** — those need ffmpeg.wasm with
  `hstack + v360 dfisheye:e` per [[dji-osv-format]]. Wires next.
- **Not a splat viewer** — punted to M2 (the splat host milestone).
  When an operator drops a .ply / .ksplat / .spz, the editor shows a
  placeholder pointing at the existing `viz.splat-render` capability.
- **Not a video encoder yet** — capturing keyframe paths as MP4 needs
  WebCodecs + `mp4-muxer`. M1.1.
- **Not a splat generator** — the "Generate splat" button is a stub
  that will POST to the `splat360` service in M2.

## Why a sibling to `/holo-walk`

`/holo-walk` is the *delivery* surface — visitors land there to see
sculptures. `/edit` is the *authoring* surface — operators land
there to make the sculptures. The two share the underlying
capabilities (`viz.splat-generate-360`, `viz.splat-render`,
`viz.splat-ar-deploy`) but the visitor view is read-only and the
edit view is editable.

## Strategic positioning

From the
[competitive landscape](../../../../The_Hangar/engines/splat360/docs/hosting-platforms-landscape.md)
doc:

- DJI Studio refuses Insta360 files; Insta360 Studio refuses OSV
- GoPro Quik is mobile-first, doesn't support DJI / Insta360 files
- None of the three runs in the browser
- None outputs splats

`/edit` solves all four. The "absorb everything" thesis demands
universal ingest as the v0 wedge.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) | Already the site's framework |
| 3D rendering | three.js + R3F + drei | Already in package.json |
| Video texture | `THREE.VideoTexture` | Standard, mature path |
| Heavy video processing | `@ffmpeg/ffmpeg` (next wire) | Browser-native FFmpeg |
| MP4 encode | `mp4-muxer` + WebCodecs | Browser-native encode (M1.1) |
| State | React local state | v0 — Zustand if it grows |

## Vercel build notes

Per [[holoflow-deploy-gotchas]]:

- The whole `/edit` route is client-only because three.js can't SSR
- `edit-client.tsx` carries the `"use client"` boundary; `page.tsx`
  imports it directly (Next 15 hydration handles the rest)
- No three.js or `@mkkellogg/gaussian-splats-3d` imports at module top
  level in any server component — only inside `"use client"` files

## File map

| File | Role |
|---|---|
| `page.tsx` | Server-component shell + metadata |
| `edit-client.tsx` | Root client component, state, layout |
| `layout.tsx` | Chrome-bypass (no Navbar / footer) — mirrors Sanity's |
| `../../components/studio/DropZone.tsx` | File drop / picker UI |
| `../../components/studio/EquirectViewer.tsx` | Three.js viewer with virtual camera |
| `../../components/studio/KeyframeStrip.tsx` | Minimal timeline |
| `../../components/studio/ExportPanel.tsx` | Export controls (PNG live; MP4/splat stubs) |
| `../../lib/studio/types.ts` | Shared types (`SourceAsset`, `Keyframe`) |
| `../../lib/studio/source-detection.ts` | Format sniffer |

> The supporting components and lib modules still live under
> `components/studio/` and `lib/studio/`. They predate the route
> rename and were not moved — renaming them is gratuitous churn for
> a route alias.

## v0 status check

| Capability | Status |
|---|---|
| Drag-and-drop MP4 / image | ✅ working |
| Format auto-detection | ✅ working (extension + magic-byte + aspect) |
| Equirect video viewer | ✅ working (three.js VideoTexture inside-of-sphere) |
| Mouse drag yaw / pitch / FOV | ✅ working |
| Keyframe placeholder | ✅ single keyframe, addable |
| Export current frame | ✅ working (canvas.toBlob) |
| OSV / INSV ingest | ❌ next wire (ffmpeg.wasm hstack + v360) |
| Splat preview | ❌ M2 |
| MP4 encode | ❌ M1.1 |
| Splat generate from source | ❌ M2 |

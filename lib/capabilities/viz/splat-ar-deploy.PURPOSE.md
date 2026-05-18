# `viz.splat-ar-deploy` — Package a splat as a QR-driven AR experience

A capability that turns a generated `SplatRecord360` (or any splat
record) into a deployment bundle: QR code, public page URL, and an
optional iOS USDZ fallback. The output is what gets printed onto a
sculpture plaque or a museum signage panel.

## Why this is its own capability

The splat itself is content. The deploy is the *delivery vehicle*:

- Which URL the printed sign points at
- Which splat format the page serves (`.spz` for mobile, `.ksplat` fallback)
- Whether iOS users get USDZ AR Quick Look or the 3D orbit fallback
- What size QR to print so the scan distance is right
- What UTM params to bake in so analytics works

Keeping this separate from `splat-generate-360` means a single splat
can be deployed multiple times (different signs, different scan
contexts, different UTM cohorts) without re-running the generation.

## The licence boundary

`splatArDeploy` enforces `isDeployEligible` — only `commercial-ok`
and `third-party-commercial` records may be deployed as a public AR
experience. `research-only` (apple-amlr / Inria 3DGS trainer / SHARP
output) throws `licence-conflict`. This is the commerce filter
applied at the deploy boundary, not at the surface code.

## Inputs / outputs

```
splatArDeploy({
  record: { id, plyUrl, spzUrl?, ksplatUrl?, usdzUrl?, gaussianCount, licence },
  deployUrl: "https://holoflow.co.uk/holo-walk/trafalgar-square-clifford/ar",
  qrSizeCm: 12,
  utm: { source: "holowalk-qr", medium: "signage", campaign: "trafalgar-square-clifford" },
}) → {
  id, deployUrl,
  qrPngUrl: "https://blob.holoflow.co.uk/.../qr.png",
  qrSvg: "<svg ...>...</svg>",
  usdzFallbackUrl: "https://blob.../sculpture.usdz" | null,
  preferredFormat: "spz" | "ksplat" | "ply",
  licence: "commercial-ok",
  signageGuide: { qrSideCm: 12, maxScanDistanceM: 1.2, minPrintDpi: 300 },
  emittedAt: "2026-05-15T19:35:00Z",
}
```

## Pairing with HoloWalk

The HoloWalk route at `/holo-walk/<id>/ar` consumes:

- The splat URL (preferred format) for the magic-window AR scene
- The USDZ URL (if present) for iOS AR Quick Look on devices without
  WebXR

The deploy capability produces both pointers; the HoloWalk page reads
them from the location record (`SculptureLocation.splat`).

## The iOS USDZ fallback paths

iOS Safari (2026) does not support WebXR AR. To give iPhone visitors
a real AR experience the deploy bundle can carry a `usdzUrl`. Two
viable sources:

1. **Splat → mesh → USDZ** via SuGaR + `usd-core`. Best quality, real
   geometry. Heavy pipeline; runs in splat360 postprocess when
   `emit_usdz=True` and SuGaR is installed.
2. **Snapshot card USDZ** — a flat textured plane showing a single
   rendered view of the splat. Not a true 3D AR experience but
   survives AR Quick Look. Handled client-side by `viz.usdz-export`
   when the deploy page detects iOS + no precomputed USDZ.

Either is better than the 3D orbit fallback iOS gets when neither
exists.

## Signage guidance

`signageGuide` is the printable-side math derived from `qrSizeCm`:

- **Scan distance** ≈ side × 10. A 12cm QR scans reliably from ~1.2m.
- **Min DPI** — 300 for plaque-class signage, 600 for small prints,
  150 for large-format vinyl. The capability returns 300 as a safe
  default and lets the operator override at print time.

## Foundation-phase status

`splat-ar-deploy.ts` is the type surface + stub router. The server
implementation in `splat-ar-deploy.server.ts` (next door) does the
work: validates licence, generates QR via `lib/qr`, uploads to blob
storage via the media library, writes the deploy record.

## Bordering files

- `lib/qr.ts` — pure QR generation utility used by the server impl.
- `lib/holo-walk/qr.ts` — sculpture-specific deep-link helpers.
- `lib/capabilities/viz/splat-generate-360.ts` — produces the splat
  records this capability deploys.
- `lib/capabilities/viz/usdz-export.ts` — client-side AR Quick Look
  trigger used by the deploy page on iOS.
- `app/holo-walk/[id]/ar/page.tsx` — the route the QR points at.
- `app/holo-walk/[id]/qr/route.ts` — Next.js route handler that
  emits the live QR PNG on demand.

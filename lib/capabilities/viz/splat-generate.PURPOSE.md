# `viz.splat-generate` — Generate a 3D Gaussian Splat from a source asset

A source-agnostic capability for synthesising `.ply` gaussian splats.
The studio runs multiple splat pipelines in parallel because no single
provider covers every source-type / licence / quality combination, and
this capability is the seam where the call-site picks one and the
output lands in a uniform record.

## The provider matrix

| Provider | Source | Licence | Status |
|---|---|---|---|
| **sharp-onnx** | Single image | apple-amlr (research-only) | Live (bench) — CCTV archive, fast ingest |
| **hangar-gsplat** | Video | commercial-ok | Live (bench) — HoloWalk operator upload |
| **hangar-4dgs** | Video | commercial-ok | Live (bench, 4D variant) |
| **luma-genie** | Hosted API ref | Third-party commercial | Live (with LUMA_API_KEY) |
| **postshot** | Image-set / video | commercial-ok | Stub — Jawset Postshot has no public API; manual workflow |
| **studio-rig-native** | POV-rig capture | commercial-ok | Stub — capture pipeline not built |

## Why source-agnostic

Splat synthesis is moving fast. New providers (Stable Splat, future
Apple research, hosted APIs) appear roughly quarterly. By centralising
on a single capability with a provider union, the studio:

1. Switches providers without touching surface code.
2. Filters surfaces by licence without each surface knowing the
   provider taxonomy.
3. Compares quality across pipelines on the same source asset.
4. Carries the **licence boundary** in the record itself — `apple-amlr`
   outputs literally cannot reach a "buy" surface because the
   `isSplatCommerceEligible` predicate gates it.

## Status

The type surface in `splat-generate.ts` is stable. The server-side
router in `splat-generate.server.ts` dispatches to per-provider modules
under `./splat-providers/`. Four providers are LIVE; two remain stubs:

- **sharp-onnx** — `splat-providers/sharp-onnx.server.ts`. Talks to the
  bench FastAPI sidecar (`tail99b2a4.ts.net` HTTPS) wrapping
  `D:/The_Hangar/engines/sharp-onnx/batch_cctv.py`.
- **hangar-gsplat** — `splat-providers/hangar-gsplat.server.ts`. Talks
  to the splat360 bench's `/video3d/jobs` endpoint. The HoloWalk
  operator console at `/holo-walk/new` is the primary caller (via
  `/api/holo-walk/generate-splat`).
- **hangar-4dgs** — `splat-providers/hangar-4dgs.server.ts`. Same bench,
  `/video4d/jobs` endpoint. 4D Gaussian Splat trainer for time-varying
  scenes.
- **luma-genie** — `splat-providers/luma-genie.server.ts`. Imports a
  pre-trained Luma capture by objectId. Requires `LUMA_API_KEY`.
- **postshot** — stub. Jawset Postshot has no public API; the operator
  workflow is "drag images into the GUI, train, export PLY, upload via
  `/api/admin/splat/from-bytes` with provider `studio-rig-native`".
- **studio-rig-native** — stub. The POV-rig multi-camera capture
  pipeline is studio-owned but not yet built. Until it lands, the
  bytes-in entry from Postshot is the closest commerce-safe path.

The image-source public route (`/api/viz/splat-generate`) accepts only
sharp-onnx, postshot, studio-rig-native, luma-genie — see the
"Provider gating" note in that route's header. Video-source providers
(hangar-*) route through `/api/holo-walk/generate-splat` instead.

## What the record carries

Every successful generation lands in Firestore via the media library
(`lib/capabilities/media/library.ts`) as a `SplatRecord`. Downstream
commerce code reads `licence` to filter. The `plyFlavour` field tells
the renderer (`viz.splat-render`) whether a conversion pass is needed
before embedding.

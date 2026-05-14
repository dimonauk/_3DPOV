# `viz.splat-generate` — Generate a 3D Gaussian Splat from a source asset

A source-agnostic capability for synthesising `.ply` gaussian splats.
The studio runs multiple splat pipelines in parallel because no single
provider covers every source-type / licence / quality combination, and
this capability is the seam where the call-site picks one and the
output lands in a uniform record.

## The three tracks

| Provider | Source | Licence | Use |
|---|---|---|---|
| **sharp-onnx** | Single image | apple-amlr (research-only) | CCTV archive, fast ingest, research surfaces |
| **postshot** | Image-set / video | Commercial-friendly | Commerce display + sale |
| **studio-rig-native** | POV-rig capture | Studio-owned | Original IP, editioned pieces |
| **luma-genie** | Hosted API ref | Third-party commercial | Quick high-quality, terms-bound |

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

## Foundation-phase status

This file (`splat-generate.ts`) defines the type surface and a stub
router. Concrete providers are not yet wired. The next wires, in order
of likely landing:

1. **sharp-onnx** — already running on the bench at
   `D:/The_Hangar/engines/sharp-onnx/batch_cctv.py` and via the
   `tail99b2a4.ts.net` HTTPS sidecar; just needs the
   `python-services/sharp_onnx_service.py` FastAPI wrapper + the
   provider stub here that POSTs to it.
2. **postshot** — depends on a Postshot CLI capture path
   (`postshot-cli.exe` exists at `C:\Program Files\Jawset Postshot\bin\`).
3. **studio-rig-native** — depends on the POV-rig capture pipeline
   (separate vertical).
4. **luma-genie** — wire once a paid plan + API key are in place.

## What the record carries

Every successful generation lands in Firestore via the media library
(`lib/capabilities/media/library.ts`) as a `SplatRecord`. Downstream
commerce code reads `licence` to filter. The `plyFlavour` field tells
the renderer (`viz.splat-render`) whether a conversion pass is needed
before embedding.

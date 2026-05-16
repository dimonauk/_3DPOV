# viz.image-to-mesh — PURPOSE

## Why this capability exists

Visitors who use `/atelier/imagen` (text → image) ask the obvious next
question: "can I turn that into a 3D model I can print?" Same applies
to any photograph in the studio's archive. This capability is the
seam.

Four sibling providers because each is a different point on the
quality vs speed vs single-vs-multi-input curve:

| Provider | Input | Speed | Quality | Notes |
| --- | --- | --- | --- | --- |
| `triposr` | single image | ~0.5s | Rough draft | LRM-style, smallest checkpoint |
| `hy-wu` | single image | ~5s | Mid | Hunyuan3D wrapper; licence-sensitive |
| `unique3d` | single image | ~30s | High | Multi-view diffusion + normals |
| `instantmesh` | multi-view set | ~10s | Best (with good inputs) | zero123plus + LRM, needs 2+ photos |

## Source-agnostic, just like splat-generate

Same pattern as `viz.splat-generate.ts`: one input shape with a
discriminated `source` field, four providers under a single router.
Adding a fifth (Vertex AI's image-to-3D when that GA'd, TRELLIS,
something proprietary) is a one-line `ImageToMeshProvider` extension
and a new switch arm — no surface changes elsewhere.

## Licence boundary

Mirrors splat's `apple-amlr` posture. The Hunyuan3D model behind
`hy-wu` carries non-commercial restrictions in some published
versions, so the provider is marked `research-only` defensively until
an operator confirms the bound version. The other three are MIT/Apache
and commerce-eligible. `isMeshCommerceEligible(record)` is the seam
commerce surfaces read from.

If/when the studio commissions a permissive Hunyuan3D variant or
swaps in a different commercial-ok model, flip
`PROVIDER_LICENCE_IMAGE_TO_MESH["hy-wu"]` and the change ripples
through.

## Bench-side contract (one shape for all four)

```
POST  {IMAGE_TO_MESH_SERVICE_URL}/{provider}/jobs
  multipart: { image: <bytes> | images: <bytes[]>, params: JSON }
GET   {IMAGE_TO_MESH_SERVICE_URL}/{provider}/jobs/{jobId}
  -> { state, vertexCount?, triangleCount?, durationSeconds? }
GET   {IMAGE_TO_MESH_SERVICE_URL}/{provider}/jobs/{jobId}/result.glb
  -> GLB bytes
```

Bearer-token auth per `holoflow-bench-bridge` skill. State machine
matches the SHARP service: `queued | running | done | error |
cancelled`.

Source for each provider lives at `services/{triposr,hy-wu,unique3d,
instantmesh}/`. The bench-side wrapper would import each provider
module and dispatch by URL path.

## Why one capability with four providers, not four capabilities

The chamber UI is a "pick a provider" radio. Caller code that doesn't
care about provider details (e.g. a future capability that auto-runs
both triposr-then-unique3d as a coarse-then-fine pipeline) reads
just `imageToMesh({ provider, source })` without branching to four
import paths.

## Relationship to other capabilities

- `viz.imagen` (server-side, via the Imagen route) — chains into this:
  generate image, send to image-to-mesh, get mesh.
- `viz.splat-generate` — different output type (gaussian splat vs
  mesh). A photo run through SHARP gives a splat (rich, viewer-only);
  through image-to-mesh gives a mesh (printable, editable).
- `viz.thumbnail-splat` — the visual companion to image-to-mesh
  outputs; both would surface in product cards.

## Output target

Same `MediaSourceRef` extension pattern as splats. Records carry
`sourceRef.imageToMesh: { provider, licence, format, vertexCount?,
triangleCount? }`. Future commerce code reads `licence` and
`provider` to decide whether the mesh can be printed in the bureau,
sold as a download, etc.

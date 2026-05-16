# viz.image-to-3d — PURPOSE

## What this is

A focused seam: one photograph → one 3D mesh you can rotate, download
as GLB, and print. TripoSR runs on the bench's GPU and returns the
mesh in roughly thirty seconds. No queues, no providers to pick from,
no licence sub-types to choose. The chamber at `/atelier/triposr`
drives this capability and nothing else.

## Why this exists separate from `viz.image-to-mesh`

`viz.image-to-mesh` is the long-term four-provider router (TripoSR,
HY-WU, Unique3D, InstantMesh). Wiring all four end-to-end takes four
bench wrappers and four sets of provider-specific semantics. That
router is type-complete and chamber-complete but bench-empty — every
provider throws `provider-unavailable` with the documented contract.

`viz.image-to-3d` is the wedge. One provider, one input, one output,
end-to-end. The bench round-trip proves itself here before the broader
router lights up. When all four providers in `image-to-mesh` are live,
this capability becomes a thin alias that delegates to
`imageToMesh({ provider: "triposr", ... })`.

## Relationship to other capabilities

- `viz.depth-estimation` is the free in-browser fallback when the bench
  is offline. The chamber chooses; the capability surface itself does
  not fall back automatically — failure is loud so the operator notices.
- `viz.imagen` (text → image) chains into this: generate an image, send
  it here, get a mesh.
- `viz.thumbnail-splat` is the visual companion for splat outputs; the
  equivalent thumbnail path for image-to-3d outputs is a future pass
  (probably `viz.thumbnail-mesh`, same shape, different renderer).
- `commerce.print-order` reads the GLB URL to quote a print run.

## Bench contract

```
POST  {TRIPOSR_SERVICE_URL}/triposr/generate
  Authorization: Bearer <TRIPOSR_AUTH_TOKEN>?
  multipart: image=<bytes>, params=<JSON>?
  params = {
    removeBackground: bool = true,
    foregroundRatio: float = 0.85,
    mcResolution: int = 256,
    chunkSize: int = 8192,
  }
returns: model/gltf-binary bytes
```

Sync wrap. TripoSR runs in ~30s on a 3090; well inside Vercel's 300s
function budget, so no job queue. Bearer-token auth per the
`holoflow-bench-bridge` skill. Empty `TRIPOSR_AUTH_TOKEN` disables
auth for bench-local dev.

The bench wrap lives at
`D:/The_Hangar/engines/splat360/src/splat360/api/triposr.py` and
shells out to the TripoSR install at
`D:/The_Hangar/engines/TripoSR/` via its own venv (subprocess). Two
venvs because splat360 doesn't carry TripoSR's torch + rembg + xatlas
deps and we don't want to drag them in.

A `GET /triposr/ready` probe is available so operators can verify the
install (Python, run.py, install root all present) before sending real
uploads.

## Output target

GLB lands in the media library via `mediaUpload({ kind: "glb", ... })`.
Records carry `sourceRef.imageTo3D: { provider, format, sourceImageUrl }`.
Future commerce code reads `provider` to know what tier of mesh quality
to quote against.

## Licence

TripoSR ships under MIT. No licence-gating on the capability — every
generated mesh is commerce-eligible. (Contrast with
`viz.splat-generate` where some providers force `research-only`.)

## What this isn't

- Not a multi-view reconstructor. One image only. Use
  `viz.image-to-mesh` with `provider: "instantmesh"` for multi-view.
- Not a video-to-mesh path. Pinhole video → 3D splat is
  `viz.splat-generate` with `provider: "hangar-gsplat"`.
- Not an in-browser path. TripoSR needs a GPU + a 1.4 GB checkpoint;
  it has to live on the bench.

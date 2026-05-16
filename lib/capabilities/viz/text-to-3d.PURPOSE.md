# viz.text-to-3d — PURPOSE

## What this is

A focused seam: a text prompt becomes a 3D mesh you can rotate, download
as GLB, and print. Optionally, a reference image can be supplied to
steer the result. Microsoft's TRELLIS runs on the studio's bench and
returns the mesh in roughly a couple of minutes. No queues, no providers
to pick from. The chamber at `/atelier/trellis` drives this capability
and nothing else.

## Why this exists alongside `viz.image-to-3d`

`viz.image-to-3d` is the TripoSR seam — one photograph in, one GLB out,
about thirty seconds on a 3090. `viz.text-to-3d` is the TRELLIS seam —
prompt in (optionally with a reference image), GLB out, roughly a
couple of minutes. Both end at the same place: a GLB on the media
library. The two coexist because the input shape is what differs;
visitors who do not have a photograph still get a mesh.

## Relationship to other capabilities

- `viz.image-to-3d` is the photograph-only fast path.
- `viz.depth-estimation` remains the free in-browser fallback for the
  no-bench case (depth map from one image; not a true mesh, but rotatable
  and downloadable in the chamber).
- `viz.imagen` (text → image) chains naturally: generate an image, hand
  it to `viz.text-to-3d` as the reference image alongside a prompt.
- `commerce.print-order` reads the GLB URL to quote a print run; it
  does not care which provider made it.

## Bench contract

```
POST  {TRELLIS_SERVICE_URL}/trellis/generate
  Authorization: Bearer <TRELLIS_AUTH_TOKEN>?
  body: JSON {
    prompt:   string,           # required
    imageUrl: string | null,    # optional reference image
    seed:     number | null,    # optional, default 1
  }
returns: model/gltf-binary bytes
```

Sync wrap. TRELLIS runs roughly a couple of minutes on a 3090
(multi-step sparse-structure + slat sampler + mesh extract + GLB
postprocessing); inside Vercel's 300s function budget. Bearer-token
auth per the `holoflow-bench-bridge` skill. Empty `TRELLIS_AUTH_TOKEN`
disables auth for bench-local dev.

The bench wrap lives at
`D:/The_Hangar/engines/splat360/src/splat360/api/trellis.py` and shells
out to the TRELLIS install at `D:/The_Hangar/engines/TRELLIS/` via its
own venv (subprocess). Two venvs because splat360 doesn't carry
TRELLIS's torch + xformers + spconv + diffusers deps and we don't want
to drag them in.

A `GET /trellis/ready` probe is available so operators can verify the
install (python, install root, example_text.py all present) before
sending real prompts.

## Fake mode

When the bench's TRELLIS venv python isn't on disk, `/trellis/generate`
short-circuits to a 12-byte glTF binary header placeholder. The chamber
treats that as a successful generation — `<model-viewer>` renders an
empty scene, which is the honest behaviour while the bench install is
still in progress. Force it explicitly with `TRELLIS_FAKE=1` on the
bench.

## Output target

GLB lands in the media library via `mediaUpload({ kind: "glb", ... })`.
Records carry `sourceRef.textTo3D: { provider, format, prompt,
sourceImageUrl, seed }`. The prompt is preserved on the record so
listings can surface "what prompt made this mesh".

## Licence

TRELLIS ships under the MIT licence (Microsoft Research). No
licence-gating on the capability — every generated mesh is
commerce-eligible.

## What this isn't

- Not a multi-view reconstructor. Image-to-mesh from multiple views is
  `viz.image-to-mesh` with `provider: "instantmesh"`.
- Not a video pipeline. Pinhole video → 3D splat is `viz.splat-generate`
  with `provider: "hangar-gsplat"`.
- Not an in-browser path. TRELLIS needs a GPU and several gigabytes of
  checkpoints; it has to live on the bench.

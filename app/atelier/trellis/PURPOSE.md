# `/atelier/trellis` — text and image to 3D

## What this is

The studio's TRELLIS chamber. Type a prompt, optionally drop a reference
image, get a 3D-printable mesh back.

Microsoft's TRELLIS runs on the studio's bench. The chamber is its
public front: write what you want, optionally drag in a reference image
to steer the look, hit Generate, wait a couple of minutes, get a GLB
you can rotate in the browser, download, and slice for the print
bureau.

One provider, one input shape, one output. Sibling to
`/atelier/triposr` (single photograph → mesh in about thirty seconds).
TRELLIS is heavier and slower but takes a prompt — no source photo
required.

## How it works

```
visitor browser
    │  prompt + optional reference image
    ▼
app/api/viz/text-to-3d/route.ts        (admin guard + JSON or multipart parse)
    │  forward { prompt, imageUrl, seed }
    ▼
lib/capabilities/viz/text-to-3d.server  (capability seam)
    │  POST JSON
    ▼
bench /trellis/generate                  (FastAPI, splat360 service)
    │  subprocess: TRELLIS driver script
    ▼
mesh.glb
    │
    ▼
mediaUpload  →  Vercel Blob URL
    │
    ▼
chamber renders <model-viewer> + offers download
```

Sync round-trip — no polling, no job table. TRELLIS runs roughly a
couple of minutes on a 3090, well inside Vercel's 300s function budget.

When the visitor supplies a reference image, the route uploads that
image to the media library first and passes the resulting URL to the
bench so TRELLIS can fetch it.

## Fake mode

When the bench's TRELLIS venv python isn't on disk, the bench's
`/trellis/generate` short-circuits to a 12-byte glTF binary header
placeholder. The chamber treats that as a successful generation —
`<model-viewer>` renders an empty scene, which is the honest behaviour.

Fake mode auto-enables when the venv python is missing, so contract
tests and chamber smoke-tests can run regardless of whether the model
checkpoints are installed. Force it explicitly with `TRELLIS_FAKE=1`
on the bench.

## Bench install

- Install root: `D:/The_Hangar/engines/TRELLIS/` (Microsoft Research, MIT).
- Python: dedicated 3.12 venv at `.venv/` with CUDA-enabled torch,
  xformers, spconv, and diffusers.
- Models: `microsoft/TRELLIS-text-xlarge` (text-only path) +
  `microsoft/TRELLIS-image-large` (image-steered path). Several
  gigabytes of checkpoints.
- Auth: shared bearer (`TRELLIS_AUTH_TOKEN`). Empty disables auth —
  bench-local dev only.
- Tailscale Funnel hostname (when exposed): set `TRELLIS_SERVICE_URL`
  on Vercel to the funnel address; defaults to `http://127.0.0.1:8000`
  for bench-local dev.

## Auth posture

Operator-only via the studio's google admin guard. TRELLIS is GPU-bound
and the bench would melt under anonymous traffic; rate-limiting + quota
would have to land before opening this up.

## Why a separate chamber from `/atelier/triposr`

The two are siblings, not competitors. TripoSR needs a single
photograph and returns in about thirty seconds; TRELLIS takes a prompt
(and optionally a reference image) and takes longer. Visitors who do
not have a photograph still get a mesh.

Both end at the same place — a GLB on the media library. Commerce
surfaces read the kind, not the provider.

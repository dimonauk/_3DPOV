# `/atelier/triposr` — single image to 3D mesh

## What this is

The studio's TripoSR chamber. Drop a photograph, get a 3D-printable mesh back.

Stability AI's TripoSR runs on the studio's bench. The chamber is its public
front: drag an image in, hit Generate, wait ~30 seconds, get a GLB you can
rotate in the browser, download, and slice for the print bureau.

One provider, one input, one output. The broader four-provider router
(TripoSR + HY-WU + Unique3D + InstantMesh) lives at `/atelier/image-to-mesh`;
this chamber is the focused TripoSR-only wedge that proves the bench
round-trip end-to-end. When the unified router lights up fully, both
surfaces stay — the focused chamber for "I just want a mesh, fast",
the broader one for "let me pick the trade-off".

## How it works

```
visitor browser
    │  upload image
    ▼
app/api/viz/image-to-3d/route.ts         (admin guard + multipart parse)
    │  forward bytes
    ▼
lib/capabilities/viz/image-to-3d.server   (capability seam)
    │  POST multipart
    ▼
bench /triposr/generate                    (FastAPI, splat360 service)
    │  subprocess: TripoSR run.py
    ▼
mesh.glb
    │
    ▼
mediaUpload  →  Vercel Blob URL
    │
    ▼
chamber renders <model-viewer> + offers download
```

Sync round-trip — no polling, no job table. TripoSR runs in ~30s on a 3090,
well within Vercel's 300s function budget.

## Fake mode

When the bench's TripoSR venv python isn't on disk, the bench's
`/triposr/generate` short-circuits to a 12-byte glTF binary header
placeholder. The chamber treats that as a successful generation —
`<model-viewer>` renders an empty scene, which is the honest behaviour.

Fake mode auto-enables when the venv python is missing, so contract tests
and chamber smoke-tests can run regardless of whether the model checkpoint
is installed. Force it explicitly with `TRIPOSR_FAKE=1` on the bench.

## Bench install

- Install root: `D:/The_Hangar/engines/TripoSR/` (Stability AI, MIT).
- Python: dedicated 3.12 venv at `.venv/` with CUDA-enabled torch.
- Workaround: `torchmcubes` doesn't build without a CUDA toolset on the
  bench's dev shell. `tsr/models/isosurface.py` has been patched to swap
  in PyMCubes per the project memory note.
- Auth: shared bearer (`TRIPOSR_AUTH_TOKEN`). Empty disables auth — bench-
  local dev only.
- Tailscale Funnel hostname (when exposed): set `TRIPOSR_SERVICE_URL` on
  Vercel to the funnel address; defaults to `http://127.0.0.1:8000` for
  bench-local dev.

## Auth posture

Operator-only via the studio's google admin guard. TripoSR is GPU-bound and
the bench would melt under anonymous traffic; rate-limiting + quota would
have to land before opening this up.

## Why a separate chamber from `/atelier/image-to-mesh`

`image-to-mesh` is the long-term unified surface — pick from four
providers, each on a different point of the speed-vs-quality-vs-input
curve. Wiring all four end-to-end takes four bench wrappers and four sets
of provider semantics. `triposr` is the wedge: the single TripoSR provider,
end-to-end, today.

Both coexist. The focused chamber stays even after the unified router
lights up — workshops and tutorials reference TripoSR by name.

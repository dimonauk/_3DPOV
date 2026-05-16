# services/ — Image → 3D mesh providers

Four sibling providers under the `viz.image-to-mesh` capability. Each
takes one or more images of a subject and returns a 3D mesh (GLB).
All four are GPU-bound; the source lives here so the Vercel-side
contract docstring can point at a path in the same repo, but the
inference runs on the studio bench (or any GPU host running their
HTTP wrapper).

## What's here

| Provider | Path | Input | Strengths | Source |
| --- | --- | --- | --- | --- |
| `triposr` | [`triposr/`](./triposr/) | Single image | Fast (~0.5s on RTX 4090), small mesh, single-stage feed-forward | TripoSR by Tripo + Stability AI (MIT) |
| `hy-wu` | [`hy-wu/`](./hy-wu/) | Single image | Hunyuan3D + Wu wrapper; small wrapper code over an upstream model | Wu's wrapper around Tencent's Hunyuan3D (mixed licences — see folder LICENSE) |
| `unique3d` | [`unique3d/`](./unique3d/) | Single image | High-quality multi-view diffusion + reconstruction; slower (~30s) | Unique3D by Tsinghua + Stability AI (MIT) |
| `instantmesh` | [`instantmesh/`](./instantmesh/) | Multi-view image set | Best for object scans with multiple photos; uses zero123plus for view synthesis | InstantMesh by Tencent (Apache-2.0) |

## What's NOT here (gitignored)

- Model checkpoints (.ckpt, .bin, .safetensors, .pth) — several GBs per
  model. Each tool downloads from HuggingFace on first run.
- `.venv/`, `venv/`, `venv_instantmesh/` — per-host Python environments.
- `output/`, run logs, gradio-generated artefacts.

## Vercel-side contract

`lib/capabilities/viz/image-to-mesh.{ts,server.ts}`. Source-agnostic
provider router that mirrors `splat-generate.ts`:

```ts
import { imageToMeshServer } from "lib/capabilities/viz/image-to-mesh.server";

const record = await imageToMeshServer({
  provider: "triposr" | "hy-wu" | "unique3d" | "instantmesh",
  source: { kind: "image-single", url } | { kind: "image-set", urls },
}, { uploadedBy: uid });
```

All four currently throw `provider-unavailable` until the matching
bench-side HTTP wrapper lands; the throw message documents the exact
endpoint contract the bench needs to implement.

## Bench-side contract (one shape for all four)

```
POST  {IMAGE_TO_MESH_SERVICE_URL}/{provider}/jobs
  multipart: { image: <bytes> | image[]: <bytes[]>, params: JSON }
GET   {IMAGE_TO_MESH_SERVICE_URL}/{provider}/jobs/{jobId}
  -> { state, mesh: { format: "glb", durationSeconds } }
GET   {IMAGE_TO_MESH_SERVICE_URL}/{provider}/jobs/{jobId}/result.glb
  -> GLB bytes
```

Single bearer-token auth per `holoflow-bench-bridge` skill.

## Why four providers, not one

Each is a different architectural family:

- TripoSR: feed-forward single-stage (1.4 GB checkpoint). Fastest.
  Best for "rough draft" generation.
- HY-WU: multi-view diffusion wrapper. Mid-quality, mid-speed.
- Unique3D: multi-view diffusion + per-view normal estimation + mesh
  reconstruction. Slow but high quality.
- InstantMesh: zero123plus view synthesis + LRM-style transformer
  decoder. Best for objects with multiple input photos.

The chamber surfaces these as four radio buttons; visitors pick by
the trade-off (speed vs quality vs single-vs-multi-input). The
licence column above flows through to `SplatLicence`-style
commerce-eligibility checks downstream.

## Why GPU-bound services live here at all

Even when they don't run on Vercel, the SOURCE belonging to the same
repo as the Vercel side means:

- Future-Claude reads the bench code without leaving the project.
- The Vercel-side contract docstring can point at exact line numbers
  in `triposr/tsr/...` etc.
- White-label work (renaming "Hangar" references to "Holoflow Studio")
  happens once on migration; bench sync is a follow-up.

GPU-bound services are stubbed in the capability router; they wake up
when the bench HTTP wrapper exists and the env var
`IMAGE_TO_MESH_SERVICE_URL` is set.

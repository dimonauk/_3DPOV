# Mesh service &mdash; the runbook

A FastAPI wrapper around [TencentARC/InstantMesh](https://github.com/TencentARC/InstantMesh)
running on the studio&rsquo;s 3080 Ti machine. The site&rsquo;s
`commerce.mesh-job` capability (and the studio&rsquo;s batch scripts)
post images to this service over the local network; jobs come in as
images, come out as `.glb` Gaussian-style textured meshes ready for
3D-printable / Three.js / print-bar consumption.

## Why this exists

Apple SHARP&rsquo;s weights ship under the `apple-amlr` (Apple AI/ML
Research) licence &mdash; research-only, not commercial. The
studio&rsquo;s print-bar &ldquo;commission this print&rdquo; flow is a
commercial use, so the SHARP path cannot back it without legal
review. **InstantMesh ships under Apache-2.0** &mdash; clean for
commercial use, no revenue gate. This is the commercially-safe
alternative for the print-bar.

For internal R&D and the CCTV pipeline, SHARP still earns its place
(better splat quality, faster inference). For anything the studio
sells, route through this service instead.

## Prerequisites

Three pieces have to be installed and runnable on the bench:

1. **InstantMesh** &mdash; clone the repo, install its requirements:

   ```sh
   git clone https://github.com/TencentARC/InstantMesh
   cd InstantMesh
   conda create -n instantmesh python=3.10
   conda activate instantmesh
   pip install -r requirements.txt
   ```

   InstantMesh pins **Python 3.10**, **CUDA 12.1**,
   **torch 2.1.0**, **xformers 0.0.22.post7**. Don&rsquo;t move
   these without testing.

2. **trimesh + pillow** for the OBJ&rarr;GLB post-conversion this
   wrapper does:

   ```sh
   pip install trimesh pillow
   ```

3. **This wrapper&rsquo;s FastAPI deps** (already installed if you
   set up `sharp_service.py` from `SHARP_SERVICE.md`):

   ```sh
   pip install fastapi uvicorn python-multipart
   ```

## Checkpoints

InstantMesh auto-downloads ~7.3 GB of weights from
`huggingface.co/TencentARC/InstantMesh` to `<repo>/ckpts/` on first
run. Files:

| File | Size |
| --- | --- |
| `diffusion_pytorch_model.bin` (Zero123++ UNet) | 1.73 GB |
| `instant_mesh_large.ckpt` | 1.51 GB |
| `instant_mesh_base.ckpt` | 1.25 GB |
| `instant_nerf_large.ckpt` | 1.51 GB |
| `instant_nerf_base.ckpt` | 1.25 GB |

The wrapper defaults to **`instant-mesh-base.yaml`** (~10 GB VRAM
peak, ~12-20 s per image on the 3080 Ti). The `large` config peaks
at ~16 GB which will OOM on a 12 GB card unless `low_vram_mode` is
set in the upstream config. Pre-stage the checkpoints in advance:

```sh
huggingface-cli download \
  TencentARC/InstantMesh \
  --local-dir <repo>/ckpts
```

## Environment variables

| Variable | Default | What it controls |
| --- | --- | --- |
| `MESH_TMP_DIR` | `tmp/mesh` | Where uploaded images and rendered `.glb` files land. |
| `MESH_PYTHON` | `python` | The Python binary used to call InstantMesh. Activate the `instantmesh` conda env first, or point this at the env&rsquo;s `python`. |
| `MESH_WORKING_DIR` | `./InstantMesh` | Path to the cloned InstantMesh repo. The wrapper `cwd`s into this before invoking `run.py`. |
| `MESH_CONFIG` | `configs/instant-mesh-base.yaml` | Which config to run. Override to `configs/instant-mesh-large.yaml` on cards with &gt;14 GB VRAM. |
| `MESH_CORS_ORIGINS` | `http://localhost:3000,https://holoflow.co.uk` | Comma-separated allowed origins. |

The TS client reads `MESH_SERVICE_URL` (default
`http://localhost:7844`) &mdash; the studio&rsquo;s next port up from
SHARP video (7843). Set in `lib/env.ts` + `.env.example`.

## Starting the service

```sh
cd D:\.github\_3DPOV\python-services

# Activate the InstantMesh env:
conda activate instantmesh
python -c "import trimesh; print(trimesh.__version__)"  # sanity check

# Then start the wrapper:
uvicorn mesh_service:app --host 0.0.0.0 --port 7844
```

`http://localhost:7844/health` should return
`{"status":"ok","gpu_available":true,"config":"configs/instant-mesh-base.yaml",...}`.

## Pipeline

End-to-end from a staged photo (e.g. one of the CCTV stills from
`scripts/cctv-staging/<location-id>/`):

```sh
# Match (already produced scripts/cctv-matches.json):
pnpm exec tsx scripts/cctv-match-holowalk.ts --radius 300

# Download (per-location folders + time-of-day filenames):
pnpm exec tsx scripts/cctv-download-matched.ts

# Convert each frame to a printable mesh:
pnpm exec tsx scripts/cctv-mesh-batch.ts

# Result: <location-id>/<timestamp>__<cam-id>.glb next to each .jpg
```

## Output shape

The wrapper does the OBJ&rarr;GLB conversion via `trimesh` so consumers
get **one self-contained `.glb`** rather than the OBJ + MTL + texture
PNG trio InstantMesh writes natively. The `.glb` includes:

- Mesh geometry (vertices + faces + normals + UVs)
- Embedded base-colour texture map
- Standard glTF PBR material defaults

It loads directly in any Three.js scene (the studio&rsquo;s
print-bar Canvas does this), and any print-farm partner API that
accepts GLB or STL.

If you ever need the raw OBJ (e.g. to inspect mesh statistics or to
hand-edit topology in Blender), it&rsquo;s preserved under
`tmp/mesh/out/<job-id>/` until the wrapper is restarted.

## Troubleshooting

- **`InstantMesh entry point not found`** &mdash; `MESH_WORKING_DIR`
  doesn&rsquo;t point at a directory containing `run.py`. Clone the
  repo and set the env var.
- **`InstantMesh run.py exited with code N`** &mdash; usually
  checkpoint or config issue. Run the upstream invocation manually
  from the cloned repo to see the real error:

  ```sh
  cd <repo>
  python run.py configs/instant-mesh-base.yaml examples/hatsune_miku.png --export_texmap
  ```
- **`exited 0 but no .obj found`** &mdash; rembg failed on the input
  image (often: solid-colour background, or no clear foreground).
  Try a different frame or pre-strip the background.
- **`OBJ→GLB conversion failed: trimesh not installed`** &mdash; the
  active env doesn&rsquo;t have `trimesh`. `pip install trimesh
  pillow` and restart.
- **CUDA OOM** &mdash; switch from `instant-mesh-large.yaml` to
  `instant-mesh-base.yaml` via `MESH_CONFIG`, or enable upstream
  `low_vram_mode`.

When the service is down, the site catches the typed unreachable
error from `commerce.mesh-job` and falls back to a quote-only flow
(no live mesh preview, just an order-receipt receipt). Same shape
as the SHARP-offline fallback on `commerce.sharp-job`.

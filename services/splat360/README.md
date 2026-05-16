# splat360

360-camera-first Gaussian Splat service. See [PURPOSE.md](PURPOSE.md)
for the wedge and the licence boundary.

## What's in the box

- **3 camera-model paths**: fisheye-pair (pre-stitch DNG), equirect
  (SPHERICAL), cubemap (6×PINHOLE). Decision logic in
  `pipeline/camera_model.py`.
- **5 SfM backends** (`pipeline/sfm/`): COLMAP, GLOMAP, OpenSfM, hloc,
  AliceVision. Each wrapper is ~150 LOC and probes for its binary on
  `is_available()`.
- **4 trainers** (`pipeline/train/`): nerfstudio (splatfacto), Brush,
  gaussian-splatting (Inria reference — research-only, gold standard),
  Postshot (proprietary CLI). Same Protocol.
- **Comparison harness** (`pipeline/compare.py`): runs N variants on
  the same capture, emits `comparison.json` + `comparison.md` with
  winners by speed / density / coverage.
- **FastAPI service** at port 8390 with job store (SQLite) and a
  single-GPU queue.

## Run (when binaries are installed)

```powershell
uv venv .venv
.\.venv\Scripts\Activate.ps1
uv pip install -e .
uvicorn splat360.main:app --host 0.0.0.0 --port 8390
```

Then `GET /health` returns the list of backends actually available on
your PATH right now. That's the diagnostic for whether each pipeline
will run.

## Submit a job

```json
POST /api/jobs
{
  "source": {
    "kind": "fisheye-pair",
    "camera": "avata360",
    "pairs": [
      ["file:///D:/captures/shot_001_a.dng", "file:///D:/captures/shot_001_b.dng"],
      ["file:///D:/captures/shot_002_a.dng", "file:///D:/captures/shot_002_b.dng"]
    ]
  },
  "variants": [
    {"sfm": "colmap",      "trainer": "nerfstudio"},
    {"sfm": "glomap",      "trainer": "nerfstudio"},
    {"sfm": "hloc",        "trainer": "nerfstudio"},
    {"sfm": "alicevision", "trainer": "postshot"}
  ]
}
```

The single-GPU queue runs each variant in sequence; `comparison.md`
in the job out-dir gives you the side-by-side at the end.

## Layout

```text
src/splat360/
  main.py             FastAPI entry + lifespan
  config.py           env-driven config dataclass
  api/
    jobs.py           POST/GET handlers; auto-variant picker
  pipeline/
    ingest.py         URL → local file
    metadata.py       ExifTool wrapper, DJI telemetry box → CSV
    frames.py         ffmpeg fps-decimate
    cubemap.py        equirect → 6 pinhole faces (real numpy/cv2 math)
    camera_model.py   decide() — three paths, pure function
    sfm/              { base, colmap, glomap, opensfm, hloc, alicevision }
    train/            { base, nerfstudio, brush, gaussian_splatting_inria, postshot }
    postprocess.py    PLY → .splat (pure-numpy) and .ksplat (via SuperSplat)
    orchestrator.py   run_variant — 8 stages end to end
    compare.py        comparison.json + comparison.md across variants
  adapters/           { avata360, osmo360, equirect_generic }
  jobs/
    store.py          SQLite job + variants + events
    queue.py          single-GPU FIFO worker
```

## What's tested vs sketched

| Module | Status |
|---|---|
| `cubemap.py` | Real math, runs on any equirect ≥ 2:1. Manually verifiable. |
| `camera_model.py` | Pure function; deterministic decision table. |
| `frames.py`, `metadata.py`, `ingest.py` | Real subprocess wrappers — fail clearly if `ffmpeg` / `exiftool` missing. |
| `postprocess.py` | Real PLY reader + `.splat` writer in pure numpy. |
| `sfm/*`, `train/*` | Real subprocess wrappers around external binaries. Untested end-to-end — needs the binaries on PATH and a GPU to verify. |
| `jobs/`, `api/`, `orchestrator.py` | Wired and importable. Untested with live binaries. |

## Hardware

NVIDIA 12GB VRAM minimum; 24GB recommended for nerfstudio/Inria
trainers. Brush runs on Vulkan / Metal / DX12 — no NVIDIA hard
requirement.

## Port

`8390` — reachable on the tailnet at `chonky.tail99b2a4.ts.net:8390`
once the [hangar-tailscale-https] sidecar pattern is applied.

# SHARP-video service &mdash; the runbook

A FastAPI wrapper around the studio's 2D-video-to-4D pipeline,
running on the 3080 Ti machine. The site's
`commerce.sharp-video-job` TypeScript capability talks to this
service over the studio's local network; jobs come in as video
files, come out as a bundle: a 4D Gaussian Splat timeline
(`.4dgs`), a stereo MP4 stitched for Quest 3 / Vision Pro, and
optionally a sequence of USDZ keyframes. The service is the seam
between the public site and the studio's GPU for moving images.

## Why this exists

The photo path (`sharp_service.py`, port 7842) is the editioned
single-image-to-splat surface. This is the moving-image sibling:
ffmpeg-decode, per-keyframe SHARP, 4DGaussians temporal fit, SBS
stitch. The free in-browser fallback runs per-frame
`viz.depth-estimation` and stitches client-side via Mediabunny &mdash;
workable on a phone for a few seconds of clip but slow and rough.
This service is what makes the editioned-quality video path
possible.

## Prerequisites

Three pieces have to be installed and runnable on the bench:

1. **SHARP** &mdash; same install as the photo service. The wrapper
   shells out to `python -m sharp.infer` per keyframe.
2. **4DGaussians** &mdash; `hustvl/4DGaussians` repo cloned and its
   environment runnable as `python -m four_dgs.fit ...`. Override
   the module path with `FOURDGS_MODULE` if upstream renames it.
3. **ffmpeg** &mdash; on `PATH`, or absolute path set via
   `FFMPEG_BIN`. The wrapper uses ffmpeg both for decode and for
   the SBS-MP4 stitch.

Plus the same three pip packages the photo service needs:

```sh
C:/Users/dimon/AppData/Local/Programs/Python/Python312/python.exe ^
  -m pip install fastapi uvicorn python-multipart
```

## Environment variables

| Variable | Default | What it controls |
| --- | --- | --- |
| `SHARP_VIDEO_TMP_DIR` | `tmp/sharp-video` | Where uploaded videos, decoded frames, per-frame splats, and final bundles land. |
| `FFMPEG_BIN` | `ffmpeg` | ffmpeg binary used for decode + stitch. |
| `SHARP_PYTHON` / `SHARP_MODULE` / `SHARP_CHECKPOINT` / `SHARP_WORKING_DIR` | see `SHARP_SERVICE.md` | Inherited from the photo service's conventions. |
| `FOURDGS_PYTHON` | `$SHARP_PYTHON` | Python binary used to call 4DGaussians (often the same venv). |
| `FOURDGS_MODULE` | `four_dgs.fit` | The `-m` argument for the 4DGS fit step. |
| `FOURDGS_WORKING_DIR` | `$SHARP_WORKING_DIR` | Working directory for the 4DGS subprocess. |
| `SHARP_VIDEO_CORS_ORIGINS` | `http://localhost:3000,https://holoflow.co.uk` | Comma-separated allowed origins. |

The TS client reads `SHARP_VIDEO_SERVICE_URL` (default
`http://localhost:7843`) &mdash; that lives in the site's
`lib/env.ts`, not here.

## Starting the service

```sh
cd D:\.github\_3DPOV\python-services

# Activate the SHARP venv (SHARP + 4DGS share it on the bench):
D:\path\to\ml-sharp\.venv\Scripts\activate

# Then start the wrapper:
uvicorn sharp_video_service:app --host 0.0.0.0 --port 7843
```

The service binds `0.0.0.0:7843` so the development laptop running
the site can reach it across the studio LAN. Port 7843 is one
above the photo service so they coexist cleanly.

## Stopping the service

Ctrl-C in the terminal. In-flight jobs receive a Windows
`CTRL_BREAK_EVENT` and a 5-second grace period before SIGKILL.
Cancellation between frames is honoured already; the
`CTRL_BREAK_EVENT` covers the case where the current subprocess
needs to die mid-call.

## Pipeline stages and progress

Status updates from `GET /jobs/{id}` cycle through:

1. `queued` &mdash; in the in-memory queue, waiting for the worker.
2. `decoding` &mdash; ffmpeg extracts every Nth frame (`keyframeStride`).
3. `running` with `currentFrameStage="sharp"` &mdash; SHARP per
   keyframe; `framesDone / framesTotal` is the per-frame counter the
   UI renders.
4. `running` with `currentFrameStage="4dgs-fit"` &mdash; temporal
   fit of the per-frame splats into one `.4dgs` bundle.
5. `running` with `currentFrameStage="stitch"` &mdash; ffmpeg writes
   the stereo MP4.
6. `done` &mdash; `bundle.splat4dUrl`, `bundle.stereoMp4Url`, and
   optionally `bundle.usdzKeyframesUrl` resolve to download routes.

Cancellation is checked between every subprocess; the state
transition to `cancelled` is honoured before the next stage starts.

## Cross-origin from holoflow.co.uk

Same posture as the photo service. The browser preflight succeeds;
the multipart POST follows; no proxy is needed. No auth in v0.1;
the service binds on the private studio interface only.

## Troubleshooting

- **`required executable missing: ffmpeg`** &mdash; ffmpeg is not on
  `PATH`. Set `FFMPEG_BIN` to the absolute path of the ffmpeg
  binary.
- **`ffmpeg produced no frames`** &mdash; the input video's frame
  count was below `keyframeStride`. Lower `keyframeStride` (the
  submit-time `meta.keyframeStride` field) or drop a longer clip.
- **`sharp failed on frame N (rc=...)`** &mdash; SHARP died on a
  particular keyframe. Check the input frame size (SHARP wants a
  ~1024 long edge minimum) and the SHARP venv.
- **`4DGaussians fit failed`** &mdash; the temporal-fit subprocess
  exited non-zero. Common cause: the per-frame `.ply` files have
  inconsistent splat counts. Re-run with a different
  `keyframeStride`.
- **Stitch step finishes but the SBS MP4 looks identical to input**
  &mdash; the v0.1 stitch is a placeholder that copy-streams the
  input. The real SBS renderer lives in the 4DGS Python tool and
  will be wired here once its CLI is canonical.

When the service is down, the site catches the typed
`SharpServiceUnreachableError` from `commerce.sharp-video-job` and
falls back to the free in-browser per-frame depth path.

# `commerce/sharp-video-job.ts` — purpose twin

## Role

The studio's editioned-quality 2D-video-to-4D-experience path.
Submits a video file to the studio's local SHARP+4DGS pipeline
running on the 3080 Ti, polls the long-running job (minutes per
few-second clip), and returns a bundle: a 4D Gaussian Splat
timeline (`.4dgs`), a stereo MP4, and optionally USDZ keyframes.

This is the "premium" path of the **/spatial/video** route. The
free path is per-frame `viz.depth-estimation` → frame-stitched
stereo MP4, running entirely in the visitor's browser. The site
falls back to that automatically when this service is offline.

## Public surface

- `submitSharpVideoJob(input)` → `SharpVideoJobHandle` —
  multipart-upload to `POST /jobs` on the SHARP-video service.
- `rehydrateVideoJob(jobId)` → `SharpVideoJobHandle` — reconstruct
  the handle from a persisted job ID (page reloads, mobile-app
  resume, "open last commission" links).
- `isSharpVideoServiceAvailable()` →
  `{ available, version?, reason? }` — never throws; gates the
  commission-video button before the visitor wastes upload time.
- Types: `SharpVideoJobInput`, `SharpVideoJobStatus` (the discriminated
  union: queued / decoding / running / done / error / cancelled),
  `SharpVideoJobHandle`.

## Internal

- One Python service URL: `SHARP_VIDEO_SERVICE_URL`, default
  `http://localhost:7843` (one above the `sharp-job` service to
  keep the ports adjacent).
- Service contract (mirrored in `python-services/sharp_video_service.py`):
  - `POST /jobs` multipart: `video` (file) + `meta` (JSON) →
    `{ jobId }`.
  - `GET /jobs/{id}` → status JSON narrowed by `narrow()`.
  - `DELETE /jobs/{id}` → cancel.
  - `GET /jobs/{id}/result/{splat4d|stereoMp4|usdzKeyframes}` →
    binary download.
- Reuses `SharpServiceUnreachableError` from
  `commerce/sharp-job.ts` so the calling UI's degraded-mode copy
  works for both.
- Poll interval defaults to 5s (vs 2s for `sharp-job`) — video
  jobs are minutes long, no point hammering the service.

## Depends on

- `lib/env` for `SHARP_VIDEO_SERVICE_URL`.
- `commerce/sharp-job` for the shared `SharpServiceUnreachableError`
  type (no runtime coupling beyond that one re-exported class).

## Does not

- **Does not decode video in the browser.** The service receives
  the original file and handles decoding via ffmpeg. The free
  in-browser path lives in `app/spatial/video/spatial-video-demo-client.tsx`
  (lands when the route does) and uses WebCodecs.
- **Does not poll forever silently.** Callers either explicitly
  loop with `waitForCompletion` or drive polling from a UI tick.
- **Does not stream frame previews.** Status updates are
  whole-job snapshots (counter + stage). Per-frame preview
  thumbnails would need a WS upgrade — future work.
- **Does not retry.** A failed poll throws/returns an error
  state; the caller decides whether to back off.

## Bordering files

- `lib/capabilities/commerce/sharp-job.ts` — the photo sibling.
  Re-uses `SharpServiceUnreachableError`.
- `python-services/sharp_video_service.py` — FastAPI wrapper.
- Future `app/spatial/video/page.tsx` + `spatial-video-demo-client.tsx`.
- `lib/env.ts` — `SHARP_VIDEO_SERVICE_URL` keyed here.

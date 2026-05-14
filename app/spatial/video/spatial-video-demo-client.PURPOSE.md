# `spatial-video-demo-client.tsx` — purpose twin

## Role

The free in-browser 2D→3D-video conversion surface — the moving-
image sibling of `/spatial`. Drop a short clip, the page extracts
frames, runs Depth Anything V2 per frame, generates stereo
pairs, and stitches them into a side-by-side MP4 the visitor
can download and play on Quest 3 / Vision Pro. Per-frame work
runs entirely on the device; nothing leaves the page unless the
visitor explicitly commissions the studio's SHARP-video bench.

The premium counterpart is `commerce.sharp-video-job`, which
runs Apple SHARP + 4DGaussians on the studio's 3080 Ti. This
client surfaces the commission button alongside the free output.

## Public surface

- Default export `SpatialVideoDemoClient()` — no props.
  Self-contained.

## Internal

- **Phase state machine**: `idle → probing → ready |
  ready-no-support → loading-video → processing → done`, plus
  `commissioning` and `error` as off-ramps.
- **Feature detect** on mount: `probeDepthSupport()` +
  `probeSpatialFormats()` + `isSharpVideoServiceAvailable()`
  parallel; pills surface the result.
- **Per-frame pipeline** in `processVideo()`:
  - `HTMLVideoElement` loads the file via blob URL, waits for
    `loadedmetadata` (5s timeout).
  - Clip is capped at 8s for the free path; longer clips bounce
    to the SHARP commission.
  - Sampling at 12 fps (`TARGET_FPS`) — a perceptual floor for
    motion that keeps per-frame depth inference tractable.
  - For each frame: seek video, draw to canvas, create
    ImageBitmap, run `estimateDepth`, generate stereo pair via
    `generateStereoPair`, feed to the recording handle.
  - Progress callback reports frames done / total + last
    inference ms.
- **Cancellation**: `cancelRef` is set true from the cancel
  button; the loop checks before each frame, throws, and the
  recording handle's `cancel()` flushes any partial state.
- **Result**: blob → object URL → `<video controls>` preview +
  download link + commission button.
- **SHARP commission**: same drop-zone for the no-support path;
  `submitSharpVideoJob` + `waitForCompletion(5000ms)` poll
  cadence; status panel reports queued / decoding / running
  state per `SharpVideoJobStatus`.

## Depends on

- `lib/capabilities/viz/depth-estimation` —
  `probeDepthSupport`, `estimateDepth`.
- `lib/capabilities/viz/stereo-pair` — `generateStereoPair`.
- `lib/capabilities/viz/spatial-export` —
  `startSpatialRecording`, `probeSpatialFormats`,
  `SpatialRecordingHandle`.
- `lib/capabilities/commerce/sharp-video-job` —
  `submitSharpVideoJob`, `isSharpVideoServiceAvailable`,
  `SharpVideoJobHandle`, `SharpVideoJobStatus`.

## Does not

- **Does not upload anything by default.** Frame extraction +
  depth + stereo + stitch all happen in the page.
- **Does not preserve original video frame rate.** Aggressive
  downsample to 12 fps. Future work: optional per-frame mode for
  shorter clips.
- **Does not extract audio.** Output is a silent SBS-MP4.
- **Does not handle vertical video specially.** Whatever
  orientation the source has, the output keeps it.
- **Does not include a print-bar.** Spatial video is downloadable
  digital output; the print-bar belongs on 3D-printable surfaces
  (HoloWalk, atelier algorithms). Future: a "digital edition"
  variant of the print-bar for STL/MP4/USDZ downloads.

## Bordering files

- `app/spatial/video/page.tsx` — server shell that embeds this.
- `app/spatial/spatial-demo-client.tsx` — the still-image
  sibling client.
- `python-services/sharp_video_service.py` — the SHARP-video
  bench wrapper this client commissions when the bench is
  online.

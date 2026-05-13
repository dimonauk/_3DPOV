# `depth-estimation.ts` — purpose twin (capability `viz.depth-estimation`)

## Role

The first leg of the "tap any photo to see it in 3D" wedge. Takes a
single source image and returns a normalised per-pixel depth map
(0..1, 1 = nearest) by routing through Hugging Face Transformers.js
and a small Depth Anything V2 ONNX model. No server cost, no upload
— inference runs in the browser, weights cache after the first run.

## Public surface

- `probeDepthSupport()` — synchronous device probe. Returns
  `{ webgpu, webgl, recommendedBackend, recommended, reason? }`.
  Safe to call on page load.
- `estimateDepth(image, options?)` — async; returns
  `{ depthMap, width, height, inferenceMs, backend }`.
- `warmupDepthModel(options?)` — preload the pipeline so the first
  user-facing call is fast.
- Types: `DepthBackend`, `DepthEstimationOptions`,
  `DepthEstimationResult`, `DepthSupport`.

## Internal

- `PIPELINE_CACHE: Map<key, Promise<LoadedPipeline>>` — keyed by
  `${modelId}::${backend}`. A failed load deletes its cache slot so
  the next call retries cleanly.
- `detectWebGPU()` — `"gpu" in navigator`.
- `detectWebGL()` — tries `getContext("webgl2") ?? getContext("webgl")`
  on a throw-away canvas.
- `detectIOSSafari()` — UA-sniffing kept narrow. Used only for the
  "WebGPU absent + WASM too slow" downgrade signal.
- `resolveBackend(requested?)` — honours an explicit backend if it
  is supported on the device; otherwise falls through to the probe's
  recommended backend.
- `deviceFor(backend)` — maps our public `DepthBackend` to a
  Transformers.js device string. `"webgl"` does not exist as a
  Transformers execution provider, so the WebGL tier routes through
  WASM at inference time while still signalling the device class to
  the caller.
- `normaliseDepth(raw)` — min/max rescale into 0..1. Depth Anything
  outputs raw values where larger = closer, so the natural
  normalisation already lands at "1 = nearest" without inversion.
- `toCanvas(image)` — converts ImageBitmap / HTMLImageElement to a
  short-lived `<canvas>` because Transformers v4 accepts canvases
  directly but not ImageBitmaps.

## Depends on

- `@huggingface/transformers` v4 — `pipeline("depth-estimation", ...)`.
- Hugging Face Hub at runtime for first-load weight download (CDN
  cached via IndexedDB / service worker by Transformers itself).
- Browser globals: `navigator`, `document`, `performance`,
  `HTMLCanvasElement`, `ImageBitmap`, `HTMLImageElement`.

## Does not

- **Does not render.** Returns raw `Float32Array`. The component
  layer or `viz.stereo-pair` consumes it.
- **Does not host the weights.** Model id is a parameter; default is
  `onnx-community/depth-anything-v2-small` (Apache-2.0). Caller can
  point at any compatible HF repo.
- **Does not retry or queue.** Single call, single result. Concurrent
  calls share the same cached pipeline.
- **Does not write to any slice.** Headless by rule. State threading
  is the caller's job.
- **Does not normalise into camera-space metres.** The depth map is
  *relative* depth, scaled 0..1. Absolute scale needs the camera
  intrinsics — out of scope for this capability.

## Plug surface

- **State plugs (write):** none.
- **State plugs (read):** none.
- **Type plugs:** input `(image, options?)`; output
  `DepthEstimationResult`.
- **Dependency plugs:** `@huggingface/transformers` pipeline.

## Bordering files

- `lib/capabilities/viz/stereo-pair.ts` — direct downstream consumer.
- Future `app/photo-to-3d/page.tsx` — atelier surface for the wedge.
- Future `lib/capabilities/viz/depth-export.ts` — write depth as a
  16-bit PNG / EXR side-car.

## Box 3 lift attribution

- Model weights: `onnx-community/depth-anything-v2-small`,
  Apache-2.0. Loaded at runtime; no vendored binaries.
- Runtime: `@huggingface/transformers` v4 (Apache-2.0) is a proper
  npm dependency per the architecture's "release cadence + maintainer"
  test — we use its API, not a fork.

## iOS Safari note

`probeDepthSupport()` returns `recommended: false` on iOS Safari
when WebGPU is absent. The reason string asks the caller to skip the
50MB model download entirely on those devices rather than running
WASM inference at unusable frame rates. The caller should surface
this as a graceful UI fallback (still photo with a "3D requires
WebGPU" badge) rather than silently degrading.

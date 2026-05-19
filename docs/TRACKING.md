# Tracking — viewer-pose input for the WebGPU scene

Where the viewer's head actually sits in front of their monitor,
delivered as a normalised `{x, y, z}` (and sometimes `{yaw, pitch,
roll}`) stream. The 3D scene's camera reads that stream so parallax
becomes spatial — drift left in your chair and the page drifts with
you — rather than a scripted effect that plays the same whether you
move or not.

Direction from Dimona, 2026-05-19:

> wire everything up to media pipe and kinect azure and ulkltraleap
> tracking with fall back to gaze estimation from a normal webcam
> and mediapipe

That's the brief. Five sources, cascading in order of fidelity,
with the cheap one always there as a floor.

## The fallback chain

Sources are tried in this order. The first one that resolves
`available()` true becomes the active source. The user can
override manually through the chip in the corner.

| # | Source             | What it needs                                    | What it gives                          |
|---|--------------------|--------------------------------------------------|----------------------------------------|
| 1 | Azure Kinect       | Bench bridge URL + bearer token (env)            | Full head pose + eye centres, low jitter |
| 2 | Ultraleap          | Leap Motion 2 over the local SDK websocket       | Hand-position centroid, no head rotation |
| 3 | MediaPipe Face     | Webcam consent, MediaPipe WASM + face model      | Eye-midpoint position, yaw/pitch/roll  |
| 4 | MediaPipe Hand     | Webcam consent, MediaPipe WASM + hand model      | Palm-centre position, no rotation      |
| 5 | Pointer fallback   | Nothing                                          | XY from `pointermove`, neutral Z       |

A failure at any rung never collapses the chain — the next one
in line takes over. The pointer floor means there is always
something driving the scene.

## Privacy posture

All inference runs on the device. The face and hand models are
the MediaPipe Tasks bundle running in a Web Worker; the only
network it touches is the first-time fetch of the WASM + model
files from Google's CDN. Frames never leave the browser.

The Kinect path streams from the user's own bench machine over
Tailscale. Same posture in practice — the operator's bench is
not a third party. The bench's FastAPI service stays on the
tailnet (no Funnel by default) and authenticates every request
with a bearer token.

Consent for the webcam is asked once and remembered in
`localStorage` under `holoflow.tracking.consent`. The chip in
the corner exposes the reset button when the user wants to
revisit the decision. Until consent is "granted", the chain
skips straight past both MediaPipe sources and lands on the
pointer.

## Frame budget

- Face landmarker runs at 30 fps. Detunes to 15 fps after five
  consecutive frames over budget — checked inside
  `lib/tracking/sources/mediapipe-loop.ts`.
- Hand landmarker starts at 15 fps and detunes to 10 if pressure
  hits. The model is heavier than face, so we trade frame rate
  for stability when hand is what's keeping us alive.
- The capture loop never queues more than one frame per worker.
  If inference is still in flight when the next tick arrives, we
  skip and try again.
- Reduced-motion: tracking still runs (it's input, not motion
  the viewer sees). Downstream parallax respects
  `prefers-reduced-motion: reduce` and falls flat under that
  preference.

## Consuming the stream from a component

For a low-frequency UI overlay (a HUD, a chip showing the source),
use the hook:

```tsx
import { useViewerPose } from "hooks/useViewerPose";

function Hud() {
  const { pose, source } = useViewerPose();
  if (!pose) return null;
  return (
    <span>
      {source}: {pose.x.toFixed(2)} / {pose.y.toFixed(2)} / {pose.z.toFixed(2)}
    </span>
  );
}
```

For a high-frequency consumer (a `useFrame` callback in R3F, a
WebGPU TSL shader that wants the pose in its compute pass), skip
the hook — go through the registry directly so the transform
write never queues a React render:

```ts
import { subscribe, type ViewerPose } from "lib/tracking";

useEffect(() => {
  const off = subscribe((pose: ViewerPose) => {
    cameraRig.position.x = pose.x * RANGE;
    cameraRig.position.y = pose.y * RANGE;
    cameraRig.position.z = (1 - pose.z) * DEPTH;
  });
  return off;
}, []);
```

The shape mirrors `lib/parallax/store` so the patterns are
already familiar.

## Wiring the Kinect bridge

The Kinect SDK is Windows-native, so we expose it via a small
FastAPI service on the studio's bench. The same Tailscale Funnel +
shared-bearer pattern documented in the `holoflow-bench-bridge`
skill and in `docs/FEDERATION.md` for the federation layer.

Two env vars wire it up:

```
NEXT_PUBLIC_KINECT_BRIDGE_URL=https://kinect.tail99b2a4.ts.net
NEXT_PUBLIC_KINECT_BRIDGE_TOKEN=<shared-bearer>
```

The bench service needs two endpoints:

- `GET /health` — must return 2xx when the Kinect device is alive.
  Used by `available()` to decide whether to attempt the stream.
- `GET /api/kinect/head-pose/stream` — Server-Sent Events stream.
  Accepts the bearer via either the `Authorization: Bearer ...`
  header (`fetch`-based EventSource polyfills) or the `?token=`
  query param (native browser EventSource cannot set headers).

Each SSE message is a JSON object:

```json
{
  "head":  { "x": 0.0, "y": 0.0, "z": 0.6 },
  "yaw":   0.12,
  "pitch": -0.04,
  "roll":  0.01,
  "left_eye":  { "x": -0.03, "y": 0.05, "z": 0.6 },
  "right_eye": { "x":  0.03, "y": 0.05, "z": 0.6 },
  "timestamp_ms": 1715000000123
}
```

Positions are in metres in the Kinect camera frame. The client
normalises them into the `[-1, +1]` viewport convention with the
calibration constants at the top of
`lib/tracking/sources/kinect-bridge.ts`. If the bench
pre-normalises (values already inside `[-1, +1]`), the client
passes them through unchanged.

Connection retry is exponential with a 30s ceiling. A brief
Funnel blip or a Tailscale reconnect does not knock the Kinect
out of the chain permanently.

## File map

- `lib/tracking/types.ts` — `ViewerPose`, `TrackingSource`,
  `TrackingTracker`, `FALLBACK_CHAIN`.
- `lib/tracking/registry.ts` — singleton coordinator,
  `subscribe`, `setPreferredSource`, `reevaluate`.
- `lib/tracking/webcam.ts` — refcounted shared `MediaStream` +
  consent helpers.
- `lib/tracking/sources/kinect-bridge.ts` — SSE client for the
  bench bridge.
- `lib/tracking/sources/ultraleap.ts` — Leap Motion 2 over the
  local websocket (port 6437).
- `lib/tracking/sources/mediapipe-face.ts` — webcam → face mesh
  worker → ViewerPose.
- `lib/tracking/sources/mediapipe-hand.ts` — webcam → hand
  landmark worker → ViewerPose.
- `lib/tracking/sources/mediapipe-loop.ts` — shared capture +
  detune loop used by both webcam sources.
- `lib/tracking/sources/pointer-fallback.ts` — bottom of the
  chain, always available.
- `lib/tracking/index.ts` — barrel that registers every source
  by import side-effect.
- `lib/workers/face-mesh.worker.ts` — MediaPipe FaceLandmarker
  in a worker.
- `lib/workers/hand-landmark.worker.ts` — MediaPipe
  HandLandmarker in a worker.
- `hooks/useViewerPose.ts` — React hook (rAF-coalesced).
- `components/tracking/TrackingPermission.tsx` — consent modal.
- `components/tracking/TrackingStatus.tsx` — floating chip,
  click to open the modal.

## Future passes

- **WebXR head-pose on supported sessions.** When the page is in
  an immersive XR session (Vision Pro Safari, Quest Browser,
  ARKit-backed WebXR on iOS) the headset's own pose is several
  classes more accurate than any of the above. Add a sixth
  source at the top of the chain that reads from the active
  `XRFrame`'s `viewerPose.transform` when an XR session is alive.
- **iOS ARKit face anchor without WebXR.** Safari exposes some
  of the ARKit face mesh through `WebKitNamespace`-prefixed APIs
  in dev modes; worth a try for the `holoflow.co.uk` PWA on
  iPhone home-screen installs.
- **Multi-viewer disambiguation.** Right now if MediaPipe finds
  two faces, we take the first. A second pass could pick the
  largest (closest), or expose `pose.viewers[]` for multi-head
  rigs.

# gaze.PURPOSE.md

## Role

Yaw/pitch gaze sample stream over time. Companion to `input.headpose`:
headpose owns the current orientation, gaze owns the buffered history
of where the viewer has looked, plus the analysis helpers (statistics,
dwell-zone clustering, time-range filters) chambers want.

## Public surface

- Buffer management: `resetSession`, `appendSample`, `getSamples`,
  `loadFromJson`.
- Analysis: `filterByTimeRange`, `computeStatistics`, `computeDwellZones`.
- Types: `GazeSample` (re-exported from `lib/math/signal`), `StatisticSet`,
  `DwellZone`.

## Internal

- `SESSION` — module-level buffer + session-start timestamp.

## Depends on

- `lib/math/spherical.ts` for angularDistanceDegrees.
- `lib/math/signal.ts` for detectSaccades + GazeSample.

## Does not

- **Does not track the eyes directly.** The capability accepts samples
  from any source (WebGazer.js, GazeRecorder API, in-house MediaPipe
  eye-landmarker, recorded JSON). The actual tracking lives in the
  consuming chamber.
- **Does not render the heatmap.** `viz.heatmap-equirect` renders
  GazeSample[] to an equirect canvas; this capability is the
  *source*, not the *render*.
- **Does not write to a zustand slice yet.** Holds the buffer in a
  module-level SESSION object so the analysis helpers are
  pure-function-callable without a React tree. A future `input` slice
  binding can be added when multiple surfaces need to observe the
  same session.

## Bordering files

- `lib/capabilities/input/headpose.ts` — current-orientation sibling.
  Together they cover "where are they looking now" and "where have
  they looked".
- `lib/capabilities/viz/heatmap-equirect.ts` — primary consumer.
- `app/atelier/gaze-heatmap/` (planned) — replay-and-analyse chamber.

# heatmap-equirect.PURPOSE.md

## Role

Render an equirectangular (2:1) heatmap / foveal mask / scanpath
visualisation from a gaze sample stream. The bridge between
`input.gaze` (sample source) and the chamber's canvas.

## Public surface

- `renderEquirectToCanvas(ctx, options)` — three-in-one render.
- Types: `RenderEquirectOptions`, `TemporalWeighting`, `AnalysisMode`.

## Internal

- `DEFAULT_RAMP` — cool-to-hot colour ramp for the HEATMAP mode.
- `DEFAULT_SCANPATH_COLORS` — cyan path + nodes for SCANPATH mode.
- `pointsForCanvas` — yaw/pitch + timestamp → x/y/weight in pixel
  space.

## Depends on

- `lib/algorithms/heatmap.ts` — the 2D rasteriser (HEATMAP mode).
- `lib/math/spherical.ts` — yaw/pitch → UV mapping.
- `lib/capabilities/input/gaze.ts` — GazeSample type.

## Does not

- **Does not own the canvas.** The chamber creates the element, sets
  the resolution, and passes the 2D context.
- **Does not pre-filter samples by time range.** Caller passes the
  visible window already; this function only uses timeRange for
  weighting.
- **Does not render server-side.** Uses browser-only
  `CanvasRenderingContext2D` methods (createRadialGradient,
  globalCompositeOperation). Could run on `@napi-rs/canvas` if
  needed later; not exercised today.

## Bordering files

- `lib/capabilities/input/gaze.ts` — sample-source sibling.
- `lib/algorithms/heatmap.ts` — algorithm under the HEATMAP mode.
- `lib/math/spherical.ts` — coordinate mapper.
- `app/atelier/gaze-heatmap/` (planned) — primary consumer.

# `stereo-pair.ts` — purpose twin (capability `viz.stereo-pair`)

## Role

The second leg of the "tap any photo to see it in 3D" wedge. Given
a source image and a depth map (from `viz.depth-estimation`),
generate the left/right eye views the viewer fuses into 3D — for
anaglyph, side-by-side WebXR, lenticular print, or a parallax
shimmer animation.

Pure math, no async, no dependencies beyond the standard
`ImageData` API.

## Public surface

- `generateStereoPair(source, depthMap, options?)` — primary entry
  point. Source is an `ImageData`; depth is a flat row-major
  `Float32Array` matching the image dimensions. Returns
  `{ left, right, width, height, averageParallaxPx }`.
- `generateStereoPairFromElement(source, depthMap, depthW, depthH, options?)`
  — convenience for Canvas / Image / ImageBitmap inputs. Honours a
  depth buffer that is smaller than the source image (Depth Anything
  V2 outputs at a lower resolution than typical input photos).
- Types: `StereoOptions`, `StereoPair`.

## Internal

- `FOCAL_PLANE = 0.5` — depth value that maps to zero parallax.
  Pixels with depth > 0.5 sit "in front of" the screen and push
  outward; depths < 0.5 sit behind and pull inward.
- `warp(source, depthMap, ..., parallaxFactor, inpaintRadius)` —
  forward-mapping warp. For each pixel, compute its target column
  in the warped frame and write there. Drops pixels whose target
  falls outside the frame.
- `inpaintHoles(data, mask, width, height, radius)` — single-row
  occlusion fill. For each unfilled pixel, scan up to `radius`
  pixels left and right for the nearest filled neighbours and
  average them. If only one side has a neighbour, copy it
  straight across. Edges past `radius` from any filled pixel stay
  transparent black.
- `sampleDepth(...)` — nearest-neighbour resample when the depth
  buffer dimensions don't match the source. Cheap on purpose.
- `elementToImageData(source)` — Canvas/Image/ImageBitmap →
  ImageData via a short-lived `<canvas>`. The convenience entry
  point uses this so callers don't have to extract pixels twice.

## Hole-fill strategy

Forward warps leave horizontal stripes of un-written pixels at
occlusion boundaries (where a foreground edge would reveal new
background that the source didn't contain). A simple
nearest-non-empty horizontal average within `inpaintRadius`
hides these gaps cheaply.

This is intentionally a v0.1 strategy. It is fast (single linear
pass), allocation-light, and correct enough that the stereo fusion
lands without smearing. Sophisticated diffusion-based inpainting
is a future capability (`viz.inpaint-occlusion`) that would slot
in behind the same surface — same call, deeper fill.

## Depends on

- `ImageData`, `Uint8ClampedArray`, `Uint8Array`, `Float32Array`.
- `HTMLCanvasElement` (only in the convenience entry point).
- No npm deps. No state slices.

## Does not

- **Does not infer depth.** Caller provides the depth map. Pair this
  with `viz.depth-estimation` or any other source.
- **Does not render to screen.** Returns `ImageData` for both eyes.
  The component layer composes them (anaglyph mix, side-by-side
  layout, WebXR stereo cameras).
- **Does not write to slices.** Headless by rule.
- **Does not do diffusion inpainting.** The horizontal hole-fill is
  fast and good-enough for fusion. Higher-quality fill is a
  separate capability.
- **Does not animate.** Single-frame transform. A
  `viz.parallax-shimmer` capability will animate the parallax
  factor over time without re-running this routine.
- **Does not change image scale or aspect.** Output frames match
  the input image dimensions exactly.

## Plug surface

- **State plugs (write):** none.
- **State plugs (read):** none.
- **Type plugs:** `(ImageData, Float32Array, options?)` →
  `StereoPair`.
- **Dependency plugs:** none — pure entry point.

## Parameters and tuning

- `baselineMeters` (default `0.064`) — real interpupillary distance.
  The default lands close to what the average viewer's eyes will
  actually fuse without strain.
- `depthScale` (default `1.0`) — multiplier for "how much 3D".
  Increase for stronger pop-out; decrease for subtler shimmer.
- `inpaintRadius` (default `4`) — pixels. Larger radii hide bigger
  occlusion gaps but smear edges.
- `averageParallaxPx` (output) — mean absolute parallax. Useful
  diagnostic for tuning. ~3–8 px is comfortable; >20 px hurts.

## Bordering files

- `lib/capabilities/viz/depth-estimation.ts` — primary upstream.
- Future `lib/capabilities/viz/anaglyph.ts` — red/cyan mix.
- Future `components/photo-3d/StereoViewer.tsx` — DOM/WebXR display.
- Future `lib/capabilities/viz/parallax-shimmer.ts` — animated
  single-eye parallax for the marketing wedge.

## Box 3 lift attribution

No external code lifted. Depth-image-based-rendering (DIBR) is
public-domain technique; the math here is straightforward
forward-warping with horizontal hole-fill. Written to our shape
from first principles.

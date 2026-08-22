# Screen Recording Notes — Blob Planet (GN Set Position + Noise)

Target file: `public/library/videos/geometry-nodes/gn-set-position-noise-displacement/screen.mp4`

## Setup

| Setting | Value |
|---|---|
| Software | OBS Studio / Xbox Game Bar / macOS Screenshot |
| Source | Window Capture — Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic capture) |
| Encoder | x264 / H.264, CRF 18 |

## What to record

1. **Open** `blob_planet.blend` — Blender starts in frame 1.
2. **Camera** — switch viewport to camera view (Numpad 0).
3. **EEVEE preview** — ensure Viewport Shading is set to Rendered (Numpad Z → Rendered, or the sphere icon top-right).
4. **Animate** — drag the timeline playhead slowly from frame 1 to 90 while recording. The blob surface should breathe and shift as both noise layers evolve along the W axis.
5. **Geometry Nodes editor** — split the viewport; drag open the GN editor to show the node graph while the animation plays. The viewer shows the BlobPlanet group with Set Position and both Noise Texture nodes visible.
6. **Property panel** — with the object selected, open the modifier tab (spanner icon) and show the BlobPlanet modifier group sockets: W_Anim (being driven), Macro_Amplitude, Micro_Amplitude.
7. **Spreadsheet** — briefly open the Spreadsheet editor and select domain = Point. Show the `elevation_fac` column populating with values in [0, 1].
8. **Stop** recording at frame 90.

## Trim and export

- Trim to 15–20 seconds total.
- Export at 1920 × 1080, H.264, CRF 18.
- Save as `screen.mp4` in `public/library/videos/geometry-nodes/gn-set-position-noise-displacement/`.

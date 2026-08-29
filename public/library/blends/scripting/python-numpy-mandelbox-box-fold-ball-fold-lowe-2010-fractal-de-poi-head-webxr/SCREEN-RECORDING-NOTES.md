# Screen Recording Notes — Mandelbox Poi Head

Output target: `public/library/videos/scripting/python-numpy-mandelbox-box-fold-ball-fold-lowe-2010-fractal-de-poi-head-webxr/screen.mp4`

## OBS / Windows Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender (full window) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic) |
| Output format | MP4 (H.264) |
| Bitrate | 4 000 kbps |

## What to record

1. **Script in Scripting workspace** — paste `blueprint.py`, hit Run; watch the system console output for the scan progress lines (`[Mandelbox] scanning Basis surface…`). This takes ~60 s in Python.
2. **3D Viewport** — switch to Material Preview (Z → Material Preview) with `Vertex` colour mode to see the cobalt-amber gradient appear.
3. **Shape key morph** — in Properties → Object Data → Shape Keys, drag SK_Scale2 slider from 0 → 1 slowly. The spines visibly lengthen. Then drag SK_Scale125 slider to show the compact variant.
4. **Viewport orbit** — hold middle mouse, orbit to show the octahedral/cubic symmetry of the Mandelbox box-fold structure vs. the more spherical Mandelbulb.
5. **GLB export path** — show the terminal output line `[Mandelbox] → .../mandelbox_poi.glb`.

## Blender viewport settings for recording

- Theme: Dark (default)
- Overlay: none (Alt+Z)
- Viewport shading: **Vertex colour** (top-right dropdown in Solid mode)
- Backface culling: off
- HDRI: none needed (Workbench vertex colour is self-lit)

## Preamble card (optional)

Record a 5 s title card in OBS text overlay:  
`Mandelbox — box-fold / ball-fold fractal · Blender 5.1 · Holoflow Studio`

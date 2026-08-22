# Viewport Compositor — Real-Time Glare, Vignette & Colour Grade (Blender 5.1)

The Viewport Compositor lets you preview and iterate compositor effects directly
in the EEVEE 3D viewport without rendering.  This entry builds a three-stage
grade — bloom (Glare BLOOM), colour lift/gamma/gain (Colour Balance), and barrel
lens distortion — plus a Multiply vignette via an Ellipse Mask.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds the full scene + compositor node tree in Blender |
| `record.py` | Renders a 120-frame (5 s) orb-pulse animation to `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions for `screen.mp4` |

## Quick start

1. Open a new Blender 5.1 file.
2. Paste and run `blueprint.py` in the Text Editor.
3. The 3D viewport switches to RENDERED shading with the Viewport Compositor enabled.
4. Open the Compositor editor and drag node values — the viewport updates in real time.
5. Run `record.py` to render the animation to MP4.

## Key parameters

```
GLARE_THRESHOLD  = 0.80   # lower = more surfaces bloom; raise to isolate emissives
GLARE_SIZE       = 7      # corona width (1–9); 7 ≈ 128 px on 1280 px wide output
CB_GAMMA         = (...)  # warm/cool midtone push
VIGNETTE_BLEND   = 0.70   # 0 = no vignette, 1 = fully darkened corners
LENS_DISTORT     = -0.025 # barrel; keep ≤ |0.04| for readability
```

## Technique notes

- `space.shading.use_compositor = 'ALWAYS'` activates the Viewport Compositor
  for all 3D viewport shading modes (not only camera view).
- The node tree (`scene.node_tree`) is shared with the offline Compositor.
  F12 renders produce the same graded output without any extra setup.
- EEVEE Next removed the Bloom render toggle in 4.2. The `CompositorNodeGlare`
  with `glare_type='BLOOM'` is the canonical replacement.
- Only GPU-compatible nodes run in the Viewport Compositor.  Defocus, Denoising,
  and pass-based nodes (Mist, Z, Normal) are offline-only.

## Tutorial

`/tutorials/blender-tutorial-viewport-compositor-realtime-glare-vignette-colour-grade`

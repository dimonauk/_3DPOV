# Compositor — Motion Vector Pass + Vector Blur: Fast EEVEE Motion Blur

**Blender 5.1 · Holoflow Studio · CC0**

## What this teaches

How to use Blender's **Motion Vector render pass** and the **Vector Blur
compositor node** to produce convincing motion blur in EEVEE in
post-processing — roughly 10× faster than Cycles path-traced motion blur
for rigid-body animation.

## Scene

A cobalt-blue metallic faceted Icosphere (flat-shaded, Ico-2 subdivisions)
spinning 360° over 36 frames at 24 fps — one full rotation per second.
The compositor applies a smear along per-pixel velocity vectors; the
resulting streak reveals each face's trajectory across the frame.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full scene + compositor setup from scratch (run in Text Editor) |
| `record.py` | Renders a 60-frame comparison: 30 without blur → 30 with blur, outputs `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for capturing the live compositor toggle |

## Quick start

1. Open Blender 5.1 — File › New › General.
2. Open the Text Editor, paste `blueprint.py`, press **Alt+P**.
3. Switch to the **Compositing** workspace — the node tree is ready.
4. Press **F12** on any frame (try frame 18, the 180° midpoint) — you'll see the blue gem with a long trailing smear.
5. Mute the VecBlur node (**M** with cursor over it) and re-render — compare the clean frame.

## Key parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `BLUR_SPEED` | 0.75 | Multiplier on vector length; 1.0=full-frame displacement, 0.5=subtle |
| `BLUR_SAMPLES` | 32 | Streak quality; 16=preview, 64=film |
| `BLUR_MAX_PX` | 80 | Streak length cap in pixels |
| `SPIN_FRAMES` | 36 | Frames per rotation; fewer = faster = longer streak |

## Expected artefacts

- `vecblur_demo.blend` — saved scene
- `render/vecblur_001.png … vecblur_036.png` — single-rotation PNG sequence
- `videos/compositing/compositor-motion-vector-blur/viewport.mp4` — comparison clip

## Known limits

- **Deformable geometry** (cloth, shape keys, fluid) does NOT produce accurate
  vector pass data in EEVEE Next — only rigid-body transforms and armature rigs.
  Use EEVEE's built-in motion blur (`scene.eevee.use_motion_blur = True`) for
  deformable objects.
- **Alpha-over composites**: Vector Blur does not respect alpha-premultiplication
  boundaries — streak from a blurred foreground object can over-bleed onto a
  background layer.  Use per-layer rendering + separate VecBlur nodes per layer
  for correct alpha boundaries.

## Licence

CC0 — no rights reserved.  Attribution appreciated but not required.

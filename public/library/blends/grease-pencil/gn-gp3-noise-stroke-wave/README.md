# GN for Grease Pencil 3 — Noise-Wave Stroke Displacement (Blender 5.1)

Procedural wave displacement applied to GP3 ink strokes via a Geometry Nodes
modifier. Three concentric closed circles written programmatically are displaced
in Y by a 3-D Noise Texture that samples each stroke point's world position
offset by Scene Time — the wave sweeps laterally as the timeline advances.

## What this demonstrates

| Concept | Where it appears |
|---|---|
| GP3 as GN geometry domain | POINT = stroke point, CURVE = stroke |
| `SetPosition` on GP3 strokes | Offset Y per point via noise |
| Time-driven noise offset | Scene Time → CombineXYZ → VectorMath ADD |
| GN interface socket API (Blender 4.0+) | `tree.interface.new_socket(...)` |
| `frame.drawing.add_strokes(n)` API | Programmatic stroke creation in BP |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds GP3 object + GN modifier, saves `.blend` |
| `record.py` | OpenGL viewport render → PNG sequence → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS takes for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest |

## Run order

```bash
blender --background --python blueprint.py
blender gn-gp3-noise-stroke-wave.blend --python record.py
# then: ffmpeg -r 24 -i frames/frame_%04d.png -c:v libx264 -pix_fmt yuv420p viewport.mp4
```

## Key parameters

| Constant | Default | Effect |
|---|---|---|
| `NOISE_SCALE` | 3.5 | Spatial frequency — lower = broader wave |
| `NOISE_STRENGTH` | 0.12 | Amplitude in Blender metres |
| `NOISE_DETAIL` | 4.0 | Sub-octave detail count |
| `ANIM_FRAMES` | 60 | One full wave cycle at 24 fps |

## Tutorial route

`/tutorials/blender-tutorial-gn-gp3-noise-stroke-wave`

## Licence

CC0 — Holoflow Studio

# Camera Rig: Bezier Dolly Path + Rack-Focus Pull

**Blender 5.1 · CC0 1.0 · Holoflow Studio**

A production-ready cinematic camera rig built entirely in Python:
- Bezier arc dolly path (3-point, arc-length parameterised)
- Follow Path + Track To constraint stack
- Single-float `offset_factor` drives the dolly (SINE ease)
- `dof.focus_distance` keyframed for a rack focus from subject (4.5 m) to
  foreground crystal (2.0 m) at dolly end
- EEVEE Next render with ray-traced DOF, 85 mm / f 1.8

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full rig + scene builder — run once to create `camera_dolly_rig.blend` |
| `record.py` | Render `viewport.mp4` from the saved blend file |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

```bash
# Build the rig
blender --background --python blueprint.py

# Render preview video
blender camera_dolly_rig.blend --background --python record.py
```

## Key techniques

### Follow Path offset_factor
`offset_factor` (0.0–1.0) is the single control handle for dolly position along
the arc. Arc-length parameterisation (`use_path = True`) ensures constant speed
even on non-uniform curves. SINE EASE_IN_OUT on the F-Curve gives cinematic
deceleration into the end mark.

### Track To constraint order
Follow Path (position) must come **before** Track To (rotation) in the constraint
stack. Reverse them and Track To's output gets partially overwritten.

### Rack focus via focus_distance
`cam.data.dof.focus_distance` is a plain float — fully keyframeable. The
transition from 4.5 m (subject) to 2.0 m (foreground crystal) over frames 80–120
uses SINE EASE_IN_OUT to make the optical focus shift feel smooth, not mechanical.

## Related tutorials
- `/tutorials/blender-tutorial-animation-constraints-follow-path-track-to`
- `/tutorials/blender-tutorial-render-cycles-dof-motion-blur-bokeh`
- `/tutorials/blender-tutorial-animation-fcurve-modifiers-noise-cycles-stepped`

## Licence
CC0 1.0 Universal — public domain dedication. No attribution required.

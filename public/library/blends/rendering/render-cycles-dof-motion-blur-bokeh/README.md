# Cycles — Cinematic Camera Rig: Depth of Field + Motion Blur (Blender 5.1)

Technique: f/1.4 hexagonal bokeh via `cam.dof.aperture_blades = 6`, combined
with 180° shutter motion blur (`scene.render.motion_blur_shutter = 0.5`).
An 85 mm telephoto lens and a lateral dolly show both effects simultaneously.

## Quick Start

```python
# In Blender Scripting workspace
exec(open("blueprint.py").read())
# Then press F12 to render frame 1, or go to frame 60 and F12 for motion blur.
```

## Key Parameters

| Constant | Default | Effect |
|---|---|---|
| `APERTURE_FSTOP` | `1.4` | f/1.4 = wide open; f/8 = deep focus (all gems sharp) |
| `APERTURE_BLADES` | `6` | `0` = circle; `3/6/8` = tri/hex/oct bokeh polygon |
| `APERTURE_ROT` | `0.0` | Rotate the iris polygon (radians) |
| `MOTION_BLUR_SHUTTER` | `0.5` | 0.5 = cinema 180° rule; 1.0 = full-frame blur |
| `SAMPLES` | `128` | Raise to 512 for noise-free stills |
| `DOLLY_START_X` / `DOLLY_END_X` | `±0.80` | Dolly width in metres |

## Circle of Confusion

The blur radius at a defocused depth `d` is:

```
CoC = (f² / N) × |d − d_f| / (d × d_f)
```

where `f` = focal length (m), `N` = f-number, `d_f` = focus distance.
CoC grows with f² — an 85 mm lens at f/1.4 produces 4× the blur disc of a
50 mm lens at the same f-stop and focus distance.

## Blender API Summary

```python
cam.dof.use_dof              = True
cam.dof.focus_object         = bpy.data.objects["gem_focus"]
cam.dof.aperture_fstop       = 1.4
cam.dof.aperture_blades      = 6
scene.render.use_motion_blur       = True
scene.render.motion_blur_shutter   = 0.5
scene.cycles.motion_blur_position  = "CENTER"
```

## Outputs

- `dof_bokeh_scene.blend` — scene after running `blueprint.py` and saving
- `renders/dof_bokeh_####.png` — Cycles PNG sequence (write with Ctrl+F12)
- `../../videos/rendering/render-cycles-dof-motion-blur-bokeh/viewport.mp4` — from `record.py`
- `../../videos/rendering/render-cycles-dof-motion-blur-bokeh/screen.mp4` — OBS capture

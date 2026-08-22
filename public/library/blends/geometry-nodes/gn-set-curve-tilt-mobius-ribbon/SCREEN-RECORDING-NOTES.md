# Screen Recording Notes — Möbius Ribbon (GN Set Curve Tilt)

Target file: `public/library/videos/geometry-nodes/gn-set-curve-tilt-mobius-ribbon/screen.mp4`

## Software

OBS Studio (free, open-source) or Windows Game Bar (Win+G).

## OBS Settings

| Setting | Value |
|---|---|
| Source type | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (no mic) |
| Encoder | x264 / NVENC (quality preset: medium) |
| Output format | MP4 |

## What to Record

1. **Run blueprint.py** in Blender's Text Editor (or via `blender --background --python blueprint.py`). Capture the console output confirming the GLB was written.
2. Open `mobius_ribbon.blend`. Show the Geometry Nodes modifier panel — point out the Radius, Twist Turns, and Resolution sliders.
3. Open the GN node editor. Walk through the node graph left-to-right: Circle → Spline Parameter → Math (×π) → Math (×Twist) → Set Curve Tilt → Curve to Mesh.
4. In the 3D viewport: tumble the camera (middle-mouse drag) around the ribbon at least once so the viewer can see the single-sided twist. Use Numpad 4/6 to orbit.
5. Change **Twist Turns** from 1.0 to 2.0 in the modifier panel to show it become a closed tube. Then back to 1.0.
6. Change **Twist Turns** to 3.0 to show the three-twist variant.
7. Close Blender. End recording.

## Blender Viewport Setup Before Recording

- Viewport shading: **Material Preview** (Shift+Z)
- Overlays: turn OFF (the 'Overlays' button top-right of the 3D viewport)
- Gizmos: keep Axes gizmo ON (bottom-left corner helps viewers understand orientation)
- Background: keep Blender's default dark theme

## File Naming

Save as `screen.mp4` in the same folder as this file:

```
public/library/blends/geometry-nodes/gn-set-curve-tilt-mobius-ribbon/screen.mp4
```

The video pipeline will pick it up automatically.

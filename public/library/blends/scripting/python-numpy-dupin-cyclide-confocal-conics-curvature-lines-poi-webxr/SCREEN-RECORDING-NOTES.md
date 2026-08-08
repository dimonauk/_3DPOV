# Screen Recording Notes — Dupin Cyclide

## Software
- **OBS Studio** (recommended) or Windows Game Bar (`Win + G`)
- Blender 5.1 open, Scripting workspace active

## OBS Settings
| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (no audio track needed) |
| Output format | MP4 / H.264 |
| Output file | `public/library/videos/scripting/python-numpy-dupin-cyclide-confocal-conics-curvature-lines-poi-webxr/screen.mp4` |

## What to Record (approx. 4–6 minutes)

1. **Open** `blueprint.py` in the Blender Text Editor. Show the docstring
   and the parameter block (`A`, `C`, `B`, `D_RING`, `D_HORN`, `D_SPINDLE`).
2. **Run** the script (`Alt + P` or Run Script button). The cyclide
   appears in the 3D viewport — drag to orbit.
3. **Shape Keys panel** — Properties → Object Data → Shape Keys.
   Scrub the `Torus`, `Horn`, and `Spindle` key values from 0 → 1 in real
   time, narrating the deformation: ring → torus, ring → horn (singular
   point visible), ring → spindle (self-intersection).
4. **Viewport shading** — toggle between Material Preview and Solid to show
   the vertex-colour curvature-circle stripes.
5. **Overlay** — turn on *Wireframe* overlay at 30% opacity so the quad
   grid is visible through the surface.
6. **Close-up orbit** — orbit slowly around the horn cyclide at the
   singular point (the tip where the surface pinches).
7. **GLB location** — open a file browser panel showing the exported `.glb`
   in `public/library/glbs/scripting/…`.

## Tips
- Set viewport shading to **Material Preview** (`Z → Material Preview`)
  before recording so the emission colours are visible.
- Maximise the 3D viewport (`Ctrl + Space`) for the recording portion after
  showing the script.
- Use `Numpad 5` to toggle between perspective and orthographic for the
  final close-up.
- If the cyclide appears too large, type `S 0.5 Enter` in object mode to
  scale it down temporarily (the blueprint already applies SCALE=0.10 so
  the object is ~1 m across; adjust camera distance instead).

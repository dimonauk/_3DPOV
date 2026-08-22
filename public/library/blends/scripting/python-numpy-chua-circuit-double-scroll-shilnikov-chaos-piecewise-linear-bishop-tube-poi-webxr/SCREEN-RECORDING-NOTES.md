# Screen Recording Notes — Chua Double-Scroll Attractor

**Target file:** `public/library/videos/scripting/python-numpy-chua-circuit-double-scroll-shilnikov-chaos-piecewise-linear-bishop-tube-poi-webxr/screen.mp4`

## Software

OBS Studio (any recent version) or Windows Game Bar (`Win + G`).

## Setup

1. Open Blender 5.1 with a clean General workspace.
2. Open `blueprint.py` in the Scripting workspace.
3. Tile the screen: Script editor on the left (~40 %), 3D Viewport on the right (~60 %).
4. In the 3D Viewport: set shading to **Solid → Colour: Vertex**.
5. Set viewport overlay to show **Statistics** (top-left toggle).

## OBS Scene

- **Source**: Window Capture → select `Blender`
- **Output resolution**: 1920 × 1080
- **Frame rate**: 30 fps
- **Audio**: OFF (no narration required)
- **Output**: MP4 / H.264, CRF 22

## Recording flow (~4 minutes total)

| Time | Action |
|------|--------|
| 0:00–0:20 | Show `blueprint.py` header — scroll slowly through the docstring so the equations are readable. |
| 0:20–0:45 | Highlight the `_f()` Chua-diode function (lines ~62–64). Pause on the piecewise formula. |
| 0:45–1:10 | Highlight the `_integrate()` RK4 loop (lines ~68–84). Trace one k1/k2/k3/k4 cycle with the mouse. |
| 1:10–1:30 | Press **Run Script**. Watch the terminal output appear. |
| 1:30–2:30 | Switch to 3D Viewport. Orbit the double-scroll slowly: show both wings from the side (recognisable butterfly shape), then rotate to show the 3D depth of the tube. |
| 2:30–3:00 | Open Shape Key panel (Properties → Object Data → Shape Keys). Set SK_Dense to 1.0. Show how the scroll arms widen. |
| 3:00–3:30 | Set SK_Tight to 1.0 (SK_Dense back to 0). Show the tighter loop structure. |
| 3:30–4:00 | Set SK_Wide to 1.0 (SK_Tight back to 0). Final orbit — show Cobalt-to-Amber colour gradient around the scroll. |

## After recording

Trim to 4:00, export as `screen.mp4` (H.264, 1920×1080, 30 fps) and place in the video directory above.

Then run `record.py` inside Blender to generate `viewport.mp4` automatically.

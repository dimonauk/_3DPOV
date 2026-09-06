# Screen-Recording Notes — Sprott M Attractor

## Setup

- **Software**: OBS Studio (Windows/macOS/Linux) or Xbox Game Bar (Win10+)
- **Source**: Window Capture → Blender
- **Resolution**: 1920×1080
- **Frame rate**: 30 fps
- **Audio**: Disabled (no microphone input)
- **Output format**: MP4 / H.264, CRF 18–22
- **Output file**: `public/library/videos/scripting/python-numpy-sprott-m-attractor-1994-six-term-xsq-dual-saddle-foci-shilnikov-constant-divergence-rk4-bishop-tube-poi-webxr/screen.mp4`

## Blender workspace before recording

1. Open a fresh Blender 5.1 file.
2. Switch to **Scripting** workspace.
3. Open `blueprint.py` in the Text Editor panel.
4. Set viewport to **Material Preview** (Z → Material Preview).
5. Enable **Overlays → Statistics** so the vertex count is visible.
6. Dock the **Properties** panel to show the Shape Keys sub-panel.

## What to show

| Segment | Duration | Action |
|---------|----------|--------|
| Open blueprint.py | 0:00–0:30 | Scroll through the file, pause on ODE section (`_f`), integration loop, and `bishop_frame` |
| Run script | 0:30–0:45 | Press **Run Script** (▶) — output prints in the Info header |
| Rotate orbit | 0:45–1:30 | Middle-click drag to orbit around the tube mesh; zoom in on tight spirals near P₂ |
| Shape key demo | 1:30–2:30 | In Properties → Object Data → Shape Keys, drag **SK_WeakA** value slider 0→1, then **SK_HighC** |
| Colour attribute | 2:30–3:00 | Show Material Preview with `SprottM_Speed` driving Emission colour |

## OBS scene tips

- Use **Scene → Filters → Crop/Pad** to remove OS chrome if the Blender window is not fullscreen.
- Add a **Text** source overlay: "Sprott M  ẋ=−z  ẏ=−x²−y  ż=1.7+1.7x+0.6y" in the lower-left corner.
- **Do not** capture the desktop; capture the Blender window only.

## Trim points (post-production)

- Cut the first 3 s (Blender startup / script loading).
- Trim trailing time after shape key 3 returns to Basis.
- Target: 2:30–3:00 total runtime.

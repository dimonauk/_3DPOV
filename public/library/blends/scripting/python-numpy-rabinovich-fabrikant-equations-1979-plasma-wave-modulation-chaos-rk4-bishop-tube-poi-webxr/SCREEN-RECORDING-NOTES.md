# Screen-Recording Notes — Rabinovich–Fabrikant Equations

Capture a screen recording of the Blender viewport while `record.py` renders,
or record yourself working through `blueprint.py` interactively.

## Software

| Tool | Setting |
|------|---------|
| OBS Studio ≥ 30 / Xbox Game Bar | Window capture → **Blender** |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (no mic / system audio) |
| Codec | H.264 CRF 18 (OBS: quality "High") |

## OBS scene setup

1. **Sources → Add → Window Capture** → select the running Blender window.  
2. Resize canvas to 1920 × 1080 if not already.  
3. Set **Output → Recording path** to  
   `public/library/videos/scripting/python-numpy-rabinovich-fabrikant-equations-1979-plasma-wave-modulation-chaos-rk4-bishop-tube-poi-webxr/screen.mp4`

## What to capture

| Segment | Blender action |
|---------|---------------|
| 0–30 s | Open `blueprint.py` in the Scripting workspace; explain the RF equations in the header comment |
| 30–90 s | Run the script; watch the poi mesh appear in 3D Viewport |
| 90–120 s | Switch to Material Preview; rotate around to show the cobalt-amber gradient |
| 120–160 s | Open Shape Key panel; manually scrub through SK_WeakDiss / SK_StrongDiss / SK_HighG |
| 160–210 s | Open Shading workspace; show the attribute node driving emission |
| 210–240 s | Run `record.py`; watch animation render begin |

## Blender viewport settings for recording

- **Viewport shading**: Material Preview (sphere icon) with HDRI lighting
- **Overlays**: off (clean mesh only)
- **Gizmo**: off
- **Header**: visible (shows Blender version)
- **Theme**: Dark (default)

## File destination

`public/library/videos/scripting/python-numpy-rabinovich-fabrikant-equations-1979-plasma-wave-modulation-chaos-rk4-bishop-tube-poi-webxr/screen.mp4`

Do **not** commit `.mp4` files — they are listed in `.gitignore`.  
Upload separately to the media CDN and reference by URL in the tutorial page.

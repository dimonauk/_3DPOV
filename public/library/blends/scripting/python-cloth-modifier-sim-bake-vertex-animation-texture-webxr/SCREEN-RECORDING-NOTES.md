# Screen Recording Notes
## `python-cloth-modifier-sim-bake-vertex-animation-texture-webxr`

Target file: `public/library/videos/scripting/python-cloth-modifier-sim-bake-vertex-animation-texture-webxr/screen.mp4`

### OBS / Windows Game Bar settings
| Setting | Value |
|---------|-------|
| Source | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

### What to record

1. Open `cloth_vat.blend` from the library folder.
2. In the **Properties → Physics** panel, show the Cloth modifier settings briefly — hover over `vertex_group_mass = "Pin"` so the tooltip is visible.
3. Switch to the **3D Viewport** in **Material Preview** shading. Press **Space** to play the simulation from frame 1.
4. Let the flag billow for the full 48 frames.
5. Open the **UV Editor** (split view) and show the `VAT_ID` UV layer — each column of vertices maps to a unique U coordinate.
6. Open the **Image Editor**, switch to `vat_position` image, and scrub through frames to show the per-row colour change (positions shifting as the cloth deforms).
7. Open the **Python Console** or **Text Editor** and run `record.py` to produce `viewport.mp4`, recording that execution.
8. Stop OBS / Game Bar recording.

### Duration target
3 – 5 minutes total. Trim dead air in the Video Sequence Editor before exporting.

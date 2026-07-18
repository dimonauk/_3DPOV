# Screen Recording Notes — bmesh.ops.inset_faces Panel Lines

Target output: `public/library/videos/scripting/python-bmesh-ops-inset-faces-panel-lines-recess-hard-surface-webxr/screen.mp4`

## OBS / Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (mute mic + desktop) |
| Output format | MP4 (H.264, CRF 18) |

## Before You Record

1. Open `hf_inset_panel.blend` in Blender 5.1.
2. Set viewport shading to **Solid → Flat** (so the faceted panel-line grooves read clearly without lighting noise).
3. Rotate to an isometric-ish angle that shows the top surface and one side edge simultaneously — the three inset zones (top row, middle rows, bottom row) must all be visible.
4. In the Outliner, expand `HF_InsetPanel` → click `hf_inset_panel` → press **numpad /.** to isolate it.

## Shot List (approx. 60–90 seconds)

| Time | Action |
|------|--------|
| 0:00 | Wide three-quarter view of the whole console panel |
| 0:10 | Zoom into **Zone A** (top row): rotate to see the collective groove ring. Hover mouse near the groove edge so the viewer sees the single continuous inset border. |
| 0:25 | Pan down to **Zone B** (middle rows): individual button recesses. Use Tab → Edit Mode → select one button face to show the per-face inset geometry. Return to Object Mode. |
| 0:45 | Pan down to **Zone C** (bottom row): vent louver slots. Orbit to a grazing angle so the narrow groove lines catch the light. |
| 1:00 | Return to wide view. Optionally run `blueprint.py` from the Scripting workspace to show the script producing the mesh live. |

## Post-Processing

No colour grading needed.
Trim to exactly 60–90 seconds.
Export with `ffmpeg -i screen_raw.mp4 -crf 18 -preset slow screen.mp4`.

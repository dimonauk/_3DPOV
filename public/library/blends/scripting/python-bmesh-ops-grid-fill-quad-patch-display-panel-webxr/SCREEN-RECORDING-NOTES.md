# Screen Recording Notes — bmesh.ops.grid_fill Display Panel

Target output: `public/library/videos/scripting/python-bmesh-ops-grid-fill-quad-patch-display-panel-webxr/screen.mp4`

## OBS / Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (mute mic + desktop) |
| Output format | MP4 (H.264, CRF 18) |

## Before You Record

1. Open `hf_grid_fill_display.blend` in Blender 5.1.
2. Set viewport shading to **Solid → Material Preview** (so the teal screen
   emission and dark bezel material are both visible simultaneously).
3. Rotate to a front three-quarter view: slightly above, slightly to the right,
   so both the bezel ring and the screen quad patch are legible.
4. In the Outliner, isolate `HF_GridFillDisplay` with **Numpad /**.

## Shot List (approx. 60–90 seconds)

| Time | Action |
|------|--------|
| 0:00 | Wide three-quarter view — show the full panel: metallic bezel ring around the teal screen |
| 0:12 | Tab into **Edit Mode**. Switch to **Edge Select** (2). Show the hole boundary loop: hover a boundary edge and press **L** to select the loop. |
| 0:25 | With the loop selected, open **Mesh → Faces → Grid Fill** from the face menu to show where the operator lives in the UI. Cancel — don't actually re-apply. |
| 0:35 | Tab back to **Object Mode**. Open **Scripting** workspace. Show `blueprint.py`. Highlight the `Counter` block collecting `hole_edges` and the `bmesh.ops.grid_fill(...)` call. |
| 0:55 | Scroll to the `assert len(screen_patch) == SCREEN_COLS * SCREEN_ROWS` line and explain the silent-fail guard. |
| 1:10 | Return to **3D Viewport**. Orbit slowly around the back of the panel to show the chassis depth from the extrusion. |
| 1:25 | Wide view, fade out. |

## Post-Processing

No colour grading needed.
Trim to 60–90 seconds.
`ffmpeg -i screen_raw.mp4 -crf 18 -preset slow screen.mp4`

# Screen Recording Notes — hf_poi_performance

**Target file**: `public/library/videos/scripting/python-bpy-action-nla-fcurve-keyframe-poi-performance-webxr/screen.mp4`

## Software

OBS Studio 30+ or Windows Game Bar (`Win + G`). OBS preferred for resolution control.

## OBS Setup

1. **Scene**: create a scene named `blender-record`.
2. **Source**: Window Capture → select `Blender 5.1`.
3. **Resolution**: Base 1920×1080, Output 1920×1080.
4. **Frame Rate**: 30 fps (OBS setting), Blender viewport runs at 24 fps — mild pulldown is fine.
5. **Audio**: Mute all audio tracks (no microphone needed for this pass).
6. **Output → Recording**: MP4, CRF 18 (high quality).

## What to record

The goal is a 60–90 second clip showing the full workflow from blank script to animated preview.

### Recording sequence

1. **Blender start state** (5 s) — default cube scene, nothing special.
2. **Open Scripting workspace** — click the "Scripting" tab at the top.
3. **New text block** — press `+ New` in the Text Editor header.
4. **Paste blueprint.py** — copy from `blueprint.py`, paste into the text editor.
5. **Run script** — press `Alt + P` or click ▶ Run Script.
6. **Switch to Layout workspace** — click "Layout" tab.
7. **Show the NLA Editor** — split the timeline area, switch one panel to `NLA Editor`.
   - Observe three NLA tracks (`hf_poi_butterfly`, `hf_poi_helicopter`, `hf_poi_weave`).
8. **Press Space to play** — watch the poi ball trace each pattern for 80 frames.
   - Pause at frame ~1, 81, 161 to show the pattern boundaries clearly.
9. **NLA strip detail** (10 s) — hover over each strip to show the tooltip (name, frame range).
10. **Close-up: FCurve editor** — split a panel, switch to `Graph Editor`.
    - Select the poi ball. Observe the three Location FCurves (X, Y, Z).
    - Show the butterfly FCurve's Bézier handles in the X channel.
11. **End** — return to viewport, let animation play from frame 1 to 240.

## Trim and export

- Trim leader/trailer in a video editor.
- Encode final export: H.264, 1920×1080, 30 fps, CRF 18.
- Drop the file at `public/library/videos/scripting/python-bpy-action-nla-fcurve-keyframe-poi-performance-webxr/screen.mp4`.

## Notes

- The poi ball emissive material only glows in **Material Preview** (LookDev) or **Rendered** mode — switch to Material Preview before recording the viewport playback.
- NLA Editor: enable **N-panel → Strips** to see `blend_type = REPLACE` confirmed in the sidebar.

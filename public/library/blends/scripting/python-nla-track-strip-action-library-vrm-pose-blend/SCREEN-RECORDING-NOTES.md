# Screen Recording Notes — NLA Pose Library (Blender 5.1)

OBS/Game Bar capture guide for `screen.mp4`.

## Software

- OBS Studio 30+ or Windows Game Bar (Win+G)
- Blender 5.1 (full install, not portable)
- Resolution: **1920 × 1080**, 30 fps, audio OFF

## Window source

Set OBS source to **Window Capture → Blender**.  
Do not capture the whole monitor — Blender's title bar confirms the source.

## Workspace layout before recording

1. Open `blueprint.py` in the Scripting workspace and run it (Alt+P).
2. Switch to the **Animation** workspace (top header tab).
3. In the NLA Editor (bottom-left panel), ensure all three tracks are visible:
   - `pose_idle` at the bottom
   - `pose_raise` in the middle
   - `pose_reach` at the top
4. In the Dope Sheet (top-left panel), set to **NLA** mode.
5. Open the N-panel (N key in the NLA editor) → **Strip** tab so influence is visible.

## Recording script (60–90 seconds)

| Time | Action |
|------|--------|
| 0–5 s | Show the 3D Viewport with the arm at idle pose (frame 1). |
| 5–15 s | Scrub timeline to frame 45 — show `pose_raise` strip's influence at 1.0; arm lifts. |
| 15–25 s | Scrub to frame 75 — show `pose_reach` strip's influence at 1.0; arm fully extended. |
| 25–40 s | Play animation (Spacebar) from frame 1 to 90 — show smooth blending. |
| 40–55 s | Click the `pose_raise` track in the NLA editor; show Strip panel with blend_type=COMBINE and influence keyframes. |
| 55–70 s | In the N-panel, change `pose_raise` influence from 1.0 → 0.5 and scrub — show partial blending. |
| 70–85 s | Switch to the Scripting workspace; show `blueprint.py` open; point out `COMBINE` blend_type and the HOLD extrapolation. |
| 85–90 s | Return to 3D Viewport; play once more; end recording. |

## OBS settings

```
Output mode: Simple
Recording format: MP4
Encoder: x264 (or hardware if available)
Rate control: CRF 18
Preset: veryfast
Audio: disabled (uncheck all audio sources)
```

## File destination

Save as `screen.mp4` and place it at:

```
public/library/videos/scripting/
  python-nla-track-strip-action-library-vrm-pose-blend/screen.mp4
```

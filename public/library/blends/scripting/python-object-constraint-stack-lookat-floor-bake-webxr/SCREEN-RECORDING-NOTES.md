# Screen Recording Notes

**Target file:** `public/library/videos/scripting/python-object-constraint-stack-lookat-floor-bake-webxr/screen.mp4`

## OBS / Game Bar Settings

| Setting | Value |
|---------|-------|
| Capture source | Window — Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (mute all inputs) |
| Output format | MP4 / H.264 CRF 23 |

## What to Record

1. Open Blender 5.1. New General file.
2. Open the Scripting workspace (top header tabs).
3. Paste and run `blueprint.py` — watch the Script Editor output panel for `[holoflow]` lines.
4. **Pause here.** Switch to the 3-D Viewport (Layout workspace).
5. Press Space or the play button. Scrub to frame 1. Hit Play.
   The head sphere should orbit its face toward the circling target empty, staying on the ground.
6. Switch back to Scripting workspace, show that `obj_h.constraints` is now empty — constraints were removed after bake.
7. Show the baked action in the Dope Sheet (editor type: Dope Sheet, show all channels, zoom to frame range 1-60).
8. Return to Layout workspace, play the animation once more at full speed.
9. Stop recording.

## Tips

- Press `Numpad 5` to switch to orthographic for the constraint-stack demo shot; press `Numpad 1` for front view.
- `Numpad 0` enters camera view for the final playback shot.
- Press `N` in the 3-D Viewport to open the Item panel and show the Constraint Properties tab with the empty constraint list.
- Zoom the Dope Sheet to show the dense quaternion + location channels from the bake — this visually proves the bake worked.

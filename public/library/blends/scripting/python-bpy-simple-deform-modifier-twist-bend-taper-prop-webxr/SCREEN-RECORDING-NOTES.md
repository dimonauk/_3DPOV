# Screen Recording Notes — SimpleDeformModifier: TWIST / BEND / TAPER / STRETCH

**Target file**: `public/library/videos/scripting/python-bpy-simple-deform-modifier-twist-bend-taper-prop-webxr/screen.mp4`

## Setup

- Resolution: 1920 × 1080
- Frame rate: 30 fps
- Audio: off (no microphone capture needed)
- Window source: Blender 5.1 application window (full-screen preferred)
- OBS scene: single Display Capture or Window Capture source

## Recording sequence

1. Open Blender 5.1. New General file. Switch to the **Scripting** workspace.
2. Paste `blueprint.py` into the text editor. Show the `PARAMETERS` section at the top — pause 3 seconds.
3. **Run the script** (`Alt+P` or the ▶ button). Let the three props appear in the viewport (camera to `Numpad 5` → `Numpad 0` to see all three).
4. Switch to the **Layout** workspace. Orbit around the three props slowly for 5 seconds. Use `Middle Mouse` drag.
5. Click the **twisted column**. Open the **Properties** panel → **Modifier** tab. Show the stacked Taper + Twist modifiers. Point out the `Angle` slider (read in degrees but stored as radians in the API).
6. Click the **bent horn**. Show the Taper + Bend modifiers. Expand the **Origin** field — point out the Empty object reference.
7. Click the **stretched spike**. Show the Taper + Stretch modifiers. Note the `Limits` range (0.60 → 1.0 = upper 40%).
8. Open the **Timeline** (drag bottom edge). Scrub to frame 1. Open `record.py` in the text editor. Run it — show the animation render progress in the Info bar.
9. After render completes, split the viewport: left = 3D Viewport, right = Video Sequence Editor. Open the rendered viewport.mp4 in the VSE and play it back.
10. Close OBS recording.

## OBS settings reminder

- Bitrate: 8 000 kbps CBR
- Encoder: NVENC H.264 or x264 (software fallback)
- Output container: MP4
- Keyframe interval: 2 s

## Game Bar (Windows 11 alternative)

`Win + G` → Capture → Start Recording (`Win + Alt + R`). Trim to the Blender window using the Video Editor post-recording. Export at 1080p / 30 fps.

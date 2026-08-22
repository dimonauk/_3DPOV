# Screen Recording Notes — Cloth Flag Banner Simulation

Target file: `public/library/videos/physics/physics-cloth-simulation-flag-banner/screen.mp4`

## Software

- OBS Studio (free, open-source) or Windows Game Bar (Win+G)
- Blender 5.1 — window maximised at 1920×1080

## OBS Setup

1. **Add Scene** → name it "Blender Cloth"
2. **Add Source** → Window Capture → select "Blender" from the list
3. Output resolution: 1920×1080, Frame rate: 30 fps
4. Recording format: MP4, encoder: x264, CRF 23
5. Audio: **OFF** (no microphone, no system audio)

## What to Record

### Segment 1 — Blueprint overview (30 s)
- Show `blueprint.py` open in Blender's Script Editor
- Scroll slowly from top to bottom, pausing on the ClothSettings block and the Wind effector block

### Segment 2 — Scene structure (30 s)
- Switch to 3D viewport (Material Preview)
- Tumble around the flag + pole setup, show pin group highlighted (Weight Paint mode → orange column on left)

### Segment 3 — Bake + playback (60 s)
- Physics Properties → Cloth → Cache → click **Bake**
- Show progress bar; when done, press **Space** to play
- Let the full 60-frame simulation play at least twice in the timeline

### Segment 4 — Snapshot export (20 s)
- Set frame to 30 in the timeline (mid-billow)
- Show Properties → Modifier → Apply → Export GLB dialog

## Trim & Export

- Trim to 2:20 total
- Export: H.264, MP4, 1920×1080, 30 fps, no audio
- Save as `screen.mp4` in `public/library/videos/physics/physics-cloth-simulation-flag-banner/`

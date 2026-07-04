# Screen Recording Notes — GN Scatter Node Tree via Python

**Target file:** `public/library/videos/scripting/python-geometry-nodetree-build-scatter-modifier-api/screen.mp4`

## OBS / Windows Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 (H.264) |
| Bitrate | 8 000 kbps |

## What to capture

1. Open a fresh Blender 5.1 scene (default cube is fine — script clears it).
2. Open the **Scripting** workspace. Paste `blueprint.py` into the text editor.
3. Start OBS recording.
4. Press **Run Script** (▶). Pan the 3D viewport to watch the scatter appear.
5. Switch to the **Geometry Node Editor** and click the `GN Scatter` modifier on the ground plane — show the node tree that the script built.
6. Switch to the **Spreadsheet** editor, select the ground, and show the `Points` domain output from the Distribute node.
7. Open the modifier properties (wrench icon). Show the `Density` and `Seed` fields and scrub `Seed` — billboards re-scatter live.
8. Switch back to 3D viewport. Orbit around to show the billboard distribution from multiple angles.
9. Stop OBS. Trim to ≤60 seconds.

## Narration cues (silent recording — add captions in post if desired)

- Step 3–4: caption "blueprint.py → Run Script"
- Step 5: caption "The script built this node tree without touching the editor"
- Step 6: caption "Spreadsheet: 258 scatter points on 8 m × 8 m plane"
- Step 7: caption "Seed = live parameter — modifier re-evaluates on change"

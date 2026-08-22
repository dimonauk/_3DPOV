# Screen Recording Notes — Modal Progress Bar Tutorial

## Target file
`public/library/videos/scripting/python-modal-progress-bar-cancel-long-operation/screen.mp4`

## OBS settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 (H.264) |
| Bitrate | 8 000 kbps |

## What to capture (shots in order)

1. **Open scene** — a fresh default scene with at least 10 mesh objects visible.
2. **Paste blueprint.py** — show the Text Editor, paste the code, click Run Script.
3. **N-panel → Holoflow tab** — press N in the 3-D Viewport, click the Holoflow tab.
4. **Click the operator button** — "Holoflow Batch with Progress Bar".
5. **Header progress bar** — zoom in on the Blender header so the progress bar is clearly visible. Let it run to about 50 %.
6. **Cancel with ESC** — press ESC and show the Info header "Cancelled after N / M" message.
7. **Re-run to completion** — click the button again, let it run to 100 %. Show the "Done — N meshes processed" Info bar message.
8. **Verify result** — select one mesh, open Properties > Modifiers panel (no HL_Triangulate modifier remains: baked). Show the object is now fully triangulated in Edit Mode.

## Timing target

5–8 minutes total. Keep the clip uncut so viewers see the real speed of the progress bar at different chunk sizes.

## Post-processing

Trim to: paste script → run → progress bar fills → cancel → re-run → done.
No colour grading needed; Blender's default UI reads clearly.
Export final `screen.mp4` to the target path above.

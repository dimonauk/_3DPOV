# Screen Recording Notes — bpy + bmesh Dodecahedron

**Target file:** `public/library/videos/scripting/python-bpy-bmesh-dodecahedron/screen.mp4`

## OBS / Windows Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic or desktop audio) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

## What to record

1. **Open Blender → Scripting workspace.**
2. Click **New** or **Open** and load `blueprint.py`.
3. Scroll through the script for ~15 seconds so the viewer can read the vertex
   table and the `build_dodecahedron_mesh()` function.
4. Press **Run Script**.  The console at the bottom should print the three
   `[holoflow]` lines confirming `.blend` and `.glb` saved.
5. Switch to the **Layout workspace**.  The dodecahedron is now visible.
6. Press **Numpad 5** (orthographic) then **Numpad 1** (front view) to inspect
   the flat-shaded pentagonal faces.
7. Press **Numpad 0** (camera view) and **Space** to play the animation —
   the gold dodecahedron spins 360° over 5 seconds.
8. Stop recording.

## Total target duration

60–90 seconds.

## Post-production

Trim to start at the moment the Scripting workspace is visible.
No colour grade needed — the dark EEVEE background makes the facets pop.
Add a lower-third text card: `bpy + bmesh | Blender 5.1 | holoflow.co.uk`.

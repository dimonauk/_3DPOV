# Screen Recording Notes — bmesh UV Map Tutorial

**Target file:** `public/library/videos/scripting/python-bmesh-uv-map-read-write-atlas-pack/screen.mp4`

## OBS / Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no narration for library recordings) |
| Output format | MP4 / H.264 |

## What to record (approx. 90 seconds)

1. **Open Blender 5.1** fresh, default scene.
2. **Text Editor** — open `blueprint.py`. Show the full file, scroll slowly through `project_face_planar` (the local frame math) and `pack_islands`.
3. **Run the script** (Alt+P). Watch the console output: "Projected 80 faces", "Atlas packed."
4. **UV Editor** — split the viewport. Show the before state (all UVs at origin, stacked).
   - Then open `bmesh_uv_atlas.blend` (already saved by the script).
   - Show the UV Editor after packing: 80 tidy, distinct triangular islands filling the 0-1 square.
5. **Material Preview** — assign a UV Grid image to the material. Switch viewport to Material Preview mode. Orbit the icosphere — every face should show an aligned, unstretched grid patch.
6. **Console verification** — open the Python console, run `print_uv_sample(bpy.data.objects["faceted_uv_sphere"])` and show the output.

## Cut points

- Cut between Text Editor and UV Editor views.
- Keep each section under 25 seconds.
- Do not record the render step (record.py) — that is covered by `viewport.mp4`.

## Tips

- Use Blender's **Timeline** scrubber to jump frame-by-frame when demonstrating orbit animation in record.py separately.
- If OBS shows a black screen on the Blender viewport, switch OBS source to **Display Capture** and crop to the Blender window.

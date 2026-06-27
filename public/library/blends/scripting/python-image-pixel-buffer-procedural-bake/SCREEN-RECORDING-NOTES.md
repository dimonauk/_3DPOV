# Screen Recording Notes — Python Image Pixel Buffer

**Output target:** `public/library/videos/scripting/python-image-pixel-buffer-procedural-bake/screen.mp4`

## OBS / Windows Game Bar Setup

- **Window source:** Blender (fullscreen or maximised)
- **Resolution:** 1920 × 1080
- **Frame rate:** 30 fps
- **Audio:** off (no microphone or desktop audio required)
- **Format:** MP4, H.264 encoder, CRF 23

## What to capture

### Part 1 — Script execution (≈ 60 s)
1. Open Blender 5.1 with a blank General template.
2. Switch the top-right area to **Scripting** workspace.
3. Click **New** in the text editor to create a blank text block.
4. Paste the contents of `blueprint.py`.
5. Hit **Run Script** (Alt + P or the ▶ button).
6. Watch the Info header print lines — show `[HS] blueprint.py complete`.
7. Switch to the **3D Viewport** and press Numpad 0 (camera view).

### Part 2 — Image Viewer (≈ 30 s)
1. Split a second area and switch it to **UV Editor**.
2. In the UV Editor header, select `hs_voronoi_bake` from the image dropdown.
3. Zoom in to show the Voronoi cell pattern — bright edges, dark interiors.
4. Move the cursor to the bottom-left corner of the image to demonstrate the
   origin convention (the bottom-left pixel is index 0 in the flat buffer).

### Part 3 — Material preview (≈ 30 s)
1. Select the UV sphere in the 3D Viewport.
2. Switch viewport shading to **Material Preview** (Z → Material Preview or
   click the sphere icon in the top-right of the viewport).
3. Slowly rotate the viewport to show the Voronoi pattern mapped around the sphere.
4. In the Shader Editor (switch one area to it), highlight the `foreach_set`
   comment in the material's node description — or open the Python console and
   type `bpy.data.images["hs_voronoi_bake"].pixels[0:8]` to show raw floats.

### Part 4 — foreach_set speed demo (≈ 20 s, optional)
1. In the Python Console, time a naive loop vs foreach_set:
   ```
   import time, array, bpy
   img = bpy.data.images["hs_voronoi_bake"]
   buf = array.array('f', img.pixels)
   t0=time.perf_counter(); img.pixels.foreach_set(buf); print(time.perf_counter()-t0)
   ```
2. Show the result (< 0.01 s) and compare to a slow manual loop timing.

## File name
Save recording as `screen.mp4` and place at:
`public/library/videos/scripting/python-image-pixel-buffer-procedural-bake/screen.mp4`

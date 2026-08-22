# Screen Recording Notes — bmesh.ops.extrude_discrete_faces

**Target file:** `public/library/videos/scripting/python-bmesh-ops-extrude-discrete-faces-per-face-spike-urchin-crystal-webxr/screen.mp4`

## OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Source type | Window Capture |
| Window | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

## What to record

1. **Open Blender** — default startup file (cube/camera/light).
2. Switch to the **Scripting** workspace. Open `blueprint.py` in the text editor.
3. Show the **empty scene** in the 3D Viewport (numpad 5 for ortho, numpad 1 for front).
4. Run the script (`Alt+P` or click the ▶ button).
5. After the script completes, switch back to the **3D Viewport** (numpad 0 for cam view, or orbit freely).
6. **Tumble slowly** around the spike urchin for 15–20 seconds:
   - Middle-mouse drag to orbit
   - Zoom in to show individual spike geometry (the pyramidal tips, the side-wall quads)
   - Zoom out to see the full spherical silhouette
7. Optional: press **N** to open the side panel, click the **Item** tab, show the vertex/face count in the Mesh Statistics overlay.
8. Stop recording.

## Key moments to capture

- The icosphere before extrusion (if you have a breakpoint / step version of the script)
- The spike geometry materialising instantly when the script finishes
- A close-up orbit showing the sharp facet boundaries between adjacent spikes
- A wide shot showing the overall urchin silhouette

## Post-processing (optional)

Trim to ≤ 60 seconds. No colour grade needed — the deep-violet emission material reads clearly on a dark Blender background.

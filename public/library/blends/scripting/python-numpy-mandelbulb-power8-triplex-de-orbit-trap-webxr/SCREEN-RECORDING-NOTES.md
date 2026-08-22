# Screen Recording Notes — Mandelbulb Power-8

**File**: `public/library/videos/scripting/python-numpy-mandelbulb-power8-triplex-de-orbit-trap-webxr/screen.mp4`

## OBS / Windows Game Bar setup

| Setting | Value |
|---|---|
| Source | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 (H.264) |
| Bitrate | 8000 kbps |

## What to record (in order)

1. **Open Blender 5.1.** New General scene. Show default viewport briefly.
2. **Scripting workspace.** Click the Scripting tab. Open `blueprint.py`.
3. **Parameter walkthrough** — scroll to the parameters block. Read aloud:
   - `POWER = 8` — why 8?  
   - `GRID_N = 72` — sample count per axis  
   - `ISO_DE = 0.012` — isosurface threshold
4. **Run the script.** Click ▶ Run Script. Show terminal output:
   `[Mandelbulb] DE+traps on 72³=373,248 pts …`  
   `[Mandelbulb] Mesh: … verts, … faces`
5. **Viewport reveal.** Switch to 3D viewport. Numpad 5 (ortho off → perspective). Numpad 0 (camera). The Mandelbulb mesh fills the view.
6. **Orbit the viewport.** Middle-mouse-drag slowly around the bulb. Pause on:
   - the main equatorial "crown" of smaller bulbs
   - the deep spike pointing toward −Z
   - a close-in view showing the vertex-colour gradient (R/G/B from orbit traps)
7. **Material preview.** Switch from Solid to Material Preview shading (Z key → Material Preview). The orbit-trap vertex colours should now be visible as iridescent orange-green-blue patches.
8. **Shader editor.** Open Shader Editor, show the `mandelbulb_trap` material: Vertex Color → Emission → Output.
9. **Close-up rotation** — orbit ~180° over 15–20 seconds to show the self-similar secondary bulbs.
10. **File → Export → glTF 2.0** — show the export dialogue with Draco compression enabled. Cancel (GLB already exported by script).

## Tips

- The script takes ~60–90 s to run at GRID_N=72. Keep recording during this compute time to show the terminal output scrolling.
- Set Blender UI scale to 1.25 (Preferences → Interface → Display → Resolution Scale) so text is readable in a 1080p recording.
- If the mesh looks black in Solid mode, press `Z` → Material Preview to see vertex colours.
- For the thumbnail frame: orbit to a 3/4 view showing the crown of secondary bulbs with the iridescent colouring visible.

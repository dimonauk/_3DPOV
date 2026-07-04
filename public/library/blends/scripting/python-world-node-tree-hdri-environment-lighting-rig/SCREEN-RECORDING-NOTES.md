# Screen Recording Notes
## Python World Node Tree — HDRI + Nishita Sky Lighting Rig

**Target file:** `public/library/videos/scripting/python-world-node-tree-hdri-environment-lighting-rig/screen.mp4`

---

### OBS / Game Bar Setup

| Setting         | Value                        |
|-----------------|------------------------------|
| Source          | Window Capture → Blender 5.1 |
| Resolution      | 1920 × 1080                  |
| Frame rate      | 30 fps                       |
| Audio           | Off (desktop audio muted)    |
| Output format   | MP4 / H.264                  |

---

### What to Capture (~90 seconds)

1. **Open a fresh Blender 5.1 session** — default cube scene, Properties panel visible.

2. **Open the Text Editor** (Shift+F11 or from the Editor type menu).  
   Load `blueprint.py`.  Zoom in so the docstring at the top is legible.  
   Pause 3 s on the section headers (`TECHNIQUE`, `EXPORT BRIDGE`).

3. **Point out the constants block** — highlight `SUN_AZIMUTH`, `SUN_ELEVATION`, `HDRI_PATH`.  
   Explain in voice-over: "Leave `HDRI_PATH` empty to use Nishita sky mode."

4. **Press Run Script.**  
   Switch to the **Shader Editor**, set the Type dropdown to **World**.  
   The node graph should appear: TexSky → Background → World Output.  
   Pan and zoom slowly to show each node.

5. **Show the sun_direction vector** — in the TexSky node, hover over the
   `Sun Direction` field to show the tooltip.  
   Explain: "+Z up, +Y north, +X east."

6. **Switch to the Properties panel → World (globe icon).**  
   Show the `Mist` settings populated: Start = 4 m, Depth = 14 m, Quadratic.

7. **Open a terminal / file browser** and show `world_rig_export.json` — the sidecar file.  
   Read out the key fields: `mode: sky`, `sun_elevation`, `sun_azimuth`, `mist`.

8. **Scrub the timeline** (if animated) to show the sky colour shifting.  
   Or manually type a new elevation value into the Sky node (e.g. 5°) and watch
   the EEVEE viewport update in real time.

9. **Switch to HDRI mode** — change `HDRI_PATH` in the script to a local `.hdr` file
   (e.g. from polyhaven.com). Re-run. Show the TexEnvironment node in the World shader.  
   Rotate the Mapping node Z value and show the HDRI rotating.

10. **Close on the JSON file** showing the `hdri.azimuth_offset` field.

---

### Editing Notes

- Trim dead air between steps.  
- Add a title card: `Python World Node Tree | Blender 5.1 | Holoflow Studio`.  
- No background music; ambient keyboard clicks are fine.  
- Export at 30 fps, H.264, CRF 23.

# Screen Recording Notes — bmesh.ops.solidify Hollow Shell

Target file: `public/library/videos/scripting/python-bmesh-ops-solidify-hollow-shell-faceted-crystal-case-webxr/screen.mp4`

## OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 (full application window) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 / H.264 |
| Bitrate | 4–6 Mbps |

## Shot sequence (~4 minutes)

1. **Open Blender 5.1.** New General scene. Keep the default cube visible for scale context.

2. **Open the Scripting workspace.** Paste `blueprint.py` into the text editor. Zoom in so the Parameters block is clearly readable.

3. **Annotate key lines** (use the mouse to point):
   - `bmesh.ops.create_icosphere(bm, subdivisions=1, diameter=0.9)` — explain this is our starting shape
   - `bmesh.ops.bisect_plane(..., clear_outer=True)` — the lid cut
   - `bmesh.ops.solidify(bm, geom=list(bm.faces), thickness=WALL_THICKNESS)` — the hero call
   - `result['geom']` → inner face loop — explain how to tag material indices

4. **Run the script** (Alt+P or Run Script button). Switch to Layout workspace.

5. **Inspect the result in the 3D viewport:**
   - Solid mode → show the two material colours (outer blue / inner dark teal)
   - Switch to Wireframe (Z) to show the inner and outer shell topology side-by-side
   - Orbit to look DOWN from above — the wall-thickness rim is clearly visible
   - Optional: enter Edit Mode → select-all → show the full face topology

6. **Open the System Console** (Window → Toggle System Console on Windows) and show the `[holoflow] wrote …` print line confirming GLB export.

7. **Demonstrate the difference vs SolidifyModifier:**
   - Add a new cube, add a Solidify modifier in the Properties panel
   - Point out: non-destructive stack, even-thickness checkbox, complex mode, rim fill options
   - Return to the bmesh script and point out: single bmesh session, `result['geom']` deterministic inner-face handle

8. **Close OBS / stop recording.** Rename output to `screen.mp4` and move to the video directory.

## Notes

- Keep Blender's font size at 14pt or above (Edit → Preferences → Interface → Font Size) so code is legible at 1080p.
- Do not show any personal file paths or usernames in the System Console output.
- The Workbench cavity shader in Solid mode makes the rim and wall thickness clearly visible — switch to it before the final shot.

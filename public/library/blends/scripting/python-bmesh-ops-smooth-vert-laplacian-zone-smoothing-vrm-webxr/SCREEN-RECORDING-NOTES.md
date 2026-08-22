# Screen Recording Notes
## python-bmesh-ops-smooth-vert-laplacian-zone-smoothing-vrm-webxr

Target file: `public/library/videos/scripting/python-bmesh-ops-smooth-vert-laplacian-zone-smoothing-vrm-webxr/screen.mp4`

---

### OBS Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Disabled |
| Output format | MP4 (H.264) |
| CRF / quality | 18–22 |

---

### What to record (~3 minutes)

1. **Open Blender 5.1.** New General scene.
2. **Open Scripting workspace.** Paste `blueprint.py` into the Text editor.
3. **Show the parameter block** — scroll to the top, highlight
   `ZONE_COLLAR_MAX`, `ZONE_BLEND_MAX`, `SV_FACTOR`, `SV_ITERATIONS`,
   `SLV_LAMBDA`, `SLV_ITERATIONS`. Hover each so the viewer can read them.
4. **Run the script** (`Alt+P` or the ▶ button).
5. **Switch to 3D Viewport, Material Preview mode (Z → Material Preview).**
   Orbit the pauldron so the three zones are clearly visible:
   - hard faceted collar at the base
   - smooth blend zone in the middle
   - organic dome cap at the top
6. **Open the Properties panel (`N`) → Item → Location** — show the object is
   positioned at origin.
7. **Open the Python console.** Type:
   ```python
   import bmesh, bpy
   ob = bpy.data.objects['hf_smooth_pauldron']
   bm = bmesh.new(); bm.from_mesh(ob.data)
   print(len(bm.verts), len(bm.faces))
   bm.free()
   ```
   This shows vertex/face counts to audience.
8. **Show the GLB export** — File → Export → glTF 2.0, confirm settings
   (Draco compression ON, WebP textures).

---

### Tips

- Use a dark Blender theme so the cel-shaded pauldron pops.
- Zoom the 3D Viewport to fill ~80 % of screen.
- If the smooth zone boundary is not obvious, reduce `ZONE_COLLAR_MAX` to
  `0.10` and re-run to exaggerate the transition.
- For comparison, try re-running with `SV_ITERATIONS = 0` to show the
  bumpy pre-smooth state, then set it back to 5.

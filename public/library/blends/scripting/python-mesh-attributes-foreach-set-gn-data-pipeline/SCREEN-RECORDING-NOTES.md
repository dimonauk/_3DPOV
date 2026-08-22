# Screen Recording Notes
## python-mesh-attributes-foreach-set-gn-data-pipeline

**Goal**: Capture blueprint.py running in the Scripting workspace, then the
attribute-painted icosphere revealed in Vertex Paint shading mode and the
Attributes panel in Properties.

---

### Software

- OBS Studio (or Windows Game Bar Win+G)
- Blender 5.1

### OBS Setup

| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Off (silent technique recording) |
| Output | `public/library/videos/scripting/python-mesh-attributes-foreach-set-gn-data-pipeline/screen.mp4` |

---

### Shot list

**Segment 1 — Script in context** (0–20 s)  
Open `blueprint.py` in the Scripting workspace Text Editor. Scroll slowly
through the file — pause on the `foreach_get("co")` call and then the
`foreach_set("value", alt)` line so viewers see the API pattern.

**Segment 2 — Run and console output** (20–45 s)  
Press Run Script (▶ button or Alt+P). Immediately switch the bottom area to
the System Console (Window > Toggle System Console on Windows, or the Info
log in the header). Show the `[holoflow] verts=642 faces=1280 peaks=...` line.

**Segment 3 — Viewport reveal** (45–80 s)  
Switch to the 3D viewport. In the viewport shading header, set mode to Solid
and Color to Vertex. Orbit slowly: the biome zones appear — cyan poles, grey
rock belt, green grassland, orange desert/foothills. Pause orbiting at a
flattering three-quarter view of both poles.

**Segment 4 — Attributes panel** (80–110 s)  
Click the planet object. Open Properties (N) → Data (mesh icon) → Attributes.
Expand the list — show all four attributes: altitude, is_peak, biome_id,
face_colour. Click each one and let the viewer see the domain and type labels.

**Segment 5 — GN Named Attribute read** (110–140 s)  
Add a Geometry Nodes modifier (Properties > Modifier > Add > Geometry Nodes).
Create a Named Attribute node for `biome_id` with Type = Integer. Connect it
to a Viewer node. In the spreadsheet editor show the integer column (0–3) per
face — confirming the attribute is readable inside the GN graph.

**Segment 6 — Export** (140–165 s)  
File > Export > glTF 2.0. Tick Export Colors ✓, Export Custom Attributes ✓.
Export to the library glbs folder. Confirm the `.glb` file appears in the
file browser.

---

### Tips

- Use a dark UI theme — the biome colours (cyan, grey, green, orange) read
  much better against Blender's default dark background.
- Zoom into the Attributes panel so the type and domain badges are legible
  at 1080p.
- Hold Ctrl+Alt while pressing Run Script to show the elapsed time in the
  header — good for demonstrating the sub-second runtime.

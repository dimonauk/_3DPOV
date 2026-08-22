# Screen Recording Notes — GN Store Named Attribute → Shader Data Bridge

**Output target**: `public/library/videos/geometry-nodes/gn-store-named-attribute-shader-data-bridge/screen.mp4`

---

## OBS / Game Bar Setup

| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 (windowed full-screen) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Bitrate | 6 Mbps |
| Audio | Off (no mic needed) |
| Format | MP4 (H.264) |

---

## Recording flow (≈ 8–10 minutes)

### 1. Open the .blend (0:00 – 0:20)
- Open `public/library/blends/geometry-nodes/gn-store-named-attribute-shader-data-bridge/hull_edge_heat.blend`
- Switch to **Material Preview** (Z → Material Preview or the sphere icon)
- The hull panel should already show cyan plasma glow at the edges

### 2. Show the Geometry Nodes modifier (0:20 – 2:30)
- Select the hull panel
- Open Properties → **Modifier** tab (spanner icon)
- Click the **EdgeHeatBridge** GN modifier to expand it
- Split the viewport: open a **Geometry Node Editor** on the right half
- Walk through the node tree left to right, pausing at each node:
  - **Position** → "reads the world XYZ of each vertex"
  - **Separate XYZ** → "extract X and Y"
  - **Absolute (×2)** → "fold negatives — we only care about distance, not direction"
  - **Maximum** → "Chebyshev distance: max(|x|, |y|) is 1.0 at all four perimeter edges simultaneously"
  - **Divide** → "normalise by panel half-size → 0 (centre) to 1 (perimeter)"
  - **Clamp** → "keep bevelled-corner vertices from exceeding 1.0"
  - **Store Named Attribute** → highlight the Name field: type `edge_heat`, domain POINT

### 3. Contrast with Capture Attribute (2:30 – 3:30)
- Open Add menu (Shift+A in GN editor) → Attribute → show both nodes:
  - **Capture Attribute** — "visible only inside this tree, like a local variable"
  - **Store Named Attribute** — "writes to the mesh data block with a user-chosen name — accessible outside this tree"
- Delete the added nodes (do not save yet)

### 4. Show the material (3:30 – 5:30)
- Switch to **Shader Editor** (top-left dropdown)
- Walk the material nodes:
  - **Attribute node** — point at the Name field: `edge_heat` — "reads by string name"
  - Show the Fac output — "FLOAT attribute maps here"
  - **ColorRamp** — "remaps 0–1 to black → cyan, with the threshold at 0.35"
  - **Multiply** — "EMIT_STR = 3.2, so the peak value reaching the Emission socket is 3.2"
  - **Principled BSDF** — Emission Strength driven live
- Drag the Multiply factor from 0 → 5 in real time, show the glow intensify

### 5. Live attribute verification via Python console (5:30 – 7:00)
- Open **Python Console** (Shift+F4 or scripting workspace)
- Run:
```python
import bpy, bpy.context as C
dg = C.evaluated_depsgraph_get()
mesh = C.active_object.evaluated_get(dg).data
print([a.name for a in mesh.attributes])
print(mesh.attributes["edge_heat"].data[0].value)
```
- Show the float output — "this is the raw float stored at vertex 0"
- Scrub through several vertices: values near 1.0 at perimeter, near 0 at centre

### 6. glTF export with attributes (7:00 – 8:30)
- File → Export → glTF 2.0 → check **Include → Mesh → Custom Attributes**
- Export as `hull_edge_heat.glb`
- Open a text editor, drag the GLB in, or use a glTF viewer to show
  `"_edge_heat"` in the accessors section

### 7. Render the pulse animation (8:30 – end)
- Open **Text Editor**, load `record.py`, click **Run Script**
- Switch to **Timeline**, press Spacebar to play — show the emission pulsing

---

## Tips
- Keep the Geometry Nodes editor and Shader Editor side by side for the "bridge" visual moment
- Zoom in on the **Store Named Attribute** node for a clear close-up: Name field = `edge_heat`, Domain = Point, Type = Float
- When demoing the Python console, enable **Line Numbers** in the console editor preferences for readability

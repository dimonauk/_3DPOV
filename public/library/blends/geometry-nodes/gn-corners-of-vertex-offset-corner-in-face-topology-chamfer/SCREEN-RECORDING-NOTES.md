# Screen Recording Notes — GN Topology-Walk Panel Trim

**Target file:** `public/library/videos/geometry-nodes/gn-corners-of-vertex-offset-corner-in-face-topology-chamfer/screen.mp4`

## OBS / Xbox Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no desktop audio) |
| Output format | MP4 / H.264 |
| Bitrate | 8000 kbps |

## Shot list

### 1. Start (0–15 s) — GN editor overview
- Blender open on `topology_trim_panel` with the GN modifier
- Open the Geometry Nodes editor; expand the tree so all nodes are visible
- Hover over `Corners of Vertex` and `Offset Corner in Face` nodes to show tooltips
- Pan slowly right across the full node graph

### 2. Live material preview (15–35 s) — three zones visible
- Switch to **Material Preview** shading (Z key → Material Preview)
- Rotate the viewport: face-on → 45° tilt → back
- The three zone colours should be clearly visible:
  - Blue centre panel faces
  - Dark-blue edge trim (slightly recessed)
  - Orange corner trim (deeply recessed)

### 3. GN node walk-through (35–90 s)
- Click `Corners of Vertex` node; show its Total output connected to `Store Named Attribute (vtx_valence)`
- Zoom in on `Offset Corner in Face` → `Vertex of Corner` → `Field at Index` chain
- Zoom in on `Evaluate on Domain (FACE)` → `Map Range` → `Round` zone classification
- Show the two `Scale Elements` and two `Extrude Mesh` nodes side-by-side

### 4. Attribute viewer (90–120 s)
- Add a `Viewer` node (Shift+A → Output → Viewer) and connect `vtx_valence` Named Attribute into it
- Switch the Viewer domain to POINT; enable Attribute on the viewport overlay
- Show colour-coded valence: 4=interior vertices, 3=edge, 2=corner (matches zone colours)

### 5. GLB export (120–150 s)
- File → Export → glTF 2.0
- Tick "Custom Attributes" (under Mesh section)
- Export, show the file size in the file browser
- Close; show the orange corners in a final viewport spin

## Tips
- Use **Numpad 1** for front orthographic view during the zone-colour reveal shot
- **Alt+Z** toggles X-ray mode — shows the extrusion depth gap between zones clearly
- If recording on Windows, Xbox Game Bar (Win+G) captures the exact Blender window without a border

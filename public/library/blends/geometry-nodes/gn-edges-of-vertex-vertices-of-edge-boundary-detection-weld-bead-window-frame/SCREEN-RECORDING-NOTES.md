# Screen Recording Notes
## GN Edges of Vertex + Vertices of Edge — Boundary Weld Bead Window Frame

**OBS / Windows Game Bar settings**

| Setting | Value |
|---|---|
| Window source | Blender 5.1 (full application window) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (technique demo, no narration track) |
| Output | `public/library/videos/geometry-nodes/gn-edges-of-vertex-vertices-of-edge-boundary-detection-weld-bead-window-frame/screen.mp4` |
| Codec | H.264 (CRF 18 for OBS, or "High quality" in Game Bar) |

---

## Shot sequence (aim for 3–5 minutes total)

### 1 — Open scene + inspect topology (0:00–0:45)
- Open Blender 5.1 with the washer mesh from `blueprint.py`
- Switch to **Spreadsheet editor** and set **Domain → Vertex**
- Show the `boundary_excess` column: 0 for interior vertices, 1 for both the
  inner aperture loop and the outer perimeter loop
- Pan to the inner aperture — zoom in so the two distinct boundary rings are
  visible in the spreadsheet highlight

### 2 — Walk the GN tree: EdgesOfVertex node (0:45–1:30)
- Open the **Geometry Nodes editor**
- Select the `GeometryNodeEdgesOfVertex` node and press **N** to open node sidebar
- Show the `Vertex Index` input (unconnected, reads InputIndex in POINT domain)
  and both outputs: `Edge Index` and `Total`
- Hover over `Total` — in the Viewer node the value should read 3 or 4 for
  interior vertices, 2 or 3 for boundary vertices

### 3 — Walk the GN tree: VerticesOfEdge node (1:30–2:15)
- Navigate to the `GeometryNodeVerticesOfEdge` node
- Show `Vertex Index 1` and `Vertex Index 2` outputs
- Attach a Viewer node to `Vertex Index 1` — in the Spreadsheet (Domain →
  Edge) the column should increment sensibly across the boundary edge strip
- Remove Viewer node after demo

### 4 — Visualise boundary_excess as vertex colour (2:15–3:00)
- In **Vertex Paint mode**, select **Attribute → boundary_excess**
- Interior faces render dark (0), boundary rings glow bright (1)
- Switch back to **Object Mode**

### 5 — Final result turntable (3:00–3:45)
- Frame the window frame with both inner and outer beads visible
- Manually orbit 360° in the viewport at a slight elevation (approximately 30°
  above horizontal) so the bead relief depth is apparent
- Hold **Shift + scroll** to smooth-zoom to the inner aperture beads for
  final close-up

---

## Post-processing hint
Trim any dead air at the start/end.  No colour grade needed — the scene's dark
gunmetal frame and bronze bead accent read clearly at 1080p.

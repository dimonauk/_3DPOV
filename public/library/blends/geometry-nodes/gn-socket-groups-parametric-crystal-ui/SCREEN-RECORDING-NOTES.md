# Screen Recording Notes — GN Socket Groups: Parametric Crystal

**Target file:** `public/library/videos/geometry-nodes/gn-socket-groups-parametric-crystal-ui/screen.mp4`

## Software

| Tool | Setting |
|---|---|
| OBS Studio (recommended) or Windows Game Bar (Win+G) | |
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (no mic, no desktop audio) |
| Output format | MP4 / H.264, CRF 23 |

## What to capture

### Segment 1 — Socket Panels in the Properties sidebar (0:00–0:20)
1. Open `faceted_crystal.blend` (run `blueprint.py` first).
2. Select the `faceted_crystal` object.
3. Go to **Properties** (right panel) → **Modifier** tab (wrench icon).
4. The **CrystalPanelDemo** modifier shows the **Shape** panel open and **Style** collapsed.
5. Slowly click to expand/collapse each panel so the viewer sees the disclosure triangles.

### Segment 2 — Tweaking parameters live (0:20–0:45)
1. In the **Shape** panel, scrub **Side Count** from 3 → 8 → 3.  
   The crystal updates in real-time in the viewport.
2. Scrub **Tip Length** from 0.05 → 0.80 → 0.55 to show the tips growing and retreating.
3. Scrub **Bevel Amount** from 0 → 0.10 → 0.04 to show edge chamfer changing.

### Segment 3 — Node group interface in the Shader/Geometry Editor (0:45–1:10)
1. Open a **Geometry Node Editor** area.
2. With the `faceted_crystal` object selected, pin the editor to the modifier.
3. Press **N** to open the side panel; click **Group** tab to see the input panel layout.
4. Switch to viewing the interface: click the **Group** header → **Manage Sockets** (or N-panel Socket list).
5. Pan slowly left to show the node graph: CylinderMesh → TransformGeometry (×2) → JoinGeometry → MergeByDistance → BevelMesh → SetShadeSmooth → StoreNamedAttribute (×2) → Group Output.

### Segment 4 — Final render orbit (1:10–1:30)
1. Press **Numpad 0** for camera view.
2. Play the timeline (Spacebar) to show the tip-growth + camera orbit animation from `record.py`.

## Post-processing
- Trim head/tail silence in DaVinci Resolve or Kdenlive.
- No colour grading required — the tutorial is about the interface, not the render.
- Export final cut as `screen.mp4`, H.264, 1920×1080, 30 fps.

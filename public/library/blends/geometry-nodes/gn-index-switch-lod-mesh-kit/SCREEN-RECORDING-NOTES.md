# Screen Recording Notes — GN Index Switch LOD Mesh Kit

**Target file:** `public/library/videos/geometry-nodes/gn-index-switch-lod-mesh-kit/screen.mp4`

## OBS / Windows Game Bar settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (silent recording) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

## What to record

### Part 1 — Node tree overview (0:00 – 0:15)
1. Open the Geometry Nodes editor with `GN_LOD_IndexSwitch` active.
2. Pan to show all three Object Info nodes flowing into the Index Switch.
3. Pause on the Index Switch node — hover over it so the tooltip shows `GeometryNodeIndexSwitch`.

### Part 2 — Integer selector in action (0:15 – 0:45)
1. Select the `lod_selector` object and open the Properties panel → Modifier Properties.
2. Slowly scrub the **LOD Level** integer field: 0 → 1 → 2.
3. Split the screen: 3D Viewport left, Modifier Properties right so both are visible simultaneously.
4. The viewport should show wireframe overlay (Viewport Overlays → Wireframes ON, opacity 0.3) so the polygon density change is visually obvious at each tier.

### Part 3 — Python export loop (0:45 – 1:00)
1. Open the Scripting workspace.
2. Paste only the `export_lod_glbs()` call from `blueprint.py` (or show the loop in the editor).
3. Run it — the Info header should scroll with three `INFO: Exported …` lines, one per GLB.

### Part 4 — GLB comparison (1:00 – 1:15)
1. Open the System Console (Window → Toggle System Console on Windows) or watch the terminal output.
2. The three file sizes should be clearly different: hi ≫ mid > lo.

## Tips

- **Wireframe density is the money shot.** Make sure overlays are on before Part 2.
- Zoom the node tree enough that all three Object Info → Index Switch links are readable without scrolling.
- If Blender's UI is too busy, hide the N-panel (N key) before recording the node tree section.
- Record at native 1080p — do not upscale from 720p.

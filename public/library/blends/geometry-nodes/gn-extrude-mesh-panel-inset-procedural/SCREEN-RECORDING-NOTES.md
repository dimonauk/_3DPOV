# Screen Recording Notes — GN Extrude Mesh: Procedural Panel Inset

**Target file**: `public/library/videos/geometry-nodes/gn-extrude-mesh-panel-inset-procedural/screen.mp4`

## OBS / Windows Game Bar Setup

| Setting | Value |
|---|---|
| Capture source | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 (H.264) |
| Bitrate | 8 000 kbps |

## What to Record

1. **Run blueprint.py** (~2 min)  
   Open the Scripting workspace, paste `blueprint.py`, run it. Watch the GN
   tree build and the panel inset geometry appear in the viewport. Hit Numpad 5
   (orthographic) then Numpad 7 (top view) to show the 16 × 16 grid.

2. **Explore the Geometry Nodes editor** (~90 sec)  
   Switch to the Geometry Node editor. Pan the tree left-to-right showing
   the full chain: Grid → RandomValue → Compare → ExtrudeMesh1 → SetEdgeCrease
   → AND → ExtrudeMesh2 → SetEdgeCrease2 → SetShadeSmooth → SetMaterial.
   Hover each node and let the tooltip show the socket names.

3. **Show Top and Side socket connections** (~60 sec)  
   Click the first `Extrude Mesh` node. Trace the `Side` wire to `Set Edge
   Crease.Selection` and the `Top` wire to `Boolean Math.A`. Explain verbally
   that these are *field references* — they do not carry geometry, they carry
   a per-element boolean formula evaluated lazily at the consumer node.

4. **Live-tune Panel Threshold** (~60 sec)  
   Select `panel_inset` object. In Properties → Modifier Properties → PanelInset,
   drag **Panel Threshold** from 0.0 to 1.0 and back. The panel density changes
   live. Settle on 0.38 for the default sci-fi look.

5. **Live-tune Panel Depth** (~45 sec)  
   Drag **Panel Depth** from 0.0 to 0.08. Show that panels rise in real time.
   Point out how the Subdivision Surface modifier (stacked below) rounds the
   non-creased edges while keeping the hinge edges sharp.

6. **GLB export confirmation** (~30 sec)  
   File → Export → glTF 2.0 (.glb). Show the export dialogue with Draco
   enabled and `Apply Modifiers` ticked. Click Export GLB.

## Editing Notes

- Trim head/tail dead air.
- Add lower-third: "GN Extrude Mesh — Procedural Panel Inset | Blender 5.1".
- Speed blueprint.py execution to 4× in the replay.
- Target runtime: 6–9 minutes.

## Storage

```
public/library/videos/geometry-nodes/gn-extrude-mesh-panel-inset-procedural/screen.mp4
```

Do not commit `.mp4` binaries to git. Upload to the studio media bucket and
reference via CDN URL in the tutorial component.

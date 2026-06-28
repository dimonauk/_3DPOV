# Screen Recording Notes — GN Capture Attribute: Position Snapshot

**Target file:** `public/library/videos/geometry-nodes/gn-capture-attribute-position-snapshot-stable-voronoi/screen.mp4`

## OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window capture — Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no desktop audio) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

## Takes to record

### Take 1 — The core problem (no Capture Attribute)
1. Open `capture_column.blend`.
2. Select the column → Properties → Modifier → `GN_CaptureAttr_StableVoronoi`.
3. In the GN editor, disconnect `n_cap.outputs[1]` from the Voronoi Vector socket.
4. Connect `Position` (raw) directly to the Voronoi Vector socket.
5. In the N-panel, slowly drag the **Twist** socket from 0° to 180°.
6. Show that the Voronoi cells swim and shift as the column rotates.
7. Duration: ~30 s.

### Take 2 — With Capture Attribute
1. Re-connect `n_cap.outputs[1]` (the frozen snapshot) to the Voronoi Vector socket.
2. Again drag **Twist** 0° → 180° → 0° slowly.
3. Show that the cell colour pattern remains locked to the column's original rings.
4. Duration: ~30 s.

### Take 3 — Node tree walkthrough
1. In the GN editor, trace the wire: `Position → CaptureAttribute(inputs[1]) → outputs[1] → SeparateXYZ AND VoronoiTexture`.
2. Hover each node label — explain evaluate-once vs lazy field.
3. Open the Spreadsheet editor (POINT domain) and show `captured_pos` (if the attribute name is stored — may need to use StoreNamedAttribute for the captured pos separately for Spreadsheet visibility).
4. Duration: ~45 s.

### Take 4 — Domain bridging demonstration
1. Switch `n_cap.domain` from `POINT` to `FACE` in the N-panel.
2. Show how the Voronoi averaging changes (one value per face rather than per vertex).
3. Switch back to `POINT`.
4. Duration: ~20 s.

### Take 5 — GLB export + Three.js attribute check
1. File → Export → glTF 2.0 with `export_attributes=True` ticked.
2. Open the exported `capture_column.glb` in `gltf.report` or Three.js viewer.
3. Show `geometry.attributes.hs_cell_id` in the attribute inspector.
4. Duration: ~20 s.

## Suggested edit order

Takes 2 → 1 (contrast), then 3, 4, 5 for depth. Total ~2 min 30 s; trim to 90 s for the short cut.

## File naming

Save OBS recording as `screen_raw.mp4`, export finished edit as `screen.mp4` in the videos folder above.

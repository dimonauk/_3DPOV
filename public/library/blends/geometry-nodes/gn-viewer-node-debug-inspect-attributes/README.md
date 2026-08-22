# GN Viewer Node — Field Inspection & Attribute Debugging (Blender 5.1)

Demonstrates `GeometryNodeViewer` as a live diagnostic probe mid-tree:
inspect scalar fields, vector fields, and named-attribute round-trips without
touching Group Output or baking anything.

## Contents

| File | Purpose |
|---|---|
| `blueprint.py` | Builds the 14×14 grid + GN debug tree with three Viewer probes |
| `record.py` | Camera orbit + per-segment Viewer activation for viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS and Blender panel setup for screen.mp4 |
| `.expected-artefacts.json` | CI artefact manifest |
| `gn_viewer_debug.blend` | Output blend file (created by blueprint.py) |

## Viewer probes

| Label | Domain | Shows |
|---|---|---|
| Viewer: Noise Scalar | POINT | Noise Fac 0–1 as grayscale per vertex |
| Viewer: Face Normal | FACE | World-space normal XYZ → RGB slope map |
| Viewer: Named Attr RT | POINT | `noise_height` attribute round-trip readback |

## Quick start

```bash
blender --background --python blueprint.py
```

Then in Blender Scripting tab (interactive):

```python
# Activate a probe by name
ng = bpy.data.node_groups["GN_Viewer_Debug_Tree"]
for n in ng.nodes:
    if "Noise Scalar" in n.label:
        ng.nodes.active = n
```

Set the 3D Viewport to Solid shading to see the overlay.
Open Spreadsheet Editor → Vertices or Faces tab → "Viewer" column.

## Key invariant

Probe A and Probe C must show identical values.
Any difference means Store Named Attribute has a domain or name mismatch.

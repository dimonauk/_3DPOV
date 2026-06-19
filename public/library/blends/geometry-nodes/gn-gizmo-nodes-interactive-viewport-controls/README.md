# GN Gizmo Nodes — Parametric Roman Arch with Interactive Viewport Handles

**Blender 5.1 | Geometry Nodes | CC0**

## What this teaches

Gizmo nodes (introduced in Blender 5.0) add interactive 3D arrow, dial, and
point handles to a Geometry Nodes modifier.  Instead of scrubbing sidebar
numbers, the artist drags directly on the geometry surface in the viewport.

This blueprint builds a parametric Roman arch (semicircular voussoir ring +
two square pillars) wired to two `GeometryNodeGizmoLinear` nodes:

- **Width gizmo** — horizontal arrow at the arch's right shoulder; drag to
  change the inner span (0.5 m – 20 m).
- **Height gizmo** — vertical arrow above the crown; drag to change the rise.

Both handle positions are driven by the same Width/Height values they control,
so the arrows track the arch surface as it moves.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy script — builds GN tree, gizmo nodes, and saves `.blend` |
| `record.py` | Viewport render: animates Width + Height to show both gizmo axes |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the live interactive demo |
| `.expected-artefacts.json` | Artefact manifest |

## Running the blueprint

```bash
# From Blender's Script Editor (or command-line headless):
blender --background --python blueprint.py
# Output: roman_arch_gizmos.blend (beside the script)
```

Open the `.blend`, select **RomanArch**, enable GN modifier overlay: the two
arrow handles appear in the 3D Viewport when the object is selected.

## Key API notes (Blender 5.1)

- Node type: `GeometryNodeGizmoLinear`
- Inputs: `"Value"` (Float), `"Position"` (Vector), `"Direction"` (Vector)
- Output: `"Gizmo"` (NodeSocketGizmo)
- Group Output gains a `"Gizmos"` socket that accepts NodeSocketGizmo data
  (multi-input, like the Join Geometry socket)

## Outside sources

- Blender 5.0 Release Notes — Gizmos:
  <https://wiki.blender.org/wiki/Reference/Release_Notes/5.0/Nodes_and_Physics>
  CC-BY-SA 4.0, Blender Wiki contributors
- Blender Python API — GeometryNodeGizmoLinear:
  <https://docs.blender.org/api/5.1/bpy.types.GeometryNodeGizmoLinear.html>
  CC-BY-SA 4.0, Blender Documentation Team

## Related studio tutorials

- [GN Socket Groups — Parametric Crystal UI](/tutorials/blender-tutorial-gn-socket-groups-parametric-crystal-ui)
- [GN Menu Switch — Tile Variant Kit](/tutorials/blender-tutorial-gn-menu-switch-tile-variant-kit)
- [Python Add-on — Custom Panel + PropertyGroup](/tutorials/blender-tutorial-python-addon-custom-panel-property-group)

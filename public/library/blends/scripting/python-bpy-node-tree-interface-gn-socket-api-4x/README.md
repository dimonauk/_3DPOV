# Python bpy.types.NodeTreeInterface — GN Socket Authoring (Blender 5.1)

**Slug**: `python-bpy-node-tree-interface-gn-socket-api-4x`  
**Topic**: scripting  
**Licence**: CC0  
**Blender**: 5.1  

---

## What this is

Blender 4.0 silently killed `node_group.inputs` and `node_group.outputs`.
Every GN Python script written for Blender 3.x that calls `.inputs.new()` or
`.outputs.new()` now raises:

```
AttributeError: 'GeometryNodeTree' object has no attribute 'inputs'
```

The replacement is `node_group.interface` — an instance of
`bpy.types.NodeTreeInterface`. This entry is the definitive guide to authoring
GN sockets (and collapsible panels) programmatically in Blender 4.0 – 5.1.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full working script: interface authoring, node graph, modifier attachment, GLB export |
| `record.py` | Viewport animation that keyframes Blade Count 3→16, renders `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the manual screen capture |
| `.expected-artefacts.json` | CI manifest |

---

## Quick start

```bash
# In Blender's Python console or via --background:
blender --background --python blueprint.py
```

Expected output:
```
[holoflow] radial_fan exported → //radial_fan.glb

[holoflow] Socket identifier map:
  OUTPUT  'Geometry'         → identifier='Socket_1'
  INPUT   'Geometry'         → identifier='Socket_2'
  INPUT   'Blade Count'      → identifier='Socket_3'
  INPUT   'Blade Radius'     → identifier='Socket_4'
  INPUT   'Blade Scale'      → identifier='Socket_5'
  INPUT   'Blade Twist (°)'  → identifier='Socket_6'
  INPUT   'Blade Thickness'  → identifier='Socket_7'
  INPUT   'Material'         → identifier='Socket_8'
```

---

## Critical API notes

### Socket creation

```python
# OLD (Blender ≤ 3.6) — BROKEN in 4.0+
ng.inputs.new("NodeSocketFloat", "Width")   # AttributeError

# NEW (Blender 4.0 / 5.1)
s = ng.interface.new_socket(
    name="Width",
    in_out="INPUT",
    socket_type="NodeSocketFloat",
)
s.default_value = 0.4
s.min_value = 0.05
s.max_value = 2.0
```

### Panel grouping (4.2+)

```python
panel = ng.interface.new_panel(name="Fan Controls")
# Sockets created with parent=panel are grouped inside it in the UI
s = ng.interface.new_socket(
    name="Blade Count", in_out="INPUT", socket_type="NodeSocketInt",
    parent=panel,
)
```

### Modifier access uses identifier, not name

```python
mod = ob.modifiers["Radial_Fan"]
mod[sock.identifier] = 12   # correct: uses 'Socket_3'
mod["Blade Count"]   = 12   # silently ignored — wrong key
```

---

## Cross-references

- [GN Node Groups via Python API](/tutorials/blender-tutorial-python-bpy-data-node-groups-gn-billboard-scatter)
- [GN Socket Groups — Parametric Crystal UI](/tutorials/blender-tutorial-gn-socket-groups-parametric-crystal-ui)
- [Python Modifier Stack Pre-Export Apply](/tutorials/blender-tutorial-python-modifier-stack-pre-export-apply)
- [Holoflow WebXR Atelier](/atelier)

---

## Outside sources

- **Blender Foundation** — `bpy.types.NodeTreeInterface` API reference.  
  CC-BY-SA-4.0. <https://docs.blender.org/api/5.1/bpy.types.NodeTreeInterface.html>

- **Blender Foundation** — Blender 4.0 Release Notes: Node Socket API Removal.  
  CC-BY-SA-4.0. <https://wiki.blender.org/wiki/Reference/Release_Notes/4.0/Python_API>

- **njanakiev/blender-scripting** — MIT. Nicolas Janakiev.  
  <https://github.com/njanakiev/blender-scripting>  
  Sibling: <https://github.com/njanakiev> (further procedural geometry scripts)

- **KhronosGroup/glTF-Blender-IO** — Apache-2.0. Khronos Group.  
  <https://github.com/KhronosGroup/glTF-Blender-IO>  
  Sibling: <https://github.com/KhronosGroup/glTF-Sample-Assets> (CC0 test models)

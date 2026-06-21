# Python — Programmatic Geometry Nodes Tree Construction via bpy
**Blender 5.1 · Holoflow Studio · CC0**

## What this does

`blueprint.py` assembles a complete Geometry Nodes group in code — no UI editor
interaction required.  A UV Sphere is displaced by a 3D Noise Texture whose
amplitude is driven by a user-facing *Scale* socket, keyframed from 0 → 0.28 m
over 60 frames.  The script demonstrates every operation needed to build a
production-ready node tree from scratch: creating the node group, declaring
interface sockets, instantiating nodes, wiring links, and assigning the
group to a modifier.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full scene build + GLB export |
| `record.py` | 60-frame EEVEE render for viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list |
| `.expected-artefacts.json` | CI artefact manifest |

## Outputs

- `geonodes_script_demo.blend` — Blender scene with scripted GN modifier
- `geonodes_script_demo.glb` — GLB snapshot at frame 60, Draco level 6, Y-up

## Key Blender 5.1 API facts

```python
# 1. Create the node group
ng = bpy.data.node_groups.new("MyGroup", 'GeometryNodeTree')

# 2. Interface sockets (5.0+ API — NOT ng.inputs/outputs)
ng.interface.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')
ng.interface.new_socket("Scale",    in_out='INPUT',  socket_type='NodeSocketFloat')
ng.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

# 3. Nodes
n = ng.nodes.new('GeometryNodeSetPosition')

# 4. Links
ng.links.new(n_noise.outputs["Color"], n_setpos.inputs["Offset"])
```

## Usage

```
blender --background --python blueprint.py
```

Or open the Scripting workspace in Blender 5.1, load the file, and press
**Run Script** (Alt+P).

## Licence
CC0 — public domain dedication.  No attribution required, but credit appreciated.

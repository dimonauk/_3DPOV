# Python bpy — Geometry Nodes Tree API: Spike-Ball Instancer

**Blender 5.1 · Scripting · CC0 1.0 Universal**

Build a complete Geometry Nodes node-tree entirely in Python — no interactive
node editor required.  The result is a procedural spike-ball: an icosphere
covered with cone instances whose density, length, and radius are exposed as
modifier-panel sliders, all wired up via `bpy.data.node_groups`.

## Key API surface (Blender 4.0 / 5.x)

| Call | Purpose |
|------|---------|
| `bpy.data.node_groups.new(name, type)` | Create the GN tree data block |
| `tree.interface.new_socket(…)` | Register group inputs/outputs (replaces pre-4.0 `tree.inputs.new()`) |
| `socket.default_value / min_value / max_value` | Modifier panel defaults and clamps |
| `tree.nodes.new("GeometryNodeXxx")` | Add a node by its bl_idname string |
| `tree.links.new(from_socket, to_socket)` | Wire two sockets |
| `mod["Socket_N"] = value` | Set a modifier input by socket identifier |
| `mod.keyframe_insert('[\"Socket_N\"]', frame=F)` | Keyframe a modifier input |

## Files

| File | Role |
|------|------|
| `blueprint.py` | Builds scene, GN tree, and exports GLB |
| `record.py` | Animates density ramp + 360° rotation for viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | CI artefact manifest |

## Artefacts produced

- `spike_ball.blend` — live GN modifier, editable via panel
- `spike_ball.glb` — baked export, Draco level 6, WebP textures
- `public/library/videos/scripting/python-bpy-geonodes-tree-api/viewport.mp4`

## Usage

1. Open Blender 5.1 with a factory default scene.
2. Go to the **Scripting** workspace.
3. Open `blueprint.py`, click **Run Script**.
4. Inspect `HS_SpikeBall` in the Geometry Node editor.
5. Tweak Density / Spike Length / Spike Radius in the modifier panel.
6. Run `record.py` to render the viewport animation.

## External references

- Blender Python API — NodeTree:
  https://docs.blender.org/api/current/bpy.types.NodeTree.html  (CC0)
- Blender Geometry Nodes manual:
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/  (CC0)

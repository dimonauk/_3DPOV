# Python GeometryNodeTree API — Procedural Billboard Scatter

**Blender 5.1 · Scripting · CC0 1.0**

Builds a complete Geometry Nodes modifier — node tree, interface sockets,
node instances, and inter-node links — entirely from `bpy.data.node_groups`
without opening the Geometry Node Editor.

## What it produces

| File | Description |
|------|-------------|
| `blueprint.py` | Full pipeline: scene reset → ground → billboard → GN tree → modifier → GLB export |
| `record.py` | 150-frame viewport orbit render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the live Blender capture |
| `scatter_billboard.glb` | Ready-for-WebXR export (Draco 6 · WebP) |

## Technique summary

```
bpy.data.node_groups.new("HF_Scatter", "GeometryNodeTree")
  tree.interface.new_socket(...)        # Blender 5.1 socket API
  nodes.new("GeometryNodeDistributePointsOnFaces")
  nodes.new("GeometryNodeInputIndex")   # per-point ID for random variation
  nodes.new("FunctionNodeRandomValue")  # per-instance scale in [0.5, 1.3]
  nodes.new("ShaderNodeCombineXYZ")     # broadcast float → uniform vector
  nodes.new("GeometryNodeInstanceOnPoints")
  tree.links.new(from_socket, to_socket)
```

## Running

Open Blender 5.1 → Scripting workspace → paste `blueprint.py` → Run Script.
The `.glb` lands next to the `.blend` file.

Run `record.py` afterwards in the same Blender session to produce `viewport.mp4`.

## Cross-references

- Studio tutorial: [GN Instance on Points](/tutorials/blender-tutorial-gn-instance-on-points)
- Studio tutorial: [Python Depsgraph Evaluated Geometry](/tutorials/blender-tutorial-python-depsgraph-evaluated-geometry-gn-instances-batch-export)
- Studio tutorial: [Python World Node Tree](/tutorials/blender-tutorial-python-world-node-tree-hdri-environment-lighting-rig)
- Blender API reference: [bpy.types.NodeTree](https://docs.blender.org/api/current/bpy.types.NodeTree.html) — CC-BY-SA-4.0
- GitHub: [njankowski/blender-scripting](https://github.com/njankowski/blender-scripting) — MIT

# bmesh.ops.bridge_loops — Cylindrical Bore & Tapered Port Socket

**Blender 5.1 · CC0 · Topic: scripting**

`bmesh.ops.bridge_loops` connects two spatially separated edge loops with a clean
quad strip — the context-free kernel behind Blender's Bridge Edge Loops mesh tool.

## What this entry builds

| Object | Shape | Key parameters |
|--------|-------|---------------|
| `HF_PortBore` | Straight 12-sided cylindrical tube | `use_cyclic=True`, `num_cuts=2` |
| `HF_TaperSocket` | 16-sided tapered funnel (wide→narrow) | `interpolation='SURFACE'`, `smoothness=0.45` |

Both objects are flat-shaded, Draco-compressed, and export-ready for WebXR / Three.js.

## Run the blueprint

```bash
blender --background --python blueprint.py
```

Outputs `hf_bridge_port.blend` and `hf_bridge_port.glb` into this directory.

## Run the viewport recording

```bash
blender --background --python record.py
```

Writes `public/library/videos/scripting/python-bmesh-ops-bridge-loops-tunnel-port-socket-webxr/viewport.mp4`.

## Key API invariant

```python
bmesh.ops.bridge_loops(
    bm,
    edges      = edges_loop_a + edges_loop_b,  # flat list — ALL edges from BOTH loops
    use_cyclic = True,   # True=closed rings, False=open rails
    num_cuts   = 2,      # extra intermediate edge loops
    interpolation = 'SURFACE',
    smoothness = 0.45,
    twist_offset = 0,    # rotate loop-B vertex matching; non-zero causes spiral topology
)
```

## Tutorial page

`/tutorials/blender-tutorial-python-bmesh-ops-bridge-loops-tunnel-port-socket-webxr`

## Outside sources

- Blender bmesh.ops API 5.1 — Blender Foundation, CC-BY-SA-4.0
  <https://docs.blender.org/api/5.1/bmesh.ops.html>
- KhronosGroup/glTF-Blender-IO — Khronos Group, Apache-2.0
  <https://github.com/KhronosGroup/glTF-Blender-IO>

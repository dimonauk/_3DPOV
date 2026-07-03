# GN Active Camera Billboard — Camera-Facing Sprite Grid for WebXR HUD

**Blender 5.1 | Geometry Nodes | CC0**

Nine flat quad sprites arranged in a 3×3 grid. A Geometry Nodes tree reads the
scene camera's world-space 4×4 transform via the `Active Camera` node, decomposes
it with `Separate Matrix`, and feeds the camera's +Z column into
`Align Euler to Vector` (Axis=Z). Every sprite instance rotates every frame to
keep its face parallel to the camera image plane — zero Python, zero constraints.

## Files

| File | Description |
|---|---|
| `blueprint.py` | Full bpy scene build + GN tree constructor |
| `record.py` | 60-frame camera orbit → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

```bash
blender --background --python blueprint.py
blender --background --python blueprint.py --python record.py
```

## Technique overview

The camera's local coordinate frame in Blender:
- **+X** right, **+Y** up, **−Z** forward (looking direction)

`Separate Matrix` column outputs (1-indexed in UI, 0-indexed in bpy):
| UI label | bpy index | World-space meaning |
|---|---|---|
| Column 1 | `outputs[0]` | Camera +X (right) |
| Column 2 | `outputs[1]` | Camera +Y (up) |
| Column 3 | `outputs[2]` | Camera +Z (backward) |
| Column 4 | `outputs[3]` | Camera position |

For a globally-aligned billboard, feed `outputs[2]` directly into
`AlignEulerToVector.inputs["Vector"]` (Axis=Z). The −1 SCALE applied in
blueprint.py is necessary only if you want sprites to face the camera's forward
(−Z) direction rather than face away from it.

## WebXR export note

The GN billboard rotation is dynamic and not baked into the GLB.
In Three.js, use `THREE.Sprite` or a `lookAt(camera.position)` call in the
render loop — the GLB export of the static frame can serve as a reference
geometry, not as a live billboard.

## Cross-references

- Tutorial: `/tutorials/blender-tutorial-gn-active-camera-billboard-sprite-webxr-hud`
- Related: `/tutorials/blender-tutorial-gn-align-euler-to-vector-signage-facade`
- Related: `/tutorials/blender-tutorial-gn-curve-arc-dial-gauge-webxr-hud`
- External: https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/input/scene/active_camera.html

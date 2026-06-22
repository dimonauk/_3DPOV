# GN Geometry to Instance — Multi-Variant Prop Scatter

**Blender 5.1 | CC0 | Holoflow Studio**

Bundle 4 pre-processed boulder variants into a single instance library using
`Geometry to Instance` + `Join Geometry`, then scatter them with
`Instance on Points` (Pick Instance mode) for memory-efficient WebXR placement.

## Quick start

1. Open Blender 5.1 → Scripting workspace.
2. Open `blueprint.py` → Run Script.
3. Switch to Layout. Select `terrain`. Confirm `PropScatter` GN modifier.
4. Open `boulder_scatter.glb` in a glTF viewer.

To record:

1. Save the blend file to this directory (required for relative `//` paths).
2. Open `record.py` → Run Script.

## Parameters

| Parameter | Default | Effect |
|---|---|---|
| `VARIANT_COUNT` | 4 | Boulder variants generated and bundled |
| `SCATTER_DENSITY` | 3.5 pts/m² | Points per square metre |
| `SCALE_MIN/MAX` | 0.55 / 1.40 | Per-point uniform scale range |
| `BASE_RADIUS` | 0.45 m | Base icosphere radius |

## Node graph summary

```
ObjectInfo(boulder_0) → GeometryToInstance ─┐
ObjectInfo(boulder_1) → GeometryToInstance  ├→ JoinGeometry → [prop library]
ObjectInfo(boulder_2) → GeometryToInstance  │
ObjectInfo(boulder_3) → GeometryToInstance ─┘
                                                     ↓
Scatter Points ──────────────────────────→ InstanceOnPoints
                                               Pick Instance = True
RandomValue(INT, 0, 3) ─────────────────→ Instance Index
```

## Why Geometry to Instance over IndexSwitch?

`IndexSwitch` evaluates ALL branches regardless of the selected index.
`GeometryToInstance` + `JoinGeometry` evaluates each source **once** and
references it; the pick happens at realisation time. For pre-baked meshes
the difference is small; for modifier-heavy sub-trees it is significant.

## Expected outputs

- `boulder_scatter.blend`
- `boulder_scatter.glb`
- `../../videos/geometry-nodes/gn-geometry-to-instance-multi-variant-prop-scatter/viewport.mp4`
- `../../videos/geometry-nodes/gn-geometry-to-instance-multi-variant-prop-scatter/screen.mp4`

## Licence

CC0. Outside references: Blender Manual (CC-BY-SA 4.0, Blender Documentation Team).

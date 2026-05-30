# GN Raycast — Procedural Shadow Mask for Cel Shading

**Blender 5.1 · Geometry Nodes · CC0**

Casts one ray per vertex toward a virtual sun. Tests intersection against a
separate "blocker" object. Stores the result — 1.0 lit, 0.0 shadowed — as a
named vertex attribute consumed by a two-tone Emission cel shader.

## Why Raycast over EEVEE shadow maps

EEVEE shadow maps are view-dependent and resolution-limited. The Raycast node
produces a shadow_mask that:

- Bakes deterministically into vertex attributes
- Exports with the mesh as a custom glTF attribute (`_SHADOW_MASK`)
- Costs zero runtime computation in WebXR — just a vertex buffer read

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Creates scene, GN tree, material, exports GLB |
| `record.py` | Animates the blocker in a circle, renders `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Manifest of expected outputs |

## Usage

```bash
# Build the .blend and GLB
blender --background --python blueprint.py

# Render the animated viewport demo
blender --background --python record.py
```

## GN tree overview

```
ObjectInfo(shadow_blocker, RELATIVE) ─┐
CombineXYZ(0, 0, 1) ──────────────────┤→ Raycast → Is Hit (bool)
                                       │                    │
GroupInput.Geometry                    │            Switch(F=1.0, T=0.0)
     │                                 │                    │
     └→ StoreNamedAttribute("shadow_mask", POINT, FLOAT) ←─┘
               │
        SetShadeSmooth(False)
               │
        GroupOutput.Geometry
```

## Parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `GRID_DIVS` | 15 | Vertex density — higher = smoother shadow edge |
| `BLOCKER_HEIGHT` | 2.5 m | Raise to thin the shadow footprint |
| `BLOCKER_RADIUS` | 1.2 m | Widen to increase shadow area |
| `RAY_LENGTH` | 6.0 m | Must exceed `BLOCKER_HEIGHT + BLOCKER_RADIUS` |
| `RAY_DIR_VEC` | (0,0,1) | Change to simulate angled sun |

## Outside sources

- Blender Manual — Raycast Node: https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/sample/raycast.html
  Licence: CC-BY-SA 4.0 (Blender Documentation Team)

- KhronosGroup/glTF-Blender-IO — custom vertex attribute export:
  https://github.com/KhronosGroup/glTF-Blender-IO
  Licence: Apache-2.0 (Khronos Group)

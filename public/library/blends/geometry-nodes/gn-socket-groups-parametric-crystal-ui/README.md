# GN Socket Groups — Parametric Faceted Crystal
**Blender 5.1 | Geometry Nodes | CC0**

Demonstrates `NodeTreeInterface.new_panel()` — the Blender 4.3+/5.x API for
creating collapsible input sections on a Geometry Nodes modifier.  The crystal
itself is a bi-pyramid prism (cylinder body + two mesh cones, welded and
bevelled) whose parameters are organised into two disclosure-triangle panels:
**Shape** and **Style**.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full scene + GN tree; run inside Blender or `blender --background --python blueprint.py` |
| `record.py` | Viewport animation (tip growth + camera orbit) → `videos/…/viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for the companion `screen.mp4` |
| `.expected-artefacts.json` | CI manifest of expected output files |

## Key API (Blender 4.3+ / 5.x)

```python
iface = tree.interface                         # NodeTreeInterface

panel = iface.new_panel("Shape", default_closed=False)
sock  = iface.new_socket(
    "Side Count",
    socket_type='NodeSocketInt',
    in_out='INPUT',
    parent=panel,          # ← assigns socket to the panel
)
sock.default_value = 6
sock.min_value     = 3
```

In Blender 5.x `tree.inputs` is read-only; `tree.interface` is the only
valid mutation path.

## Parameters

### Shape panel (open by default)
| Name | Type | Default | Notes |
|---|---|---|---|
| Side Count | Int | 6 | 3–32; drives all three mesh primitives |
| Body Height | Float | 1.6 m | Prism shaft height |
| Tip Length | Float | 0.55 m | Length of each pointed tip |
| Bevel Amount | Float | 0.04 m | Edge chamfer width |

### Style panel (collapsed by default)
| Name | Type | Default | Notes |
|---|---|---|---|
| Base Color | Color | ice-blue | Stored as `crystal_color` named attribute |
| Roughness | Float | 0.04 | Stored as `crystal_roughness` named attribute |
| Emission | Float | 0.0 | Not yet wired to node — extend as needed |

## Node graph summary

```
GroupInput
  │
  ├── Cylinder Mesh (body)
  ├── Mesh Cone × 2 (tips) + TransformGeometry (position to Z offsets)
  │
  └── JoinGeometry → MergeByDistance → BevelMesh
                                              │
                                    SetShadeSmooth
                                              │
                               StoreNamedAttribute (color)
                                              │
                               StoreNamedAttribute (roughness)
                                              │
                                       GroupOutput
```

## Licence
All code: CC0 (public domain).  No external assets.

## See also
- [Tutorial page](/tutorials/blender-tutorial-gn-socket-groups-parametric-crystal-ui)
- [Blender Docs: Node Group Interface](https://docs.blender.org/api/current/bpy.types.NodeTreeInterface.html)

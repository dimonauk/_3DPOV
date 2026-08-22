# Modifier: Subdivision Surface — Crease Weights vs Bevel+Subsurf Stack (Blender 5.1)

**Topic**: modifiers · **Slug**: `modifier-subdivision-surface-crease-support-loops-webxr`
**Licence**: CC0 · **Blender**: 5.1

## What this demonstrates

Two approaches to keeping edges sharp on a Catmull-Clark subdivided mesh:

| Method | Mechanism | Pro | Con |
|--------|-----------|-----|-----|
| **Edge Crease** (Panel_A) | `crease_edge` float attr (0–1) locks the edge in the limit surface | One attribute per edge; zero extra geometry | Violates C2 continuity — shading kink visible under glancing directional light |
| **Bevel + Subsurf** (Panel_B) | Bevel modifier adds narrow parallel edges before Subsurf | Catmull-Clark continuous; clean normals under any light | Adds geometry; angle threshold needs tuning |

## Files

| File | Description |
|------|-------------|
| `blueprint.py` | Builds both panels and exports two GLBs |
| `record.py` | Orbiting camera render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar capture instructions |
| `subsurf_console_panel.blend` | Both panels with modifier stacks (output of blueprint.py) |
| `subsurf_console_panel_crease.glb` | Panel A at subsurf level 2, Draco 6, WebP |
| `subsurf_console_panel_bevel_subsurf.glb` | Panel B at subsurf level 2, Draco 6, WebP |

## Key parameters in blueprint.py

```python
CREASE_WEIGHT   = 0.90   # 1.0 = fully sharp; < 1.0 slightly softens the limit
BEVEL_WIDTH     = 0.018  # support-loop offset (m); smaller = tighter corner radius
BEVEL_SEGS      = 2      # 2 = rounder bevel arc than 1
BEVEL_ANGLE_DEG = 30.0   # only edges sharper than this threshold get bevelled
SUBSURF_VIEW    = 2      # viewport level during editing — keep ≤ 2 for speed
APPLY_LEVEL     = 2      # subdivision level baked into the GLB for WebXR
```

## Blender 5.1 migration note

Since Blender 4.1 the edge crease is a generic mesh attribute named `crease_edge`
(float, range 0–1), not the older `bpy.types.MeshEdge.crease` property. Set it in
scripts via the bmesh float layer (`bm.edges.layers.float`) or via Edit Mode →
Edge → Crease (Shift+E). The `bpy.ops.mesh.mark_crease()` operator still works in
interactive context but should not be used in headless scripts.

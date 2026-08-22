# Modifier Displace — Voronoi Texture-Driven Organic Surface
**Blender 5.1 · Category: modifiers · Difficulty: Beginner–Intermediate**

## What you build

A flattened UV sphere displaced by a Voronoi CELL_NOISE texture through the
Displace modifier, producing an organic coral-lump prop with ridge-and-valley
surface detail.  The non-destructive modifier stack gives live tuning of
Strength and noise_scale before a single-step Apply + GLB export.

## Why this approach instead of GN Set Position or Cycles displacement

| Approach | Live preview | GLB geometry | GPU cost | UV required |
|----------|-------------|-------------|----------|------------|
| **Modifier Displace** (this) | ✓ viewport | ✓ (export_apply) | low | no (NORMAL mode) |
| GN Set Position Noise | ✓ viewport | ✓ | medium | no |
| Cycles Shader Displacement | ✗ Cycles only | ✗ baked at render | high | yes |

The Displace modifier is the fastest iteration path: change Strength, the
viewport updates instantly.  No node tree, no shader graph, no baking.

## Key parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `SUBDIV_LEVELS` | 3 | Pre-Displace Catmull-Clark (3 ≈ 8k verts) |
| `VORONOI_SCALE` | 0.40 | Cell size — lower = finer bumps |
| `DISPLACE_STR` | 0.28 | Peak displacement in world units |
| `DISPLACE_MID` | 0.50 | Neutral level: 0.5 = symmetric in/out |

## Modifier stack order (critical)

```
[Displace]          ← applied second (reads subdivided vertices)
[Subdiv CC ×3]      ← applied first (multiplies vertex count ~8×)
[base UV sphere]
```

Bottom of the list = first to execute.  Reversing the order produces spiky
facets at low vertex count — the classic beginner mistake.

## File list

| File | Purpose |
|------|---------|
| `blueprint.py` | Build mesh + material + Voronoi tex + modifier stack + GLB export |
| `record.py` | Animate Strength 0→0.28 over 120 frames → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions for `screen.mp4` |
| `output/organic_coral_prop.glb` | Displaced mesh, Draco-compressed, Y-up |

## Troubleshooting

**GLB is a plain sphere**: `export_apply=True` was omitted.  The modifier is
not baked without it — the exporter strips live modifiers from the GLB.

**Spiky / faceted displacement**: SubDiv is either above Displace in the
stack, disabled, or at level 0.  Move SubDiv to the bottom; increase levels.

**Voronoi texture settings invisible**: the Texture Properties tab (chequered
icon) is context-sensitive — click the Displace modifier header first to make
it the active modifier, then switch tabs.

## External sources

- **njanakiev/blender-scripting** MIT · Nicolas Janakiev
  https://github.com/njanakiev/blender-scripting
  Covers bpy.data.textures.new(), modifier property assignment, and glTF
  export operator flags.

- **Maxivz/interactivetoolsblender** MIT · Maxivz
  https://github.com/Maxivz/interactivetoolsblender
  Reference for UV-mode texture_coords and uv_layer string property lookup.

# GN Attribute Statistic + Evaluate on Domain — Global-Normalised Face-Area Heat Map

**Blender 5.1 | CC0 | Topic: geometry-nodes**

Every face on a noise-displaced grid is coloured by its world-space area,
globally normalised to [0, 1] using **Attribute Statistic** so the full
colour ramp is always occupied regardless of mesh scale or displacement
amplitude.  Small, flat faces read cool blue; large, steep faces read warm
orange-red.  A second attribute (`vertex_heat`) is produced via **Evaluate on
Domain** to demonstrate cross-domain field re-evaluation and its hard-edge
semantics.

## Files

| File | Description |
|------|-------------|
| `blueprint.py` | Full bpy script — grid, GN modifier, material, GLB export |
| `record.py` | Viewport render — animates Noise_Strength 0 → 0.30 → 0 (90 frames) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen capture |
| `.expected-artefacts.json` | Artefact registry with cross-references |

## Running

```bash
# Build the .blend and .glb
blender --background --python blueprint.py

# Render the viewport animation (requires area_heat_map.blend)
blender area_heat_map.blend --background --python record.py
```

## Key nodes

| Node (UI name) | bpy type | Role |
|---|---|---|
| Attribute Statistic | `GeometryNodeAttributeStatistic` | Global min/max of face area |
| Evaluate on Domain | `GeometryNodeFieldOnDomain` | Re-evaluate face field at POINT domain |
| Map Range | `ShaderNodeMapRange` | Normalise area → 0..1 |
| Color Ramp | `ShaderNodeValToRGB` | 0..1 → RGBA colour |

## Important: Evaluate on Domain ≠ interpolation

`Evaluate on Domain(domain='FACE')` re-evaluates a face-domain field in
vertex context — each vertex samples its lowest-index adjacent face.  The
result has **hard edges**, not smooth gradients.  To produce a smooth
gradient between adjacent faces, apply `Blur Attribute` (1–2 iterations)
to `vertex_heat` after storing it.

## Tutorial

→ `/tutorials/blender-tutorial-gn-attribute-statistic-evaluate-on-domain`

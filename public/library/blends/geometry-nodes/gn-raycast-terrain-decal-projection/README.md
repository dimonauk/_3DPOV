# GN Raycast — Terrain Decal Projection

**Blender 5.1 · Geometry Nodes · CC0 · Holoflow Studio**

## What this does

`GeometryNodeRaycast` fires a directed ray from each source point and tests
intersection against a target geometry, returning the hit position, hit face
normal, and a boolean hit flag.

This blueprint projects a 15 × 15 grid of hexagonal stamp decals downward onto
an irregular sine-wave terrain, conforming each stamp to the surface:

1. **Snap** position to the exact hit point (`SetPosition ← Hit Position`).
2. **Orient** Z-axis to the terrain face normal (`AlignEulerToVector, axis=Z`).
3. **Gate** by slope — delete stamps where `dot(hit_normal, Z) < 0.35` (> 70°).
4. **Scale** by slope cosine — flat terrain → larger stamp; gentle slope → smaller.
5. **Colour-code** via a `stamp_col` vertex attribute: green → amber → red.

## Raycast vs Sample Nearest Surface

| | Raycast | Sample Nearest Surface |
|-|---------|----------------------|
| Search type | Directional (ray) | Omnidirectional |
| Returns | First intersection along ray | Closest point on surface |
| Source position | Any (default = InputPosition) | Any |
| Hit index | Yes | Yes |
| Attribute read | Yes (via Attribute socket) | Yes |
| Best for | Snap to ground, LOS queries | Stick to shape, attribute transfer |

## Why sine-wave terrain?

`mathutils.noise` is available in Blender's Python but produces different
results across platforms and Blender builds because it uses the seed from
`bpy.context.scene.cycles.seed`.  Sine-wave superposition is fully
deterministic across all platforms — the terrain always looks the same, making
this blueprint reproducible in CI-style automation.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds terrain + GN stamp modifier → `terrain_decal.blend` + `terrain_decal.glb` |
| `record.py` | 120-frame orbit render → `videos/.../viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `terrain_decal.blend` | Generated Blender scene |
| `terrain_decal.glb` | WebXR GLB (Draco 6, WebP, `stamp_col` vertex attribute) |

## Usage

```bash
# Build scene + GLB:
blender --background --python \
  public/library/blends/geometry-nodes/gn-raycast-terrain-decal-projection/blueprint.py

# Record orbit animation:
blender --background terrain_decal.blend --python \
  public/library/blends/geometry-nodes/gn-raycast-terrain-decal-projection/record.py
```

## Key Raycast sockets

| Socket | Type | Notes |
|--------|------|-------|
| Target Geometry | Geometry | The surface to test against |
| Source Position | Vector field | Ray origin per element (default = InputPosition) |
| Ray Direction | Vector | Must be normalised; `-Z` = straight down |
| Ray Length | Float | Max travel — set > scene bounding-box height |
| **Is Hit** | Boolean | False = ray missed (off terrain edge) |
| **Hit Position** | Vector | Feed to `SetPosition.Position` to snap |
| **Hit Normal** | Vector | Feed to `AlignEulerToVector.Vector` to orient |
| **Hit Index** | Int | Use with Field at Index for face-attribute transfer |

## Cross-references

- [GN Distribute Points on Faces](/tutorials/blender-tutorial-gn-distribute-points-faces-poisson-scatter) — Raycast terrain-snap is the natural follow-on to face-scatter
- [GN Store Named Attribute](/tutorials/blender-tutorial-gn-store-named-attribute-shader-data-bridge) — `stamp_col` storage + material bridge pattern
- [GN Field at Index](/tutorials/blender-tutorial-gn-field-at-index-edge-tangent-flow-map) — use Hit Index with Field at Index to read any attribute from the struck face
- [GN Geometry to Instance](/tutorials/blender-tutorial-gn-geometry-to-instance-multi-variant-prop-scatter) — multi-variant stamp picking via Pick Instance + Index Switch
- [GN Sample Grid](/tutorials/blender-tutorial-gn-sample-grid-volume-field-probe-lattice) — sibling positional-read node: Sample Grid reads volume fields; Raycast reads surface intersections

## Outside sources

| Source | Licence | Notes |
|--------|---------|-------|
| [Blender Manual — Raycast node](https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/sample/raycast.html) | CC-BY-SA 4.0 | Blender Foundation |
| [polygonrunway/blender-geometry-nodes-tutorials](https://github.com/polygonrunway/blender-geometry-nodes) | MIT | Polygon Runway; sibling: `blender-node-groups` |
| [KhronosGroup/glTF-Blender-IO](https://github.com/KhronosGroup/glTF-Blender-IO) | Apache-2.0 | Khronos Group — glTF exporter powering the GLB output |

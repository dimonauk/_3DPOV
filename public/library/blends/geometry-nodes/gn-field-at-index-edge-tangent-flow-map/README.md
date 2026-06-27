# GN Field at Index — Altitude Gradient Slope Map

**Blender 5.1 · CC0 · Holoflow Studio**

Demonstrates `GeometryNodeFieldAtIndex` — the intra-geometry indexed field lookup node.
Each mesh edge reads the noise-displaced altitude of both its endpoint vertices via
Field at Index (domain=POINT), computes the height difference, and stores a blue→white→red
slope colour per edge. Domain promotion (Evaluate on Domain: EDGE→POINT) feeds the shader.

## What this teaches

- **Field at Index vs Sample Index**: both access elements by integer index, but Field at
  Index stays *within* the current geometry context while Sample Index crosses geometry
  boundaries. Swapping them causes a socket-type mismatch because the geometry context
  disappears.
- **Edge Vertices + Field at Index** pattern: `Vertex Index 1 / 2` from Edge Vertices are
  EDGE-domain INT fields; feeding them to Field at Index (domain=POINT) performs a
  cross-domain attribute lookup for each edge — the only way to read arbitrary
  per-vertex attributes at mesh edge endpoints.
- **Two-store pattern**: store 'altitude' at POINT domain first, then Field at Index reads
  it. Without the first store, NamedAttribute would re-evaluate InputPosition.Z as a lazy
  field — not a materialised attribute — and Field at Index would read the wrong value.
- **Evaluate on Domain** (GeometryNodeFieldOnDomain): EDGE-stored colour cannot reach
  the vertex shader directly; this node re-evaluates the EDGE-domain attribute in
  POINT context, averaging the colours of adjacent edges per vertex.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy script — creates IcoSphere, GN tree, material, exports GLB |
| `record.py` | Orbiting camera animation → viewport.mp4 |
| `README.md` | This file |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | CI manifest |

## Running

```bash
blender --background --python blueprint.py
# output/edge_flow_sphere.glb
blender --background edge_flow_sphere.blend --python record.py
# videos/geometry-nodes/gn-field-at-index-edge-tangent-flow-map/viewport.mp4
```

## Key parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `ICO_SUBDIVISIONS` | `2` | 42 verts, 120 edges |
| `NOISE_SCALE` | `1.60` | Noise frequency; higher = tighter altitude variation |
| `NOISE_STRENGTH` | `0.22` | Peak displacement amplitude (metres) |
| `GRAD_MAX` | `0.18` | MapRange cap; tune to match displacement amplitude |

## Cross-references

- Studio tutorial: [GN Sample Index — Echo-Grid Interference](/tutorials/blender-tutorial-gn-sample-index-echo-grid)
- Studio tutorial: [GN Attribute Statistic + Evaluate on Domain](/tutorials/blender-tutorial-gn-attribute-statistic-evaluate-on-domain)
- Studio tutorial: [GN Mesh Topology — Vertex Valence Heat Map](/tutorials/blender-tutorial-gn-mesh-topology-vertex-valence-heat-map)

## Licence

CC0 — no rights reserved. Do whatever you like with this.

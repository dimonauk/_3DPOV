# GN Interpolate Domain — Face Random Hue + Toon Lighting → Vertex Colour

**Blender 5.1 · Geometry Nodes · CC0 · Holoflow Studio**

## What this does

Demonstrates `GeometryNodeFieldOnDomain` — the GN **Interpolate Domain** node —
to transfer data across mesh topology domains within a single modifier evaluation.

| Pass | Source domain | Target domain | Result |
|------|--------------|---------------|--------|
| Random hue | FACE | POINT (via FieldOnDomain) | Each vertex blends adjacent faces' hues — watercolour gradient |
| Toon lighting | FACE (face normals) | POINT (via FieldOnDomain) | Unweighted smooth normal for cel-shade dot product |

The two passes combine: shadow colour on dark sides, per-face hue on lit sides.
Output is a `BYTE_COLOR` vertex attribute (`toon_col`) in the GLB.

## Why Interpolate Domain and not InputNormal directly?

| Approach | Result |
|----------|--------|
| `InputNormal` in POINT context | Blender angle-WEIGHTED vertex normal |
| `FieldOnDomain(FACE)` → POINT | UNWEIGHTED average of adjacent face normals |

For cel-shading, the unweighted average avoids over-darkening near acute-angle
faces, producing a more intentionally "painted" gradient.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Headless scene build + GLB export (run with `blender --background`) |
| `record.py` | 8-second viewport animation render (runs after blueprint) |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | Canonical output list for CI validation |

## Run

```bash
blender --background --python blueprint.py
blender --background --python record.py
```

## Cross-references

- Tutorial page: `/tutorials/blender-tutorial-gn-interpolate-domain-face-normal-vertex-colour-toon`
- Related: GN Store Named Attribute → Shader Data Bridge
- Related: GN Capture Attribute → Named Attribute
- Related: GN Corners of Vertex — Topology Domain Navigation

# GN Curve Arc — Parametric Dial Gauge for WebXR HUD

**Blender 5.1** · geometry-nodes · CC0

Builds a fully procedural dial gauge from three `GeometryNodeCurveArc` nodes:
an outer border ring, a value-driven progress sector, and evenly-spaced tick marks.
The gauge reading is exposed as a `Value` group input socket (0–1) and can be
keyframed, driven, or fed from a WebXR sensor in Three.js.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds the full scene and exports `dial_gauge.glb` |
| `record.py` | Keyframes Value 0→1→0.65 and renders `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the walkthrough recording |
| `.expected-artefacts.json` | CI manifest of expected output files |

## Usage

```bash
blender --background --python blueprint.py
```

Then open Blender, load the saved `.blend`, and run `record.py` from the
Text Editor to produce the viewport animation.

## Key Nodes

- `GeometryNodeCurveArc` (RADIUS mode) — the core primitive
- `connect_center = True` — creates a pie-slice spline for the sector
- `GeometryNodeFillCurve` + `GeometryNodeExtrudeMesh` — sector depth
- `GeometryNodeResampleCurve` (COUNT) + `GeometryNodeInstanceOnPoints` — ticks

## Tutorial

`/tutorials/blender-tutorial-gn-curve-arc-dial-gauge-webxr-hud`

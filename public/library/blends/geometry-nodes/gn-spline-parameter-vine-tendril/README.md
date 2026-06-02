# GN Spline Parameter — Procedural Vine Tendril

**Blender 5.1 | CC0 | Holoflow Studio**

Procedural vine cluster driven entirely by `SplineParameter.Factor` — a
float from 0 to 1 along each spline that controls stem taper, leaf density,
and tip instancing without any manual UV unwrap or per-vertex painting.

---

## What this builds

Five Bezier tendril strands converted to tapered hexagonal-profile tubes via
Curve to Mesh, with diamond-shaped leaf instances placed only where the
Spline Parameter Factor exceeds a user-controllable threshold.  The entire
geometry is live and non-destructive: adjusting the Bezier control points or
the `Leaf Threshold` modifier socket rebuilds the vine in real time.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Headless build: curves, GN tree, materials, .blend save, GLB export |
| `record.py` | Viewport animation: keyframes `Leaf Threshold` 0.50→0.80→0.50 |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for the screen.mp4 recording |
| `vine_tendril.blend` | Saved by `blueprint.py` |
| `vine_tendril.glb` | Draco-compressed GLB saved by `blueprint.py` |

---

## Run

```bash
# Build + export GLB
blender --background --python blueprint.py

# Render viewport animation (requires vine_tendril.blend from above)
blender --background vine_tendril.blend --python record.py
```

---

## Key technique: StoreNamedAttribute before branching

`SplineParameter` is a **curve-domain field**.  After `CurveToPoints` the
domain changes from CURVE/POINT to POINT (different context), and the GN
field output socket from `SplineParameter` evaluates to 0 in that new
context.

**Fix**: freeze the field first with `StoreNamedAttribute(name="vine_t",
domain=POINT)` placed on the resampled curve.  Then read it back in any
downstream context — including the `CurveToPoints` output — with
`InputNamedAttribute(name="vine_t")`.

This named-attribute round-trip is the canonical pattern for sharing a
field value across geometry domain boundaries in Blender 5.1.

---

## ResampleCurve is mandatory

Bezier control points are **not uniformly spaced** in arc-length parameter.
Points cluster near handles and spread in open sections.  Without
`ResampleCurve(COUNT=64)`, the `vine_t` ladder is non-linear and leaves
cluster unevenly.  Resampling gives equal-arc-length points and a clean
linear 0 → (N−1)/N factor ladder.

Note: the last point is at `(N−1)/N = 63/64 ≈ 0.984`, not exactly 1.0.
Set `LEAF_THRESHOLD < 0.984` to include the near-tip segment.

---

## Modifier socket key

The `Leaf Threshold` group socket is keyframed via `mod["Input_2"]` in
`record.py`.  The `"Input_2"` key corresponds to the first non-Geometry
interface socket in the GN tree.  If you add or reorder sockets in the
Geometry Nodes editor, update this key accordingly — check the modifier
panel's RNA path inspector (`Ctrl+Alt+U` on the socket value).

---

## GLB notes

- `export_apply=True` is mandatory: runtimes (Three.js, Babylon.js, model-viewer)
  do not evaluate GN modifiers.  The GLB must contain realised mesh geometry.
- Draco level 6 + WebP textures give the best size/quality ratio for studio use.
- The leaf instances are realised into mesh faces: expect ~3× vertex count
  inflation vs the Blender count due to per-leaf UV splitting in the exporter.
- The `vine_t` named attribute is **not** exported by default.  Add
  `export_attributes=True` to the `gltf` call if you need it as `_VINE_T`
  in the glTF accessor for a custom shader.

---

## Licence

CC0 — public domain.  Use freely.
Tutorial source: Holoflow Studio — https://holoflow.co.uk

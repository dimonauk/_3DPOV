# GN Curve to Mesh — Trim, Tilt & Radius Ramp: Light Ribbon

**Blender version**: 5.1 | **Topic**: Geometry Nodes — Curve operations
**Licence**: CC0 1.0 Universal | **Studio**: Holoflow

---

## What this does

A Bezier S-curve is extruded into a faceted tube with four simultaneous
operations:

- **Radius ramp** (`SetCurveRadius`): the tube tapers from 6 cm at the base
  to 1.6 cm at the tip. `SplineParameter.Factor` drives a `MapRange` node
  before any trimming so the taper profile is encoded in the curve's point
  data and survives clipping.
- **Tilt twist** (`SetCurveTilt`): the octagonal cross-section spins
  `Tilt_Turns × 360°` end-to-end, giving a spiral appearance without any
  geometry deformation — it is purely a profile-orientation instruction to
  `CurveToMesh`.
- **Trim** (`TrimCurve`, FACTOR mode): a [0,1] pair of modifier inputs
  controls which portion of the spline is visible. Animating Trim End
  from 0 to 1 grows the ribbon from base to tip — a clean parametric reveal
  requiring zero Simulation Zone or physics bake.
- **Arc-length resample** (`ResampleCurve`): applied after trimming so
  vertices are evenly spaced on exactly the visible portion. A second
  `SplineParameter` after resample stores `ribbon_t` (0..1) as a named
  attribute for the indigo→amber emission colour ramp in the material.

`CurveToMesh` extrudes an octagonal (`PROFILE_VERTS = 8`) unit-radius circle
profile scaled per-point by the baked radius attribute. `Fill Caps = True`
caps both open ends. The result is a single object, single draw call, GLB-
ready for WebXR.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds the GN tree + emission material via the bpy data API |
| `record.py` | Keyframes Trim End 0→1 and renders a viewport MP4 |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for the `screen.mp4` capture |
| `.expected-artefacts.json` | CI manifest of expected output files |

---

## Usage

1. Open Blender 5.1 → **Scripting** workspace.
2. Load `blueprint.py` → **Run Script** (`Alt+P`).
3. Switch to **Layout** → select `hf_light_ribbon` → inspect modifier inputs.
4. Optional: run `record.py` (with the `.blend` saved) to generate
   `viewport.mp4`.
5. Export: File → Export → glTF 2.0 — Apply Modifiers ON, Draco L6, WebP,
   +Y Up.

---

## Key learning points

- `TrimCurve` FACTOR mode: Start and End are normalised arc-length fractions.
  The node outputs a curve with the same attributes (radius, tilt) as the
  input — it does not destroy per-point data.
- Ordering matters: `SetCurveRadius` and `SetCurveTilt` before `TrimCurve`
  preserves the intended profile on any trimmed sub-segment.
- `ResampleCurve` after trim: Bezier spacing is non-uniform. Resampling
  redistributes points by equal arc-length, preventing texture stretching
  near the inflection point of the S-curve.
- `ribbon_t` stored after resampling: the post-resample `SplineParameter`
  gives evenly distributed 0..1 values so the colour gradient is visually
  linear along the tube, not bunched at the Bezier control points.

---

## External sources

- Blender Foundation — GN Curve Nodes manual, CC-BY-SA 4.0:
  https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/curve/
- Khronos Group — glTF 2.0 Specification, Apache-2.0:
  https://github.com/KhronosGroup/glTF

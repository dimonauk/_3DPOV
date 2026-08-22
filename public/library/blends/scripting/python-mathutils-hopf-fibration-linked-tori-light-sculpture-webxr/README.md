# Hopf Fibration: S³→S² Bundle Projection, Clifford Parallels & Linked-Torus Light Sculpture

**Blender 5.1 · Python mathutils · CC0**

## What this builds

A 3D light sculpture of 72 interlocked, colour-coded circles — the Hopf fibres — exported
as a Draco-compressed WebXR GLB. Each circle corresponds to a point on S² via the
Hopf fibration map η: S³ → S². Any two circles in the set are linked (linking number ±1),
a property provable from the U(1)-bundle structure alone.

## Files

| File | Description |
|------|-------------|
| `blueprint.py` | Main build script. Run once in Blender 5.1 Scripting workspace. |
| `record.py` | Viewport animation recorder. Run after blueprint.py. |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for the tutorial screen recording. |
| `.expected-artefacts.json` | CI manifest of expected output files. |

## Quick start

1. Open Blender 5.1 and save the file to this directory so `//hf_hopf_fibration.glb` resolves.
2. Open `blueprint.py` in the Scripting workspace and press ▶ Run Script.
3. The console prints `N fibres → hf_hopf_fibration.glb`. The sculpture appears in the viewport.
4. Open `record.py` and press ▶ Run Script to generate `viewport.mp4`.

## Mathematical background

The **Hopf fibration** (Heinz Hopf, 1931) is the first discovered non-trivial principal bundle.
It maps the 3-sphere S³ ⊂ ℂ² to the 2-sphere S² via:

```
η(z₁, z₂) = (2z₁z̄₂,  |z₁|² − |z₂|²)  ∈  S² ⊂ ℝ³
```

The preimage η⁻¹(n̂) of each point n̂ ∈ S² is a circle (S¹) in S³, called a **Hopf fibre**.
Any two fibres are either identical or interlinked with linking number ±1; they are
**Clifford parallels** — the S³ analogue of parallel lines.

Under **stereographic projection** π: S³ → ℝ³ from the south pole (0,0,0,−1):

```
π(a, b, c, d) = (a, b, c) / (1 + d)
```

the fibre circles become ordinary Euclidean circles in ℝ³. They fill nested tori centred on
the z-axis — the inner tori correspond to base points near the north pole of S², and the outer
tori to base points near the south pole.

## Colour coding

Fibre colour encodes the latitude (z-coordinate) of the base point on S²:

| Latitude zone | Colour | Hue |
|---------------|--------|-----|
| z ≈ +1 (north pole) | Gold | 0.13 |
| z ≈ 0 (equator) | Cyan | 0.50 |
| z ≈ −0.7 (near south) | Violet | 0.78 |

## Studio cross-references

- Tutorial: `/tutorials/blender-tutorial-python-mathutils-torus-knot-pq-winding-parallel-transport-tube-webxr`
- Tutorial: `/tutorials/blender-tutorial-python-mathutils-mobius-strip-ntwist-parametric-mesh-webxr`
- Tutorial: `/tutorials/blender-tutorial-python-bmesh-ops-geodesic-sphere-icosahedron-frequency-subdivision-vrm-webxr`

## External sources

- Heinz Hopf, "Über die Abbildungen der dreidimensionalen Sphäre auf die Kugelfläche" (1931) — public domain
- njanakiev/blender-scripting — MIT — Nicolas Janakiev — https://github.com/njanakiev/blender-scripting
- KhronosGroup/glTF-Blender-IO — Apache-2.0 — Khronos Group — https://github.com/KhronosGroup/glTF-Blender-IO

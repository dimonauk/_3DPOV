# python-numpy-spherical-harmonics-real-sh-shape-keys-atomic-orbital-webxr

Blender 5.1 · Python numpy · scripting · CC0

## What this builds

An ico-sphere with ten Blender **shape keys**, each encoding one real
spherical harmonic mode Y_l^m for l ∈ {1, 2, 3}.  Dragging a shape key
slider deforms the unit sphere into the corresponding atomic orbital — p_z,
d_z², d_x²-y², f_z³, and so on.  The mesh exports as a Draco-compressed
WebXR GLB with all morph targets intact for Three.js / A-Frame animation.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Build mesh + shape keys + export (run in Scripting workspace) |
| `record.py` | Animated viewport render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar capture instructions for `screen.mp4` |
| `hf_sh_orbitals.glb` | Generated GLB — not committed; produce by running blueprint.py |

## Mathematics

Real spherical harmonics Y_l^m(θ, φ) are eigenfunctions of the Laplace–Beltrami
operator on S²:

```
ΔS² Y_l^m = −l(l+1) Y_l^m
```

They form an orthonormal basis:

```
∫₀^π ∫₀^{2π} Y_l^m(θ,φ) Y_{l'}^{m'}(θ,φ) sinθ dθ dφ = δ_{ll'} δ_{mm'}
```

The real (tesseral) form avoids complex numbers:

```
Y_l^m =  √2 K cos(mφ) P_l^m(cosθ)   (m > 0)
Y_l^0 =     K          P_l^0(cosθ)   (m = 0)
Y_l^m =  √2 K sin(|m|φ) P_l^|m|(cosθ) (m < 0)
```

where K = √[(2l+1)/(4π) · (l−|m|)! / (l+|m|)!]

Associated Legendre polynomials P_l^m are computed via the **Bonnet recurrence**,
which avoids calling scipy and is numerically stable for l ≤ 10.

## Blender 5.1 API notes

- `bmesh.ops.create_icosphere(subdivisions=4)` → 642 verts, 1280 triangles.
- `bpy.types.Mesh.attributes.new(type="FLOAT", domain="POINT")` stores a per-vertex scalar without needing an image texture.
- `bpy.types.ShapeKey.data.foreach_set("co", arr)` is the fast bulk-write path; avoid iterating `sk.data[i].co` in Python loops.
- The `ShaderNodeAttribute` node reads the named `"sh_value"` float attribute as a `Fac` output usable by `ValToRGB`.

## Outside sources

- **Blender Python API 5.1 — bmesh module** — CC-BY-SA-4.0 — Blender Foundation  
  https://docs.blender.org/api/5.1/bmesh.html
- **NumPy — Reference: numpy.fft and array operations** — BSD-3-Clause — NumPy Contributors  
  https://numpy.org/doc/stable/reference/
- **KhronosGroup / glTF-Blender-IO — GLB export pipeline** — Apache-2.0 — Khronos Group  
  https://github.com/KhronosGroup/glTF-Blender-IO

"""
Quaternion Julia Set: 4D ℍ Orbit Dynamics, z-Hyperplane Section Sweep
& Smooth-Iteration Height-Field Shape Keys for WebXR — Blender 5.1

Technique
─────────
Hamilton's quaternion algebra ℍ = ℝ⁴ carries a genuine normed-division-algebra
structure: i²=j²=k²=ijk=−1, with non-commutative multiplication.  Iterating
f_c(z) = z² + c over ℍ produces a 4D filled Julia set K(c).

The map z = (a, b, c_j, d) satisfies:
    z² = (a²−b²−c_j²−d², 2ab, 2ac_j, 2ad)

because all i/j/k cross terms cancel pairwise from anticommutativity.  Unlike
the Mandelbulb's ad-hoc triplex formula, this is exact quaternion algebra.

Setting d=0 for all starting points restricts attention to the hyperplane
   Π_t = { x + yi + t·j + 0·k : x,y ∈ ℝ }
If also C_W=0, the k-component of z² is 2ad=0 — so this subspace is INVARIANT
under the dynamics.  The (x,y) picture at t=0 is exactly the classical complex
Julia set.  As t increases, the cross-section fragments and shrinks, ending in
isolated dust near |t|≈1.  Five shape keys sweep this evolution.

Smooth colouring (Linas Vepstas, 2000):
    μ = n + 1 − log₂(log₂|z_n|)
removes integer banding by subtracting the fractional overshoot above the
escape radius.  Divided by MAX_ITER it maps to [0,1] regardless of resolution.
"""

import bpy
import bmesh
import numpy as np
from pathlib import Path

# ── PARAMETERS ───────────────────────────────────────────────────────────────
RES_X, RES_Y  = 192, 96         # mesh vertices along x and y
DOMAIN_X      = (-1.55, 1.55)   # real (x) axis extent
DOMAIN_Y      = (-1.00, 1.00)   # imaginary (y) axis extent
MAX_ITER      = 24              # iteration depth — higher → sharper boundary
ESCAPE_R2     = 4.0 ** 2        # escape when |z|² > ESCAPE_R2
# c = −0.2 + 0.6i : inside the quaternion Mandelbrot set → connected Julia set
# with dramatic dendritic tendrils visible from the exterior
C = np.array([-0.2, 0.6, 0.0, 0.0], dtype=np.float32)
# j-axis slice values for shape keys; t=0 reduces to the complex Julia set
Z_SLICES      = [0.00, 0.30, 0.55, 0.75, 0.92]
HEIGHT_SCALE  = 0.50            # smooth_iter / MAX_ITER → mesh Z
INTERIOR_Z    = -0.12           # Z height for points inside the Julia set
MESH_NAME     = "hf_qjulia"
GLB_OUT       = "hf_qjulia.glb"


# ── QUATERNION KERNEL ─────────────────────────────────────────────────────────
def qsq_plus_c(z: np.ndarray) -> np.ndarray:
    """Return z² + C for a (...,4) array of quaternions.

    WHY the exact formula (a²−b²−c²−d², 2ab, 2ac, 2ad):
    Expanding (a+bi+cj+dk)² using i²=j²=k²=−1, ij=k, ik=−j, jk=i:
      real: a²  + b²(i²) + c²(j²) + d²(k²) = a²−b²−c²−d²
      i:    2ab (from a·bi + bi·a, since bi·a = ab·i too)
      j:    2ac (same pattern — cross terms ik and ki cancel)
      k:    2ad (cross terms ij and ji cancel)
    This is exact, not a spherical-coordinate approximation like the Mandelbulb.
    """
    a, b, c, d = z[..., 0], z[..., 1], z[..., 2], z[..., 3]
    return np.stack([
        a * a - b * b - c * c - d * d + C[0],
        2.0 * a * b                   + C[1],
        2.0 * a * c                   + C[2],
        2.0 * a * d                   + C[3],
    ], axis=-1)


# ── SMOOTH COLOURING PER SLICE ────────────────────────────────────────────────
def compute_slice(t: float) -> np.ndarray:
    """Smooth-iteration height field on the Π_t hyperplane.

    Starting points: z = (x, y, t, 0) — w (k) component is always zero.
    Because C[3]=0, the k-component of z²+C is 2ad+0=0 for all iterations,
    so the dynamics never leave this subspace.  Exact 3D cross-section.

    Returns (RES_X * RES_Y,) array scaled to mesh Z coordinates.
    """
    xs = np.linspace(*DOMAIN_X, RES_X, dtype=np.float32)
    ys = np.linspace(*DOMAIN_Y, RES_Y, dtype=np.float32)
    X, Y = np.meshgrid(xs, ys, indexing='ij')   # (RES_X, RES_Y)

    z = np.zeros((RES_X, RES_Y, 4), dtype=np.float32)
    z[..., 0] = X
    z[..., 1] = Y
    z[..., 2] = t                                # j-component = slice param

    escaped = np.zeros((RES_X, RES_Y), dtype=bool)
    smooth  = np.full((RES_X, RES_Y), INTERIOR_Z / HEIGHT_SCALE, dtype=np.float32)
    r2 = (z * z).sum(-1)

    for n in range(MAX_ITER):
        newly = (~escaped) & (r2 > ESCAPE_R2)
        if newly.any():
            # clamp log argument — rounding near escape radius can dip to 1.0+ε
            r_hit = np.sqrt(r2[newly].clip(1.001))
            lr    = np.log2(r_hit)
            smooth[newly] = (n + 1.0 - np.log2(np.maximum(lr, 1e-6))) / MAX_ITER
            escaped |= newly
        if escaped.all():
            break
        mask = ~escaped
        z[mask] = qsq_plus_c(z[mask])
        r2[mask] = (z[mask] * z[mask]).sum(-1)

    height = np.clip(smooth, -1.0, 1.0) * HEIGHT_SCALE
    return height.ravel()   # (RES_X * RES_Y,)


# ── MESH CONSTRUCTION ─────────────────────────────────────────────────────────
def build_mesh(z_basis: np.ndarray):
    """Create a RES_X × RES_Y quad plane with z_basis as the Basis shape.
    Uses from_pydata for speed — avoids bpy.ops context requirements.
    Returns (bpy.types.Object, bpy.types.Mesh).
    """
    for name in (MESH_NAME,):
        if name in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)
        if name in bpy.data.meshes:
            bpy.data.meshes.remove(bpy.data.meshes[name])

    xs = np.linspace(*DOMAIN_X, RES_X, dtype=np.float32)
    ys = np.linspace(*DOMAIN_Y, RES_Y, dtype=np.float32)
    X, Y = np.meshgrid(xs, ys, indexing='ij')
    verts = np.column_stack([X.ravel(), Y.ravel(), z_basis])

    # Quad index grid: each interior cell → 4 vertex indices
    idx = np.arange(RES_X * RES_Y, dtype=np.int32).reshape(RES_X, RES_Y)
    i0 = idx[:-1, :-1].ravel()
    i1 = idx[1:,  :-1].ravel()
    i2 = idx[1:,  1:].ravel()
    i3 = idx[:-1, 1:].ravel()
    faces = np.column_stack([i0, i1, i2, i3])

    mesh = bpy.data.meshes.new(MESH_NAME)
    mesh.from_pydata(verts.tolist(), [], faces.tolist())
    mesh.update()
    obj = bpy.data.objects.new(MESH_NAME, mesh)
    bpy.context.collection.objects.link(obj)
    return obj, mesh


def add_shape_key(obj, label: str, z_vals: np.ndarray) -> None:
    """Add a shape key to obj displacing only the Z coordinate.
    WHY from_mix=False: avoids blending active shape into the new key's rest pose.
    """
    sk = obj.shape_key_add(name=label, from_mix=False)
    mesh = obj.data
    for i, v in enumerate(mesh.vertices):
        sk.data[i].co = (v.co.x, v.co.y, float(z_vals[i]))


# ── VERTEX COLOURS ────────────────────────────────────────────────────────────
def assign_vcols(mesh, h_vals: np.ndarray) -> None:
    """Map height values to 'orbit_depth' colour attribute.
    Palette: interior (INTERIOR_Z) → deep indigo; mid-escape → amber;
             fast-escape (close to HEIGHT_SCALE) → pale cyan.
    Three.js reads COLOR_0 from GLB without any extra material setup.
    """
    vc = mesh.color_attributes.new("orbit_depth", "FLOAT_COLOR", "POINT")
    lo, hi = h_vals.min(), h_vals.max()
    vals = (h_vals - lo) / max(hi - lo, 1e-8)
    for i, t in enumerate(vals.tolist()):
        if t < 0.18:       # deep interior — violet
            r = 0.06 + 0.20 * t / 0.18
            g = 0.00 + 0.04 * t / 0.18
            b = 0.22 + 0.55 * t / 0.18
        elif t < 0.65:     # mid band — amber/gold
            s = (t - 0.18) / 0.47
            r = 0.26 + 0.64 * s
            g = 0.14 + 0.55 * s
            b = 0.04 * (1.0 - s)
        else:              # fast-escape rim — cyan / white
            s = (t - 0.65) / 0.35
            r = 0.90 + 0.10 * s
            g = 0.82 + 0.18 * s
            b = 0.40 + 0.60 * s
        vc.data[i].color = (r, g, b, 1.0)


# ── EXPORT ────────────────────────────────────────────────────────────────────
def export_glb(obj) -> None:
    """Export selected object as Draco-compressed GLB to the blend file's directory."""
    out = Path(bpy.path.abspath("//")) / GLB_OUT
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=str(out),
        use_selection=True,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_colors=True,
        export_morph=True,
        export_apply=True,
    )
    print(f"[qjulia] Exported → {out}")


# ── MAIN ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("[qjulia] Computing quaternion Julia slices …")
    slices = [compute_slice(t) for t in Z_SLICES]

    print("[qjulia] Building mesh from t=0 basis …")
    obj, mesh = build_mesh(slices[0])

    print("[qjulia] Adding basis shape key …")
    bpy.context.view_layer.objects.active = obj
    obj.shape_key_add(name="Basis")

    print("[qjulia] Adding z-sweep shape keys …")
    for t, h in zip(Z_SLICES[1:], slices[1:]):
        add_shape_key(obj, f"z={t:.2f}", h)

    print("[qjulia] Assigning vertex colours …")
    assign_vcols(mesh, slices[0])

    print("[qjulia] Exporting GLB …")
    export_glb(obj)
    print("[qjulia] Done.")

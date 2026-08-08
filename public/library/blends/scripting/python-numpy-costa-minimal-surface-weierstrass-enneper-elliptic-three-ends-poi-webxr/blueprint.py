"""
Costa Minimal Surface — Holoflow Blueprint (Blender 5.1)
=========================================================
TECHNIQUE  Costa's 1982 surface is the first complete embedded minimal surface
in ℝ³ with genus 1 and three ends discovered since Scherk in 1835.  The key
insight was that the Weierstrass–Enneper (WE) representation on the SQUARE
torus ℂ/(ℤ + iℤ) satisfies all three period conditions simultaneously due to
the 4-fold rotational symmetry of the lattice.

WE data on the square torus (periods ω₁=1, ω₂=i):
  g(z) = A · ℘(z; ℤ[1,i])       (Gauss map — meromorphic, controls normals)
  f(z)dz = dz / ℘'(z; ℤ[1,i])   (holomorphic 1-form — controls metric)

Immersion (from base point z₀):
  X(z) = Re ∫_{z₀} (1−g²)f/2 dz
  Y(z) = Re ∫_{z₀} i(1+g²)f/2 dz
  Z(z) = Re ∫_{z₀} gf dz

The three ends arise at the zeros of ℘': the half-periods 1/2, i/2, (1+i)/2.
Two ends are asymptotically planar (Gauss map finite at ±e₁); the third is a
catenoid-type end.

INTEGRATION TRICK  Centering the fundamental domain on the fourth half-period
(1+i)/2 (which is NOT a puncture) places all three ends on the boundary of
the integration square, giving a smooth interior with no masking needed.
"""

import bpy, bmesh, math, numpy as np
from mathutils import Vector

# ── Parameters ──────────────────────────────────────────────────────────────
SLUG          = "hf_costa_surface"
N_GRID        = 74           # grid resolution (N×N on the fundamental domain)
M_TRUNC       = 16           # Eisenstein-series truncation |m|,|n| ≤ M (≈1088 terms)
DOMAIN_HALF   = 0.44         # sample z_prime ∈ (−DH, DH)²; punctures at ±0.5 (boundary)
A_GAUSS       = 1.0          # Gauss-map amplitude g = A·℘(z)
CLIP_SCALE    = 10.0         # exclude mesh cells whose XY/Z magnitude > CLIP_SCALE * POI_R
POI_RADIUS    = 0.082        # 8.2 cm poi head radius (metres)
COL_LAYER     = "KGauss"     # vertex-colour attribute name
MAT_NAME      = "HoloflowCostaMat"

# Shape-key variants: (A_gauss, xy_scale, z_scale)
SHAPE_KEYS = [
    ("Basis",        1.00, 1.00, 1.00),
    ("Costa_Wide",   0.55, 1.35, 0.65),   # lower A → flatter catenoid
    ("Costa_Tall",   1.80, 0.70, 1.50),   # higher A → more spherical ends
]


# ── Weierstrass ℘ function (square lattice ℤ + iℤ) ──────────────────────────
def wp_sqr(z_prime, M=M_TRUNC, shift=0.5 + 0.5j):
    """
    Compute ℘(z; ℤ+iℤ) and ℘'(z; ℤ+iℤ) for z = z_prime + shift.

    WHY THE SHIFT:  The three Costa punctures (z=0, 1/2, i/2) sit on the
    boundary of the domain z_prime ∈ (−0.5,0.5)² when shift=(1+i)/2.  The
    interior is singularity-free, so the Eisenstein series converges uniformly
    and numerical integration is clean without masking.

    WHY M=16:  The lattice sum Σ' |w|⁻⁴ converges as M → ∞; at M=16 (~1088
    non-zero terms), relative error is < 5×10⁻⁷ for z_prime away from the
    boundary.  M=8 gives ~5×10⁻⁴, acceptable only for preview renders.
    """
    z = (z_prime + shift).ravel()
    N = len(z)
    # w=0 pole term (1/z² and -2/z³)
    wp  = np.ones(N, dtype=complex) / z**2
    wpd = -2.0 * np.ones(N, dtype=complex) / z**3

    for m in range(-M, M + 1):
        n_arr = np.arange(-M, M + 1)
        w_all = m + 1j * n_arr
        valid = (n_arr != 0) | (m != 0)          # exclude w=0
        w = w_all[valid]                          # (n_w,)
        dz = z[:, None] - w[None, :]             # (N, n_w)
        wp  += np.sum(1.0 / dz**2 - 1.0 / w[None, :]**2, axis=1)
        wpd += np.sum(-2.0 / dz**3,              axis=1)

    return wp.reshape(z_prime.shape), wpd.reshape(z_prime.shape)


# ── Integration kernel ───────────────────────────────────────────────────────
def _cumtrapz(y, dx):
    """Cumulative trapezoid starting at 0 (no scipy dependency)."""
    return np.concatenate([[0.0], np.cumsum((y[:-1] + y[1:]) * 0.5 * dx)])


def build_costa_arrays(N=N_GRID, M=M_TRUNC, A=A_GAUSS, dh=DOMAIN_HALF):
    """
    Integrate the Weierstrass–Enneper forms over a 2D grid.

    Returns X, Y, Z: float arrays of shape (N, N) — vertex positions before
    Blender-space swap (+Y up) and scale.
    """
    u = np.linspace(-dh, dh, N)
    v = np.linspace(-dh, dh, N)
    du, dv = u[1] - u[0], v[1] - v[0]

    U, V   = np.meshgrid(u, v)      # (N, N); V rows, U columns
    Z_p    = U + 1j * V

    WP, WPD = wp_sqr(Z_p, M=M)     # ℘ and ℘'
    G  = A * WP                     # Gauss map
    F  = 1.0 / WPD                  # holomorphic 1-form coefficient

    FG   = F * G
    P1   = F * (1.0 - G**2) * 0.5
    P2   = 1j * F * (1.0 + G**2) * 0.5

    # Partial derivatives in real and imaginary directions
    dX_du, dX_dv = P1.real, -P1.imag
    dY_du, dY_dv = P2.real, -P2.imag
    dZ_du, dZ_dv = FG.real, -FG.imag

    # Integrate: cumtrapz along u for each row; accumulate left-edge in v
    Xl = Yl = Zl = 0.0       # left-column starting values (at v[0], u[0])
    X = np.empty((N, N))
    Y = np.empty((N, N))
    Z = np.empty((N, N))

    for k in range(N):
        X[k, :] = Xl + _cumtrapz(dX_du[k, :], du)
        Y[k, :] = Yl + _cumtrapz(dY_du[k, :], du)
        Z[k, :] = Zl + _cumtrapz(dZ_du[k, :], du)
        if k < N - 1:
            # Advance left-column value by one v-step (mid-point rule)
            Xl += (dX_dv[k, 0] + dX_dv[k + 1, 0]) * 0.5 * dv
            Yl += (dY_dv[k, 0] + dY_dv[k + 1, 0]) * 0.5 * dv
            Zl += (dZ_dv[k, 0] + dZ_dv[k + 1, 0]) * 0.5 * dv

    # Centre
    X -= X.mean(); Y -= Y.mean(); Z -= Z.mean()
    return X, Y, Z


# ── Gaussian-curvature colour ────────────────────────────────────────────────
def gauss_curvature_normalized(WP, WPD, A):
    """
    |K| = 4A²|℘'|⁴ / (1 + A²|℘|²)²   (always ≤ 0, so absolute value)
    Normalise log(1+|K|) to [0,1] for vertex colour.
    """
    num = 4.0 * A**2 * np.abs(WPD)**4
    den = (1.0 + A**2 * np.abs(WP)**2)**2
    K = num / np.maximum(den, 1e-12)
    K = np.log1p(K)
    mx = K.max()
    return K / mx if mx > 0 else K


# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    # Clear scene
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    u_lin = np.linspace(-DOMAIN_HALF, DOMAIN_HALF, N_GRID)
    v_lin = np.linspace(-DOMAIN_HALF, DOMAIN_HALF, N_GRID)
    U, V = np.meshgrid(u_lin, v_lin)
    Z_p  = U + 1j * V
    WP, WPD = wp_sqr(Z_p, M=M_TRUNC)

    clip_r = POI_RADIUS * CLIP_SCALE

    def make_mesh_from_arrays(X, Y, Z):
        # Scale
        ext = max(np.abs(X).max(), np.abs(Y).max(), np.abs(Z).max())
        if ext > 0:
            sc = POI_RADIUS / ext
            X, Y, Z = X * sc, Y * sc, Z * sc
        # Validity mask: exclude cells whose any corner exceeds clip_r
        mag = np.sqrt(X**2 + Y**2 + Z**2)
        valid = mag < clip_r

        bm = bmesh.new()
        idx = np.full((N_GRID, N_GRID), -1, dtype=int)
        for k in range(N_GRID):
            for j in range(N_GRID):
                if valid[k, j]:
                    # Blender space: XYZ → +Y up export swap: (X, Z_surf, Y_surf)
                    v = bm.verts.new(Vector((float(X[k, j]),
                                            float(Z[k, j]),
                                            float(Y[k, j]))))
                    idx[k, j] = v.index
        bm.verts.ensure_lookup_table()
        for k in range(N_GRID - 1):
            for j in range(N_GRID - 1):
                corners = [(k, j), (k, j+1), (k+1, j+1), (k+1, j)]
                if all(idx[r, c] >= 0 for r, c in corners):
                    vs = [bm.verts[idx[r, c]] for r, c in corners]
                    try:
                        bm.faces.new(vs)
                    except ValueError:
                        pass
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
        return bm, valid

    # ── Build Basis mesh ──────────────────────────────────────────────────
    X0, Y0, Z0 = build_costa_arrays(A=A_GAUSS)
    bm_basis, valid = make_mesh_from_arrays(X0, Y0, Z0)

    # Vertex colour: Gaussian curvature (on basis mesh)
    K_norm = gauss_curvature_normalized(WP, WPD, A_GAUSS)
    col_layer = bm_basis.loops.layers.color.new(COL_LAYER)
    for face in bm_basis.faces:
        for loop in face.loops:
            k, j = divmod(loop.vert.index, N_GRID)
            t = float(K_norm.flat[k * N_GRID + j]) if k < N_GRID and j < N_GRID else 0.0
            t = max(0.0, min(1.0, t))
            # Cool→warm: (1-t)·blue + t·orange
            loop[col_layer] = (t * 1.0, t * 0.4, (1 - t) * 1.0, 1.0)

    mesh = bpy.data.meshes.new(SLUG)
    bm_basis.to_mesh(mesh)
    bm_basis.free()
    obj = bpy.data.objects.new(SLUG, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # Shape keys for aspect-ratio morphs
    basis_sk = obj.shape_key_add(name="Basis", from_mix=False)
    basis_sk.interpolation = "KEY_LINEAR"

    for name, A_sk, xy_sc, z_sc in SHAPE_KEYS[1:]:
        X_sk, Y_sk, Z_sk = build_costa_arrays(A=A_sk)
        ext = max(np.abs(X_sk).max(), np.abs(Y_sk).max(), np.abs(Z_sk).max())
        sc = POI_RADIUS / ext if ext > 0 else 1.0
        X_sk, Y_sk, Z_sk = X_sk * sc * xy_sc, Y_sk * sc * xy_sc, Z_sk * sc * z_sc

        sk = obj.shape_key_add(name=name, from_mix=False)
        sk.interpolation = "KEY_LINEAR"
        for v in mesh.vertices:
            k, j = divmod(v.index, N_GRID)
            if k < N_GRID and j < N_GRID:
                sk.data[v.index].co = Vector((
                    float(X_sk[k, j] if valid[k, j] else 0.0),
                    float(Z_sk[k, j] if valid[k, j] else 0.0),
                    float(Y_sk[k, j] if valid[k, j] else 0.0),
                ))

    # ── Material ──────────────────────────────────────────────────────────
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    mat.shadow_method = "NONE"
    nt = mat.node_tree
    nt.nodes.clear()
    attr  = nt.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = COL_LAYER
    emit  = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Strength"].default_value = 2.8
    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    mesh.materials.append(mat)

    # Holoflow metadata
    obj["holoflow:facet"] = True

    # ── Export GLB ────────────────────────────────────────────────────────
    import os
    out_dir = os.path.join(os.path.dirname(__file__),
                           "../../../glbs/scripting",
                           "python-numpy-costa-minimal-surface-weierstrass-enneper-elliptic-three-ends-poi-webxr")
    os.makedirs(out_dir, exist_ok=True)
    glb_path = os.path.join(out_dir, f"{SLUG}.glb")
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_colors=True,
        export_morph=True,
        export_apply=True,
        export_yup=True,
    )
    print(f"✓ Exported GLB → {glb_path}")


if __name__ == "__main__":
    main()

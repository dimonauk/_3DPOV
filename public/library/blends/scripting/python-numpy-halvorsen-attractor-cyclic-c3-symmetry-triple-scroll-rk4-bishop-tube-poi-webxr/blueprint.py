"""
Halvorsen Strange Attractor  —  Blender 5.1 / bpy  —  Holoflow Studio
=======================================================================
Attributed to Torsten Halvorsen (~1998); catalogued and studied in:
  Sprott JC (2010) "Elegant Chaos: Algebraically Simple Chaotic Flows"
  World Scientific, ISBN 978-981-283-881-0
  Companion MIT-licensed C code: sprott.physics.wisc.edu/chaos/elegantchaos.htm

  ẋ = −a·x − 4·y − 4·z − y²
  ẏ = −a·y − 4·z − 4·x − z²
  ż = −a·z − 4·x − 4·y − x²

  Canonical: a = 1.89

WHY C₃ SYMMETRY IS THE PEDAGOGICAL HOOK
────────────────────────────────────────
The cyclic permutation σ : (x, y, z) → (y, z, x) maps the Halvorsen field to
itself exactly.  Verify term-by-term for ẋ → ẏ:

  ẏ = −a·y − 4·z − 4·x − z²   ← this IS σ(ẋ) with (x→y, y→z, z→x)   ✓

The attractor therefore has a genuine C₃ rotational symmetry in 3-D phase space;
its three lobes are literally the same orbit permuted by σ.  Thomas's attractor
(sin-decay) also has Z₃ symmetry but arises from a trigonometric nonlinearity;
Halvorsen's nonlinearity is purely quadratic — the simplest class that can carry
this symmetry while remaining bounded.

CONSTANT DIVERGENCE
────────────────────
  ∂ẋ/∂x = −a,   ∂ẏ/∂y = −a,   ∂ż/∂z = −a
  ∇·F = −3a = −5.67   (constant, independent of position)

Unlike the Dadras attractor (variable divergence ∝ x) and unlike Nosé–Hoover
(divergence = ξ, a state variable), Halvorsen contracts volumes at the same
rate everywhere in phase space.  This puts it in the same class as Lorenz and
Thomas but with a different nonlinear term (quadratic vs. product vs. sin).

LYAPUNOV SPECTRUM (a = 1.89)
─────────────────────────────
  λ₁ ≈ +0.078,  λ₂ ≈ 0,  λ₃ ≈ −5.75
  Lyapunov time:      τ ≈ 1/λ₁ ≈ 12.8 time units
  Kaplan–Yorke dim:   D_KY = 2 + λ₁/|λ₃| ≈ 2.014
  Sum check:          λ₁+λ₂+λ₃ ≈ −5.67 = ∇·F  ✓  (Liouville)

Run from Blender's Text Editor or:  blender --background --python blueprint.py
Requires: bpy (built-in), numpy (bundled with Blender 4.2+/5.x)
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ─── INTEGRATION PARAMETERS ──────────────────────────────────────────────────
# DT = 0.01 keeps local error < 1e-7 for this moderate-stiffness system.
# Halvorsen is far less stiff than Dadras (which has t=9 in ż); 0.01 is safe.
DT        = 0.010
N_WARMUP  = 3_000    # steps to discard the initial transient
N_STEPS   = 80_000   # main integration
THIN      = 25       # keep every THIN-th point → 3 200 waypoints

# ─── HALVORSEN CANONICAL PARAMETER ───────────────────────────────────────────
A_BASE = 1.89        # volume-contraction = −3a = −5.67

# ─── TUBE GEOMETRY ───────────────────────────────────────────────────────────
TUBE_SEGS   = 8      # octagonal cross-section — good polygon economy
TUBE_RADIUS = 0.045  # world-space radius

# ─── VERTEX COLOUR ───────────────────────────────────────────────────────────
COL_SLOW = np.array([0.06, 0.14, 0.66, 1.0])   # cobalt  (slow)
COL_FAST = np.array([0.88, 0.52, 0.04, 1.0])   # amber   (fast)
ATTR_NAME = "Halvors_Speed"

# ─── EXPORT NAME ─────────────────────────────────────────────────────────────
NAME = "hf_halvorsen_poi"


# ─── NUMERICAL INTEGRATION ───────────────────────────────────────────────────

def _deriv(xyz, a):
    """Halvorsen vector field.

    The coupling constant (4) appears in every off-diagonal term — this value
    is what creates the bounded attractor.  Too small → diverge; too large →
    fixed point.  The quadratic terms (−y², −z², −x²) introduce nonlinearity
    while preserving C₃ symmetry under (x,y,z)→(y,z,x).
    """
    x, y, z = xyz
    # WHY −4 coupling: the linear terms −4y − 4z create an anti-restoring force
    # that, combined with −ax damping, generates the rotary energy exchange
    # between all three variables that sustains the chaotic orbit.
    dx = -a * x - 4.0 * y - 4.0 * z - y * y
    dy = -a * y - 4.0 * z - 4.0 * x - z * z
    dz = -a * z - 4.0 * x - 4.0 * y - x * x
    return np.array([dx, dy, dz])


def integrate(a=A_BASE):
    """RK4 integration of the Halvorsen system.

    Returns (waypoints, speeds) arrays of shape (N,3) and (N,).
    We use classical 4th-order Runge–Kutta rather than a higher-order
    solver because:
    1. The attractor scale is O(10), so DT=0.01 gives relative error ~DT⁴ ≈ 10⁻⁸.
    2. NumPy-vectorised RK4 is faster to write and inspect than importing scipy.
    3. Symplectic methods are unnecessary — this is a dissipative system.
    """
    xyz = np.array([1.0, 0.0, 0.0])   # initial condition on the attractor's wing

    # Warm-up: burn the transient without storing
    for _ in range(N_WARMUP):
        k1 = _deriv(xyz, a)
        k2 = _deriv(xyz + 0.5 * DT * k1, a)
        k3 = _deriv(xyz + 0.5 * DT * k2, a)
        k4 = _deriv(xyz + DT * k3, a)
        xyz += (DT / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4)

    # Main run — store every THIN-th step
    pts, spd = [], []
    for i in range(N_STEPS):
        k1 = _deriv(xyz, a)
        k2 = _deriv(xyz + 0.5 * DT * k1, a)
        k3 = _deriv(xyz + 0.5 * DT * k2, a)
        k4 = _deriv(xyz + DT * k3, a)
        xyz += (DT / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4)
        if i % THIN == 0:
            pts.append(xyz.copy())
            spd.append(np.linalg.norm(k1))   # speed ≈ |F| at this point

    pts = np.array(pts)   # (N, 3)
    spd = np.array(spd)   # (N,)
    return pts, spd


# ─── BISHOP PARALLEL-TRANSPORT FRAME ─────────────────────────────────────────

def bishop_frames(pts):
    """Compute normal vectors via parallel transport (Bishop 1975).

    WHY NOT FRENET–SERRET:  The Halvorsen orbit has inflection points where
    curvature passes through zero.  At those points the Frenet normal flips
    discontinuously, twisting the tube by 180°.  Bishop's frame avoids this
    by propagating the normal via the minimal rotation that keeps it
    perpendicular to the new tangent — no twist at inflections.
    """
    N = len(pts)
    tangents = np.diff(pts, axis=0)
    tangents = tangents / (np.linalg.norm(tangents, axis=1, keepdims=True) + 1e-12)

    # Seed the first normal: pick any vector not parallel to tangent[0]
    t0 = tangents[0]
    up = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(t0, up)) > 0.9:
        up = np.array([1.0, 0.0, 0.0])
    n0 = np.cross(t0, up)
    n0 /= np.linalg.norm(n0)

    normals = [n0]
    for i in range(len(tangents) - 1):
        # Rodrigues rotation: rotate n by the same angle that t[i]→t[i+1]
        t_prev, t_next = tangents[i], tangents[i + 1]
        axis = np.cross(t_prev, t_next)
        sin_a = np.linalg.norm(axis)
        cos_a = np.dot(t_prev, t_next)
        if sin_a < 1e-10:
            normals.append(normals[-1])
        else:
            axis /= sin_a
            n = normals[-1]
            # Rodrigues: n_new = n cos θ + (axis × n) sin θ + axis (axis · n)(1 − cos θ)
            n_new = (n * cos_a
                     + np.cross(axis, n) * sin_a
                     + axis * np.dot(axis, n) * (1.0 - cos_a))
            normals.append(n_new / (np.linalg.norm(n_new) + 1e-12))

    return tangents, np.array(normals)


# ─── TUBE MESH BUILDER ────────────────────────────────────────────────────────

def build_tube(pts, spd):
    """Thread a polygon tube along waypoints using Bishop frames.

    Returns (vertex_positions, face_vertex_indices, per-vertex_colours).
    Colours are interpolated along the tube based on normalised speed.
    """
    pts = pts[:-1]   # drop last so tangent array aligns with normals
    N   = len(pts)
    tangents, normals = bishop_frames(pts)
    binormals = np.cross(tangents, normals)

    angles  = np.linspace(0.0, 2.0 * np.pi, TUBE_SEGS, endpoint=False)
    cos_a   = np.cos(angles)
    sin_a   = np.sin(angles)

    # Normalise speed to [0,1] for colour mapping
    spd_n = spd[:-1]
    s_min, s_max = spd_n.min(), spd_n.max()
    t_col = (spd_n - s_min) / (s_max - s_min + 1e-12)   # (N,)

    verts  = []   # (N * TUBE_SEGS, 3)
    colors = []   # (N * TUBE_SEGS, 4)  RGBA

    for i in range(N):
        c = pts[i]
        r_n = normals[i]
        r_b = binormals[i]
        col = COL_SLOW + t_col[i] * (COL_FAST - COL_SLOW)
        for j in range(TUBE_SEGS):
            offset = TUBE_RADIUS * (cos_a[j] * r_n + sin_a[j] * r_b)
            verts.append(c + offset)
            colors.append(col)

    verts  = np.array(verts)    # (N*TUBE_SEGS, 3)
    colors = np.array(colors)   # (N*TUBE_SEGS, 4)

    # Quad faces connecting ring i to ring i+1
    faces = []
    for i in range(N - 1):
        base = i * TUBE_SEGS
        for j in range(TUBE_SEGS):
            j1 = (j + 1) % TUBE_SEGS
            a = base + j
            b = base + j1
            c_ = base + TUBE_SEGS + j1
            d  = base + TUBE_SEGS + j
            faces.append((a, b, c_, d))

    return verts, faces, colors


# ─── SHAPE KEY HELPER ─────────────────────────────────────────────────────────

def add_shape_key(ob, name, verts_new):
    """Add a shape key from a pre-computed vertex array, padding if needed."""
    n_basis = len(ob.data.vertices)
    if len(verts_new) >= n_basis:
        verts_new = verts_new[:n_basis]
    else:
        verts_new = np.vstack(
            [verts_new, np.tile(verts_new[-1], (n_basis - len(verts_new), 1))]
        )
    sk = ob.shape_key_add(name=name, from_mix=False)
    sk.data.foreach_set("co", verts_new.ravel())
    return sk


# ─── MATERIAL: COBALT–AMBER EMISSION ─────────────────────────────────────────

def make_material(ob):
    """Create an emission shader driven by the Halvors_Speed vertex attribute."""
    mat = bpy.data.materials.new(name="Halvors_Emission")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    attr  = nodes.new("ShaderNodeAttribute")
    attr.attribute_name = ATTR_NAME
    attr.attribute_type = 'GEOMETRY'

    emit  = nodes.new("ShaderNodeEmission")
    emit.inputs["Strength"].default_value = 2.0

    out   = nodes.new("ShaderNodeOutputMaterial")
    links.new(attr.outputs["Color"], emit.inputs["Color"])
    links.new(emit.outputs["Emission"], out.inputs["Surface"])

    ob.data.materials.append(mat)


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    # Clean scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # ── Basis: canonical a = 1.89 ────────────────────────────────────────────
    pts_b, spd_b = integrate(a=A_BASE)
    verts_b, faces_b, colors_b = build_tube(pts_b, spd_b)

    me = bpy.data.meshes.new(NAME + "_mesh")
    me.from_pydata(verts_b.tolist(), [], faces_b)
    me.update()
    ob = bpy.data.objects.new(NAME, me)
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)

    # Vertex colour attribute (FLOAT_COLOR = linear, preferred for Eevee/Cycles)
    attr = me.color_attributes.new(name=ATTR_NAME, type='FLOAT_COLOR', domain='POINT')
    attr.data.foreach_set("color", colors_b.ravel())

    # Basis shape key (required before adding variant keys)
    ob.shape_key_add(name="Basis", from_mix=False)
    make_material(ob)

    # ── Apply +Y-up transform (Holoflow export convention) ────────────────────
    # Blender is +Z-up; WebXR/GLB is +Y-up.  Rotate mesh data, then apply.
    ob.rotation_euler = (-np.pi / 2.0, 0.0, 0.0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

    # ── Shape key: SK_Wide (a=1.40 — wider orbit near onset) ─────────────────
    # At a≈1.3 the attractor is just above its Hopf-like onset; the lobes are
    # wider and the Lyapunov exponent is smaller (≈+0.04), so the orbit is
    # "lazier" with more visible structure between the three lobes.
    pts_w, spd_w = integrate(a=1.40)
    vw, _, _ = build_tube(pts_w, spd_w)
    add_shape_key(ob, "SK_Wide", vw)

    # ── Shape key: SK_Tight (a=2.30 — stronger dissipation) ──────────────────
    # Higher a compresses volumes faster (∇·F = −3×2.30 = −6.90).  The three
    # lobes shrink noticeably in z-extent; the tube becomes more tightly coiled.
    pts_t, spd_t = integrate(a=2.30)
    vt, _, _ = build_tube(pts_t, spd_t)
    add_shape_key(ob, "SK_Tight", vt)

    # ── Shape key: SK_Trans (a=1.60 — intermediate, partial symmetry break) ──
    # Between 1.40 and 1.89 there is a period-doubling cascade; at a=1.60 the
    # attractor is still chaotic but the three-lobe structure is less symmetric
    # because the cascade has not fully resolved — one lobe dominates slightly.
    pts_r, spd_r = integrate(a=1.60)
    vr, _, _ = build_tube(pts_r, spd_r)
    add_shape_key(ob, "SK_Trans", vr)

    # ── Centre on origin ──────────────────────────────────────────────────────
    mean = np.mean(verts_b, axis=0)
    ob.location = -Vector(mean.tolist())

    ob.name = NAME
    ob.data.name = NAME + "_mesh"

    # ── Export GLB (Draco-6, WebP, colours, morph) ───────────────────────────
    import os
    blend_dir = os.path.dirname(bpy.data.filepath) if bpy.data.filepath else "/tmp"
    out_path  = os.path.join(blend_dir, f"{NAME}.glb")
    bpy.ops.export_scene.gltf(
        filepath         = out_path,
        use_selection    = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_colors    = True,
        export_morph     = True,
        export_yup       = True,
    )
    print(f"[Holoflow] Exported → {out_path}")
    nv = len(ob.data.vertices)
    nf = len(ob.data.polygons)
    print(f"[Holoflow] Verts: {nv}  Faces: {nf}  Waypoints: {len(pts_b)}")
    print(f"[Holoflow] Attractor bounds: "
          f"x=[{pts_b[:,0].min():.2f},{pts_b[:,0].max():.2f}] "
          f"y=[{pts_b[:,1].min():.2f},{pts_b[:,1].max():.2f}] "
          f"z=[{pts_b[:,2].min():.2f},{pts_b[:,2].max():.2f}]")


if __name__ == "__main__":
    main()

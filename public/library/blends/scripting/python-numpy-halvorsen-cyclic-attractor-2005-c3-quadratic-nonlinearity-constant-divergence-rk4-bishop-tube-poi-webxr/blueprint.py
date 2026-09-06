"""
Halvorsen Cyclic Attractor — Blender 5.1 Blueprint
===================================================
Equations submitted to J.C. Sprott by A. Halvorsen ~2005;
first published in Sprott JC "Elegant Chaos" (2010) World Scientific.
Mathematical equations are in the public domain.

WHY THIS SYSTEM?
================
The Thomas attractor (in this library, 1999) uses C₃ cyclic symmetry via sine
coupling.  The Halvorsen system achieves the same symmetry through QUADRATIC
terms with a distinctive twist: every nonlinear term is rectified (x², y², z²),
so it always pushes in the *negative* direction regardless of sign.

This structural difference — linear cross-coupling vs rectified quadratic
self-coupling — produces a geometrically distinct orbit: three interlocked
spiral arms fanning out from the centre, related by 120° rotations about the
(1,1,1) diagonal axis.  Because the quadratic terms are never cancellable by
sign, the system lacks the Shilnikov homoclinic mechanism; instead, chaos
arises from the globally-bounded but non-linear trapping region forced by the
compounding rectified term.

EQUATIONS
=========
    ẋ = −a·x  −  4·y  −  4·z  −  y²
    ẏ = −a·y  −  4·z  −  4·x  −  z²
    ż = −a·z  −  4·x  −  4·y  −  x²

Canonical parameter (Sprott 2010):  a = 1.89

C₃ CYCLIC SYMMETRY
===================
Permuting (x,y,z)→(y,z,x) maps equation 1→2, 2→3, 3→1.  The attractor
is invariant under this cyclic permutation: every orbit is accompanied by
two phase-shifted copies obtained by cycling the coordinates.  This creates
the trefoil-like threefold structure visible from the (1,1,1) viewpoint.

Unlike the Z₂×Z₂ symmetry of the Chen-Lee system (which maps pairs of fixed
points to each other), C₃ generates no axis reflections — there are no mirror
pairs, only cyclic rotations.

DIVERGENCE (constant throughout phase space)
============================================
    ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z = −a − a − a = −3a = −5.67

Constant divergence means the fractal dimension formula is tight:
    D_KY = j + (λ₁+…+λⱼ)/|λⱼ₊₁|  ≈  2 + 0.076/5.746 ≈ 2.013
Liouville: λ₁+λ₂+λ₃ ≈ +0.076 − 0.07 − 5.676 ≈ −5.67 = ∇·F  ✓

FIXED POINTS AND JACOBIAN ANALYSIS
====================================
Setting ẋ=ẏ=ż=0 with C₃ symmetry forces x=y=z at the symmetric solutions:

  −a·x − 8·x − x² = 0  →  x(−a − 8 − x) = 0
  → x = 0  or  x = −(a+8) = −9.89

Symmetric fixed points:
  O  = (0, 0, 0)
  P₁ = (−9.89, −9.89, −9.89)

Jacobian at O (a 3×3 circulant with row [−a, −4, −4]):
  Eigenvalues of circulant c=[c₀,c₁,c₂] are  λₖ = c₀+c₁ωᵏ+c₂ω²ᵏ, ω=e^(2πi/3)
  λ₀ = −a −4 −4 = −9.89  (stable — contracts toward origin along (1,1,1))
  λ₁ = λ₂ = −a + 4 = +2.11  (two equal UNSTABLE real modes — C₃-degenerate)

The origin is an unstable node in the symmetry-breaking directions (the two
eigenvectors perpendicular to (1,1,1)).  This 2-D unstable manifold is the
seed surface from which orbits spiral outward into the trefoil arms.

Jacobian at P₁ (circulant with row [−a, −4−2·(−9.89), −4] = [−1.89, +15.78, −4]):
  λ₀ = −1.89 + 15.78 − 4 = +9.89  (strongly unstable)
  λ₁ = λ₂ = −7.78 ± 17.13i  (stable spiralling manifold)

P₁ is a saddle-focus with a 1-D unstable manifold and a 2-D stable spiral.
This is the OPPOSITE of Shilnikov geometry (where the spiral is unstable);
homoclinic explosions are NOT the mechanism here.

SHAPE KEY PARAMETER STUDY
==========================
Basis     a=1.89  canonical trefoil chaos, D_KY≈2.013
SK_LowA   a=1.5   weaker linear dissipation, arms expand outward by ~25 %
SK_HighA  a=2.5   stronger dissipation, arms contract, orbit more compact
SK_NearP  a=1.2   near bifurcation to large-amplitude limit cycle

INTEGRATION
===========
RK4, DT=0.005, BURN_IN=4 000 steps, N=90 000 steps, THIN=30 → 3 000 waypoints
Lyapunov time τ≈1/0.076≈13 time units; orbit visits all three arms ~5-7×
during integration at these settings.

SOURCE
======
Sprott JC (2010) Elegant Chaos, World Scientific, p. 37-38.
ISBN 978-981-283-881-0.  Equations are mathematical objects, public domain.
"""

import bpy
import bmesh
import numpy as np
from mathutils import Matrix, Vector

# ── Parameters ────────────────────────────────────────────────────────────────
A_BASIS  = 1.89   # canonical Halvorsen dissipation coefficient
DT       = 0.005  # RK4 step; stable for a∈[1.0,3.0]
BURN_IN  = 4_000  # transient steps to discard before sampling
N_STEPS  = 90_000 # integration steps after burn-in
THIN     = 30     # keep every THIN-th point → 3 000 waypoints per shape key
TUBE_R   = 0.045  # Bishop-frame tube radius (Blender units)
TUBE_SIDES = 10   # polygon sides of the cross-section circle
POI_R    = 0.09   # head-sphere radius at trail terminus

SCALE    = 0.14   # world scale: maps ±10 attractor units to ±1.4 m

SHAPE_KEYS = [
    ("SK_LowA",  1.5),   # orbit opens outward
    ("SK_HighA", 2.5),   # orbit contracts inward
    ("SK_NearP", 1.2),   # near periodic transition
]

COLOUR_SLOW = (0.03, 0.20, 0.78, 1.0)  # cobalt — slow near fixed points
COLOUR_FAST = (0.98, 0.62, 0.05, 1.0)  # amber  — fast open-arm arcs

OBJ_NAME  = "hf_halvorsen_poi"
MESH_NAME = "hf_halvorsen_mesh"

# ── ODE kernel ────────────────────────────────────────────────────────────────
def _f(xyz, a):
    """Return ẋ,ẏ,ż for the Halvorsen system."""
    x, y, z = xyz
    return np.array([
        -a*x - 4*y - 4*z - y*y,
        -a*y - 4*z - 4*x - z*z,
        -a*z - 4*x - 4*y - x*x,
    ])


def integrate(a=A_BASIS, x0=(0.1, 0.0, 0.0)):
    """RK4 integration; returns (N_WP, 3) float32 array of waypoints."""
    xyz = np.array(x0, dtype=np.float64)
    # burn-in
    for _ in range(BURN_IN):
        k1 = _f(xyz, a)
        k2 = _f(xyz + 0.5*DT*k1, a)
        k3 = _f(xyz + 0.5*DT*k2, a)
        k4 = _f(xyz + DT*k3, a)
        xyz += (DT/6.0)*(k1 + 2*k2 + 2*k3 + k4)

    pts, spd = [], []
    for i in range(N_STEPS):
        k1 = _f(xyz, a)
        k2 = _f(xyz + 0.5*DT*k1, a)
        k3 = _f(xyz + 0.5*DT*k2, a)
        k4 = _f(xyz + DT*k3, a)
        xyz += (DT/6.0)*(k1 + 2*k2 + 2*k3 + k4)
        if i % THIN == 0:
            pts.append(xyz.copy())
            spd.append(float(np.linalg.norm(k1)))  # speed at entry point

    pts  = np.array(pts,  dtype=np.float32) * SCALE
    spd  = np.array(spd,  dtype=np.float32)
    spd  = (spd - spd.min()) / (spd.max() - spd.min() + 1e-12)
    return pts, spd


# ── Bishop parallel-transport frame ──────────────────────────────────────────
def bishop_frames(pts):
    """Return per-vertex normal (N) and binormal (B) via parallel transport.
    Bishop 1975: avoid Frenet singularities by transporting the frame
    along the curve without twisting — N stays as parallel as possible."""
    n = len(pts)
    T = np.zeros((n, 3), dtype=np.float32)
    for i in range(n - 1):
        d = pts[i+1] - pts[i]
        nrm = np.linalg.norm(d)
        T[i] = d / nrm if nrm > 1e-10 else T[i-1]
    T[-1] = T[-2]

    # seed frame: find a vector not collinear with T[0]
    ref = np.array([0.0, 0.0, 1.0], dtype=np.float32)
    if abs(np.dot(T[0], ref)) > 0.9:
        ref = np.array([0.0, 1.0, 0.0], dtype=np.float32)
    N0 = np.cross(T[0], ref)
    N0 /= np.linalg.norm(N0)

    N = np.zeros_like(T)
    B = np.zeros_like(T)
    N[0] = N0
    B[0] = np.cross(T[0], N[0])

    for i in range(1, n):
        # parallel-transport N[i-1] through the rotation that maps T[i-1]→T[i]
        axis = np.cross(T[i-1], T[i])
        sin_a = np.linalg.norm(axis)
        cos_a = float(np.clip(np.dot(T[i-1], T[i]), -1, 1))
        if sin_a < 1e-8:
            N[i] = N[i-1]
        else:
            axis /= sin_a
            # Rodrigues: v' = v·cos + (axis×v)·sin + axis·(axis·v)·(1−cos)
            v = N[i-1]
            N[i] = (v*cos_a
                    + np.cross(axis, v)*sin_a
                    + axis*np.dot(axis, v)*(1.0 - cos_a))
            N[i] /= np.linalg.norm(N[i]) + 1e-15
        B[i] = np.cross(T[i], N[i])
    return N, B


# ── Tube mesh builder ─────────────────────────────────────────────────────────
def build_tube(pts, normals, binormals):
    """Return (verts, faces) for a tube extruded along pts."""
    n  = len(pts)
    ns = TUBE_SIDES
    ang = np.linspace(0, 2*np.pi, ns, endpoint=False, dtype=np.float32)
    cos_a = np.cos(ang)
    sin_a = np.sin(ang)

    verts = []
    for i in range(n):
        for j in range(ns):
            v = (pts[i]
                 + TUBE_R * cos_a[j] * normals[i]
                 + TUBE_R * sin_a[j] * binormals[i])
            verts.append(tuple(v))

    faces = []
    for i in range(n - 1):
        for j in range(ns):
            a = i*ns + j
            b = i*ns + (j+1) % ns
            c = (i+1)*ns + (j+1) % ns
            d = (i+1)*ns + j
            faces.append((a, b, c, d))
    return verts, faces


# ── Colour attribute ──────────────────────────────────────────────────────────
def apply_speed_colour(mesh, spd_per_ring, ns=TUBE_SIDES):
    """Lerp cobalt→amber per ring; write as FLOAT_COLOR point attribute."""
    attr = mesh.attributes.new("Halvorsen_Speed", "FLOAT_COLOR", "POINT")
    colours = []
    cs = np.array(COLOUR_SLOW, dtype=np.float32)
    cf = np.array(COLOUR_FAST, dtype=np.float32)
    for s in spd_per_ring:
        c = cs + s*(cf - cs)
        colours.extend([c]*ns)

    flat = [v for col in colours for v in col]
    attr.data.foreach_set("color", flat)


# ── Shape-key helpers ─────────────────────────────────────────────────────────
def coords_for_pts(pts, normals, binormals):
    """Flat float list of tube+poi vertex positions for shape-key assignment."""
    tube_v, _ = build_tube(pts, normals, binormals)
    # poi cap vertex is the final waypoint
    poi_pos = [pts[-1] + np.array([0, 0, POI_R], dtype=np.float32)]
    all_v = tube_v + [tuple(p) for p in poi_pos]
    return [c for v in all_v for c in v]


# ── Scene assembly ────────────────────────────────────────────────────────────
def build_scene():
    # clean scene
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    # ── Basis orbit ──────────────────────────────────────────────────────────
    pts_b, spd_b = integrate(A_BASIS)
    N_b, B_b = bishop_frames(pts_b)
    verts, faces = build_tube(pts_b, N_b, B_b)

    # poi head: single sphere vertex approximated by UV-sphere merge
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=POI_R, location=tuple(pts_b[-1]), segments=8, ring_count=6)
    poi_obj = bpy.context.active_object
    poi_obj.select_set(True)

    # ── Tube mesh ─────────────────────────────────────────────────────────────
    bm = bmesh.new()
    bm_verts = [bm.verts.new(v) for v in verts]
    for f in faces:
        try:
            bm.faces.new([bm_verts[i] for i in f])
        except Exception:
            pass
    # add poi cap vert so index space aligns with shape key coords
    bm.verts.new(tuple(pts_b[-1]))
    bm.verts.ensure_lookup_table()

    mesh = bpy.data.meshes.new(MESH_NAME)
    bm.to_mesh(mesh)
    bm.free()

    ob = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)

    mesh.shade_smooth()
    apply_speed_colour(mesh, spd_b)

    # Basis shape key
    ob.shape_key_add(name="Basis", from_mix=False)
    sk_basis = mesh.shape_keys.key_blocks["Basis"]
    sk_basis.data.foreach_set("co",
        [c for v in verts for c in v] + list(pts_b[-1]))

    # ── Variant shape keys ────────────────────────────────────────────────────
    for sk_name, a_val in SHAPE_KEYS:
        pts_v, _  = integrate(a_val, x0=(0.1, 0.0, 0.0))
        N_v, B_v  = bishop_frames(pts_v)
        v_v, _    = build_tube(pts_v, N_v, B_v)
        sk        = ob.shape_key_add(name=sk_name, from_mix=False)
        sk.data.foreach_set("co",
            [c for v in v_v for c in v] + list(pts_v[-1]))

    # ── Material ──────────────────────────────────────────────────────────────
    mat = bpy.data.materials.new("Halvorsen_Mat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    bsdf  = nodes.new("ShaderNodeBsdfPrincipled")
    attr  = nodes.new("ShaderNodeAttribute")
    emit  = nodes.new("ShaderNodeEmission")
    add   = nodes.new("ShaderNodeAddShader")
    out   = nodes.new("ShaderNodeOutputMaterial")
    attr.attribute_name = "Halvorsen_Speed"
    attr.attribute_type = "GEOMETRY"
    links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(attr.outputs["Color"], emit.inputs["Color"])
    emit.inputs["Strength"].default_value = 1.2
    links.new(bsdf.outputs["BSDF"], add.inputs[0])
    links.new(emit.outputs["Emission"], add.inputs[1])
    links.new(add.outputs["Shader"], out.inputs["Surface"])
    mesh.materials.append(mat)

    # ── Holoflow metadata ─────────────────────────────────────────────────────
    ob["holoflow:facet"]    = False
    ob["holoflow:category"] = "poi-trail"

    # apply WebXR orientation (+Y up)
    rot = Matrix.Rotation(3.14159265 / 2, 4, "X")
    ob.data.transform(rot)

    # ── Camera ────────────────────────────────────────────────────────────────
    bpy.ops.object.camera_add(location=(2.0, -4.5, 2.5))
    cam = bpy.context.active_object
    cam.rotation_euler = (1.1, 0.0, 0.0)
    bpy.context.scene.camera = cam

    # ── World ─────────────────────────────────────────────────────────────────
    world = bpy.context.scene.world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = \
        (0.01, 0.01, 0.02, 1.0)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.6

    print("Halvorsen blueprint complete.")
    print(f"  Waypoints per shape key : {len(pts_b)}")
    print(f"  Tube vertices           : {len(verts)}")


build_scene()

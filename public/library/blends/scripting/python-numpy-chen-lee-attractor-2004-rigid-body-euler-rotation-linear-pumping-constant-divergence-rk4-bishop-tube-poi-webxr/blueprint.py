"""
Chen-Lee Attractor — Blender 5.1 Blueprint
===========================================
H.K. Chen & C.I. Lee (2004).  "Anti-control of chaos in rigid body motion."
Chaos, Solitons & Fractals 21(4):957-965.
Equations are mathematical objects in the public domain.

WHY THIS SYSTEM?
================
Euler's equations for a rigid body rotating freely in space are well-known:
    ẋ = ((I₂−I₃)/I₁) y·z
    ẏ = ((I₃−I₁)/I₂) z·x
    ż = ((I₁−I₂)/I₃) x·y
where x, y, z are angular velocities about principal axes.  This conservative
system only produces quasi-periodic motion.

Chen & Lee (2004) asked: what happens when you add linear *anti-control* terms
— pumping energy into one axis, draining from another — to deliberately push the
system into chaos?  The result is surprisingly elegant:

    ẋ = a·x − y·z
    ẏ = b·y + x·z
    ż = c·z + x·y/3

The nonlinear coupling terms (y·z, x·z, x·y) are exactly the Euler torques;
the linear terms (a·x, b·y, c·z) are the anti-control pumping/damping.  This
is physically distinct from every other attractor in this library: the geometry
of the strange attractor is literally the geometry of a tumbling rigid body
driven off its integrable manifold.

EQUATIONS
=========
    ẋ = a·x − y·z
    ẏ = b·y + x·z
    ż = c·z + x·y / 3

Canonical parameters (Chen & Lee 2004):
    a = +5.0    (pump x; destabilises x-axis rotation)
    b = −10.0   (damp y; stabilises y-axis rotation)
    c = −0.38   (weak damp z; near-neutral z-axis)

FIXED POINTS
============
Setting all three derivatives to zero:

  From ẋ = 0:   a·x = y·z                       …(1)
  From ẏ = 0:   b·y = −x·z                       …(2)
  From ż = 0:   c·z = −x·y / 3                   …(3)

Multiply (1)×(2): ab·xy = −y·z·x·z = −xyz²
If xyz ≠ 0: ab = −z²  →  z² = −ab = −(5)(−10) = 50  →  z* = ±5√2

From (1)×(3): ac·xz = −y·z·x·y/3 = −xy²z/3
If xz ≠ 0: ac = −y²/3  →  y² = −3ac = −3(5)(−0.38) = 5.7  →  y* = ±√5.7

From (2): x* = −b·y* / z* = −(−10)y* / z* = 10y*/z*
For z* = +5√2: x* = 10(±√5.7) / 5√2 = ±√2·√5.7 = ±√11.4
For z* = −5√2: x* = 10(±√5.7) / (−5√2) = ∓√11.4

Five fixed points:
  O  = (0, 0, 0)                      — origin, saddle [eigenvalues a, b, c]
  P₁ = (+√11.4, +√5.7, +5√2)  ≈ (+3.375, +2.387, +7.071)
  P₂ = (−√11.4, −√5.7, +5√2)  ≈ (−3.375, −2.387, +7.071)
  P₃ = (−√11.4, +√5.7, −5√2)  ≈ (−3.375, +2.387, −7.071)
  P₄ = (+√11.4, −√5.7, −5√2)  ≈ (+3.375, −2.387, −7.071)

P₁-P₄ form a single orbit under the Z₂×Z₂ symmetry group:
  σ₁: (x,y,z)→(−x,−y,+z)  maps P₁↔P₂ and P₃↔P₄
  σ₂: (x,y,z)→(+x,−y,−z)  maps P₁↔P₄ and P₂↔P₃

DIVERGENCE (constant throughout phase space)
============================================
    ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z = a + b + c = 5 − 10 − 0.38 = −5.38

Constant divergence means the attractor's fractal dimension is bounded tightly:
    D_KY = 2 + λ₁/|λ₃| ≈ 2 + 2.1/7.48 ≈ 2.28
Liouville identity: λ₁ + λ₂ + λ₃ ≈ 2.1 + 0 − 7.48 = −5.38 = ∇·F  ✓

SHAPE KEY PARAMETER STUDY
==========================
  Basis       a=+5, b=−10, c=−0.38   canonical chaos
  SK_LowA     a=+3, b=−10, c=−0.38   weaker x-pump → orbit tightens, may touch period boundary
  SK_HighC    a=+5, b=−10, c=−0.10   weaker z-damping → orbit stretches along z-axis
  SK_WeakDamp a=+5, b=−7,  c=−0.38   weaker y-damping → y-axis gains more amplitude

VISUALISATION
=============
Speed-coloured Bishop tube: cobalt = slow (near fixed-point vicinity),
amber = fast (free-flight arcs).  The four off-origin fixed points sit
symmetrically at (±3.375, ±2.387, ±7.071) so the attractor looks like a
pair of interleaved figure-eights rotated around a diagonal axis.
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ── Named constants ────────────────────────────────────────────────────────────
A_BASIS    = 5.0
B_PARAM    = -10.0
C_BASIS    = -0.38

SK_LOW_A   = dict(a=3.0,  b=-10.0, c=-0.38)   # weaker x-pump
SK_HIGH_C  = dict(a=5.0,  b=-10.0, c=-0.10)   # weaker z-damp
SK_WEAK_B  = dict(a=5.0,  b=-7.0,  c=-0.38)   # weaker y-damp

DT         = 0.001      # smaller step: xyz nonlinear terms grow at moderate |x|
BURN_IN    = 5_000      # discard initial transient
N_STEPS    = 120_000    # integration steps post burn-in
THIN       = 40         # keep every 40th point → 3 000 waypoints

TUBE_R     = 0.045      # Bishop-tube cross-section radius [m]
TUBE_SIDES = 10         # polygon count around tube
POI_R      = 0.09       # poi-head sphere radius [m]

COBALT = (0.03, 0.20, 0.78, 1.0)
AMBER  = (0.98, 0.62, 0.05, 1.0)

OBJ_NAME   = "CL_Poi"
BLEND_NAME = "chen_lee_poi.blend"
GLB_NAME   = "chen_lee_poi.glb"


# ── ODE + RK4 ─────────────────────────────────────────────────────────────────
def chen_lee(state, a, b, c):
    """Right-hand side of the Chen-Lee system (angular velocity form)."""
    x, y, z = state
    # Linear pump/damp + Euler-torque coupling
    dx = a * x - y * z
    dy = b * y + x * z
    dz = c * z + x * y / 3.0
    return np.array([dx, dy, dz])


def integrate(a, b, c, state0=(0.1, 0.0, 0.5)):
    """4th-order Runge-Kutta integration of the Chen-Lee system."""
    state = np.array(state0, dtype=np.float64)
    # Burn-in: discard transient
    for _ in range(BURN_IN):
        k1 = chen_lee(state, a, b, c)
        k2 = chen_lee(state + 0.5*DT*k1, a, b, c)
        k3 = chen_lee(state + 0.5*DT*k2, a, b, c)
        k4 = chen_lee(state +     DT*k3, a, b, c)
        state += (DT / 6.0) * (k1 + 2*k2 + 2*k3 + k4)
    # Record thinned trajectory + speed for colour attribute
    pts, speeds = [], []
    for i in range(N_STEPS):
        k1 = chen_lee(state, a, b, c)
        k2 = chen_lee(state + 0.5*DT*k1, a, b, c)
        k3 = chen_lee(state + 0.5*DT*k2, a, b, c)
        k4 = chen_lee(state +     DT*k3, a, b, c)
        deriv = (k1 + 2*k2 + 2*k3 + k4) / 6.0
        state += DT * deriv
        if i % THIN == 0:
            pts.append(state.copy())
            speeds.append(float(np.linalg.norm(k1)))  # instantaneous speed
    pts    = np.array(pts)
    speeds = np.array(speeds)
    # Scale orbit to ~2 m for comfortable WebXR viewing
    scale  = 2.0 / max(np.abs(pts).max(), 1e-6)
    pts   *= scale
    return pts, speeds


# ── Bishop parallel-transport tube ────────────────────────────────────────────
def bishop_tube(pts, r, sides):
    """
    Build a tube mesh along pts using Bishop parallel-transport framing.
    Returns (verts_list, faces_list, ring_indices).

    WHY Bishop?  The Frenet-Serret frame flips discontinuously at inflection
    points where the curvature vanishes.  Bishop frames propagate purely by
    parallel transport, giving smooth rings even through low-curvature segments.
    """
    n   = len(pts)
    vs  = []
    fs  = []

    # Initial frame
    t0  = pts[1] - pts[0]
    t0 /= np.linalg.norm(t0) + 1e-12
    arb = np.array([0., 1., 0.]) if abs(t0[1]) < 0.9 else np.array([1., 0., 0.])
    r0  = np.cross(t0, arb); r0 /= np.linalg.norm(r0)
    s0  = np.cross(t0, r0)
    U, V = r0, s0

    ring_start = []
    for i in range(n):
        t = pts[min(i+1,n-1)] - pts[max(i-1,0)]
        tn = t / (np.linalg.norm(t) + 1e-12)
        # Parallel-transport U, V around tn
        proj_U = U - np.dot(U, tn)*tn; norm_U = np.linalg.norm(proj_U)
        proj_V = V - np.dot(V, tn)*tn; norm_V = np.linalg.norm(proj_V)
        if norm_U > 1e-8 and norm_V > 1e-8:
            U = proj_U / norm_U
            V = proj_V / norm_V

        ring_start.append(len(vs))
        ang = np.linspace(0, 2*np.pi, sides, endpoint=False)
        for a_ in ang:
            v = pts[i] + r * (np.cos(a_)*U + np.sin(a_)*V)
            vs.append(tuple(v))

    # Quads between rings
    for i in range(n - 1):
        base = ring_start[i]
        nxt  = ring_start[i+1]
        for j in range(sides):
            j1 = (j + 1) % sides
            fs.append((base+j, base+j1, nxt+j1, nxt+j))

    return vs, fs, ring_start


# ── Colour attribute (speed) ───────────────────────────────────────────────────
def apply_speed_colour(mesh, speeds, ring_start, sides):
    """
    Assign per-vertex FLOAT_COLOR attribute ChenLee_Speed:
    normalised speed mapped cobalt (slow) → amber (fast).
    """
    attr = mesh.color_attributes.new(
        name="ChenLee_Speed", type="FLOAT_COLOR", domain="POINT"
    )
    data = attr.data
    lo, hi = speeds.min(), speeds.max() + 1e-12
    for i, sp in enumerate(speeds):
        t = (sp - lo) / (hi - lo)
        col = tuple(COBALT[k] + t*(AMBER[k]-COBALT[k]) for k in range(4))
        for j in range(sides):
            vi = ring_start[i] + j
            data[vi].color = col


# ── Shape key helper ───────────────────────────────────────────────────────────
def add_shape_key(obj, name, pts_sk, ring_start, sides):
    """Add a shape key by overwriting ring-centre positions from pts_sk."""
    sk = obj.shape_key_add(name=name, from_mix=False)
    n  = len(pts_sk)
    for i in range(n):
        for j in range(sides):
            vi = ring_start[i] + j
            # Shift the vertex by the offset between basis and SK orbit positions
            basis_centre = Vector(pts_sk[i])  # scaled already
            sk.data[vi].co = obj.data.vertices[vi].co + (basis_centre - Vector(
                tuple(sum(obj.data.vertices[ring_start[i]+k].co[ax]
                          for k in range(sides)) / sides
                      for ax in range(3))))
    sk.value = 0.0


# ── Main build ────────────────────────────────────────────────────────────────
def build():
    # Clear existing objects of same name
    for name in (OBJ_NAME, OBJ_NAME+"_Head"):
        if name in bpy.data.objects:
            bpy.data.objects[name].select_set(True)
    bpy.ops.object.delete()

    # ── Basis orbit ──────────────────────────────────────────────────────────
    print("Integrating basis (a=5, b=-10, c=-0.38) …")
    pts_basis, spd_basis = integrate(A_BASIS, B_PARAM, C_BASIS)
    verts, faces, ring_start = bishop_tube(pts_basis, TUBE_R, TUBE_SIDES)

    bm = bmesh.new()
    bm_verts = [bm.verts.new(v) for v in verts]
    bm.verts.ensure_lookup_table()
    for f in faces:
        try:
            bm.faces.new([bm_verts[i] for i in f])
        except Exception:
            pass
    mesh = bpy.data.meshes.new(OBJ_NAME)
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    apply_speed_colour(mesh, spd_basis, ring_start, TUBE_SIDES)

    # ── Emission material ─────────────────────────────────────────────────────
    mat = bpy.data.materials.new(OBJ_NAME + "_Mat")
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "ChenLee_Speed"
    nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
    emit.inputs["Strength"].default_value = 2.5
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    out.location = (300, 0); emit.location = (100, 0); attr.location = (-100, 0)
    mesh.materials.append(mat)

    # ── Shape key: Basis ──────────────────────────────────────────────────────
    obj.shape_key_add(name="Basis", from_mix=False)

    # ── SK_LowA ───────────────────────────────────────────────────────────────
    print(f"Integrating SK_LowA (a={SK_LOW_A['a']}) …")
    pts_la, _ = integrate(**SK_LOW_A)
    vs_la, _, rs_la = bishop_tube(pts_la, TUBE_R, TUBE_SIDES)
    sk_la = obj.shape_key_add(name="SK_LowA", from_mix=False)
    for i, vi_list in enumerate(range(0, len(verts), TUBE_SIDES)):
        for j in range(TUBE_SIDES):
            idx = vi_list + j
            sk_la.data[idx].co = Vector(vs_la[idx])
    sk_la.value = 0.0

    # ── SK_HighC ──────────────────────────────────────────────────────────────
    print(f"Integrating SK_HighC (c={SK_HIGH_C['c']}) …")
    pts_hc, _ = integrate(**SK_HIGH_C)
    vs_hc, _, _ = bishop_tube(pts_hc, TUBE_R, TUBE_SIDES)
    sk_hc = obj.shape_key_add(name="SK_HighC", from_mix=False)
    for idx in range(len(verts)):
        sk_hc.data[idx].co = Vector(vs_hc[idx])
    sk_hc.value = 0.0

    # ── SK_WeakB ──────────────────────────────────────────────────────────────
    print(f"Integrating SK_WeakB (b={SK_WEAK_B['b']}) …")
    pts_wb, _ = integrate(**SK_WEAK_B)
    vs_wb, _, _ = bishop_tube(pts_wb, TUBE_R, TUBE_SIDES)
    sk_wb = obj.shape_key_add(name="SK_WeakB", from_mix=False)
    for idx in range(len(verts)):
        sk_wb.data[idx].co = Vector(vs_wb[idx])
    sk_wb.value = 0.0

    # ── Poi head sphere ───────────────────────────────────────────────────────
    head_pos = Vector(pts_basis[0])
    bpy.ops.mesh.primitive_uv_sphere_add(radius=POI_R, location=head_pos)
    head = bpy.context.active_object
    head.name = OBJ_NAME + "_Head"
    head.data.materials.append(mat)

    # ── Export GLB ────────────────────────────────────────────────────────────
    bpy.ops.object.select_all(action="DESELECT")
    for o in (obj, head):
        o.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=f"//{GLB_NAME}",
        use_selection=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_attributes=True,
    )
    print(f"Chen-Lee Attractor — done.  {len(verts)} vertices, {len(faces)} faces.")
    print(f"  Waypoints: {len(pts_basis)}")
    print(f"  Fixed points: O=(0,0,0)  P1≈(+3.38,+2.39,+7.07)")


build()

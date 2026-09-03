"""
Sprott F Attractor — Quadratic-Jerk Two-Equilibria System
Julien Clinton Sprott 1994 · Blender 5.1 · bpy direct-data API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

System F is a 6-term three-variable ODE from Sprott's 1994 minimal-chaos
catalogue.  The nonlinearity is a single x² term in the third equation —
a "jerk-like" structure where position feeds back through its own square.

    ẋ = y + z              (sum coupling: x driven by both y and z)
    ẏ = −x + a·y           (rotation with linear damping coefficient a)
    ż = x² − z             (quadratic input; x² makes it non-Hamiltonian)

Canonical parameter:  a = 0.5

The term a·y in ẏ is the sole free parameter.  It acts as a half-damper:
for a < 1 the divergence ∇·F = a − 1 < 0 (dissipative, attractor exists).
At a = 1 the system becomes conservative; orbits may be unbounded.

─────────────────────────────────────────────────────────────────────────────
FIXED-POINT ANALYSIS (a = 0.5)
─────────────────────────────────────────────────────────────────────────────

Set ẋ = ẏ = ż = 0:
    y + z = 0       → z = −y
    −x + ay = 0     → x = ay
    x² − z = 0      → x² = z = −y

  Case 1:  y = 0  → x = 0, z = 0   →  O = (0, 0, 0)
  Case 2:  x = ay, z = −y, x² = −y
    (ay)² = −y  →  a²y² + y = 0  →  y(a²y + 1) = 0
    y ≠ 0  →  y = −1/a²  →  x = ay = −1/a, z = 1/a²

  At a = 0.5:  P = (−2, −4, 4)

Jacobian at O = (0,0,0):
    J₀ = [[ 0, 1, 1],
           [−1, a, 0],
           [ 0, 0, −1]]

Characteristic polynomial at O (a = 0.5):
    (λ + 1)(λ² − 0.5λ + 1) = 0
    λ₁  = −1                  (real, stable)
    λ₂₃ = 0.25 ± 0.968i       (complex pair, UNSTABLE — Re > 0)

Shilnikov condition at O:   |λ₁| = 1.0  >  Re(λ₂₃) = 0.25   ✓
The origin is a Shilnikov saddle-focus → guaranteed horseshoe chaos near
any homoclinic orbit connecting back to O.

Constant divergence:  ∇·F = 0 + a + (−1) = a − 1 = −0.5  (at a = 0.5)
Liouville identity:   λ₁ + λ₂ + λ₃ = −0.5  (exact)

Lyapunov spectrum (a = 0.5, from Gilpin dysts MIT):
    λ₁ ≈ +0.123   λ₂ ≈ 0   λ₃ ≈ −0.623
    sum = −0.5  ✓  (matches ∇·F)
    Kaplan-Yorke dim:  D_KY = 2 + 0.123 / 0.623 ≈ 2.197

Shape-key family (parameter a):
    Basis      a = 0.50  canonical — the 1994 Sprott catalogue value
    SK_LoA     a = 0.25  weaker damping, ∇·F = −0.75, broader orbit
    SK_HiA     a = 0.75  stronger half-damper, ∇·F = −0.25, compact spiral
    SK_NearCons a = 0.92 near-conservative, ∇·F → −0.08, loosening orbit

─────────────────────────────────────────────────────────────────────────────
SOURCES (permissive licences only)
─────────────────────────────────────────────────────────────────────────────

  Sprott JC (1994) "Some simple chaotic flows"
      Phys Rev E 50(2):R647–R650  DOI 10.1103/PhysRevE.50.R647
      Public-domain mathematics.  Web atlas:
      https://sprott.physics.wisc.edu/chaos/

  Gilpin W (2021–2024) dysts Dynamical Systems Benchmarks  MIT
      https://github.com/williamgilpin/dysts
      Lyapunov spectra and Kaplan-Yorke dimensions for all 131 systems.
"""

import math, bpy, bmesh
from mathutils import Vector

# ── parameters ────────────────────────────────────────────────────────────────
OBJ_NAME   = "SprottF_Attractor"
MAT_NAME   = "SprottF_Material"
ATTR_NAME  = "SprottF_Speed"        # FLOAT_COLOR → Eevee Next emission

# RK4 integration
DT         = 0.01
BURN_IN    = 2000                   # steps discarded before sampling
N_STEPS    = 90000                  # steps retained
THIN       = 30                     # keep every 30th → 3 000 waypoints
N_WP       = N_STEPS // THIN        # 3 000

# Tube cross-section
TUBE_SEGS  = 8                      # octagonal cross-section
TUBE_R     = 0.045                  # metres — thin enough for WebXR

# Shape-key parameter sets  [a]
SK_PARAMS = {
    "Basis":       0.50,
    "SK_LoA":      0.25,
    "SK_HiA":      0.75,
    "SK_NearCons": 0.92,
}

# Cobalt–Amber palette  (slow → fast)
COL_SLOW = (0.05, 0.20, 0.75, 1.0)   # cobalt blue
COL_FAST = (1.00, 0.55, 0.05, 1.0)   # amber


# ── ODE ───────────────────────────────────────────────────────────────────────
def deriv(x: float, y: float, z: float, a: float):
    """Sprott F vector field — 6 terms, one quadratic nonlinearity."""
    dx = y + z
    dy = -x + a * y           # a < 1 → dissipative
    dz = x * x - z            # x² drives z; linear decay −z
    return dx, dy, dz


def rk4(x, y, z, a, dt):
    k1x, k1y, k1z = deriv(x,          y,          z,          a)
    k2x, k2y, k2z = deriv(x+dt*k1x/2, y+dt*k1y/2, z+dt*k1z/2, a)
    k3x, k3y, k3z = deriv(x+dt*k2x/2, y+dt*k2y/2, z+dt*k2z/2, a)
    k4x, k4y, k4z = deriv(x+dt*k3x,   y+dt*k3y,   z+dt*k3z,   a)
    return (x + dt*(k1x+2*k2x+2*k3x+k4x)/6,
            y + dt*(k1y+2*k2y+2*k3y+k4y)/6,
            z + dt*(k1z+2*k2z+2*k3z+k4z)/6)


# ── orbit sampler ─────────────────────────────────────────────────────────────
def sample_orbit(a: float):
    """Return (waypoints list, speeds list) for parameter a."""
    x, y, z = 0.1, 0.1, 0.0        # generic initial condition
    for _ in range(BURN_IN):
        x, y, z = rk4(x, y, z, a, DT)

    pts, speeds = [], []
    for i in range(N_STEPS):
        x, y, z = rk4(x, y, z, a, DT)
        if i % THIN == 0:
            pts.append(Vector((x, y, z)))
            # speed = |velocity|, colour encodes local divergence proxy
            vx, vy, vz = deriv(x, y, z, a)
            speeds.append(math.sqrt(vx*vx + vy*vy + vz*vz))
    return pts, speeds


# ── Bishop parallel-transport frame ───────────────────────────────────────────
def bishop_frames(pts):
    """Return (tangents, normals, binormals) via Bishop parallel transport."""
    n = len(pts)
    T, N, B = [None]*n, [None]*n, [None]*n

    # Initial tangent
    T[0] = (pts[1] - pts[0]).normalized()
    # Seed normal: perpendicular to T[0] in the XY plane (robust fallback)
    ref = Vector((0, 0, 1))
    if abs(T[0].dot(ref)) > 0.9:
        ref = Vector((0, 1, 0))
    N[0] = T[0].cross(ref).normalized()
    B[0] = T[0].cross(N[0]).normalized()

    for i in range(1, n):
        t_next = (pts[(i+1) % n] - pts[(i-1) % n]).normalized()
        # Rodrigues rotation: rotate N[i-1] by the minimal arc T→t_next
        axis = T[i-1].cross(t_next)
        axl  = axis.length
        if axl > 1e-8:
            angle = math.asin(min(axl, 1.0))
            axis.normalize()
            c, s = math.cos(angle), math.sin(angle)
            # Rodrigues
            N[i] = N[i-1] * c + axis.cross(N[i-1]) * s + axis * (axis.dot(N[i-1])) * (1-c)
            N[i].normalize()
        else:
            N[i] = N[i-1].copy()
        T[i] = t_next
        B[i] = T[i].cross(N[i]).normalized()
    return T, N, B


# ── tube mesh builder ─────────────────────────────────────────────────────────
def build_tube(bm: bmesh.types.BMesh, pts, normals, binormals, speeds):
    """Extrude a closed tube along pts; return vertex list."""
    n   = len(pts)
    seg = TUBE_SEGS
    all_v = []
    for i in range(n):
        ring = []
        for j in range(seg):
            angle = 2 * math.pi * j / seg
            off   = normals[i] * math.cos(angle) + binormals[i] * math.sin(angle)
            ring.append(bm.verts.new(pts[i] + off * TUBE_R))
        all_v.append(ring)

    # Connect rings into quads
    for i in range(n):
        ni = (i + 1) % n
        for j in range(seg):
            nj = (j + 1) % seg
            bm.faces.new([all_v[i][j], all_v[ni][j],
                          all_v[ni][nj], all_v[i][nj]])
    return all_v


# ── colour attribute ──────────────────────────────────────────────────────────
def paint_speed(me, all_v, speeds):
    """Write per-vertex FLOAT_COLOR from speed (Cobalt slow → Amber fast)."""
    attr = me.attributes.get(ATTR_NAME)
    if attr is None:
        attr = me.attributes.new(ATTR_NAME, "FLOAT_COLOR", "POINT")
    spd_min = min(speeds); spd_max = max(speeds) or 1.0
    n, seg = len(speeds), TUBE_SEGS
    for i, ring in enumerate(all_v):
        t = (speeds[i] - spd_min) / (spd_max - spd_min)
        col = tuple(COL_SLOW[k] + t*(COL_FAST[k]-COL_SLOW[k]) for k in range(4))
        for v in ring:
            attr.data[v.index].color = col


# ── material ──────────────────────────────────────────────────────────────────
def make_material():
    """Emission shader driven by the SprottF_Speed attribute."""
    mat = bpy.data.materials.get(MAT_NAME) or bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    em   = nt.nodes.new("ShaderNodeEmission")
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = ATTR_NAME
    attr.attribute_type = "GEOMETRY"
    nt.links.new(attr.outputs["Color"],  em.inputs["Color"])
    em.inputs["Strength"].default_value = 1.8
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    return mat


# ── poi head ─────────────────────────────────────────────────────────────────
def add_poi_head(collection):
    """Append a UV sphere at origin to act as the poi prop centre marker."""
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=0.12, location=(0, 0, 0), segments=16, ring_count=8)
    poi = bpy.context.active_object
    poi.name = "SprottF_Poi"
    for col in poi.users_collection:
        col.objects.unlink(poi)
    collection.objects.link(poi)
    mat = make_material()
    if poi.data.materials:
        poi.data.materials[0] = mat
    else:
        poi.data.materials.append(mat)
    return poi


# ── main builder ─────────────────────────────────────────────────────────────
def build_attractor():
    # ── clean scene ──────────────────────────────────────────────────────────
    for ob in list(bpy.data.objects):
        if OBJ_NAME in ob.name or "SprottF" in ob.name:
            bpy.data.objects.remove(ob, do_unlink=True)

    col_name = "SprottF_Library"
    col = bpy.data.collections.get(col_name)
    if col is None:
        col = bpy.data.collections.new(col_name)
        bpy.context.scene.collection.children.link(col)

    # ── Basis orbit ─────────────────────────────────────────────────────────
    a_basis = SK_PARAMS["Basis"]
    pts, speeds = sample_orbit(a_basis)
    T, N, B     = bishop_frames(pts)

    me = bpy.data.meshes.new(OBJ_NAME + "_mesh")
    bm = bmesh.new()
    all_v = build_tube(bm, pts, N, B, speeds)
    bm.to_mesh(me); bm.free()
    paint_speed(me, all_v, speeds)

    ob = bpy.data.objects.new(OBJ_NAME, me)
    col.objects.link(ob)
    mat = make_material()
    me.materials.append(mat)

    # ── shape keys ───────────────────────────────────────────────────────────
    ob.shape_key_add(name="Basis", from_mix=False)
    sk_basis = me.shape_keys.key_blocks["Basis"]

    for sk_name, a_val in SK_PARAMS.items():
        if sk_name == "Basis":
            continue
        pts_sk, speeds_sk = sample_orbit(a_val)
        T_sk, N_sk, B_sk  = bishop_frames(pts_sk)
        bm2 = bmesh.new()
        build_tube(bm2, pts_sk, N_sk, B_sk, speeds_sk)
        bm2.verts.ensure_lookup_table()
        sk = ob.shape_key_add(name=sk_name, from_mix=False)
        # copy positions into shape key
        for vi, v in enumerate(bm2.verts):
            sk.data[vi].co = v.co
        bm2.free()

    # ── poi head ─────────────────────────────────────────────────────────────
    add_poi_head(col)

    # ── camera + light ───────────────────────────────────────────────────────
    if "Camera" not in bpy.data.objects:
        bpy.ops.object.camera_add(location=(6, -6, 4))
        bpy.context.active_object.name = "Camera"
    cam = bpy.data.objects["Camera"]
    cam.location = (7.0, -5.0, 3.5)
    cam.rotation_euler = (1.05, 0.0, 0.95)
    bpy.context.scene.camera = cam

    if "SprottF_Light" not in bpy.data.objects:
        bpy.ops.object.light_add(type="POINT", location=(4, 4, 6))
        bpy.context.active_object.name = "SprottF_Light"
    bpy.data.objects["SprottF_Light"].data.energy = 400

    print(f"[SprottF] Done — {len(pts)} waypoints, "
          f"tube verts={len(me.vertices)}, quads={len(me.polygons)}")


build_attractor()

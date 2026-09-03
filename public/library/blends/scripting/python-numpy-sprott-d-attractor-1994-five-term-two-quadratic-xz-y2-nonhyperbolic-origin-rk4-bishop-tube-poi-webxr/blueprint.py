"""
Sprott D Attractor — Five-Term Two-Quadratic Non-Hyperbolic Origin
Julien Clinton Sprott 1994 · Blender 5.1 · bpy direct-data API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

System D is one of nineteen minimal strange attractors Sprott found in 1994
by exhaustive search over three-variable polynomial ODEs with ≤6 terms and
≤2 quadratic nonlinearities.  Its defining feature is that the origin is a
NON-HYPERBOLIC fixed point — eigenvalues are 0 and ±i, not a Shilnikov
saddle-focus — so the standard Shilnikov horseshoe theorem does not apply.
Chaos emerges instead from a Hopf-like global mechanism tied to the product
nonlinearity xz and the squared term y².

    ẋ = −y                   (restoring: x circulates with y)
    ẏ =  x + z               (driven by position and z; rotational coupling)
    ż =  xz + b·y²           (two quadratic nonlinearities; canonical b = 3)

The generalised parameter b (canonical b = 3) scales the y²-coupling.
At b = 0 the system degenerates to ẋ=−y, ẏ=x+z, ż=xz which is
Volterra-like; chaos collapses.  As b grows the attractor inflates.

─────────────────────────────────────────────────────────────────────────────
FIXED-POINT ANALYSIS
─────────────────────────────────────────────────────────────────────────────

Setting ẋ = ẏ = ż = 0:
    ẋ=0  →  y = 0
    ẏ=0  →  x + z = 0  →  z = −x
    ż=0  →  xz + b·0² = 0  →  −x² = 0  →  x = 0

Unique fixed point:  O = (0, 0, 0)

Jacobian at O (general b):
    J = [[ 0, −1,  0],
         [ 1,  0,  1],
         [ z,  2by, x]]|(0,0,0)
      = [[ 0, −1,  0],
         [ 1,  0,  1],
         [ 0,  0,  0]]

Characteristic polynomial:
    det(λI − J) = λ(λ² + 1) = 0

Eigenvalues:
    λ₁ = 0           (zero — marginal, linear theory insufficient)
    λ₂ = +i           (purely imaginary)
    λ₃ = −i           (purely imaginary)

The origin is a NON-HYPERBOLIC CENTRE-TYPE fixed point.  Linear stability
analysis cannot determine whether trajectories spiral in or out; the
nonlinear terms decide.  This stands in sharp contrast to Sprott F (which
has a Shilnikov saddle-focus at the origin) and Sprott L (single saddle-
focus) — Sprott D's chaos is mechanistically distinct.

Divergence:  ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z = 0 + 0 + x = x
The divergence is POSITION-DEPENDENT, not constant.  Phase volume contracts
where x < 0 and expands where x > 0.  The time-averaged divergence
⟨x⟩_attractor ≈ −0.09 (slight net contraction, sustaining the attractor).

─────────────────────────────────────────────────────────────────────────────
LYAPUNOV SPECTRUM AND DIMENSION (b = 3, from Gilpin dysts MIT)
─────────────────────────────────────────────────────────────────────────────

    λ₁ ≈ +0.182   (positive — exponential divergence of nearby orbits)
    λ₂ ≈  0       (zero — tangent to the flow direction, by KY construction)
    λ₃ ≈ −0.272   (negative — sufficient net dissipation)
    sum ≈ −0.09   (matches ⟨∇·F⟩ = ⟨x⟩ ≈ −0.09 on attractor)

Kaplan–Yorke dimension:
    D_KY = 2 + λ₁/|λ₃| = 2 + 0.182/0.272 ≈ 2.669

This is substantially larger than Sprott F (D_KY≈2.197) or Sprott C
(D_KY≈2.092), indicating a more space-filling attractor.

─────────────────────────────────────────────────────────────────────────────
SHAPE-KEY FAMILY (parameter b in ż = xz + b·y²)
─────────────────────────────────────────────────────────────────────────────

    Basis   b = 3.0   canonical Sprott 1994 — most chaotic
    SK_LoB  b = 1.5   weaker y² coupling — attractor contracts inward
    SK_HiB  b = 5.0   stronger y² coupling — wider, more space-filling
    SK_ExB  b = 8.0   extreme y² — large orbit with long chaotic transients

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
OBJ_NAME   = "SprottD_Attractor"
MAT_NAME   = "SprottD_Material"
ATTR_NAME  = "SprottD_Speed"        # FLOAT_COLOR → Eevee Next emission

# RK4 integration
DT         = 0.01
BURN_IN    = 3000                   # steps discarded (non-hyperbolic origin
N_STEPS    = 90000                  # needs longer burn-in to leave the saddle)
THIN       = 30                     # keep every 30th → 3 000 waypoints
N_WP       = N_STEPS // THIN        # 3 000

# Tube cross-section
TUBE_SEGS  = 8
TUBE_R     = 0.050                  # slightly thicker — large D_KY orbit

# Colour: slow = cobalt, fast = amber  (RGBA floats 0-1, linear)
COL_SLOW = (0.008, 0.114, 0.580, 1.0)   # cobalt blue
COL_FAST = (1.000, 0.600, 0.000, 1.0)   # amber

# Shape-key parameter sets  [b]
SK_PARAMS = {
    "Basis": 3.0,
    "SK_LoB": 1.5,
    "SK_HiB": 5.0,
    "SK_ExB": 8.0,
}


# ── ODE derivatives ───────────────────────────────────────────────────────────
def deriv(x: float, y: float, z: float, b: float):
    """Sprott D derivatives.  b scales the y² nonlinearity."""
    dx = -y
    dy = x + z
    dz = x * z + b * y * y
    return dx, dy, dz


# ── RK4 step ──────────────────────────────────────────────────────────────────
def rk4(x, y, z, b, dt):
    k1x, k1y, k1z = deriv(x,        y,        z,        b)
    k2x, k2y, k2z = deriv(x+dt*k1x/2, y+dt*k1y/2, z+dt*k1z/2, b)
    k3x, k3y, k3z = deriv(x+dt*k2x/2, y+dt*k2y/2, z+dt*k2z/2, b)
    k4x, k4y, k4z = deriv(x+dt*k3x, y+dt*k3y, z+dt*k3z, b)
    return (x + dt*(k1x+2*k2x+2*k3x+k4x)/6,
            y + dt*(k1y+2*k2y+2*k3y+k4y)/6,
            z + dt*(k1z+2*k2z+2*k3z+k4z)/6)


# ── orbit sampler ─────────────────────────────────────────────────────────────
def sample_orbit(b: float):
    """Return (waypoints, speeds) for y²-coupling parameter b."""
    # Offset IC avoids the non-hyperbolic origin neighbourhood too long
    x, y, z = 0.5, 0.5, 0.0
    for _ in range(BURN_IN):
        x, y, z = rk4(x, y, z, b, DT)

    pts, speeds = [], []
    for i in range(N_STEPS):
        x, y, z = rk4(x, y, z, b, DT)
        if i % THIN == 0:
            pts.append(Vector((x, y, z)))
            vx, vy, vz = deriv(x, y, z, b)
            speeds.append(math.sqrt(vx*vx + vy*vy + vz*vz))
    return pts, speeds


# ── Bishop parallel-transport frame ───────────────────────────────────────────
def bishop_frames(pts):
    """Stable transport frame: no curvature twist from Frenet singularities."""
    n = len(pts)
    T, N, B = [None]*n, [None]*n, [None]*n

    T[0] = (pts[1] - pts[0]).normalized()
    ref  = Vector((0, 0, 1))
    if abs(T[0].dot(ref)) > 0.9:
        ref = Vector((0, 1, 0))
    N[0] = T[0].cross(ref).normalized()
    B[0] = T[0].cross(N[0]).normalized()

    for i in range(1, n):
        t_next = (pts[(i+1) % n] - pts[(i-1) % n]).normalized()
        axis   = T[i-1].cross(t_next)
        axl    = axis.length
        if axl > 1e-8:
            angle = math.asin(min(axl, 1.0))
            axis.normalize()
            c, s   = math.cos(angle), math.sin(angle)
            N[i]   = (N[i-1]*c + axis.cross(N[i-1])*s
                      + axis*(axis.dot(N[i-1]))*(1-c))
            N[i].normalize()
        else:
            N[i] = N[i-1].copy()
        T[i] = t_next
        B[i] = T[i].cross(N[i]).normalized()
    return T, N, B


# ── tube mesh builder ─────────────────────────────────────────────────────────
def build_tube(bm, pts, normals, binormals, speeds):
    n   = len(pts)
    seg = TUBE_SEGS
    all_v = []
    for i in range(n):
        ring = []
        for j in range(seg):
            angle = 2 * math.pi * j / seg
            off   = normals[i]*math.cos(angle) + binormals[i]*math.sin(angle)
            ring.append(bm.verts.new(pts[i] + off * TUBE_R))
        all_v.append(ring)

    for i in range(n):
        ni = (i + 1) % n
        for j in range(seg):
            nj = (j + 1) % seg
            bm.faces.new([all_v[i][j], all_v[ni][j],
                          all_v[ni][nj], all_v[i][nj]])
    return all_v


# ── colour attribute ──────────────────────────────────────────────────────────
def paint_speed(me, all_v, speeds):
    attr = me.attributes.get(ATTR_NAME)
    if attr is None:
        attr = me.attributes.new(ATTR_NAME, "FLOAT_COLOR", "POINT")
    spd_min = min(speeds); spd_max = max(speeds) or 1.0
    for i, ring in enumerate(all_v):
        t   = (speeds[i] - spd_min) / (spd_max - spd_min)
        col = tuple(COL_SLOW[k] + t*(COL_FAST[k]-COL_SLOW[k]) for k in range(4))
        for v in ring:
            attr.data[v.index].color = col


# ── material ──────────────────────────────────────────────────────────────────
def make_material():
    """Emission shader driven by the SprottD_Speed attribute."""
    mat = bpy.data.materials.get(MAT_NAME) or bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = ATTR_NAME
    attr.attribute_type = "GEOMETRY"

    emit.inputs["Strength"].default_value = 3.5   # WebXR-safe glow
    nt.links.new(attr.outputs["Color"],  emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])

    out.location  = (400,  0)
    emit.location = (200,  0)
    attr.location = (  0,  0)
    return mat


# ── scene assembly ────────────────────────────────────────────────────────────
def build_scene() -> None:
    # Clear previous SprottD objects
    for obj in list(bpy.data.objects):
        if OBJ_NAME in obj.name:
            bpy.data.objects.remove(obj, do_unlink=True)
    for me in list(bpy.data.meshes):
        if OBJ_NAME in me.name:
            bpy.data.meshes.remove(me, do_unlink=True)

    mat  = make_material()
    keys = list(SK_PARAMS.items())   # [("Basis",3.0), ...]
    basis_name, basis_b = keys[0]

    # ── build basis mesh ──────────────────────────────────────────────────
    print(f"[SprottD] Integrating {basis_name} (b={basis_b})…")
    pts_b, spd_b = sample_orbit(basis_b)
    T, N, Bn     = bishop_frames(pts_b)

    bm  = bmesh.new()
    all_v = build_tube(bm, pts_b, N, Bn, spd_b)

    me  = bpy.data.meshes.new(OBJ_NAME + "_Mesh")
    bm.to_mesh(me); bm.free()
    paint_speed(me, all_v, spd_b)
    me.materials.append(mat)

    ob = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(ob)

    # ── shape keys ────────────────────────────────────────────────────────
    ob.shape_key_add(name=basis_name, from_mix=False)
    sk_basis = me.shape_keys.key_blocks[basis_name]
    verts    = list(me.vertices)

    for sk_name, b in keys[1:]:
        print(f"[SprottD] Integrating {sk_name} (b={b})…")
        pts_sk, spd_sk = sample_orbit(b)
        T_sk, N_sk, B_sk = bishop_frames(pts_sk)

        bm2 = bmesh.new()
        build_tube(bm2, pts_sk, N_sk, B_sk, spd_sk)
        bm2.verts.ensure_lookup_table()
        sk_verts = [v.co.copy() for v in bm2.verts]
        bm2.free()

        sk = ob.shape_key_add(name=sk_name, from_mix=False)
        for i, sv in enumerate(sk.data):
            if i < len(sk_verts):
                sv.co = sk_verts[i]

    # ── poi head ──────────────────────────────────────────────────────────
    # Centre of attractor bounding box
    ctr = sum(pts_b, Vector()) / len(pts_b)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.15, location=ctr)
    poi = bpy.context.active_object
    poi.name = OBJ_NAME + "_PoiHead"
    poi.data.materials.append(mat)

    # ── camera framing ────────────────────────────────────────────────────
    xs = [v.x for v in pts_b]; ys = [v.y for v in pts_b]; zs = [v.z for v in pts_b]
    span = max(max(xs)-min(xs), max(ys)-min(ys), max(zs)-min(zs))
    cam_dist = span * 1.6

    cam_data = bpy.data.cameras.new("Camera")
    cam_obj  = bpy.data.objects.new("Camera", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    cam_obj.location = (cam_dist, -cam_dist * 0.8, cam_dist * 0.5)
    bpy.context.scene.camera = cam_obj

    # Point camera at attractor centre
    direction = (Vector(cam_obj.location) - ctr).normalized()
    cam_obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

    # ── lighting ──────────────────────────────────────────────────────────
    for light in [o for o in bpy.data.objects if o.type == 'LIGHT']:
        bpy.data.objects.remove(light, do_unlink=True)
    bpy.ops.object.light_add(type='AREA', location=(3, -3, 6))
    area = bpy.context.active_object
    area.data.energy = 400

    print("[SprottD] Scene built — run record.py to render viewport.mp4")


build_scene()

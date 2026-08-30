"""
Nosé–Hoover Oscillator — Thermostated Harmonic, KAM/Chaos Coexistence,
Maxwell-Boltzmann Ergodicity
Blender 5.1  |  bpy direct-data API  |  no UI context required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The Nosé–Hoover oscillator couples a harmonic oscillator to a virtual
thermostat friction variable ξ:

    ẋ =  y                      position derivative
    ẏ = −x + ξ·y               restoring force + friction ξ
    ξ̇ =  y² − T               ξ grows when "too hot" (y²>T), shrinks otherwise

At canonical temperature T=1, the time average ⟨y²⟩→T in the ergodic sea,
reproducing Maxwell-Boltzmann statistics.  The phase-space divergence
∇·v = ∂ẋ/∂x + ∂ẏ/∂y + ∂ξ̇/∂ξ = ξ is NOT constant — it oscillates with ξ,
meaning volume expands and contracts.  ⟨ξ⟩=0 on the ergodic sea ensures
long-run volume conservation (canonical ensemble).

What makes this system extraordinary is its KAM structure: for MOST initial
conditions the trajectory is fully chaotic, but specific ICs land on
invariant 2-D tori embedded in the 3-D (x,y,ξ) phase space.  These tori
are the non-ergodic "integrable islands" typical of mixed KAM/chaos systems.

Mesh: Bishop-parallel-transport tube through 3200 waypoints.
Shape keys sweep IC and temperature to reveal different topology classes.

Sources:
  Nosé S (1984) J Chem Phys 81(1):511 — canonical-ensemble MD, eqs PD
  Hoover WG (1985) Phys Rev A 31(3):1695 — minimal ODE, LLNL US-Gov PD
  Sprott JC (2010) Elegant Chaos, World Scientific — "Sprott A" alias, eqs PD
"""

import bpy
import bmesh
import numpy as np

# ── PARAMETERS ─────────────────────────────────────────────────────────────
T_TARGET   = 1.0       # canonical temperature; ⟨y²⟩→T in ergodic sea
DT         = 0.010     # RK4 step size (stability: |eigenvalues·DT|≪1)
BURN_IN    = 5_000     # discard this many steps (transient to attractor)
N_STEPS    = 80_000    # integration steps after burn-in
SKIP       = 25        # sample 1 in SKIP steps → 3200 waypoints
TUBE_R     = 0.016     # tube cross-section radius, metres
TUBE_SIDES = 12        # polygon sides per ring (even, for mirroring)
POI_R      = 0.082     # bounding radius for poi-head export scale
OBJ_NAME   = "NoseHoover"

COBALT = (0.03, 0.15, 0.58, 1.0)   # ξ < 0: thermostat cooling
AMBER  = (1.00, 0.65, 0.00, 1.0)   # ξ > 0: thermostat heating

# ── RK4 INTEGRATOR ─────────────────────────────────────────────────────────
def _nh_deriv(state: np.ndarray, T: float) -> np.ndarray:
    """
    Nosé–Hoover vector field.  state = [x, y, xi].
    Why not scipy.solve_ivp?  For long trajectories at fixed DT, a plain RK4
    loop with numpy is faster than the adaptive scipy overhead and lets us
    control exactly which steps we sample.
    """
    x, y, xi = state
    return np.array([y,  -x + xi * y,  y * y - T])


def integrate_nh(x0: float, y0: float, xi0: float, T: float) -> tuple:
    """
    Burn-in N=BURN_IN steps, then collect every SKIP-th step.
    Returns (pts [M×3], xi_vals [M]) where M = N_STEPS // SKIP.
    """
    s = np.array([x0, y0, xi0], dtype=np.float64)
    for _ in range(BURN_IN):
        k1 = _nh_deriv(s, T)
        k2 = _nh_deriv(s + 0.5 * DT * k1, T)
        k3 = _nh_deriv(s + 0.5 * DT * k2, T)
        k4 = _nh_deriv(s + DT * k3, T)
        s += (DT / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)

    M = N_STEPS // SKIP
    pts = np.empty((M, 3), dtype=np.float64)
    xi_vals = np.empty(M, dtype=np.float64)
    idx = 0
    for step in range(N_STEPS):
        k1 = _nh_deriv(s, T)
        k2 = _nh_deriv(s + 0.5 * DT * k1, T)
        k3 = _nh_deriv(s + 0.5 * DT * k2, T)
        k4 = _nh_deriv(s + DT * k3, T)
        s += (DT / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)
        if step % SKIP == 0 and idx < M:
            pts[idx] = s
            xi_vals[idx] = s[2]    # ξ = friction; sign encodes heating/cooling
            idx += 1
    return pts[:idx], xi_vals[:idx]


# ── BISHOP PARALLEL TRANSPORT ───────────────────────────────────────────────
def bishop_frame(pts: np.ndarray) -> tuple:
    """
    Build Bishop (rotation-minimising) frame along the curve.
    WHY Bishop, not Frenet?  Frenet is undefined at inflection points and
    has spurious twisting at low-curvature segments.  Bishop propagates the
    normal by the smallest possible rotation at each step.
    Returns N [M×3], B [M×3] (normal and binormal).
    """
    M = len(pts)
    T = np.diff(pts, axis=0)
    T /= (np.linalg.norm(T, axis=1, keepdims=True) + 1e-12)
    T = np.vstack([T, T[-1]])  # extend last tangent

    # seed the first normal perpendicular to T[0]
    N = np.empty((M, 3), dtype=np.float64)
    ax = np.array([1.0, 0.0, 0.0]) if abs(T[0, 0]) < 0.9 else np.array([0.0, 1.0, 0.0])
    N[0] = np.cross(T[0], ax)
    N[0] /= np.linalg.norm(N[0]) + 1e-12

    for i in range(1, M):
        axis = np.cross(T[i - 1], T[i])
        sin_a = np.linalg.norm(axis)
        if sin_a < 1e-10:
            N[i] = N[i - 1]
        else:
            axis /= sin_a
            cos_a = np.dot(T[i - 1], T[i])
            N[i] = (cos_a * N[i - 1]
                    + sin_a * np.cross(axis, N[i - 1])
                    + (1 - cos_a) * np.dot(axis, N[i - 1]) * axis)
            N[i] /= np.linalg.norm(N[i]) + 1e-12

    B = np.cross(T, N)   # binormal = T × N
    return N, B, T


def build_tube(pts, N, B, T):
    """
    Extrude the curve into a tube.  Each waypoint becomes a polygon ring.
    Faces connect consecutive rings.  Returns verts [M*SIDES×3], faces list.
    """
    angles = np.linspace(0, 2 * np.pi, TUBE_SIDES, endpoint=False)
    ca, sa = np.cos(angles), np.sin(angles)
    M = len(pts)
    # shape: (M, SIDES, 3)
    rings = (pts[:, None, :]
             + TUBE_R * ca[None, :, None] * N[:, None, :]
             + TUBE_R * sa[None, :, None] * B[:, None, :])
    verts = rings.reshape(-1, 3).tolist()

    faces = []
    for r in range(M - 1):
        for s in range(TUBE_SIDES):
            s2 = (s + 1) % TUBE_SIDES
            a, b = r * TUBE_SIDES + s, r * TUBE_SIDES + s2
            c, d = (r + 1) * TUBE_SIDES + s2, (r + 1) * TUBE_SIDES + s
            faces.append((a, b, c, d))
    return verts, faces


# ── VERTEX COLOUR ───────────────────────────────────────────────────────────
def make_xi_colours(xi_vals: np.ndarray) -> np.ndarray:
    """
    Map ξ (thermostat friction) to cobalt→amber.
    ξ < 0 → thermostat cooling (cobalt); ξ > 0 → heating (amber).
    We normalise by the symmetric range max|ξ|, then lerp.
    The colour encodes which phase the thermostat is in, moment to moment.
    """
    xi_norm = np.clip(0.5 + xi_vals / (2.0 * (np.max(np.abs(xi_vals)) + 1e-9)),
                      0.0, 1.0)  # 0 = full cobalt, 1 = full amber
    C = np.array(COBALT[:3])
    A = np.array(AMBER[:3])
    colours = (1 - xi_norm[:, None]) * C[None, :] + xi_norm[:, None] * A[None, :]
    # replicate per ring vertex
    colours_full = np.repeat(colours, TUBE_SIDES, axis=0)
    rgba = np.ones((len(colours_full), 4), dtype=np.float32)
    rgba[:, :3] = colours_full
    return rgba


# ── MAIN BUILDER ────────────────────────────────────────────────────────────
def build_shape(x0, y0, xi0, T):
    """Integrate + bishop + tube → (verts, xi_colours_rgba)."""
    pts, xi_vals = integrate_nh(x0, y0, xi0, T)
    # Scale to poi bounding radius
    max_r = np.max(np.sqrt((pts ** 2).sum(axis=1))) + 1e-9
    pts *= POI_R / max_r
    pts -= pts.mean(axis=0)        # centre
    N, B, Tv = bishop_frame(pts)
    verts, faces = build_tube(pts, N, B, Tv)
    xi_colours = make_xi_colours(xi_vals)
    return verts, faces, xi_colours


def run():
    # ── 1. CLEAN SCENE ───────────────────────────────────────────────────
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)

    # ── 2. BUILD SHAPE KEYS ──────────────────────────────────────────────
    # (x0, y0, xi0, T)  — each gives a geometrically distinct trajectory.
    # SK_Torus: IC chosen near a non-ergodic KAM island (low total energy
    #   E≈0.5·x₀²+0.5·y₀²=0.98); produces a quasi-periodic winding orbit.
    # SK_HotT:  T=2 → larger ergodic sea, more "heating" amber dominance.
    # SK_ColdT: T=0.5 → confined trajectory, stronger cobalt signature.
    SKS = [
        ("Basis",    0.0, 2.0, 0.0, T_TARGET),   # deep ergodic sea
        ("SK_Torus", 0.0, 1.4, 0.0, T_TARGET),   # near KAM island
        ("SK_HotT",  0.0, 2.0, 0.0, 2.0),        # T=2 hot bath
        ("SK_ColdT", 0.0, 1.0, 0.0, 0.5),        # T=0.5 cool bath
    ]

    basis_verts, faces, basis_col = build_shape(*SKS[0][1:])

    # ── 3. CREATE MESH ───────────────────────────────────────────────────
    me = bpy.data.meshes.new(OBJ_NAME)
    me.from_pydata(basis_verts, [], faces)
    me.validate()

    # ── 4. VERTEX COLOUR ATTRIBUTE ───────────────────────────────────────
    attr = me.color_attributes.new(
        name="NH_Xi", type="FLOAT_COLOR", domain="POINT"
    )
    attr.data.foreach_set("color", basis_col.ravel())

    # ── 5. SHAPE KEYS ────────────────────────────────────────────────────
    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    obj.shape_key_add(name="Basis", from_mix=False)

    for name, x0, y0, xi0, T in SKS[1:]:
        sk_verts, _, _ = build_shape(x0, y0, xi0, T)
        # All shape keys share the same topology (same SKIP → same vertex count)
        sk = obj.shape_key_add(name=name, from_mix=False)
        flat = []
        for v in sk_verts:
            flat.extend(v)
        sk.data.foreach_set("co", flat)

    # ── 6. MATERIAL ──────────────────────────────────────────────────────
    mat = bpy.data.materials.new("NH_Mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled")
    attr  = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_type = "GEOMETRY"
    attr.attribute_name = "NH_Xi"
    bsdf.inputs["Roughness"].default_value  = 0.26
    bsdf.inputs["Metallic"].default_value   = 0.45
    bsdf.inputs["Emission Strength"].default_value = 1.8
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    obj.data.materials.append(mat)

    # ── 7. HOLOFLOW METADATA ─────────────────────────────────────────────
    obj["holoflow:facet"]        = False
    obj["holoflow:category"]     = "poi-head"
    obj["holoflow:export_name"]  = "hf_nose_hoover_poi"

    # +Y up, apply transform for correct GLB export
    obj.rotation_euler = (1.5707963, 0.0, 0.0)   # π/2 around X → +Y up
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # ── 8. ORIGIN ────────────────────────────────────────────────────────
    bpy.ops.object.origin_set(type="ORIGIN_CENTER_OF_MASS", center="BOUNDS")

    print(f"[NoseHoover] Vertices: {len(me.vertices)}, Faces: {len(me.polygons)}")
    print(f"[NoseHoover] Shape keys: {list(obj.data.shape_keys.key_blocks.keys())}")
    print("[NoseHoover] Run holoflow GLB export: Draco-6, WebP, morph=True, colors=True")


run()

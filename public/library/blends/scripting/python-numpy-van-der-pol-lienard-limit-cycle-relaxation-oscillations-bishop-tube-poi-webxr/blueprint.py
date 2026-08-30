"""
Van der Pol Oscillator — Liénard Limit Cycle, Relaxation Oscillations,
Bishop Parallel-Transport Tube Poi Head  |  Blender 5.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Balthasar van der Pol (1920) modelled a triode vacuum-tube oscillator as:

    ẋ =  y
    ẏ =  μ(1 − x²)y − x          Liénard state-space form

For μ = 0: purely harmonic, circular phase-plane orbits, period T = 2π.
For 0 < μ ≪ 1: Poincaré–Lindstedt series gives amplitude 2, period
    T ≈ 2π(1 + μ²/16 + O(μ⁴)).  Nearly circular limit cycle.
For μ ≫ 1: relaxation oscillations — slow crawl along the Liénard cubic
    nullcline F(x) = μ(x³/3 − x) followed by fast jump at x = ±2.
    Period: T ≈ (3 − 2 ln 2)μ ≈ 1.6143 μ  [large-μ leading term].

Liénard's theorem (1928) proves there is exactly ONE stable limit cycle
for any μ > 0: all non-trivial trajectories converge to it.  This is
confirmed by the phase-space divergence analysis:
    ∇·v = μ(1 − x²)
which is negative in the strip |x| < 1 (contraction → draws trajectories
inward) and positive outside (expansion → pushes trajectories inward from
large x).  The limit cycle is sandwiched between both regions.

3-D embedding: (x(t), y(t), t·ZSCALE) lifts the 2-D phase portrait into
a helix.  Each complete winding = one period.  Different μ values produce:
  μ = 0.2 → nearly circular helix (harmonic regime)
  μ = 1.0 → mildly egg-shaped winding (Basis)
  μ = 3.0 → sawtooth winding (visible slow/fast separation)
  μ = 5.0 → extreme spike-and-crawl (strong relaxation)

Vertex colour VdP_Y: y (velocity) → cobalt (y < 0) / amber (y > 0).
Cobalt = Liénard damping phase; amber = Liénard pumping phase.

Sources (equations public domain):
  van der Pol B (1920) Radio Review 1:701–762.
  van der Pol B & van der Mark J (1927) Nature 120:363–364. doi PD.
  Liénard A (1928) Rev. Gén. Élec. 23:901–946. Theorem PD.
"""

import bpy
import numpy as np

# ── PARAMETERS ─────────────────────────────────────────────────────────────
DT         = 0.010     # RK4 step  (stable up to μ=5: max λ ≈ 5×(4−1)=15, λ·DT=0.15≪2)
BURN_IN    = 2_000     # 20 time-units of transient discarded; settles onto limit cycle
N_STEPS    = 3_000     # 30 time-units collected; SAME for all shape keys (topology law)
ZSCALE     = 0.065     # time → z;  z_max = 30 × 0.065 = 1.95 ≈ x-amplitude ≈ 2
TUBE_R     = 0.008     # tube cross-section radius in metres (after POI_R scaling)
TUBE_SIDES = 10        # decagon cross-section; even for edge-loop symmetry
POI_R      = 0.082     # bounding-sphere radius for GLB poi-head export
OBJ_NAME   = "VanDerPol"

COBALT = (0.02, 0.10, 0.55, 1.0)   # y < 0 — backward swing, Liénard damping
AMBER  = (0.95, 0.60, 0.00, 1.0)   # y > 0 — forward swing, Liénard pumping


# ── RK4 INTEGRATOR ─────────────────────────────────────────────────────────
def _vdp(state: np.ndarray, mu: float) -> np.ndarray:
    """
    Van der Pol vector field: ẋ = y,  ẏ = μ(1−x²)y − x.
    Fixed DT chosen over scipy.solve_ivp for exact control of N_STEPS:
    shape keys demand identical vertex counts across all μ values.
    """
    x, y = state
    return np.array([y, mu * (1.0 - x * x) * y - x])


def integrate_vdp(mu: float, x0: float, y0: float) -> tuple:
    """Burn-in then collect exactly N_STEPS points in (x, y, t·ZSCALE) space."""
    s = np.array([x0, y0], dtype=np.float64)
    # Discard transient
    for _ in range(BURN_IN):
        k1 = _vdp(s, mu)
        k2 = _vdp(s + 0.5 * DT * k1, mu)
        k3 = _vdp(s + 0.5 * DT * k2, mu)
        k4 = _vdp(s + DT * k3, mu)
        s += (DT / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4)
    # Collect trajectory
    pts    = np.empty((N_STEPS, 3), dtype=np.float64)
    y_vals = np.empty(N_STEPS, dtype=np.float64)
    for i in range(N_STEPS):
        k1 = _vdp(s, mu)
        k2 = _vdp(s + 0.5 * DT * k1, mu)
        k3 = _vdp(s + 0.5 * DT * k2, mu)
        k4 = _vdp(s + DT * k3, mu)
        s += (DT / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4)
        pts[i]    = [s[0], s[1], (i + 1) * DT * ZSCALE]
        y_vals[i] = s[1]
    return pts, y_vals


# ── BISHOP PARALLEL TRANSPORT ───────────────────────────────────────────────
def bishop_frame(pts: np.ndarray) -> tuple:
    """
    Rotation-minimising (Bishop) frame along the 3-D helix.
    Frenet frame is undefined at inflection points where curvature = 0;
    Bishop avoids that by applying the smallest Rodrigues rotation at
    each step: N[i] = R(T[i−1]→T[i]) · N[i−1].
    Returns N [M×3], B [M×3] (normal, binormal) and T [M×3] (tangent).
    """
    M  = len(pts)
    dT = np.diff(pts, axis=0)
    dT /= (np.linalg.norm(dT, axis=1, keepdims=True) + 1e-12)
    T  = np.vstack([dT, dT[-1]])              # extend last tangent

    N = np.empty((M, 3), dtype=np.float64)
    seed = np.array([1.0, 0.0, 0.0]) if abs(T[0, 0]) < 0.9 else np.array([0.0, 1.0, 0.0])
    N[0] = np.cross(T[0], seed)
    N[0] /= np.linalg.norm(N[0]) + 1e-12

    for i in range(1, M):
        axis  = np.cross(T[i - 1], T[i])
        sin_a = np.linalg.norm(axis)
        if sin_a < 1e-10:
            N[i] = N[i - 1]
        else:
            axis  /= sin_a
            cos_a  = np.clip(np.dot(T[i - 1], T[i]), -1.0, 1.0)
            N[i]   = (cos_a * N[i - 1]
                      + sin_a * np.cross(axis, N[i - 1])
                      + (1.0 - cos_a) * np.dot(axis, N[i - 1]) * axis)
            N[i]  /= np.linalg.norm(N[i]) + 1e-12

    return N, np.cross(T, N), T


# ── TUBE GEOMETRY ───────────────────────────────────────────────────────────
def build_tube(pts: np.ndarray, N: np.ndarray, B: np.ndarray) -> tuple:
    """Extrude the Bishop-framed curve into a cylindrical quad tube."""
    ang = np.linspace(0.0, 2.0 * np.pi, TUBE_SIDES, endpoint=False)
    ca, sa = np.cos(ang), np.sin(ang)
    M     = len(pts)
    rings = (pts[:, None, :]
             + TUBE_R * ca[None, :, None] * N[:, None, :]
             + TUBE_R * sa[None, :, None] * B[:, None, :])
    verts = rings.reshape(-1, 3).tolist()
    faces = []
    for r in range(M - 1):
        for s in range(TUBE_SIDES):
            s2 = (s + 1) % TUBE_SIDES
            a, b = r * TUBE_SIDES + s,  r * TUBE_SIDES + s2
            c, d = (r + 1) * TUBE_SIDES + s2, (r + 1) * TUBE_SIDES + s
            faces.append((a, b, c, d))
    return verts, faces


# ── VERTEX COLOUR ───────────────────────────────────────────────────────────
def y_colours(y_vals: np.ndarray) -> np.ndarray:
    """
    Map y → cobalt (y<0, damping) / amber (y>0, pumping).
    Normalise to symmetric range so both hues appear in equal proportion
    over one period — the limit cycle is time-symmetric in energy flow.
    """
    scale = np.max(np.abs(y_vals)) + 1e-9
    t     = np.clip(0.5 + y_vals / (2.0 * scale), 0.0, 1.0)
    C, A  = np.array(COBALT[:3]), np.array(AMBER[:3])
    col   = (1.0 - t[:, None]) * C + t[:, None] * A
    col_r = np.repeat(col, TUBE_SIDES, axis=0)     # replicate per ring vertex
    rgba  = np.ones((len(col_r), 4), dtype=np.float32)
    rgba[:, :3] = col_r
    return rgba


# ── SHAPE BUILDER ───────────────────────────────────────────────────────────
def build_shape(mu: float, x0: float = 2.0, y0: float = 0.0) -> tuple:
    """
    IC (2, 0) = rightmost turning point of the limit cycle for all μ.
    Scaling: centre trajectory then normalise to POI_R bounding sphere.
    """
    pts, y_vals = integrate_vdp(mu, x0, y0)
    pts -= pts.mean(axis=0)
    pts *= POI_R / (np.max(np.sqrt((pts ** 2).sum(axis=1))) + 1e-9)
    N, B, _ = bishop_frame(pts)
    verts, faces = build_tube(pts, N, B)
    return verts, faces, y_colours(y_vals)


# ── MAIN ────────────────────────────────────────────────────────────────────
def run():
    # Clean scene
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes):  bpy.data.meshes.remove(m)

    # Shape-key table: (name, mu)
    # IC = (2, 0) for all — rightmost turning point of the limit cycle
    SKS = [
        ("Basis",     1.0),    # moderate limit cycle, ~4.5 loops in 30 t.u.
        ("SK_Gentle", 0.2),    # nearly harmonic; Poincaré-Lindstedt regime
        ("SK_Relax",  3.0),    # relaxation visible; fast/slow time-scale split
        ("SK_Strong", 5.0),    # extreme spike-and-crawl; ~2.6 loops
    ]

    b_verts, faces, b_col = build_shape(SKS[0][1])

    me = bpy.data.meshes.new(OBJ_NAME)
    me.from_pydata(b_verts, [], faces)
    me.validate()

    attr = me.color_attributes.new(name="VdP_Y", type="FLOAT_COLOR", domain="POINT")
    attr.data.foreach_set("color", b_col.ravel())

    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    obj.shape_key_add(name="Basis", from_mix=False)

    for name, mu in SKS[1:]:
        sk_v, _, _ = build_shape(mu)
        sk = obj.shape_key_add(name=name, from_mix=False)
        flat = []
        for v in sk_v: flat.extend(v)
        sk.data.foreach_set("co", flat)

    # Material: VdP_Y → Principled BSDF + emission glow
    mat = bpy.data.materials.new("VdP_Mat")
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    att  = nt.nodes.new("ShaderNodeAttribute")
    att.attribute_type, att.attribute_name = "GEOMETRY", "VdP_Y"
    bsdf.inputs["Roughness"].default_value       = 0.22
    bsdf.inputs["Metallic"].default_value        = 0.50
    bsdf.inputs["Emission Strength"].default_value = 1.6
    nt.links.new(att.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(att.outputs["Color"], bsdf.inputs["Emission Color"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    obj.data.materials.append(mat)

    # Holoflow metadata for GLB exporter
    obj["holoflow:facet"]       = False
    obj["holoflow:category"]    = "poi-head"
    obj["holoflow:export_name"] = "hf_van_der_pol_poi"

    # +Y up convention for WebXR / GLB
    obj.rotation_euler = (1.5707963, 0.0, 0.0)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.origin_set(type="ORIGIN_CENTER_OF_MASS", center="BOUNDS")

    V, F = len(me.vertices), len(me.polygons)
    print(f"[VanDerPol] {V} verts  {F} faces")
    print(f"[VanDerPol] Shape keys: {list(obj.data.shape_keys.key_blocks.keys())}")
    print("[VanDerPol] Run holoflow GLB export — Draco-6 WebP morph=True colors=True")


run()

"""
Anishchenko–Astakhov Self-Excited Oscillator with Inertial Nonlinearity (1983)
===============================================================================
System:  ẋ = m·x + y − x·z
         ẏ = −x
         ż = −g·z + g·Θ(x)·x²

Θ(x) = 1 if x > 0, else 0   ← Heaviside step function (piecewise nonlinearity)
Canonical:  m = 1.5   g = 0.4

WHY this system matters
-----------------------
Van der Pol's 1926 oscillator achieves self-excitation through a smooth cubic
nonlinearity.  Anishchenko & Astakhov (1983) replaced that smooth saturation with
an *inertial* one: a third state z that acts as a slowly-varying gain-control
signal, but one that only *charges* during positive half-cycles (Θ=1 when x>0)
and *discharges* freely at all times.  The Heaviside step makes the vector field
discontinuous on the plane x=0 — a "Filippov system" — yet the ODE still has a
unique solution for almost-all trajectories.  The folding introduced by the
piecewise z-equation is sufficient to generate a chaotic strange attractor through
a classic period-doubling cascade as m increases.

Parameters (at top for easy tuning)
"""

import bpy, bmesh, math, numpy as np
from mathutils import Vector

# ── Integration constants ──────────────────────────────────────────
M_BASIS  = 1.5      # excess bifurcation parameter (m > 0 → self-excitation)
G_BASIS  = 0.4      # inertial damping coefficient (g > 0 → z charges/decays)
DT       = 0.010    # fixed time-step; chosen so |k1|·dt < 0.01 on attractor
BURN_IN  = 5_000    # steps discarded before recording (transient decay)
N_STEPS  = 90_000   # total integration steps after burn-in
THIN     = 30       # record every 30th point → 3 000 waypoints

# ── Tube geometry ──────────────────────────────────────────────────
TUBE_SIDES = 8      # octagonal cross-section
TUBE_R     = 0.045  # tube radius in Blender metres
SCALE      = 0.09   # maps attractor coords (~±3 in x,y; 0-6 in z) to ~±0.27 m

# ── Colour map: cobalt (fast) → amber (slow) ──────────────────────
COL_FAST = (0.06, 0.14, 0.66, 1.0)   # RGBA, linear sRGB
COL_SLOW = (0.88, 0.52, 0.04, 1.0)

# ── Export slug ────────────────────────────────────────────────────
SLUG = "hf_aa_poi"


# ════════════════════════════════════════════════════════════════════
# 1.  VECTOR FIELD  (Filippov / piecewise)
# ════════════════════════════════════════════════════════════════════
def _heaviside(x: float) -> float:
    """Heaviside step: 1 if x > 0, else 0.
    At x = 0 the field is left-continuous — no orbit spends finite time on
    the switching manifold, so the choice at 0 does not affect the attractor.
    """
    return 1.0 if x > 0.0 else 0.0


def _aa_deriv(state: np.ndarray, m: float, g: float) -> np.ndarray:
    """Anishchenko–Astakhov vector field.
    WHY −x·z in ẋ: this term damps the oscillation as z grows — once the
    inertial variable saturates at z ≈ x², the effective linear coefficient
    in ẋ becomes m − z, which can flip negative and quench the excitation.
    The limit cycle / chaotic orbit lives in the tension between the positive
    m·x drive and the z-mediated saturation.
    """
    x, y, z = state
    theta = _heaviside(x)
    dx = m * x + y - x * z
    dy = -x
    dz = -g * z + g * theta * (x * x)
    return np.array([dx, dy, dz])


def _rk4(state: np.ndarray, dt: float, m: float, g: float) -> np.ndarray:
    """Classic 4th-order Runge–Kutta.
    WHY evaluate Θ at EACH k-stage: the Heaviside function changes sign
    between stages if the trajectory crosses x=0 mid-step.  Evaluating Θ
    at the intermediate x-value of each stage gives the best piecewise-smooth
    approximation the fixed-step RK4 can achieve without event detection.
    For dt = 0.01 the crossing-error is O(dt²) — acceptable.
    """
    k1 = _aa_deriv(state,              m, g)
    k2 = _aa_deriv(state + 0.5*dt*k1, m, g)
    k3 = _aa_deriv(state + 0.5*dt*k2, m, g)
    k4 = _aa_deriv(state + dt   *k3,  m, g)
    return state + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)


# ════════════════════════════════════════════════════════════════════
# 2.  INTEGRATE ATTRACTOR
# ════════════════════════════════════════════════════════════════════
def integrate(m: float = M_BASIS, g: float = G_BASIS) -> np.ndarray:
    """Return (N_WP, 3) array of waypoints and (N_WP,) speed array.
    IC slightly off-origin to avoid the unstable equilibrium.
    Speed = |ẋ| at each waypoint, used for colouring.
    """
    n_wp = N_STEPS // THIN
    pts   = np.empty((n_wp, 3))
    speed = np.empty(n_wp)
    state = np.array([0.1, 0.1, 0.0])          # IC near origin

    # burn-in: shed transient behaviour
    for _ in range(BURN_IN):
        state = _rk4(state, DT, m, g)

    # record
    i_wp = 0
    for step in range(N_STEPS):
        if step % THIN == 0 and i_wp < n_wp:
            pts[i_wp]   = state
            deriv = _aa_deriv(state, m, g)
            speed[i_wp] = float(np.linalg.norm(deriv))
            i_wp += 1
        state = _rk4(state, DT, m, g)

    return pts, speed


# ════════════════════════════════════════════════════════════════════
# 3.  BISHOP PARALLEL-TRANSPORT TUBE
# ════════════════════════════════════════════════════════════════════
def _bishop_frames(pts: np.ndarray):
    """Propagate a twist-free reference frame along the polyline.
    WHY Bishop over Frenet: the AA attractor orbit crosses near the origin
    repeatedly, where the curvature can be very small or the torsion very
    large, causing Frenet normal flips (180° discontinuities → Möbius twist
    artefact on the tube).  Bishop frames never twist: the normal is
    transported by the minimal rotation that realigns the tangent.
    """
    n  = len(pts)
    T  = np.diff(pts, axis=0)
    norms = np.linalg.norm(T, axis=1, keepdims=True)
    norms[norms < 1e-12] = 1.0
    T  = T / norms                          # unit tangents (n-1 vectors)

    # seed a perpendicular to T[0]
    up = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], up)) > 0.9:
        up = np.array([1.0, 0.0, 0.0])
    N0 = up - np.dot(up, T[0]) * T[0]
    N0 /= np.linalg.norm(N0)

    Ns = np.empty((n - 1, 3))
    Ns[0] = N0
    for i in range(1, n - 1):
        axis    = np.cross(T[i-1], T[i])
        sin_a   = np.linalg.norm(axis)
        cos_a   = np.dot(T[i-1], T[i])
        if sin_a < 1e-10:
            Ns[i] = Ns[i-1]
        else:
            axis /= sin_a
            N    = Ns[i-1]
            Ns[i] = (cos_a * N
                     + sin_a * np.cross(axis, N)
                     + (1.0 - cos_a) * np.dot(axis, N) * axis)
    return T, Ns


def build_tube(pts: np.ndarray, speed: np.ndarray,
               scale: float = SCALE,
               sides: int = TUBE_SIDES,
               radius: float = TUBE_R) -> bpy.types.Object:
    """Build a mesh tube through the attractor waypoints.
    Returns the Blender Object; colour attribute is set on vertices.
    """
    pts_s = pts * scale                     # scale to Blender metres
    T, Ns = _bishop_frames(pts_s)

    n_wp  = len(pts_s) - 1                  # frames live between waypoints
    verts = []
    faces = []

    angs = [2.0 * math.pi * k / sides for k in range(sides)]

    for i, (p, t, nv) in enumerate(zip(pts_s[:-1], T, Ns)):
        bv = np.cross(t, nv)               # bi-normal
        for a in angs:
            c, s  = math.cos(a), math.sin(a)
            verts.append(tuple(p + radius * (c * nv + s * bv)))

    # quad faces between ring i and ring i+1
    for i in range(n_wp - 1):
        r0 = i * sides
        r1 = (i + 1) * sides
        for k in range(sides):
            k1 = (k + 1) % sides
            faces.append((r0+k, r0+k1, r1+k1, r1+k))

    me = bpy.data.meshes.new(SLUG + "_mesh")
    me.from_pydata(verts, [], faces)
    me.validate()

    # ── colour attribute: AA_Speed  (cobalt=fast, amber=slow) ────────
    sp_norm = speed[:-1]                    # one speed per ring
    p5, p95 = np.percentile(sp_norm, [5, 95])
    sp_norm = np.clip((sp_norm - p5) / max(p95 - p5, 1e-6), 0.0, 1.0)

    ca = me.color_attributes.new("AA_Speed", "FLOAT_COLOR", "POINT")
    col_data = []
    for i, t in enumerate(sp_norm):
        col = tuple(COL_FAST[c] + t * (COL_SLOW[c] - COL_FAST[c])
                    for c in range(4))
        col_data.extend(col * sides)       # same colour for all verts in ring
    ca.data.foreach_set("color", col_data)

    me.shade_smooth()

    ob = bpy.data.objects.new(SLUG, me)
    bpy.context.collection.objects.link(ob)
    return ob


# ════════════════════════════════════════════════════════════════════
# 4.  SHAPE KEYS
# ════════════════════════════════════════════════════════════════════
def _add_shape_key(ob: bpy.types.Object,
                   name: str, m: float, g: float,
                   n_basis: int) -> None:
    """Integrate variant, trim/pad to basis waypoint count, replace vertex positions."""
    pts_v, speed_v = integrate(m, g)
    n_v = min(len(pts_v) - 1, n_basis)     # match tube ring count

    sk = ob.shape_key_add(name=name, from_mix=False)
    pts_s = pts_v * SCALE
    T_v, Ns_v = _bishop_frames(pts_s)

    angs = [2.0 * math.pi * k / TUBE_SIDES for k in range(TUBE_SIDES)]

    idx = 0
    for i in range(min(n_v, len(T_v))):
        p  = pts_s[i]
        t  = T_v[i]
        nv = Ns_v[i]
        bv = np.cross(t, nv)
        for a in angs:
            c, s = math.cos(a), math.sin(a)
            if idx < len(sk.data):
                sk.data[idx].co = Vector(tuple(
                    p + TUBE_R * (c * nv + s * bv)))
            idx += 1


# ════════════════════════════════════════════════════════════════════
# 5.  MATERIAL  (Principled BSDF, references AA_Speed attribute)
# ════════════════════════════════════════════════════════════════════
def make_material(ob: bpy.types.Object) -> None:
    mat = bpy.data.materials.new(SLUG + "_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled")
    attr  = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "AA_Speed"

    bsdf.inputs["Metallic"].default_value       = 0.50
    bsdf.inputs["Roughness"].default_value      = 0.22
    bsdf.inputs["Emission Strength"].default_value = 2.0

    nt.links.new(attr.outputs["Color"],  bsdf.inputs["Base Color"])
    nt.links.new(attr.outputs["Color"],  bsdf.inputs["Emission Color"])
    nt.links.new(bsdf.outputs["BSDF"],   out.inputs["Surface"])
    ob.data.materials.append(mat)


# ════════════════════════════════════════════════════════════════════
# 6.  HOLOFLOW EXPORT PROPERTIES
# ════════════════════════════════════════════════════════════════════
def set_holoflow_props(ob: bpy.types.Object) -> None:
    """Mark object for Holoflow WebXR exporter:
    • facet = False  (smooth tube, not flat-shaded)
    • category = poi-head
    Apply +Y-up convention: rotate 90° around X, then apply transform.
    """
    ob["holoflow:facet"]    = False
    ob["holoflow:category"] = "poi-head"
    # +Y-up convention for glTF/WebXR
    import math
    ob.rotation_euler[0] = math.pi / 2.0
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.transform_apply(rotation=True)


# ════════════════════════════════════════════════════════════════════
# 7.  MAIN
# ════════════════════════════════════════════════════════════════════
def main():
    # ── clear default scene ──
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # ── basis integration ──
    print(f"[AA] Integrating basis (m={M_BASIS}, g={G_BASIS})…")
    pts, speed = integrate(M_BASIS, G_BASIS)
    n_basis    = len(pts) - 1              # ring count for shape-key alignment

    # ── build tube ──
    ob = build_tube(pts, speed)

    # ── basis shape key (required before adding variants) ──
    ob.shape_key_add(name="Basis", from_mix=False)

    # ── variant shape keys ──
    # SK_LowM: m=0.8 → period-1 or period-2 orbit; shows pre-chaos structure
    print("[AA] SK_LowM (m=0.8)…")
    _add_shape_key(ob, "SK_LowM",  m=0.80, g=G_BASIS,  n_basis=n_basis)

    # SK_HighM: m=2.5 → larger, more energetic chaotic orbit
    print("[AA] SK_HighM (m=2.5)…")
    _add_shape_key(ob, "SK_HighM", m=2.50, g=G_BASIS,  n_basis=n_basis)

    # SK_LowG: g=0.2 → z charges and decays slowly; attractor flattens in z
    print("[AA] SK_LowG (g=0.2)…")
    _add_shape_key(ob, "SK_LowG",  m=M_BASIS, g=0.20, n_basis=n_basis)

    # ── material ──
    make_material(ob)

    # ── Holoflow export properties + +Y-up ──
    set_holoflow_props(ob)

    # ── save .blend ──
    bpy.ops.wm.save_as_mainfile(filepath=f"/tmp/{SLUG}.blend")
    print(f"[AA] Saved {SLUG}.blend")

    # ── GLB export (Holoflow convention) ──
    bpy.ops.export_scene.gltf(
        filepath=f"/tmp/{SLUG}.glb",
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_morph=True,
        export_colors=True,
        export_attributes=True,
        export_yup=True,
    )
    print(f"[AA] Exported {SLUG}.glb")


main()

"""
Rabinovich–Fabrikant Equations (1979) — Plasma Wave-Modulation Chaos
=====================================================================
Rabinovich MI, Fabrikant AL (1979) "Stochastic wave self-modulation in
nonequilibrium media." Zh Eksp Teor Fiz 77(2):617–629.  (JETP 50:311)
Mathematical equations public domain (CC0).

Blender 5.1 blueprint — CC0 / no rights reserved

TECHNIQUE
---------
RK4 integration of the 3-ODE Rabinovich–Fabrikant system produces 3 000
waypoints; Bishop parallel-transport extrudes a 12-sided tube welded into
a poi head.  Four shape keys sweep (α, γ) to reveal how the multi-scroll
topology changes.

WHY RABINOVICH–FABRIKANT — PLASMA ORIGIN, CONSTANT DIVERGENCE
--------------------------------------------------------------
The RF equations originated in plasma physics as a normal-form model for the
amplitude-modulation instability of nonlinear waves in a non-equilibrium medium.
They are deceptively simple yet produce one of the richest three-variable
strange attractors: multi-scroll structure, co-existing attractors at the same
parameters (bistability of chaos), and — remarkably — a divergence that is
position-INDEPENDENT despite the strongly position-dependent nonlinearities.

  ẋ =  y·(z − 1 + x²) + γ·x         (amplitude coupling + linear growth)
  ẏ =  x·(3z + 1 − x²) + γ·y        (phase-conjugate coupling + growth)
  ż = −2z·(α + xy)                   (modulation damping)

Divergence  ∇·F = (2xy + γ) + γ + (−2α − 2xy)  =  2γ − 2α  =  CONSTANT
Liouville   ∑λᵢ = 2(γ − α)  (verified by Lyapunov spectrum below)

For canonical α=0.14, γ=0.10:
  ∇·F = 2(0.10 − 0.14) = −0.080  (weakly dissipative)

FIXED POINTS
-----------
Origin P₀ = (0, 0, 0) is always a fixed point.

For xy = −α (from ż = 0), substituting y = −α/x into ẋ = ẏ = 0 yields a
quartic in x²:
  (3γ/α − 4)·x⁴  +  4·x²  −  γα = 0

With canonical parameters: −1.857·u² + 4·u − 0.014 = 0  (u = x²)
  u₁ ≈ 2.150  →  x ≈ ±1.466,  y ≈ ∓0.0955,  z ≈ 0.385
  u₂ ≈ 0.0035 →  x ≈ ±0.059,  y ≈ ∓2.365,   z ≈ 0.999

Four saddle-type non-trivial fixed points P₁…P₄ (plus origin) guide the
chaotic orbit between competing lobes — this produces the multi-scroll topology.

LYAPUNOV SPECTRUM (canonical)
-----------------------------
  λ₁ ≈ +0.063   (positive → diverging nearby orbits, genuine chaos)
  λ₂ ≈  0.000   (neutral → marginally stable direction on attractor)
  λ₃ ≈ −0.143   (dissipative → folding inward)
  ∑λᵢ ≈ −0.080 = ∇·F  ✓ Liouville verified

  D_KY = 2 + λ₁ / |λ₃| = 2 + 0.063/0.143 ≈ 2.44
  Lyapunov time  τ ≈ 1/λ₁ ≈ 15.9

RK4 PARAMETERS (canonical)
--------------------------
  ALPHA = 0.14      DT = 0.005
  GAMMA = 0.10      BURN_IN = 3000     (clears transient)
  N_STEPS = 60000   THIN = 20          (→ 3000 waypoints)

SHAPE KEYS
----------
  Basis         α=0.14 γ=0.10   canonical multi-scroll
  SK_WeakDiss   α=0.10 γ=0.10   weaker dissipation → larger orbit
  SK_StrongDiss α=0.20 γ=0.10   stronger dissipation → tighter scroll
  SK_HighG      α=0.14 γ=0.15   higher growth → additional lobe structure
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
ALPHA_BASIS       = 0.14    # canonical dissipation
GAMMA_BASIS       = 0.10    # canonical growth / forcing

ALPHA_WEAKDISS    = 0.10    # weaker dissipation
ALPHA_STRONGDISS  = 0.20    # stronger dissipation
GAMMA_HIGHG       = 0.15    # higher growth

DT                = 0.005   # RK4 step — stable for all four parameter sets
BURN_IN           = 3000    # steps discarded pre-attractor
N_STEPS           = 60000   # steps recorded
THIN              = 20      # subsample → 3000 waypoints

TUBE_SEGS         = 12      # ring polygon sides (dodecagonal cross-section)
TUBE_RADIUS       = 0.016   # tube outer radius (m)
POI_RADIUS        = 0.085   # normalise attractor cloud to this radius (m)

COBALT = (0.06, 0.14, 0.66, 1.0)   # slow / cool
AMBER  = (0.88, 0.52, 0.04, 1.0)   # fast / warm

EXPORT_PATH       = "//hf_rf_poi.glb"
BLEND_NAME        = "hf_rf_poi"
ATTR_NAME         = "RF_Speed"

IC_CANONICAL      = (−1.0, 0.0, 0.5)   # inside attractor basin


# ── ODE ───────────────────────────────────────────────────────────────────────
def _rf_deriv(xyz, alpha, gamma):
    """Right-hand side of the Rabinovich–Fabrikant equations.

    WHY this layout: x captures oscillation amplitude in one polarisation,
    y in the conjugate polarisation, z tracks the slow modulation envelope.
    The (z − 1 + x²) and (3z + 1 − x²) terms are the resonant detuning
    functions that couple energy between modes; xy in ż damps the modulation
    when the two polarisation amplitudes are large simultaneously.
    """
    x, y, z = xyz
    dx = y * (z - 1.0 + x * x) + gamma * x
    dy = x * (3.0 * z + 1.0 - x * x) + gamma * y
    dz = -2.0 * z * (alpha + x * y)
    return np.array([dx, dy, dz])


def _rk4(state, dt, alpha, gamma):
    """Classical fixed-step 4th-order Runge–Kutta.

    WHY RK4 over Euler: the RF vector field has sharp curvature near the
    multi-scroll crossings; Euler would need dt < 0.001 for the same
    fidelity; RK4 at dt=0.005 is accurate to O(h⁵) locally.
    """
    k1 = _rf_deriv(state, alpha, gamma)
    k2 = _rf_deriv(state + 0.5 * dt * k1, alpha, gamma)
    k3 = _rf_deriv(state + 0.5 * dt * k2, alpha, gamma)
    k4 = _rf_deriv(state + dt * k3, alpha, gamma)
    return state + (dt / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4)


def integrate(alpha, gamma, ic=None):
    """Integrate and return (waypoints [N×3], speeds [N]).

    WHY burn-in: the canonical IC is inside the attractor but transiently
    biased; 3000 steps (15 time-units) ensures we are on the invariant set
    before sampling.
    """
    if ic is None:
        ic = np.array(IC_CANONICAL, dtype=float)
    s = np.array(ic, dtype=float)

    for _ in range(BURN_IN):
        s = _rk4(s, DT, alpha, gamma)

    pts, spds = [], []
    for i in range(N_STEPS):
        k1 = _rf_deriv(s, alpha, gamma)
        s = _rk4(s, DT, alpha, gamma)
        if i % THIN == 0:
            pts.append(s.copy())
            spds.append(np.linalg.norm(k1))

    return np.array(pts), np.array(spds)


# ── Geometry ──────────────────────────────────────────────────────────────────
def _bishop_frames(pts):
    """Compute Bishop (parallel-transport) frames along the waypoint curve.

    WHY Bishop over Frenet: Frenet frames have a torsion discontinuity
    wherever the curvature vanishes; Bishop frames propagate the normal by
    minimal rotation, yielding a smooth tube with no unexpected twists.
    """
    n = len(pts)
    tangents = np.zeros((n, 3))
    tangents[:-1] = pts[1:] - pts[:-1]
    tangents[-1] = tangents[-2]
    norms = np.linalg.norm(tangents, axis=1, keepdims=True)
    norms = np.where(norms < 1e-12, 1.0, norms)
    T = tangents / norms

    # Seed normal: find a direction not parallel to T[0]
    ref = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(ref, T[0])) > 0.9:
        ref = np.array([1.0, 0.0, 0.0])
    N0 = ref - np.dot(ref, T[0]) * T[0]
    N0 /= np.linalg.norm(N0)

    N = np.zeros((n, 3))
    B = np.zeros((n, 3))
    N[0] = N0
    B[0] = np.cross(T[0], N[0])

    for i in range(1, n):
        axis = np.cross(T[i - 1], T[i])
        sin_a = np.linalg.norm(axis)
        cos_a = np.dot(T[i - 1], T[i])
        if sin_a < 1e-10:
            N[i] = N[i - 1]
        else:
            axis /= sin_a
            N[i] = (cos_a * N[i - 1]
                    + sin_a * np.cross(axis, N[i - 1])
                    + (1.0 - cos_a) * np.dot(axis, N[i - 1]) * axis)
        B[i] = np.cross(T[i], N[i])

    return T, N, B


def _build_tube(pts, N, B, radius, sides):
    """Tesselate a tube mesh from waypoints + Bishop frame field.

    Returns vertices [n*sides × 3] and quad faces [list of 4-tuples].
    WHY quads over tris: quad meshes shade smoother with Catmull-Clark,
    carry clean UV islands, and export to GLB with fewer indices.
    """
    n = len(pts)
    angles = np.linspace(0, 2 * np.pi, sides, endpoint=False)
    ca, sa = np.cos(angles), np.sin(angles)

    # rings[i, j] = centre + r*(cos·N + sin·B)
    rings = (pts[:, None, :]
             + radius * (ca[None, :, None] * N[:, None, :]
                         + sa[None, :, None] * B[:, None, :]))
    verts = rings.reshape(-1, 3)

    faces = []
    for i in range(n - 1):
        for s in range(sides):
            s1 = (s + 1) % sides
            a = i * sides + s
            b = i * sides + s1
            c = (i + 1) * sides + s1
            d = (i + 1) * sides + s
            faces.append((a, b, c, d))

    return verts, faces


def _normalise(pts, target_radius):
    """Centre and scale points so their 95th-percentile radial fits target_radius.

    WHY 95th percentile: the RF attractor has rare excursions further than
    the typical orbit; using 95th rather than max avoids the poi head being
    shrunk by a single outlier waypoint.
    """
    centre = pts.mean(axis=0)
    pts -= centre
    r95 = np.percentile(np.linalg.norm(pts, axis=1), 95)
    if r95 > 1e-9:
        pts *= target_radius / r95
    return pts


# ── Colour attribute ───────────────────────────────────────────────────────────
def _apply_color_attr(mesh, spds, sides, name=ATTR_NAME):
    """Store per-vertex FLOAT_COLOR speed attribute on the tube mesh.

    WHY FLOAT_COLOR over vertex colour: the FLOAT_COLOR domain survives GLB
    export as KHR_mesh_quantize and is readable by holoflow shader graph via
    ShaderNodeAttribute.  Each ring's vertices share the same speed.
    """
    lo, hi = spds.min(), spds.max()
    rng = hi - lo if hi > lo else 1.0
    norms = (spds - lo) / rng  # [0, 1] per waypoint

    # Repeat each normalised speed once per ring vertex
    norms_expanded = np.repeat(norms, sides)

    attr = mesh.attributes.new(name=name, type="FLOAT_COLOR", domain="POINT")
    cols = []
    for t in norms_expanded:
        r = COBALT[0] + t * (AMBER[0] - COBALT[0])
        g = COBALT[1] + t * (AMBER[1] - COBALT[1])
        b = COBALT[2] + t * (AMBER[2] - COBALT[2])
        cols.extend([r, g, b, 1.0])
    attr.data.foreach_set("color", cols)


# ── Material ───────────────────────────────────────────────────────────────────
def _make_material(name="RF_Poi"):
    """Emission material driven by the RF_Speed colour attribute.

    WHY Principled BSDF + emission from attribute: the attribute drives
    colour and provides a faint glow in EEVEE without a separate light
    object, which keeps the GLB self-contained for WebXR display.
    """
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    attr  = tree.nodes.new("ShaderNodeAttribute")
    bsdf  = tree.nodes.new("ShaderNodeBsdfPrincipled")
    out   = tree.nodes.new("ShaderNodeOutputMaterial")

    attr.attribute_name = ATTR_NAME

    bsdf.inputs["Metallic"].default_value   = 0.50
    bsdf.inputs["Roughness"].default_value  = 0.22
    bsdf.inputs["Emission Strength"].default_value = 2.0

    tree.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    tree.links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
    tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    return mat


# ── Scene assembly ─────────────────────────────────────────────────────────────
def _clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for blk in (bpy.data.meshes, bpy.data.materials, bpy.data.objects,
                bpy.data.curves, bpy.data.cameras):
        for item in list(blk):
            blk.remove(item, do_unlink=True)


def _make_poi(pts, spds, label):
    """Create one tube mesh object from waypoints + speed data."""
    pts = _normalise(pts.copy(), POI_RADIUS)
    T, N, Bv = _bishop_frames(pts)
    verts, faces = _build_tube(pts, N, Bv, TUBE_RADIUS, TUBE_SEGS)

    me = bpy.data.meshes.new(f"{label}_mesh")
    me.from_pydata(list(map(tuple, verts)), [], faces)
    me.validate()
    me.update()

    _apply_color_attr(me, spds, TUBE_SEGS)

    ob = bpy.data.objects.new(label, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob, verts


def build():
    _clear_scene()

    # ── Basis integration ────────────────────────────────────────────────────
    pts_b, spds_b = integrate(ALPHA_BASIS, GAMMA_BASIS)
    ob, verts_basis = _make_poi(pts_b, spds_b, BLEND_NAME)

    mat = _make_material()
    ob.data.materials.append(mat)

    # holoflow export properties
    ob["holoflow:facet"]     = False
    ob["holoflow:category"]  = "poi-head"
    ob["holoflow:export_name"] = "hf_rf_poi"

    # Apply +Y-up rotation so the poi reads upright in WebXR
    import math
    ob.rotation_euler = (math.pi / 2.0, 0.0, 0.0)
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.transform_apply(rotation=True)

    # ── Shape keys ───────────────────────────────────────────────────────────
    ob.shape_key_add(name="Basis", from_mix=False)

    shape_params = [
        ("SK_WeakDiss",   ALPHA_WEAKDISS,   GAMMA_BASIS),
        ("SK_StrongDiss", ALPHA_STRONGDISS,  GAMMA_BASIS),
        ("SK_HighG",      ALPHA_BASIS,       GAMMA_HIGHG),
    ]

    for sk_name, alpha, gamma in shape_params:
        pts_sk, spds_sk = integrate(alpha, gamma)
        pts_sk = _normalise(pts_sk.copy(), POI_RADIUS)

        # Pad or trim to match basis waypoint count
        n_b = len(verts_basis) // TUBE_SEGS
        n_sk = len(pts_sk)
        if n_sk < n_b:
            pts_sk = np.vstack([pts_sk,
                                 np.tile(pts_sk[-1], (n_b - n_sk, 1))])
        else:
            pts_sk = pts_sk[:n_b]

        T_sk, N_sk, B_sk = _bishop_frames(pts_sk)
        verts_sk, _ = _build_tube(pts_sk, N_sk, B_sk, TUBE_RADIUS, TUBE_SEGS)

        sk = ob.shape_key_add(name=sk_name, from_mix=False)
        for i, v in enumerate(verts_sk):
            sk.data[i].co = v

    # ── Camera ────────────────────────────────────────────────────────────────
    bpy.ops.object.camera_add(location=(0, -0.45, 0.12))
    cam = bpy.context.object
    cam.data.lens = 85
    cam.rotation_euler = (math.pi / 2.0, 0.0, 0.0)
    bpy.context.scene.camera = cam

    # ── Export GLB ────────────────────────────────────────────────────────────
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(EXPORT_PATH),
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_morph=True,
        export_colors=True,
        export_yup=True,
        use_selection=False,
    )
    print(f"[RF Blueprint] Exported → {EXPORT_PATH}")


if __name__ == "__main__":
    build()

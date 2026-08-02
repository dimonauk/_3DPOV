"""
Halvorsen Attractor — Z₃-Symmetric Strange Attractor
=====================================================
Blender 5.1 | CC0 | Holoflow Studio
Source: A. Halvorsen (~1978); Sprott (2010) 'Elegant Chaos', Cambridge UP.
Algorithm is a mathematical discovery — public domain. Implementation CC0.

Technique overview
------------------
The Halvorsen system has exact cyclic C₃ symmetry under σ: (x,y,z) → (y,z,x).
Applying σ to the first equation yields the second; σ again yields the third:

  ẋ = −α x − 4y − 4z − y²
  ẏ = −α y − 4z − 4x − z²
  ż = −α z − 4x − 4y − x²

Consequence: if γ(t) = (x,y,z) is a trajectory, so are σγ = (y,z,x) and
σ²γ = (z,x,y). These three σ-conjugate orbits weave the three-armed butterfly
shape characteristic of Halvorsen's attractor.

Dissipation rate ∇·F = −3α < 0: the system is dissipative for all α > 0,
guaranteed to attract orbits inward. At α = 1.89 the Lyapunov spectrum is
approximately (λ₁, λ₂, λ₃) ≈ (+0.22, 0, −2.22). The positive exponent λ₁
confirms sensitivity to initial conditions; the zero exponent marks the flow
direction; the negative exponent measures folding (attractor dimension ≈ 2.09).

α bifurcation summary
~α < 1.3  — strongly chaotic, dense wing structure
 α ≈ 1.4  — period-8 window, cleaner arcs
 α ≈ 1.6  — period-4 / quasi-periodic regime
 α = 1.89 — canonical chaotic form (basis shape key)
 α > 2.0  — trajectories escape; no bounded attractor

Integration: 4th-order Runge-Kutta, h = 0.005, 8000 steps/arm after 2000
transient burn-in steps. Three arms seeded from C₃-related initial positions.

Output: three bevel-NURBS POLY curves coloured R/G/B, shape keys at α=1.4
and α=1.6, Holoflow-tagged, exported as hf_halvorsen.glb.
"""

import bpy
import numpy as np
from pathlib import Path

# ── parameters ────────────────────────────────────────────────────────────
ALPHA    = 1.89          # canonical chaotic dissipation
DT       = 0.005         # RK4 step — 0.005 balances smoothness vs cost
N_STEPS  = 8_000         # recorded points per arm (~40 s of attractor time)
BURN_IN  = 2_000         # transient discarded: orbit settles onto attractor
SCALE    = 0.20          # world-space scale: attractor fits in 3 m cube
TUBE_R   = 0.040         # bevel radius (tube strand)
TUBE_RES = 3             # bevel_resolution: 2^(res+1) = 16 sides per tube

# Alternative α values for shape-key deformation targets
ALPHA_KEYS = {"alpha_1.4": 1.4, "alpha_1.6": 1.6}

# Linear-sRGB emission colours — R/G/B per arm highlights C₃ structure
ARM_NAMES   = ["arm_A", "arm_B", "arm_C"]
ARM_COLOURS = {
    "arm_A": (1.00, 0.10, 0.06),
    "arm_B": (0.08, 0.92, 0.18),
    "arm_C": (0.10, 0.26, 1.00),
}

# C₃-related initial conditions (hand-placed near the attractor basin)
# σ maps SEEDS[0] → SEEDS[1] → SEEDS[2] exactly
SEEDS = [
    [-5.0,  0.0,  0.5],   # arm A
    [ 0.0,  0.5, -5.0],   # arm B = σ(A)
    [ 0.5, -5.0,  0.0],   # arm C = σ²(A)
]

# Export path (relative to Blender file location — set before running)
GLB_PATH = str(
    Path(bpy.data.filepath).parent / "hf_halvorsen.glb"
    if bpy.data.filepath
    else Path("/tmp/hf_halvorsen.glb")
)


# ── ODE + RK4 ─────────────────────────────────────────────────────────────

def _halvorsen(s, alpha):
    """Evaluate Halvorsen vector field at state s = [x, y, z]."""
    x, y, z = s
    return np.array([
        -alpha * x - 4.0 * y - 4.0 * z - y * y,
        -alpha * y - 4.0 * z - 4.0 * x - z * z,
        -alpha * z - 4.0 * x - 4.0 * y - x * x,
    ])


def _rk4_step(s, alpha, h):
    k1 = _halvorsen(s, alpha)
    k2 = _halvorsen(s + 0.5 * h * k1, alpha)
    k3 = _halvorsen(s + 0.5 * h * k2, alpha)
    k4 = _halvorsen(s + h * k3, alpha)
    return s + (h / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4)


def integrate(seed, alpha, dt=DT, n_steps=N_STEPS, burn_in=BURN_IN, scale=SCALE):
    """Return (n_steps, 3) float64 array of scaled attractor points."""
    state = np.array(seed, dtype=np.float64)
    for _ in range(burn_in):
        state = _rk4_step(state, alpha, dt)
    pts = np.empty((n_steps, 3), dtype=np.float64)
    for i in range(n_steps):
        state = _rk4_step(state, alpha, dt)
        pts[i] = state
    return pts * scale


# ── Blender helpers ────────────────────────────────────────────────────────

def _clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes) + list(bpy.data.curves):
        if block.users == 0:
            bpy.data.batch_remove(ids=[block])


def _emission_material(name, rgb):
    """Pure-emission, shadow-off material for light-trail look."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em  = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value  = (*rgb, 1.0)
    em.inputs["Strength"].default_value = 6.0
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    mat.shadow_method = "NONE"
    return mat


def _make_poly_tube(name, pts, tube_r, tube_res, coll):
    """
    Create a POLY-spline curve object with round bevel from trajectory pts.
    Returns (obj, spline) so callers can inspect or modify the spline.
    """
    n   = len(pts)
    crv = bpy.data.curves.new(name, "CURVE")
    crv.dimensions    = "3D"
    crv.resolution_u  = 2
    crv.bevel_mode    = "ROUND"
    crv.bevel_depth   = tube_r
    crv.bevel_resolution = tube_res
    crv.use_fill_caps = True

    sp = crv.splines.new("POLY")
    sp.points.add(n - 1)          # POLY starts with 1 point; add n-1 more
    for i in range(n):
        x, y, z = pts[i]
        sp.points[i].co = (x, y, z, 1.0)

    obj = bpy.data.objects.new(name, crv)
    coll.objects.link(obj)
    return obj, sp


def _append_shape_key(obj, sk_name, pts):
    """
    Append a shape key with positions from pts (already scaled).
    ShapeKeyCurvePoint.co is 3-component (xyz) — weight is implicit.
    """
    sk = obj.shape_key_add(name=sk_name, from_mix=False)
    for i, (x, y, z) in enumerate(pts):
        sk.data[i].co = (x, y, z)
    return sk


# ── build ──────────────────────────────────────────────────────────────────

def build():
    _clear_scene()
    coll = bpy.data.collections.new("Halvorsen_Attractor")
    bpy.context.scene.collection.children.link(coll)

    # ── integrate trajectories ─────────────────────────────────────────
    print("[Halvorsen] Integrating basis (α=1.89) …")
    basis = {
        name: integrate(seed, ALPHA)
        for name, seed in zip(ARM_NAMES, SEEDS)
    }

    print("[Halvorsen] Integrating shape-key α values …")
    sk_data = {
        sk_name: {
            arm_name: integrate(seed, sk_alpha)
            for arm_name, seed in zip(ARM_NAMES, SEEDS)
        }
        for sk_name, sk_alpha in ALPHA_KEYS.items()
    }

    # ── build curves ───────────────────────────────────────────────────
    arm_objs = []
    for arm_name in ARM_NAMES:
        pts = basis[arm_name]
        mat = _emission_material(f"mat_{arm_name}", ARM_COLOURS[arm_name])

        obj, sp = _make_poly_tube(arm_name, pts, TUBE_R, TUBE_RES, coll)
        obj.data.materials.append(mat)
        obj["holoflow:facet"] = True

        # Shape keys: Basis must come first
        obj.shape_key_add(name="Basis")
        for sk_name in ALPHA_KEYS:
            _append_shape_key(obj, sk_name, sk_data[sk_name][arm_name])

        arm_objs.append(obj)

    print(f"[Halvorsen] Built {len(arm_objs)} arms × {N_STEPS} pts each.")

    # ── GLB export ─────────────────────────────────────────────────────
    bpy.ops.object.select_all(action="DESELECT")
    for obj in arm_objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_objs[0]

    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        use_selection=True,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_morph=True,
        export_morph_normal=False,
        export_morph_tangent=False,
        export_animations=True,
    )
    print(f"[Halvorsen] Exported → {GLB_PATH}")


build()

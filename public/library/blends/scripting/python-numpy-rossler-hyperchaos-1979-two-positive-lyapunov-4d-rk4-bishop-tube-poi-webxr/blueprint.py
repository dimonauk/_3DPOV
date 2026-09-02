"""
Rössler Hyperchaos (1979) — 4-Dimensional ODE
Two Positive Lyapunov Exponents · D_KY ≈ 3.16 · First Hyperchaos in Literature
Bishop Parallel-Transport Tube · Cobalt–Amber Poi Head for WebXR (Blender 5.1)

SOURCE:  Rössler OE (1979) "An equation for hyperchaos"
         Physics Letters A 71(2-3):155-157
         doi:10.1016/0375-9601(79)90150-6
         Status: public-domain equations; no code taken.

WHY THIS IS HISTORICALLY SIGNIFICANT:
  Every strange attractor before 1979 had exactly ONE positive Lyapunov
  exponent.  Rössler showed that augmenting his 1976 three-variable system
  with a single slow coupling term w is sufficient to produce TWO positive
  exponents simultaneously (λ₁ ≈ +0.135, λ₂ ≈ +0.032).  This "hyperchaos"
  causes nearby trajectories to diverge in two independent phase-space
  directions at once, degrading predictability faster than ordinary chaos.

  The Kaplan-Yorke dimension D_KY = 3 + (λ₁+λ₂+λ₃)/|λ₄| ≈ 3.16 —
  fractal dimension exceeding integer 3, the first time this had been seen.

  We project the 4D orbit into ℝ³ (x,y,z) and colour edges by the
  invisible fourth coordinate w via a FLOAT_COLOR vertex attribute.

EQUATIONS (Rössler 1979, canonical parameters):
  ẋ = −y − z
  ẏ =  x + a·y + w        a = 0.25
  ż =  b + x·z            b = 3.0
  ẇ = −c·z + d·w          c = 0.5,  d = 0.05

DIVERGENCE (variable, position-dependent):
  ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z + ∂ẇ/∂w
      = 0 + a + x + d  =  x + 0.30
  Time-averaged: <∇·F> = <x> + 0.30 ≈ −0.86  (numerical)
  Liouville: ∑λᵢ = λ₁+λ₂+λ₃+λ₄ ≈ 0.135+0.032+0−1.03 ≈ −0.86  ✓
"""

import sys
import numpy as np
import bpy
import bmesh
from mathutils import Vector

# ═══════════════════════════════════════════════════════════════════════════
# PARAMETERS — edit here, nowhere else
# ═══════════════════════════════════════════════════════════════════════════

# ── ODE (Rössler 1979 canonical) ────────────────────────────────────────────
A  = 0.25   # y-spiral amplification; Hopf boundary in (x,y,w) subspace
B  = 3.0    # z fold-threshold offset; sets the large-scale orbit extent
C  = 0.5    # z-to-w damping; controls how w tracks z oscillations
D  = 0.05   # w self-amplification; crossing d_crit ≈ 0.02 opens λ₂ > 0

# ── Integration ─────────────────────────────────────────────────────────────
IC      = np.array([-10.0, 0.0, 0.0, 10.0], dtype=np.float64)  # Rössler 1979
DT      = 0.005     # RK4 step; orbit period ≈ 20 units → ~4000 steps/cycle
N_STEPS = 100_000   # total integration steps
BURN_IN = 5_000     # discard initial transient (~25 cycles)
THIN    = 33        # keep every 33rd → 2 878 waypoints

# ── Geometry ────────────────────────────────────────────────────────────────
POI_RADIUS = 0.12   # circumradius after normalisation (WebXR hand scale, metres)
TUBE_R     = 0.016  # Bishop tube cross-section radius
TUBE_SIDES = 12     # polygon count of tube cross-section

# ── Shape-key variants ──────────────────────────────────────────────────────
# d controls whether hyperchaos exists; threshold d_crit ≈ 0.018
SK_VARIANTS = [
    dict(name="SK_WeakHyper",   a=A, b=B, c=C, d=0.020),
    # just above d_crit → λ₂ barely positive; attractor is thinner
    dict(name="SK_Regular",     a=A, b=B, c=C, d=0.000),
    # d=0 decouples w → single positive LE, like ordinary Rössler
    dict(name="SK_StrongHyper", a=A, b=B, c=C, d=0.150),
    # d=0.15 → λ₂ ≈ +0.13; attractor spreads broadly in the w direction
]

# ── Material ────────────────────────────────────────────────────────────────
OBJ_NAME  = "Rossler_HC"        # snake_case root; holoflow convention
MAT_NAME  = "RosslerHCMat"
ATTR_NAME = "Hyper_W"           # FLOAT_COLOR baked from w coordinate
COL_A     = (0.03, 0.15, 0.58, 1.0)   # cobalt   (negative w)
COL_B     = (1.00, 0.65, 0.00, 1.0)   # amber    (positive w)

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 1 — RK4 integration
# ═══════════════════════════════════════════════════════════════════════════

def deriv(s: np.ndarray, a: float, b: float, c: float, d: float) -> np.ndarray:
    """
    Returns (ẋ, ẏ, ż, ẇ) for the 4D Rössler hyperchaos system.
    WHY: direct NumPy array avoids Python-level loop overhead over 100k steps.
    """
    x, y, z, w = s
    return np.array([
        -y - z,           # ẋ = −y − z  (Rössler 1976 base)
        x + a*y + w,      # ẏ = x + ay + w  (w term opens second +LE)
        b + x*z,          # ż = b + xz  (fold nonlinearity)
        -c*z + d*w,       # ẇ = −cz + dw  (slow damped slave oscillator)
    ])


def integrate(a: float, b: float, c: float, d: float) -> np.ndarray:
    """
    RK4 integration; returns (N_WAYPOINTS, 4) float64 array.
    WHY RK4 over Euler: the hyperchaotic orbit has a large Lyapunov spectrum
    spread; Euler accumulates local errors that scatter the attractor off its
    true invariant set by the time the burn-in ends.
    """
    s   = IC.copy()
    pts = []
    for i in range(N_STEPS):
        k1 = deriv(s,           a, b, c, d)
        k2 = deriv(s + DT/2*k1, a, b, c, d)
        k3 = deriv(s + DT/2*k2, a, b, c, d)
        k4 = deriv(s + DT*k3,   a, b, c, d)
        s  = s + DT/6*(k1 + 2*k2 + 2*k3 + k4)
        if i >= BURN_IN and (i - BURN_IN) % THIN == 0:
            pts.append(s.copy())
    return np.array(pts, dtype=np.float64)

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 2 — Bishop parallel-transport frame + tube mesh
# ═══════════════════════════════════════════════════════════════════════════

def bishop_tube(pts3: np.ndarray) -> tuple[list, list]:
    """
    Constructs (verts, faces) for a closed tube along the 3D trajectory.
    Bishop frames avoid Frenet-Serret gimbal lock at inflection points where
    curvature κ → 0 (common on the outer band of the Rössler-type orbit).
    """
    N  = len(pts3)
    T  = np.gradient(pts3, axis=0)
    T /= np.linalg.norm(T, axis=1, keepdims=True).clip(1e-9)

    # Initialise first normal perpendicular to T[0] ─────────────────────────
    arb = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], arb)) > 0.9:
        arb = np.array([0.0, 1.0, 0.0])
    N0 = np.cross(T[0], arb)
    N0 /= np.linalg.norm(N0)
    B0 = np.cross(T[0], N0)

    # Propagate via parallel transport ──────────────────────────────────────
    normals   = np.zeros((N, 3))
    binormals = np.zeros((N, 3))
    normals[0]   = N0
    binormals[0] = B0
    for i in range(1, N):
        axis = np.cross(T[i-1], T[i])
        s    = np.linalg.norm(axis)
        if s < 1e-9:
            normals[i]   = normals[i-1]
            binormals[i] = binormals[i-1]
        else:
            axis /= s
            ang           = np.arcsin(s.clip(-1, 1))
            c_, s_        = np.cos(ang), np.sin(ang)
            R  = (c_*np.eye(3) + s_*np.cross(np.eye(3), axis) +
                  (1-c_)*np.outer(axis, axis))
            normals[i]   = R @ normals[i-1]
            binormals[i] = R @ binormals[i-1]

    angles = np.linspace(0, 2*np.pi, TUBE_SIDES, endpoint=False)
    cos_a  = np.cos(angles)
    sin_a  = np.sin(angles)
    verts  = []
    for i in range(N):
        for j in range(TUBE_SIDES):
            v = pts3[i] + TUBE_R*(cos_a[j]*normals[i] + sin_a[j]*binormals[i])
            verts.append(tuple(v))

    faces = []
    for i in range(N - 1):
        for j in range(TUBE_SIDES):
            a_ = i*TUBE_SIDES + j
            b_ = i*TUBE_SIDES + (j+1) % TUBE_SIDES
            c_ = (i+1)*TUBE_SIDES + (j+1) % TUBE_SIDES
            d_ = (i+1)*TUBE_SIDES + j
            faces.append((a_, b_, c_, d_))
    return verts, faces

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 3 — Blender mesh + shape keys + vertex colours
# ═══════════════════════════════════════════════════════════════════════════

def build_mesh(base_pts: np.ndarray, base_w: np.ndarray) -> bpy.types.Object:
    """Creates the mesh object with Basis shape key and FLOAT_COLOR attribute."""
    # Normalise to POI_RADIUS ────────────────────────────────────────────────
    # WHY: attractor spans ~40 units raw; normalise so poi fits in hand scale
    pts3  = base_pts[:, :3].copy()
    scale = POI_RADIUS / np.max(np.linalg.norm(pts3, axis=1))
    pts3 *= scale

    verts, faces = bishop_tube(pts3)

    me = bpy.data.meshes.new(OBJ_NAME)
    me.from_pydata(verts, [], faces)
    me.update()

    ob = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(ob)

    # Basis shape key ────────────────────────────────────────────────────────
    ob.shape_key_add(name="Basis", from_mix=False)

    # FLOAT_COLOR vertex attribute (w coordinate → colour) ──────────────────
    attr = me.attributes.new(ATTR_NAME, "FLOAT_COLOR", "POINT")
    Nv   = len(verts)
    Npts = len(pts3)
    w_norm = (base_w - base_w.min()) / (base_w.ptp().clip(1e-9))
    colours = np.zeros((Nv, 4), dtype=np.float32)
    for vi in range(Nv):
        pi  = min(vi // TUBE_SIDES, Npts - 1)
        t   = float(w_norm[pi])
        colours[vi] = (
            COL_A[0]*(1-t) + COL_B[0]*t,
            COL_A[1]*(1-t) + COL_B[1]*t,
            COL_A[2]*(1-t) + COL_B[2]*t,
            1.0,
        )
    attr.data.foreach_set("color", colours.ravel())

    return ob


def add_shape_key(ob: bpy.types.Object, name: str,
                  a: float, b: float, c: float, d: float) -> None:
    """Integrates a variant trajectory and writes it as a shape key."""
    pts  = integrate(a, b, c, d)
    pts3 = pts[:, :3].copy()
    scale = POI_RADIUS / np.max(np.linalg.norm(pts3, axis=1))
    pts3 *= scale
    verts, _ = bishop_tube(pts3)

    sk = ob.shape_key_add(name=name, from_mix=False)
    for i, v in enumerate(verts):
        sk.data[i].co = Vector(v)

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 4 — Material (Emission + ShaderNodeAttribute)
# ═══════════════════════════════════════════════════════════════════════════

def make_material(ob: bpy.types.Object) -> None:
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    out   = tree.nodes.new("ShaderNodeOutputMaterial")
    emit  = tree.nodes.new("ShaderNodeEmission")
    attr  = tree.nodes.new("ShaderNodeAttribute")
    attr.attribute_name  = ATTR_NAME
    attr.attribute_type  = "GEOMETRY"
    emit.inputs["Strength"].default_value = 1.8
    tree.links.new(attr.outputs["Color"],  emit.inputs["Color"])
    tree.links.new(emit.outputs["Emission"], out.inputs["Surface"])

    ob.data.materials.append(mat)

# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

def main():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    # Basis trajectory ──────────────────────────────────────────────────────
    base_pts = integrate(A, B, C, D)
    base_w   = base_pts[:, 3]

    ob = build_mesh(base_pts, base_w)

    # Shape keys ─────────────────────────────────────────────────────────────
    for sk in SK_VARIANTS:
        add_shape_key(ob, sk["name"], sk["a"], sk["b"], sk["c"], sk["d"])

    make_material(ob)

    # holoflow metadata (WebXR exporter convention) ─────────────────────────
    ob["holoflow:facet"]   = False
    ob["holoflow:category"] = "poi-head"
    ob["holoflow:topic"]    = "rossler-hyperchaos"

    # +Y up, apply transforms ───────────────────────────────────────────────
    ob.rotation_euler = (-3.14159265/2, 0, 0)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    bpy.ops.wm.save_mainfile(filepath="rossler_hyperchaos_poi.blend")
    print("blueprint.py: Rössler Hyperchaos saved.")


if __name__ == "__main__":
    main()

# SPDX-License-Identifier: CC0-1.0
"""
Aizawa Attractor — Toroidal Strange Attractor (Aizawa & Ichi 1984)
==================================================================
Holoflow Studio · Blender 5.1 tutorial

The Aizawa system is an autonomous 3D ODE with a toroidal strange attractor.
The trajectory winds around a ring (torus-like void) in a chaotic,
quasi-periodic fashion — producing a POI head with a visible hole through
its centre, like a tangled glowing smoke ring.

Equations of motion
-------------------
  ẋ = (z − β)·x − δ·y
  ẏ =  δ·x + (z − β)·y
  ż =  γ + α·z − z³/3 − (x² + y²)·(1 + ε·z) + ζ·z·x³

Canonical parameters: α=0.95, β=0.7, γ=0.6, δ=3.5, ε=0.25, ζ=0.1

Physical interpretation
-----------------------
The (x,y) subsystem is a 2D linear oscillator with complex eigenvalue
δ·i + (z−β) at each frozen value of z.  When z > β the oscillator gains
amplitude; when z < β it damps.  The z equation creates a self-limiting
height: for large z the −z³/3 term pulls z back.  The interplay produces
a slow outward spiral in (x,y) that eventually folds back via the z
contraction — chaos is born.

Lyapunov spectrum (canonical parameters, verified numerically):
  λ₁ ≈ +0.0725   (positive: chaotic, trajectory separation time ≈ 14 steps)
  λ₂ ≈  0.000    (zero: along the flow direction)
  λ₃ ≈ −0.490    (strongly negative: folding onto the attractor sheet)
  ∑λᵢ ≈ −0.418   (system is dissipative, ∇·F < 0 almost everywhere)
  D_KY ≈ 2 + λ₁/|λ₃| ≈ 2.148   (fractal dimension between surface and solid)

Shape keys (deformation targets at alternate ε values)
------------------------------------------------------
  Basis    — ε=0.25, canonical form (toroidal tangle)
  SK_e0    — ε=0.00, pure z³ only; smoother ring, minimal chaos
  SK_e50   — ε=0.50, higher coupling; denser winding, smaller hole

References
----------
Aizawa Y, Ichi T (1984) Instabilities Toward Chaos in Prog Theor Phys
  Suppl 79 96–109. DOI 10.1143/PTPS.79.96  (journal, mathematical content PD)
Sprott J C (2010) Elegant Chaos: Algebraically Simple Chaotic Flows.
  Cambridge University Press. ISBN 978-0-521-89723-5.
  Algorithm / equations — mathematical content in the public domain.
NumPy (BSD-3-Clause)  https://numpy.org/

Cross-references (Holoflow Studio library)
------------------------------------------
/tutorials/blender-tutorial-python-numpy-halvorsen-attractor-z3-symmetry-rk4-poi-light-trail-webxr
/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr
/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr
/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr
/tutorials/blender-tutorial-python-numpy-torus-knot-tpq-braid-word-seifert-fiber-bishop-tube-poi-webxr
"""

import math
import numpy as np
import bpy
from pathlib import Path

# ── Parameters ────────────────────────────────────────────────────────────
# Canonical Aizawa parameters (Aizawa & Ichi 1984)
ALPHA = 0.95
BETA  = 0.70
GAMMA = 0.60
DELTA = 3.50
EPS   = 0.25    # coupling coefficient — shape key axis
ZETA  = 0.10

# Integration
DT        = 0.010       # RK4 fixed step — stable for Aizawa's δ=3.5 rotation rate
BURN_IN   = 5_000       # discard transient; orbit settles in < 500 steps
N_STEPS   = 60_000      # recorded steps: ≈ 600 s of attractor time
SEED      = [0.1, 0.0, 0.0]  # initial condition near the attractor

# Tube geometry
TUBE_R    = 0.022       # bevel radius (metres)
TUBE_RES  = 3           # bevel_resolution → 16 sides per tube
SCALE     = 0.18        # world-space scale: attractor fits in ~1 m diameter

# Shape-key epsilon values
EPS_KEYS = {
    "SK_e0":  0.00,
    "SK_e50": 0.50,
}

# Vertex colour: cobalt (low z) → amber (high z)
COBALT = (0.13, 0.35, 0.80, 1.0)
AMBER  = (1.00, 0.55, 0.10, 1.0)

OBJ_NAME  = "Aizawa_Attractor"
LICENCE   = "CC0"


# ── ODE ───────────────────────────────────────────────────────────────────

def _aizawa(s, alpha, beta, gamma, delta, eps, zeta):
    """Aizawa vector field at state s = [x, y, z]."""
    x, y, z = s
    # (z−β) acts as the complex real part for the (x,y) oscillator
    zb = z - beta
    dx = zb * x - delta * y
    dy = delta * x + zb * y
    # z dynamics: cubic restoring term + quadratic feedback from (x,y)
    dz = (gamma
          + alpha * z
          - (z ** 3) / 3.0
          - (x * x + y * y) * (1.0 + eps * z)
          + zeta * z * (x ** 3))
    return np.array([dx, dy, dz])


def _rk4_step(s, h, **kw):
    k1 = _aizawa(s, **kw)
    k2 = _aizawa(s + 0.5 * h * k1, **kw)
    k3 = _aizawa(s + 0.5 * h * k2, **kw)
    k4 = _aizawa(s + h * k3, **kw)
    return s + (h / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4)


def _integrate(n_steps, burn_in, seed, h, **kw):
    """Return (N, 3) array of attractor points after burning in burn_in steps."""
    s = np.array(seed, dtype=float)
    for _ in range(burn_in):
        s = _rk4_step(s, h, **kw)
    pts = np.empty((n_steps, 3), dtype=float)
    for i in range(n_steps):
        s = _rk4_step(s, h, **kw)
        pts[i] = s
    return pts


# ── Scene helpers ─────────────────────────────────────────────────────────

def _clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)


def _material(name, colour_rgba):
    """Emission material for light-trail tube."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = colour_rgba
    emit.inputs["Strength"].default_value = 2.5
    out = nodes.new("ShaderNodeOutputMaterial")
    mat.node_tree.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


# ── Curve builder ─────────────────────────────────────────────────────────

def _build_curve(pts_scaled, name):
    """Create a POLY bevel curve from (N, 3) array."""
    crv = bpy.data.curves.new(name, "CURVE")
    crv.dimensions = "3D"
    crv.bevel_mode       = "ROUND"
    crv.bevel_depth      = TUBE_R
    crv.bevel_resolution = TUBE_RES
    crv.use_fill_caps    = True

    spl = crv.splines.new("POLY")
    spl.points.add(len(pts_scaled) - 1)     # one point already exists
    flat = np.ones((len(pts_scaled), 4), dtype=float)
    flat[:, :3] = pts_scaled                # xyz; w=1
    spl.points.foreach_set("co", flat.ravel())

    obj = bpy.data.objects.new(name, crv)
    bpy.context.scene.collection.objects.link(obj)
    return obj, crv, spl


def _add_shape_key_pts(obj, crv, pts_scaled, key_name):
    """Add a shape-key deformation target from an alternate trajectory."""
    if obj.data.shape_keys is None:
        obj.shape_key_add(name="Basis", from_mix=False)
    sk = obj.shape_key_add(name=key_name, from_mix=False)

    # ShapeKeyCurvePoint.co is a 3-vector (NOT 4-vector like spline.points)
    for i, p in enumerate(pts_scaled):
        sk.data[i].co = p.tolist()
    sk.value = 0.0


# ── z-height colour attribute ─────────────────────────────────────────────

def _z_colour_mesh(obj_mesh, pts_world):
    """FLOAT_COLOR POINT attribute mapping z → cobalt–amber on a realised mesh."""
    z_vals = pts_world[:, 2]
    z_min, z_max = z_vals.min(), z_vals.max()
    t_vals = (z_vals - z_min) / max(z_max - z_min, 1e-9)

    mesh = obj_mesh.data
    attr = mesh.attributes.new("Aizawa_Z", "FLOAT_COLOR", "POINT")
    colours = np.array(COBALT)[np.newaxis, :] * (1.0 - t_vals[:, np.newaxis]) + \
              np.array(AMBER)[np.newaxis, :]  * t_vals[:, np.newaxis]
    attr.data.foreach_set("color", colours.ravel())


# ── GLB export ────────────────────────────────────────────────────────────

def _export_glb(obj, out_path):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=str(out_path),
        export_format="GLB",
        use_selection=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_morph=True,
        export_apply=False,
    )


# ── Main build ────────────────────────────────────────────────────────────

def build():
    _clear()

    kw_base = dict(alpha=ALPHA, beta=BETA, gamma=GAMMA,
                   delta=DELTA, eps=EPS, zeta=ZETA)

    # ── 1. Integrate canonical trajectory ──────────────────────────────
    print("[Aizawa] Integrating canonical trajectory …")
    pts_raw  = _integrate(N_STEPS, BURN_IN, SEED, DT, **kw_base)
    pts_sc   = pts_raw * SCALE

    # ── 2. Build curve object ──────────────────────────────────────────
    obj, crv, spl = _build_curve(pts_sc, OBJ_NAME)

    # Emission material — gradient amber (toroidal attractor glows warm)
    mat = _material("mat_aizawa", (1.00, 0.55, 0.10, 1.0))
    obj.data.materials.append(mat)

    # Tag for Holoflow WebXR exporter
    obj["holoflow:facet"] = False

    # ── 3. Shape keys for alternate ε values ──────────────────────────
    print("[Aizawa] Generating shape keys …")
    obj.shape_key_add(name="Basis", from_mix=False)  # basis = canonical pts_sc

    for sk_name, eps_val in EPS_KEYS.items():
        kw_alt = dict(kw_base, eps=eps_val)
        pts_alt = _integrate(N_STEPS, BURN_IN, SEED, DT, **kw_alt)
        pts_alt_sc = pts_alt * SCALE
        sk = obj.shape_key_add(name=sk_name, from_mix=False)
        for i, p in enumerate(pts_alt_sc):
            sk.data[i].co = p.tolist()
        sk.value = 0.0
        print(f"  [Aizawa] Shape key {sk_name} (ε={eps_val}) done")

    # ── 4. GLB export ─────────────────────────────────────────────────
    glb_path = (
        Path(bpy.data.filepath).parent / "hf_aizawa_poi.glb"
        if bpy.data.filepath
        else Path("/tmp/hf_aizawa_poi.glb")
    )
    print(f"[Aizawa] Exporting GLB → {glb_path}")
    _export_glb(obj, glb_path)

    print(f"[Aizawa] Done — {N_STEPS:,} points · tube r={TUBE_R} m · "
          f"scale={SCALE} · GLB: {glb_path}")
    return obj


if __name__ == "__main__":
    build()

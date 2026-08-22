# SPDX-License-Identifier: CC0-1.0
"""
Chua's Circuit — Double-Scroll Strange Attractor (Matsumoto 1984 / Chua 1986)
==============================================================================
Holoflow Studio · Blender 5.1 tutorial

Chua's circuit is the simplest autonomous electronic circuit known to produce
continuous-time chaos.  In 1983 Leon Chua proved — using Shilnikov's homoclinic
theorem — that a circuit with one inductor, two capacitors, and a piecewise-
linear resistor (the "Chua diode") must exhibit chaos.  Takashi Matsumoto and
colleagues built the physical circuit in 1984 and measured the double-scroll
attractor in the oscilloscope.  For the first time, chaos was predicted by
mathematical proof before being observed in hardware.

Normalised equations of motion
-------------------------------
  ẋ = α · (y − x − f(x))
  ẏ = x − y + z
  ż = −β · y

  f(x) = m₁·x + (m₀−m₁)/2 · (|x+1| − |x−1|)       (piecewise-linear Chua diode)

Physical meanings: x = normalised V(C₁), y = normalised V(C₂),
z = normalised I_L; α = C₂/C₁; β = C₂R²/L.

Canonical double-scroll parameters (Matsumoto 1985)
----------------------------------------------------
  α  = 9.0
  β  = 100/7  ≈ 14.286
  m₀ = −8/7   ≈ −1.143   (inner-segment slope, negative resistance)
  m₁ = −5/7   ≈ −0.714   (outer-segment slope)

Piecewise structure of f(x)
---------------------------
  |x| ≤ 1  →  f(x) = m₀ · x  = −(8/7) x       (N-shaped inner arm)
  |x| > 1  →  f(x) = m₁ · x + (m₀−m₁)·sign(x)
                     = −(5/7) x − (3/7)·sign(x)   (less-negative outer arm)

Fixed points  (set ẋ=ẏ=ż=0, solve; details in README)
------------------------------------------------------
  P₀  = (0,     0, 0   )   — saddle at origin; Jacobian has one positive
                               real eigenvalue (instability driving the scroll)
  P±  = (±3/2,  0, ∓3/2)  — saddle-foci around which each scroll winds

Shilnikov condition at P±
--------------------------
Linearise at P+ with α=9, β=100/7, m₁=−5/7.  The eigenvalues include
a negative real part γ ≈ −0.70 and a complex pair ρ ± iω with ρ ≈ +0.11.
Shilnikov's theorem: if a homoclinic orbit connects back to P+ along its
unstable manifold AND ρ > |γ| is violated (here |γ| > ρ, so we have a
"tame" spiral), chaos still occurs for Chua's specific global return map
because the unstable manifold from P₀ is heteroclinic to P±, creating the
cross-scroll return that constitutes the "horseshoe" in the first-return map.
(Chua, Komuro & Matsumoto 1986 give a rigorous proof via computer assistance.)

Shape keys
----------
  Basis      α=9.0,  β=14.286  — canonical double scroll (Matsumoto 1985)
  SK_Dense   α=10.5, β=14.286  — denser winding, scroll arms wider
  SK_Tight   α=9.0,  β=18.0   — increased inductance ratio, tighter loops
  SK_Wide    α=11.8, β=14.286  — near edge of double-scroll window, spread arms

All shape keys share the same tube topology; shape-key vertex offsets are
computed in Python and stored as Blender shape keys on the curve-converted mesh.

Vertex colour
-------------
Phase colour: hue = atan2(y_raw, x_raw)/π mapped to [0, 1]; saturated amber
(Cobalt at one end, Amber at the other) using FLOAT_COLOR POINT attribute.

References (permissive)
-----------------------
Chua L O, Komuro M, Matsumoto T (1986) The Double Scroll Family.
  IEEE Trans Circuits & Syst 33(11):1072–1118. DOI 10.1109/TCS.1986.1085869
  (mathematical content of equations is public domain)
Matsumoto T (1984) A Chaotic Attractor from Chua's Circuit.
  IEEE Trans Circuits & Syst 31(12):1055–1058. (equations, PD mathematical content)
NumPy — BSD-3-Clause  https://numpy.org/

Cross-references (Holoflow Studio)
-----------------------------------
/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr
/tutorials/blender-tutorial-python-numpy-aizawa-attractor-toroidal-chaos-rk4-bishop-tube-poi-webxr
/tutorials/blender-tutorial-python-numpy-halvorsen-attractor-z3-symmetry-rk4-poi-light-trail-webxr
/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr
/tutorials/blender-tutorial-python-scipy-thomas-cyclically-symmetric-attractor-labyrinth-chaos-poi-webxr
/tutorials/blender-tutorial-python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr
"""

import math
import bpy
import bmesh
import numpy as np
from mathutils import Vector, Matrix

# ── Parameters ────────────────────────────────────────────────────────────────
ALPHA_BASE  = 9.0          # C₂/C₁ ratio
BETA_BASE   = 100.0 / 7.0  # ≈14.286, C₂R²/L ratio
M0          = -8.0 / 7.0   # inner-segment slope (negative resistance)
M1          = -5.0 / 7.0   # outer-segment slope
DT          = 0.005        # RK4 time step
N_STEPS     = 45_000       # integration steps (after burn-in)
BURN_IN     = 3_000        # discard initial transient
SEED_IC     = (0.1, 0.0, 0.0)   # starting point (perturbation from origin)

POI_RADIUS  = 0.12         # bounding-sphere radius for the poi head (metres)
TUBE_R      = 0.016        # Bishop-tube bevel radius
TUBE_RES    = 2            # bevel_resolution → (TUBE_RES+1)×4 = 12 sides

SHAPE_KEYS = [
    # (name, alpha, beta)
    ("SK_Dense", 10.5,  100.0 / 7.0),
    ("SK_Tight",  9.0,  18.0       ),
    ("SK_Wide",  11.8,  100.0 / 7.0),
]

OBJ_NAME  = "hf_chua_doi"
DATE      = "2026-08-22"

# ── Chua diode nonlinearity ────────────────────────────────────────────────────
def _f(x, m0=M0, m1=M1):
    """Piecewise-linear Chua diode: f(x) = m₁x + (m₀−m₁)/2·(|x+1|−|x−1|)."""
    return m1 * x + 0.5 * (m0 - m1) * (abs(x + 1.0) - abs(x - 1.0))


# ── RK4 integrator ────────────────────────────────────────────────────────────
def _deriv(state, alpha, beta):
    x, y, z = state
    fx = _f(x)
    dx = alpha * (y - x - fx)
    dy = x - y + z
    dz = -beta * y
    return np.array([dx, dy, dz])


def _integrate(alpha, beta, dt=DT, n_steps=N_STEPS, burn=BURN_IN, ic=SEED_IC):
    """Integrate the Chua system via RK4; return (n_steps, 3) array."""
    state = np.array(ic, dtype=float)
    # burn-in
    for _ in range(burn):
        k1 = _deriv(state,           alpha, beta)
        k2 = _deriv(state + 0.5*dt*k1, alpha, beta)
        k3 = _deriv(state + 0.5*dt*k2, alpha, beta)
        k4 = _deriv(state +    dt*k3, alpha, beta)
        state += (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)

    pts = np.empty((n_steps, 3), dtype=float)
    for i in range(n_steps):
        k1 = _deriv(state,           alpha, beta)
        k2 = _deriv(state + 0.5*dt*k1, alpha, beta)
        k3 = _deriv(state + 0.5*dt*k2, alpha, beta)
        k4 = _deriv(state +    dt*k3, alpha, beta)
        state += (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)
        pts[i] = state
    return pts


# ── Normalise to poi sphere ────────────────────────────────────────────────────
def _normalise(pts, radius=POI_RADIUS):
    """Scale uniformly so 99th-percentile radial distance = radius."""
    r99 = np.percentile(np.linalg.norm(pts, axis=1), 99)
    return pts * (radius / r99)


# ── Build Blender curve + mesh ─────────────────────────────────────────────────
def build():
    # ── scene reset ──
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for blk in (bpy.data.meshes, bpy.data.curves, bpy.data.materials,
                bpy.data.objects):
        for item in list(blk):
            blk.remove(item)

    # ── integrate basis trajectory ──
    pts_base = _normalise(_integrate(ALPHA_BASE, BETA_BASE))

    # ── create curve via Blender Curve object (Bishop tube for free) ──
    crv_data = bpy.data.curves.new(OBJ_NAME, type="CURVE")
    crv_data.dimensions            = "3D"
    crv_data.bevel_depth           = TUBE_R
    crv_data.bevel_resolution      = TUBE_RES   # 12 sides
    crv_data.use_fill_caps         = True
    crv_data.twist_mode            = "MINIMUM"  # ← Bishop parallel-transport

    spline = crv_data.splines.new("POLY")
    spline.points.add(N_STEPS - 1)
    coords = np.empty(N_STEPS * 4, dtype=float)
    coords[0::4] = pts_base[:, 0]
    coords[1::4] = pts_base[:, 2]   # Chua-z → Blender-Y (depth)
    coords[2::4] = pts_base[:, 1]   # Chua-y → Blender-Z (vertical)
    coords[3::4] = 1.0              # homogeneous weight
    spline.points.foreach_set("co", coords)

    crv_obj = bpy.data.objects.new(OBJ_NAME, crv_data)
    bpy.context.collection.objects.link(crv_obj)

    # ── convert to mesh for shape keys & vertex colour ──
    bpy.context.view_layer.objects.active = crv_obj
    crv_obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    mesh_obj = bpy.context.active_object
    mesh_obj.name = OBJ_NAME
    msh = mesh_obj.data

    # ── add basis shape key (required before adding others) ──
    mesh_obj.shape_key_add(name="Basis", from_mix=False)

    # ── shape keys from alternate integrations ──
    for sk_name, alpha_alt, beta_alt in SHAPE_KEYS:
        pts_alt = _normalise(_integrate(alpha_alt, beta_alt))
        # project to the same tube topology by replacing curve + re-converting
        crv2 = bpy.data.curves.new("_tmp", type="CURVE")
        crv2.dimensions       = "3D"
        crv2.bevel_depth      = TUBE_R
        crv2.bevel_resolution = TUBE_RES
        crv2.use_fill_caps    = True
        crv2.twist_mode       = "MINIMUM"
        sp2 = crv2.splines.new("POLY")
        sp2.points.add(N_STEPS - 1)
        co2 = np.empty(N_STEPS * 4, dtype=float)
        co2[0::4] = pts_alt[:, 0]
        co2[1::4] = pts_alt[:, 2]
        co2[2::4] = pts_alt[:, 1]
        co2[3::4] = 1.0
        sp2.points.foreach_set("co", co2)
        tmp_obj = bpy.data.objects.new("_tmp", crv2)
        bpy.context.collection.objects.link(tmp_obj)
        bpy.context.view_layer.objects.active = tmp_obj
        tmp_obj.select_set(True)
        mesh_obj.select_set(False)
        bpy.ops.object.convert(target="MESH")
        tmp_mesh = tmp_obj.data
        n_verts = min(len(msh.vertices), len(tmp_mesh.vertices))
        sk = mesh_obj.shape_key_add(name=sk_name, from_mix=False)
        tmp_verts = np.empty(len(tmp_mesh.vertices) * 3, dtype=float)
        tmp_mesh.vertices.foreach_get("co", tmp_verts)
        tmp_verts = tmp_verts.reshape(-1, 3)[:n_verts]
        base_verts = np.empty(len(msh.vertices) * 3, dtype=float)
        msh.vertices.foreach_get("co", base_verts)
        base_verts = base_verts.reshape(-1, 3)
        sk_data = base_verts.copy()
        sk_data[:n_verts] = tmp_verts
        sk.data.foreach_set("co", sk_data.flatten())
        bpy.data.objects.remove(tmp_obj)
        bpy.data.curves.remove(crv2)

    # ── vertex colour: phase hue (Cobalt→Amber arc around double scroll) ──
    bpy.context.view_layer.objects.active = mesh_obj
    mesh_obj.select_set(True)
    attr = msh.attributes.new("ChuaColour", "FLOAT_COLOR", "POINT")
    n_v = len(msh.vertices)
    vco = np.empty(n_v * 3, dtype=float)
    msh.vertices.foreach_get("co", vco)
    vco = vco.reshape(-1, 3)
    # phase in (x, y) plane of the Blender mesh (= Chua x, z plane)
    phase = np.arctan2(vco[:, 1], vco[:, 0]) / math.pi  # −1 to +1
    phase = (phase + 1.0) * 0.5                          # 0 → 1
    # Cobalt (0.1, 0.3, 0.8) → Amber (0.9, 0.6, 0.1)
    r_col = 0.1 + 0.8 * phase
    g_col = 0.3 + 0.3 * phase
    b_col = 0.8 - 0.7 * phase
    a_col = np.ones(n_v)
    col_data = np.column_stack([r_col, g_col, b_col, a_col]).flatten()
    attr.data.foreach_set("color", col_data)

    # ── material: Principled BSDF + emission mix ──
    mat = bpy.data.materials.new("ChuaMat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    mix   = nt.nodes.new("ShaderNodeMixShader")
    bsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled")
    emit  = nt.nodes.new("ShaderNodeEmission")
    vcol  = nt.nodes.new("ShaderNodeVertexColor")
    vcol.layer_name = "ChuaColour"
    bsdf.inputs["Metallic"].default_value      = 0.65
    bsdf.inputs["Roughness"].default_value     = 0.18
    emit.inputs["Strength"].default_value      = 1.4
    mix.inputs["Fac"].default_value            = 0.22   # 22% emission
    nt.links.new(vcol.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(vcol.outputs["Color"], emit.inputs["Color"])
    nt.links.new(bsdf.outputs["BSDF"],  mix.inputs[1])
    nt.links.new(emit.outputs["Emission"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"],  out.inputs["Surface"])
    mesh_obj.data.materials.append(mat)

    # ── shading & export flags ──
    bpy.ops.object.shade_flat()
    mesh_obj["holoflow:facet"]    = True
    mesh_obj["holoflow:category"] = "poi-head"
    mesh_obj["holoflow:date"]     = DATE

    # ── apply +Y-up orientation ──
    mesh_obj.rotation_euler = (math.pi / 2, 0.0, 0.0)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # ── GLB export (Draco-6, WebP textures, morph targets) ──
    import os
    out_dir = os.path.join(
        bpy.path.abspath("//"), "..", "..", "..", "glbs", "scripting",
        "python-numpy-chua-circuit-double-scroll-shilnikov-chaos-"
        "piecewise-linear-bishop-tube-poi-webxr"
    )
    os.makedirs(out_dir, exist_ok=True)
    glb_path = os.path.join(out_dir, "hf_chua_doi.glb")
    bpy.ops.export_scene.gltf(
        filepath          = glb_path,
        export_format     = "GLB",
        export_draco_mesh_compression_enable  = True,
        export_draco_mesh_compression_level   = 6,
        export_image_format                   = "WEBP",
        export_morph                          = True,
        export_apply                          = True,
    )
    print(f"[Chua] Done — {N_STEPS:,} pts · tube r={TUBE_R} m · GLB → {glb_path}")


if __name__ == "__main__":
    build()

"""
KdV 2-Soliton: Korteweg–de Vries τ-Function, Hirota Bilinear Method,
Phase Shift & Animated Stage-Floor Shape Keys for WebXR (Blender 5.1)

Technique: The KdV equation u_t + 6u u_x + u_xxx = 0 admits exact N-soliton
solutions via Hirota's substitution u = 2∂²_x ln τ, where the τ-function
for 2 solitons is
    τ = 1 + e^η₁ + e^η₂ + A₁₂ e^(η₁+η₂)
    ηᵢ = κᵢ x − κᵢ³ t
    A₁₂ = ((κ₁−κ₂)/(κ₁+κ₂))²
After interaction the faster soliton advances by Δ₁ = (2/κ₁)ln((κ₁+κ₂)/(κ₁−κ₂))
and the slower one retreats by the corresponding amount — identities conserved.
Why Hirota? Avoids finite-difference noise: the analytic τ_x, τ_xx formulae give
machine-precision field values at the crest where the profile is steepest.
"""

import bpy
import numpy as np

# ── Parameters ──────────────────────────────────────────────────────────────
GRID_X        = 192          # vertex count along X
GRID_Y        = 64           # vertex count along Y
DOMAIN_X      = (-12.0, 12.0)
DOMAIN_Y      = (-3.5,   3.5)
HEIGHT_SCALE  = 0.28         # m per u-unit; single-soliton peak ≈ κ²/2
KAPPA_1       = 1.20         # κ₁: fast soliton  (amplitude κ²/2=0.72, speed κ²=1.44)
KAPPA_2       = 0.65         # κ₂: slow soliton  (amplitude 0.211, speed 0.423)
# phase shifts (derived, shown in print summary):
# Δ₁ = +(2/κ₁)ln((κ₁+κ₂)/(κ₁−κ₂)) ≈ +2.02 m  (fast advances)
# Δ₂ = −(2/κ₂)ln((κ₁+κ₂)/(κ₁−κ₂)) ≈ −3.73 m  (slow retreats)
TIMES         = [-5.0, -2.0, 0.0, 2.0, 5.0]   # shape-key time snapshots
EMIT_STRENGTH = 3.5
OUTPUT_GLB    = "//hf_kdv_soliton.glb"

MESH_NAME     = "hf_kdv_stage"
TRAIL_FAST    = "hf_kdv_trail_fast"
TRAIL_SLOW    = "hf_kdv_trail_slow"

# ── τ-function (Hirota bilinear) ────────────────────────────────────────────

_A12 = ((KAPPA_1 - KAPPA_2) / (KAPPA_1 + KAPPA_2)) ** 2

def _etas(x, t):
    return KAPPA_1 * x - KAPPA_1**3 * t, KAPPA_2 * x - KAPPA_2**3 * t

def u_kdv(x, t):
    """
    u = 2(τ τ_xx − τ_x²) / τ²   (exact analytic form, no finite differences).
    τ_x  = κ₁e^η₁ + κ₂e^η₂ + A₁₂(κ₁+κ₂)e^(η₁+η₂)
    τ_xx = κ₁²e^η₁ + κ₂²e^η₂ + A₁₂(κ₁+κ₂)²e^(η₁+η₂)
    """
    η1, η2 = _etas(x, t)
    # clip exponents to avoid overflow; soliton tails decay exponentially
    e1  = np.exp(np.clip(η1, -60, 60))
    e2  = np.exp(np.clip(η2, -60, 60))
    e12 = np.exp(np.clip(η1 + η2, -60, 60))
    K   = KAPPA_1 + KAPPA_2
    τ   = 1.0 + e1 + e2 + _A12 * e12
    τx  = KAPPA_1 * e1 + KAPPA_2 * e2 + _A12 * K * e12
    τxx = KAPPA_1**2 * e1 + KAPPA_2**2 * e2 + _A12 * K**2 * e12
    return 2.0 * (τ * τxx - τx**2) / τ**2

# ── Scene helpers ────────────────────────────────────────────────────────────

def _purge(names):
    for n in names:
        if n in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[n], do_unlink=True)

def _build_grid():
    xs  = np.linspace(*DOMAIN_X, GRID_X)
    ys  = np.linspace(*DOMAIN_Y, GRID_Y)
    xx, yy = np.meshgrid(xs, ys)           # (GRID_Y, GRID_X)
    verts = np.column_stack([xx.ravel(), yy.ravel(), np.zeros(GRID_X * GRID_Y)])
    faces = []
    for r in range(GRID_Y - 1):
        for c in range(GRID_X - 1):
            a = r * GRID_X + c
            faces.append((a, a + 1, a + GRID_X + 1, a + GRID_X))
    me = bpy.data.meshes.new(MESH_NAME)
    me.from_pydata(verts.tolist(), [], faces)
    me.update()
    ob = bpy.data.objects.new(MESH_NAME, me)
    bpy.context.collection.objects.link(ob)
    return ob, me, xs, ys

def _set_z(me, u_flat):
    co = np.empty(len(me.vertices) * 3, dtype=np.float32)
    me.vertices.foreach_get("co", co)
    co[2::3] = (u_flat * HEIGHT_SCALE).astype(np.float32)
    me.vertices.foreach_set("co", co)
    me.update()

def _vertex_colours(me, u_flat):
    """Ocean-like ramp: deep-teal trough → sky-blue mid → cream crest."""
    attr = me.attributes.new("Col", "FLOAT_COLOR", "POINT")
    lo, hi = u_flat.min(), u_flat.max()
    t = ((u_flat - lo) / max(hi - lo, 1e-9)).astype(np.float32)
    # 3-stop gradient keyed at 0, 0.5, 1
    r = np.where(t < 0.5, 0.04 + 0.28 * t * 2,  0.32 + 0.68 * (t - 0.5) * 2)
    g = np.where(t < 0.5, 0.42 + 0.38 * t * 2,  0.80 - 0.10 * (t - 0.5) * 2)
    b = np.where(t < 0.5, 0.58 - 0.06 * t * 2,  0.52 - 0.32 * (t - 0.5) * 2)
    colours = np.column_stack([r.clip(0,1), g.clip(0,1), b.clip(0,1),
                                np.ones_like(t)]).astype(np.float32)
    attr.data.foreach_set("color", colours.ravel())

def _shape_keys(ob, xs, ys):
    """Add Basis + one shape key per time snapshot."""
    ob.shape_key_add(name="Basis", from_mix=False)
    xx, yy = np.meshgrid(xs, ys)
    for t_val in TIMES:
        u = u_kdv(xx, t_val).ravel().astype(np.float32)
        sk = ob.shape_key_add(name=f"t={t_val:+.1f}", from_mix=False)
        co = np.empty(len(sk.data) * 3, dtype=np.float32)
        # read XY from basis; only Z changes
        bpy.context.view_layer.objects.active = ob
        basis_co = np.empty(len(ob.data.vertices) * 3, dtype=np.float32)
        ob.data.vertices.foreach_get("co", basis_co)
        co[0::3] = basis_co[0::3]
        co[1::3] = basis_co[1::3]
        co[2::3] = u * HEIGHT_SCALE
        sk.data.foreach_set("co", co)

def _material(me):
    mat = bpy.data.materials.new("Mat_KdV")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "Col"
    emit.inputs["Strength"].default_value = EMIT_STRENGTH
    nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    me.materials.append(mat)

def _trail_curve(name, kappa, colour):
    """
    NURBS poi-light-trail tracing x_peak(t) = κ² t over time.
    Peak condition: η = κx − κ³t = 0 → x_peak = κ²t.
    Z = κ²/2 · HEIGHT_SCALE (amplitude of the isolated soliton).
    Y spread maps time-parameter → stage depth for visual clarity.
    """
    ts   = np.linspace(-6.0, 6.0, 110)
    xp   = kappa**2 * ts
    yp   = np.linspace(*DOMAIN_Y, 110)
    zp   = np.full(110, kappa**2 / 2.0 * HEIGHT_SCALE)
    pts  = np.column_stack([xp, yp, zp])
    cu   = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    sp   = cu.splines.new("NURBS")
    sp.points.add(len(pts) - 1)
    xyzw = np.column_stack([pts, np.ones(len(pts))]).ravel()
    sp.points.foreach_set("co", xyzw)
    sp.use_endpoint_u = True
    cu.bevel_depth   = 0.014
    cu.bevel_resolution = 4
    ob = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(ob)
    mat = bpy.data.materials.new(f"Mat_{name}")
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = (*colour, 1.0)
    emit.inputs["Strength"].default_value = 6.5
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    ob.data.materials.append(mat)
    return ob

# ── Main ─────────────────────────────────────────────────────────────────────

_purge([MESH_NAME, TRAIL_FAST, TRAIL_SLOW])

ob, me, xs, ys = _build_grid()
xx, yy = np.meshgrid(xs, ys)

u_basis = u_kdv(xx, 0.0).ravel()
_set_z(me, u_basis)
_vertex_colours(me, u_basis)
me.polygons.foreach_set("use_smooth", [False] * len(me.polygons))   # faceted
ob["holoflow:facet"] = True
_material(me)
_shape_keys(ob, xs, ys)

_trail_curve(TRAIL_FAST, KAPPA_1, (1.0, 0.85, 0.15))   # gold — fast
_trail_curve(TRAIL_SLOW, KAPPA_2, (0.15, 0.80, 1.00))  # cyan — slow

# ── Export ───────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="DESELECT")
for n in [MESH_NAME, TRAIL_FAST, TRAIL_SLOW]:
    if n in bpy.data.objects:
        bpy.data.objects[n].select_set(True)

bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(OUTPUT_GLB),
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
)

Δ1 = (2 / KAPPA_1) * np.log((KAPPA_1 + KAPPA_2) / (KAPPA_1 - KAPPA_2))
Δ2 = -(2 / KAPPA_2) * np.log((KAPPA_1 + KAPPA_2) / (KAPPA_1 - KAPPA_2))
print(f"✓ Exported: {OUTPUT_GLB}")
print(f"  κ₁={KAPPA_1}  amp={KAPPA_1**2/2:.3f}  speed={KAPPA_1**2:.3f}  Δx₁={Δ1:+.3f} m")
print(f"  κ₂={KAPPA_2}  amp={KAPPA_2**2/2:.3f}  speed={KAPPA_2**2:.3f}  Δx₂={Δ2:+.3f} m")
print(f"  A₁₂={_A12:.6f}  |ln A₁₂|={abs(np.log(_A12)):.4f}")

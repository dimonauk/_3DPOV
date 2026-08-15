# ===========================================================================
# Dini's Surface — Constant-Negative-Curvature Helical Pseudosphere
# Blender 5.1  |  Python 3.11  |  numpy required (bundled in Blender 5.1)
#
# TECHNIQUE
#   Dini's surface (Ulisse Dini, 1869) is parametrised by:
#
#     x(u,v) = a · cos(u) · sin(v)
#     y(u,v) = a · sin(u) · sin(v)
#     z(u,v) = a · (cos(v) + ln(tan(v/2))) + b · u
#
#   Here a > 0 is the curvature scale and b controls the helix pitch.
#   At b = 0 the surface degenerates to the pseudosphere (tractricoid),
#   Beltrami's 1868 embedding of the hyperbolic plane in ℝ³.
#
#   WHY K = −1/(a²+b²) is constant:
#     First fundamental form coefficients:
#       E = a²sin²v + b²
#       F = ab·cos²v / sinv
#       G = a²cos²v / sin²v
#     → EG − F² = a²cos²v(a² + b²)
#
#     Second fundamental form (computed via cross-product normal):
#       L = −a²cosv·sinv / √(a²+b²)
#       M =  ab·cos²v / (sinv·√(a²+b²))
#       N =  a²cosv / (sinv·√(a²+b²))
#     → LN − M² = −a²cos²v
#
#     Gaussian curvature K = (LN − M²)/(EG − F²) = −1/(a² + b²)  ✓
#
#   Sine-Gordon connection:
#     The Chebyshev-net angle ω(u,v) between the two parameter families
#     satisfies the sine-Gordon equation ω_uu − ω_vv = sinω.
#     The 1-soliton (kink) solution ω = 4·arctan(exp(u)) corresponds to
#     the pseudosphere; the Lorentz-boosted kink with velocity β = b/√(a²+b²)
#     gives Dini's surface.  Each shape key sweeps β from 0 → ~0.92.
#
#   Hilbert's theorem (1901): NO complete smooth surface of constant
#   K = −1 exists in ℝ³.  Dini's surface is therefore necessarily
#   incomplete — it terminates in singular cusps at v → 0 and v → π.
#
# POI HEAD
#   Five shape keys sweep b/a from 0 (pseudosphere) to 2.4 (drill-bit).
#   Vertex colour maps the sine-Gordon kink angle ω as hue.
#   GLB: Draco-6, WebP textures, +Y-up, morph targets, holoflow:facet.
# ===========================================================================

import math
import os

import bpy
import numpy as np

# ── Parameters ──────────────────────────────────────────────────────────────
A             = 0.80          # curvature scale; K = −1/(A²+b²)
B_VALUES      = [0.0, 0.30, 0.65, 1.25, 2.40]  # helix pitch per shape key
SK_NAMES      = ["Basis", "SK_Gentle", "SK_Moderate", "SK_Tight", "SK_Drill"]
U_TURNS       = 3.5           # helical revolutions (u ∈ [0, 2π·U_TURNS])
V_MIN         = 0.09          # skip cusp at v=0 (ln(tan(0/2)) → −∞)
V_MAX         = math.pi - 0.09
N_U           = 84            # columns (azimuthal)
N_V           = 60            # rows (polar)
POI_DIAMETER  = 0.18          # target bounding-box diameter (metres)
METALLIC      = 0.45
ROUGHNESS     = 0.28
EMISSION_STR  = 2.60
EMIT_MIX      = 0.22          # Emission MixShader factor

# ── Parametrisation ──────────────────────────────────────────────────────────

def dini_verts(b: float) -> np.ndarray:
    """Return (N_V * N_U, 3) float64 vertex array for one pitch value b.

    WHY separate function: each shape key calls this with its own b,
    so the curvature A stays constant and K scales as −1/(A²+b²).
    """
    u = np.linspace(0.0, 2.0 * math.pi * U_TURNS, N_U, endpoint=False)
    v = np.linspace(V_MIN, V_MAX, N_V)
    U, V = np.meshgrid(u, v)               # (N_V, N_U)

    # Tractrix meridian height: cos(v) + ln(tan(v/2))
    mer = np.cos(V) + np.log(np.tan(V * 0.5))

    x = A * np.cos(U) * np.sin(V)
    y = A * np.sin(U) * np.sin(V)
    z = A * mer + b * U
    return np.stack([x, y, z], axis=-1).reshape(-1, 3)


def kink_colour(b: float) -> np.ndarray:
    """Compute sine-Gordon kink angle ω per vertex → HSV hue array (0-1).

    Boosted-kink field: ω = 4·arctan(exp(γ(phase))) mod 2π
    where β = b/√(A²+b²) and γ = 1/√(1−β²).
    WHY colour by ω: the kink transition (ω: 0→2π) marks the inflection
    ridge of the tractrix meridian — colouring it reveals the soliton
    structure that underlies the surface's integrability.
    """
    beta  = b / math.sqrt(A ** 2 + b ** 2 + 1e-12)
    gamma = 1.0 / math.sqrt(max(1.0 - beta ** 2, 1e-6))

    u_lin = np.linspace(0.0, 2.0 * math.pi * U_TURNS, N_U, endpoint=False)
    v_lin = np.linspace(V_MIN, V_MAX, N_V)
    U, V  = np.meshgrid(u_lin, v_lin)

    phase = gamma * (U / (2.0 * math.pi * U_TURNS) - beta * (V - math.pi * 0.5))
    omega = (4.0 * np.arctan(np.exp(phase))) % (2.0 * math.pi)
    return (omega / (2.0 * math.pi)).reshape(-1)   # hue ∈ [0, 1)

# ── Mesh construction ────────────────────────────────────────────────────────

def build_mesh() -> bpy.types.Object:
    """Build quad mesh from Basis (b=0, pseudosphere)."""
    verts = dini_verts(B_VALUES[0]).tolist()

    faces = []
    for vi in range(N_V - 1):
        for ui in range(N_U):
            ui1 = (ui + 1) % N_U    # u wraps (helical cylinder topology)
            a_i = vi * N_U + ui
            b_i = vi * N_U + ui1
            c_i = (vi + 1) * N_U + ui1
            d_i = (vi + 1) * N_U + ui
            faces.append((a_i, b_i, c_i, d_i))

    mesh = bpy.data.meshes.new("hf_dini_poi")
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    obj = bpy.data.objects.new("hf_dini_poi", mesh)
    bpy.context.collection.objects.link(obj)
    return obj

# ── Shape keys ───────────────────────────────────────────────────────────────

def add_shape_keys(obj: bpy.types.Object) -> None:
    """Add Basis + four helix-pitch shape keys as GLTF morph targets.

    WHY relative=False: absolute shape keys are simpler when positions
    change dramatically; Blender's GLTF exporter handles morph-target
    deltas automatically on export.
    """
    obj.shape_key_add(name="Basis", from_mix=False)

    for name, b_val in zip(SK_NAMES[1:], B_VALUES[1:]):
        sk = obj.shape_key_add(name=name, from_mix=False)
        verts = dini_verts(b_val)
        for i, key_v in enumerate(sk.data):
            key_v.co = verts[i].tolist()

# ── Vertex colour ─────────────────────────────────────────────────────────────

def add_vertex_colour(obj: bpy.types.Object) -> None:
    """FLOAT_COLOR attribute 'DiniCol' encoding kink angle as rainbow hue.

    WHY FLOAT_COLOR not BYTE_COLOR: FLOAT_COLOR is Blender 5.1's HDR
    colour attribute — it can represent values > 1.0 and is required for
    correct Emission via ShaderNodeAttribute in Cycles/Eevee Next.
    """
    hue = kink_colour(B_VALUES[2])     # colour from b=0.65 (moderate kink)
    s, v_val = 0.82, 0.90

    hi   = (hue * 6.0).astype(int) % 6
    f    = hue * 6.0 - np.floor(hue * 6.0)
    p    = np.full_like(hue, v_val * (1.0 - s))
    q_c  = v_val * (1.0 - s * f)
    t_c  = v_val * (1.0 - s * (1.0 - f))
    vv   = np.full_like(hue, v_val)

    r = np.select([hi==0,hi==1,hi==2,hi==3,hi==4,hi==5],[vv,q_c,p,p,t_c,vv])
    g = np.select([hi==0,hi==1,hi==2,hi==3,hi==4,hi==5],[t_c,vv,vv,q_c,p,p])
    b = np.select([hi==0,hi==1,hi==2,hi==3,hi==4,hi==5],[p,p,t_c,vv,vv,q_c])

    attr = obj.data.color_attributes.new(
        name="DiniCol", type="FLOAT_COLOR", domain="POINT"
    )
    for i, (ri, gi, bi) in enumerate(zip(r.tolist(), g.tolist(), b.tolist())):
        attr.data[i].color = (ri, gi, bi, 1.0)

# ── Material ─────────────────────────────────────────────────────────────────

def build_material(obj: bpy.types.Object) -> None:
    mat = bpy.data.materials.new("mat_dini_poi")
    mat.use_nodes        = True
    mat.use_backface_culling = False   # surface curls; inner face visible
    nt = mat.node_tree
    nt.nodes.clear()

    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    mix   = nt.nodes.new("ShaderNodeMixShader")
    pbsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    emit  = nt.nodes.new("ShaderNodeEmission")
    attr  = nt.nodes.new("ShaderNodeAttribute")

    attr.attribute_name                      = "DiniCol"
    pbsdf.inputs["Metallic"].default_value   = METALLIC
    pbsdf.inputs["Roughness"].default_value  = ROUGHNESS
    emit.inputs["Strength"].default_value    = EMISSION_STR
    mix.inputs["Fac"].default_value          = EMIT_MIX

    nt.links.new(attr.outputs["Color"], pbsdf.inputs["Base Color"])
    nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
    nt.links.new(pbsdf.outputs["BSDF"],      mix.inputs[1])
    nt.links.new(emit.outputs["Emission"],   mix.inputs[2])
    nt.links.new(mix.outputs["Shader"],      out.inputs["Surface"])
    obj.data.materials.append(mat)

# ── Finalise ─────────────────────────────────────────────────────────────────

def finalise(obj: bpy.types.Object) -> None:
    """Scale to POI_DIAMETER, rotate to +Y-up WebXR convention, apply."""
    vcos = np.array([v.co for v in obj.data.vertices])
    extents = vcos.max(axis=0) - vcos.min(axis=0)
    scale = POI_DIAMETER / float(extents.max())
    obj.scale = (scale, scale, scale)
    obj.rotation_euler = (math.pi / 2, 0.0, 0.0)

    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "poi-head"

# ── Export ────────────────────────────────────────────────────────────────────

def export_glb(obj: bpy.types.Object) -> None:
    slug = "python-numpy-dini-surface-pseudosphere-sine-gordon-kink-tractrix-poi-webxr"
    out_dir = os.path.join(
        bpy.path.abspath("//"), "..", "..", "glbs", "scripting", slug
    )
    os.makedirs(out_dir, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath    = os.path.join(out_dir, "hf_dini_poi.glb"),
        export_format  = "GLB",
        use_selection  = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = "WEBP",
        export_colors  = True,
        export_morph   = True,
        export_apply   = False,
        export_yup     = True,
    )
    print("✓ hf_dini_poi.glb  →", out_dir)

# ── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    for ob in list(bpy.data.objects):
        if ob.name.startswith("hf_dini"):
            bpy.data.objects.remove(ob, do_unlink=True)

    obj = build_mesh()
    add_shape_keys(obj)
    add_vertex_colour(obj)
    build_material(obj)
    finalise(obj)
    export_glb(obj)
    print("✓ Dini surface complete — K =", round(-1.0 / (A ** 2), 4), "(pseudosphere basis)")

main()

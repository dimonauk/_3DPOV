"""
Shader — Triplanar Projection: Seamless No-UV Texturing
for Hard-Surface Props & Terrain (Blender 5.1) | CC0

TECHNIQUE
---------
Three axis-aligned planar projections (XY, YZ, XZ) are blended by the
surface normal, eliminating UV seams on any topology.

Normal weighting (power method):
  w_i = |n_i| ^ SHARPNESS   (component-wise)
  sum  = w_x + w_y + w_z
  blend_i = w_i / sum        (normalise to sum-to-1)

WHY power not linear abs:
  Raw |n| still contributes ≈ 0.5 from both planes where the normal hits
  45°, producing a visible mid-tone band along diagonal edges.  Raising
  to SHARPNESS ≥ 2 squashes off-axis contributions and sharpens the blend
  zone.  SHARPNESS = 4 is the studio default for hard-surface props.

WHY object-space coordinates:
  Texture Coordinate → Object gives local-space coords.  As the object
  rotates, the texture counter-rotates with it — correct for props.
  For world-aligned tiling (terrain), swap to Texture Coordinate → Global.

glTF limitation:
  Triplanar shaders have no glTF extension.  All projections must be baked
  to UV-mapped images before GLB export.  This blueprint bakes Diffuse
  Colour to a 1024 × 1024 PNG via Cycles (BSDF → Diffuse pass).
"""

import bpy
import math

# ── CONSTANTS ──────────────────────────────────────────────────────────────────
SCALE      = 2.0     # texture repeat frequency (tiles per Blender unit)
SHARPNESS  = 4.0     # blend exponent: 1 = smooth seams, 4 = hard-surface
BAKE_RES   = 1024    # bake texture resolution in pixels
OUT_DIR    = "//output/"
OUT_GLB    = OUT_DIR + "triplanar_boulder.glb"
OUT_IMG    = OUT_DIR + "triplanar_baked.png"
COL_NAME   = "TriplanarDemo"


# ── SCENE SETUP ────────────────────────────────────────────────────────────────
def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)


def get_col():
    c = bpy.data.collections.new(COL_NAME)
    bpy.context.scene.collection.children.link(c)
    return c


def link_to_col(obj, col):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)


# ── BOULDER MESH ───────────────────────────────────────────────────────────────
def make_boulder(col):
    """
    UV sphere → Subdiv → Displace (Musgrave, object-space) → applied.
    Smart UV project adds a bake-ready UV map without any manual seam work.
    """
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.8, segments=32, ring_count=24)
    obj = bpy.context.active_object
    obj.name = "boulder"

    sub = obj.modifiers.new("SubSurf", "SUBSURF")
    sub.levels = 2

    # Musgrave texture for the displacement — object-space coords so no UV required
    disp_tex = bpy.data.textures.new("BoulderNoise", "MUSGRAVE")
    disp_tex.musgrave_type = "MULTIFRACTAL"
    disp_tex.noise_scale = 0.6
    disp_tex.octaves    = 6.0
    disp_tex.lacunarity = 2.0

    disp = obj.modifiers.new("Displace", "DISPLACE")
    disp.texture        = disp_tex
    disp.strength       = 0.22
    disp.texture_coords = "OBJECT"

    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier="SubSurf")
    bpy.ops.object.modifier_apply(modifier="Displace")

    # Smart UV project — minimises distortion on irregular topology
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(70))
    bpy.ops.object.mode_set(mode="OBJECT")

    link_to_col(obj, col)
    return obj


# ── NODE HELPERS ───────────────────────────────────────────────────────────────
def N(tree, t, x, y):
    n = tree.nodes.new(t)
    n.location = (x, y)
    return n


def L(tree, a, ao, b, bi):
    tree.links.new(a.outputs[ao], b.inputs[bi])


# ── TRIPLANAR MATERIAL ─────────────────────────────────────────────────────────
def make_triplanar_material():
    """
    Procedural triplanar rock shader.

    Node flow (left → right):
      TexCoord.Object → SeparateXYZ → three axis-pair CombineXYZ → VectorScale
                                       → three Noise Textures → ColourRamps
      Geometry.Normal → SeparateXYZ → abs → pow(SHARPNESS) → sum → normalise
      Three MixRGB(MIX, A=black) scale each colour by its weight   (col × w)
      Two  MixRGB(ADD, fac=1.0)  sum the weighted colours           (Σ col×w)
      Principled BSDF ← blended colour
    """
    mat = bpy.data.materials.new("TriplanarRock")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out  = N(nt, "ShaderNodeOutputMaterial", 1200,   0)
    bsdf = N(nt, "ShaderNodeBsdfPrincipled",  950,   0)
    bsdf.inputs["Roughness"].default_value = 0.82
    bsdf.inputs["Metallic"].default_value  = 0.0
    L(nt, bsdf, "BSDF", out, "Surface")

    # ── Texture coordinates ────────────────────────────────────────────────────
    tc  = N(nt, "ShaderNodeTexCoord",    -1100, 100)
    sep = N(nt, "ShaderNodeSeparateXYZ", -920,  100)
    L(nt, tc, "Object", sep, "Vector")

    # ── Three projection vectors ───────────────────────────────────────────────
    # Z proj (top/bottom): sample (x, y) — dominant when |normal.z| ≈ 1
    # X proj (left/right): sample (y, z) — dominant when |normal.x| ≈ 1
    # Y proj (front/back): sample (x, z) — dominant when |normal.y| ≈ 1
    def proj_vec(sx, sy, loc_y):
        comb = N(nt, "ShaderNodeCombineXYZ", -740, loc_y)
        if sx is not None: L(nt, sep, sx, comb, "X")
        if sy is not None: L(nt, sep, sy, comb, "Y")
        sc = N(nt, "ShaderNodeVectorMath", -560, loc_y)
        sc.operation = "SCALE"
        sc.inputs["Scale"].default_value = SCALE
        L(nt, comb, "Vector", sc, "Vector")
        return sc

    vec_z = proj_vec("X", "Y",   200)
    vec_x = proj_vec("Y", "Z",     0)
    vec_y = proj_vec("X", "Z",  -200)

    # ── Noise + ColourRamp per projection ──────────────────────────────────────
    def noise_ramp(vec_node, loc_y):
        noise = N(nt, "ShaderNodeTexNoise", -340, loc_y)
        noise.inputs["Scale"].default_value      = 1.0   # pre-scaled by vec
        noise.inputs["Detail"].default_value     = 10.0
        noise.inputs["Roughness"].default_value  = 0.65
        noise.inputs["Lacunarity"].default_value = 2.0
        L(nt, vec_node, "Vector", noise, "Vector")

        ramp = N(nt, "ShaderNodeValToRGB", -140, loc_y)
        els  = ramp.color_ramp.elements
        els[0].color = (0.09, 0.08, 0.07, 1.0)  # dark basalt
        els[1].color = (0.45, 0.40, 0.35, 1.0)  # warm sandstone
        mid = ramp.color_ramp.elements.new(0.42)
        mid.color    = (0.20, 0.17, 0.14, 1.0)  # mid rock tone
        L(nt, noise, "Fac", ramp, "Fac")
        return ramp

    col_z = noise_ramp(vec_z,  200)
    col_x = noise_ramp(vec_x,    0)
    col_y = noise_ramp(vec_y, -200)

    # ── Normal weights ─────────────────────────────────────────────────────────
    # WHY Geometry.Normal not Normal Map node:
    #   Geometry.Normal gives interpolated shading normal in world/object space —
    #   axis-aligned and meaningful for planar blending.  Normal Map outputs a
    #   tangent-space perturbation that requires UVs and is meaningless here.
    geo  = N(nt, "ShaderNodeNewGeometry", -1100, -400)
    nsep = N(nt, "ShaderNodeSeparateXYZ", -920,  -400)
    L(nt, geo, "Normal", nsep, "Vector")

    def weight(axis_out, loc_x, loc_y):
        ab = N(nt, "ShaderNodeMath", loc_x,       loc_y)
        ab.operation = "ABSOLUTE"
        L(nt, nsep, axis_out, ab, "Value")
        pw = N(nt, "ShaderNodeMath", loc_x + 160, loc_y)
        pw.operation = "POWER"
        pw.inputs[1].default_value = SHARPNESS
        L(nt, ab, "Value", pw, "Value")
        return pw

    wz = weight("Z", -740, -360)
    wx = weight("X", -740, -460)
    wy = weight("Y", -740, -560)

    # Sum → normalise
    add1 = N(nt, "ShaderNodeMath", -350, -460)
    add1.operation = "ADD"
    L(nt, wx, "Value", add1, 0)
    L(nt, wy, "Value", add1, 1)

    add2 = N(nt, "ShaderNodeMath", -180, -460)
    add2.operation = "ADD"
    L(nt, add1, "Value", add2, 0)
    L(nt, wz,   "Value", add2, 1)

    def norm(w_node, loc_x, loc_y):
        dv = N(nt, "ShaderNodeMath", loc_x, loc_y)
        dv.operation = "DIVIDE"
        L(nt, w_node, "Value", dv, 0)
        L(nt, add2,   "Value", dv, 1)
        return dv

    nwz = norm(wz, -10, -360)
    nwx = norm(wx, -10, -460)
    nwy = norm(wy, -10, -560)

    # ── Weighted colour blend ──────────────────────────────────────────────────
    # MixRGB(MIX, fac=weight, A=black, B=col) = lerp(black, col, weight) = col×weight
    # MixRGB(ADD, fac=1.0,  A=sc_x, B=sc_y)  = sc_x + sc_y (clamped; safe since Σw=1)
    def scale_col(col_node, nw_node, loc_y):
        mx = N(nt, "ShaderNodeMixRGB", 200, loc_y)
        mx.blend_type = "MIX"
        L(nt, nw_node,  "Value", mx, "Fac")
        L(nt, col_node, "Color", mx, 2)     # Color2 slot
        return mx

    sc_z = scale_col(col_z, nwz,  200)
    sc_x = scale_col(col_x, nwx,    0)
    sc_y = scale_col(col_y, nwy, -200)

    add_xy = N(nt, "ShaderNodeMixRGB", 420, 0)
    add_xy.blend_type = "ADD"
    add_xy.inputs["Fac"].default_value = 1.0
    L(nt, sc_x, "Color", add_xy, 1)
    L(nt, sc_y, "Color", add_xy, 2)

    add_z = N(nt, "ShaderNodeMixRGB", 650, 0)
    add_z.blend_type = "ADD"
    add_z.inputs["Fac"].default_value = 1.0
    L(nt, add_xy, "Color", add_z, 1)
    L(nt, sc_z,  "Color",  add_z, 2)

    L(nt, add_z, "Color", bsdf, "Base Color")
    return mat


# ── BAKE TARGET ────────────────────────────────────────────────────────────────
def setup_bake_target(obj):
    """
    Create a float image and an unlinked Image Texture node as the bake target.
    Cycles reads the active image node in the active material as its destination.
    """
    img = bpy.data.images.new("triplanar_baked", width=BAKE_RES, height=BAKE_RES,
                               float_buffer=True)
    img.filepath = OUT_IMG

    mat = obj.data.materials[0]
    nt  = mat.node_tree
    bake_n = nt.nodes.new("ShaderNodeTexImage")
    bake_n.image    = img
    bake_n.location = (950, -400)
    bake_n.label    = "BakeTarget"

    for n in nt.nodes:
        n.select = (n == bake_n)
    nt.nodes.active = bake_n
    return img


# ── BAKE ───────────────────────────────────────────────────────────────────────
def bake_diffuse(obj):
    sc = bpy.context.scene
    sc.render.engine        = "CYCLES"
    sc.cycles.samples       = 16   # production: raise to 128+
    sc.render.bake.use_pass_direct   = False
    sc.render.bake.use_pass_indirect = False
    sc.render.bake.use_pass_color    = True

    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.bake(type="DIFFUSE")

    img = bpy.data.images["triplanar_baked"]
    img.save()
    print(f"[holoflow] baked → {OUT_IMG}")


# ── EXPORT ─────────────────────────────────────────────────────────────────────
def export_glb():
    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB,
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
    )
    print(f"[holoflow] GLB → {OUT_GLB}")


# ── MAIN ───────────────────────────────────────────────────────────────────────
clear_scene()
col = get_col()

bpy.ops.object.light_add(type="SUN", location=(4, -4, 7))
sun = bpy.context.active_object
sun.data.energy = 4.5
link_to_col(sun, col)

bpy.ops.object.camera_add(location=(2.5, -2.5, 1.6))
cam = bpy.context.active_object
cam.rotation_euler = (1.12, 0, 0.785)
bpy.context.scene.camera = cam
link_to_col(cam, col)

boulder = make_boulder(col)
mat     = make_triplanar_material()
boulder.data.materials.append(mat)

setup_bake_target(boulder)
bake_diffuse(boulder)
export_glb()

print("[holoflow] triplanar_boulder complete")

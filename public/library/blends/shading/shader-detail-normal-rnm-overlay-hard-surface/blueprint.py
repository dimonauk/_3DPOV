# blueprint.py — Shader: Reoriented Normal Mapping (RNM) Detail Overlay
# Blender 5.1 | CC0 | Holoflow Studio Library
# https://holoflow.co.uk/tutorials/blender-tutorial-shader-detail-normal-rnm-overlay-hard-surface
#
# PROBLEM: Simple Mix/Lerp of two Normal Map outputs is mathematically wrong.
#   Normal vectors are unit vectors in 3-space; averaging their decoded forms
#   does not produce a valid composite normal — the result is shorter than 1,
#   points in an incorrect direction at steep angles, and introduces shading
#   artefacts at 45° to both normals.
#
# SOLUTION: Reoriented Normal Mapping (RNM), Ben Golus 2017.
#   Given two tangent-space normals T (base) and D (detail), both already
#   decoded to unit vectors in shader-world space:
#
#     Rx = Tx + Dx
#     Ry = Ty + Dy
#     Rz = Tz × Dz          ← multiply Z, don't add
#     R  = normalize(vec3(Rx, Ry, Rz))
#
#   The Z-multiply preserves the cosine relationship between the two normals
#   and avoids the "flattening" that simple addition of Z causes at glancing
#   angles.  The resulting R is then re-normalized to unit length.
#
# BLENDER IMPLEMENTATION:
#   Two Bump nodes (driven by procedural textures) produce T and D as
#   world-space-like vectors fed into the BSDF Normal socket.  RNM math is
#   wired as: SepXYZ → Add/Multiply → CombineXYZ → VectorMath(NORMALIZE) → Normal.
#
# Outputs:
#   output/rnm_panel.glb  — Draco 6, Y-up, snake_case root

import bpy, math, os

# ── parameters ────────────────────────────────────────────────────────────────
BASE_SCALE     = 2.5    # Noise scale for low-frequency panel undulation
BASE_STRENGTH  = 0.8    # Bump node strength for base layer
DETAIL_SCALE   = 14.0   # Voronoi scale for rivet/bolt detail
DETAIL_STRENGTH = 0.35  # Bump node strength for detail layer
PANEL_W        = 1.6    # metres, 16:9
PANEL_H        = 0.9
BASE_COLOR     = (0.22, 0.22, 0.22, 1.0)  # dark steel
METALLIC       = 0.85
ROUGHNESS      = 0.38
OUT_GLB        = "//output/rnm_panel.glb"


# ── helpers ───────────────────────────────────────────────────────────────────
def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def N(tree, bl_type, x=0, y=0):
    n = tree.nodes.new(bl_type)
    n.location = (x, y)
    return n


def L(tree, a, ao, b, bi):
    tree.links.new(a.outputs[ao], b.inputs[bi])


# ── material ──────────────────────────────────────────────────────────────────
def build_material() -> bpy.types.Material:
    mat = bpy.data.materials.new("RNM_Panel")
    mat.use_nodes = True
    t = mat.node_tree
    for n in list(t.nodes):
        t.nodes.remove(n)

    tc = N(t, "ShaderNodeTexCoord", -1400, 0)

    # ── base normal: low-frequency panel undulation ───────────────────────────
    base_map = N(t, "ShaderNodeMapping", -1200, 200)
    base_map.inputs["Scale"].default_value = (BASE_SCALE, BASE_SCALE, 1.0)
    L(t, tc, "UV", base_map, "Vector")

    base_noise = N(t, "ShaderNodeTexNoise", -980, 200)
    base_noise.inputs["Scale"].default_value = BASE_SCALE
    base_noise.inputs["Detail"].default_value = 3.0
    base_noise.inputs["Roughness"].default_value = 0.6
    L(t, base_map, "Vector", base_noise, "Vector")

    base_bump = N(t, "ShaderNodeBump", -760, 200)
    base_bump.inputs["Strength"].default_value = BASE_STRENGTH
    # Fac output of Noise feeds Height
    L(t, base_noise, "Fac", base_bump, "Height")
    # → outputs[0] = Normal (decoded vector in world/tangent space)

    # ── detail normal: Voronoi DISTANCE_TO_EDGE = rivet edges ────────────────
    detail_map = N(t, "ShaderNodeMapping", -1200, -200)
    detail_map.inputs["Scale"].default_value = (DETAIL_SCALE, DETAIL_SCALE, 1.0)
    L(t, tc, "UV", detail_map, "Vector")

    detail_vor = N(t, "ShaderNodeTexVoronoi", -980, -200)
    detail_vor.voronoi_dimensions = "2D"
    detail_vor.feature = "DISTANCE_TO_EDGE"
    detail_vor.inputs["Randomness"].default_value = 0.0   # honeycomb
    L(t, detail_map, "Vector", detail_vor, "Vector")

    # Invert: edge=0 → 1, centre=~0.5 → 0.5; bump interprets higher = raised
    inv = N(t, "ShaderNodeMath", -760, -200)
    inv.operation = "SUBTRACT"
    inv.inputs[0].default_value = 1.0
    L(t, detail_vor, "Distance", inv, 1)

    detail_bump = N(t, "ShaderNodeBump", -540, -200)
    detail_bump.inputs["Strength"].default_value = DETAIL_STRENGTH
    L(t, inv, "Value", detail_bump, "Height")

    # ── RNM blend: separate → combine → normalise ─────────────────────────────
    # T = base_bump Normal, D = detail_bump Normal
    sep_T = N(t, "ShaderNodeSeparateXYZ", -300, 200)
    L(t, base_bump, "Normal", sep_T, "Vector")

    sep_D = N(t, "ShaderNodeSeparateXYZ", -300, -200)
    L(t, detail_bump, "Normal", sep_D, "Vector")

    # Rx = Tx + Dx
    add_x = N(t, "ShaderNodeMath", -80, 100)
    add_x.operation = "ADD"
    L(t, sep_T, "X", add_x, 0)
    L(t, sep_D, "X", add_x, 1)

    # Ry = Ty + Dy
    add_y = N(t, "ShaderNodeMath", -80, -60)
    add_y.operation = "ADD"
    L(t, sep_T, "Y", add_y, 0)
    L(t, sep_D, "Y", add_y, 1)

    # Rz = Tz × Dz  — KEY DIFFERENCE from simple mix
    mul_z = N(t, "ShaderNodeMath", -80, -220)
    mul_z.operation = "MULTIPLY"
    L(t, sep_T, "Z", mul_z, 0)
    L(t, sep_D, "Z", mul_z, 1)

    comb = N(t, "ShaderNodeCombineXYZ", 140, -60)
    L(t, add_x, "Value", comb, "X")
    L(t, add_y, "Value", comb, "Y")
    L(t, mul_z, "Value", comb, "Z")

    # Normalize to restore unit length after the vector sum
    nrm = N(t, "ShaderNodeVectorMath", 360, -60)
    nrm.operation = "NORMALIZE"
    L(t, comb, "Vector", nrm, "Vector")

    # ── Principled BSDF ───────────────────────────────────────────────────────
    bsdf = N(t, "ShaderNodeBsdfPrincipled", 580, 100)
    bsdf.inputs["Base Color"].default_value = BASE_COLOR
    bsdf.inputs["Metallic"].default_value = METALLIC
    bsdf.inputs["Roughness"].default_value = ROUGHNESS
    # Feed blended normal into Normal socket (index varies; use name)
    L(t, nrm, "Vector", bsdf, "Normal")

    out = N(t, "ShaderNodeOutputMaterial", 820, 100)
    L(t, bsdf, "BSDF", out, "Surface")

    return mat


def build_scene():
    reset_scene()
    mat = build_material()

    bpy.ops.mesh.primitive_plane_add(size=1)
    panel = bpy.context.active_object
    panel.name = "rnm_panel"
    panel.scale = (PANEL_W, PANEL_H, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    # Subdivide so bump detail is visible in rendered viewport
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.subdivide(number_cuts=8)
    bpy.ops.object.mode_set(mode="OBJECT")
    panel.data.materials.append(mat)

    # Slightly angled camera to show normal depth
    bpy.ops.object.camera_add(
        location=(0.0, -1.6, 0.9),
        rotation=(math.radians(60), 0, 0),
    )
    cam = bpy.context.active_object
    bpy.context.scene.camera = cam

    bpy.ops.object.light_add(type="SUN", location=(2, -2, 3))
    sun = bpy.context.active_object
    sun.data.angle = math.radians(3.0)  # sharp sun = strong normal definition

    bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT"
    return panel


def export_glb(panel_obj):
    out = bpy.path.abspath(OUT_GLB)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    panel_obj.select_set(True)
    bpy.context.view_layer.objects.active = panel_obj
    bpy.ops.export_scene.gltf(
        filepath=out,
        export_format="GLB",
        use_selection=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_yup=True,
        export_materials="EXPORT",
        export_animations=False,
    )
    print(f"[holoflow] exported → {out}")


if __name__ == "__main__":
    panel = build_scene()
    export_glb(panel)
    print("[holoflow] rnm_panel complete")

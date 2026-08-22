# blends/geometry-nodes/gn-attribute-statistic-evaluate-on-domain/blueprint.py
# Blender 5.1 | CC0
#
# GN Attribute Statistic + Evaluate on Domain — Global-Normalised Face-Area Heat Map
#
# Attribute Statistic collapses a field down to global scalars (Min, Max,
# Mean, …) across all elements of a domain in a single GN evaluation pass.
# Combine it with Map Range and a Color Ramp to build a data-vis heat map
# that self-calibrates to any mesh: small flat faces go cool, large/steep
# faces go warm, and the full [Min, Max] range always occupies the complete
# colour ramp regardless of absolute scale.
#
# Evaluate on Domain (bpy type: GeometryNodeFieldOnDomain — the UI name
# was updated to "Evaluate on Domain" in 4.3 but the type identifier is
# unchanged for back-compat) re-evaluates a field that naturally lives on
# one domain inside the evaluation context of another.  Here the face-domain
# colour ramp result is re-evaluated at POINT domain so it can be stored as
# a per-vertex attribute for downstream interop with Three.js or VRM.
#
# Outside sources:
#   Blender Manual — Attribute Statistic Node
#   https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/attribute/attribute_statistic.html
#   Licence: CC-BY-SA 4.0, Blender Documentation Team
#
#   Blender Manual — Evaluate on Domain Node
#   https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/attribute/evaluate_on_domain.html
#   Licence: CC-BY-SA 4.0, Blender Documentation Team
#
#   KhronosGroup/glTF-Blender-IO
#   https://github.com/KhronosGroup/glTF-Blender-IO
#   Licence: Apache-2.0, Khronos Group

import bpy
import math

# ── Parameters ──────────────────────────────────────────────────────────
BLEND_NAME       = "area_heat_map"
OBJ_NAME         = "area_terrain"
MAT_NAME         = "area_heat_mat"
GNM_NAME         = "AreaHeatMap"

GRID_X           = 14          # vertices along X (13 quads per row)
GRID_Y           = 14          # vertices along Y
GRID_SIZE        = 2.0         # world-space extent (metres)

NOISE_SCALE      = 3.2         # texture cycles across the grid
NOISE_DETAIL     = 4.0         # octave count
NOISE_ROUGHNESS  = 0.65        # persistence between octaves
NOISE_STRENGTH   = 0.28        # default Z-displacement amplitude

FACE_HEAT_ATTR   = "face_heat"    # FLOAT_COLOR, FACE domain — hard cell edges
VERTEX_HEAT_ATTR = "vertex_heat"  # FLOAT_COLOR, POINT domain — corner-sampled

COOL_COLOUR = (0.02, 0.08, 0.55, 1.0)   # deep blue  (small / flat faces)
WARM_COLOUR = (0.95, 0.30, 0.06, 1.0)   # orange-red (large / steep faces)

OUT_BLEND = ("public/library/blends/geometry-nodes/"
             "gn-attribute-statistic-evaluate-on-domain/area_heat_map.blend")
OUT_GLB   = ("public/library/glbs/geometry-nodes/"
             "gn-attribute-statistic-evaluate-on-domain/area_heat_map.glb")


# ── Geometry Nodes tree ──────────────────────────────────────────────────
def _build_gn_tree() -> bpy.types.GeometryNodeTree:
    ng    = bpy.data.node_groups.new(GNM_NAME, "GeometryNodeTree")
    nodes = ng.nodes
    links = ng.links

    ng.interface.new_socket("Geometry",       in_out="INPUT",
                            socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry",       in_out="OUTPUT",
                            socket_type="NodeSocketGeometry")
    s_strength = ng.interface.new_socket("Noise_Strength", in_out="INPUT",
                                         socket_type="NodeSocketFloat")
    s_strength.default_value = NOISE_STRENGTH
    s_strength.min_value     = 0.0
    s_strength.max_value     = 1.0

    n_in  = nodes.new("NodeGroupInput")
    n_out = nodes.new("NodeGroupOutput")

    # ── Noise displacement (creates unequal face areas) ──────────────────
    # TexNoise evaluates at each vertex's position via the Vector link.
    # Pure Z offset — XY layout is preserved so the grid reads cleanly.
    n_pos   = nodes.new("GeometryNodeInputPosition")
    n_noise = nodes.new("ShaderNodeTexNoise")
    n_noise.inputs["Scale"].default_value     = NOISE_SCALE
    n_noise.inputs["Detail"].default_value    = NOISE_DETAIL
    n_noise.inputs["Roughness"].default_value = NOISE_ROUGHNESS

    n_scale  = nodes.new("ShaderNodeMath")
    n_scale.operation = "MULTIPLY"

    n_combine = nodes.new("ShaderNodeCombineXYZ")
    # X=0, Y=0 (default 0.0), Z=scaled noise → vertical offset only

    n_setpos = nodes.new("GeometryNodeSetPosition")
    # inputs[3] = Offset (additive); inputs[2] = Position stays disconnected

    # ── Face Area and global statistics ─────────────────────────────────
    # InputFaceArea is a FACE-domain field.  At any other domain it evaluates
    # to 0 unless wrapped by Evaluate on Domain — keep that in mind when
    # reusing this pattern for per-edge or per-vertex pipelines.
    n_area = nodes.new("GeometryNodeInputFaceArea")

    # AttributeStatistic: inputs[0]=Geometry (evaluation context),
    # inputs[1]=Selection (open → True for all), inputs[2]=Attribute (field).
    # domain='FACE' tells it to sample once per face, not per vertex.
    # The outputs (Min, Max, Mean, …) are global SINGLEs — scalar constants
    # uniform across the entire geometry, not fields.
    n_stat = nodes.new("GeometryNodeAttributeStatistic")
    n_stat.data_type = "FLOAT"
    n_stat.domain    = "FACE"

    # ── Normalise to [0, 1] using global Min / Max ────────────────────────
    # MapRange(FaceArea, from_min=Stat.Min, from_max=Stat.Max) → 0..1.
    # The Min/Max wires carry global scalars, not fields — so every face's
    # area is measured against the same bounds.  Hard-coding bounds would
    # break on any mesh that isn't this exact grid; AttrStat keeps it live.
    n_remap = nodes.new("ShaderNodeMapRange")
    n_remap.data_type           = "FLOAT"
    n_remap.interpolation_type  = "LINEAR"
    n_remap.clamp               = True
    n_remap.inputs[3].default_value = 0.0
    n_remap.inputs[4].default_value = 1.0

    # ── Color Ramp ────────────────────────────────────────────────────────
    n_ramp = nodes.new("ShaderNodeValToRGB")
    n_ramp.color_ramp.elements[0].color    = COOL_COLOUR
    n_ramp.color_ramp.elements[0].position = 0.0
    n_ramp.color_ramp.elements[1].color    = WARM_COLOUR
    n_ramp.color_ramp.elements[1].position = 1.0

    # ── Store face_heat at FACE domain ───────────────────────────────────
    n_store_face = nodes.new("GeometryNodeStoreNamedAttribute")
    n_store_face.data_type = "FLOAT_COLOR"
    n_store_face.domain    = "FACE"
    n_store_face.inputs[2].default_value = FACE_HEAT_ATTR

    # ── Evaluate on Domain ────────────────────────────────────────────────
    # bpy type: GeometryNodeFieldOnDomain (UI: "Evaluate on Domain" since 4.3)
    # domain='FACE': the ColorRamp colour field is evaluated at face domain
    # and made available in any downstream context.
    # When the POINT-domain store below consumes it, each vertex samples
    # the colour of its lowest-index adjacent face — hard edges, not smooth.
    # To soften: add GeometryNodeBlurAttribute (1–2 iterations) after.
    n_eval = nodes.new("GeometryNodeFieldOnDomain")
    n_eval.data_type = "FLOAT_COLOR"
    n_eval.domain    = "FACE"

    # ── Store vertex_heat at POINT domain ────────────────────────────────
    n_store_vert = nodes.new("GeometryNodeStoreNamedAttribute")
    n_store_vert.data_type = "FLOAT_COLOR"
    n_store_vert.domain    = "POINT"
    n_store_vert.inputs[2].default_value = VERTEX_HEAT_ATTR

    # ── Links ──────────────────────────────────────────────────────────
    links.new(n_pos.outputs[0],            n_noise.inputs["Vector"])
    links.new(n_noise.outputs["Fac"],      n_scale.inputs[0])
    links.new(n_in.outputs[1],             n_scale.inputs[1])   # Noise_Strength
    links.new(n_scale.outputs[0],          n_combine.inputs[2]) # Z offset
    links.new(n_in.outputs[0],             n_setpos.inputs[0])
    links.new(n_combine.outputs[0],        n_setpos.inputs[3])

    # AttrStat reads displaced geometry so world-space face areas are measured
    links.new(n_setpos.outputs[0],         n_stat.inputs[0])
    links.new(n_area.outputs[0],           n_stat.inputs[2])

    # Per-face normalisation (FaceArea field + global Min/Max scalars)
    links.new(n_area.outputs[0],           n_remap.inputs[0])
    links.new(n_stat.outputs["Min"],       n_remap.inputs[1])
    links.new(n_stat.outputs["Max"],       n_remap.inputs[2])
    links.new(n_remap.outputs[0],          n_ramp.inputs["Fac"])

    # Geometry stream: displaced → face store → vertex store → output
    links.new(n_setpos.outputs[0],         n_store_face.inputs[0])
    links.new(n_ramp.outputs["Color"],     n_store_face.inputs[3])
    links.new(n_store_face.outputs[0],     n_store_vert.inputs[0])
    links.new(n_ramp.outputs["Color"],     n_eval.inputs[0])
    links.new(n_eval.outputs[0],           n_store_vert.inputs[3])
    links.new(n_store_vert.outputs[0],     n_out.inputs[0])

    return ng


# ── Material ─────────────────────────────────────────────────────────────
def _build_material() -> bpy.types.Material:
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    n_out  = nt.nodes.new("ShaderNodeOutputMaterial")
    n_bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    # Attribute reads face_heat (FACE domain).  The rasteriser interpolates
    # face-constant RGBA across each face's interior → hard colour seam at
    # every face boundary — this is the characteristic faceted heat-map look.
    n_attr = nt.nodes.new("ShaderNodeAttribute")
    n_attr.attribute_type = "GEOMETRY"
    n_attr.attribute_name = FACE_HEAT_ATTR

    n_bsdf.inputs["Roughness"].default_value = 0.45
    n_bsdf.inputs["Metallic"].default_value  = 0.20

    nt.links.new(n_attr.outputs["Color"], n_bsdf.inputs["Base Color"])
    nt.links.new(n_bsdf.outputs[0],       n_out.inputs["Surface"])
    return mat


# ── Main ──────────────────────────────────────────────────────────────────
def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)

    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=GRID_X - 1,
        y_subdivisions=GRID_Y - 1,
        size=GRID_SIZE,
    )
    obj      = bpy.context.active_object
    obj.name = OBJ_NAME

    ng  = _build_gn_tree()
    mat = _build_material()
    obj.data.materials.append(mat)

    mod            = obj.modifiers.new(GNM_NAME, "NODES")
    mod.node_group = ng

    bpy.ops.object.camera_add(location=(2.8, -2.8, 3.0))
    cam = bpy.context.active_object
    cam.rotation_euler    = (math.radians(50), 0, math.radians(45))
    bpy.context.scene.camera = cam

    bpy.ops.object.light_add(type="AREA", location=(2, -1, 3.5))
    bpy.context.active_object.data.energy = 500

    bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)

    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=GNM_NAME)
    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB,
        export_format="GLB",
        export_apply=True,
        export_attributes=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
    )
    print(f"[area-heat-map] Saved:    {OUT_BLEND}")
    print(f"[area-heat-map] Exported: {OUT_GLB}")


if __name__ == "__main__":
    main()

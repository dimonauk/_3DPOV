# blends/geometry-nodes/gn-blur-attribute-heat-diffusion/blueprint.py
# Blender 5.1 | CC0
#
# GN Blur Attribute — Heat Diffusion Dome
#
# Blur Attribute performs TOPOLOGICAL diffusion: each iteration replaces
# every element's value with a weighted average of its edge-adjacent
# neighbours.  On a regular UV sphere this approximates geodesic distance,
# but on irregular meshes (post-dissolve, Dual Mesh, Voronoi) Euclidean
# distance and hop-count diverge sharply.  When you need true 3-D falloff,
# use Geometry Proximity instead — this node's power is that it follows
# surface connectivity, not spatial nearness.
#
# Outside sources:
#   Blender Manual — Blur Attribute node
#   https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/attribute/blur_attribute.html
#   Licence: CC-BY-SA 4.0, Blender Documentation Team
#
#   njanakiev/blender-scripting — bpy scripting examples
#   https://github.com/njanakiev/blender-scripting
#   Licence: MIT, Nicolas Janakiev
#
#   KhronosGroup/glTF-Blender-IO
#   https://github.com/KhronosGroup/glTF-Blender-IO
#   Licence: Apache-2.0, Khronos Group

import bpy
import math

# ── Parameters ──────────────────────────────────────────────────────────
BLEND_NAME        = "heat_diffusion_dome"
OBJ_NAME          = "heat_dome"
MAT_NAME          = "heat_diffusion_mat"
GNM_NAME          = "HeatDiffusion"

RINGS             = 32        # UV sphere rings (latitude resolution)
SEGMENTS          = 64        # UV sphere segments (longitude resolution)
RADIUS            = 1.0

# Z > POLE_Z_THRESHOLD seeds heat=1.0 — cosine of the cap half-angle.
# 0.92 ≈ cos(23°): seeds roughly the top quarter-cap.
POLE_Z_THRESHOLD  = 0.92
EQUATOR_WIDTH     = 0.15      # |Z| < this → equatorial insulation band

HEAT_ATTR         = "heat"          # materialised binary seed (0.0 / 1.0)
HEAT_BLUR_ATTR    = "heat_blurred"  # diffused float after N iterations

LIFT_MAX          = 0.18      # peak normal displacement at the pole
ITER_DEFAULT      = 12        # Iterations group socket default
RESIST_DEFAULT    = 0.3       # equatorial band conductivity (0=insulator, 1=conductor)

COLD_COLOUR       = (0.01, 0.07, 0.55, 1.0)   # deep indigo
HOT_COLOUR        = (1.00, 0.27, 0.00, 1.0)   # red-orange glow

OUT_BLEND = ("public/library/blends/geometry-nodes/"
             "gn-blur-attribute-heat-diffusion/heat_diffusion_dome.blend")
OUT_GLB   = ("public/library/glbs/geometry-nodes/"
             "gn-blur-attribute-heat-diffusion/heat_diffusion_dome.glb")


# ── Geometry Nodes tree ──────────────────────────────────────────────────
def _build_gn_tree() -> bpy.types.GeometryNodeTree:
    ng = bpy.data.node_groups.new(GNM_NAME, "GeometryNodeTree")
    nodes = ng.nodes
    links = ng.links

    # Group interface (Blender 4.0+ ng.interface API)
    ng.interface.new_socket("Geometry", in_out="INPUT",
                            socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry", in_out="OUTPUT",
                            socket_type="NodeSocketGeometry")
    s_iter = ng.interface.new_socket("Iterations", in_out="INPUT",
                                     socket_type="NodeSocketInt")
    s_iter.default_value = ITER_DEFAULT
    s_iter.min_value = 1
    s_iter.max_value = 64
    s_res = ng.interface.new_socket("Equator_Resistance", in_out="INPUT",
                                    socket_type="NodeSocketFloat")
    s_res.default_value = RESIST_DEFAULT
    s_res.min_value = 0.0
    s_res.max_value = 1.0

    n_in  = nodes.new("NodeGroupInput")
    n_out = nodes.new("NodeGroupOutput")

    # ── Seed: pole cap → heat = 0.0 / 1.0 ──────────────────────────────
    n_pos  = nodes.new("GeometryNodeInputPosition")
    n_sep  = nodes.new("ShaderNodeSeparateXYZ")
    # Compare Z > POLE_Z_THRESHOLD to select the north-pole cap
    n_cmp_pole = nodes.new("FunctionNodeCompare")
    n_cmp_pole.data_type = "FLOAT"
    n_cmp_pole.operation = "GREATER_THAN"
    n_cmp_pole.inputs[1].default_value = POLE_Z_THRESHOLD

    # Store seed attribute — BOOLEAN auto-casts to FLOAT 0.0/1.0
    n_store_seed = nodes.new("GeometryNodeStoreNamedAttribute")
    n_store_seed.data_type = "FLOAT"
    n_store_seed.domain = "POINT"
    n_store_seed.inputs[2].default_value = HEAT_ATTR

    # ── Weight map: equatorial insulation band ───────────────────────────
    # |Z| < EQUATOR_WIDTH → conductivity = GroupInput.Equator_Resistance
    # |Z| ≥ EQUATOR_WIDTH → conductivity = 1.0 (normal)
    n_abs  = nodes.new("ShaderNodeMath")
    n_abs.operation = "ABSOLUTE"
    n_cmp_eq = nodes.new("FunctionNodeCompare")
    n_cmp_eq.data_type = "FLOAT"
    n_cmp_eq.operation = "LESS_THAN"
    n_cmp_eq.inputs[1].default_value = EQUATOR_WIDTH

    # Switch: False-branch = 1.0, True-branch = Resistance (lower)
    n_sw = nodes.new("GeometryNodeSwitch")
    n_sw.input_type = "FLOAT"
    n_sw.inputs[1].default_value = 1.0   # normal conductivity

    # ── Blur Attribute ──────────────────────────────────────────────────
    # NamedAttribute reads the materialised seed stored above.
    # Without this read-back, Blur would re-evaluate the raw field on
    # every iteration and never propagate beyond the seed boundary.
    n_named = nodes.new("GeometryNodeInputNamedAttribute")
    n_named.data_type = "FLOAT"
    n_named.inputs[0].default_value = HEAT_ATTR

    n_blur = nodes.new("GeometryNodeBlurAttribute")
    n_blur.data_type = "FLOAT"
    # inputs[0]=Value(FLOAT), inputs[1]=Iterations(INT), inputs[2]=Weight(FLOAT)

    # Store blurred attribute so the material Attribute node can read it
    n_store_blur = nodes.new("GeometryNodeStoreNamedAttribute")
    n_store_blur.data_type = "FLOAT"
    n_store_blur.domain = "POINT"
    n_store_blur.inputs[2].default_value = HEAT_BLUR_ATTR

    # ── Displacement ─────────────────────────────────────────────────────
    n_named_b = nodes.new("GeometryNodeInputNamedAttribute")
    n_named_b.data_type = "FLOAT"
    n_named_b.inputs[0].default_value = HEAT_BLUR_ATTR

    n_remap = nodes.new("ShaderNodeMapRange")
    n_remap.data_type = "FLOAT"
    n_remap.inputs[1].default_value = 0.0
    n_remap.inputs[2].default_value = 1.0
    n_remap.inputs[3].default_value = 0.0
    n_remap.inputs[4].default_value = LIFT_MAX

    n_normal = nodes.new("GeometryNodeInputNormal")
    n_vscale = nodes.new("ShaderNodeVectorMath")
    n_vscale.operation = "SCALE"   # inputs[0]=Vector, inputs[3]=Scale

    n_setpos = nodes.new("GeometryNodeSetPosition")
    # inputs[3]=Offset (additive) preserves original XY layout

    # ── Links ─────────────────────────────────────────────────────────
    # Geometry chain
    links.new(n_in.outputs[0],          n_store_seed.inputs[0])
    links.new(n_store_seed.outputs[0],  n_store_blur.inputs[0])
    links.new(n_store_blur.outputs[0],  n_setpos.inputs[0])
    links.new(n_setpos.outputs[0],      n_out.inputs[0])

    # Seed field
    links.new(n_pos.outputs[0],         n_sep.inputs[0])
    links.new(n_sep.outputs[2],         n_cmp_pole.inputs[0])
    links.new(n_cmp_pole.outputs[0],    n_store_seed.inputs[3])

    # Weight map (equatorial insulation)
    links.new(n_sep.outputs[2],         n_abs.inputs[0])
    links.new(n_abs.outputs[0],         n_cmp_eq.inputs[0])
    links.new(n_cmp_eq.outputs[0],      n_sw.inputs[0])
    links.new(n_in.outputs[2],          n_sw.inputs[2])  # Resistance → True branch
    links.new(n_sw.outputs[0],          n_blur.inputs[2])  # Weight

    # Blur
    links.new(n_named.outputs[0],       n_blur.inputs[0])
    links.new(n_in.outputs[1],          n_blur.inputs[1])  # Iterations
    links.new(n_blur.outputs[0],        n_store_blur.inputs[3])

    # Displacement
    links.new(n_named_b.outputs[0],     n_remap.inputs[0])
    links.new(n_normal.outputs[0],      n_vscale.inputs[0])
    links.new(n_remap.outputs[0],       n_vscale.inputs[3])
    links.new(n_vscale.outputs[0],      n_setpos.inputs[3])

    return ng


# ── Material ─────────────────────────────────────────────────────────────
def _build_material() -> bpy.types.Material:
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    n_out  = nt.nodes.new("ShaderNodeOutputMaterial")
    n_bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    n_emit = nt.nodes.new("ShaderNodeEmission")
    n_add  = nt.nodes.new("ShaderNodeAddShader")
    n_attr = nt.nodes.new("ShaderNodeAttribute")
    n_attr.attribute_type = "GEOMETRY"
    n_attr.attribute_name = HEAT_BLUR_ATTR  # reads the GN-stored float

    n_ramp = nt.nodes.new("ShaderNodeValToRGB")
    n_ramp.color_ramp.elements[0].color = COLD_COLOUR
    n_ramp.color_ramp.elements[1].color = HOT_COLOUR

    n_bsdf.inputs["Roughness"].default_value = 0.6
    n_bsdf.inputs["Metallic"].default_value = 0.1
    # Emission colour at the hot (pole) end — hot glow
    n_emit.inputs["Color"].default_value = HOT_COLOUR
    n_emit.inputs["Strength"].default_value = 0.4

    links = nt.links
    links.new(n_attr.outputs["Fac"],    n_ramp.inputs["Fac"])
    links.new(n_ramp.outputs["Color"],  n_bsdf.inputs["Base Color"])
    # Emission contribution gated by the same heat gradient (Fac as mix weight)
    links.new(n_attr.outputs["Fac"],    n_emit.inputs["Strength"])
    links.new(n_bsdf.outputs[0],        n_add.inputs[0])
    links.new(n_emit.outputs[0],        n_add.inputs[1])
    links.new(n_add.outputs[0],         n_out.inputs["Surface"])

    return mat


# ── Main ─────────────────────────────────────────────────────────────────
def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # UV sphere — regular topology is the canonical Blur Attribute testbed
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=SEGMENTS, ring_count=RINGS, radius=RADIUS)
    obj = bpy.context.active_object
    obj.name = OBJ_NAME

    ng  = _build_gn_tree()
    mat = _build_material()
    obj.data.materials.append(mat)

    mod = obj.modifiers.new(GNM_NAME, "NODES")
    mod.node_group = ng

    # Camera + area light for viewport preview
    bpy.ops.object.camera_add(location=(0, -3.2, 1.2))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(69), 0, 0)
    bpy.context.scene.camera = cam

    bpy.ops.object.light_add(type="AREA", location=(2, -2, 3))
    light = bpy.context.active_object
    light.data.energy = 600

    bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)

    # Apply modifier for GLB — runtimes do not evaluate GN
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=GNM_NAME)
    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB,
        export_format="GLB",
        export_apply=True,
        export_attributes=True,  # write heat_blurred as custom vertex attr
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
    )
    print(f"[heat-diffusion] Saved: {OUT_BLEND}")
    print(f"[heat-diffusion] Exported: {OUT_GLB}")


if __name__ == "__main__":
    main()

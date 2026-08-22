# blends/geometry-nodes/gn-fillet-curve-neon-sign/blueprint.py
# Blender 5.1 | CC0
#
# GN Fillet Curve — Procedural Rounded-Corner Neon Star Sign
#
# Fillet Curve inserts a circular arc at every kink of a spline.
# BEZIER mode creates proper smooth bezier handles — the downstream
# Resample Curve is then essential because FilletCurve operates on
# evaluated segments, not on the resampled points you'll tube.
# POLY mode simply subdivides around the kink and is faster but
# produces faceted arcs.  This blueprint uses BEZIER mode throughout
# because the neon-tube visual depends on continuous silhouette curves.
#
# Outside sources:
#   Blender Manual — Fillet Curve node
#   https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/operations/fillet_curve.html
#   Licence: CC-BY-SA 4.0, Blender Documentation Team
#
#   njanakiev/blender-scripting — bpy workflow reference
#   https://github.com/njanakiev/blender-scripting
#   Licence: MIT, Nicolas Janakiev
#
#   KhronosGroup/glTF-Blender-IO
#   https://github.com/KhronosGroup/glTF-Blender-IO
#   Licence: Apache-2.0, Khronos Group

import bpy
import math

# ── Parameters ─────────────────────────────────────────────────────────
BLEND_NAME      = "neon_sign"
OBJ_NAME        = "neon_sign_star"
MAT_NAME        = "neon_emissive_mat"
GNM_NAME        = "FilletCurveNeonSign"

STAR_POINTS     = 6          # hexagonal star — 12 corners total
OUTER_RADIUS    = 1.0        # outer spike tip radius
INNER_RADIUS    = 0.42       # inner valley radius; 0.42 gives compact spikes

FILLET_RADIUS   = 0.22       # corner arc radius (world units)
FILLET_COUNT    = 4          # bezier segments per arc; 4 = smooth enough for tube
RESAMPLE_COUNT  = 160        # total evaluated points around the full loop

TUBE_SEGS       = 8          # circle cross-section resolution (octagonal tube)
TUBE_RADIUS     = 0.028      # neon tube cross-section radius

# Neon hot-pink material
EMIT_COLOR      = (0.992, 0.031, 0.502, 1.0)
EMIT_STRENGTH   = 8.0        # drives the halo in EEVEE Bloom

# Group socket defaults match the constants above; expose them so the
# modifier panel gives live sliders without re-running the script.
SOCK_FILLET_RADIUS   = FILLET_RADIUS
SOCK_RESAMPLE_COUNT  = RESAMPLE_COUNT
SOCK_TUBE_RADIUS     = TUBE_RADIUS
SOCK_EMIT_STRENGTH   = EMIT_STRENGTH


# ── Material ────────────────────────────────────────────────────────────
def _make_material() -> bpy.types.Material:
    """Emissive neon-pink: Principled BSDF + Emission blended via Mix Shader."""
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    mat.blend_method = "OPAQUE"

    nt = mat.node_tree
    nt.nodes.clear()

    out    = nt.nodes.new("ShaderNodeOutputMaterial")
    mix    = nt.nodes.new("ShaderNodeMixShader")
    bsdf   = nt.nodes.new("ShaderNodeBsdfPrincipled")
    emit   = nt.nodes.new("ShaderNodeEmission")
    attr   = nt.nodes.new("ShaderNodeAttribute")

    attr.attribute_name = "emit_strength"
    attr.attribute_type = "GEOMETRY"

    bsdf.inputs["Base Color"].default_value  = EMIT_COLOR
    bsdf.inputs["Roughness"].default_value   = 0.35
    bsdf.inputs["Metallic"].default_value    = 0.0
    emit.inputs["Color"].default_value       = EMIT_COLOR
    emit.inputs["Strength"].default_value    = EMIT_STRENGTH
    mix.inputs["Fac"].default_value          = 0.6

    nt.links.new(bsdf.outputs["BSDF"],  mix.inputs[1])
    nt.links.new(emit.outputs["Emission"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])

    return mat


# ── GN tree ─────────────────────────────────────────────────────────────
def _build_gn_tree(mat: bpy.types.Material) -> bpy.types.GeometryNodeTree:
    ng: bpy.types.GeometryNodeTree = bpy.data.node_groups.new(
        GNM_NAME, "GeometryNodeTree"
    )

    # ── Group interface sockets ──────────────────────────────────────────
    ng.interface.new_socket("Geometry", in_out="OUTPUT",
                            socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry", in_out="INPUT",
                            socket_type="NodeSocketGeometry")

    fr_sock = ng.interface.new_socket("Fillet_Radius", in_out="INPUT",
                                      socket_type="NodeSocketFloat")
    fr_sock.default_value = SOCK_FILLET_RADIUS
    fr_sock.min_value = 0.001
    fr_sock.max_value = 1.0

    rc_sock = ng.interface.new_socket("Resample_Count", in_out="INPUT",
                                      socket_type="NodeSocketInt")
    rc_sock.default_value = SOCK_RESAMPLE_COUNT
    rc_sock.min_value = 32
    rc_sock.max_value = 512

    tr_sock = ng.interface.new_socket("Tube_Radius", in_out="INPUT",
                                      socket_type="NodeSocketFloat")
    tr_sock.default_value = SOCK_TUBE_RADIUS
    tr_sock.min_value = 0.005
    tr_sock.max_value = 0.15

    # ── Nodes ────────────────────────────────────────────────────────────
    g_in  = ng.nodes.new("NodeGroupInput")
    g_out = ng.nodes.new("NodeGroupOutput")

    # 1. Star primitive — hexagonal, 12 corners
    star = ng.nodes.new("GeometryNodeCurvePrimitiveStar")
    star.inputs["Points"].default_value       = STAR_POINTS
    star.inputs["Outer Radius"].default_value = OUTER_RADIUS
    star.inputs["Inner Radius"].default_value = INNER_RADIUS
    star.inputs["Twist"].default_value        = 0.0

    # 2. Fillet Curve — BEZIER mode so arcs have smooth bezier handles
    fillet = ng.nodes.new("GeometryNodeFilletCurve")
    fillet.mode = "BEZIER"
    fillet.inputs["Count"].default_value   = FILLET_COUNT
    # Clamped=True prevents arcs from overlapping when radius is large
    fillet.inputs["Clamped"].default_value = True

    # 3. Resample — REQUIRED after BEZIER mode to convert handles → points
    resample = ng.nodes.new("GeometryNodeResampleCurve")
    resample.mode = "COUNT"

    # 4. Profile circle — the neon tube cross-section
    profile = ng.nodes.new("GeometryNodeCurvePrimitiveCircle")
    profile.inputs["Resolution"].default_value = TUBE_SEGS

    # 5. Curve to Mesh — sweeps the profile along the resampled star
    ctm = ng.nodes.new("GeometryNodeCurveToMesh")
    ctm.inputs["Fill Caps"].default_value = True

    # 6. Smooth shading on the resulting tube mesh
    shade_smooth = ng.nodes.new("GeometryNodeSetShadeSmooth")
    shade_smooth.domain = "FACE"
    shade_smooth.inputs["Shade Smooth"].default_value = True

    # 7. Assign the emissive material
    set_mat = ng.nodes.new("GeometryNodeSetMaterial")
    set_mat.inputs["Material"].default_value = mat

    # ── Links ────────────────────────────────────────────────────────────
    lk = ng.links.new

    # Star → Fillet
    lk(star.outputs["Curve"],        fillet.inputs["Curve"])
    lk(g_in.outputs["Fillet_Radius"], fillet.inputs["Radius"])

    # Fillet → Resample
    lk(fillet.outputs["Curve"],       resample.inputs["Curve"])
    lk(g_in.outputs["Resample_Count"], resample.inputs["Count"])

    # Resample + Profile → CurveToMesh
    lk(resample.outputs["Curve"],    ctm.inputs["Curve"])
    lk(profile.outputs["Curve"],     ctm.inputs["Profile Curve"])
    # Tube_Radius drives the profile circle's Radius socket
    lk(g_in.outputs["Tube_Radius"],  profile.inputs["Radius"])

    # CurveToMesh → ShadSmooth → SetMaterial → Output
    lk(ctm.outputs["Mesh"],          shade_smooth.inputs["Geometry"])
    lk(shade_smooth.outputs["Geometry"], set_mat.inputs["Geometry"])
    lk(set_mat.outputs["Geometry"],  g_out.inputs["Geometry"])

    return ng


# ── Main ─────────────────────────────────────────────────────────────────
def main():
    # Wipe default scene
    bpy.ops.wm.read_factory_settings(use_empty=True)

    mat = _make_material()
    ng  = _build_gn_tree(mat)

    # Mesh object to host the modifier (any mesh works — GN replaces it)
    bpy.ops.mesh.primitive_plane_add()
    obj = bpy.context.active_object
    obj.name = OBJ_NAME
    for face in obj.data.polygons:
        face.use_smooth = True

    # Attach modifier
    mod = obj.modifiers.new(GNM_NAME, "NODES")
    mod.node_group = ng

    # World setup: black background for the neon glow
    bpy.data.worlds["World"].node_tree.nodes[
        "Background"
    ].inputs["Color"].default_value = (0.005, 0.005, 0.005, 1.0)

    # EEVEE: enable Bloom for the neon glow halo
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    if hasattr(scene, "eevee"):
        scene.eevee.use_bloom = True
        scene.eevee.bloom_intensity = 0.15
        scene.eevee.bloom_radius    = 6.0

    # Orthographic camera framing the sign
    bpy.ops.object.camera_add(location=(0, -4.5, 0))
    cam_obj = bpy.context.active_object
    cam_obj.rotation_euler = (math.radians(90), 0, 0)
    cam_obj.data.type = "ORTHO"
    cam_obj.data.ortho_scale = 2.8
    scene.camera = cam_obj

    # Save
    bpy.ops.wm.save_as_mainfile(
        filepath="public/library/blends/geometry-nodes/"
                 "gn-fillet-curve-neon-sign/neon_sign.blend"
    )
    print("✓ neon_sign.blend written")

    # GLB export — apply modifier so the tube mesh is real geometry
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath="public/library/blends/geometry-nodes/"
                 "gn-fillet-curve-neon-sign/neon_sign.glb",
        export_format="GLB",
        export_apply=True,
        export_attributes=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
    )
    print("✓ neon_sign.glb written")


if __name__ == "__main__":
    main()

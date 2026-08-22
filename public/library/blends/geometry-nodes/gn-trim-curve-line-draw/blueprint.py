# blends/geometry-nodes/gn-trim-curve-line-draw/blueprint.py
# Blender 5.1 | CC0
#
# GN Trim Curve — Animated Line-Draw Reveal on a Spiral Path
#
# TrimCurve in FACTOR mode parameterises the curve on [0, 1] independently
# of arc length.  This makes it the correct choice for "draw-on" animations:
# keyframing End from 0.0 → 1.0 reveals any path without knowing its world-space
# length.  LENGTH mode would require recalculation every time topology or scale
# changes.  The Archimedean spiral is the ideal test because partial trims show
# a legible radial growth — tight inner coils expanding outward — whereas
# trimming a circle produces an ambiguous arc until near-complete.
#
# Outside sources:
#   Blender Manual — Trim Curve node
#   https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/operations/trim_curve.html
#   Licence: CC-BY-SA 4.0, Blender Documentation Team
#
#   njanakiev/blender-scripting — bpy keyframing + animation patterns
#   https://github.com/njanakiev/blender-scripting
#   Licence: MIT, Nicolas Janakiev
#
#   KhronosGroup/glTF-Blender-IO
#   https://github.com/KhronosGroup/glTF-Blender-IO
#   Licence: Apache-2.0, Khronos Group

import bpy

# ── Parameters ────────────────────────────────────────────────────────────
BLEND_NAME    = "spiral_trace"
OBJ_NAME      = "spiral_trace_line"
MAT_NAME      = "golden_trace_mat"
GNM_NAME      = "TrimCurveLineDraw"

SPIRAL_RES    = 200   # polyline points; more = smoother tube silhouette
SPIRAL_TURNS  = 8     # full rotations; drives the Rotations input socket
END_RADIUS    = 2.0   # outermost tip (world units)

LINE_RADIUS   = 0.025  # tube cross-section radius
TUBE_SEGS     = 8      # octagonal — studio standard for thin tubes

# PCB-trace gold — warm yellow, high metallic, low roughness
GOLD_COLOR  = (0.95, 0.65, 0.1, 1.0)
EMIT_COLOR  = (1.0, 0.75, 0.1, 1.0)
EMIT_STR    = 3.0   # triggers EEVEE Bloom halo at Bloom Intensity ≥ 0.1

ANIM_FRAMES = 60    # Draw_End animates from 0 (frame 1) to 1 (frame 60)
FPS         = 24


# ── Material ──────────────────────────────────────────────────────────────
def _make_material() -> bpy.types.Material:
    """
    Principled BSDF only.  Blender 4.0 unified 'Emission Color' + 'Emission
    Strength' directly onto the BSDF — no Mix Shader needed for a glow effect.
    """
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    mat.blend_method = "OPAQUE"

    nt = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")

    bsdf.inputs["Base Color"].default_value       = GOLD_COLOR
    bsdf.inputs["Metallic"].default_value         = 0.95
    bsdf.inputs["Roughness"].default_value        = 0.1
    bsdf.inputs["Emission Color"].default_value   = EMIT_COLOR
    bsdf.inputs["Emission Strength"].default_value = EMIT_STR

    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


# ── GN tree ───────────────────────────────────────────────────────────────
def _build_gn_tree(
    mat: bpy.types.Material,
) -> tuple[bpy.types.GeometryNodeTree, str]:
    """
    Returns (node_tree, draw_end_identifier).
    draw_end_identifier is the socket's .identifier property — required
    for keyframing via mod[identifier] in Blender 4.x/5.x.
    """
    ng: bpy.types.GeometryNodeTree = bpy.data.node_groups.new(
        GNM_NAME, "GeometryNodeTree"
    )

    # ── Interface sockets ─────────────────────────────────────────────────
    ng.interface.new_socket("Geometry", in_out="OUTPUT",
                            socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry", in_out="INPUT",
                            socket_type="NodeSocketGeometry")

    st = ng.interface.new_socket("Spiral_Turns", in_out="INPUT",
                                  socket_type="NodeSocketInt")
    st.default_value = SPIRAL_TURNS
    st.min_value     = 1
    st.max_value     = 20

    de = ng.interface.new_socket("Draw_End", in_out="INPUT",
                                  socket_type="NodeSocketFloat")
    de.default_value = 1.0
    de.min_value     = 0.0
    de.max_value     = 1.0
    draw_end_id = de.identifier   # capture now; stable for lifetime of ng

    lr = ng.interface.new_socket("Line_Radius", in_out="INPUT",
                                  socket_type="NodeSocketFloat")
    lr.default_value = LINE_RADIUS
    lr.min_value     = 0.005
    lr.max_value     = 0.1

    # ── Nodes ─────────────────────────────────────────────────────────────
    g_in  = ng.nodes.new("NodeGroupInput")
    g_out = ng.nodes.new("NodeGroupOutput")

    # 1. Archimedean spiral — flat (Height=0), starts at origin, expands outward
    spiral = ng.nodes.new("GeometryNodeCurvePrimitiveSpiral")
    spiral.inputs["Resolution"].default_value   = SPIRAL_RES
    spiral.inputs["Start Radius"].default_value = 0.0
    spiral.inputs["End Radius"].default_value   = END_RADIUS
    spiral.inputs["Height"].default_value       = 0.0
    spiral.inputs["Reverse"].default_value      = False

    # 2. Trim Curve in FACTOR mode
    #    Start stays at 0.0 (always draw from the centre of the spiral).
    #    End is driven by the animated group socket Draw_End.
    trim = ng.nodes.new("GeometryNodeTrimCurve")
    trim.mode = "FACTOR"
    trim.inputs["Start"].default_value = 0.0

    # 3. Octagonal profile circle — swept along the trimmed arc
    profile = ng.nodes.new("GeometryNodeCurvePrimitiveCircle")
    profile.inputs["Resolution"].default_value = TUBE_SEGS

    # 4. Sweep the profile
    ctm = ng.nodes.new("GeometryNodeCurveToMesh")
    ctm.inputs["Fill Caps"].default_value = True

    # 5. Smooth shading so tube reads as cylindrical, not faceted
    shade = ng.nodes.new("GeometryNodeSetShadeSmooth")
    shade.domain = "FACE"
    shade.inputs["Shade Smooth"].default_value = True

    # 6. Material
    set_mat = ng.nodes.new("GeometryNodeSetMaterial")
    set_mat.inputs["Material"].default_value = mat

    # ── Links ─────────────────────────────────────────────────────────────
    lk = ng.links.new

    lk(g_in.outputs["Spiral_Turns"], spiral.inputs["Rotations"])
    lk(spiral.outputs["Curve"],      trim.inputs["Curve"])
    lk(g_in.outputs["Draw_End"],     trim.inputs["End"])
    lk(g_in.outputs["Line_Radius"],  profile.inputs["Radius"])
    lk(trim.outputs["Curve"],        ctm.inputs["Curve"])
    lk(profile.outputs["Curve"],     ctm.inputs["Profile Curve"])
    lk(ctm.outputs["Mesh"],          shade.inputs["Geometry"])
    lk(shade.outputs["Geometry"],    set_mat.inputs["Geometry"])
    lk(set_mat.outputs["Geometry"],  g_out.inputs["Geometry"])

    return ng, draw_end_id


# ── Main ──────────────────────────────────────────────────────────────────
def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)

    mat = _make_material()
    ng, draw_end_id = _build_gn_tree(mat)

    bpy.ops.mesh.primitive_plane_add()
    obj = bpy.context.active_object
    obj.name = OBJ_NAME

    mod = obj.modifiers.new(GNM_NAME, "NODES")
    mod.node_group = ng

    # ── Keyframe Draw_End 0 → 1 ───────────────────────────────────────────
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = ANIM_FRAMES
    scene.render.fps  = FPS

    mod[draw_end_id] = 0.0
    mod.keyframe_insert(data_path=f'["{draw_end_id}"]', frame=1)
    mod[draw_end_id] = 1.0
    mod.keyframe_insert(data_path=f'["{draw_end_id}"]', frame=ANIM_FRAMES)

    # EASE_IN: slow start, accelerating finish — reads as a natural pen stroke
    # rather than a mechanical linear wipe.
    if obj.animation_data and obj.animation_data.action:
        for fc in obj.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "EASE_IN"

    # ── World ─────────────────────────────────────────────────────────────
    bpy.data.worlds["World"].node_tree.nodes[
        "Background"
    ].inputs["Color"].default_value = (0.01, 0.01, 0.02, 1.0)

    # ── Camera — top-down ortho framing the spiral ─────────────────────────
    bpy.ops.object.camera_add(location=(0, 0, 8))
    cam = bpy.context.active_object
    cam.data.type       = "ORTHO"
    cam.data.ortho_scale = 5.0
    scene.camera        = cam

    # ── EEVEE Next — Bloom for the gold glow ─────────────────────────────
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    if hasattr(scene, "eevee"):
        scene.eevee.use_bloom       = True
        scene.eevee.bloom_intensity = 0.12
        scene.eevee.bloom_radius    = 5.0

    # ── Save ──────────────────────────────────────────────────────────────
    bpy.ops.wm.save_as_mainfile(
        filepath="public/library/blends/geometry-nodes/"
                 "gn-trim-curve-line-draw/spiral_trace.blend"
    )
    print("✓ spiral_trace.blend written")

    # GLB at final frame — full spiral present; animation not embedded by default
    scene.frame_set(ANIM_FRAMES)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath="public/library/blends/geometry-nodes/"
                 "gn-trim-curve-line-draw/spiral_trace.glb",
        export_format="GLB",
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
    )
    print("✓ spiral_trace.glb written")


if __name__ == "__main__":
    main()

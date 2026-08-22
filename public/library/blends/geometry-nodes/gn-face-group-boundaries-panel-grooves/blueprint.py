"""
GN Face Group Boundaries — Procedural Panel Groove Engraving (Blender 5.1)
blueprint.py — run via Text Editor ▸ Run Script, or:
               blender --background --python blueprint.py

WHY FACE GROUP BOUNDARIES
  Hard-surface panel lines require knowing WHERE face clusters change.
  GeometryNodeFaceGroupBoundaries converts a per-face integer (the face set ID)
  into a per-EDGE boolean that is True wherever two adjacent faces belong to
  different sets.  Unlike the Extrude Mesh approach (which creates uniform
  bevels along selected edges), FaceGroupBoundaries treats the SET ASSIGNMENT
  as the source of truth — you can drive it with any integer field: noise,
  material index, proximity, custom attributes.  Here a Noise Texture feeds
  a FunctionNodeFloatToInt to scatter NUM_GROUPS organic panel zones across
  a subdivided cube.  The boundary edges become tube curves (raised weld seams)
  joined on top of the per-zone-coloured panel body.

TECHNIQUE
  1. Subdivide cube → many flat quads (SubdivideMesh, not CatmullClark)
  2. Noise Texture → MapRange → FloatToInt → face_set (INT per face)
  3. face_set → FaceGroupBoundaries → Boundary Edges (BOOL per edge)
  4. SeparateGeometry (EDGE, selection=boundary) → boundary edge mesh
  5. MeshToCurve → SetCurveRadius → CurveToMesh (circle profile) → groove tubes
  6. face_set → MapRange → ColorRamp → panel_col (FLOAT_COLOR per face)
  7. JoinGeometry(panel_body, groove_tubes) → final mesh

OUTSIDE SOURCES
  Face Group Boundaries Node — CC-BY-SA 4.0  Blender Documentation Team
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/face_group_boundaries.html
  blender-scripting — MIT  Nicolas Janakiev
    https://github.com/njanakiev/blender-scripting
  glTF-Blender-IO — Apache-2.0  Khronos Group
    https://github.com/KhronosGroup/glTF-Blender-IO
"""

import bpy
import os

# ── Parameters ────────────────────────────────────────────────────────────────
SUBDIV_LEVEL   = 3      # 6 cube faces × 4^3 = 384 quads; enough panel granularity
NOISE_SCALE    = 0.85   # spatial frequency; lower = fewer, larger panels
NUM_GROUPS     = 12     # number of distinct panel zone IDs (0 … NUM_GROUPS-1)
GROOVE_RADIUS  = 0.020  # tube half-width (world units); visible but not chunky
CIRCLE_VERTS   = 4      # profile polygon vertices; 4 = square cross-section, 8 = round
NOISE_SEED     = 3      # noise offset via W dimension; change to restyle panels

PANEL_METALLIC = 0.80
PANEL_ROUGH    = 0.35
GROOVE_ROUGH   = 0.08   # shiny dark groove simulates a machined channel

ANIM_FRAMES    = 80     # 3.3 s at 24 fps — full 360° for all six faces
EXPORT_FRAME   = 40     # frame for GLB pose (45° yaw showing three faces)

ATTR_FACE_SET  = "face_set"
ATTR_PANEL_COL = "panel_col"

OUTPUT_GLB   = "//panel_grooves.glb"
OUTPUT_BLEND = "//panel_grooves.blend"
# ─────────────────────────────────────────────────────────────────────────────


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for blk in (bpy.data.meshes, bpy.data.materials,
                bpy.data.node_groups, bpy.data.cameras, bpy.data.lights):
        for item in list(blk):
            blk.remove(item)


def build_node_group():
    ng    = bpy.data.node_groups.new('PanelGrooveMaker', 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')

    N = ng.nodes
    L = ng.links

    gin  = N.new('NodeGroupInput');  gin.location  = (-900, 0)
    gout = N.new('NodeGroupOutput'); gout.location = ( 900, 0)

    # 1. Subdivide into flat quads (SubdivideMesh = uniform, not CatmullClark)
    sdiv = N.new('GeometryNodeSubdivideMesh')
    sdiv.inputs['Level'].default_value = SUBDIV_LEVEL
    sdiv.location = (-700, 0)
    L.new(gin.outputs['Geometry'], sdiv.inputs['Mesh'])

    # 2. Position field — evaluates at face centres when consumed at FACE domain
    pos = N.new('GeometryNodeInputPosition'); pos.location = (-700, -200)

    # 3. 3-D Noise Texture sampled at face position
    noi = N.new('ShaderNodeTexNoise')
    noi.noise_dimensions = '4D'          # 4D uses W as a seed offset per call
    noi.inputs['Scale'].default_value     = NOISE_SCALE
    noi.inputs['Detail'].default_value    = 3.0
    noi.inputs['Roughness'].default_value = 0.60
    noi.inputs['Distortion'].default_value = 0.25
    noi.inputs['W'].default_value         = float(NOISE_SEED)
    noi.location = (-500, -200)
    L.new(pos.outputs['Position'], noi.inputs['Vector'])

    # 4. Map Fac [0, 1] → [0, NUM_GROUPS - 0.001] before floor conversion
    mran = N.new('ShaderNodeMapRange')
    mran.data_type = 'FLOAT'; mran.clamp = True
    mran.inputs['From Min'].default_value = 0.0
    mran.inputs['From Max'].default_value = 1.0
    mran.inputs['To Min'].default_value   = 0.0
    mran.inputs['To Max'].default_value   = float(NUM_GROUPS) - 0.001
    mran.location = (-300, -200)
    L.new(noi.outputs['Fac'], mran.inputs['Value'])

    # 5. Floor to integer face set ID (explicit cast, not implicit FLOAT→INT)
    ftoi = N.new('FunctionNodeFloatToInt')
    ftoi.rounding_mode = 'FLOOR'
    ftoi.location = (-100, -200)
    L.new(mran.outputs['Result'], ftoi.inputs['Float'])
    # ftoi.outputs['Integer'] is now INT field in [0, NUM_GROUPS-1] per face

    # 6. Store face_set as INT at FACE domain (consumed by material + debugging)
    sfs = N.new('GeometryNodeStoreNamedAttribute')
    sfs.data_type = 'INT'; sfs.domain = 'FACE'
    sfs.inputs['Name'].default_value = ATTR_FACE_SET
    sfs.inputs[1].default_value = True  # Selection = all
    sfs.location = (100, 0)
    L.new(sdiv.outputs['Mesh'], sfs.inputs[0])
    L.new(ftoi.outputs['Integer'], sfs.inputs[3])  # Value socket (INT)

    # 7. Face Group Boundaries — boundary BOOL per edge where face_set changes
    #    WHY drive from ftoi not from NamedAttribute: avoids a round-trip through
    #    storage; the field is evaluated once at both FACE domain consumers
    #    (StoreNamedAttribute and FaceGroupBoundaries) in the same GN pass.
    fgb = N.new('GeometryNodeFaceGroupBoundaries')
    fgb.location = (100, -280)
    L.new(ftoi.outputs['Integer'], fgb.inputs['Face Set'])

    # 8. Separate boundary edges only (EDGE domain selection)
    sep = N.new('GeometryNodeSeparateGeometry')
    sep.domain = 'EDGE'
    sep.location = (300, -150)
    L.new(sfs.outputs['Geometry'], sep.inputs['Geometry'])
    L.new(fgb.outputs['Boundary Edges'], sep.inputs['Selection'])

    # 9. Convert boundary edge mesh → curves (each connected chain → one spline)
    m2c = N.new('GeometryNodeMeshToCurve')
    m2c.location = (480, -150)
    L.new(sep.outputs[0], m2c.inputs['Mesh'])  # outputs[0] = selected geometry

    # 10. Set curve radius for tube profile
    scr = N.new('GeometryNodeSetCurveRadius')
    scr.inputs['Radius'].default_value = GROOVE_RADIUS
    scr.location = (650, -150)
    L.new(m2c.outputs['Curve'], scr.inputs['Curve'])

    # 11. Circular cross-section profile for the groove tube
    circ = N.new('GeometryNodeCurvePrimitiveCircle')
    circ.mode = 'RADIUS'
    circ.inputs['Resolution'].default_value = CIRCLE_VERTS
    circ.inputs['Radius'].default_value     = GROOVE_RADIUS
    circ.location = (650, -350)

    # 12. Sweep profile along boundary curves → tube mesh
    c2m = N.new('GeometryNodeCurveToMesh')
    c2m.inputs['Fill Caps'].default_value = True
    c2m.location = (820, -200)
    L.new(scr.outputs['Curve'],   c2m.inputs['Curve'])
    L.new(circ.outputs['Curve'],  c2m.inputs['Profile Curve'])

    # 13. Assign groove material to tube mesh (wired in main() after mat creation)
    smg = N.new('GeometryNodeSetMaterial')
    smg.location = (820, -370)
    L.new(c2m.outputs['Mesh'], smg.inputs['Geometry'])

    # 14. Per-face colour ramp from face set ID → warm steel palette
    mran2 = N.new('ShaderNodeMapRange')
    mran2.data_type = 'FLOAT'; mran2.clamp = True
    mran2.inputs['From Min'].default_value = 0.0
    mran2.inputs['From Max'].default_value = float(NUM_GROUPS - 1)
    mran2.inputs['To Min'].default_value   = 0.0
    mran2.inputs['To Max'].default_value   = 1.0
    mran2.location = (100, -480)
    # Wire INT output through implicit cast — MapRange accepts FLOAT
    L.new(ftoi.outputs['Integer'], mran2.inputs['Value'])

    cr_node = N.new('ShaderNodeValToRGB')
    cr = cr_node.color_ramp
    cr.elements[0].position = 0.0;  cr.elements[0].color = (0.120, 0.175, 0.230, 1.0)
    cr.elements[1].position = 1.0;  cr.elements[1].color = (0.200, 0.140, 0.240, 1.0)
    cr.elements.new(0.33).color  = (0.050, 0.120, 0.160, 1.0)
    cr.elements.new(0.66).color  = (0.170, 0.220, 0.180, 1.0)
    cr_node.location = (300, -480)
    L.new(mran2.outputs['Result'], cr_node.inputs['Fac'])

    spc = N.new('GeometryNodeStoreNamedAttribute')
    spc.data_type = 'FLOAT_COLOR'; spc.domain = 'FACE'
    spc.inputs['Name'].default_value = ATTR_PANEL_COL
    spc.inputs[1].default_value = True
    spc.location = (550, -480)
    L.new(sfs.outputs['Geometry'], spc.inputs[0])
    L.new(cr_node.outputs['Color'], spc.inputs[3])

    # 15. Join panel body + groove tubes
    join = N.new('GeometryNodeJoinGeometry')
    join.location = (820, 0)
    L.new(spc.outputs['Geometry'], join.inputs[0])
    L.new(smg.outputs['Geometry'], join.inputs[0])

    L.new(join.outputs['Geometry'], gout.inputs['Geometry'])
    return ng, smg


def build_panel_material():
    mat = bpy.data.materials.new('Panel_Body')
    mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()
    nattr = nt.nodes.new('ShaderNodeAttribute')
    nattr.attribute_type = 'GEOMETRY'; nattr.attribute_name = ATTR_PANEL_COL
    pb = nt.nodes.new('ShaderNodeBsdfPrincipled')
    pb.inputs['Metallic'].default_value  = PANEL_METALLIC
    pb.inputs['Roughness'].default_value = PANEL_ROUGH
    mout = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(nattr.outputs['Color'], pb.inputs['Base Color'])
    nt.links.new(pb.outputs['BSDF'], mout.inputs['Surface'])
    return mat


def build_groove_material():
    mat = bpy.data.materials.new('Panel_Groove')
    mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()
    pb = nt.nodes.new('ShaderNodeBsdfPrincipled')
    pb.inputs['Base Color'].default_value = (0.012, 0.012, 0.014, 1.0)
    pb.inputs['Metallic'].default_value   = 0.95
    pb.inputs['Roughness'].default_value  = GROOVE_ROUGH
    mout = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(pb.outputs['BSDF'], mout.inputs['Surface'])
    return mat


def main():
    clear_scene()

    ng, smg = build_node_group()
    panel_mat  = build_panel_material()
    groove_mat = build_groove_material()

    # Assign groove material to the SetMaterial node inside the group
    smg.inputs['Material'].default_value = groove_mat

    # Base cube — 2 m edge, origin at world centre
    bpy.ops.mesh.primitive_cube_add(size=2.0, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = "panel_grooves"

    # Panel material on the cube's slot 0 (read by ShaderNodeAttribute)
    obj.data.materials.append(panel_mat)

    # Add GN modifier
    mod = obj.modifiers.new('PanelGrooveMaker', 'NODES')
    mod.node_group = ng

    # Camera — angled 45° yaw/20° pitch to show three faces simultaneously
    bpy.ops.object.camera_add(location=(4.5, -4.0, 3.0))
    cam = bpy.context.active_object
    cam.rotation_euler = (1.05, 0.0, 0.785)  # 60°, 0°, 45° in radians
    bpy.context.scene.camera = cam

    # Area light for specular groove highlights
    bpy.ops.object.light_add(type='AREA', location=(4.0, 2.0, 5.0))
    area = bpy.context.active_object
    area.data.energy = 250.0
    area.data.size   = 3.0

    # Rotation animation — 360° over ANIM_FRAMES for all six faces
    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 1, ANIM_FRAMES
    sc.render.fps = 24
    sc.render.engine = 'BLENDER_EEVEE_NEXT'

    obj.rotation_euler = (0.0, 0.0, 0.0)
    obj.keyframe_insert('rotation_euler', frame=1)
    obj.rotation_euler.z = 6.2832  # 2π = one full rotation
    obj.keyframe_insert('rotation_euler', frame=ANIM_FRAMES)
    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

    # GLB export — apply modifier, +Y up, Draco level 6
    sc.frame_set(EXPORT_FRAME)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUTPUT_GLB),
        export_format='GLB',
        export_apply=True,
        export_colors=True,
        export_attributes=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_yup=True,
    )

    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUTPUT_BLEND))
    print(f"[blueprint] Saved → {OUTPUT_BLEND}")
    print(f"[blueprint] Exported → {OUTPUT_GLB}")


if __name__ == '__main__':
    main()

"""
GN Mesh to Curve + Curve to Mesh — Procedural Bevelled Wireframe Scaffold
Blender 5.1
blueprint.py — run via Text Editor ▸ Run Script, or:
               blender --background --python blueprint.py

WHY MESH-TO-CURVE IS NOT THE SAME AS A WIREFRAME MODIFIER
  The Wireframe modifier in Blender creates a tube around every edge, but it
  offers no per-edge control over tube thickness and no way to pass arbitrary
  per-edge data into the material.  The GN approach splits the domain
  conversion into explicit, inspectable stages:

    1. StoreNamedAttribute (EDGE, "edge_sharpness") before topology change —
       capturing the unsigned dihedral angle at each edge.
    2. MeshToCurve — each edge becomes a 2-point spline; EDGE attributes
       migrate to SPLINE domain (one spline per original edge).
    3. Evaluate on Domain (SPLINE → POINT) — broadcasts the spline scalar to
       both endpoints of each spline, making it available for per-point ops.
    4. MapRange + SetCurveRadius — sharper edges (higher dihedral) become
       physically thicker tubes, mimicking structural steel where load-bearing
       members are heavier gauge.
    5. CurveToMesh × CurveCircle — sweeps an octagonal profile; the built-in
       curve Radius attribute scales the profile per-point automatically.
    6. MergeByDistance — welds the coincident vertices at each sphere vertex
       where 5 or 6 tube ends meet.

EXPERT GOTCHAS
  - Domain after MeshToCurve: EDGE → SPLINE (not POINT).  Forgetting this and
    reading via a POINT-domain node gives 0.0 on every tube.
  - Evaluate on Domain evaluates each POINT's owning SPLINE value.  On
    2-point splines the value is uniform along the spline, but the node is
    required; Named Attribute read at POINT domain without it returns 0.0.
  - Fill Caps on CurveToMesh adds disc faces — without it tubes are open
    cylinders (non-manifold).  Required for 3D-print and GLB validity.
  - Profile circle radius = 1.0; the per-point curve Radius attribute scales
    it.  Setting a larger profile circle just multiplies the final diameter —
    leave it at 1.0 and drive size entirely through SetCurveRadius.
  - MergeByDistance distance must be << minimum edge length.  Ico-sphere
    r=1.0 subdiv=2: min edge ≈ 0.23 m; 0.003 is safe and welds the junctions.

OUTSIDE SOURCES
  Blender Manual — Mesh to Curve Node
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/mesh_to_curve.html
    CC-BY-SA 4.0 · Blender Foundation
  Blender Manual — Field on Domain (Evaluate on Domain)
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/field/evaluate_on_domain.html
    CC-BY-SA 4.0 · Blender Foundation
  Sverchok — Node-based Parametric Modelling for Blender (MIT)
    https://github.com/nortikin/sverchok
    Nikita Gorodetskiy et al. — includes Adaptive Skins and Offset nodes that
    perform equivalent operations at a higher level; comparing their Bevel Curve
    node with the manual pipeline here reveals where the abstraction wins.
"""

import bpy
import math

# ── Parameters ────────────────────────────────────────────────────────────────
ICO_RADIUS       = 1.0
ICO_SUBDIVISIONS = 2          # 80 faces, 42 vertices, 120 edges
THIN_RADIUS      = 0.012      # tube radius on near-flat edges (~ 0 rad dihedral)
THICK_RADIUS     = 0.040      # tube radius on sharp edges (~ π rad dihedral)
PROFILE_VERTS    = 8          # octagonal cross-section — good roundness / poly budget
MERGE_DIST       = 0.003      # weld distance for tube junctions at sphere vertices
ANIM_FRAMES      = 60         # 2.5 s at 24 fps (record.py tube-growth animation)

OUTPUT_BLEND = "//wireframe_scaffold.blend"
OUTPUT_GLB   = "//wireframe_scaffold.glb"
# ─────────────────────────────────────────────────────────────────────────────


def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for pool in (bpy.data.meshes, bpy.data.node_groups, bpy.data.materials):
        for item in list(pool):
            pool.remove(item)


def make_material() -> bpy.types.Material:
    """
    Metallic scaffold shader.  The 'edge_sharpness' named attribute drives
    Base Color saturation so sharper (thicker) tubes are more saturated —
    a purely aesthetic choice that makes the structural hierarchy legible at
    a glance without any additional per-instance colour instancing.
    """
    mat = bpy.data.materials.new("WireframeScaffoldMat")
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    out  = tree.nodes.new("ShaderNodeOutputMaterial")
    bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled")
    attr = tree.nodes.new("ShaderNodeAttribute")
    hue  = tree.nodes.new("ShaderNodeHueSaturation")

    attr.attribute_name = "edge_sharpness"
    attr.attribute_type  = "GEOMETRY"

    bsdf.inputs['Base Color'].default_value     = (0.52, 0.60, 0.70, 1.0)
    bsdf.inputs['Metallic'].default_value       = 0.75
    bsdf.inputs['Roughness'].default_value      = 0.25
    bsdf.inputs['Coat Weight'].default_value    = 0.35
    bsdf.inputs['Coat Roughness'].default_value = 0.10

    hue.inputs['Hue'].default_value   = 0.5
    hue.inputs['Value'].default_value = 1.0
    hue.inputs['Color'].default_value = (0.52, 0.60, 0.70, 1.0)

    tree.links.new(attr.outputs['Fac'],  hue.inputs['Saturation'])
    tree.links.new(hue.outputs['Color'], bsdf.inputs['Base Color'])
    tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

    out.location  = (500,   0)
    bsdf.location = (200,   0)
    hue.location  = (-100,  0)
    attr.location = (-400,  0)
    return mat


def build_gn_tree() -> bpy.types.GeometryNodeTree:
    """
    Build the Geometry Nodes tree for the wireframe scaffold.

    Node layout (left → right, X axis):
      -1400: GroupInput
      -1100: IcoSphere
       -750: EdgeAngle  / StoreNamedAttribute
       -350: MeshToCurve
         50: NamedAttribute / FieldOnDomain / MapRange
        400: SetCurveRadius + CurveCircle
        750: CurveToMesh
       1050: MergeByDistance
       1300: SetShadeSmooth
       1550: SetMaterial → GroupOutput
    """
    ng  = bpy.data.node_groups.new("wireframe_scaffold_gn", 'GeometryNodeTree')
    ni  = ng.interface
    nds = ng.nodes
    lks = ng.links

    # ── Group interface ──────────────────────────────────────────────────────
    s_thin = ni.new_socket("Thin Radius",  in_out='INPUT', socket_type='NodeSocketFloat')
    s_thick= ni.new_socket("Thick Radius", in_out='INPUT', socket_type='NodeSocketFloat')
    s_mat  = ni.new_socket("Material",     in_out='INPUT', socket_type='NodeSocketMaterial')
    ni.new_socket("Geometry",              in_out='OUTPUT', socket_type='NodeSocketGeometry')
    s_thin.default_value  = THIN_RADIUS;  s_thin.min_value  = 0.002; s_thin.max_value = 0.10
    s_thick.default_value = THICK_RADIUS; s_thick.min_value = 0.002; s_thick.max_value = 0.10

    def nd(t, lbl="", loc=(0, 0)):
        n = nds.new(t); n.label = lbl; n.location = loc; return n

    n_in  = nd('NodeGroupInput',  loc=(-1400, 0))
    n_out = nd('NodeGroupOutput', loc=(1750, 0))

    # ── 1. Source geometry ───────────────────────────────────────────────────
    n_ico = nd('GeometryNodeMeshIcoSphere', 'IcoSphere', loc=(-1100, 0))
    n_ico.inputs['Radius'].default_value       = ICO_RADIUS
    n_ico.inputs['Subdivisions'].default_value = ICO_SUBDIVISIONS

    # ── 2. Capture dihedral angle at EDGE domain ─────────────────────────────
    # Edge Angle gives unsigned dihedral in [0, π] between the two face normals
    # meeting at each edge.  Flat co-planar edges ≈ 0; sharp crease edges ≈ π.
    n_ean = nd('GeometryNodeInputMeshEdgeAngle', 'Edge Angle', loc=(-1000, -220))

    n_sna = nd('GeometryNodeStoreNamedAttribute', 'Store edge_sharpness',
               loc=(-750, 0))
    n_sna.data_type = 'FLOAT'
    n_sna.domain    = 'EDGE'
    n_sna.inputs['Name'].default_value = "edge_sharpness"

    lks.new(n_ico.outputs['Mesh'],                  n_sna.inputs['Geometry'])
    lks.new(n_ean.outputs['Unsigned Angle'],         n_sna.inputs['Value'])

    # ── 3. Mesh to Curve ─────────────────────────────────────────────────────
    # Every edge becomes a 2-point spline.  The stored EDGE attribute
    # "edge_sharpness" migrates to SPLINE domain (1 spline per edge).
    n_m2c = nd('GeometryNodeMeshToCurve', 'Mesh → Curve', loc=(-350, 0))
    lks.new(n_sna.outputs['Geometry'], n_m2c.inputs['Mesh'])

    # ── 4. Read attribute and broadcast SPLINE → POINT ───────────────────────
    n_natt = nd('GeometryNodeInputNamedAttribute', 'Named Attr', loc=(-50, -240))
    n_natt.data_type = 'FLOAT'
    n_natt.inputs['Name'].default_value = "edge_sharpness"

    # Evaluate on Domain: reads the field at POINT domain (both endpoints of
    # each 2-point spline receive their spline's uniform edge_sharpness value).
    n_fod = nd('GeometryNodeFieldOnDomain', 'Eval SPLINE→POINT', loc=(200, -200))
    n_fod.data_type = 'FLOAT'
    n_fod.domain    = 'POINT'     # output (evaluation) domain
    lks.new(n_natt.outputs['Attribute'], n_fod.inputs['Value'])

    # ── 5. Map dihedral angle to tube radius ─────────────────────────────────
    n_rmp = nd('ShaderNodeMapRange', 'Angle→Radius', loc=(400, -200))
    n_rmp.clamp = True
    n_rmp.inputs['From Min'].default_value = 0.0
    n_rmp.inputs['From Max'].default_value = math.pi
    lks.new(n_fod.outputs['Value'],         n_rmp.inputs['Value'])
    lks.new(n_in.outputs['Thin Radius'],    n_rmp.inputs['To Min'])
    lks.new(n_in.outputs['Thick Radius'],   n_rmp.inputs['To Max'])

    # ── 6. Set per-point curve radius ────────────────────────────────────────
    # CurveToMesh multiplies the profile by each point's curve Radius.
    # Profile circle radius = 1.0; all size control flows through this node.
    n_scr = nd('GeometryNodeSetCurveRadius', 'Set Radius', loc=(600, 0))
    lks.new(n_m2c.outputs['Curve'],       n_scr.inputs['Curve'])
    lks.new(n_rmp.outputs['Result'],      n_scr.inputs['Radius'])

    # ── 7. Profile circle ────────────────────────────────────────────────────
    n_prf = nd('GeometryNodeCurvePrimitiveCircle', 'Profile', loc=(600, -320))
    n_prf.mode = 'RADIUS'
    n_prf.inputs['Resolution'].default_value = PROFILE_VERTS
    n_prf.inputs['Radius'].default_value     = 1.0   # scaled by curve Radius

    # ── 8. Curve to Mesh ─────────────────────────────────────────────────────
    n_c2m = nd('GeometryNodeCurveToMesh', 'Curve → Mesh', loc=(850, 0))
    n_c2m.inputs['Fill Caps'].default_value = True
    lks.new(n_scr.outputs['Curve'],     n_c2m.inputs['Curve'])
    lks.new(n_prf.outputs['Curve'],     n_c2m.inputs['Profile Curve'])

    # ── 9. Merge by Distance — weld tube junctions ───────────────────────────
    # At each original vertex, 5 or 6 tube endpoints are coincident (ico-sphere
    # vertex valence).  MergeByDistance welds them into a manifold junction.
    n_mbd = nd('GeometryNodeMergeByDistance', 'Merge Junctions', loc=(1100, 0))
    n_mbd.inputs['Distance'].default_value = MERGE_DIST
    lks.new(n_c2m.outputs['Mesh'], n_mbd.inputs['Geometry'])

    # ── 10. Shade smooth on tube cylinders ───────────────────────────────────
    n_sms = nd('GeometryNodeSetShadeSmooth', 'Shade Smooth', loc=(1350, 0))
    n_sms.domain = 'FACE'
    n_sms.inputs['Shade Smooth'].default_value = True
    lks.new(n_mbd.outputs['Geometry'], n_sms.inputs['Geometry'])

    # ── 11. Material ─────────────────────────────────────────────────────────
    n_mset = nd('GeometryNodeSetMaterial', 'Set Mat', loc=(1600, 0))
    lks.new(n_sms.outputs['Geometry'],  n_mset.inputs['Geometry'])
    lks.new(n_in.outputs['Material'],   n_mset.inputs[2])
    lks.new(n_mset.outputs['Geometry'], n_out.inputs['Geometry'])

    return ng


def make_object(ng: bpy.types.GeometryNodeTree,
                mat: bpy.types.Material) -> bpy.types.Object:
    me  = bpy.data.meshes.new("WireframeScaffold")
    obj = bpy.data.objects.new("WireframeScaffold", me)
    bpy.context.collection.objects.link(obj)
    mod = obj.modifiers.new("WireframeScaffold", 'NODES')
    mod.node_group = ng
    for item in ng.interface.items_tree:
        if item.name == "Material":
            mod[item.identifier] = mat
            break
    return obj


def add_camera_and_light() -> None:
    bpy.ops.object.camera_add(location=(2.8, -2.8, 1.8))
    cam = bpy.context.active_object
    cam.name = "RecordCam"
    cam.rotation_euler = (1.05, 0.0, 0.785)
    cam.data.lens = 50
    bpy.context.scene.camera = cam

    bpy.ops.object.light_add(type='SUN', location=(4, -4, 6))
    sun = bpy.context.active_object
    sun.data.energy = 5.0
    sun.data.angle  = 0.06

    bpy.ops.object.light_add(type='AREA', location=(-2, 3, 2.5))
    fill = bpy.context.active_object
    fill.data.energy = 90
    fill.data.size   = 4.5


def export_glb() -> None:
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB,
        export_format='GLB',
        export_apply=True,
        export_animations=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_yup=True,
    )


def main() -> None:
    clear_scene()
    mat = make_material()
    ng  = build_gn_tree()
    obj = make_object(ng, mat)            # noqa: F841
    add_camera_and_light()

    scene = bpy.context.scene
    scene.frame_start = scene.frame_end = 1
    scene.frame_set(1)

    bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_BLEND)
    export_glb()
    print("✓ wireframe_scaffold.blend  ✓ wireframe_scaffold.glb")


if __name__ == "__main__":
    main()

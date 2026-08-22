"""
GN Deform Curves on Surface — Hair Strand Binding: Mesh-Pinned Strands That
Follow Armature Deformation for VRM / WebXR
Blender 5.1 · CC0 · Holoflow Studio

Technique: GeometryNodeDeformCurvesOnSurface reads the `surface` attribute
stored on a HairCurves data block (set via hc.surface = scalp_mesh_obj) and
re-positions every curve control point so it tracks the deformed mesh — no
re-simulation, no physics solver. The scalp mesh is deformed by an Armature
modifier; the hair curves follow purely kinematically.

The mechanism is a two-pass UV barycentric lookup:
  1. At bind time (first modifier evaluation), each curve root finds its
     barycentric coordinates on the REST-pose mesh face beneath it and
     stores them. The binding is implicit — it happens the moment the node
     evaluates and hc.surface is set.
  2. Every subsequent frame, the node reads the DEFORMED vertex positions
     of the same face, recomputes the weighted average, and translates /
     rotates the curve accordingly. Rotation comes from comparing the rest-
     pose face tangent frame to the deformed tangent frame; this is what
     makes the hair lean sideways when the head tilts, rather than merely
     following the root point's translation.

Key trade-off — Deform Curves on Surface vs VRM Spring Bones:
  DeformCOS tracks skeleton exactly, zero cost per frame, zero jitter.
  Spring Bones add secondary inertia / lag / bounce, but cost CPU each frame
  and are runtime-only (GLTF viewers that don't implement VRM physics see
  rigid hair). For a hero character on a powerful desktop WebXR viewer, use
  Spring Bones. For LOD-1 or mobile, use DeformCOS then export static poses.

Outside sources:
  Blender Manual — Deform Curves on Surface
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/deform_curves_on_surface.html
    CC-BY-SA 4.0 · Blender Documentation Team
  Blender Developer Blog — New Hair in Blender 3.3 (Jacques Lucke, 2022)
    https://code.blender.org/2022/08/new-hair-in-blender-3-3/
    CC-BY-SA 4.0 · Blender Institute
    Related project: blender/blender (GPL-2.0 — we reference only the blog text)
  glTF-Blender-IO — Khronos Group GLB exporter
    https://github.com/KhronosGroup/glTF-Blender-IO
    Apache-2.0 · Khronos Group
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector, Matrix

# ── Parameters ────────────────────────────────────────────────────────────────
SCALP_RADIUS     = 0.11    # metres — standard VRM head radius
SCALP_U_SEGS     = 16
SCALP_V_SEGS     = 10
HEAD_TILT_DEG    = 25.0    # how far the head bone tilts in the demo pose
STRAND_LENGTH    = 0.14    # metres — shoulder-length on a 1.7 m VRM figure
GUIDE_PTS        = 6       # control points per guide strand
NUM_GUIDES       = 12      # strands placed procedurally across the scalp dome
STRAND_RADIUS    = 0.0018  # cross-section radius for the round-tube mesh
CROSS_SEGS       = 5       # polygon sides for the swept tube (pentagon = good round/cost balance)
BLEND_OUT        = "//deform_curves_demo.blend"
GLB_OUT          = "//deform_curves_demo_posed.glb"

# Guide placement: (latitude_deg, longitude_deg) pairs covering the scalp dome
GUIDE_SPECS = [
    (80,   0),   # crown
    (55,   0),   # forehead centre
    (55,  60),   # right-front
    (55, 120),   # right side
    (55, 180),   # back-crown
    (55, 240),   # left side
    (55, 300),   # left-front
    (30,  30),   # right temple low
    (30, 150),   # back right
    (30, 210),   # back left
    (30, 330),   # left temple low
    (20, 180),   # nape
]
assert len(GUIDE_SPECS) == NUM_GUIDES


# ── Utility ───────────────────────────────────────────────────────────────────
def _lk(ng, src, dst):
    ng.links.new(src, dst)


def _spherical(lat_deg: float, lon_deg: float, r: float) -> Vector:
    """Convert spherical coordinates to Cartesian. +Z = up (Blender convention)."""
    lat = math.radians(lat_deg)
    lon = math.radians(lon_deg)
    x = r * math.cos(lat) * math.sin(lon)
    y = r * math.cos(lat) * (-math.cos(lon))
    z = r * math.sin(lat)
    return Vector((x, y, z))


def _cleanup() -> None:
    for ob in list(bpy.data.objects):
        if ob.name.startswith(("HF_", "Scalp", "HeadBone")):
            bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.name.startswith(("HF_", "Scalp")):
            bpy.data.meshes.remove(me)
    for hc in list(bpy.data.hair_curves):
        if hc.name.startswith("HF_"):
            bpy.data.hair_curves.remove(hc)
    for ng in list(bpy.data.node_groups):
        if ng.name.startswith("HF_"):
            bpy.data.node_groups.remove(ng)
    for arm in list(bpy.data.armatures):
        if arm.name.startswith("HF_"):
            bpy.data.armatures.remove(arm)
    for ma in list(bpy.data.materials):
        if ma.name.startswith("HF_"):
            bpy.data.materials.remove(ma)
    for ac in list(bpy.data.actions):
        if ac.name.startswith("HF_"):
            bpy.data.actions.remove(ac)


# ── Step 1: Scalp hemisphere mesh ─────────────────────────────────────────────
def _make_scalp() -> bpy.types.Object:
    """
    UV sphere top half — the surface the hair strands are pinned to.
    Topology: SCALP_U_SEGS longitude × SCALP_V_SEGS latitude segments, all
    verts with Z < 0 deleted. A UV map named 'UVMap' is mandatory: the
    Deform Curves on Surface node uses it to look up barycentric root coords.
    """
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=SCALP_U_SEGS,
        ring_count=SCALP_V_SEGS,
        radius=SCALP_RADIUS,
        location=(0, 0, 0),
    )
    scalp = bpy.context.active_object
    scalp.name = "HF_Scalp"

    # Crop bottom hemisphere
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(scalp.data)
    to_del = [v for v in bm.verts if v.co.z < -0.001]
    bmesh.ops.delete(bm, geom=to_del, context='VERTS')
    bmesh.update_edit_mesh(scalp.data)
    bpy.ops.object.mode_set(mode='OBJECT')

    # UV map — Smart Project is fine; any non-overlapping UV is sufficient
    bpy.ops.object.select_all(action='DESELECT')
    scalp.select_set(True)
    bpy.context.view_layer.objects.active = scalp
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66))
    bpy.ops.object.mode_set(mode='OBJECT')
    scalp.data.uv_layers[0].name = "UVMap"

    # Simple cel-shaded material for preview rendering
    ma = bpy.data.materials.new("HF_ScalpSkin")
    ma.use_nodes = True
    scalp.data.materials.append(ma)

    return scalp


# ── Step 2: Single-bone armature ───────────────────────────────────────────────
def _make_armature() -> tuple[bpy.types.Object, bpy.types.Object]:
    """
    One 'Head' bone pointing in +Z, 0.11 m long.
    The scalp mesh will be vertex-group-parented to this bone.
    At frame 30 the bone tilts HEAD_TILT_DEG degrees forward to demonstrate
    that Deform Curves on Surface tracks the deformation.
    """
    bpy.ops.object.armature_add(location=(0, 0, 0))
    arm_ob = bpy.context.active_object
    arm_ob.name = "HF_Armature"
    arm    = arm_ob.data
    arm.name = "HF_Armature"

    bpy.ops.object.mode_set(mode='EDIT')
    bone = arm.edit_bones[0]
    bone.name = "Head"
    bone.head  = Vector((0, 0, 0))
    bone.tail  = Vector((0, 0, SCALP_RADIUS * 2))
    bpy.ops.object.mode_set(mode='OBJECT')

    # Parent scalp to armature with armature deform (all verts in "Head" group = weight 1)
    scalp = bpy.data.objects["HF_Scalp"]
    scalp.parent            = arm_ob
    scalp.parent_type       = 'OBJECT'

    # Add Armature modifier to scalp
    mod = scalp.modifiers.new("Armature", 'ARMATURE')
    mod.object = arm_ob

    # Vertex group for the single bone (all verts, weight 1.0)
    vg = scalp.vertex_groups.new(name="Head")
    vg.add(list(range(len(scalp.data.vertices))), 1.0, 'REPLACE')

    # Keyframe: rest at frame 1, tilted at frame 30
    bpy.context.view_layer.objects.active = arm_ob
    bpy.ops.object.mode_set(mode='POSE')
    pose_bone = arm_ob.pose.bones["Head"]

    arm_ob.animation_data_create()
    arm_ob.animation_data.action = bpy.data.actions.new("HF_HeadTilt")

    bpy.context.scene.frame_set(1)
    pose_bone.rotation_mode = 'XYZ'
    pose_bone.rotation_euler = (0, 0, 0)
    pose_bone.keyframe_insert("rotation_euler", frame=1)

    bpy.context.scene.frame_set(30)
    pose_bone.rotation_euler = (math.radians(HEAD_TILT_DEG), 0, 0)
    pose_bone.keyframe_insert("rotation_euler", frame=30)

    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.context.scene.frame_set(1)

    return arm_ob, scalp


# ── Step 3: Guide HairCurves pinned to the scalp ──────────────────────────────
def _make_guide_curves(scalp: bpy.types.Object) -> bpy.types.Object:
    """
    NUM_GUIDES HairCurves strands, each with GUIDE_PTS control points.
    Roots sit on the scalp surface; tips extend radially outward plus a
    quadratic gravity droop. The crucial setup is:
      hc.surface     = scalp          ← links to the rest-pose mesh
      hc.surface_uv_map = "UVMap"    ← UV layer used for barycentric lookup
    Without both, Deform Curves on Surface evaluates to the undeformed position.
    """
    hc  = bpy.data.hair_curves.new("HF_GuideHair")
    obj = bpy.data.objects.new("HF_GuideHair", hc)
    bpy.context.collection.objects.link(obj)

    # Bind to surface
    hc.surface        = scalp
    hc.surface_uv_map = "UVMap"

    # Allocate: GUIDE_PTS points per guide curve
    hc.add_curves([GUIDE_PTS] * NUM_GUIDES)

    pos_attr = hc.attributes["position"]
    pt_idx   = 0

    for lat_deg, lon_deg in GUIDE_SPECS:
        root   = _spherical(lat_deg, lon_deg, SCALP_RADIUS)
        normal = root.normalized()
        # Tip direction: blend outward normal with a mild −Z gravity bias
        tip_dir = (normal * 0.85 + Vector((0, 0, -0.55))).normalized()

        for step in range(GUIDE_PTS):
            t       = step / max(GUIDE_PTS - 1, 1)
            droop_z = t * t * STRAND_LENGTH * 0.12    # quadratic tip-droop
            pos     = root + tip_dir * (STRAND_LENGTH * t) - Vector((0, 0, droop_z))
            pos_attr.data[pt_idx].vector = pos
            pt_idx += 1

    return obj


# ── Step 4: Deform Curves on Surface modifier ──────────────────────────────────
def _add_deform_modifier(guide_obj: bpy.types.Object) -> None:
    """
    Add a GeometryNodeDeformCurvesOnSurface modifier to the HairCurves object.
    The node expects:
      - geometry input = the incoming curves geometry (from the Group Input socket)
      - it reads hc.surface automatically from the Curves data block (no explicit
        Object Info wiring needed — the node sources the surface internally)
    The modifier is intentionally minimal: one node reads the surface, re-positions
    the curves, outputs the result.

    Note: In Blender 5.1 the node identifier is 'GeometryNodeDeformCurvesOnSurface'.
    In older builds it was shipped under the add-on 'Hair Curves'. Check the GN
    Add menu under Curve > Deform Curves on Surface.
    """
    ng = bpy.data.node_groups.new("HF_DeformCurvesOnSurface", 'GeometryNodeTree')
    ng.is_modifier = True

    # Interface sockets
    ng.interface.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

    n_in   = ng.nodes.new('NodeGroupInput');                     n_in.location   = (-200, 0)
    n_out  = ng.nodes.new('NodeGroupOutput');                    n_out.location  = ( 400, 0)
    n_def  = ng.nodes.new('GeometryNodeDeformCurvesOnSurface'); n_def.location  = ( 100, 0)

    _lk(ng, n_in.outputs['Geometry'],    n_def.inputs['Curves'])
    _lk(ng, n_def.outputs['Curves'],     n_out.inputs['Geometry'])

    mod         = guide_obj.modifiers.new("DeformCurvesOnSurface", 'NODES')
    mod.node_group = ng


# ── Step 5: Curve-to-Mesh output object for GLB export ────────────────────────
def _make_hair_mesh_gn(guide_obj: bpy.types.Object) -> bpy.types.Object:
    """
    A second GN tree on an empty mesh object reads the HairCurves data via
    ObjectInfo and sweeps a round profile along each strand, producing a
    GLB-exportable triangle mesh. This is the layer Dimona would use for
    WebXR or 3-D print output.
    """
    ng = bpy.data.node_groups.new("HF_HairToMesh", 'GeometryNodeTree')
    ng.is_modifier = True

    ng.interface.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

    n_in     = ng.nodes.new('NodeGroupInput');                   n_in.location     = (-400,  0)
    n_out    = ng.nodes.new('NodeGroupOutput');                  n_out.location     = ( 600,  0)
    n_oi     = ng.nodes.new('GeometryNodeObjectInfo');           n_oi.location      = (-200, 60)
    n_circle = ng.nodes.new('GeometryNodeCurvePrimitiveCircle'); n_circle.location  = (-200,-80)
    n_c2m    = ng.nodes.new('GeometryNodeCurveToMesh');          n_c2m.location     = ( 200,  0)
    n_tri    = ng.nodes.new('GeometryNodeTriangulateMesh');      n_tri.location     = ( 400,  0)

    n_oi.inputs['Object'].default_value     = guide_obj
    n_oi.transform_space                    = 'RELATIVE'

    n_circle.mode                                    = 'POINTS'
    n_circle.inputs['Vertices'].default_value        = CROSS_SEGS
    n_circle.inputs['Radius'].default_value          = STRAND_RADIUS

    # Fill Caps False — open hair tips look like strands, not cable ends
    n_c2m.inputs['Fill Caps'].default_value = False

    _lk(ng, n_oi.outputs['Geometry'],     n_c2m.inputs['Curve'])
    _lk(ng, n_circle.outputs['Curve'],    n_c2m.inputs['Profile Curve'])
    _lk(ng, n_c2m.outputs['Mesh'],        n_tri.inputs['Mesh'])
    _lk(ng, n_tri.outputs['Mesh'],        n_out.inputs['Geometry'])

    hair_mat = bpy.data.materials.new("HF_HairMat")
    hair_mat.use_nodes = True
    nt = hair_mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF") or nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value  = (0.08, 0.05, 0.03, 1.0)
    bsdf.inputs["Roughness"].default_value   = 0.55

    me = bpy.data.meshes.new("HF_HairMesh")
    ob = bpy.data.objects.new("HF_HairMesh", me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(hair_mat)

    mod            = ob.modifiers.new("HairToMesh", 'NODES')
    mod.node_group = ng

    return ob


# ── Step 6: Save + GLB export at posed frame ──────────────────────────────────
def _export(hair_mesh_ob: bpy.types.Object) -> None:
    """
    Export the hair mesh at the POSED frame (30) when the head is tilted.
    This demonstrates that DeformCurvesOnSurface correctly repositioned the
    strands to follow the armature — the GLB shows hair leaning forward.
    """
    # Advance to posed frame so the depsgraph is current
    bpy.context.scene.frame_set(30)
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_OUT))

    # Apply modifier in a copy for export (GLB has no native Curves primitive)
    bpy.context.view_layer.objects.active = hair_mesh_ob
    bpy.ops.object.select_all(action='DESELECT')
    hair_mesh_ob.select_set(True)

    blend_dir = os.path.dirname(bpy.data.filepath)
    glb_path  = os.path.join(blend_dir, "deform_curves_demo_posed.glb")

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        use_selection=False,
        export_apply=True,                        # realise GN + armature
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_yup=True,
    )


# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    _cleanup()
    scalp      = _make_scalp()
    arm_ob, _  = _make_armature()
    guides     = _make_guide_curves(scalp)
    _add_deform_modifier(guides)
    hair_mesh  = _make_hair_mesh_gn(guides)
    _export(hair_mesh)
    print("[HF] deform_curves_demo.blend saved. GLB exported at pose frame 30.")


if __name__ == "__main__":
    main()

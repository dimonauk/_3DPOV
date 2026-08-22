"""
Armature Spline IK — Flexible Tentacle / Tendril Rig
Blender 5.1 | CC0 | Holoflow Studio

Spline IK fits a bone chain to a Bezier curve instead of iteratively solving
for a goal point.  The curve IS the rig control: move its handles and the
entire chain follows.  This makes complex organic curvature trivial to animate
while keeping bone count low enough for real-time use.

Key distinction from INVERSE_KINEMATICS (CCD/iTaSC):
  - IK: solver rotates joints to reach a single target object.
  - Spline IK: solver distributes N bones along a curve's arc length.
    No goal object; the curve shape is the pose.

WHY Spline IK over a path-follow constraint:
  - Path-follow slides the ROOT along the curve (translation).
  - Spline IK deforms the CHAIN so every bone segment conforms to local
    curvature — essential for tentacle/hair/spine rigs.
"""

import bpy
import bmesh
import math
from mathutils import Vector, Matrix

# ── PARAMETERS ──────────────────────────────────────────────────────────────
BONE_COUNT    = 10      # joints in the tentacle chain
BONE_LENGTH   = 0.12   # m per bone; total length = 1.20 m
BASE_RADIUS   = 0.042  # cross-section radius at root
TIP_RADIUS    = 0.006  # cross-section radius at tip (taper)
SKIN_RINGS    = BONE_COUNT * 3   # mesh rings along length for smooth deform
SKIN_SEGS     = 12     # polygons per cross-section ring
CTRL_DIST     = 0.50   # Bezier handle offset for default S-shape
ARM_NAME      = "tentacle_armature"
CURVE_NAME    = "tentacle_curve"
SKIN_NAME     = "tentacle_skin"
TOTAL_LEN     = BONE_COUNT * BONE_LENGTH


# ── SCENE SETUP ─────────────────────────────────────────────────────────────
def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for d in (bpy.data.meshes, bpy.data.curves, bpy.data.armatures,
              bpy.data.materials, bpy.data.objects):
        for item in list(d):
            d.remove(item, do_unlink=True)


# ── BEZIER CURVE (the Spline IK target) ─────────────────────────────────────
def build_curve() -> bpy.types.Object:
    """
    One spline with 3 control points: root (0,0,0), mid (0,TOTAL_LEN/2,0),
    tip (0,TOTAL_LEN,0).  Handles are offset in X to give a natural rest
    S-curve when animated.

    WHY 3 points not 2: two-point Bezier gives only a single bend; three
    points allow the S-shape that is characteristic of organic tendrils and
    hair strands under gravity.
    """
    cu = bpy.data.curves.new(CURVE_NAME, 'CURVE')
    cu.dimensions = '3D'
    cu.twist_mode = 'MINIMUM'  # minimises torsion artefacts along the chain

    sp = cu.splines.new('BEZIER')
    sp.bezier_points.add(2)  # add 2 more → total 3

    pts = sp.bezier_points
    half = TOTAL_LEN * 0.5

    # Root control point
    pts[0].co               = Vector((0, 0, 0))
    pts[0].handle_left      = Vector((-CTRL_DIST, 0, 0))
    pts[0].handle_right     = Vector(( CTRL_DIST, 0, 0))
    pts[0].handle_left_type  = 'FREE'
    pts[0].handle_right_type = 'FREE'

    # Mid control point — laterally displaced to form the S
    pts[1].co               = Vector((0.25, half, 0))
    pts[1].handle_left      = Vector((-CTRL_DIST * 0.7, half - 0.15, 0))
    pts[1].handle_right     = Vector(( CTRL_DIST * 0.7, half + 0.15, 0))
    pts[1].handle_left_type  = 'FREE'
    pts[1].handle_right_type = 'FREE'

    # Tip control point
    pts[2].co               = Vector((0, TOTAL_LEN, 0))
    pts[2].handle_left      = Vector((-CTRL_DIST, TOTAL_LEN, 0))
    pts[2].handle_right     = Vector(( CTRL_DIST, TOTAL_LEN, 0))
    pts[2].handle_left_type  = 'FREE'
    pts[2].handle_right_type = 'FREE'

    obj = bpy.data.objects.new(CURVE_NAME, cu)
    bpy.context.collection.objects.link(obj)
    obj.hide_render = True  # curve is rig helper, not renderable
    return obj


# ── ARMATURE ────────────────────────────────────────────────────────────────
def build_armature() -> bpy.types.Object:
    """
    Chain of BONE_COUNT bones along +Y, head-to-tail connected.
    In edit mode, bones run: Bone → Bone.001 → … → Bone.009

    WHY bones along +Y: Blender's default bone orientation is +Y = tail
    direction.  Spline IK aligns bone +Y axes to the curve tangent, so
    bones built on +Y are already in the correct local frame.
    """
    arm = bpy.data.armatures.new(ARM_NAME)
    obj = bpy.data.objects.new(ARM_NAME, arm)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    bpy.ops.object.mode_set(mode='EDIT')
    bones = arm.edit_bones

    prev = None
    for i in range(BONE_COUNT):
        b = bones.new(f"Bone.{i:03d}" if i else "Bone")
        b.head = Vector((0, i * BONE_LENGTH, 0))
        b.tail = Vector((0, (i + 1) * BONE_LENGTH, 0))
        if prev is not None:
            b.parent = prev
            b.use_connect = True   # head snaps to parent tail — proper chain
        prev = b

    bpy.ops.object.mode_set(mode='OBJECT')
    return obj


# ── SPLINE IK CONSTRAINT ─────────────────────────────────────────────────────
def attach_spline_ik(arm_obj: bpy.types.Object,
                     curve_obj: bpy.types.Object) -> None:
    """
    The SPLINE_IK constraint is placed on the TIP bone (last in the chain)
    and chain_count reaches back toward the root.

    WHY on the tip, not the root:
    Blender's Spline IK evaluates bones from TIP toward ROOT along the
    chain_count.  Placing it on the root bone would constrain only that bone.

    xz_scale_mode='VOLUME_PRESERVE': as the tentacle stretches along the curve,
    cross-section narrows proportionally to preserve volume — same physics as a
    rubber hose.  Use 'NONE' if you want a rigid-diameter cable.

    y_scale_mode='FIT_CURVE': each bone is scaled in Y so the total chain
    length exactly matches the Bezier arc length.  Remove this to keep
    biological segment lengths (useful for spine rigs).
    """
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='POSE')

    tip_name = f"Bone.{BONE_COUNT - 1:03d}"
    tip_pbone = arm_obj.pose.bones[tip_name]

    con = tip_pbone.constraints.new('SPLINE_IK')
    con.target          = curve_obj
    con.chain_count     = BONE_COUNT     # all bones participate
    con.use_curve_radius = False         # ignore curve point radius property
    con.xz_scale_mode   = 'VOLUME_PRESERVE'
    con.y_scale_mode    = 'FIT_CURVE'

    bpy.ops.object.mode_set(mode='OBJECT')


# ── TAPERED SKIN MESH ────────────────────────────────────────────────────────
def build_skin(arm_obj: bpy.types.Object) -> bpy.types.Object:
    """
    Tubular mesh tapered from BASE_RADIUS at root to TIP_RADIUS at tip.
    SKIN_RINGS * SKIN_SEGS vertices give enough loops for the armature
    deformer to produce smooth curvature without pinching.

    WHY not use the Skin modifier: Skin creates a procedural cage but
    Spline IK needs a proper vertex-group-bound skin so bone weights
    control smooth cross-section deformation.
    """
    me = bpy.data.meshes.new(SKIN_NAME)
    bm = bmesh.new()

    verts_per_ring = SKIN_SEGS
    rings: list[list[bmesh.types.BMVert]] = []

    for ring_idx in range(SKIN_RINGS + 1):
        t = ring_idx / SKIN_RINGS
        y = t * TOTAL_LEN
        r = BASE_RADIUS + (TIP_RADIUS - BASE_RADIUS) * t
        ring = [
            bm.verts.new((r * math.cos(2 * math.pi * s / SKIN_SEGS),
                          y,
                          r * math.sin(2 * math.pi * s / SKIN_SEGS)))
            for s in range(SKIN_SEGS)
        ]
        rings.append(ring)

    # Quad faces between adjacent rings
    for ri in range(SKIN_RINGS):
        for s in range(SKIN_SEGS):
            sn = (s + 1) % SKIN_SEGS
            bm.faces.new([rings[ri][s], rings[ri][sn],
                          rings[ri + 1][sn], rings[ri + 1][s]])

    # Cap at root and tip
    bm.faces.new(rings[0])
    bm.faces.new(list(reversed(rings[-1])))

    bm.to_mesh(me)
    bm.free()
    me.update()

    skin_obj = bpy.data.objects.new(SKIN_NAME, me)
    bpy.context.collection.objects.link(skin_obj)
    return skin_obj


# ── VERTEX GROUPS + ARMATURE MODIFIER ────────────────────────────────────────
def bind_skin(skin_obj: bpy.types.Object,
              arm_obj: bpy.types.Object) -> None:
    """
    Manual vertex groups: each ring of vertices receives full weight (1.0)
    to the bone whose Y range contains that ring's Y position.

    WHY manual not automatic weights: bpy.ops.object.parent_with_armature
    calls the Armature auto-weight operator which needs an active depsgraph
    context and is fragile in headless runs.  Manual weights are deterministic
    and perfectly predictable.

    Weight distribution: 3 rings per bone segment → each ring assigned to
    the bone whose mid-point is closest.  The armature deformer interpolates
    between groups, so 3 rings/bone is sufficient for smooth bending.
    """
    bone_names = ["Bone"] + [f"Bone.{i:03d}" for i in range(1, BONE_COUNT)]

    # Create a vertex group per bone
    for name in bone_names:
        skin_obj.vertex_groups.new(name=name)

    rings_per_bone = SKIN_RINGS / BONE_COUNT
    verts = skin_obj.data.vertices

    for v in verts:
        # Find which ring this vertex belongs to
        y_norm = v.co.y / TOTAL_LEN
        bone_idx = min(int(y_norm * BONE_COUNT), BONE_COUNT - 1)
        bone_name = bone_names[bone_idx]
        skin_obj.vertex_groups[bone_name].add([v.index], 1.0, 'REPLACE')

    mod = skin_obj.modifiers.new("Armature", 'ARMATURE')
    mod.object = arm_obj
    mod.use_vertex_groups = True

    # Parent (data only — modifier handles deformation)
    skin_obj.parent = arm_obj


# ── MATERIAL ─────────────────────────────────────────────────────────────────
def build_material(skin_obj: bpy.types.Object) -> None:
    mat = bpy.data.materials.new("tentacle_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out   = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf  = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.04, 0.42, 0.28, 1.0)  # deep teal
    bsdf.inputs['Roughness'].default_value   = 0.35
    bsdf.inputs['Metallic'].default_value    = 0.0
    # Subsurface for translucent skin — see shader-subsurface-scattering tutorial
    bsdf.inputs['Subsurface Weight'].default_value  = 0.18
    bsdf.inputs['Subsurface Scale'].default_value   = 0.04

    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

    out.location  = (300, 0)
    bsdf.location = (0, 0)

    if skin_obj.data.materials:
        skin_obj.data.materials[0] = mat
    else:
        skin_obj.data.materials.append(mat)


# ── CAMERA + LIGHTING ────────────────────────────────────────────────────────
def setup_scene() -> None:
    scene = bpy.context.scene
    scene.render.engine       = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.frame_start = 1
    scene.frame_end   = 60

    # Key light
    key_d = bpy.data.lights.new("Key", 'AREA')
    key_d.energy   = 800
    key_d.size     = 1.5
    key_o = bpy.data.objects.new("Key", key_d)
    bpy.context.collection.objects.link(key_o)
    key_o.location       = Vector((2.5, -1.5, 3.0))
    key_o.rotation_euler = (math.radians(50), 0, math.radians(30))

    # Rim light
    rim_d = bpy.data.lights.new("Rim", 'SPOT')
    rim_d.energy     = 600
    rim_d.spot_size  = math.radians(40)
    rim_d.spot_blend = 0.3
    rim_o = bpy.data.objects.new("Rim", rim_d)
    bpy.context.collection.objects.link(rim_o)
    rim_o.location       = Vector((-2.0, 2.5, 1.5))
    rim_o.rotation_euler = (math.radians(70), 0, math.radians(-150))

    # Camera
    cam_d = bpy.data.cameras.new("Camera")
    cam_d.lens = 50
    cam_o = bpy.data.objects.new("Camera", cam_d)
    bpy.context.collection.objects.link(cam_o)
    cam_o.location       = Vector((1.8, -2.0, 0.7))
    cam_o.rotation_euler = (math.radians(82), 0, math.radians(42))
    scene.camera = cam_o


# ── ANIMATION KEYFRAMES ON CURVE HANDLES ─────────────────────────────────────
def animate_curve(curve_obj: bpy.types.Object) -> None:
    """
    Animate Bezier handle positions over 60 frames:
      Frame 1  : rest S-curve
      Frame 30 : stretched-toward-prey pose (mid point pushed further lateral)
      Frame 60 : coiled curl (tip bent back)

    In Blender, Bezier control points are keyframed via their co/handle
    data paths on the curve data block, NOT via the object transform.
    bpy.data.curves["name"].splines[0].bezier_points[idx].co

    NOTE: bpy.ops.anim.keyframe_insert_by_name doesn't work on curve point
    properties.  Use keyframe_insert(data_path=...) on the spline's point.
    """
    sp   = curve_obj.data.splines[0]
    pts  = sp.bezier_points
    half = TOTAL_LEN * 0.5

    frames = {
        1:  [(0, 0, 0),        (0.25, half, 0),          (0, TOTAL_LEN, 0)],
        30: [(0, 0, 0),        (0.55, half * 0.9, 0.15), (0.1, TOTAL_LEN, 0.05)],
        60: [(0, 0, 0),        (0.20, half * 1.05, 0),   (-0.20, TOTAL_LEN * 0.95, 0.10)],
    }

    for frame, positions in frames.items():
        bpy.context.scene.frame_set(frame)
        for i, (x, y, z) in enumerate(positions):
            pts[i].co = Vector((x, y, z))
            pts[i].keyframe_insert(data_path="co")
            # Keep handles proportional to co movement
            dx = x
            pts[i].handle_right = Vector((x + CTRL_DIST * 0.6, y + 0.12, z))
            pts[i].handle_left  = Vector((x - CTRL_DIST * 0.6, y - 0.12, z))
            pts[i].keyframe_insert(data_path="handle_right")
            pts[i].keyframe_insert(data_path="handle_left")


# ── GLB EXPORT ───────────────────────────────────────────────────────────────
def export_glb(skin_obj: bpy.types.Object) -> None:
    """
    IMPORTANT — Spline IK cannot export to GLB:
      glTF 2.0 has no equivalent of Blender's Spline IK solver.
      The exporter exports the mesh in its BIND POSE (T-pose straight tentacle)
      unless you first bake the constraint to per-bone location/rotation
      keyframes.

    For a static pose export (frame 30 = prey-reach):
    Evaluate the depsgraph at frame 30, extract the evaluated mesh, export.
    This captures the DEFORMED geometry without any rig data — correct for
    asset library preview meshes.

    For animated export: bake constraints to keyframes first:
      bpy.ops.nla.bake(frame_start=1, frame_end=60,
                       only_selected=False, visual_keying=True,
                       clear_constraints=True, use_current_action=True,
                       bake_types={'POSE'})
    Then export with export_animations=True.
    """
    bpy.context.scene.frame_set(30)
    dg       = bpy.context.evaluated_depsgraph_get()
    eval_obj = skin_obj.evaluated_get(dg)
    snap_me  = bpy.data.meshes.new_from_object(eval_obj, depsgraph=dg)

    snap_obj = bpy.data.objects.new("tentacle_skin_snap", snap_me)
    bpy.context.collection.objects.link(snap_obj)

    bpy.ops.object.select_all(action='DESELECT')
    snap_obj.select_set(True)
    bpy.context.view_layer.objects.active = snap_obj

    out_path = "//tentacle_skin.glb"
    bpy.ops.export_scene.gltf(
        filepath          = out_path,
        use_selection     = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = 'WEBP',
        export_yup          = True,
        export_apply        = True,
    )

    bpy.context.collection.objects.unlink(snap_obj)
    bpy.data.objects.remove(snap_obj, do_unlink=True)
    bpy.data.meshes.remove(snap_me, do_unlink=True)


# ── MAIN ─────────────────────────────────────────────────────────────────────
def main() -> None:
    clear_scene()

    curve_obj = build_curve()
    arm_obj   = build_armature()
    attach_spline_ik(arm_obj, curve_obj)
    skin_obj  = build_skin(arm_obj)
    bind_skin(skin_obj, arm_obj)
    build_material(skin_obj)
    setup_scene()
    animate_curve(curve_obj)

    bpy.ops.wm.save_as_mainfile(filepath="//tentacle_spline_ik.blend")
    export_glb(skin_obj)
    print("Blueprint complete — tentacle_spline_ik.blend + tentacle_skin.glb")


main()

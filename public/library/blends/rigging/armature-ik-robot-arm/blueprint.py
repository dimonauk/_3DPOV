# blends/rigging/armature-ik-robot-arm/blueprint.py
# Blender 5.1 | CC0
#
# Armature Constraints + IK — Inverse Kinematics for a Stylised Robot Arm
#
# Inverse Kinematics (IK) inverts the usual parent→child bone transform:
# instead of rotating each bone manually, you place a target object where
# the chain tip should be and let the solver compute the intermediate angles.
# Blender's IK solver is CCD (Cyclic Coordinate Descent) — a fast iterative
# method that converges well for short chains.  For long chains or tight
# constraints, FABRIK or an analytical solver may be preferable, but CCD is
# reliable for the two-joint robot-arm case here.
#
# Pole targets prevent solver ambiguity: a two-bone chain has infinitely many
# solutions (the elbow can orbit on a cone around the shoulder–wrist axis).
# A pole empty forces the elbow to point toward the pole, collapsing that
# degree of freedom to a unique, predictable pose.
#
# Outside sources:
#   Blender Manual — Inverse Kinematics
#   https://docs.blender.org/manual/en/latest/animation/armatures/posing/
#           bone_constraints/inverse_kinematics/introduction.html
#   Licence: CC-BY-SA 4.0, Blender Documentation Team
#
#   njanakiev/blender-scripting — armature + pose-mode Python patterns
#   https://github.com/njanakiev/blender-scripting
#   Licence: MIT, Nicolas Janakiev
#
#   KhronosGroup/glTF-Blender-IO — skinned-mesh GLB export
#   https://github.com/KhronosGroup/glTF-Blender-IO
#   Licence: Apache-2.0, Khronos Group
#
# Run headless:
#   blender --background --python blueprint.py

import math
import bpy
import bmesh
from mathutils import Vector
from pathlib import Path

# ── Output paths ──────────────────────────────────────────────────────────────
OUT_DIR   = Path(__file__).parent
BLEND_OUT = OUT_DIR / "robot_arm_ik.blend"
GLB_OUT   = OUT_DIR / "robot_arm_ik.glb"

# ── Arm geometry ──────────────────────────────────────────────────────────────
SHOULDER_Z   = 1.0    # world Z of shoulder joint
UPPER_LEN    = 0.40   # shoulder → elbow
LOWER_LEN    = 0.40   # elbow → wrist
ELBOW_Z      = SHOULDER_Z - UPPER_LEN
WRIST_Z      = ELBOW_Z   - LOWER_LEN
UPPER_R      = 0.065  # upper-arm tube radius
LOWER_R      = 0.055  # forearm tube radius
JOINT_R      = 0.088  # ball-joint sphere radius
SEG_N        = 12     # cylinder ring segments (12-gon = smooth at display scale)

# ── IK rig ────────────────────────────────────────────────────────────────────
# Pole sits behind the arm (−Y) at elbow height → elbow always bends outward
IK_ORBIT_R   = 0.35   # IK_Target orbits this radius in XZ plane
IK_POLE_Y    = -0.80  # pole offset in Y (negative = behind arm when arm points down)
IK_POLE_ANGLE = math.radians(-90)   # offset between bone local X and pole direction

# ── Materials ─────────────────────────────────────────────────────────────────
DARK_STEEL  = (0.07, 0.08, 0.09, 1.0)   # segment tubes
LIGHT_STEEL = (0.55, 0.58, 0.60, 1.0)   # ball joints

# ── Animation ─────────────────────────────────────────────────────────────────
ANIM_FRAMES = 60
FPS         = 24


def _reset():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for blk in (list(bpy.data.meshes) + list(bpy.data.materials)
                + list(bpy.data.armatures) + list(bpy.data.actions)):
        try: bpy.data.batch_remove([blk])
        except Exception: pass


def _mat(name, color, roughness=0.35, metallic=0.95):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Roughness'].default_value  = roughness
    bsdf.inputs['Metallic'].default_value   = metallic
    return mat


def _cylinder(bm, z_bot, z_top, r, n):
    """Capped cylinder; returns all added verts."""
    bot = [bm.verts.new((r * math.cos(2*math.pi*i/n),
                          r * math.sin(2*math.pi*i/n), z_bot)) for i in range(n)]
    top = [bm.verts.new((r * math.cos(2*math.pi*i/n),
                          r * math.sin(2*math.pi*i/n), z_top)) for i in range(n)]
    for i in range(n):
        bm.faces.new([bot[i], bot[(i+1)%n], top[(i+1)%n], top[i]])
    bm.faces.new(list(reversed(bot)))
    bm.faces.new(top)
    return bot + top


def _sphere(bm, cx, cy, cz, r, rings=5, segs=10):
    """UV sphere centred at (cx,cy,cz); returns all added verts."""
    north = bm.verts.new((cx, cy, cz + r))
    south = bm.verts.new((cx, cy, cz - r))
    rv = []
    for ring in range(1, rings):
        lat  = math.pi * ring / rings
        rz   = cz + r * math.cos(lat)
        rr   = r  * math.sin(lat)
        rv.append([bm.verts.new((cx + rr * math.cos(2*math.pi*s/segs),
                                  cy + rr * math.sin(2*math.pi*s/segs), rz))
                   for s in range(segs)])
    for s in range(segs):
        bm.faces.new([north, rv[0][(s+1)%segs], rv[0][s]])
        bm.faces.new([south, rv[-1][s], rv[-1][(s+1)%segs]])
    for ring in range(len(rv)-1):
        for s in range(segs):
            bm.faces.new([rv[ring][s], rv[ring][(s+1)%segs],
                          rv[ring+1][(s+1)%segs], rv[ring+1][s]])
    return [north, south] + [v for row in rv for v in row]


def _build_mesh(mat_seg, mat_joint):
    me  = bpy.data.meshes.new("robot_arm_mesh")
    obj = bpy.data.objects.new("robot_arm", me)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()

    # Tubes stop short of the joint radius so they don't overlap the spheres
    upper_vs  = _cylinder(bm, ELBOW_Z + JOINT_R, SHOULDER_Z - JOINT_R, UPPER_R, SEG_N)
    lower_vs  = _cylinder(bm, WRIST_Z + JOINT_R * 0.85, ELBOW_Z - JOINT_R, LOWER_R, SEG_N)
    shoulder  = _sphere(bm, 0, 0, SHOULDER_Z, JOINT_R)
    elbow     = _sphere(bm, 0, 0, ELBOW_Z,    JOINT_R)
    wrist     = _sphere(bm, 0, 0, WRIST_Z,    JOINT_R * 0.85)

    for f in bm.faces:
        f.smooth = True
    bm.to_mesh(me)
    bm.free()

    # Material slots: seg=0, joint=1
    me.materials.append(mat_seg)
    me.materials.append(mat_joint)
    # Assign by proximity to joint Z positions
    for poly in me.polygons:
        cz = poly.center.z
        joint_z = [SHOULDER_Z, ELBOW_Z, WRIST_Z]
        poly.material_index = 1 if any(abs(cz - jz) < JOINT_R * 1.3 for jz in joint_z) else 0

    # Vertex groups for armature skinning
    vg_upper = obj.vertex_groups.new(name="upper_arm")
    vg_lower = obj.vertex_groups.new(name="lower_arm")
    # Hard split at ELBOW_Z — robot joints deform crisply, no skin blending needed
    for vi, v in enumerate(me.vertices):
        if v.co.z >= ELBOW_Z:
            vg_upper.add([vi], 1.0, 'REPLACE')
        else:
            vg_lower.add([vi], 1.0, 'REPLACE')

    return obj


def _build_armature():
    arm_data = bpy.data.armatures.new("RobotArm_Armature")
    arm_data.display_type = 'STICK'
    arm_obj  = bpy.data.objects.new("RobotArm_Armature", arm_data)
    bpy.context.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj

    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_data.edit_bones

    upper = eb.new("upper_arm")
    upper.head  = Vector((0, 0, SHOULDER_Z))
    upper.tail  = Vector((0, 0, ELBOW_Z))
    upper.roll  = 0.0

    lower = eb.new("lower_arm")
    lower.head  = Vector((0, 0, ELBOW_Z))
    lower.tail  = Vector((0, 0, WRIST_Z))
    lower.roll  = 0.0
    lower.parent      = upper
    lower.use_connect = True

    bpy.ops.object.mode_set(mode='OBJECT')
    return arm_obj


def _setup_ik(arm_obj):
    # End-effector target — small sphere so it's identifiable in viewport
    ik_tgt = bpy.data.objects.new("IK_Target", None)
    ik_tgt.empty_display_type = 'SPHERE'
    ik_tgt.empty_display_size = 0.06
    ik_tgt.location = Vector((IK_ORBIT_R, 0.0, WRIST_Z))
    bpy.context.collection.objects.link(ik_tgt)

    # Pole target — arrows so elbow-direction is visually obvious
    ik_pole = bpy.data.objects.new("IK_Pole", None)
    ik_pole.empty_display_type = 'ARROWS'
    ik_pole.empty_display_size = 0.12
    ik_pole.location = Vector((0.0, IK_POLE_Y, ELBOW_Z))
    bpy.context.collection.objects.link(ik_pole)

    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='POSE')

    # IK on lower_arm tip; chain_count=2 drives lower_arm + upper_arm
    pbone = arm_obj.pose.bones["lower_arm"]
    ik             = pbone.constraints.new('INVERSE_KINEMATICS')
    ik.target      = ik_tgt
    ik.chain_count = 2
    ik.pole_target = ik_pole
    ik.pole_angle  = IK_POLE_ANGLE

    bpy.ops.object.mode_set(mode='OBJECT')
    return ik_tgt, ik_pole


def _parent_mesh(arm_obj, mesh_obj):
    # Object-level parenting + Armature modifier + vertex groups is the
    # standard glTF skinning pipeline.  parent_type='ARMATURE' instead uses
    # bone envelopes and does NOT write vertex group weights to the GLB.
    mesh_obj.parent = arm_obj
    mod = mesh_obj.modifiers.new("Armature", 'ARMATURE')
    mod.object             = arm_obj
    mod.use_vertex_groups  = True


def _animate(ik_tgt):
    sc = bpy.context.scene
    sc.render.fps   = FPS
    sc.frame_start  = 1
    sc.frame_end    = ANIM_FRAMES
    for fr in range(1, ANIM_FRAMES + 1):
        t = (fr - 1) / (ANIM_FRAMES - 1)
        angle = 2 * math.pi * t
        ik_tgt.location.x = IK_ORBIT_R * math.cos(angle)
        ik_tgt.location.z = ELBOW_Z + IK_ORBIT_R * 0.5 * math.sin(angle)
        ik_tgt.keyframe_insert('location', frame=fr)
    if ik_tgt.animation_data and ik_tgt.animation_data.action:
        for fc in ik_tgt.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'


def main():
    _reset()
    mat_seg   = _mat("robot_segment", DARK_STEEL,  roughness=0.30)
    mat_joint = _mat("robot_joint",   LIGHT_STEEL, roughness=0.15)
    mesh_obj  = _build_mesh(mat_seg, mat_joint)
    arm_obj   = _build_armature()
    ik_tgt, _ = _setup_ik(arm_obj)
    _parent_mesh(arm_obj, mesh_obj)
    _animate(ik_tgt)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
    # Export at frame 15 (arm extended sideways = most legible pose for WebXR)
    bpy.context.scene.frame_set(15)
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_OUT),
        export_format='GLB',
        export_skins=True,
        export_animations=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    print("Blueprint complete — .blend + .glb written.")


main()

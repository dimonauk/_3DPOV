"""
Armature — Bone Collections + Custom Bone Shapes: Named Control Rig Layers
Blender 5.1  ·  CC0  ·  Holoflow Studio

Technique: Blender 4.0 replaced the 32-slot bone layer bitmask with a named
BoneCollection API.  This blueprint builds a biped upper-body control shell,
organises bones into seven named collections (Root / Spine FK / Head /
Arm FK.L / Arm IK.L / Arm FK.R / Arm IK.R), and assigns custom mesh shapes to
control bones — a ring for the root, a circle for IK targets, a diamond for
pole vectors.

WHY named collections beat bone layers:
  Layers are addressed by integer index (0–31), which is opaque and fragile
  across rigs: col 0 = "controls", col 1 = "deform" is a convention that
  breaks the moment anyone opens the file without the notes.  Named collections
  are self-documenting, survive copy-paste across blend files, and can be nested
  via the parent parameter introduced in Blender 4.1 (arm.collections.new(name,
  parent=col_arm)).  In Blender 5.1 nested collections collapse in the Outliner
  — a significant ergonomic win on production rigs with 200+ bones.

WHY custom shapes matter:
  The default bone display (an octahedral spike) gives no visual cue about a
  bone's role.  A large ring on the root says "translate here"; a small circle
  on the wrist IK says "grab and drag"; a diamond on the pole vector says "push
  to steer the elbow".  Shape objects live in an excluded "SHAPES" collection —
  the armature renders them as gizmos regardless; they never appear in renders
  or exports.  pbone.use_custom_shape_bone_size = True scales the shape by the
  bone's rest length so the gizmos stay proportional as the rig scales.

GLB export:
  An armature exports as a skeleton (joints + inverse-bind matrices) in GLB.
  Custom shapes are Blender-only viewport metadata — they are silently dropped.
  The bone hierarchy, rest pose, and names travel intact, ready for VRM tooling
  or three.js SkeletonHelper attachment.

Outside sources:
  Blender Manual — Bone Collections
    https://docs.blender.org/manual/en/latest/animation/armatures/bones/bone_collections.html
    CC-BY-SA 4.0 · Blender Documentation Team
  blender-python-examples — Nathan Vegdahl
    https://github.com/nvegdahl/blender-python-examples
    MIT · Nathan Vegdahl
"""

import bpy
import bmesh
import math

# ── Parameters ─────────────────────────────────────────────────────────────────
RIG_NAME     = "RIG_character"
SHAPES_COL   = "SHAPES"
EXPORT_PATH  = "//armature_control_rig.glb"

# Shape geometry radii (Blender units; display is further scaled by bone length)
RING_R    = 1.0
CIRCLE_R  = 0.8
DIAMOND_R = 0.6
RING_SEGS = 24
CIRCLE_SEGS = 12


# ── Scene cleanup ──────────────────────────────────────────────────────────────
def _cleanup() -> None:
    for ob in list(bpy.data.objects):
        if ob.name.startswith(("RIG_", "SHAPE_")):
            bpy.data.objects.remove(ob, do_unlink=True)
    for arm in list(bpy.data.armatures):
        bpy.data.armatures.remove(arm)
    for me in list(bpy.data.meshes):
        if me.name.startswith("SHAPE_"):
            bpy.data.meshes.remove(me)
    for col in list(bpy.data.collections):
        if col.name == SHAPES_COL:
            bpy.data.collections.remove(col)


# ── Custom shape geometry helpers ──────────────────────────────────────────────
def _shapes_col() -> bpy.types.Collection:
    col = bpy.data.collections.new(SHAPES_COL)
    bpy.context.scene.collection.children.link(col)
    # exclude from view layer so shapes don't render as scene objects
    bpy.context.view_layer.layer_collection.children[SHAPES_COL].exclude = True
    return col


def _make_ring(col: bpy.types.Collection, name: str, R: float, segs: int) -> bpy.types.Object:
    bm = bmesh.new()
    vs = [bm.verts.new((R * math.cos(2*math.pi*i/segs), R * math.sin(2*math.pi*i/segs), 0.0))
          for i in range(segs)]
    for i in range(segs):
        bm.edges.new((vs[i], vs[(i+1) % segs]))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    col.objects.link(ob)
    return ob


def _make_diamond(col: bpy.types.Collection, name: str, R: float) -> bpy.types.Object:
    bm = bmesh.new()
    vs = [bm.verts.new((R * math.cos(math.pi/2 + math.pi/2*i), R * math.sin(math.pi/2 + math.pi/2*i), 0.0))
          for i in range(4)]
    for i in range(4):
        bm.edges.new((vs[i], vs[(i+1) % 4]))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    col.objects.link(ob)
    return ob


# ── Armature construction ──────────────────────────────────────────────────────
def _build_armature() -> bpy.types.Object:
    arm = bpy.data.armatures.new(RIG_NAME)
    arm.display_type = 'STICK'            # clearest display for many bones
    obj = bpy.data.objects.new(RIG_NAME, arm)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')

    def _eb(name, head, tail, parent=None, connected=False):
        eb = arm.edit_bones.new(name)
        eb.head, eb.tail = head, tail
        if parent:
            eb.parent = arm.edit_bones[parent]
            eb.use_connect = connected
        return eb

    # Spine chain — vertical, +Z up
    _eb("root",   (0,0,0),    (0,0,0.40))
    _eb("hips",   (0,0,0.90), (0,0,1.05), "root")
    _eb("spine",  (0,0,1.05), (0,0,1.40), "hips",  True)
    _eb("chest",  (0,0,1.40), (0,0,1.75), "spine", True)
    _eb("neck",   (0,0,1.75), (0,0,1.90), "chest", True)
    _eb("head",   (0,0,1.90), (0,0,2.25), "neck",  True)

    # Left arm — extends on −X
    _eb("shoulder.L",  (-0.05,0,1.70), (-0.25,0,1.70), "chest")
    _eb("upper_arm.L", (-0.25,0,1.70), (-0.65,0,1.52), "shoulder.L", True)
    _eb("lower_arm.L", (-0.65,0,1.52), (-1.00,0,1.35), "upper_arm.L", True)
    _eb("hand.L",      (-1.00,0,1.35), (-1.18,0,1.29), "lower_arm.L", True)

    # Right arm — mirror on +X
    _eb("shoulder.R",  (0.05,0,1.70),  (0.25,0,1.70),  "chest")
    _eb("upper_arm.R", (0.25,0,1.70),  (0.65,0,1.52),  "shoulder.R", True)
    _eb("lower_arm.R", (0.65,0,1.52),  (1.00,0,1.35),  "upper_arm.R", True)
    _eb("hand.R",      (1.00,0,1.35),  (1.18,0,1.29),  "lower_arm.R", True)

    # IK targets — floating (no parent), one bone length tall
    _eb("ctrl_ik_wrist.L", (-1.00,0,1.35), (-1.00,0,1.15))
    _eb("ctrl_ik_pole.L",  (-0.65,0.55,1.52), (-0.65,0.55,1.72))
    _eb("ctrl_ik_wrist.R", (1.00,0,1.35),  (1.00,0,1.15))
    _eb("ctrl_ik_pole.R",  (0.65,0.55,1.52),  (0.65,0.55,1.72))

    bpy.ops.object.mode_set(mode='OBJECT')

    # ── Bone Collections (Blender 4.0+ API) ───────────────────────────────────
    # Remove the auto-created default collection before adding named ones.
    for c in list(arm.collections):
        arm.collections.remove(c)

    col_root  = arm.collections.new("Root")
    col_spine = arm.collections.new("Spine FK")
    col_head  = arm.collections.new("Head")
    col_fk_l  = arm.collections.new("Arm FK.L")
    col_ik_l  = arm.collections.new("Arm IK.L")
    col_fk_r  = arm.collections.new("Arm FK.R")
    col_ik_r  = arm.collections.new("Arm IK.R")

    # Assigning by bone object (works in Object mode for armature.bones)
    col_root.assign(arm.bones["root"])
    col_root.assign(arm.bones["hips"])

    for bn in ("spine", "chest", "neck"):
        col_spine.assign(arm.bones[bn])

    col_head.assign(arm.bones["head"])

    for bn in ("shoulder.L", "upper_arm.L", "lower_arm.L", "hand.L"):
        col_fk_l.assign(arm.bones[bn])

    col_ik_l.assign(arm.bones["ctrl_ik_wrist.L"])
    col_ik_l.assign(arm.bones["ctrl_ik_pole.L"])

    for bn in ("shoulder.R", "upper_arm.R", "lower_arm.R", "hand.R"):
        col_fk_r.assign(arm.bones[bn])

    col_ik_r.assign(arm.bones["ctrl_ik_wrist.R"])
    col_ik_r.assign(arm.bones["ctrl_ik_pole.R"])

    return obj


# ── Custom shapes ──────────────────────────────────────────────────────────────
def _apply_shapes(rig_obj: bpy.types.Object, sh_ring, sh_circle, sh_diamond) -> None:
    bpy.context.view_layer.objects.active = rig_obj
    bpy.ops.object.mode_set(mode='POSE')

    def _set(bone_name, shape_ob, scale=(1,1,1)):
        pb = rig_obj.pose.bones[bone_name]
        pb.custom_shape = shape_ob
        pb.custom_shape_scale_xyz = scale
        pb.use_custom_shape_bone_size = True

    _set("root",            sh_ring,   (1.6, 1.6, 1.6))  # large ground ring
    _set("hips",            sh_ring,   (0.9, 0.9, 0.9))  # pelvis ring
    _set("ctrl_ik_wrist.L", sh_circle, (1.0, 1.0, 1.0))
    _set("ctrl_ik_wrist.R", sh_circle, (1.0, 1.0, 1.0))
    _set("ctrl_ik_pole.L",  sh_diamond,(0.8, 0.8, 0.8))
    _set("ctrl_ik_pole.R",  sh_diamond,(0.8, 0.8, 0.8))

    bpy.ops.object.mode_set(mode='OBJECT')


# ── GLB export ─────────────────────────────────────────────────────────────────
def _export_glb() -> None:
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(EXPORT_PATH),
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_draco_mesh_compression_enable=False,  # skeleton only — no mesh to compress
    )


# ── Main ───────────────────────────────────────────────────────────────────────
def main() -> None:
    _cleanup()

    shapes_collection = _shapes_col()
    sh_ring   = _make_ring(shapes_collection,   "SHAPE_root_ring",   RING_R,   RING_SEGS)
    sh_circle = _make_ring(shapes_collection,   "SHAPE_ik_circle",   CIRCLE_R, CIRCLE_SEGS)
    sh_diamond = _make_diamond(shapes_collection, "SHAPE_pole_diamond", DIAMOND_R)

    rig_obj = _build_armature()
    _apply_shapes(rig_obj, sh_ring, sh_circle, sh_diamond)

    # Scene camera for record.py
    bpy.context.scene.frame_set(1)
    _export_glb()
    print("[blueprint] armature_control_rig.glb written.")


if __name__ == "__main__":
    main()

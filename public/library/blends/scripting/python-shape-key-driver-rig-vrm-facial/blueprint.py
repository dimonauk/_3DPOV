"""
Blueprint: Shape Key Driver Rig — Bone Rotation → Morph Target
            VRM Facial Animation · Blender 5.1
================================================================
Technique: Python wires bone local-rotation channels to shape key
values via scripted drivers so a pose automatically morphs the
face without hand-keying every shape.  VRM 1.0 expression blocks
map directly to shape key value; GLB exporters need the live
driver values baked to keyframes first (drivers are Blender-only).

Outcome: face_driver_rig.blend + face_driver_rig.glb
  – three driven shape keys (brow_raise_l, brow_raise_r, cheek_puff)
  – one corrective key (sad_corrective) gated on both brows down
  – 90-frame animation, shape key values baked to keyframes
  – GLB with morph targets readable by three-vrm / Three.js
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ── constants ──────────────────────────────────────────────────────────────
MESH_NAME     = "face_mesh"
ARM_NAME      = "face_rig"
BONE_BROW_L   = "brow_l"
BONE_BROW_R   = "brow_r"
BONE_CHEEK_L  = "cheek_l"

SK_BASIS      = "Basis"
SK_BROW_L     = "brow_raise_l"
SK_BROW_R     = "brow_raise_r"
SK_CHEEK      = "cheek_puff"
SK_COMBO      = "sad_corrective"   # activates only when BOTH brows drop

HALF_PI       = math.pi / 2        # 90° — bone rotation that gives value 1.0
FRAME_END     = 90                 # neutral→raise (1-30), raise (30-60), sad (60-90)


# ── helpers ────────────────────────────────────────────────────────────────
def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()


# ── step 1: low-poly face proxy ────────────────────────────────────────────
def build_face_mesh() -> bpy.types.Object:
    """UV sphere with 16×8 poles.  Real pipeline: swap for imported VRM base."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=8, radius=1.0)
    me = bpy.data.meshes.new(MESH_NAME)
    bm.to_mesh(me); bm.free()
    obj = bpy.data.objects.new(MESH_NAME, me)
    bpy.context.collection.objects.link(obj)
    return obj


# ── step 2: shape keys ─────────────────────────────────────────────────────
def add_shape_keys(obj: bpy.types.Object) -> None:
    """
    Basis must be index 0; all other keys store DELTA from Basis.
    Blender evaluates shape keys additively: result_vert =
      basis_co + Σ(sk.value × (sk.data[i].co − basis_co)).

    Real workflow: sculpt deltas in Edit mode with sk active.
    Here, nudge a few verts programmatically for a testable result.
    """
    obj.shape_key_add(name=SK_BASIS,  from_mix=False)
    brow_l = obj.shape_key_add(name=SK_BROW_L, from_mix=False)
    brow_r = obj.shape_key_add(name=SK_BROW_R, from_mix=False)
    cheek  = obj.shape_key_add(name=SK_CHEEK,  from_mix=False)
    combo  = obj.shape_key_add(name=SK_COMBO,  from_mix=False)

    basis_co = [v.co.copy() for v in obj.data.vertices]

    # (shape_key, [(vert_index, dx, dy, dz), …])
    deltas = [
        (brow_l, [(0,  0.0,  0.0,  0.18)]),    # left brow up
        (brow_r, [(1,  0.0,  0.0,  0.18)]),    # right brow up
        (cheek,  [(2,  0.09, 0.0,  0.03)]),    # cheek puff outward
        (combo,  [(0,  0.0,  0.0, -0.14),      # both brows droop (sad)
                  (1,  0.0,  0.0, -0.14)]),
    ]
    for sk, offsets in deltas:
        for vi, dx, dy, dz in offsets:
            co = basis_co[vi].copy()
            co.x += dx; co.y += dy; co.z += dz
            sk.data[vi].co = co


# ── step 3: armature with brow + cheek bones ──────────────────────────────
def build_armature() -> bpy.types.Object:
    arm_data = bpy.data.armatures.new(ARM_NAME)
    arm_obj  = bpy.data.objects.new(ARM_NAME, arm_data)
    bpy.context.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj

    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_data.edit_bones

    def add_bone(name, head, tail):
        b = eb.new(name)
        b.head, b.tail = head, tail
        return b

    add_bone(BONE_BROW_L,  Vector((-0.30, 0.0, 0.70)), Vector((-0.30, 0.15, 0.70)))
    add_bone(BONE_BROW_R,  Vector(( 0.30, 0.0, 0.70)), Vector(( 0.30, 0.15, 0.70)))
    add_bone(BONE_CHEEK_L, Vector((-0.50, 0.0, 0.30)), Vector((-0.50, 0.15, 0.30)))

    bpy.ops.object.mode_set(mode='OBJECT')
    return arm_obj


# ── step 4: single-bone scripted driver ───────────────────────────────────
def add_driver(sk, arm_obj, bone_name: str, transform_type: str,
               expression: str) -> None:
    """
    expression uses variables 'rot' (bone channel, radians) and 'hp'
    (half_pi = π/2, stored as a scene custom property to avoid importing
    math inside the driver sandbox).

    Clamp pattern:  "clamp(-rot/hp, 0.0, 1.0)"
      – positive bone rotation (tip forward) → rot>0 → -rot<0 → clamped to 0
      – negative rotation (tip back/up) → -rot>0 → non-zero morph
    """
    bpy.context.scene["hp"] = HALF_PI   # one-time write; safe to repeat

    fc  = sk.driver_add("value")
    drv = fc.driver
    drv.type = 'SCRIPTED'

    v_rot = drv.variables.new()
    v_rot.name = "rot"
    v_rot.type = 'TRANSFORMS'
    t = v_rot.targets[0]
    t.id, t.bone_target = arm_obj, bone_name
    t.transform_type, t.transform_space = transform_type, 'LOCAL_SPACE'

    v_hp = drv.variables.new()
    v_hp.name = "hp"
    v_hp.type = 'SINGLE_PROP'
    v_hp.targets[0].id_type   = 'SCENE'
    v_hp.targets[0].id        = bpy.context.scene
    v_hp.targets[0].data_path = '["hp"]'

    drv.expression = expression
    fc.update()


# ── step 5: corrective driver (two-bone product) ──────────────────────────
def add_corrective_driver(sk, arm_obj) -> None:
    """
    sad_corrective fires ONLY when BOTH brows rotate downward together.
    Product-of-clamps: max(0, -rot_l/hp) * max(0, -rot_r/hp).
    Each factor independently clamps to [0,1]; their product is 1.0
    only when both bones are at -90°, 0.25 when each is at -45°.
    """
    bpy.context.scene["hp"] = HALF_PI

    fc  = sk.driver_add("value")
    drv = fc.driver
    drv.type = 'SCRIPTED'

    for var_name, bone in [("rot_l", BONE_BROW_L), ("rot_r", BONE_BROW_R)]:
        v = drv.variables.new()
        v.name = var_name
        v.type = 'TRANSFORMS'
        t = v.targets[0]
        t.id, t.bone_target   = arm_obj, bone
        t.transform_type      = 'ROT_X'
        t.transform_space     = 'LOCAL_SPACE'

    v_hp = drv.variables.new()
    v_hp.name = "hp"
    v_hp.type = 'SINGLE_PROP'
    v_hp.targets[0].id_type   = 'SCENE'
    v_hp.targets[0].id        = bpy.context.scene
    v_hp.targets[0].data_path = '["hp"]'

    drv.expression = "max(0.0, -rot_l/hp) * max(0.0, -rot_r/hp)"
    fc.update()


# ── step 6: bake driven values to keyframes for GLB ──────────────────────
def bake_sk_drivers(obj: bpy.types.Object, frame_start: int,
                    frame_end: int) -> None:
    """
    GLB / glTF 2.0 does not evaluate Blender drivers at runtime.
    Sample the live (depsgraph-evaluated) value each frame and write
    an explicit morph-weight keyframe.  Three.js reads these as
    geometry.morphAttributes weight tracks.
    """
    scene = bpy.context.scene
    key   = obj.data.shape_keys
    names = [SK_BROW_L, SK_BROW_R, SK_CHEEK, SK_COMBO]

    for f in range(frame_start, frame_end + 1):
        scene.frame_set(f)
        bpy.context.view_layer.update()
        for name in names:
            sk = key.key_blocks.get(name)
            if sk:
                sk.keyframe_insert("value", frame=f)


# ── step 7: pose animation keyframes ──────────────────────────────────────
def animate_rig(arm_obj: bpy.types.Object) -> None:
    """Three-beat arc: neutral(1) → raise(30) → hold(60) → sad(90)."""
    arm_obj.rotation_mode = 'XYZ'
    bpy.context.scene.frame_end = FRAME_END

    def key_bone(bone_name: str, frame: int, rot_x=0.0, rot_y=0.0):
        pb = arm_obj.pose.bones[bone_name]
        pb.rotation_mode     = 'XYZ'
        pb.rotation_euler[0] = rot_x
        pb.rotation_euler[1] = rot_y
        pb.keyframe_insert("rotation_euler", frame=frame)

    for bone in [BONE_BROW_L, BONE_BROW_R, BONE_CHEEK_L]:
        key_bone(bone, 1)           # neutral rest

    # Brows raise — bone rotates −X (tip back toward viewer)
    for bone in [BONE_BROW_L, BONE_BROW_R]:
        key_bone(bone, 30, rot_x=-HALF_PI)
    key_bone(BONE_CHEEK_L, 30, rot_y=HALF_PI)  # cheek puffs out

    # All return to neutral at frame 60 then droop sad
    for bone in [BONE_BROW_L, BONE_BROW_R, BONE_CHEEK_L]:
        key_bone(bone, 60)

    for bone in [BONE_BROW_L, BONE_BROW_R]:
        key_bone(bone, 90, rot_x=HALF_PI * 0.85)   # droop → sad_corrective fires


# ── step 8: GLB export ────────────────────────────────────────────────────
def export_glb(face_obj: bpy.types.Object) -> None:
    """
    export_morph=True: shape keys → glTF morph targets (KHR_geometry_morphs).
    export_apply=False: MUST be False for skinned rigs (True flattens the mesh).
    export_animations=True + export_nla_strips=True: baked shape key fcurves
      become morph weight animation tracks in the GLB.
    """
    bpy.ops.object.select_all(action='DESELECT')
    face_obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath("//face_driver_rig.glb"),
        use_selection=True,
        export_format='GLB',
        export_morph=True,
        export_animations=True,
        export_nla_strips=False,      # shape key fcurves on the mesh object
        export_apply=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_yup=True,
    )
    print("[holoflow] written: face_driver_rig.glb")


# ── main ──────────────────────────────────────────────────────────────────
def main():
    clear_scene()

    face_obj = build_face_mesh()
    add_shape_keys(face_obj)
    arm_obj  = build_armature()

    kb = face_obj.data.shape_keys.key_blocks
    # Raise: bone −ROT_X → clamp(-rot/hp, 0, 1) → value rises
    add_driver(kb[SK_BROW_L], arm_obj, BONE_BROW_L, 'ROT_X',
               "clamp(-rot/hp, 0.0, 1.0)")
    add_driver(kb[SK_BROW_R], arm_obj, BONE_BROW_R, 'ROT_X',
               "clamp(-rot/hp, 0.0, 1.0)")
    add_driver(kb[SK_CHEEK],  arm_obj, BONE_CHEEK_L, 'ROT_Y',
               "clamp(rot/hp, 0.0, 1.0)")
    add_corrective_driver(kb[SK_COMBO], arm_obj)

    bpy.context.scene.frame_start = 1
    animate_rig(arm_obj)

    # Sample live driver values every frame → explicit morph weight keyframes
    bake_sk_drivers(face_obj, 1, FRAME_END)

    bpy.ops.wm.save_as_mainfile(
        filepath=bpy.path.abspath("//face_driver_rig.blend"))
    export_glb(face_obj)


main()

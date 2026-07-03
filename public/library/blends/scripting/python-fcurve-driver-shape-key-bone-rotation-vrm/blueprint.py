"""
Python Driver API — Bone-Rotation-to-Shape-Key Corrective Blend Shape
Blender 5.1  |  CC0  |  Holoflow Studio
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TECHNIQUE
A corrective shape key fires when a joint reaches a critical angle — the
classic elbow-pinch problem where skin collapses at extreme bend.  Blender's
Driver system wires any RNA property to a Python expression referencing bone
transforms, with no hand-keyed animation required.

Pipeline:
  1. driver_add() attaches a Driver FCurve to the shape key's value RNA path.
  2. A TRANSFORMS DriverVariable reads the forearm bone's LOCAL ROT_X.
  3. A SCRIPTED expression normalises the rotation into [0, 1].
  4. bake_driver() walks every frame, queries the evaluated depsgraph, and
     writes explicit keyframes so the GLB morph-target exporter sees the values.

WHY driver_add() TARGETS THE Key ID BLOCK, NOT THE OBJECT
Shape keys live on a bpy.types.Key data block (mesh_obj.data.shape_keys),
not on the Object.  driver_add(path) must be called on the Key because that
is where the animatable RNA lives.  Calling it on the Object would require a
full data-path prefix like 'data.shape_keys.key_blocks[...]', which bpy does
not accept on the Object in practice.

WHY LOCAL_SPACE
LOCAL_SPACE gives the bone's angle relative to its parent — the joint angle
you actually want.  WORLD_SPACE folds in every ancestor; a tilted shoulder
would shift the corrective even when the elbow is straight.

WHY SCRIPTED, NOT AVERAGE/SUM
Only SCRIPTED supports arbitrary remapping.  max(0, min(1, ...)) is a linear
ramp clamped to [0, 1]; no built-in blend mode expresses that.

WHY BAKE BEFORE GLB EXPORT
The GLTF exporter samples shape key values from keyframed FCurves; it does
not evaluate live drivers.  Baking converts the driver output to per-frame
keyframes that travel correctly into the GLB morph animation clip.

RUN
    blender --background --python blueprint.py
OUTPUTS
    elbow_corrective_rig.blend
    elbow_corrective_rig_baked.glb  (Draco 6, +Y up, morph targets)

Outside source — Blender Manual: Drivers Panel
  https://docs.blender.org/manual/en/5.1/animation/drivers/drivers_panel.html
  Licence: CC BY-SA 4.0  ·  © Blender Foundation  ·  sibling: github.com/blender/blender
Outside source — Blender Python API: bpy.types.FCurve
  https://docs.blender.org/api/current/bpy.types.FCurve.html
  Licence: CC BY-SA 4.0  ·  © Blender Foundation  ·  sibling: github.com/blender/blender
"""

import bpy
import math
import bmesh

# ── CONSTANTS ──────────────────────────────────────────────────────────────────
OUTPUT_BLEND = "//elbow_corrective_rig.blend"
OUTPUT_GLB   = "//elbow_corrective_rig_baked.glb"
ARM_NAME     = "vrm_arm"
MESH_NAME    = "elbow_skin"
SK_NAME      = "elbow_corrective"    # shape key to drive
BONE_UPPER   = "upper_arm"
BONE_FORE    = "forearm"

BONE_LENGTH  = 0.35                  # each bone 35 cm — human-scale VRM forearm
BEND_REST    = -0.20                 # ROT_X at which corrective begins (rad)
BEND_FULL    = -math.pi / 2         # ROT_X at full-bend → corrective = 1.0
BAKE_START   = 1
BAKE_END     = 60                    # frames 1-30 wind to full bend, 31-60 hold


# ── SCENE ──────────────────────────────────────────────────────────────────────
def clear_scene():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for arm in list(bpy.data.armatures):
        bpy.data.armatures.remove(arm)
    for me in list(bpy.data.meshes):
        bpy.data.meshes.remove(me)


# ── ARMATURE ──────────────────────────────────────────────────────────────────
def build_armature():
    """Two-bone arm: upper_arm vertical (+Z), forearm co-linear at rest."""
    bpy.ops.object.armature_add(enter_editmode=True)
    arm_obj      = bpy.context.active_object
    arm_obj.name = ARM_NAME
    arm_obj.data.name = ARM_NAME

    eb = arm_obj.data.edit_bones
    eu = eb[0]
    eu.name = BONE_UPPER
    eu.head = (0, 0, 0)
    eu.tail = (0, 0, BONE_LENGTH)

    ef = eb.new(BONE_FORE)
    ef.head        = (0, 0, BONE_LENGTH)
    ef.tail        = (0, 0, BONE_LENGTH * 2)
    ef.parent      = eu
    ef.use_connect = True   # connected child → elbow pivot at upper tail

    bpy.ops.object.editmode_toggle()
    return arm_obj


# ── MESH + SHAPE KEY ──────────────────────────────────────────────────────────
def build_elbow_mesh():
    """
    7-ring cylinder sleeve spanning both bones; shape key bows out the elbow
    crease rings to pre-fill the volume that collapses at full bend.
    """
    bm   = bmesh.new()
    SEGS = 8
    RADIUS = 0.055

    z_positions = [
        0.0,
        BONE_LENGTH * 0.33,
        BONE_LENGTH * 0.67,        # just below elbow
        BONE_LENGTH * 1.00,        # elbow crease
        BONE_LENGTH * 1.33,        # just above elbow exit
        BONE_LENGTH * 1.67,
        BONE_LENGTH * 2.00,
    ]

    rings = []
    for z in z_positions:
        ring = []
        for i in range(SEGS):
            a = math.tau * i / SEGS
            v = bm.verts.new((RADIUS * math.cos(a), RADIUS * math.sin(a), z))
            ring.append(v)
        rings.append(ring)

    bm.verts.ensure_lookup_table()

    # Collect elbow crease data before to_mesh so BMVerts remain valid
    elbow_indices = [3, 4]   # indices into z_positions that straddle the crease
    elbow_vdata = []         # (vert_index, co_x, co_y, co_z)
    for ri in elbow_indices:
        for v in rings[ri]:
            elbow_vdata.append((v.index, v.co.x, v.co.y, v.co.z))

    for r in range(len(rings) - 1):
        for i in range(SEGS):
            j = (i + 1) % SEGS
            bm.faces.new([rings[r][i], rings[r][j], rings[r+1][j], rings[r+1][i]])

    me = bpy.data.meshes.new(MESH_NAME)
    bm.to_mesh(me)
    bm.free()

    obj = bpy.data.objects.new(MESH_NAME, me)
    bpy.context.scene.collection.objects.link(obj)

    # Basis + corrective shape keys
    obj.shape_key_add(name="Basis", from_mix=False)
    sk_corr = obj.shape_key_add(name=SK_NAME, from_mix=False)
    sk_corr.value = 0.0
    sk_corr.slider_max = 1.0

    # Displace crease rings: bow outward radially + -Y (front of joint)
    for vi, vx, vy, vz in elbow_vdata:
        sp = sk_corr.data[vi]
        r  = math.sqrt(vx * vx + vy * vy)
        nx, ny = (vx / r, vy / r) if r > 1e-9 else (0.0, 1.0)
        sp.co.x = vx + nx * 0.013
        sp.co.y = vy + ny * 0.013 - 0.016   # push forward on -Y face
        sp.co.z = vz

    return obj


# ── VERTEX GROUPS + ARMATURE MODIFIER ─────────────────────────────────────────
def bind_to_armature(arm_obj, mesh_obj):
    """Linear envelope weights; upper fades to forearm smoothly at elbow."""
    total_z  = BONE_LENGTH * 2.0
    upper_vg = mesh_obj.vertex_groups.new(name=BONE_UPPER)
    fore_vg  = mesh_obj.vertex_groups.new(name=BONE_FORE)

    for v in mesh_obj.data.vertices:
        t       = v.co.z / total_z           # 0 = shoulder, 1 = wrist
        w_upper = max(0.0, min(1.0, 1.0 - t))
        w_fore  = max(0.0, min(1.0, t))
        s       = w_upper + w_fore + 1e-9   # always sums to 1.0
        upper_vg.add([v.index], w_upper / s, 'REPLACE')
        fore_vg.add( [v.index], w_fore  / s, 'REPLACE')

    mod = mesh_obj.modifiers.new("Armature", 'ARMATURE')
    mod.object          = arm_obj
    mod.use_vertex_groups = True


# ── DRIVER ────────────────────────────────────────────────────────────────────
def build_driver(arm_obj, mesh_obj):
    """
    Wire SK_NAME.value to a SCRIPTED driver reading forearm LOCAL ROT_X.

    driver_add() must target mesh_obj.data.shape_keys (the Key ID block).
    The path argument is an RNA sub-path relative to that block.
    """
    key_id   = mesh_obj.data.shape_keys
    fc       = key_id.driver_add(f'key_blocks["{SK_NAME}"].value')
    drv      = fc.driver
    drv.type = 'SCRIPTED'

    # Linear ramp: BEND_REST → BEND_FULL maps to 0 → 1, clamped at both ends
    r0 = round(BEND_REST, 5)
    r1 = round(BEND_FULL, 5)
    drv.expression = f"max(0.0, min(1.0, (bend - {r0}) / ({r1} - {r0})))"

    var                 = drv.variables.new()
    var.name            = "bend"
    var.type            = 'TRANSFORMS'
    tgt                 = var.targets[0]
    tgt.id              = arm_obj    # armature Object, not PoseBone
    tgt.bone_target     = BONE_FORE
    tgt.transform_type  = 'ROT_X'
    tgt.transform_space = 'LOCAL_SPACE'


# ── FOREARM ANIMATION ─────────────────────────────────────────────────────────
def animate_forearm(arm_obj):
    """Keyframe forearm: straight (frame 1) → full bend (frame 30) → hold (60)."""
    if not arm_obj.animation_data:
        arm_obj.animation_data_create()
    pb              = arm_obj.pose.bones[BONE_FORE]
    pb.rotation_mode = 'XYZ'

    for frame, angle in [(1, 0.0), (30, BEND_FULL), (60, BEND_FULL)]:
        bpy.context.scene.frame_set(frame)
        pb.rotation_euler.x = angle
        pb.keyframe_insert(data_path='rotation_euler', index=0, frame=frame)


# ── BAKE DRIVER TO KEYFRAMES ──────────────────────────────────────────────────
def bake_driver(mesh_obj):
    """
    Evaluate the depsgraph at each frame, read the resolved shape key value,
    write it as an explicit keyframe, then remove the live driver.

    The GLTF exporter reads sampled FCurve keyframes for morph targets.
    It does not call bpy.context.evaluated_depsgraph_get() itself, so a live
    driver that is never baked will export as all-zero morph weights.
    """
    scene  = bpy.context.scene
    key_id = mesh_obj.data.shape_keys
    sk     = key_id.key_blocks[SK_NAME]

    for frame in range(BAKE_START, BAKE_END + 1):
        scene.frame_set(frame)
        dg        = bpy.context.evaluated_depsgraph_get()
        eval_obj  = mesh_obj.evaluated_get(dg)
        baked_val = eval_obj.data.shape_keys.key_blocks[SK_NAME].value
        sk.value  = baked_val
        sk.keyframe_insert(data_path='value', frame=frame)

    # Remove live driver — action FCurves are now the sole source of truth
    key_id.driver_remove(f'key_blocks["{SK_NAME}"].value')


# ── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    clear_scene()
    scene             = bpy.context.scene
    scene.frame_start = BAKE_START
    scene.frame_end   = BAKE_END

    arm_obj  = build_armature()
    mesh_obj = build_elbow_mesh()
    bind_to_armature(arm_obj, mesh_obj)
    build_driver(arm_obj, mesh_obj)
    animate_forearm(arm_obj)
    bake_driver(mesh_obj)

    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUTPUT_BLEND))

    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUTPUT_GLB),
        export_format='GLB',
        export_apply=False,          # keep armature modifier live (bones travel)
        export_yup=True,
        export_morph=True,           # shape keys → morph targets in GLB
        export_morph_normal=False,
        export_animations=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        use_selection=False,
    )
    print(f"[elbow-driver] Saved {OUTPUT_BLEND}")
    print(f"[elbow-driver] Exported {OUTPUT_GLB}")
    print("  1 corrective shape key · 60 baked morph keyframes · Draco 6")


if __name__ == '__main__':
    main()

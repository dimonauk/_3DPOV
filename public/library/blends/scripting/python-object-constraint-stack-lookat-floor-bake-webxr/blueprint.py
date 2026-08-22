# ============================================================
# TECHNIQUE — Scripted Constraint Stack: TRACK_TO + FLOOR
#             Manual bake → clean GLB for WebXR
# ============================================================
# WHY constraints over direct keyframing?
# TRACK_TO keeps an object facing a target procedurally — change the
# target path and all frames update.  FLOOR prevents penetration without
# physics overhead.  The insight: Blender evaluates constraints at
# depsgraph evaluation time, not at keyframe-write time.  To get
# constraint-resolved positions into keyframes we use a MANUAL BAKE:
# step each frame, call evaluated_get(depsgraph) to read the post-
# constraint matrix_world, then write those values back onto the source
# object and insert keyframes.  This is context-free and works headlessly
# unlike bpy.ops.nla.bake() which polls for a VIEW_3D context.
#
# CONSTRAINT STACK ORDER matters: constraints evaluate top→bottom in
# bpy.types.Object.constraints (index 0 first).  TRACK_TO first,
# FLOOR second means the floor offset is applied AFTER the look-at
# rotation — correct behaviour.  Reversing produces penetration because
# the floor lifts the sphere before the look-at re-positions it.
# ============================================================

import bpy
import bmesh
import math
from mathutils import Vector, Matrix

# ── Named constants ───────────────────────────────────────────────────────────
SCENE_NAME   = "HoloflowConstraintDemo"
HEAD_NAME    = "hf_head"
TARGET_NAME  = "hf_target"
GROUND_NAME  = "hf_ground"
SPHERE_R     = 0.4          # metres
GROUND_HALF  = 3.0
TARGET_RADIUS = 1.6         # circular path radius
TARGET_HEIGHT = 0.5         # height of target empty
FRAME_START  = 1
FRAME_END    = 60
FPS          = 24
EXPORT_PATH  = "//constraint_baked.glb"


# ── 1. Clean scene ────────────────────────────────────────────────────────────
def reset_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes) + list(bpy.data.objects) + list(bpy.data.cameras):
        try:
            bpy.data.batch_remove([block])
        except Exception:
            pass

reset_scene()
scene = bpy.context.scene
scene.frame_start = FRAME_START
scene.frame_end   = FRAME_END
scene.render.fps  = FPS


# ── 2. Ground plane ───────────────────────────────────────────────────────────
mesh_g = bpy.data.meshes.new(GROUND_NAME)
obj_g  = bpy.data.objects.new(GROUND_NAME, mesh_g)
scene.collection.objects.link(obj_g)

bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=GROUND_HALF)
bm.to_mesh(mesh_g)
bm.free()
# Ground sits at Z=0; the FLOOR constraint will push the sphere up by
# its radius so the bottom of the sphere rests exactly on this plane.
obj_g.location = (0, 0, 0)


# ── 3. Head sphere ────────────────────────────────────────────────────────────
mesh_h = bpy.data.meshes.new(HEAD_NAME)
obj_h  = bpy.data.objects.new(HEAD_NAME, mesh_h)
scene.collection.objects.link(obj_h)

bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=8, radius=SPHERE_R)
for face in bm.faces:
    face.smooth = True
bm.to_mesh(mesh_h)
bm.free()
obj_h.location = (0, 0, SPHERE_R)   # resting on ground


# ── 4. Target empty on a circular path ───────────────────────────────────────
obj_t = bpy.data.objects.new(TARGET_NAME, None)  # None → Empty display
obj_t.empty_display_type = 'ARROWS'
obj_t.empty_display_size = 0.2
scene.collection.objects.link(obj_t)

# Circular path via direct FCurve insertion — no UI context needed.
obj_t.animation_data_create()
action = bpy.data.actions.new(name="TargetCircle")
obj_t.animation_data.action = action

for axis_idx, trig_fn in enumerate([math.cos, math.sin]):
    fc = action.fcurves.new(data_path='location', index=axis_idx)
    fc.keyframe_points.add(count=FRAME_END - FRAME_START + 1)
    for i, frame in enumerate(range(FRAME_START, FRAME_END + 1)):
        t = (frame - FRAME_START) / max(FRAME_END - FRAME_START, 1)
        angle = t * 2 * math.pi          # full revolution over clip length
        val   = TARGET_RADIUS * trig_fn(angle)
        kp    = fc.keyframe_points[i]
        kp.co = (float(frame), val)
        kp.interpolation = 'LINEAR'
    fc.update()

# Z axis stays constant — insert two keyframes at fixed height.
fc_z = action.fcurves.new(data_path='location', index=2)
fc_z.keyframe_points.add(count=2)
fc_z.keyframe_points[0].co = (float(FRAME_START), TARGET_HEIGHT)
fc_z.keyframe_points[1].co = (float(FRAME_END),   TARGET_HEIGHT)
for kp in fc_z.keyframe_points:
    kp.interpolation = 'LINEAR'
fc_z.update()


# ── 5. Constraint stack on the head sphere ────────────────────────────────────
# Index 0: TRACK_TO — look at the circling target.
ct = obj_h.constraints.new('TRACK_TO')
ct.name          = "LookAt_Target"
ct.target        = obj_t
ct.track_axis    = 'TRACK_NEGATIVE_Z'
# WHY TRACK_NEGATIVE_Z?  Camera and eyeball conventions use -Z as the
# forward-looking axis in Blender.  Objects exported via GLB inherit the
# same local-space convention, so TRACK_NEGATIVE_Z matches what the
# Three.js Object3D.lookAt() method does in +Y-up space.
ct.up_axis       = 'UP_Y'

# Index 1: FLOOR — prevent the sphere from penetrating the ground.
cf = obj_h.constraints.new('FLOOR')
cf.name          = "FloorContact"
cf.target        = obj_g
cf.floor_location = 'FLOOR_Z'
# WHY index 1 (after TRACK_TO)?
#   FLOOR lifts the sphere by offsetting its world Z after the rotation
#   from TRACK_TO has already been applied.  FLOOR evaluated first would
#   lift the sphere, then TRACK_TO would introduce tilt that shifts Z
#   again — a single-frame artefact that disappears when constraints are
#   cleared and is harmless here, but bad practice in production rigs.
cf.offset        = 0.0     # no gap between sphere bottom and ground


# ── 6. Manual constraint bake (context-free) ─────────────────────────────────
# bpy.ops.nla.bake() requires a VIEW_3D space + OBJECT mode context.
# The manual approach is identical in result but runs from the Script Editor
# or headlessly: per-frame, evaluate the depsgraph, read post-constraint
# matrix_world from the evaluated copy, decompose, write to source, keyframe.

obj_h.animation_data_create()
bake_action = bpy.data.actions.new("hf_head_baked")
obj_h.animation_data.action = bake_action
obj_h.rotation_mode = 'QUATERNION'

for frame in range(FRAME_START, FRAME_END + 1):
    scene.frame_set(frame)
    bpy.context.view_layer.update()

    depsgraph = bpy.context.evaluated_depsgraph_get()
    obj_eval  = obj_h.evaluated_get(depsgraph)
    mat       = obj_eval.matrix_world.copy()
    loc, rot, _ = mat.decompose()

    # Write to SOURCE object (not the evaluated copy).
    obj_h.location            = loc
    obj_h.rotation_quaternion = rot
    obj_h.keyframe_insert('location',            frame=frame)
    obj_h.keyframe_insert('rotation_quaternion', frame=frame)

# Remove constraints — the keyframe data is now self-contained.
obj_h.constraints.clear()
print(f"[holoflow] Baked {FRAME_END - FRAME_START + 1} frames to action '{bake_action.name}'.")


# ── 7. Export to GLB ─────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath    = bpy.path.abspath(EXPORT_PATH),
    use_selection = True,
    export_format = 'GLB',
    export_yup  = True,
    export_apply = False,          # geometry has no modifiers; False skips re-eval
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = 'WEBP',
    export_animations   = True,
    export_bake_animation = False, # already baked; re-baking introduces drift
)
print(f"[holoflow] Exported: {EXPORT_PATH}")


# ── Three.js replay snippet ───────────────────────────────────────────────────
THREEJS_SNIPPET = """
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'

const loader = new GLTFLoader()
loader.load('/library/constraint_baked.glb', (gltf) => {
  scene.add(gltf.scene)
  const mixer = new THREE.AnimationMixer(gltf.scene)
  gltf.animations.forEach(clip => mixer.clipAction(clip).play())
  // In your render loop: mixer.update(delta)
})
// NOTE: export_bake_animation=False in Blender leaves the keyframes as authored.
// Do NOT call bakeAnimation on the mixer — it would interpolate between already-
// baked frames, doubling the smoothing and introducing phantom easing.
"""
print(THREEJS_SNIPPET)

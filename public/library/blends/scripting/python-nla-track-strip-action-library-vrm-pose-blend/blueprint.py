"""
Holoflow Studio — Blender 5.1 Blueprint
Python bpy.types.NlaTrack + NlaStrip
Non-Linear Animation: Action Library, Strip Blending & VRM Pose-Morphing Rig

The NLA editor treats bpy.types.Action objects as reusable clips.  Each
NlaTrack holds one or more NlaStrips that reference an Action by pointer.
Tracks stack bottom-to-top in nla_tracks[], evaluated top-to-bottom at
render time.  strip.blend_type controls how each layer combines with the
result of all tracks below it — REPLACE overrides, COMBINE composes
rotations via quaternion multiplication so two partial poses add together
correctly without gimbal lock.

For a VRM character's pose library: create one Action per distinct full-body
pose (each keyed at frame 1 only), push each to its own track, then animate
strip.influence per-track to crossfade between poses at runtime.  After
choreography is complete, bpy.ops.nla.bake() flattens the blended result to
a single baked Action ready for GLB export.

Blueprint outputs:
    vrm_pose_lib.glb   — baked 3-second pose-blend animation
"""

import bpy
import math

# ─── Parameters ───────────────────────────────────────────────────────────────
ARMATURE_NAME = "vrm_arm_rig"
BONE_PREFIX   = "bone"
BONE_COUNT    = 3
BONE_LENGTH   = 0.25          # metres per segment
POSE_NAMES    = ("pose_idle", "pose_raise", "pose_reach")
ANIM_START    = 1
ANIM_END      = 90            # 3 seconds at 30 fps
FPS           = 30
OUTPUT_GLB    = "//vrm_pose_lib.glb"


# ─── 1. Scene setup ───────────────────────────────────────────────────────────
def reset_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    bpy.context.scene.frame_start = ANIM_START
    bpy.context.scene.frame_end   = ANIM_END
    bpy.context.scene.render.fps  = FPS


# ─── 2. Build armature ────────────────────────────────────────────────────────
def build_arm_chain() -> bpy.types.Object:
    """Straight 3-bone vertical chain via the Edit Bone data API — no operators."""
    arm_data = bpy.data.armatures.new(ARMATURE_NAME)
    arm_ob   = bpy.data.objects.new(ARMATURE_NAME, arm_data)
    bpy.context.scene.collection.objects.link(arm_ob)
    bpy.context.view_layer.objects.active = arm_ob

    bpy.ops.object.mode_set(mode='EDIT')
    edit_bones = arm_data.edit_bones
    for i in range(BONE_COUNT):
        eb        = edit_bones.new(f"{BONE_PREFIX}_{i:02d}")
        base_z    = i * BONE_LENGTH
        eb.head   = (0.0, 0.0, base_z)
        eb.tail   = (0.0, 0.0, base_z + BONE_LENGTH)
        eb.roll   = 0.0
        if i > 0:
            eb.parent      = edit_bones[f"{BONE_PREFIX}_{(i - 1):02d}"]
            eb.use_connect = True  # child head snaps to parent tail
    bpy.ops.object.mode_set(mode='OBJECT')
    return arm_ob


# ─── 3. Build Actions — one per pose ─────────────────────────────────────────
def _write_pose_into_action(arm_ob: bpy.types.Object,
                             rotations: list,
                             frame: int,
                             action: bpy.types.Action) -> None:
    """
    Write rotation keyframes into *action* at *frame* using the FCurve API.

    WHY direct FCurve API and not bpy.ops.anim.keyframe_insert:
      Operators require a live 3D Viewport context in Pose Mode and poll
      bpy.context.active_pose_bone — they fail silently in a headless or
      Text-Editor context.  The direct API has no context requirement.

    data_path for pose bones: 'pose.bones["name"].rotation_euler'
    index: 0 = X, 1 = Y, 2 = Z  (for rotation_mode='XYZ')
    """
    for i in range(BONE_COUNT):
        pbone = arm_ob.pose.bones[f"{BONE_PREFIX}_{i:02d}"]
        pbone.rotation_mode = 'XYZ'
        rot = rotations[i] if i < len(rotations) else (0.0, 0.0, 0.0)
        data_path = f'pose.bones["{pbone.name}"].rotation_euler'
        for axis_idx, value in enumerate(rot):
            fc = action.fcurves.find(data_path, index=axis_idx)
            if fc is None:
                fc = action.fcurves.new(data_path,
                                        index=axis_idx,
                                        action_group=pbone.name)
            kp = fc.keyframe_points.insert(frame, value)
            kp.interpolation = 'CONSTANT'  # snap between poses, no interpolation


def build_actions(arm_ob: bpy.types.Object) -> list:
    """
    Three single-frame Actions.  CONSTANT interpolation so each pose holds
    without drifting — the NLA strip's blend handles the crossfade instead.

    Pose anatomy (radians):
      idle  : arm straight down — all zeros, T-pose baseline
      raise : shoulder lifts 45° around X; elbow bends −30° (partial curl)
      reach : shoulder at 60°; elbow nearly straight −10°; wrist twists 20°
    """
    arm_ob.animation_data_create()
    POSES = [
        [(0.0, 0.0, 0.0),
         (0.0, 0.0, 0.0),
         (0.0, 0.0, 0.0)],
        [(math.radians(45),  0.0, 0.0),
         (math.radians(-30), 0.0, 0.0),
         (0.0,               0.0, 0.0)],
        [(math.radians(60),  0.0, 0.0),
         (math.radians(-10), 0.0, 0.0),
         (0.0, math.radians(20), 0.0)],
    ]
    actions = []
    for pose_name, rotations in zip(POSE_NAMES, POSES):
        existing = bpy.data.actions.get(pose_name)
        if existing:
            bpy.data.actions.remove(existing)
        action = bpy.data.actions.new(pose_name)
        action.use_fake_user = True   # survive without being assigned to any slot
        _write_pose_into_action(arm_ob, rotations, frame=1, action=action)
        actions.append(action)
    return actions


# ─── 4. Push Actions onto NLA Tracks ─────────────────────────────────────────
def build_nla_tracks(arm_ob: bpy.types.Object, actions: list) -> None:
    """
    strips.new(name, start, action)
        start — INTEGER frame; frame_end is auto-set to start + action.frame_range length.
        Single-frame actions produce start == end — a zero-length strip.
        We must explicitly override frame_end to give the strip timeline span.

    strip.extrapolation = 'HOLD':
        Keeps the pose frozen beyond the strip's frame_end — without this the
        strip goes to T-pose (rest pose) past its end, which ruins blending.

    strip.blend_type:
        'REPLACE' — this track's full result overrides everything beneath it.
        'COMBINE' — quaternion-multiplies rotations with the layer below.
                    Use COMBINE on additive layers (raise, reach) so idle
                    provides the base and upper tracks add deltas.

    ad.action = None:
        The 'action' slot on AnimData evaluates in ADDITION to the NLA stack.
        Leaving it set while NLA tracks exist double-applies the slot action
        (adds frame-1 pose on top of the baked NLA result).  Always clear it
        before handing off to the NLA.
    """
    ad = arm_ob.animation_data
    for track in list(ad.nla_tracks):
        ad.nla_tracks.remove(track)
    ad.action = None   # clear slot — see note above

    # Timing plan:
    #   idle holds all 90 frames (REPLACE — the base layer)
    #   raise fades from 0 to full influence at frame 45, holds to 60
    #   reach fades from 0 to full influence at frame 75, holds to 90
    CONFIGS = [
        # (action, blend_type, strip_start, strip_end, influence)
        (actions[0], 'REPLACE', 1, 90, 1.0),
        (actions[1], 'COMBINE', 1, 90, 0.0),  # driven to 1.0 in record.py bake
        (actions[2], 'COMBINE', 1, 90, 0.0),
    ]
    for action, blend_type, start, end, influence in CONFIGS:
        track            = ad.nla_tracks.new()
        track.name       = action.name
        strip            = track.strips.new(action.name, start, action)
        strip.frame_start       = start
        strip.frame_end         = end
        strip.action_frame_start = 1.0
        strip.action_frame_end   = 1.0   # always read frame 1 — hold pose
        strip.extrapolation      = 'HOLD'
        strip.blend_type         = blend_type
        strip.use_auto_blend     = False
        strip.influence          = influence


# ─── 5. Bake NLA → FCurves, then export GLB ──────────────────────────────────
def bake_and_export(arm_ob: bpy.types.Object) -> None:
    """
    bpy.ops.nla.bake() evaluates the NLA stack at every frame in the range
    and writes the results as bone FCurves on a new Action assigned to ad.action.
    visual_keying=True captures the post-constraint evaluated pose — essential
    when IK/stretch constraints modify bone positions beyond the raw FCurve values.

    After baking, strip.influence animation (if set) is baked in too —
    the resulting Action reflects what the viewport actually showed.
    """
    bpy.context.view_layer.objects.active = arm_ob
    arm_ob.select_set(True)
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action='SELECT')

    bpy.ops.nla.bake(
        frame_start       = ANIM_START,
        frame_end         = ANIM_END,
        only_selected     = True,
        visual_keying     = True,
        clear_constraints = False,
        clear_parents     = False,
        bake_types        = {'POSE'},
    )
    bpy.ops.object.mode_set(mode='OBJECT')

    bpy.ops.export_scene.gltf(
        filepath          = bpy.path.abspath(OUTPUT_GLB),
        export_format     = 'GLB',
        export_animations = True,
        export_anim_mode  = 'ACTIONS',
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = 'WEBP',
    )
    print(f"[HLF] exported → {bpy.path.abspath(OUTPUT_GLB)}")


# ─── Entry point ──────────────────────────────────────────────────────────────
def main() -> None:
    reset_scene()
    arm_ob  = build_arm_chain()
    actions = build_actions(arm_ob)
    build_nla_tracks(arm_ob, actions)

    # In the interactive session, manually animate strip.influence on the
    # 'pose_raise' and 'pose_reach' tracks using the NLA editor's N-panel,
    # then call bake_and_export() to flatten and ship.
    # Headless: set strip.influence to 1.0 on a single static frame
    # and call bake_and_export() directly.
    bake_and_export(arm_ob)


if __name__ == "__main__":
    main()

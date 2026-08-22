"""
blueprint.py — Object Constraints: Follow Path + Track To + Damped Track
Blender 5.1  |  CC0  |  Holoflow Studio

TECHNIQUE: Blender's constraint system composes motion from independent sources
without keyframing every axis. Follow Path binds an object's *position* to a
curve; Track To steers *rotation* toward a live look-at target; Damped Track
provides a roll-free, gimbal-safe alternative for bones and eyes. Stack them in
this order — position source first, rotation override last — and the timeline
becomes a single scalar (offset_factor 0→1) driving a full orbital camera rig.

Run from Blender's Text Editor ▸ Run Script, or:
    blender --python blueprint.py
"""

import bpy
import math

# ── PARAMETERS ────────────────────────────────────────────────────────────────
ORBIT_RADIUS     = 4.0      # metres — radius of the circular dolly path
CAMERA_HEIGHT    = 1.8      # metres above path origin — eye level for drama
ANIM_FRAMES      = 200      # one full orbit; offset_factor 0→1 over this span
FPS              = 24
TARGET_BOB_AMP   = 1.2      # metres — look-target vertical oscillation amplitude
EYE_POSITION     = (2.5, 0.0, 0.8)  # world location of the eye-cone proxy


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


def build_orbit_path() -> bpy.types.Object:
    """Circular Bezier path used by the Follow Path constraint.

    WHY Bezier Circle rather than NURBS Path?  A Bezier Circle is already
    closed and cyclic without extra config.  Set use_path=True so Blender
    maps curve arc-length to path_duration frames — Follow Path's
    offset_factor is then frame-accurate rather than parameterically uneven.
    """
    bpy.ops.curve.primitive_bezier_circle_add(
        radius=ORBIT_RADIUS, enter_editmode=False, location=(0, 0, 0)
    )
    path = bpy.context.active_object
    path.name = "OrbitPath"
    cd = path.data
    cd.use_path = True           # enables arc-length parameterisation
    cd.path_duration = ANIM_FRAMES   # maps offset_factor=1.0 → frame ANIM_FRAMES
    return path


def build_look_target() -> bpy.types.Object:
    """Small empty sphere at scene centre; bobbing animation tests tracking."""
    bpy.ops.object.empty_add(type="SPHERE", radius=0.18, location=(0, 0, 0))
    tgt = bpy.context.active_object
    tgt.name = "LookTarget"

    # Vertical bob: 0 → TARGET_BOB_AMP → 0 over the full animation.
    # A single cosine wave is enough to stress both Track To and Damped Track.
    scene = bpy.context.scene
    for frame, z in [
        (1, 0.0),
        (ANIM_FRAMES // 4, TARGET_BOB_AMP),
        (ANIM_FRAMES // 2, 0.0),
        (3 * ANIM_FRAMES // 4, -TARGET_BOB_AMP * 0.5),
        (ANIM_FRAMES, 0.0),
    ]:
        scene.frame_set(frame)
        tgt.location.z = z
        tgt.keyframe_insert(data_path="location", index=2, frame=frame)

    # Smooth interpolation — Auto Bézier handles on Z channel
    if tgt.animation_data and tgt.animation_data.action:
        for fc in tgt.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"
                kp.handle_left_type = "AUTO"
                kp.handle_right_type = "AUTO"
    return tgt


def build_orbital_camera(path: bpy.types.Object, target: bpy.types.Object) -> bpy.types.Object:
    """Camera with Follow Path (position) stacked with Track To (rotation).

    Constraint stacking order:
      1. FOLLOW_PATH  — world-space position from curve; also sets initial rotation.
      2. TRACK_TO     — fully overrides rotation so the lens always faces `target`.

    The second constraint wins on rotation because Blender evaluates constraints
    in list order and each result feeds into the next as the accumulated transform.
    """
    bpy.ops.object.camera_add(location=(ORBIT_RADIUS, 0, CAMERA_HEIGHT))
    cam = bpy.context.active_object
    cam.name = "OrbitalCam"
    bpy.context.scene.camera = cam

    # ── 1. Follow Path ────────────────────────────────────────────────────────
    fp = cam.constraints.new("FOLLOW_PATH")
    fp.target            = path
    fp.use_curve_follow  = False     # we override rotation with Track To below;
                                     # curve tangent rotation would fight it
    fp.forward_axis      = "TRACK_NEGATIVE_Y"
    fp.up_axis           = "UP_Z"

    # Animate offset_factor 0→1: full orbit in ANIM_FRAMES frames.
    fp.offset_factor = 0.0
    fp.keyframe_insert(data_path="offset_factor", frame=1)
    fp.offset_factor = 1.0
    fp.keyframe_insert(data_path="offset_factor", frame=ANIM_FRAMES)

    # Linear interpolation — constant angular velocity around the orbit.
    if cam.animation_data and cam.animation_data.action:
        for fc in cam.animation_data.action.fcurves:
            if "offset_factor" in fc.data_path:
                for kp in fc.keyframe_points:
                    kp.interpolation = "LINEAR"

    # ── 2. Track To ──────────────────────────────────────────────────────────
    # Camera space: -Z is the view direction, +Y is screen-up.
    # WHY Track To over Damped Track here?  Track To preserves the up axis so
    # the horizon stays level — critical for a cinematic dolly shot.
    tt = cam.constraints.new("TRACK_TO")
    tt.target      = target
    tt.track_axis  = "TRACK_NEGATIVE_Z"
    tt.up_axis     = "UP_Y"

    return cam


def build_eye_tracker(target: bpy.types.Object) -> bpy.types.Object:
    """Cone mesh with Damped Track — proxy for a VRM eye bone or tentacle tip.

    WHY Damped Track over Track To for eyes?
    Track To enforces a secondary 'up' axis which can cause gimbal flipping when
    the target passes directly above/below the eye.  Damped Track has no up-axis
    constraint; it minimises rotation by finding the shortest-arc spin, so it
    barrel-rolls smoothly instead of flipping.  Perfect for eye bones where a
    roll of ±15° is imperceptible to the viewer.
    """
    bpy.ops.mesh.primitive_cone_add(
        radius1=0.12, radius2=0.0, depth=0.35,
        location=EYE_POSITION, enter_editmode=False
    )
    eye = bpy.context.active_object
    eye.name = "EyeCone"

    # Point +Z (tip) toward target.
    dt = eye.constraints.new("DAMPED_TRACK")
    dt.target     = target
    dt.track_axis = "TRACK_Z"

    return eye


def build_subject() -> bpy.types.Object:
    """Simple ico-sphere at the scene origin — the 'subject' the camera orbits."""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.6, location=(0, 0, 0))
    subj = bpy.context.active_object
    subj.name = "Subject"
    bpy.ops.object.shade_smooth()

    mat = bpy.data.materials.new("SubjectMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.08, 0.55, 0.85, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.25
    subj.data.materials.append(mat)
    return subj


def build_world_lighting() -> None:
    world = bpy.context.scene.world or bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value    = (0.04, 0.04, 0.08, 1.0)
    bg.inputs["Strength"].default_value = 0.6

    bpy.ops.object.light_add(type="AREA", location=(3, -3, 5))
    key = bpy.context.active_object
    key.name = "KeyLight"
    key.data.energy = 600.0
    key.data.size   = 2.0
    key.rotation_euler = (math.radians(50), 0, math.radians(30))

    bpy.ops.object.light_add(type="AREA", location=(-4, 2, 3))
    fill = bpy.context.active_object
    fill.name = "FillLight"
    fill.data.energy = 120.0
    fill.data.size   = 3.0


def main() -> None:
    clear_scene()
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = ANIM_FRAMES
    scene.render.fps  = FPS

    path   = build_orbit_path()
    target = build_look_target()
    subj   = build_subject()        # noqa: F841 — present in scene
    cam    = build_orbital_camera(path, target)
    eye    = build_eye_tracker(target)
    build_world_lighting()

    scene.frame_set(1)

    print("=== Constraint rig ready ===")
    print(f"  Camera '{cam.name}' constraints: {[c.type for c in cam.constraints]}")
    print(f"  Eye '{eye.name}' constraints:    {[c.type for c in eye.constraints]}")
    print(f"  Animation: frames 1–{ANIM_FRAMES} @ {FPS} fps")
    print("  Save as: public/library/blends/animation/animation-constraints-follow-path-track-to/orbital_cam_rig.blend")


if __name__ == "__main__":
    main()

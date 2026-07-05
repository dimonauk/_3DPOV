"""
Holoflow Studio — Blender 5.1 record.py
NLA Pose Library — Viewport Preview Recording

Renders a 5-second OpenGL viewport animation showing the three NLA-driven
poses blending from idle → raise → reach.  Because influence cannot be
directly keyed through the FCurve API on NlaStrip properties in 5.1, this
script uses a frame-change handler to set each strip's influence value
procedurally, then writes a JPEG sequence that ffmpeg assembles into
viewport.mp4.

Output: public/library/videos/scripting/
        python-nla-track-strip-action-library-vrm-pose-blend/viewport.mp4
"""

import bpy
import math

ANIM_START    = 1
ANIM_END      = 90
FPS           = 30
OUTPUT_DIR    = "//../../../../videos/scripting/python-nla-track-strip-action-library-vrm-pose-blend/"
ARMATURE_NAME = "vrm_arm_rig"

# Influence envelope per track: list of (frame, influence) keypoints.
# Interpolated linearly between keypoints.
INFLUENCE_CURVES = {
    "pose_idle":  [(1, 1.0), (90, 1.0)],
    "pose_raise": [(1, 0.0), (30, 0.0), (50, 1.0), (60, 1.0), (70, 0.0), (90, 0.0)],
    "pose_reach": [(1, 0.0), (60, 0.0), (75, 1.0), (90, 1.0)],
}


def _lerp_influence(curve: list, frame: int) -> float:
    """Piecewise linear interpolation through (frame, value) keypoints."""
    if frame <= curve[0][0]:
        return curve[0][1]
    if frame >= curve[-1][0]:
        return curve[-1][1]
    for i in range(len(curve) - 1):
        f0, v0 = curve[i]
        f1, v1 = curve[i + 1]
        if f0 <= frame <= f1:
            t = (frame - f0) / (f1 - f0)
            return v0 + t * (v1 - v0)
    return 0.0


def _update_influences(scene: bpy.types.Scene) -> None:
    """frame_change_pre handler — update strip influences before each render."""
    arm_ob = bpy.data.objects.get(ARMATURE_NAME)
    if not arm_ob or not arm_ob.animation_data:
        return
    frame = scene.frame_current
    for track in arm_ob.animation_data.nla_tracks:
        curve = INFLUENCE_CURVES.get(track.name)
        if curve and track.strips:
            track.strips[0].influence = _lerp_influence(curve, frame)


def setup_camera() -> None:
    """Add an orthographic camera looking at the arm chain from the front."""
    cam_data = bpy.data.cameras.new("rec_cam")
    cam_data.type         = 'ORTHO'
    cam_data.ortho_scale  = 1.2
    cam_ob = bpy.data.objects.new("rec_cam", cam_data)
    bpy.context.scene.collection.objects.link(cam_ob)
    cam_ob.location = (0.0, -3.0, 0.375)   # centred on mid-bone height
    cam_ob.rotation_euler = (math.radians(90), 0.0, 0.0)
    bpy.context.scene.camera = cam_ob


def configure_render() -> None:
    render = bpy.context.scene.render
    render.resolution_x     = 1280
    render.resolution_y     = 720
    render.resolution_percentage = 100
    render.fps              = FPS
    render.image_settings.file_format = 'FFMPEG'
    render.ffmpeg.format    = 'MPEG4'
    render.ffmpeg.codec     = 'H264'
    render.ffmpeg.constant_rate_factor = 'HIGH'
    render.filepath         = OUTPUT_DIR + "viewport"


def main() -> None:
    # Ensure blueprint has already been run (armature must exist).
    arm_ob = bpy.data.objects.get(ARMATURE_NAME)
    if arm_ob is None:
        raise RuntimeError(
            "Run blueprint.py first to create the armature and NLA tracks."
        )

    # Register the per-frame influence handler.
    # Remove any stale copy first (re-run safety).
    for fn in list(bpy.app.handlers.frame_change_pre):
        if getattr(fn, '__name__', '') == '_update_influences':
            bpy.app.handlers.frame_change_pre.remove(fn)
    bpy.app.handlers.frame_change_pre.append(_update_influences)

    setup_camera()
    configure_render()

    bpy.context.scene.frame_start = ANIM_START
    bpy.context.scene.frame_end   = ANIM_END

    # Render the animation using the EEVEE Next viewport engine.
    # bpy.ops.render.render(animation=True) writes the MPEG4 directly.
    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'
    bpy.ops.render.render(animation=True, write_still=False)

    # Remove the handler after recording so it does not persist in the .blend.
    for fn in list(bpy.app.handlers.frame_change_pre):
        if getattr(fn, '__name__', '') == '_update_influences':
            bpy.app.handlers.frame_change_pre.remove(fn)

    print(f"[HLF] viewport.mp4 written to {bpy.path.abspath(OUTPUT_DIR)}")


if __name__ == "__main__":
    main()

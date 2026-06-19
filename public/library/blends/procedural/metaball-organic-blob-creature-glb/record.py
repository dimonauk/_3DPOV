"""
record.py — Metaball Blob Creature Viewport Animation
=====================================================
Blender 5.1 | CC0 | Holoflow Studio

Renders a 5-second (150-frame) viewport animation to:
  public/library/videos/procedural/metaball-organic-blob-creature-glb/viewport.mp4

Two motions overlap:
  • Camera orbit: 300° arc around the creature (frames 1–150)
  • Threshold pulse: 0.60 → 0.35 → 0.60 (frames 1–75–150)
    — elements visually separate then remerge, illustrating the field concept.

Run from the Blender Scripting workspace with the creature .blend open,
OR run blueprint.py first to build the scene, then run this script.
"""

import bpy
import math
import os

# ── Constants ────────────────────────────────────────────────────────────────
FRAME_START  = 1
FRAME_END    = 150
FPS          = 30
CAM_DISTANCE = 4.8       # metres from world origin
CAM_HEIGHT   = 1.2       # metres above ground
ORBIT_DEGREES = 300.0    # arc to sweep (not full 360 so start/end differ)

THRESHOLD_START  = 0.60
THRESHOLD_MIN    = 0.35  # elements nearly separate at this level
THRESHOLD_END    = 0.60

OUT_PATH = os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "videos",
    "procedural", "metaball-organic-blob-creature-glb", "viewport.mp4",
)
# ─────────────────────────────────────────────────────────────────────────────


def get_or_build_scene() -> tuple[bpy.types.Object, bpy.types.Object]:
    """Return (mball_obj, camera_obj); build minimal scene if empty."""
    from mathutils import Vector
    import sys
    sys.path.insert(0, bpy.path.abspath("//"))

    mball_obj = bpy.data.objects.get("blob_creature")
    if mball_obj is None:
        # Blueprint not run yet — import and run it inline
        import importlib.util, pathlib
        spec = importlib.util.spec_from_file_location(
            "blueprint",
            pathlib.Path(bpy.path.abspath("//")) / "blueprint.py",
        )
        bp = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(bp)
        bp.clear_scene()
        mball_obj = bp.build_creature()
        bp.build_material(mball_obj)

    cam_obj = bpy.context.scene.camera
    if cam_obj is None:
        bpy.ops.object.camera_add(location=(0, -CAM_DISTANCE, CAM_HEIGHT))
        cam_obj = bpy.context.active_object
        bpy.context.scene.camera = cam_obj

    return mball_obj, cam_obj


def keyframe_orbit(cam_obj: bpy.types.Object) -> None:
    """
    Orbit the camera on a circular arc in the XY plane, always pointing at
    the world origin.  We set location+rotation at every frame rather than
    using a Follow Path constraint because this keeps the .blend dependency
    graph minimal for opengl renders.
    """
    cam_obj.animation_data_clear()

    orbit_rad = math.radians(ORBIT_DEGREES)
    start_angle = -math.radians(150)   # start from front-left

    for f in range(FRAME_START, FRAME_END + 1):
        t     = (f - FRAME_START) / max(FRAME_END - FRAME_START, 1)
        angle = start_angle + t * orbit_rad

        x = CAM_DISTANCE * math.sin(angle)
        y = -CAM_DISTANCE * math.cos(angle)
        z = CAM_HEIGHT

        cam_obj.location = (x, y, z)
        cam_obj.keyframe_insert(data_path="location", frame=f)

        # Point camera at origin — recompute rotation per frame
        from mathutils import Vector
        direction = Vector((0.0, 0.0, 0.5)) - Vector((x, y, z))
        rot = direction.to_track_quat("-Z", "Y").to_euler()
        cam_obj.rotation_euler = rot
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=f)


def keyframe_threshold(mball_obj: bpy.types.Object) -> None:
    """
    Animate mball.threshold across three keyframes.

    WHY this is the interesting thing to show:
      The isosurface visibly contracts as threshold rises — elements that were
      merged pop apart like soap bubbles separating.  Watching this in real
      time is the fastest way to build intuition about the field model.
    """
    mball = mball_obj.data

    mball.threshold = THRESHOLD_START
    mball.keyframe_insert(data_path="threshold", frame=FRAME_START)

    mball.threshold = THRESHOLD_MIN
    mball.keyframe_insert(data_path="threshold", frame=(FRAME_START + FRAME_END) // 2)

    mball.threshold = THRESHOLD_END
    mball.keyframe_insert(data_path="threshold", frame=FRAME_END)

    # Smooth interpolation so the morph eases in/out
    if mball.animation_data and mball.animation_data.action:
        for fc in mball.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"
                kp.handle_left_type  = "AUTO_CLAMPED"
                kp.handle_right_type = "AUTO_CLAMPED"


def setup_render(out_path: str) -> None:
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format              = "MPEG4"
    scene.render.ffmpeg.codec               = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"

    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    scene.render.filepath = out_path


def main() -> None:
    mball_obj, cam_obj = get_or_build_scene()
    keyframe_orbit(cam_obj)
    keyframe_threshold(mball_obj)
    setup_render(OUT_PATH)

    # Render viewport animation (fast opengl; no ray-tracing)
    bpy.ops.render.opengl(animation=True)
    print(f"Viewport animation written to: {OUT_PATH}")


if __name__ == "__main__":
    main()

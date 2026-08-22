# blends/geometry-nodes/gn-points-to-volume-organic-coral/record.py
# Blender 5.1 | CC0
#
# Viewport animation: isosurface Threshold sweeps from 1.20 (no mesh) down
# to 0.08 (full coral blob) over frames 1–60, holds at full form for
# frames 60–90, then sweeps back up to 1.20 for frames 90–120.
# The camera orbits 40° counter-clockwise over the 120-frame run.
# Output: public/library/videos/geometry-nodes/gn-points-to-volume-organic-coral/viewport.mp4

import bpy
import math

BLEND_PATH = ("public/library/blends/geometry-nodes/"
              "gn-points-to-volume-organic-coral/organic_coral.blend")
OUT_MP4    = ("public/library/videos/geometry-nodes/"
              "gn-points-to-volume-organic-coral/viewport.mp4")

FRAME_TOTAL = 120
FPS         = 24

# Match parameter names from blueprint.py GN interface
THRESHOLD_SOCKET = "Threshold"

THRESHOLD_HIGH   = 1.20   # no geometry — isosurface above peak density
THRESHOLD_FULL   = 0.08   # full coral blob at default parameters


def _find_modifier(obj: bpy.types.Object, ng_name: str):
    for mod in obj.modifiers:
        if mod.type == "NODES" and mod.node_group.name == ng_name:
            return mod
    raise RuntimeError(f"No NODES modifier named '{ng_name}' on '{obj.name}'")


def record():
    bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)

    scene       = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAME_TOTAL

    obj = bpy.data.objects["coral_blob"]
    mod = _find_modifier(obj, "OrganicCoral")

    # Keyframe: Threshold sweep 1.20 → 0.08 → 0.08 → 1.20
    # mod[THRESHOLD_SOCKET] is the override value for the group input socket
    def key_thresh(frame: int, value: float):
        scene.frame_set(frame)
        mod[THRESHOLD_SOCKET] = value
        mod.keyframe_insert(data_path=f'["{THRESHOLD_SOCKET}"]', frame=frame)

    key_thresh(1,   THRESHOLD_HIGH)    # no mesh
    key_thresh(60,  THRESHOLD_FULL)    # full coral emerges
    key_thresh(90,  THRESHOLD_FULL)    # hold at full form
    key_thresh(120, THRESHOLD_HIGH)    # dissolve back

    # Smooth the interpolation curve on the Threshold channel
    for fc in obj.animation_data.action.fcurves:
        if THRESHOLD_SOCKET in fc.data_path:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"
                kp.handle_left_type  = "AUTO"
                kp.handle_right_type = "AUTO"

    # Camera orbit: +40° over the full 120 frames
    cam = scene.camera
    if cam:
        start_z = cam.rotation_euler.z
        scene.frame_set(1)
        cam.rotation_euler.z = start_z
        cam.keyframe_insert(data_path="rotation_euler", index=2, frame=1)
        scene.frame_set(FRAME_TOTAL)
        cam.rotation_euler.z = start_z + math.radians(40)
        cam.keyframe_insert(data_path="rotation_euler", index=2, frame=FRAME_TOTAL)

    # Render settings: viewport OpenGL render (no raytracing, fast)
    scene.render.engine         = "BLENDER_WORKBENCH"
    scene.render.resolution_x   = 1920
    scene.render.resolution_y   = 1080
    scene.render.fps            = FPS
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format  = "MPEG4"
    scene.render.ffmpeg.codec   = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath       = OUT_MP4

    bpy.ops.render.opengl(animation=True, sequencer=False)
    print(f"[organic-coral] Viewport render → {OUT_MP4}")


if __name__ == "__main__":
    record()

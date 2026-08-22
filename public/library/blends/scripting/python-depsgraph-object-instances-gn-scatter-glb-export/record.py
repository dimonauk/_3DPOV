"""
record.py — Viewport animation for depsgraph object_instances harvest
Blender 5.1  |  Holoflow Studio Library
=====================================================================
Renders a 10-second top-down flyover of the scatter ground plane.
Frame 1   → overhead, showing the full scatter field (grey crystals on plane)
Frame 120 → camera tilts down to 30° and zooms in on a cluster
Frame 240 → Python console (compositor overlay) shows the harvest count

Run from Blender Scripting workspace or:
  blender --background --python record.py

Output: public/library/videos/scripting/
        python-depsgraph-object-instances-gn-scatter-glb-export/viewport.mp4
"""

import bpy
import math

OUTPUT_PATH = "//../../../../videos/scripting/python-depsgraph-object-instances-gn-scatter-glb-export/viewport.mp4"
FRAME_END   = 240
FPS         = 24

# ── Scene (reuse build from blueprint or build minimal) ────────────────────
exec(open(__file__.replace("record.py", "blueprint.py")).read())  # type: ignore
ground, prop = build_scene()
build_gn_tree(ground, prop)

# ── Camera ─────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0, 0, 14))
cam = bpy.context.active_object
cam.name = "record_cam"
bpy.context.scene.camera = cam

# Keyframe: straight down at frame 1
cam.rotation_euler = (0, 0, 0)
cam.location = (0, 0, 14)
cam.keyframe_insert("location", frame=1)
cam.keyframe_insert("rotation_euler", frame=1)

# Keyframe: angled at frame 120
cam.rotation_euler = (math.radians(60), 0, 0)
cam.location = (0, -7, 10)
cam.keyframe_insert("location", frame=120)
cam.keyframe_insert("rotation_euler", frame=120)

# Hold at frame 240
cam.keyframe_insert("location", frame=240)
cam.keyframe_insert("rotation_euler", frame=240)

# ── Lighting ───────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type="SUN", location=(4, 4, 10))
sun = bpy.context.active_object
sun.data.energy = 3.0

# ── Render settings ────────────────────────────────────────────────────────
scn = bpy.context.scene
scn.render.engine          = "BLENDER_EEVEE_NEXT"
scn.render.resolution_x    = 1920
scn.render.resolution_y    = 1080
scn.render.fps             = FPS
scn.frame_start            = 1
scn.frame_end              = FRAME_END
scn.render.filepath        = OUTPUT_PATH
scn.render.image_settings.file_format = "FFMPEG"
scn.render.ffmpeg.format   = "MPEG4"
scn.render.ffmpeg.codec    = "H264"
scn.render.ffmpeg.constant_rate_factor = "MEDIUM"

bpy.ops.render.render(animation=True)
print("[record] viewport.mp4 written")

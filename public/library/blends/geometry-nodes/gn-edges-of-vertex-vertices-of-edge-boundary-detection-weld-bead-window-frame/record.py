"""
record.py — viewport animation render for window_frame_weld (Blender 5.1)
Produces a 150-frame (5 s @ 30 fps) orbit that reveals the weld bead
perimeter strips along both the inner and outer boundary loops of the frame.
Run AFTER blueprint.py.

Output: public/library/videos/geometry-nodes/
        gn-edges-of-vertex-vertices-of-edge-boundary-detection-weld-bead-window-frame/
        viewport.mp4
"""

import bpy, math, os

FRAMES      = 150
FPS         = 30
RESOLUTION  = (1920, 1080)
OUTPUT_DIR  = (
    "//../../videos/geometry-nodes/"
    "gn-edges-of-vertex-vertices-of-edge-boundary-detection-weld-bead-window-frame/"
)
OUTPUT_FILE = "viewport"

scn = bpy.context.scene
scn.render.engine                        = "BLENDER_EEVEE_NEXT"
scn.render.fps                           = FPS
scn.frame_start                          = 1
scn.frame_end                            = FRAMES
scn.render.resolution_x                  = RESOLUTION[0]
scn.render.resolution_y                  = RESOLUTION[1]
scn.render.resolution_percentage         = 100
scn.render.film_transparent              = False
scn.render.image_settings.file_format    = "FFMPEG"
scn.render.ffmpeg.format                 = "MPEG4"
scn.render.ffmpeg.codec                  = "H264"
scn.render.ffmpeg.constant_rate_factor   = "HIGH"
scn.render.filepath = bpy.path.abspath(
    os.path.join(OUTPUT_DIR, OUTPUT_FILE)
)

# ── Camera ───────────────────────────────────────────────────────────────────
cam_data      = bpy.data.cameras.new("RecordCam")
cam_data.lens = 55
cam_obj       = bpy.data.objects.new("RecordCam", cam_data)
scn.collection.objects.link(cam_obj)
scn.camera = cam_obj

ORBIT_R  = 5.2
Z_HEIGHT = 3.0

def place_cam(frame, angle_deg, radius):
    rad = math.radians(angle_deg)
    cam_obj.location = (
        math.sin(rad) * radius,
        -math.cos(rad) * radius,
        Z_HEIGHT,
    )
    dx = -cam_obj.location.x
    dy = -cam_obj.location.y
    dz = -cam_obj.location.z
    cam_obj.rotation_euler = (
        math.atan2(math.sqrt(dx**2 + dy**2), -dz),
        0.0,
        math.atan2(dx, dy),
    )
    cam_obj.keyframe_insert("location",       frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)

# Arc: face-on → angled side → quarter-turn shows aperture depth → back
place_cam(1,   0.0,  ORBIT_R)          # face-on front, see inner aperture
place_cam(40,  65.0, ORBIT_R * 0.82)   # close-in side to show bead relief
place_cam(80,  130.0, ORBIT_R * 0.88)  # reveal corner join of beads
place_cam(115, 220.0, ORBIT_R * 0.85)  # opposite corner
place_cam(150, 360.0, ORBIT_R)         # back to start, zoom out

for fc in cam_obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "BEZIER"

# ── World (dark studio cyclorama) ────────────────────────────────────────────
if not scn.world:
    scn.world = bpy.data.worlds.new("RecordWorld")
scn.world.use_nodes = True
bg = scn.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value    = (0.02, 0.02, 0.04, 1.0)
    bg.inputs["Strength"].default_value = 0.5

# ── Lights ───────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type="AREA", location=(2.5, -2.0, 4.0))
key = bpy.context.active_object
key.name            = "RecordKey"
key.data.energy     = 700
key.data.size       = 2.0
key.rotation_euler  = (math.radians(50), 0, math.radians(30))

bpy.ops.object.light_add(type="AREA", location=(-3.0, 1.5, 2.0))
rim = bpy.context.active_object
rim.name            = "RecordRim"
rim.data.energy     = 250
rim.data.size       = 1.5
rim.data.color      = (0.6, 0.75, 1.0)  # cool blue rim to accent metal beads

# ── Render ───────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("[holoflow] record.py done → viewport.mp4")

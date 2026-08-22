"""
record.py — Viewport animation recorder for VRM Eye Look-At Rig tutorial
Blender 5.1  |  CC0  |  Holoflow Studio

Runs blueprint.py first (or assumes the rig is already loaded), then keyframes
the LookTarget bone in a sweeping gaze pattern and renders a VP animation.
Output: public/library/videos/rigging/rigging-vrm-eye-look-at-damped-track/viewport.mp4

Pattern (60 fps, 180 frames = 3 seconds):
  Frame  0  — centre (straight ahead)
  Frame 30  — hard left  (-0.25 m X)
  Frame 60  — centre
  Frame 90  — hard right (+0.25 m X)
  Frame 120 — look up    (-0.06 m Z up)
  Frame 150 — look down  (+0.06 m Z down)
  Frame 180 — centre
"""

import bpy, math, sys, os

OUTPUT_PATH = "//../../videos/rigging/rigging-vrm-eye-look-at-damped-track/viewport.mp4"
FPS         = 60
TOTAL_FRAMES = 180

# ── Ensure blueprint result is available ──────────────────────────────────────
ARM_NAME = "vrm_eye_rig"
if ARM_NAME not in bpy.data.objects:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    exec(open(os.path.join(script_dir, "blueprint.py")).read())

arm_obj = bpy.data.objects[ARM_NAME]

# ── Scene settings ────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.fps        = FPS
scene.frame_start       = 0
scene.frame_end         = TOTAL_FRAMES

# VP render via OpenGL animation — no full render engine needed
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.filepath     = OUTPUT_PATH

# ── Camera ────────────────────────────────────────────────────────────────────
# Front-face camera focused on the head area
cam_data = bpy.data.cameras.new("RigCam")
cam_obj  = bpy.data.objects.new("RigCam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
cam_obj.location = (0, -1.0, 0.72)
cam_obj.rotation_euler = (math.radians(90), 0, 0)
cam_data.lens = 85  # mild telephoto flatters the rig
scene.camera = cam_obj

# ── Lighting ─────────────────────────────────────────────────────────────────
light_data = bpy.data.lights.new("Key", type="AREA")
light_data.energy = 200
light_obj  = bpy.data.objects.new("Key", light_data)
bpy.context.scene.collection.objects.link(light_obj)
light_obj.location = (-0.5, -0.8, 1.2)

# ── Keyframe helper ───────────────────────────────────────────────────────────
def key_look_target(frame: int, x: float, y: float, z: float) -> None:
    """Keyframe the LookTarget bone location in pose mode."""
    scene.frame_set(frame)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode="POSE")
    pb = arm_obj.pose.bones["LookTarget"]
    # LookTarget is parented to Head; we set location relative to Head's local frame
    pb.location = (x, y, z)
    pb.keyframe_insert(data_path="location", frame=frame)
    bpy.ops.object.mode_set(mode="OBJECT")

# ── Animation keyframes ───────────────────────────────────────────────────────
# y=0 keeps target at rest depth; x/z sweep gaze direction
key_look_target(  0,  0.00, 0, 0.00)   # centre
key_look_target( 30, -0.18, 0, 0.00)   # look left
key_look_target( 60,  0.00, 0, 0.00)   # centre
key_look_target( 90,  0.18, 0, 0.00)   # look right
key_look_target(120,  0.00, 0, 0.04)   # look up   (Z+ in local = up in world)
key_look_target(150,  0.00, 0,-0.04)   # look down
key_look_target(180,  0.00, 0, 0.00)   # return to centre

# Set interpolation to Bezier for smooth gaze arcs
for action in bpy.data.actions:
    for fcurve in action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = "BEZIER"

# ── Viewport shading (Material preview) ──────────────────────────────────────
for area in bpy.context.screen.areas:
    if area.type == "VIEW_3D":
        for space in area.spaces:
            if space.type == "VIEW_3D":
                space.shading.type = "MATERIAL"
                space.overlay.show_bones = True

# ── Render VP animation ───────────────────────────────────────────────────────
bpy.ops.render.opengl(animation=True)
print(f"Recorded {TOTAL_FRAMES} frames → {OUTPUT_PATH}")

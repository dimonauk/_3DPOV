# record.py — Viewport render for Driver / Shape Key Corrective tutorial
# Blender 5.1  |  CC0  |  Holoflow Studio Library
#
# Run after blueprint.py:
#   blender --background elbow_corrective_rig.blend --python record.py
#
# Animates the forearm bending 0° → -90° over 30 frames while the corrective
# shape key activates automatically via the baked driver.  Camera orbits from
# the side so the shape key bulge is visible against the bone silhouette.

import bpy
import math

OUT_MP4 = (
    "//../../videos/scripting/"
    "python-fcurve-driver-shape-key-bone-rotation-vrm/viewport.mp4"
)
FRAMES = 90     # 30 bend + 30 hold + 30 return

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES

# Render settings
scene.render.engine                      = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x                = 1920
scene.render.resolution_y                = 1080
scene.render.fps                         = 30
scene.render.image_settings.file_format  = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath                    = OUT_MP4

# Camera: side view at elbow height, orbiting 90° to show the corrective bulge
cam_data      = bpy.data.cameras.new("rec_cam")
cam_data.lens = 85          # telephoto compresses depth nicely for anatomy work
cam_obj       = bpy.data.objects.new("rec_cam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

ELBOW_Z = 0.35   # height of elbow joint (BONE_LENGTH from blueprint.py)
RADIUS  = 0.55   # orbit radius

for frame in range(1, FRAMES + 1):
    t   = (frame - 1) / (FRAMES - 1)
    ang = math.radians(-45) + t * math.radians(90)   # swing front-to-rear
    cam_obj.location = (
        RADIUS * math.sin(ang),
        -RADIUS * math.cos(ang),
        ELBOW_Z,
    )
    cam_obj.rotation_euler = (
        math.radians(90),
        0.0,
        math.atan2(RADIUS * math.sin(ang), RADIUS * math.cos(ang)),
    )
    cam_obj.keyframe_insert('location',       frame=frame)
    cam_obj.keyframe_insert('rotation_euler', frame=frame)

# Extend forearm animation: add return keyframe at frame 90
arm = bpy.data.objects.get(next(
    (o.name for o in bpy.data.objects if o.type == 'ARMATURE'), ''
))
if arm:
    pb = arm.pose.bones.get('forearm')
    if pb:
        pb.rotation_mode = 'XYZ'
        pb.rotation_euler.x = 0.0
        pb.keyframe_insert(data_path='rotation_euler', index=0, frame=FRAMES)

# Lighting: key from front-right, rim from back, fill low
def spot(name, loc, energy, colour=(1, 1, 1)):
    ld          = bpy.data.lights.new(name, 'SPOT')
    ld.energy   = energy
    ld.color    = colour
    ld.spot_size  = math.radians(40)
    ld.spot_blend = 0.25
    lo = bpy.data.objects.new(name, ld)
    scene.collection.objects.link(lo)
    lo.location = loc

spot("Key",  ( 0.6, -0.5, 0.9), 1400, (1.0, 0.97, 0.92))
spot("Rim",  (-0.5,  0.6, 0.7),  700, (0.6,  0.8,  1.0))
spot("Fill", ( 0.0,  0.4, 0.2),  300, (0.9,  0.9,  1.0))

world = bpy.data.worlds.new("RecWorld")
scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.5

bpy.ops.render.render(animation=True)
print(f"[elbow-driver] Viewport recording saved to {OUT_MP4}")

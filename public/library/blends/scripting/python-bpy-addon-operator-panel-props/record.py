"""
RECORD: python-bpy-addon-operator-panel-props
Renders a 10-second viewport animation to:
  public/library/videos/scripting/python-bpy-addon-operator-panel-props/viewport.mp4

Technique: top-down camera orbiting the 4×4 grid; F-Curve drives a slow 360°
rotation on the grid parent empty so every object sweeps into view.
Run inside Blender 5.1 (Scripting workspace → Run Script).
"""

import bpy, math

OUTPUT = "//../../../../videos/scripting/python-bpy-addon-operator-panel-props/viewport.mp4"
FPS    = 30
FRAMES = 300   # 10 s

# ── Clear and rebuild scene ────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

# Source icosphere
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.45, location=(0, 0, 0))
src = bpy.context.active_object
src.name = "grid_source"

mat = bpy.data.materials.new("holoflow_cyan_rec")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.08, 0.62, 0.85, 1.0)
bsdf.inputs["Roughness"].default_value  = 0.35
src.data.materials.append(mat)

# Stamp a 4×4 grid manually (blueprint.py's addon might not be loaded)
GRID_N   = 4
SPACING  = 1.2
all_obs  = [src]

for row in range(GRID_N):
    for col in range(GRID_N):
        if col == 0 and row == 0:
            continue
        bpy.ops.object.select_all(action="DESELECT")
        src.select_set(True)
        bpy.context.view_layer.objects.active = src
        bpy.ops.object.duplicate(linked=True)
        dup = bpy.context.active_object
        dup.location = (col * SPACING, row * SPACING, 0.0)
        all_obs.append(dup)

# Parent everything to an empty for rotation animation
bpy.ops.object.empty_add(type="PLAIN_AXES", location=(
    (GRID_N - 1) * SPACING / 2,
    (GRID_N - 1) * SPACING / 2,
    0.0,
))
pivot = bpy.context.active_object
pivot.name = "grid_pivot"

for ob in all_obs:
    ob.select_set(True)
pivot.select_set(True)
bpy.context.view_layer.objects.active = pivot
bpy.ops.object.parent_set(type="OBJECT", keep_transform=True)

# Animate pivot: 0° → 360° over 300 frames
pivot.rotation_euler.z = 0.0
pivot.keyframe_insert("rotation_euler", index=2, frame=1)
pivot.rotation_euler.z = math.radians(360)
pivot.keyframe_insert("rotation_euler", index=2, frame=FRAMES)

# Linear F-Curve for constant spin
for fc in pivot.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ── Camera ──────────────────────────────────────────────────────────────────────
cx = (GRID_N - 1) * SPACING / 2
cy = (GRID_N - 1) * SPACING / 2
bpy.ops.object.camera_add(location=(cx, cy, 12.0))
cam = bpy.context.active_object
cam.name = "rec_cam"
cam.rotation_euler = (0, 0, 0)
cam.data.type   = "PERSP"
cam.data.lens   = 50.0
cam.data.clip_end = 100.0
bpy.context.scene.camera = cam

# Track-to constraint so camera always faces the grid centre
tc = cam.constraints.new("TRACK_TO")
tc.target    = pivot
tc.track_axis = "TRACK_NEGATIVE_Z"
tc.up_axis   = "UP_Y"

# Gentle orbit: camera rotates 30° around the centre during the 10 s clip
bpy.ops.object.empty_add(type="PLAIN_AXES", location=(cx, cy, 0.0))
cam_pivot = bpy.context.active_object
cam_pivot.name = "cam_orbit_pivot"
cam.parent = cam_pivot

cam_pivot.rotation_euler.z = math.radians(-15)
cam_pivot.keyframe_insert("rotation_euler", index=2, frame=1)
cam_pivot.rotation_euler.z = math.radians(15)
cam_pivot.keyframe_insert("rotation_euler", index=2, frame=FRAMES)

for fc in cam_pivot.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ── Lighting ──────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type="SUN", location=(cx + 5, cy - 5, 12))
sun = bpy.context.active_object
sun.name         = "rec_sun"
sun.data.energy  = 4.0
sun.rotation_euler = (math.radians(45), 0, math.radians(35))

bpy.ops.object.light_add(type="AREA", location=(cx - 4, cy + 4, 8))
fill = bpy.context.active_object
fill.name          = "rec_fill"
fill.data.energy   = 60.0
fill.data.size     = 6.0

# ── Render settings ────────────────────────────────────────────────────────────
scn = bpy.context.scene
scn.render.engine              = "BLENDER_EEVEE_NEXT"
scn.render.resolution_x        = 1920
scn.render.resolution_y        = 1080
scn.render.fps                 = FPS
scn.frame_start                = 1
scn.frame_end                  = FRAMES
scn.render.image_settings.file_format = "FFMPEG"
scn.render.ffmpeg.format       = "MPEG4"
scn.render.ffmpeg.codec        = "H264"
scn.render.ffmpeg.constant_rate_factor = "HIGH"
scn.render.filepath            = OUTPUT

bpy.ops.render.render(animation=True)
print(f"record.py: rendered {FRAMES} frames → {OUTPUT}")

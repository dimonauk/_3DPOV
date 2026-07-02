"""
record.py — Viewport animation render for rolling-sphere-physics
Blender 5.1  |  CC0  |  Holoflow Studio

Produces:  public/library/videos/geometry-nodes/gn-simulation-zone-rolling-sphere-physics/viewport.mp4
Duration:  120 frames @ 24 fps = 5 seconds
Content:   Sphere launches, arcs, bounces on undulating terrain; camera orbits

Run AFTER blueprint.py has baked the simulation:
    blender rolling_sphere.blend --python record.py
"""

import bpy, math

OUTPUT = "//../../videos/geometry-nodes/gn-simulation-zone-rolling-sphere-physics/viewport.mp4"
FRAMES = 120
FPS    = 24

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps   = FPS


# ── Render settings (viewport GL render via OpenGL Animation) ──────────────────
scene.render.resolution_x      = 1920
scene.render.resolution_y      = 1080
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format      = 'MPEG4'
scene.render.ffmpeg.codec       = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath           = OUTPUT


# ── Camera orbit (60-degree arc over 120 frames) ───────────────────────────────
cam_data = bpy.data.cameras.get("Camera")
if cam_data is None:
    cam_data = bpy.data.cameras.new("Camera")
cam_obj  = bpy.data.objects.get("Camera")
if cam_obj is None:
    cam_obj = bpy.data.objects.new("Camera", cam_data)
    scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

cam_obj.rotation_euler = (math.radians(65), 0, 0)
CAM_RADIUS = 6.0
CAM_HEIGHT = 3.5

for f in range(1, FRAMES + 1):
    t = (f - 1) / (FRAMES - 1)          # 0.0 → 1.0
    angle = math.radians(-30 + 60 * t)  # -30° → +30° orbit
    cam_obj.location.x = CAM_RADIUS * math.sin(angle)
    cam_obj.location.y = -CAM_RADIUS * math.cos(angle)
    cam_obj.location.z = CAM_HEIGHT
    # Point at terrain centre, slightly elevated
    cam_obj.rotation_euler = (math.radians(65), 0, angle)
    cam_obj.keyframe_insert('location',        frame=f)
    cam_obj.keyframe_insert('rotation_euler',  frame=f)


# ── Viewport display tweaks ────────────────────────────────────────────────────
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        space = area.spaces.active
        space.shading.type            = 'MATERIAL'   # Lookdev
        space.shading.use_scene_lights = True
        space.overlay.show_floor      = False
        space.overlay.show_axis_x     = False
        space.overlay.show_axis_y     = False
        space.overlay.show_cursor     = False
        break

# Add a sun lamp if none exists
if not any(o.type == 'LIGHT' for o in bpy.data.objects):
    bpy.ops.object.light_add(type='SUN', location=(3, -3, 6))
    sun = bpy.context.active_object
    sun.data.energy = 4.0
    sun.rotation_euler = (math.radians(45), 0, math.radians(30))


# ── Render ─────────────────────────────────────────────────────────────────────
bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False)
print(f"[record] wrote {OUTPUT}")

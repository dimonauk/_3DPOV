"""
record.py — Viewport animation for Mandelbrot/Julia fractal tutorial.
Blender 5.1 | CC0 | Holoflow Studio

Renders a 12-second (360 frame) animation:
  • Frames 1–120:   camera orbits the Mandelbrot relief mesh (overhead spiral)
  • Frames 121–240: cuts to Julia set, zooming into the rabbit-ear boundary
  • Frames 241–360: poi curve (NURBS path) highlighted, camera follows it

Run this script in Blender's Scripting workspace AFTER blueprint.py has
been run and the objects are in the scene.

Output: public/library/videos/scripting/python-numpy-mandelbrot-julia-fractal-poi-webxr/viewport.mp4
"""

import bpy
import math

OUTPUT_PATH   = "//../../videos/scripting/python-numpy-mandelbrot-julia-fractal-poi-webxr/viewport"
FPS           = 30
TOTAL_FRAMES  = 360
CAM_HEIGHT    = 4.0          # metres above XY plane
ORBIT_RADIUS  = 2.5          # orbit radius

scene = bpy.context.scene
scene.render.fps = FPS
scene.frame_start = 1
scene.frame_end = TOTAL_FRAMES
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format = "MPEG4"
scene.render.ffmpeg.codec = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath = OUTPUT_PATH
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080

# ── Camera setup ─────────────────────────────────────────────────────────────

if "RecordCam" not in bpy.data.objects:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    scene.collection.objects.link(cam_obj)
else:
    cam_obj = bpy.data.objects["RecordCam"]

scene.camera = cam_obj

# Helper: insert camera location + rotation keyframe

def key_cam(frame: int, x: float, y: float, z: float,
            rx: float, ry: float, rz: float) -> None:
    cam_obj.location = (x, y, z)
    cam_obj.rotation_euler = (math.radians(rx), math.radians(ry), math.radians(rz))
    cam_obj.keyframe_insert("location", frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)


# Phase 1 (frames 1–120): overhead orbit of Mandelbrot mesh
# Centre the orbit over the Mandelbrot mesh centre: x≈-0.75, y=0
MC_X = ((-2.5 + 1.0) / 2.0)   # −0.75

for f in range(1, 121):
    t   = (f - 1) / 120.0
    ang = t * 360.0             # degrees
    rad = math.radians(ang)
    cx  = MC_X + ORBIT_RADIUS * math.cos(rad)
    cy  = ORBIT_RADIUS * math.sin(rad)
    key_cam(f, cx, cy, CAM_HEIGHT, 80, 0, ang + 90)

# Phase 2 (frames 121–240): zoom into Julia rabbit-ear
# Julia mesh offset: x ≈ (-2.5+1.0)/2 + 3.5 + 0.4 = 2.65  (see blueprint line)
JC_X = MC_X + (1.0 - (-2.5)) + 0.4 + 0.0   # ≈ 2.65

for f in range(121, 241):
    t = (f - 121) / 120.0
    z = CAM_HEIGHT - t * 2.5    # swoop down from 4 m to 1.5 m
    key_cam(f, JC_X, 0.0, max(z, 1.5), 70 + t * 15, 0, 0)

# Phase 3 (frames 241–360): poi boundary curve — slow orbit at low angle
for f in range(241, 361):
    t   = (f - 241) / 120.0
    ang = t * 360.0
    rad = math.radians(ang)
    cx  = MC_X + 2.0 * math.cos(rad)
    cy  = 2.0 * math.sin(rad)
    key_cam(f, cx, cy, 1.8, 55, 0, ang + 90)

# ── Eevee render settings ─────────────────────────────────────────────────────
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.eevee.taa_render_samples = 16

# ── Viewport shading for vertex colours ──────────────────────────────────────
for area in bpy.context.screen.areas:
    if area.type == "VIEW_3D":
        for space in area.spaces:
            if space.type == "VIEW_3D":
                space.shading.type = "MATERIAL"
                space.shading.color_type = "VERTEX"
                break

print("record.py done — run Render > Render Animation (Ctrl+F12) to produce viewport.mp4.")
print(f"Output path: {OUTPUT_PATH}.mp4")

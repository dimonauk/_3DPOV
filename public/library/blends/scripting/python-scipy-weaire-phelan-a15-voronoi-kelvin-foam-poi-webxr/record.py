"""
record.py — Viewport animation recording for the Weaire-Phelan foam tutorial.

Outputs:  public/library/videos/scripting/
              python-scipy-weaire-phelan-a15-voronoi-kelvin-foam-poi-webxr/
              viewport.mp4

Runtime: ~10 s at 1920×1080, 30 fps, 300 frames.
Run AFTER blueprint.py (the foam mesh must already be in the scene).
Invoke: blender --background hf_weaire_phelan.blend --python record.py

Animation description (15 s)
-----------------------------
0 – 3 s   : Camera orbits around the unit cell; all 8 cells visible.
3 – 6 s   : Shape-key weight on "shrink_84" ramps from 0 → 1 on all cells,
             pulling each polyhedron inward toward its seed — gaps between
             cells open and reveal the foam topology.
6 – 9 s   : Camera moves closer, framing the 2 teal pyritohedra.
9 – 12 s  : Shape-key reverses back to Basis; cells snap back to full volume.
12 – 15 s : Slow 360° orbit at final camera height; bloom on emission glows.
"""

import bpy, math

SLUG     = "hf_weaire_phelan"
FPS      = 30
DURATION = 15                       # seconds
FRAMES   = FPS * DURATION           # = 450
ORBIT_R  = 4.2                      # camera orbit radius (metres)
CAM_H    = 2.0                      # camera height
OUT_PATH = ("//../../videos/scripting/"
            "python-scipy-weaire-phelan-a15-voronoi-kelvin-foam-poi-webxr/"
            "viewport.mp4")

scene = bpy.context.scene
scene.render.fps        = FPS
scene.frame_start       = 1
scene.frame_end         = FRAMES
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.filepath   = bpy.path.abspath(OUT_PATH)
scene.render.image_settings.file_format   = 'FFMPEG'
scene.render.ffmpeg.format                = 'MPEG4'
scene.render.ffmpeg.codec                 = 'H264'
scene.render.ffmpeg.constant_rate_factor  = 'HIGH'

# ── Camera orbit keyframes ────────────────────────────────────────────────────
cam = scene.camera

def set_cam(frame, angle_deg, height, radius=ORBIT_R):
    a = math.radians(angle_deg)
    cam.location = (radius * math.cos(a), radius * math.sin(a), height)
    cam.keyframe_insert("location", frame=frame)
    dx, dy = -math.cos(a), -math.sin(a)
    cam.rotation_euler = (math.radians(75) - math.atan2(height, radius),
                          0,
                          math.atan2(dy, dx) + math.radians(90))
    cam.keyframe_insert("rotation_euler", frame=frame)

set_cam(1,    0,   CAM_H)
set_cam(90,   90,  CAM_H)
set_cam(180,  0,   CAM_H * 0.6)     # closer at frame 180
set_cam(270,  -90, CAM_H * 0.6)
set_cam(FRAMES, 360, CAM_H)

# ── Shape-key shrink animation on every cell mesh ─────────────────────────────
SHRINK_KEY = "shrink_84"

for obj in scene.objects:
    if obj.data and hasattr(obj.data, 'shape_keys') and obj.data.shape_keys:
        kb = obj.data.shape_keys.key_blocks.get(SHRINK_KEY)
        if kb is None:
            continue
        # ramp 0 → 1 from frame 90 to 180, then back 1 → 0 from 270 to 360
        kb.value = 0.0
        kb.keyframe_insert("value", frame=1)
        kb.keyframe_insert("value", frame=90)
        kb.value = 1.0
        kb.keyframe_insert("value", frame=180)
        kb.keyframe_insert("value", frame=270)
        kb.value = 0.0
        kb.keyframe_insert("value", frame=360)
        kb.keyframe_insert("value", frame=FRAMES)

# ── Smooth interpolation ──────────────────────────────────────────────────────
for obj in (cam, *scene.objects):
    if obj.animation_data and obj.animation_data.action:
        for fcurve in obj.animation_data.action.fcurves:
            for kp in fcurve.keyframe_points:
                kp.interpolation = 'BEZIER'

bpy.ops.render.render(animation=True)
print("[WP record] viewport.mp4 done")

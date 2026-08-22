"""
record.py — Viewport animation render for Barth Sextic poi head (Blender 5.1)
═══════════════════════════════════════════════════════════════════════════════
Output: public/library/videos/scripting/
        python-numpy-barth-sextic-65-nodes-miyaoka-bound-icosahedral-symmetry-poi-head-webxr/
        viewport.mp4

Sequence (10 seconds @ 24 fps = 240 frames):
  f001–060   Camera orbits 180° around the poi head — Barth sextic spins
             slowly in place, vertex-colour mode showing the node-proximity
             gradient (deep-blue nodes revealed as the surface rotates).
  f061–120   Zoom-in path tracking from equator to north pole: top-down
             reveals the 5-fold icosahedral symmetry along z-axis.
  f121–180   Shape-key morph: SK_Compact → Basis → SK_Inflate animated over
             60 frames so the surface "breathes", nodes remaining visible.
  f181–240   Pull back to full-frame as poi head transitions to SK_Flatten,
             exposing the planar cross-section of the 65-node arrangement.

Run AFTER blueprint.py has built 'hf_barth_sextic'.
"""

import bpy, math
from mathutils import Vector, Euler

SLUG      = "python-numpy-barth-sextic-65-nodes-miyaoka-bound-icosahedral-symmetry-poi-head-webxr"
OUT_DIR   = f"//../../../../videos/scripting/{SLUG}/"
FPS       = 24
FRAMES    = 240
OBJ_NAME  = "hf_barth_sextic"

# ── Scene ─────────────────────────────────────────────────────────────────────
scene               = bpy.context.scene
scene.render.fps    = FPS
scene.frame_start   = 1
scene.frame_end     = FRAMES
scene.render.resolution_x    = 1920
scene.render.resolution_y    = 1080
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 18
scene.render.filepath   = OUT_DIR + "viewport.mp4"

# Workbench engine: vertex colour + cavity for fast readable render
scene.render.engine           = 'BLENDER_WORKBENCH'
shading = scene.display.shading
shading.light                 = 'MATCAP'
shading.color_type            = 'VERTEX'
shading.cavity_type           = 'BOTH'
shading.cavity_ridge_factor   = 1.4
shading.cavity_valley_factor  = 1.4
shading.show_cavity           = True
shading.shadow_intensity      = 0.6

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data       = bpy.data.cameras.new("RecordCam")
cam_data.lens  = 85.0                        # telephoto to flatten perspective
cam_ob         = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_ob)
scene.camera   = cam_ob

def key_cam(frame, loc, rot_deg):
    cam_ob.location        = Vector(loc)
    cam_ob.rotation_euler  = Euler([math.radians(r) for r in rot_deg], 'XYZ')
    cam_ob.keyframe_insert("location",       frame=frame)
    cam_ob.keyframe_insert("rotation_euler", frame=frame)

# f001: low equatorial orbit start — facing poi head
key_cam(  1, ( 0.30,  0.00,  0.02), ( 90,  0,   0))
# f060: 180° orbit completed, now behind
key_cam( 60, (-0.30,  0.00,  0.02), ( 90,  0, 180))
# f061–120: move to top-down pole view
key_cam( 61, ( 0.00,  0.00,  0.35), (  0,  0,   0))
key_cam(120, ( 0.00,  0.00,  0.28), (  0,  0,  90))
# f121–180: return to equatorial for shape-key breathing pass
key_cam(121, ( 0.25,  0.08,  0.06), ( 85,  0,  20))
key_cam(180, ( 0.25, -0.08,  0.06), ( 85,  0, 340))
# f181–240: pull back wide for flatten key
key_cam(181, ( 0.30,  0.15,  0.15), ( 75,  0,  30))
key_cam(240, ( 0.40,  0.00,  0.20), ( 78,  0,   0))

# ── Sun lamp ──────────────────────────────────────────────────────────────────
sun_data            = bpy.data.lights.new("Sun", type='SUN')
sun_data.energy     = 2.0
sun_ob              = bpy.data.objects.new("Sun", sun_data)
sun_ob.rotation_euler = Euler([math.radians(45), 0, math.radians(30)], 'XYZ')
bpy.context.collection.objects.link(sun_ob)

# ── Shape-key animation ───────────────────────────────────────────────────────
poi = bpy.data.objects.get(OBJ_NAME)
if poi and poi.data.shape_keys:
    keys = poi.data.shape_keys.key_blocks
    def key_val(name, frame, val):
        if name in keys:
            keys[name].value = val
            keys[name].keyframe_insert("value", frame=frame)
    # f121-180: SK_Compact → Basis → SK_Inflate "breathing"
    key_val("SK_Compact", 121, 0.0); key_val("SK_Inflate", 121, 0.0)
    key_val("SK_Compact", 135, 1.0); key_val("SK_Inflate", 135, 0.0)
    key_val("SK_Compact", 150, 0.0); key_val("SK_Inflate", 150, 0.0)
    key_val("SK_Compact", 165, 0.0); key_val("SK_Inflate", 165, 1.0)
    key_val("SK_Compact", 180, 0.0); key_val("SK_Inflate", 180, 0.0)
    # f181–240: flatten transition
    key_val("SK_Flatten", 181, 0.0)
    key_val("SK_Flatten", 210, 1.0)
    key_val("SK_Flatten", 240, 0.0)

# ── Render ───────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"Viewport render complete → {OUT_DIR}viewport.mp4")

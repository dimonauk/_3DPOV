"""
record.py — Viewport animation render for Cayley Nodal Cubic poi head (Blender 5.1)
════════════════════════════════════════════════════════════════════════════════════
Output: public/library/videos/scripting/
        python-numpy-cayley-nodal-cubic-4-nodes-9-lines-algebraic-surface-poi-head-webxr/
        viewport.mp4

Sequence (10 seconds @ 24 fps = 240 frames):
  f001–060  Camera orbits 180° around the poi head. The node-proximity vertex
            colour (amber surface, deep-blue node pinch) rotates with the surface.
  f061–120  Zoom into the origin node from the side: the A₁ quadric cone geometry
            becomes visible as the two sheets approach each other.
  f121–180  Shape-key breathing: SK_Tight → Basis → SK_Wide over 60 frames,
            showing how the cubic branches extend from the node.
  f181–240  SK_Flatten descends, exposing the 2D cross-section where the
            9-line pattern (3 axes + offset lines) becomes clear.

Run AFTER blueprint.py has built 'hf_cayley_cubic'.
"""

import bpy, math
from mathutils import Vector, Euler

SLUG     = "python-numpy-cayley-nodal-cubic-4-nodes-9-lines-algebraic-surface-poi-head-webxr"
OUT_DIR  = f"//../../../../videos/scripting/{SLUG}/"
FPS      = 24
FRAMES   = 240
OBJ_NAME = "hf_cayley_cubic"

# ── Scene ─────────────────────────────────────────────────────────────────────
scene                              = bpy.context.scene
scene.render.fps                   = FPS
scene.frame_start                  = 1
scene.frame_end                    = FRAMES
scene.render.resolution_x          = 1920
scene.render.resolution_y          = 1080
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format         = 'MPEG4'
scene.render.ffmpeg.codec          = 'H264'
scene.render.ffmpeg.constant_rate_factor = 18
scene.render.filepath              = OUT_DIR + "viewport.mp4"

# Workbench engine with vertex colour — fast, readable, no bake required
scene.render.engine                = 'BLENDER_WORKBENCH'
shading                            = scene.display.shading
shading.light                      = 'MATCAP'
shading.color_type                 = 'VERTEX'
shading.cavity_type                = 'BOTH'
shading.cavity_ridge_factor        = 1.5
shading.cavity_valley_factor       = 1.3
shading.show_cavity                = True
shading.shadow_intensity           = 0.55

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data      = bpy.data.cameras.new("RecordCam")
cam_data.lens = 85.0               # telephoto: flattens perspective, node cone visible
cam_ob        = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_ob)
scene.camera  = cam_ob

def key_cam(frame, loc, rot_deg):
    cam_ob.location       = Vector(loc)
    cam_ob.rotation_euler = Euler([math.radians(r) for r in rot_deg], 'XYZ')
    cam_ob.keyframe_insert("location",       frame=frame)
    cam_ob.keyframe_insert("rotation_euler", frame=frame)

# f001: equatorial orbit start — side view revealing node + amber surface
key_cam(  1, ( 0.28,  0.00,  0.00), ( 90,  0,   0))
key_cam( 60, (-0.28,  0.00,  0.00), ( 90,  0, 180))
# f061–120: zoom into node (origin) from the side
key_cam( 61, ( 0.18,  0.00,  0.00), ( 90,  0,   0))
key_cam(120, ( 0.10,  0.00,  0.00), ( 90,  0,   0))
# f121–180: pull back, equatorial view for shape-key breathing
key_cam(121, ( 0.26,  0.06,  0.04), ( 87,  0,  15))
key_cam(180, ( 0.26, -0.06,  0.04), ( 87,  0, 345))
# f181–240: overhead view for flatten cross-section
key_cam(181, ( 0.00,  0.00,  0.32), (  0,  0,   0))
key_cam(240, ( 0.00,  0.00,  0.28), (  0,  0, 120))

# ── Light ─────────────────────────────────────────────────────────────────────
sun_data            = bpy.data.lights.new("Sun", type='SUN')
sun_data.energy     = 2.0
sun_ob              = bpy.data.objects.new("Sun", sun_data)
sun_ob.rotation_euler = Euler([math.radians(50), 0, math.radians(25)], 'XYZ')
bpy.context.collection.objects.link(sun_ob)

# ── Shape-key animation ───────────────────────────────────────────────────────
poi = bpy.data.objects.get(OBJ_NAME)
if poi and poi.data.shape_keys:
    keys = poi.data.shape_keys.key_blocks

    def key_val(name, frame, val):
        if name in keys:
            keys[name].value = val
            keys[name].keyframe_insert("value", frame=frame)

    # f121-180: SK_Tight → Basis → SK_Wide breathing
    key_val("SK_Tight", 121, 0.0); key_val("SK_Wide", 121, 0.0)
    key_val("SK_Tight", 138, 1.0); key_val("SK_Wide", 138, 0.0)
    key_val("SK_Tight", 151, 0.0); key_val("SK_Wide", 151, 0.0)
    key_val("SK_Tight", 165, 0.0); key_val("SK_Wide", 165, 1.0)
    key_val("SK_Tight", 180, 0.0); key_val("SK_Wide", 180, 0.0)

    # f181–240: Flatten for cross-section view
    key_val("SK_Flatten", 181, 0.0)
    key_val("SK_Flatten", 212, 1.0)
    key_val("SK_Flatten", 240, 0.0)

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"Viewport render complete → {OUT_DIR}viewport.mp4")

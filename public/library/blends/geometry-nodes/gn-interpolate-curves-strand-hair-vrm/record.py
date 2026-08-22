"""
record.py — Viewport animation for GN Interpolate Curves strand hair
Blender 5.1 · CC0 — Holoflow Studio

Run AFTER blueprint.py.  Animates the Seed modifier parameter over 90 frames,
randomising strand placement and showing how guide-curve distribution controls
the overall silhouette while the GN system fills density automatically.

Output: public/library/videos/geometry-nodes/
          gn-interpolate-curves-strand-hair-vrm/viewport.mp4
"""

import bpy, math

VIDEO_OUT  = bpy.path.abspath(
    "//../../../../videos/geometry-nodes/"
    "gn-interpolate-curves-strand-hair-vrm/viewport.mp4"
)
TOTAL_FRAMES = 90
FPS          = 30

# ── Scene / render settings ───────────────────────────────────────────────────
sc = bpy.context.scene
sc.frame_start = 1
sc.frame_end   = TOTAL_FRAMES
sc.render.fps  = FPS
sc.render.resolution_x = 1280
sc.render.resolution_y = 720

sc.render.engine              = 'BLENDER_EEVEE_NEXT'
sc.eevee.taa_render_samples   = 16
sc.render.film_transparent     = False
sc.render.image_settings.file_format       = 'FFMPEG'
sc.render.ffmpeg.format                    = 'MPEG4'
sc.render.ffmpeg.codec                     = 'H264'
sc.render.ffmpeg.constant_rate_factor      = 'MEDIUM'
sc.render.filepath = VIDEO_OUT

# ── Camera ───────────────────────────────────────────────────────────────────
if "RecordCam" not in bpy.data.objects:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 85.0
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
else:
    cam_obj = bpy.data.objects["RecordCam"]

import mathutils
# Three-quarter overhead view showing the full scalp hair silhouette
cam_obj.location = mathutils.Vector((0.22, -0.34, 0.28))
cam_obj.rotation_euler = mathutils.Euler((math.radians(60), 0, math.radians(20)), 'XYZ')
sc.camera = cam_obj

# ── Light ────────────────────────────────────────────────────────────────────
if "RecordSun" not in bpy.data.objects:
    sun_data = bpy.data.lights.new("RecordSun", 'SUN')
    sun_obj  = bpy.data.objects.new("RecordSun", sun_data)
    bpy.context.collection.objects.link(sun_obj)
else:
    sun_obj = bpy.data.objects["RecordSun"]

sun_obj.location = mathutils.Vector((0.5, -0.5, 1.0))
sun_obj.data.energy = 3.0
sun_obj.data.angle  = math.radians(5)

# ── Hair material (simple gradient from root to tip) ─────────────────────────
OUT_NAME = "hair_strands"
if OUT_NAME in bpy.data.objects:
    out_obj = bpy.data.objects[OUT_NAME]
    if not out_obj.data.materials:
        mat = bpy.data.materials.new("HairMat")
        mat.use_nodes = True
        tree  = mat.node_tree
        nodes = tree.nodes
        links = tree.links
        nodes.clear()
        bsdf  = nodes.new('ShaderNodeBsdfPrincipled')
        tex_c = nodes.new('ShaderNodeTexGradient')
        tcord = nodes.new('ShaderNodeTexCoord')
        mout  = nodes.new('ShaderNodeOutputMaterial')
        # Gradient along local Z maps root (dark) → tip (warm brown)
        tcord.location = (-500, 0)
        tex_c.location = (-300, 0)
        bsdf.location  = ( 100, 0)
        mout.location  = ( 400, 0)
        links.new(tcord.outputs['Object'],  tex_c.inputs['Vector'])
        links.new(tex_c.outputs['Color'],   bsdf.inputs['Base Color'])
        bsdf.inputs['Roughness'].default_value = 0.6
        links.new(bsdf.outputs['BSDF'], mout.inputs['Surface'])
        out_obj.data.materials.append(mat)

# ── Animate Seed parameter ────────────────────────────────────────────────────
# Phase 1 (frames 1-45): hold seed=0, let viewer see default strand placement
# Phase 2 (frames 46-90): step through seeds 1-5, each held for 9 frames,
#   demonstrating how different seeds reshuffle strands while the guide-driven
#   silhouette remains stable — the key insight of the Interpolate Curves node.

if OUT_NAME in bpy.data.objects:
    mod = bpy.data.objects[OUT_NAME].modifiers.get("HairInterpolate")
    if mod and mod.node_group:
        ng   = mod.node_group
        seed_id = None
        for item in ng.interface.items_tree:
            if item.name == "Seed":
                seed_id = item.identifier
                break
        if seed_id:
            prop_path = f'["{seed_id}"]'
            keyframe_pairs = (
                [( 1, 0), (45, 0)]
                + [(46 + i * 9, i + 1) for i in range(5)]
            )
            for frame, seed_val in keyframe_pairs:
                sc.frame_set(frame)
                mod[seed_id] = seed_val
                bpy.data.objects[OUT_NAME].keyframe_insert(
                    data_path=f'modifiers["HairInterpolate"]{prop_path}',
                    frame=frame,
                )

# ── Render ───────────────────────────────────────────────────────────────────
import os
os.makedirs(os.path.dirname(VIDEO_OUT), exist_ok=True)
bpy.ops.render.render(animation=True)
print(f"[HF] viewport video → {VIDEO_OUT}")

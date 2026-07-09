"""
record.py — Viewport-animation recorder for the Speaker Spatial Audio tutorial
Blender 5.1 | CC0

Renders a 60-frame (2.5 s) sequence showing the orbit speaker circling the
reference sphere and stitches frames into viewport.mp4 via FFmpeg.
The camera is positioned to show all three speakers and the reference geometry.

Run after blueprint.py has been executed in the same .blend session.
"""

import bpy, math, mathutils, os

OUTPUT_DIR = bpy.path.abspath("//viewport_frames/")
OUTPUT_MP4 = bpy.path.abspath("//viewport.mp4")

FRAME_START = 1
FRAME_END   = 60
FPS         = 24

scene = bpy.context.scene
scene.render.engine       = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.fps          = FPS
scene.render.image_settings.file_format = 'JPEG'
scene.render.image_settings.quality     = 92

if hasattr(scene, 'eevee'):
    scene.eevee.taa_render_samples = 32

# ── Camera setup ──────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new('record_cam')
cam_data.lens        = 35.0
cam_data.clip_start  = 0.1
cam_data.clip_end    = 100.0

cam_obj        = bpy.data.objects.new('record_cam', cam_data)
cam_obj.location = mathutils.Vector((6.0, -5.5, 4.0))
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Look at the centre of the speaker arrangement
ref = bpy.data.objects.get('audio_reference_sphere')
if ref:
    cst            = cam_obj.constraints.new('TRACK_TO')
    cst.target     = ref
    cst.track_axis = 'TRACK_NEGATIVE_Z'
    cst.up_axis    = 'UP_Y'

# ── Material: make speakers visually distinct ─────────────────────────────────
speaker_names = ['speaker_ambient', 'speaker_kiosk', 'speaker_orbit']
colours = [
    (0.2, 0.6, 1.0, 1.0),   # ambient — blue
    (1.0, 0.4, 0.1, 1.0),   # kiosk   — orange
    (0.2, 1.0, 0.4, 1.0),   # orbit   — green
]
for name, rgba in zip(speaker_names, colours):
    sp_ob = bpy.data.objects.get(name)
    if sp_ob is None:
        continue
    # Add a small visual sphere to make the speaker visible in the viewport
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.08, location=sp_ob.location)
    vis = bpy.context.active_object
    vis.name = f"{name}_vis"
    mat = bpy.data.materials.new(f"{name}_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = rgba
        bsdf.inputs['Emission Color'].default_value = rgba
        bsdf.inputs['Emission Strength'].default_value = 2.0
    vis.data.materials.append(mat)
    # Parent visual sphere to the speaker object
    vis.parent = sp_ob

# ── Lighting ──────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='SUN', location=(5.0, 5.0, 8.0))
sun = bpy.context.active_object
sun.data.energy = 3.0

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Frame render loop ─────────────────────────────────────────────────────────
for frame in range(FRAME_START, FRAME_END + 1):
    scene.frame_set(frame)
    bpy.context.view_layer.update()
    scene.render.filepath = os.path.join(OUTPUT_DIR, f"frame_{frame:04d}")
    bpy.ops.render.render(write_still=True)
    print(f"[record] frame {frame}/{FRAME_END}")

# ── FFmpeg stitch ─────────────────────────────────────────────────────────────
ffmpeg_cmd = (
    f'ffmpeg -y -framerate {FPS} '
    f'-i "{os.path.join(OUTPUT_DIR, "frame_%04d.jpg")}" '
    f'-c:v libx264 -pix_fmt yuv420p -crf 20 '
    f'"{OUTPUT_MP4}"'
)
print(f"[record] stitching → {OUTPUT_MP4}")
os.system(ffmpeg_cmd)
print("[record] Done.  viewport.mp4 ready.")

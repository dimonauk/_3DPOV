"""
Viewport animation recorder — SPH fluid light-painting trail
Outputs: public/library/videos/geometry-nodes/
           gn-simulation-zone-sph-fluid-pressure-viscosity-light-painting/viewport.mp4

Run AFTER blueprint.py (object "hf_sph_fluid" must exist in the scene).
"""
import bpy, os

OUT_DIR = os.path.join(
    bpy.path.abspath("//"),
    "public", "library", "videos", "geometry-nodes",
    "gn-simulation-zone-sph-fluid-pressure-viscosity-light-painting",
)
os.makedirs(OUT_DIR, exist_ok=True)

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 120           # 5 s at 24 fps — full bowl-fill arc
scene.render.fps  = 24

# Camera — slightly above and to the side of the bowl for a dramatic pour shot
cam_data = bpy.data.cameras.new("cam_sph")
cam_obj  = bpy.data.objects.new("cam_sph", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
cam_obj.location = (1.40, 0.90, 1.40)
cam_obj.rotation_euler = (0.96, 0.0, 0.79)    # ~55° tilt, 45° pan
cam_data.lens = 50.0
scene.camera  = cam_obj

# Ambient world — near-black so emission glows against void
if not scene.world:
    scene.world = bpy.data.worlds.new("sph_world")
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value   = (0.01, 0.01, 0.02, 1)
    bg.inputs["Strength"].default_value = 0.5

# Render settings — EEVEE viewport quality
scene.render.engine          = "BLENDER_EEVEE_NEXT"
scene.eevee.use_bloom        = True
scene.eevee.bloom_intensity  = 0.35
scene.render.resolution_x    = 1280
scene.render.resolution_y    = 720
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format   = "MPEG4"
scene.render.ffmpeg.codec    = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath        = os.path.join(OUT_DIR, "viewport.mp4")

bpy.ops.render.render(animation=True)
print("[SPH record] viewport.mp4 written to", OUT_DIR)

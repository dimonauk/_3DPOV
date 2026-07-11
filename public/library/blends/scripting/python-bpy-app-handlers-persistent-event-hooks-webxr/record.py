"""record.py — Viewport recorder for bpy.app.handlers demo.
Writes:
  public/library/videos/scripting/
  python-bpy-app-handlers-persistent-event-hooks-webxr/viewport.mp4

Scene: animated sphere squishing via shape key (frames 1-24).
Annotation text overlay shows handler names as context.
Camera: slight top-angle perspective at 1280×720, 24fps, H264.

Run after blueprint.py has built the demo scene.
"""
import bpy
import pathlib

SLUG = "python-bpy-app-handlers-persistent-event-hooks-webxr"
OUT  = (
    pathlib.Path(__file__).parents[6]
    / "public" / "library" / "videos" / "scripting" / SLUG / "viewport.mp4"
)
OUT.parent.mkdir(parents=True, exist_ok=True)

scene  = bpy.context.scene
render = scene.render

render.engine                     = "BLENDER_EEVEE_NEXT"
render.resolution_x               = 1280
render.resolution_y               = 720
render.fps                        = 24
render.image_settings.file_format = "FFMPEG"
render.ffmpeg.format              = "MPEG4"
render.ffmpeg.codec               = "H264"
render.ffmpeg.constant_rate_factor = "HIGH"
render.ffmpeg.ffmpeg_preset       = "GOOD"
render.filepath                   = str(OUT)

scene.frame_start = 1
scene.frame_end   = 24

# ── camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
cam_obj.location       = (3.5, -3.5, 2.8)
cam_obj.rotation_euler = (1.05, 0.0, 0.79)
scene.camera = cam_obj

# ── EEVEE settings ────────────────────────────────────────────────────────────
scene.eevee.use_shadows = True
scene.eevee.taa_render_samples = 16

# ── annotation overlay — shows which handlers are active ─────────────────────
# Text curve visible in final render as a real 3-D object, not a viewport overlay
info = bpy.data.curves.new("HF_Overlay", "FONT")
info_obj = bpy.data.objects.new("HF_Overlay", info)
bpy.context.scene.collection.objects.link(info_obj)
info_obj.location = (-1.6, 0.0, -1.7)
info_obj.scale    = (0.14, 0.14, 0.14)
info.body = (
    "bpy.app.handlers · Blender 5.1\n"
    "frame_change_post  →  VAT sampler\n"
    "depsgraph_update_post  →  light_rig.json\n"
    "save_post  →  GLB auto-export"
)

# ── render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, use_viewport=False)
print(f"[holoflow] viewport.mp4 → {OUT}")

"""
record.py — viewport animation for the cloth VAT tutorial
Blender 5.1  ·  CC0

Renders a 5-second (48-frame @ ~10 fps actual capture speed) viewport
animation showing the flag billowing from rest to full deformation.
Output: public/library/videos/scripting/
        python-cloth-modifier-sim-bake-vertex-animation-texture-webxr/
        viewport.mp4

Run from Blender's Text Editor after blueprint.py has been executed and
the .blend saved (cloth_vat.blend).
"""
import bpy
import math

OUTDIR  = "//../../videos/scripting/python-cloth-modifier-sim-bake-vertex-animation-texture-webxr/"
FNAME   = "viewport"
FPS     = 24
FRAMES  = 48

sc  = bpy.context.scene
cam_data = bpy.data.cameras.new("RecordCam")
cam_ob   = bpy.data.objects.new("RecordCam", cam_data)
sc.collection.objects.link(cam_ob)
sc.camera = cam_ob

cam_ob.location       = (0.0, -1.6, 0.3)
cam_ob.rotation_euler = (math.radians(88), 0.0, 0.0)
cam_data.lens         = 50.0

# Viewport render via OpenGL animation — records the 3D view as-is
sc.render.resolution_x   = 1920
sc.render.resolution_y   = 1080
sc.render.fps            = FPS
sc.frame_start           = 1
sc.frame_end             = FRAMES
sc.render.filepath       = OUTDIR + FNAME
sc.render.image_settings.file_format = "FFMPEG"
sc.render.ffmpeg.format              = "MPEG4"
sc.render.ffmpeg.codec               = "H264"
sc.render.ffmpeg.constant_rate_factor = "HIGH"

# Shade smooth the cloth for the recording
for ob in sc.objects:
    if ob.type == 'MESH' and ob.name.startswith("Cloth"):
        for poly in ob.data.polygons:
            poly.use_smooth = True

# Run the OpenGL viewport render
bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False)
print(f"[record] viewport.mp4 → {OUTDIR}")

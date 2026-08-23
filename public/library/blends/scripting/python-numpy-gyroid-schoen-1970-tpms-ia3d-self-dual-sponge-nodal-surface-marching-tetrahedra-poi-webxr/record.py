"""
record.py — Viewport animation renderer for the Schoen Gyroid poi head.
Blender 5.1 · Holoflow Studio · CC0

Run with:  blender --background --python record.py
Output:  public/library/videos/scripting/<slug>/viewport.mp4

Animation plan (300 frames @ 30 fps = 10 s):
  F  0 – 60   : Hold on Basis — gyroid sphere, slow 30° orbit
  F 61 – 120  : Morph Basis → SK_ThickShell  (one labyrinth fills in)
  F121 – 180  : Hold SK_ThickShell — continue orbit
  F181 – 240  : Morph SK_ThickShell → SK_ThinShell  (self-duality symmetry)
  F241 – 300  : Morph SK_ThinShell → Basis — full return + wide shot
"""

import bpy, math
from pathlib import Path

HERE    = Path(__file__).parent
SLUG    = "python-numpy-gyroid-schoen-1970-tpms-ia3d-self-dual-sponge-nodal-surface-marching-tetrahedra-poi-webxr"
OUT_DIR = Path(__file__).parents[4] / "videos" / "scripting" / SLUG
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_MP4 = str(OUT_DIR / "viewport.mp4")
BLEND   = str(HERE / "hf_gyroid_poi.blend")
OBJ_NAME = "hf_gyroid_poi"

FPS    = 30
FRAMES = 300
CAM_DIST  = 0.22   # metres from origin
CAM_ELEV  = 30     # degrees above horizon
LENS_MM   = 85

def setup_scene():
    bpy.ops.wm.open_mainfile(filepath=BLEND)
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAMES
    scene.render.fps  = FPS
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format        = "MPEG4"
    scene.render.ffmpeg.codec         = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath = OUT_MP4
    scene.render.engine   = "BLENDER_EEVEE_NEXT"
    eevee = scene.eevee
    eevee.use_bloom            = True
    eevee.bloom_threshold      = 0.40
    eevee.bloom_intensity      = 0.18
    eevee.use_gtao             = True
    eevee.use_shadows          = True

def setup_camera():
    bpy.ops.object.camera_add()
    cam = bpy.context.object
    cam.name = "RecordCam"
    cam.data.lens = LENS_MM
    elev_r = math.radians(CAM_ELEV)
    cam.location = (0, -CAM_DIST * math.cos(elev_r), CAM_DIST * math.sin(elev_r))
    cam.rotation_euler = (math.radians(90 - CAM_ELEV), 0, 0)
    bpy.context.scene.camera = cam
    return cam

def setup_lights():
    # Key light
    bpy.ops.object.light_add(type="SUN", location=(2, -2, 4))
    sun = bpy.context.object
    sun.data.energy = 3.5
    sun.data.angle  = math.radians(5)
    sun.rotation_euler = (math.radians(45), 0, math.radians(-30))
    # Fill light
    bpy.ops.object.light_add(type="SUN", location=(-2, -1, 2))
    fill = bpy.context.object
    fill.data.energy = 1.0
    fill.rotation_euler = (math.radians(60), 0, math.radians(120))

def animate_shape_keys(obj):
    """Morph between Basis / SK_ThickShell / SK_ThinShell."""
    sk = obj.data.shape_keys
    basis = sk.key_blocks["Basis"]
    thick = sk.key_blocks["SK_ThickShell"]
    thin  = sk.key_blocks["SK_ThinShell"]

    def key_val(kb, frame, val):
        kb.value = val
        kb.keyframe_insert("value", frame=frame)

    # Basis hold → 0..60
    key_val(basis, 1,   1.0);  key_val(thick, 1,   0.0);  key_val(thin, 1,   0.0)
    key_val(basis, 60,  1.0);  key_val(thick, 60,  0.0);  key_val(thin, 60,  0.0)
    # Morph to ThickShell → 61..120
    key_val(basis, 120, 0.0);  key_val(thick, 120, 1.0);  key_val(thin, 120, 0.0)
    # Hold → 121..180 (implicit — same values)
    key_val(basis, 180, 0.0);  key_val(thick, 180, 1.0);  key_val(thin, 180, 0.0)
    # Morph to ThinShell → 181..240
    key_val(basis, 240, 0.0);  key_val(thick, 240, 0.0);  key_val(thin, 240, 1.0)
    # Return to Basis → 241..300
    key_val(basis, 300, 1.0);  key_val(thick, 300, 0.0);  key_val(thin, 300, 0.0)

def animate_camera_orbit(cam):
    """Slow 180° orbit over 300 frames."""
    for f in range(1, FRAMES + 1):
        angle = math.radians(f * 180.0 / FRAMES)
        elev_r = math.radians(CAM_ELEV)
        r = CAM_DIST
        cam.location = (
            r * math.sin(angle) * math.cos(elev_r),
           -r * math.cos(angle) * math.cos(elev_r),
            r * math.sin(elev_r),
        )
        # Always look at origin
        dx, dy, dz = -cam.location[0], -cam.location[1], -cam.location[2]
        cam.rotation_euler = (
            math.atan2(math.sqrt(dx**2+dy**2), -dz),
            0,
            math.atan2(dx, -dy),
        )
        cam.keyframe_insert("location",       frame=f)
        cam.keyframe_insert("rotation_euler", frame=f)

def main():
    setup_scene()
    setup_lights()
    cam = setup_camera()
    obj = bpy.data.objects.get(OBJ_NAME)
    if obj and obj.data.shape_keys:
        animate_shape_keys(obj)
    animate_camera_orbit(cam)
    bpy.ops.render.render(animation=True)
    print(f"[record] Done → {OUT_MP4}")

if __name__ == "__main__":
    main()

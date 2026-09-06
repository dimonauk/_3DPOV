"""
record.py — Viewport animation for Cahn–Hilliard floor
=======================================================
Renders a 12-second, 24 fps (288 frame) Eevee Next animation:
  Frames 0–95:   shape-key morphs Basis → SK_Coarsened  (coarsening)
  Frames 96–191: morphs SK_Coarsened → SK_Droplets      (topology change)
  Frames 192–287:morphs SK_Droplets → SK_ThickInterface (interface width)
Camera orbits 240° at 60° elevation; bloom gives the cobalt/amber glow.

Run after blueprint.py has saved cahn_hilliard_floor.blend.
"""

import bpy, math, pathlib

BLEND_FILE  = pathlib.Path(bpy.path.abspath("//")) / "cahn_hilliard_floor.blend"
OUTPUT_MP4  = "//../../../../videos/scripting/python-numpy-cahn-hilliard-phase-field-spinodal-decomposition-ostwald-ripening-stage-floor-webxr/viewport.mp4"

FPS         = 24
DURATION_S  = 12
N_FRAMES    = FPS * DURATION_S        # 288
CAM_DIST    = 7.5
CAM_ELEV_DEG = 55.0
ORBIT_DEG   = 240.0


def setup_scene():
    # Reload blend so we start from the saved mesh
    bpy.ops.wm.open_mainfile(filepath=str(BLEND_FILE))

    scene           = bpy.context.scene
    scene.frame_start  = 1
    scene.frame_end    = N_FRAMES
    scene.render.fps   = FPS
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.filepath                   = OUTPUT_MP4
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080

    # Bloom (Eevee Next)
    ep = scene.eevee
    ep.use_bloom        = True
    ep.bloom_threshold  = 0.30
    ep.bloom_intensity  = 4.0


def add_camera():
    bpy.ops.object.camera_add()
    cam_obj = bpy.context.active_object
    cam_obj.name = "RecordCam"
    bpy.context.scene.camera = cam_obj

    # Animate orbit
    for frame in range(1, N_FRAMES + 1):
        t     = (frame - 1) / (N_FRAMES - 1)
        angle = math.radians(t * ORBIT_DEG)
        elev  = math.radians(CAM_ELEV_DEG)
        x     = CAM_DIST * math.cos(angle) * math.cos(elev)
        y     = CAM_DIST * math.sin(angle) * math.cos(elev)
        z     = CAM_DIST * math.sin(elev)
        cam_obj.location = (x, y, z)

        # Track-to origin
        import mathutils
        direction  = mathutils.Vector((0, 0, 0)) - cam_obj.location
        rot_quat   = direction.to_track_quat('-Z', 'Y')
        cam_obj.rotation_euler = rot_quat.to_euler()
        cam_obj.keyframe_insert(data_path="location",       frame=frame)
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=frame)

    return cam_obj


def add_light():
    bpy.ops.object.light_add(type='SUN', location=(3, 3, 8))
    sun = bpy.context.active_object
    sun.data.energy = 4.5
    sun.data.color  = (1.0, 0.95, 0.85)


def animate_shape_keys():
    """Keyframe shape-key values: morphs across three transitions."""
    obj = bpy.data.objects.get("cahn_hilliard_floor")
    if obj is None or obj.data.shape_keys is None:
        print("[record.py] mesh not found — run blueprint.py first")
        return

    sk = obj.data.shape_keys.key_blocks
    names = ["Basis", "SK_Coarsened", "SK_Droplets", "SK_ThickInterface"]

    def zero_all(frame):
        for n in names:
            if n in sk:
                sk[n].value = 0.0
                sk[n].keyframe_insert("value", frame=frame)

    # Segment 1: frames 1–96 → Basis→Coarsened
    zero_all(1);  sk["Basis"].value = 1.0
    sk["Basis"].keyframe_insert("value", frame=1)
    zero_all(96); sk["SK_Coarsened"].value = 1.0
    sk["SK_Coarsened"].keyframe_insert("value", frame=96)

    # Segment 2: frames 96–192 → Coarsened→Droplets
    zero_all(192); sk["SK_Droplets"].value = 1.0
    sk["SK_Droplets"].keyframe_insert("value", frame=192)

    # Segment 3: frames 192–288 → Droplets→ThickInterface
    zero_all(N_FRAMES); sk["SK_ThickInterface"].value = 1.0
    sk["SK_ThickInterface"].keyframe_insert("value", frame=N_FRAMES)


def main():
    setup_scene()
    add_camera()
    add_light()
    animate_shape_keys()
    bpy.ops.render.render(animation=True)
    print("Render complete →", OUTPUT_MP4)


main()

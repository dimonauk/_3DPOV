"""
record.py — Viewport animation render for the Tinkerbell Attractor
Blender 5.1 | EEVEE-Next | outputs viewport.mp4

Run AFTER blueprint.py has built the Tinkerbell_Attractor object.
Renders 300 frames at 30 fps → 10-second clip.

Animation design:
  F001–070   Basis shape (butterfly) — camera orbits 0°→84°, overhead angle
  F071–140   morph to SK_Curled      — camera orbits 84°→168°
  F141–210   morph to SK_Open        — camera orbits 168°→252°
  F211–300   morph to SK_Drift       — camera completes 252°→360°
"""

import bpy
import math
import os

OUTPUT_PATH = ("//../../videos/scripting/"
               "python-numpy-tinkerbell-map-barry-martin-1984-james-yorke"
               "-discrete-quadratic-log-density-stage-floor-webxr/viewport.mp4")

OBJ_NAME  = "Tinkerbell_Attractor"
FPS       = 30
N_FRAMES  = 300
CAM_DIST  = 9.5   # metres — height field spans ±3 m
CAM_ELEV  = 5.0   # metres above floor plane


def setup_render() -> None:
    sc = bpy.context.scene
    sc.render.engine   = "BLENDER_EEVEE_NEXT"
    sc.render.fps      = FPS
    sc.frame_start     = 1
    sc.frame_end       = N_FRAMES
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format              = "MPEG4"
    sc.render.ffmpeg.codec               = "H264"
    sc.render.ffmpeg.constant_rate_factor = "HIGH"
    sc.render.filepath = OUTPUT_PATH
    sc.render.resolution_x = 1920
    sc.render.resolution_y = 1080
    sc.eevee.use_bloom       = True
    sc.eevee.bloom_threshold  = 0.28
    sc.eevee.bloom_intensity  = 0.50
    sc.eevee.bloom_radius     = 7.0


def add_camera(target: bpy.types.Object) -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(0, -CAM_DIST, CAM_ELEV))
    cam = bpy.context.active_object
    cam.name = "Tinkerbell_Cam"
    tc = cam.constraints.new("TRACK_TO")
    tc.target     = target
    tc.track_axis = "TRACK_NEGATIVE_Z"
    tc.up_axis    = "UP_Y"
    return cam


def add_lighting() -> None:
    lights = [
        ("Key",  (  7.0, -6.0,  9.0), 900.0),
        ("Fill", ( -5.0,  5.0,  6.0), 220.0),
        ("Rim",  (  0.0,  8.0,  2.5), 450.0),
    ]
    for lname, loc, energy in lights:
        bpy.ops.object.light_add(type="AREA", location=loc)
        lt = bpy.context.active_object
        lt.name = f"Tinkerbell_{lname}"
        lt.data.energy = energy
        lt.data.size   = 3.5


def orbit_camera(cam: bpy.types.Object) -> None:
    """Animate a full 360° camera orbit over N_FRAMES."""
    for f in range(1, N_FRAMES + 1):
        angle = 2.0 * math.pi * (f - 1) / N_FRAMES
        cam.location.x = CAM_DIST * math.sin(angle)
        cam.location.y = -CAM_DIST * math.cos(angle)
        cam.location.z = CAM_ELEV
        cam.keyframe_insert(data_path="location", frame=f)


def morph_shape_key(ob: bpy.types.Object, key_name: str,
                    f_start: int, f_end: int) -> None:
    """Animate one shape key from 0 to 1 over [f_start, f_end]."""
    sk = ob.data.shape_keys.key_blocks.get(key_name)
    if sk is None:
        return
    sk.value = 0.0
    sk.keyframe_insert(data_path="value", frame=f_start)
    sk.value = 1.0
    sk.keyframe_insert(data_path="value", frame=f_end)


def main() -> None:
    ob = bpy.data.objects.get(OBJ_NAME)
    if ob is None:
        raise RuntimeError("Run blueprint.py first to build Tinkerbell_Attractor.")

    setup_render()
    cam = add_camera(ob)
    bpy.context.scene.camera = cam
    add_lighting()
    orbit_camera(cam)

    morph_schedule = [
        ("SK_Curled",  70, 120),
        ("SK_Open",   145, 195),
        ("SK_Drift",  220, 270),
    ]
    for key_name, f_in, f_out in morph_schedule:
        morph_shape_key(ob, key_name, f_in, f_out)

    os.makedirs(os.path.dirname(bpy.path.abspath(OUTPUT_PATH)), exist_ok=True)
    bpy.ops.render.render(animation=True)
    print("[record.py] render complete →", OUTPUT_PATH)


if __name__ == "__main__":
    main()

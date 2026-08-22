"""
record.py — Viewport animation recording for the Curve Arc Dial Gauge tutorial.
Renders a 90-frame sequence showing the gauge reading sweep from 0 → 1 → 0.65.
Output: public/library/videos/geometry-nodes/gn-curve-arc-dial-gauge-webxr-hud/viewport.mp4

Run AFTER blueprint.py has built the scene.  Assumes 'dial_gauge' object exists
with a 'GN_DialGauge' modifier whose 'Value' socket is exposed.
"""

import bpy
import math
import os

TOTAL_FRAMES  = 90
FPS           = 30
OUTPUT_PATH   = "//../../videos/geometry-nodes/gn-curve-arc-dial-gauge-webxr-hud/viewport"

# Value keyframe schedule: ramp up then back to the resting 0.65 reading
VALUE_KEYS = [
    (1,   0.00),   # start empty
    (45,  1.00),   # sweep to full
    (75,  0.65),   # settle on the "real" reading
    (90,  0.65),   # hold
]


def ensure_camera():
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    cam_obj.location = (0, -4.5, 2.0)
    cam_obj.rotation_euler = (math.radians(65), 0, 0)
    cam_data.lens = 50
    bpy.context.scene.camera = cam_obj
    return cam_obj


def ensure_light():
    light_data = bpy.data.lights.new("RecordLight", type='SUN')
    light_data.energy = 3.0
    light_obj  = bpy.data.objects.new("RecordLight", light_data)
    bpy.context.scene.collection.objects.link(light_obj)
    light_obj.rotation_euler = (math.radians(45), 0, math.radians(30))
    return light_obj


def set_value_keyframes(host: bpy.types.Object):
    mod = host.modifiers.get("GN_DialGauge")
    if mod is None:
        print("ERROR: GN_DialGauge modifier not found — run blueprint.py first.")
        return
    for frame, val in VALUE_KEYS:
        bpy.context.scene.frame_set(frame)
        mod['Value'] = val
        mod.keyframe_insert(data_path='["Value"]', frame=frame)


def configure_render():
    sc  = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end   = TOTAL_FRAMES
    sc.render.fps  = FPS

    sc.render.engine              = 'BLENDER_EEVEE_NEXT'
    sc.render.image_settings.file_format = 'FFMPEG'
    sc.render.ffmpeg.format       = 'MPEG4'
    sc.render.ffmpeg.codec        = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    sc.render.resolution_x = 1280
    sc.render.resolution_y = 720
    sc.render.filepath     = OUTPUT_PATH

    # Transparent background so the gauge can composite over any WebXR sky
    sc.render.film_transparent = True

    # Minimal samples for speed; the emission materials read well at 16spp
    sc.eevee.taa_render_samples = 16


def main():
    host = bpy.data.objects.get("dial_gauge")
    if host is None:
        print("ERROR: 'dial_gauge' object not found — run blueprint.py first.")
        return

    out_dir = bpy.path.abspath(
        "//../../videos/geometry-nodes/gn-curve-arc-dial-gauge-webxr-hud/"
    )
    os.makedirs(out_dir, exist_ok=True)

    ensure_camera()
    ensure_light()
    set_value_keyframes(host)
    configure_render()

    bpy.ops.render.render(animation=True)
    print(f"Recording complete → {out_dir}viewport.mp4")


if __name__ == "__main__":
    main()

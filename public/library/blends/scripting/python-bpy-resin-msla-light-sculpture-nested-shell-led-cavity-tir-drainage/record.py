"""
record.py — Viewport Animation for MSLA Light Sculpture (Blender 5.1)
CC0 · Holoflow Studio

Renders a 10-second (240-frame @ 24fps) preview showing:
  Frame   1–60  : Orbit from above — shows full decorative outer shell
  Frame  61–120 : Swing to base — shows LED cavity and drainage holes
  Frame 121–180 : Semi-transparent cross-section — shows nested shell gap
  Frame 181–240 : Return to show angle — glowing inner core
Outputs to public/library/videos/scripting/<slug>/viewport.mp4
"""

import bpy
import math
import pathlib

OUTPUT_DIR = pathlib.Path(
    "public/library/videos/scripting/"
    "python-bpy-resin-msla-light-sculpture-nested-shell-led-cavity-tir-drainage"
)

FPS = 24
TOTAL_FRAMES = 240
CAM_DIST = 0.20   # camera distance from origin (metres)


def _add_lights():
    """Three-point light rig tuned for clear resin and faceted shell."""
    # Key: side-top for dramatic facet reflections
    key = bpy.data.lights.new("Key", type='AREA')
    key.energy = 200
    key.size = 0.3
    key_ob = bpy.data.objects.new("Key", key)
    key_ob.location = (0.12, -0.12, 0.15)
    key_ob.rotation_euler = (math.radians(55), 0, math.radians(30))
    bpy.context.collection.objects.link(key_ob)

    # Fill: soft opposite side
    fill = bpy.data.lights.new("Fill", type='AREA')
    fill.energy = 60
    fill.size = 0.5
    fill_ob = bpy.data.objects.new("Fill", fill)
    fill_ob.location = (-0.14, 0.08, 0.06)
    fill_ob.rotation_euler = (math.radians(70), 0, math.radians(-120))
    bpy.context.collection.objects.link(fill_ob)

    # Rim: behind for resin translucency back-scatter
    rim = bpy.data.lights.new("Rim", type='SPOT')
    rim.energy = 120
    rim.spot_size = math.radians(40)
    rim_ob = bpy.data.objects.new("Rim", rim)
    rim_ob.location = (0.0, 0.18, -0.05)
    rim_ob.rotation_euler = (math.radians(80), 0, math.radians(180))
    bpy.context.collection.objects.link(rim_ob)


def _setup_camera() -> bpy.types.Object:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 85  # mild telephoto flattens sphere distortion
    cam_ob = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_ob)
    bpy.context.scene.camera = cam_ob

    # Track-to constraint keeps camera facing origin
    ct = cam_ob.constraints.new(type='TRACK_TO')
    ct.target = bpy.data.objects.get("hf_shell") or bpy.context.collection.objects[0]
    ct.track_axis = 'TRACK_NEGATIVE_Z'
    ct.up_axis = 'UP_Y'
    return cam_ob


def _keyframe_orbit(cam_ob: bpy.types.Object):
    """
    Orbit path:
      F1   : azimuth=30°, elevation=30° (show-angle overview)
      F60  : azimuth=150°, elevation=40° (orbit overhead)
      F120 : azimuth=270°, elevation=-50° (base reveal)
      F180 : azimuth=30°, elevation=10° (cross-section angle)
      F240 : azimuth=30°, elevation=30° (return to show angle)
    """
    keyframes = [
        (1,   30,  30),
        (60,  150, 40),
        (120, 270, -50),
        (180, 30,  10),
        (240, 30,  30),
    ]
    for frame, az_deg, el_deg in keyframes:
        az = math.radians(az_deg)
        el = math.radians(el_deg)
        cam_ob.location.x = CAM_DIST * math.cos(az) * math.cos(el)
        cam_ob.location.y = CAM_DIST * math.sin(az) * math.cos(el)
        cam_ob.location.z = CAM_DIST * math.sin(el)
        cam_ob.keyframe_insert(data_path='location', frame=frame)

    # Use BEZIER interpolation for smooth camera motion
    action = cam_ob.animation_data.action
    for fcurve in action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = 'BEZIER'
            kp.handle_left_type  = 'AUTO_CLAMPED'
            kp.handle_right_type = 'AUTO_CLAMPED'


def _animate_shell_alpha():
    """
    Fade the outer shell to semi-transparent in frames 121–180 to reveal
    the inner core gap (cross-section act). Fade back for the finale.
    """
    shell = bpy.data.objects.get("hf_shell")
    if shell is None or not shell.data.materials:
        return
    mat = shell.data.materials[0]
    mat.blend_method = 'BLEND'
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    alpha_input = bsdf.inputs["Alpha"]
    for frame, alpha in [(1, 1.0), (100, 1.0), (130, 0.20), (170, 0.20), (200, 1.0), (240, 1.0)]:
        alpha_input.default_value = alpha
        alpha_input.keyframe_insert(data_path='default_value', frame=frame)


def _configure_render():
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE_NEXT'
    sc.render.fps = FPS
    sc.frame_start = 1
    sc.frame_end = TOTAL_FRAMES
    sc.render.resolution_x = 1920
    sc.render.resolution_y = 1080
    sc.render.image_settings.file_format = 'FFMPEG'
    sc.render.ffmpeg.format = 'MPEG4'
    sc.render.ffmpeg.codec = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'HIGH'
    sc.eevee.use_bloom = True
    sc.eevee.bloom_threshold = 0.5
    sc.eevee.bloom_intensity = 0.06

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    sc.render.filepath = str(OUTPUT_DIR / "viewport.mp4")


def main():
    _add_lights()
    cam = _setup_camera()
    _keyframe_orbit(cam)
    _animate_shell_alpha()
    _configure_render()
    bpy.ops.render.render(animation=True)
    print(f"[HF] Viewport animation → {bpy.context.scene.render.filepath}")


if __name__ == "__main__":
    main()

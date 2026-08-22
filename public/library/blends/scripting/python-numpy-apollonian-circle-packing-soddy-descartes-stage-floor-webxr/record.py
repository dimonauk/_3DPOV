"""
record.py — Viewport animation for Apollonian Circle Packing
Outputs: public/library/videos/scripting/.../viewport.mp4

Camera sweeps top-down then tilts to 30° looking across the bas-relief.
EEVEE Next with bloom reveals the emission height differential.
Run AFTER blueprint.py has created the ApollonianFloor object.
"""
import bpy, math

OUT_PATH = "//public/library/videos/scripting/" \
           "python-numpy-apollonian-circle-packing-soddy-descartes-stage-floor-webxr/" \
           "viewport"
FRAMES   = 150
FPS      = 24
WORLD_SCALE = 4.0


def _ensure_camera() -> bpy.types.Object:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 35
    cam_data.clip_end = 200
    cam = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    return cam


def _set_eevee():
    bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT"
    bpy.context.scene.eevee.use_bloom = True
    bpy.context.scene.eevee.bloom_threshold = 0.6
    bpy.context.scene.eevee.bloom_intensity = 0.25
    bpy.context.scene.eevee.taa_render_samples = 16


def _set_output():
    rndr = bpy.context.scene.render
    rndr.filepath = bpy.path.abspath(OUT_PATH)
    rndr.image_settings.file_format = "FFMPEG"
    rndr.ffmpeg.format = "MPEG4"
    rndr.ffmpeg.codec = "H264"
    rndr.ffmpeg.constant_rate_factor = "MEDIUM"
    rndr.resolution_x = 1920
    rndr.resolution_y = 1080
    rndr.fps = FPS


def _keyframe(cam: bpy.types.Object, frame: int,
              dist: float, elev_deg: float, azim_deg: float):
    """Position camera on a sphere and aim at origin."""
    el = math.radians(elev_deg)
    az = math.radians(azim_deg)
    x = dist * math.cos(el) * math.sin(az)
    y = -dist * math.cos(el) * math.cos(az)
    z = dist * math.sin(el)
    cam.location = (x, y, z)
    cam.keyframe_insert("location", frame=frame)
    # Point at origin
    dx, dy, dz = -x, -y, -z
    dist_xy = math.sqrt(dx * dx + dy * dy)
    rot_x = math.atan2(-dz, dist_xy) + math.pi / 2
    rot_z = math.atan2(dx, dy)
    cam.rotation_euler = (rot_x, 0, rot_z)
    cam.keyframe_insert("rotation_euler", frame=frame)


def build_animation(cam: bpy.types.Object):
    """
    Phase 1 (F1-60):   Top-down orbit — reveals full gasket pattern
    Phase 2 (F61-150): Tilt from 70° to 30° while completing orbit —
                        shows bas-relief height differential
    """
    # Phase 1: top-down (elevation ~80°), slow orbit
    for f in range(1, 61):
        t = (f - 1) / 59
        _keyframe(cam, f, dist=WORLD_SCALE * 2.8,
                  elev_deg=80.0, azim_deg=t * 360.0)

    # Phase 2: orbit + tilt to show pillars
    for f in range(61, FRAMES + 1):
        t = (f - 61) / (FRAMES - 61)
        elev = 70.0 - 45.0 * t          # 70° → 25°
        azim = 360.0 + t * 180.0        # continue orbit
        dist = WORLD_SCALE * 2.5 + 0.5 * t
        _keyframe(cam, f, dist=dist, elev_deg=elev, azim_deg=azim)


def main():
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAMES

    cam = _ensure_camera()
    _set_eevee()
    _set_output()
    build_animation(cam)

    bpy.ops.render.render(animation=True)
    print("[record] viewport.mp4 complete")


main()

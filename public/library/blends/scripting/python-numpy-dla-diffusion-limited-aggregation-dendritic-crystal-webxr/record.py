"""
Holoflow Studio — record.py
===========================
Renders a 5-second (120-frame) viewport animation of the DLA aggregate
growing from a single seed to a full dendritic crystal.

Run AFTER blueprint.py has been executed.  The scene must contain:
  hf_dla_aggregate  — the point-cloud object with GN modifier
  hf_dla_bead       — the icosphere prototype

Output: public/library/videos/scripting/
          python-numpy-dla-diffusion-limited-aggregation-dendritic-crystal-webxr/
          viewport.mp4

Technique: bpy.ops.render.opengl (viewport render) rather than full Cycles/
EEVEE render — captures the EEVEE Next real-time preview (with bloom) at 30
fps with no sampling wait.  The camera orbits 15° around Z while the crystal
grows, giving a dynamic "crystal formation" perspective.
"""

import bpy
import math
import os

# ── parameters ───────────────────────────────────────────────────────────────
TOTAL_FRAMES  = 120
FPS           = 30
CAM_RADIUS    = 18.0
CAM_HEIGHT    = 8.0
ORBIT_DEGREES = 30.0          # total camera orbit over TOTAL_FRAMES
OUTPUT_PATH   = "//../../videos/scripting/python-numpy-dla-diffusion-limited-aggregation-dendritic-crystal-webxr/viewport"


def _ensure_camera() -> bpy.types.Object:
    """Add or retrieve the scene camera, positioned to frame the crystal."""
    if bpy.context.scene.camera:
        cam_obj = bpy.context.scene.camera
    else:
        bpy.ops.object.camera_add()
        cam_obj = bpy.context.active_object
        bpy.context.scene.camera = cam_obj

    cam_obj.name = "hf_dla_cam"
    cam_obj.data.lens = 50           # 50 mm — moderate telephoto, compresses depth
    return cam_obj


def _keyframe_camera_orbit(cam: bpy.types.Object) -> None:
    """Keyframe the camera on a gentle arc so the crystal appears to grow
    in 3D rather than as a flat 2D pattern.

    The orbit is purely around the Z axis: the camera height is fixed so
    the viewer's eye level stays constant — a rising camera would create
    a 'god's-eye view' that flattens the dendritic arms.
    """
    theta_start = math.radians(10.0)
    theta_end   = math.radians(10.0 + ORBIT_DEGREES)

    for frame in [1, TOTAL_FRAMES]:
        t     = (frame - 1) / (TOTAL_FRAMES - 1)
        theta = theta_start + t * (theta_end - theta_start)
        x     = CAM_RADIUS * math.cos(theta)
        y     = CAM_RADIUS * math.sin(theta)
        z     = CAM_HEIGHT

        cam.location = (x, y, z)
        cam.rotation_euler = (
            math.atan2(math.sqrt(x*x + y*y), z),   # pitch down toward origin
            0.0,
            math.atan2(y, x) + math.pi,             # yaw toward origin
        )
        bpy.context.scene.frame_set(frame)
        cam.keyframe_insert("location")
        cam.keyframe_insert("rotation_euler")


def _ensure_light() -> None:
    """Add a soft rim light behind the crystal if none exists."""
    if any(o.type == "LIGHT" for o in bpy.data.objects):
        return
    bpy.ops.object.light_add(type="AREA", location=(-10, -10, 12))
    light = bpy.context.active_object
    light.data.energy  = 400
    light.data.size    = 8.0
    light.name         = "hf_dla_rim"


def configure_render() -> None:
    scene  = bpy.context.scene
    render = scene.render

    render.engine          = "BLENDER_EEVEE_NEXT"
    render.image_settings.file_format = "FFMPEG"
    render.ffmpeg.format   = "MPEG4"
    render.ffmpeg.codec    = "H264"
    render.ffmpeg.constant_rate_factor = "HIGH"   # visually lossless for preview
    render.resolution_x    = 1920
    render.resolution_y    = 1080
    render.resolution_percentage = 100
    render.fps             = FPS
    render.frame_start     = 1
    render.frame_end       = TOTAL_FRAMES
    render.filepath        = OUTPUT_PATH

    # EEVEE Next bloom — makes emission spheres glow without extra lights
    scene.eevee.use_bloom          = True   # type: ignore[attr-defined]
    scene.eevee.bloom_threshold    = 0.8   # type: ignore[attr-defined]
    scene.eevee.bloom_intensity    = 1.2   # type: ignore[attr-defined]
    scene.eevee.bloom_radius       = 4.0   # type: ignore[attr-defined]


def main() -> None:
    os.makedirs(
        bpy.path.abspath("//../../videos/scripting/"
                         "python-numpy-dla-diffusion-limited-aggregation-dendritic-crystal-webxr/"),
        exist_ok=True,
    )

    cam = _ensure_camera()
    _keyframe_camera_orbit(cam)
    _ensure_light()
    configure_render()

    # Render all TOTAL_FRAMES via opengl (viewport) — respects EEVEE Next bloom
    bpy.ops.render.render(animation=True, use_viewport=True)
    print("[DLA record] viewport.mp4 written to", OUTPUT_PATH)


if __name__ == "__main__":
    main()

# record.py  ── Viewport render for gn-is-viewport-render-lod-switch-webxr
# Blender 5.1 | CC0 | Holoflow Studio
#
# Run AFTER blueprint.py. Renders a 90-frame EEVEE camera orbit of the
# server panel showing the render-time geometry (Is Viewport = False path).
# During any bpy.ops.render.render() call, Is Viewport evaluates to False,
# so the high-quality subdivided + noise-displaced mesh is what gets recorded.
#
# To see the low-poly VIEWPORT path, use OBS screen capture (see
# SCREEN-RECORDING-NOTES.md) with Blender in SOLID shading mode.

import bpy, math

OUTPUT_PATH = "//public/library/videos/geometry-nodes/gn-is-viewport-render-lod-switch-webxr/viewport.mp4"
FRAME_START = 1
FRAME_END   = 90   # 3 seconds at 30 fps — enough to see the full orbit

def setup_orbit_camera():
    """Add a camera that sweeps 270° around the panel over 90 frames."""
    scene = bpy.context.scene
    cam_obj = scene.camera
    if cam_obj is None:
        bpy.ops.object.camera_add()
        cam_obj = bpy.context.active_object
        scene.camera = cam_obj

    cam_obj.data.lens = 50.0  # 50 mm → natural perspective

    # Orbit keyframes on a 2.5 m radius arc at 0.8 m height
    for frame in range(FRAME_START, FRAME_END + 1):
        t     = (frame - 1) / max(FRAME_END - 1, 1)   # 0.0 → 1.0
        angle = t * math.radians(270)                  # 270° sweep
        r     = 2.5
        cam_obj.location = (math.sin(angle) * r, -math.cos(angle) * r, 0.8)
        # Always look toward the panel's rough centre
        cam_obj.rotation_euler = (math.radians(78), 0, math.atan2(
            math.sin(angle) * r, math.cos(angle) * r
        ))
        cam_obj.keyframe_insert("location",       frame=frame)
        cam_obj.keyframe_insert("rotation_euler", frame=frame)


def main():
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END

    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.fps          = 30
    scene.render.filepath     = OUTPUT_PATH

    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor= 'HIGH'

    # EEVEE Next for fast renders — still uses Is Viewport = False path
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.eevee.taa_render_samples = 32

    setup_orbit_camera()

    # Ensure at least one area light exists
    lights = [o for o in bpy.data.objects if o.type == 'LIGHT']
    if not lights:
        bpy.ops.object.light_add(type='AREA', location=(1.2, -1.6, 2.2))
        bpy.context.active_object.data.energy = 400.0

    bpy.ops.render.render(animation=True)
    print(f"Recorded to {OUTPUT_PATH}")
    print("Note: Is Viewport = False during render → subdivided mesh recorded.")


if __name__ == "__main__":
    main()

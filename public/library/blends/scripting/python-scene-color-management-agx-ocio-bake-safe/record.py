"""
record.py — Viewport animation recorder
Python scene.view_settings — AgX Colour Management Tutorial
Blender 5.1 | Holoflow Studio | CC0

Outputs: public/library/videos/scripting/python-scene-color-management-agx-ocio-bake-safe/viewport.mp4

Run AFTER blueprint.py has been executed and the colour chart is in the scene.
Animates a 120-frame camera orbit around the chart while AgX+Punchy is active,
then saves PNG frames to /tmp/color_chart_frames/ for ffmpeg assembly.
"""

import bpy
import math
import os

# ─── PARAMETERS ───────────────────────────────────────────────────────────────
FRAME_START   = 1
FRAME_END     = 120          # 4 s at 30 fps
ORBIT_RADIUS  = 4.2
ORBIT_HEIGHT  = 1.8
ORBIT_DEGREES = 180          # half-orbit so subject stays lit throughout
OUTPUT_DIR    = "/tmp/color_chart_frames"
RENDER_RES    = (1280, 720)


def setup_render() -> None:
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = 30

    scene.render.resolution_x    = RENDER_RES[0]
    scene.render.resolution_y    = RENDER_RES[1]
    scene.render.resolution_percentage = 100

    # EEVEE Next for fast viewport-quality frames
    scene.render.engine = "BLENDER_EEVEE_NEXT"

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    scene.render.filepath        = os.path.join(OUTPUT_DIR, "frame_")
    scene.render.image_settings.file_format = "PNG"


def keyframe_camera_orbit() -> None:
    """
    Insert location+rotation keyframes for a smooth half-orbit.
    Camera points at the chart centre (0, -0.37, 0) throughout.

    WHY half-orbit not full: a full 360° ends where it started with no
    visual change — boring for a tutorial clip.  A 180° sweep takes the
    camera from left-flank to right-flank, showing all eight spheres
    under changing key-light angles, demonstrating how AgX preserves hue
    as specular highlights appear on each sphere.
    """
    cam_ob = bpy.data.objects.get("Camera_Chart")
    if cam_ob is None:
        raise RuntimeError("Camera_Chart not found — run blueprint.py first.")

    scene = bpy.context.scene
    chart_y = -0.37  # centre of 2-row chart

    # Remove any existing camera animation data
    if cam_ob.animation_data:
        cam_ob.animation_data_clear()

    total_frames = FRAME_END - FRAME_START

    for frame in range(FRAME_START, FRAME_END + 1, 4):   # keyframe every 4 frames
        t        = (frame - FRAME_START) / total_frames
        angle    = math.radians(-90 + t * ORBIT_DEGREES)  # start left, sweep right
        x        = math.cos(angle) * ORBIT_RADIUS
        y        = chart_y + math.sin(angle) * ORBIT_RADIUS
        z        = ORBIT_HEIGHT

        cam_ob.location        = (x, y, z)
        # Point at chart centre
        dx, dy, dz = -x, chart_y - y, -z
        length = math.sqrt(dx*dx + dy*dy + dz*dz)
        # Convert look-at direction to euler (simple spherical)
        cam_ob.rotation_euler = (
            math.acos(max(-1.0, min(1.0, dz / length))),
            0.0,
            math.atan2(dx, -dy),
        )

        scene.frame_set(frame)
        cam_ob.keyframe_insert(data_path="location",       index=-1)
        cam_ob.keyframe_insert(data_path="rotation_euler", index=-1)

    # Smooth interpolation
    if cam_ob.animation_data and cam_ob.animation_data.action:
        for fc in cam_ob.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"
            fc.update()


def render_frames() -> None:
    """
    Render all frames using EEVEE Next.
    AgX + Punchy view_transform active — frames encode the actual display-
    referred output, not scene-linear.  This is intentional: the viewport.mp4
    is a display artefact, not a bake source.
    """
    bpy.context.scene.view_settings.view_transform = "AgX"
    bpy.context.scene.view_settings.look           = "Punchy"
    bpy.context.scene.view_settings.exposure       = 0.0

    bpy.ops.render.render(animation=True, write_still=True)


def print_ffmpeg_command() -> None:
    print("\n── Assemble viewport.mp4 ───────────────────────────────────────────")
    print("ffmpeg -framerate 30 \\")
    print(f"  -i {OUTPUT_DIR}/frame_%04d.png \\")
    print("  -c:v libx264 -crf 18 -pix_fmt yuv420p \\")
    print("  public/library/videos/scripting/"
          "python-scene-color-management-agx-ocio-bake-safe/viewport.mp4")
    print("────────────────────────────────────────────────────────────────────\n")


def main() -> None:
    setup_render()
    keyframe_camera_orbit()
    render_frames()
    print_ffmpeg_command()


if __name__ == "__main__":
    main()

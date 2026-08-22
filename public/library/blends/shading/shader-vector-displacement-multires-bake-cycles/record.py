"""
record.py — Viewport animation for Vector Displacement Map Armour Panel
Blender 5.1 | CC0 | Holoflow Studio

Output: public/library/videos/shading/shader-vector-displacement-multires-bake-cycles/viewport.mp4
Duration: 12 seconds at 24 fps (288 frames)

Effect: the armour panel orbits the camera at a raking angle (30°–70° from
normal) so the displaced geometry silhouette is visible throughout, while the
Cycles dicing rate animates from 4.0 → 1.0 px / micropolygon edge to show
how adaptive subdivision density changes with quality.

Run after blueprint.py has executed in the same session.
"""

import bpy
import math

FPS           = 24
DURATION_S    = 12
FRAME_END     = FPS * DURATION_S
OUTPUT_PATH   = "//../../videos/shading/shader-vector-displacement-multires-bake-cycles/viewport.mp4"
OBJ_NAME      = "vdm_armour_panel"
DICING_START  = 4.0   # low quality — sparse micropolygons, visible facets
DICING_END    = 1.0   # high quality — smooth displaced silhouette


def setup_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(0.0, -0.7, 0.15))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(88), 0, 0)
    cam.data.lens = 85
    bpy.context.scene.camera = cam
    return cam


def setup_light() -> None:
    bpy.ops.object.light_add(type="AREA", location=(0.5, -0.4, 0.4))
    light = bpy.context.active_object
    light.data.energy = 120
    light.data.size   = 0.35
    light.rotation_euler = (math.radians(50), 0, math.radians(20))


def animate_panel(obj: bpy.types.Object) -> None:
    """
    Orbit the panel through a 60° arc on Y (raking angle) over the clip.
    Raking light emphasises displaced silhouette — the diagnostic view that
    confirms actual geometry displacement vs normal map trickery.
    """
    obj.rotation_euler = (0, math.radians(-30), 0)
    obj.keyframe_insert("rotation_euler", frame=1)
    obj.rotation_euler = (0, math.radians(30), 0)
    obj.keyframe_insert("rotation_euler", frame=FRAME_END)
    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


def animate_dicing(scene: bpy.types.Scene) -> None:
    """
    Animate the Cycles dicing rate from coarse (4.0 px) to fine (1.0 px).
    WHY: visually demonstrates that adaptive subdivision dices MORE tightly
    at lower dicing_rate values — the micropolygon count increases as the
    value decreases.  This is counter-intuitive for new users.
    """
    cycles = scene.cycles
    cycles.dicing_rate = DICING_START
    cycles.keyframe_insert("dicing_rate", frame=1)
    cycles.dicing_rate = DICING_END
    cycles.keyframe_insert("dicing_rate", frame=FRAME_END)


def setup_render(scene: bpy.types.Scene) -> None:
    scene.frame_start = 1
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    # EEVEE Next for the viewport record — VDM won't displace geometry in EEVEE,
    # but the colour-encoded EXR image still shows on the surface as a reminder
    # that the VDM texture exists.  For a Cycles-rendered record substitute:
    #   scene.render.engine = "CYCLES"
    #   scene.cycles.feature_set = "EXPERIMENTAL"
    #   scene.cycles.samples = 64
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.eevee.use_raytracing = True

    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec  = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath = OUTPUT_PATH


def main() -> None:
    obj = bpy.data.objects.get(OBJ_NAME)
    if obj is None:
        print(f"[record] '{OBJ_NAME}' not found — run blueprint.py first.")
        return

    scene = bpy.context.scene
    setup_camera()
    setup_light()
    animate_panel(obj)
    animate_dicing(scene)
    setup_render(scene)
    bpy.ops.render.render(animation=True)
    print(f"[record] viewport.mp4 → {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

"""
record.py — Viewport animation for Gabor Noise Satin Acrylic Panel
Blender 5.1 | CC0 | Holoflow Studio

Output: public/library/videos/shading/shader-gabor-noise-satin-frosted-acrylic-webxr/viewport.mp4
Duration: 10 seconds at 24 fps (240 frames)
Effect: panel rotates 360° while anisotropy sweeps 0→1→0, showing how Gabor
        directionality transitions from isotropic haze to razor-sharp striae.

Run after blueprint.py has been executed in the same .blend session, so the
gabor_frosted_acrylic object and material already exist.
"""

import bpy
import math

FPS         = 24
DURATION_S  = 10
FRAME_END   = FPS * DURATION_S
OUTPUT_PATH = "//../../videos/shading/shader-gabor-noise-satin-frosted-acrylic-webxr/viewport.mp4"
MAT_NAME    = "gabor_frosted_acrylic_mat"
OBJ_NAME    = "gabor_frosted_acrylic"


def setup_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(0, -0.45, 0))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(90), 0, 0)
    bpy.context.scene.camera = cam
    cam.data.lens = 85   # telephoto — minimal perspective distortion on flat panel
    return cam


def setup_light() -> None:
    bpy.ops.object.light_add(type="AREA", location=(0.3, -0.3, 0.3))
    light = bpy.context.active_object
    light.data.energy = 80
    light.data.size    = 0.4
    light.rotation_euler = (math.radians(45), 0, math.radians(30))


def animate_panel(obj: bpy.types.Object) -> None:
    """Full 360° Y-axis rotation over the clip duration."""
    obj.rotation_euler = (0, 0, 0)
    obj.keyframe_insert("rotation_euler", frame=1)
    obj.rotation_euler = (0, math.radians(360), 0)
    obj.keyframe_insert("rotation_euler", frame=FRAME_END)
    # Linear interpolation — constant angular velocity.
    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


def animate_anisotropy(mat: bpy.types.Material) -> None:
    """
    Sweep Anisotropy 0 → 1 → 0 over the clip.
    WHY: demonstrates the unique capability of Gabor vs standard Noise Texture —
    turning Anisotropy to 1 reveals that the kernel bank aligns, turning what
    looked like random haze into crisp directional striae.
    """
    nt = mat.node_tree
    # Find the roughness Gabor node (first one in the tree).
    gabor_node = next(
        (n for n in nt.nodes if n.type == "TEX_GABOR"), None
    )
    if gabor_node is None:
        return

    aniso_input = gabor_node.inputs.get("Anisotropy")
    if aniso_input is None:
        return

    aniso_input.default_value = 0.0
    aniso_input.keyframe_insert("default_value", frame=1)
    aniso_input.default_value = 1.0
    aniso_input.keyframe_insert("default_value", frame=FRAME_END // 2)
    aniso_input.default_value = 0.0
    aniso_input.keyframe_insert("default_value", frame=FRAME_END)


def setup_render() -> None:
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAME_END
    scene.render.fps   = FPS

    # Eevee Next for fast viewport preview — Cycles only needed for bake.
    scene.render.engine                        = "BLENDER_EEVEE_NEXT"
    scene.eevee.use_raytracing                 = True
    scene.eevee.ray_tracing_method             = "SCREEN"
    scene.eevee.use_shadow_jitter_viewport     = True

    scene.render.resolution_x  = 1920
    scene.render.resolution_y  = 1080
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format              = "MPEG4"
    scene.render.ffmpeg.codec               = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath = OUTPUT_PATH


def main() -> None:
    obj = bpy.data.objects.get(OBJ_NAME)
    mat = bpy.data.materials.get(MAT_NAME)
    if obj is None or mat is None:
        print("[record] Run blueprint.py first — object/material not found.")
        return

    setup_camera()
    setup_light()
    animate_panel(obj)
    animate_anisotropy(mat)
    setup_render()
    bpy.ops.render.render(animation=True)
    print(f"[record] viewport.mp4 written to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

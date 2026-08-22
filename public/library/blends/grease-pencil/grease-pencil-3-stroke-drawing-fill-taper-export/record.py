"""
record.py — Viewport animation render for GP3 Stroke Drawing tutorial.

Technique: animate the GREASE_PENCIL_THICKNESS modifier's influence from
0 → 1 and simultaneously keyframe a "reveal" pass by animating the Start
Cap / End Cap trim on each stroke — in Blender 5.1 GP3 this is achieved
by keyframing the stroke-level 'start_factor' / 'end_factor' trim properties
(accessible on the GP3 GREASE_PENCIL_TRIM modifier type) to create a
line-draw-on animation: each stroke appears to be drawn progressively.

The viewport render outputs frames 1–60 @ 24 fps → ~2.5 seconds.
This script is designed to be run AFTER blueprint.py has already created
and saved gp3_ink_logo.blend — it loads that file, adds the animation
keyframes, then renders the viewport to PNG sequence.

Resolution: 1920×1080 @ 24 fps, 60 frames → viewport.mp4 via ffmpeg pass.
"""

import bpy
import os
import math

BLEND_FILE  = os.path.join(os.path.dirname(__file__), "gp3_ink_logo.blend")
OUTPUT_DIR  = os.path.join(os.path.dirname(__file__), "output", "record")
FRAME_START = 1
FRAME_END   = 60
FPS         = 24

def load_blend() -> None:
    if os.path.exists(BLEND_FILE):
        bpy.ops.wm.open_mainfile(filepath=BLEND_FILE)
    else:
        print("[HFS] gp3_ink_logo.blend not found — run blueprint.py first")
        raise FileNotFoundError(BLEND_FILE)

def add_trim_modifier(obj: bpy.types.Object) -> bpy.types.Modifier:
    """
    GREASE_PENCIL_TRIM: controls how much of each stroke is shown.
    'start_factor' and 'end_factor' are [0.0, 1.0] — trim from both ends.
    We animate end_factor 0.0 → 1.0 to reveal strokes progressively.
    The SMOOTH and THICKNESS modifiers from blueprint.py remain; TRIM
    fires first in the stack (placed at index 0 via move).
    """
    trim = obj.modifiers.new("DrawReveal", "GREASE_PENCIL_TRIM")
    trim.start_factor = 0.0
    trim.end_factor   = 0.0   # fully hidden at frame 1
    # move to top so it gates before smooth/thickness
    bpy.ops.object.modifier_move_to_index(modifier=trim.name, index=0)
    return trim

def keyframe_trim_reveal(obj: bpy.types.Object, trim_mod: bpy.types.Modifier) -> None:
    """
    Ease-in reveal: use a quadratic in timing by mapping linear frame progress
    to an eased t via t² so strokes start slowly then accelerate — mimics real
    brush deceleration at the beginning of a stroke.
    """
    sc = bpy.context.scene
    path = f'modifiers["{trim_mod.name}"].end_factor'

    for fr in range(FRAME_START, FRAME_END + 1):
        t_lin = (fr - FRAME_START) / (FRAME_END - FRAME_START)
        # ease-in quad
        t_eased = t_lin * t_lin
        trim_mod.end_factor = t_eased
        trim_mod.keyframe_insert(data_path="end_factor", frame=fr)

    # after all keyframes set, change interpolation to BEZIER for smoothness
    if obj.animation_data and obj.animation_data.action:
        for fc in obj.animation_data.action.fcurves:
            if "end_factor" in fc.data_path:
                for kp in fc.keyframe_points:
                    kp.interpolation = "BEZIER"

def configure_scene_for_recording() -> None:
    sc = bpy.context.scene
    sc.frame_start = FRAME_START
    sc.frame_end   = FRAME_END
    sc.render.fps  = FPS

    sc.render.engine       = "BLENDER_EEVEE_NEXT"
    sc.render.resolution_x = 1920
    sc.render.resolution_y = 1080
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode  = "RGBA"
    sc.render.filepath = os.path.join(OUTPUT_DIR, "reveal_####")

    # Speed up: fewer EEVEE samples for preview-quality recording
    sc.eevee.taa_render_samples = 8

def viewport_opengl_render() -> None:
    """
    bpy.ops.render.opengl renders the viewport using the active camera.
    This captures the GP3 strokes as EEVEE would show them in the 3D
    viewport — useful when a true render pass is overkill for a recording
    preview. For production recording Dimona uses OBS (see SCREEN-RECORDING-NOTES).
    """
    bpy.ops.render.render(animation=True, write_still=False)
    print(f"[HFS] record.py complete — frames written to {OUTPUT_DIR}")

def main() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    load_blend()

    gp_obj = bpy.data.objects.get("gp3_ink_logo")
    if gp_obj is None:
        print("[HFS] GP3 object 'gp3_ink_logo' not found in loaded blend")
        return

    bpy.context.view_layer.objects.active = gp_obj
    trim = add_trim_modifier(gp_obj)
    keyframe_trim_reveal(gp_obj, trim)
    configure_scene_for_recording()

    bpy.ops.wm.save_as_mainfile(filepath=BLEND_FILE.replace(".blend", "_record.blend"))
    viewport_opengl_render()

if __name__ == "__main__":
    main()

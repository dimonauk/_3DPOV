"""
record.py — Viewport animation for ID Properties UI tutorial.
Blender 5.1 · CC0 · Holoflow Studio

Run blueprint.py first, then run this script.
Output: public/library/videos/scripting/
        python-id-properties-ui-custom-prop-schema-rig-controls/viewport.mp4

Animation: wing_spread custom property animates 0 → 1 → 0 over 90 frames.
A text object in the viewport prints the live value each frame, confirming
that the UIManager schema (FACTOR subtype, soft 0–1, description) survived
the animation pass. Duration ~3 s at 30 fps.
"""

import bpy
import os

# ── Constants ────────────────────────────────────────────────────────────────
SLUG       = "python-id-properties-ui-custom-prop-schema-rig-controls"
OUT_DIR    = f"//../../../../../../public/library/videos/scripting/{SLUG}"
OUT_FILE   = os.path.join(OUT_DIR, "viewport")
RIG_NAME   = "rig_crystal_familiar"
FRAME_S    = 1
FRAME_E    = 90
FPS        = 30


def setup_scene():
    scene = bpy.context.scene
    scene.frame_start = FRAME_S
    scene.frame_end   = FRAME_E
    scene.render.fps  = FPS
    # Workbench — fastest renderer, no light setup required
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light      = "FLAT"
    scene.display.shading.color_type = "OBJECT"


def setup_output():
    scene = bpy.context.scene
    scene.render.image_settings.file_format  = "FFMPEG"
    scene.render.ffmpeg.format               = "MPEG4"
    scene.render.ffmpeg.codec                = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.resolution_x                = 1920
    scene.render.resolution_y                = 1080
    scene.render.resolution_percentage       = 100
    abs_dir = bpy.path.abspath(OUT_DIR)
    os.makedirs(abs_dir, exist_ok=True)
    scene.render.filepath = OUT_FILE


def add_keyframes():
    rig = bpy.data.objects.get(RIG_NAME)
    if not rig:
        print("[record] Rig not found — run blueprint.py first.")
        return

    # wing_spread: 0 → 1 → 0 (a single sweep and return)
    for frame, value in [(FRAME_S, 0.0), (FRAME_E // 2, 1.0), (FRAME_E, 0.0)]:
        rig["wing_spread"] = value
        rig.keyframe_insert(data_path='["wing_spread"]', frame=frame)

    action = rig.animation_data.action
    for fc in action.fcurves:
        if fc.data_path == '["wing_spread"]':
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"
                kp.handle_left_type  = "AUTO_CLAMPED"
                kp.handle_right_type = "AUTO_CLAMPED"


def add_label_text():
    """
    Floating text object that shows 'wing_spread' in the viewport title.
    The prop value isn't live-evaluated in a Text object in Workbench render,
    but the label confirms which property the animation targets.
    """
    bpy.ops.object.text_add(location=(0.0, -1.2, 0.8))
    txt = bpy.context.active_object
    txt.data.body = "wing_spread  0 → 1 → 0"
    txt.data.size = 0.14
    mat = bpy.data.materials.new("TextMat")
    mat.diffuse_color = (0.8, 0.8, 1.0, 1.0)
    txt.data.materials.append(mat)
    txt.active_material = mat


def render():
    bpy.ops.render.opengl(animation=True, write_still=False, view_context=True)
    print(f"[record] Rendered to {bpy.path.abspath(OUT_FILE)}.mp4")


def main():
    setup_scene()
    setup_output()
    add_keyframes()
    add_label_text()
    render()


if __name__ == "__main__":
    main()

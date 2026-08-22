# ============================================================
# record.py — Viewport animation for CrystalProximity
# Blender 5.1  |  CC0  |  Holoflow Studio
#
# Run AFTER blueprint.py has built the scene.
# Animates the crystal rising from Z=0 to Z=3 over 60 frames
# so the proximity gradient slides from base to tip.
# Outputs viewport.mp4 to the library videos directory.
#
# Usage: Scripting workspace → Run Script
# Requires: blueprint.py run first in the same session.
# ============================================================

import bpy, os

FRAMES      = 60
FPS         = 30
RISE_START  = 0.0   # object Z at frame 1
RISE_END    = 3.0   # object Z at frame FRAMES

OUT_BASE = ('//../../videos/geometry-nodes/'
            'gn-self-object-world-height-proximity-crystal-webxr/')


# ------------------------------------------------------------------
def keyframe_rise(obj):
    """Animate object rising; Self Object tracks the move live."""
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end   = FRAMES

    obj.location.z = RISE_START
    obj.keyframe_insert(data_path='location', frame=1)

    obj.location.z = RISE_END
    obj.keyframe_insert(data_path='location', frame=FRAMES)

    # Smooth Bezier for ease-in/ease-out
    for fc in obj.animation_data.action.fcurves:
        if fc.data_path == 'location' and fc.array_index == 2:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'
                kp.handle_left_type  = 'AUTO'
                kp.handle_right_type = 'AUTO'


# ------------------------------------------------------------------
def setup_output():
    sc = bpy.context.scene
    sc.render.fps                           = FPS
    sc.render.resolution_x                  = 1920
    sc.render.resolution_y                  = 1080
    sc.render.resolution_percentage         = 100
    sc.render.image_settings.file_format    = 'FFMPEG'
    sc.render.ffmpeg.format                 = 'MPEG4'
    sc.render.ffmpeg.codec                  = 'H264'
    sc.render.ffmpeg.constant_rate_factor   = 'MEDIUM'
    sc.render.ffmpeg.audio_codec            = 'NONE'
    out = bpy.path.abspath(OUT_BASE + 'viewport.mp4')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    sc.render.filepath = out
    return out


# ------------------------------------------------------------------
def main():
    crystal = bpy.data.objects.get('CrystalProximity')
    if crystal is None:
        raise RuntimeError(
            "CrystalProximity object not found — run blueprint.py first."
        )

    keyframe_rise(crystal)
    out = setup_output()

    # Deselect all; set crystal active so viewport centres on it
    bpy.ops.object.select_all(action='DESELECT')
    crystal.select_set(True)
    bpy.context.view_layer.objects.active = crystal

    # Render OpenGL viewport animation (no full Cycles/EEVEE bake)
    bpy.ops.render.opengl(animation=True, sequencer=False)
    print(f"Viewport animation written: {out}")


if __name__ == '__main__':
    main()

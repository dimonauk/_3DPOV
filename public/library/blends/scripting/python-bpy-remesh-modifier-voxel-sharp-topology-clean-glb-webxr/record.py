"""
record.py — Viewport animation for RemeshModifier VOXEL + SHARP demo
=====================================================================
Blender 5.1 | CC0 | Holoflow Studio

Renders a 90-frame EEVEE animation to:
  public/library/videos/modifiers/
    python-bpy-remesh-modifier-voxel-sharp-topology-clean-glb-webxr/viewport.mp4

Visual sequence (3.75 s at 24 fps):
  Frames  1–30  : VOXEL blob and SHARP blob both visible, camera slowly orbiting
  Frames 31–60  : VOXEL voxel_size animates from 0.08 → 0.025 — mesh densifies
  Frames 61–90  : both objects rotate 360° to show faceted silhouettes

Run from the Blender text editor or:
  blender --background --python record.py
"""

import bpy
from mathutils import Vector

OUTPUT_PATH = "//../../../../videos/modifiers/" \
    "python-bpy-remesh-modifier-voxel-sharp-topology-clean-glb-webxr/viewport"

FRAME_END   = 90
FPS         = 24
RESOLUTION  = (1280, 720)


def _purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for col in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras,
                bpy.data.lights, bpy.data.curves):
        for block in list(col):
            col.remove(block)


def _build_scene():
    """Re-run blueprint to get the VOXEL + SHARP objects in scene."""
    import importlib, sys, os
    bp_dir = os.path.dirname(os.path.abspath(__file__))
    if bp_dir not in sys.path:
        sys.path.insert(0, bp_dir)
    import blueprint
    importlib.reload(blueprint)
    blueprint.main()

    src_ob   = bpy.data.objects.get("hf_remesh_blob_src")
    sharp_ob = bpy.data.objects.get("hf_remesh_blob")
    return src_ob, sharp_ob


def _add_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(0.0, -2.4, 0.3))
    cam = bpy.context.active_object
    cam.rotation_euler = (1.45, 0.0, 0.0)
    bpy.context.scene.camera = cam
    cam.data.lens = 50.0
    return cam


def _add_key_light():
    bpy.ops.object.light_add(type='AREA', location=(1.2, -0.8, 1.5))
    light = bpy.context.active_object
    light.data.energy = 120.0
    light.data.size   = 0.8
    return light


def _keyframe_voxel_size(src_ob):
    """Animate voxel_size from 0.08 → 0.025 between frames 31 and 60."""
    if src_ob is None:
        return
    rem = src_ob.modifiers.get("Remesh_VOXEL")
    if rem is None:
        return

    scene = bpy.context.scene

    scene.frame_set(31)
    rem.voxel_size = 0.08
    rem.keyframe_insert("voxel_size", frame=31)

    scene.frame_set(60)
    rem.voxel_size = 0.025
    rem.keyframe_insert("voxel_size", frame=60)

    # Ease in-out via graph editor interpolation (LINEAR fallback in headless)
    for fc in src_ob.animation_data.action.fcurves:
        if "voxel_size" in fc.data_path:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'


def _keyframe_rotation(ob, frame_start, frame_end, axis='Z'):
    """Full 360° rotation over given frame range."""
    if ob is None:
        return
    import math
    bpy.context.scene.frame_set(frame_start)
    ob.rotation_euler[2] = 0.0
    ob.keyframe_insert("rotation_euler", index=2, frame=frame_start)

    bpy.context.scene.frame_set(frame_end)
    ob.rotation_euler[2] = math.tau   # 2π = 360°
    ob.keyframe_insert("rotation_euler", index=2, frame=frame_end)


def _configure_render():
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    scene.render.engine              = 'BLENDER_EEVEE_NEXT'
    scene.eevee.taa_render_samples   = 8

    scene.render.resolution_x        = RESOLUTION[0]
    scene.render.resolution_y        = RESOLUTION[1]
    scene.render.resolution_percentage = 100

    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.filepath = bpy.path.abspath(OUTPUT_PATH)


def main():
    _purge()
    src_ob, sharp_ob = _build_scene()
    _add_camera()
    _add_key_light()

    _keyframe_voxel_size(src_ob)
    _keyframe_rotation(src_ob,   frame_start=61, frame_end=90)
    _keyframe_rotation(sharp_ob, frame_start=61, frame_end=90)

    _configure_render()

    bpy.ops.render.render(animation=True)
    print("[holoflow] record.py: viewport.mp4 rendered.")


if __name__ == "__main__":
    main()

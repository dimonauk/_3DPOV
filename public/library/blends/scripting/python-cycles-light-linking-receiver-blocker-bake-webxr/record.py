"""
Holoflow Studio — Blender 5.1 Record Script
Cycles Light Linking — Viewport Animation for viewport.mp4

Renders a 5-second turntable of the light-linked scene.  The material on the
hero gem has its baked lightmap plugged into Base Color so the selective
illumination arrangement is visible during the turntable.  The rim-lit edge
and the fill-lamp warmth on the hero (but not the accent orb) should be
clearly readable in the final video.

Run AFTER blueprint.py in the same Blender session.

Output: public/library/videos/scripting/python-cycles-light-linking-receiver-blocker-bake-webxr/viewport.mp4
"""

import bpy
import math

ANIM_FRAMES = 150        # 5 s at 30 fps
RENDER_PATH = "//viewport_frames/#####"
MP4_OUT     = "//viewport.mp4"
PIVOT       = (0.0, 0.0, 0.0)


def patch_hero_preview() -> None:
    """Wire the baked lightmap into Base Color for the turntable preview."""
    hero = bpy.data.objects.get("hero_faceted_gem")
    if hero is None or not hero.data.materials:
        return
    mat = hero.data.materials[0]
    nt  = mat.node_tree
    bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    bake_node = next((n for n in nt.nodes if n.type == 'TEX_IMAGE'), None)
    if bsdf and bake_node:
        nt.links.new(bake_node.outputs["Color"], bsdf.inputs["Base Color"])


def add_turntable_action() -> None:
    """Rotate an empty pivot; parent the hero, accent, floor to it."""
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=PIVOT)
    pivot = bpy.context.active_object
    pivot.name = "turntable_pivot"

    for name in ("hero_faceted_gem", "accent_orb", "floor_plane"):
        ob = bpy.data.objects.get(name)
        if ob:
            ob.parent = pivot

    # One full 360° rotation over ANIM_FRAMES.
    pivot.rotation_euler.z = 0.0
    pivot.keyframe_insert("rotation_euler", frame=1)
    pivot.rotation_euler.z = math.pi * 2
    pivot.keyframe_insert("rotation_euler", frame=ANIM_FRAMES)

    # Linear interpolation — constant angular velocity looks best for turntables.
    for fc in pivot.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def add_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(0.0, -3.5, 1.2))
    cam = bpy.context.active_object
    cam.name = "record_cam"
    cam.rotation_euler = (math.radians(70), 0.0, 0.0)
    bpy.context.scene.camera = cam
    return cam


def configure_render() -> None:
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'   # speed; lightmap already baked
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.fps = 30
    scene.frame_start = 1
    scene.frame_end   = ANIM_FRAMES
    scene.render.filepath = RENDER_PATH
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format           = 'MPEG4'
    scene.render.ffmpeg.codec            = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.filepath = MP4_OUT


def main() -> None:
    patch_hero_preview()
    add_turntable_action()
    add_camera()
    configure_render()
    bpy.ops.render.render(animation=True, write_still=False)
    print("[holoflow] record.py complete — viewport.mp4 written.")


main()

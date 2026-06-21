"""
record.py — Viewport animation for GN Index Switch LOD Mesh Kit (Blender 5.1)
==============================================================================
Renders a 90-frame viewport animation showing the LOD selector cycling through
hi → mid → lo tiers, with a slow orbit camera to show topology density change.

Output: public/library/videos/geometry-nodes/gn-index-switch-lod-mesh-kit/viewport.mp4
Run from Blender's scripting workspace AFTER blueprint.py has completed.
"""
import bpy

OUTPUT_PATH   = "//../../../../videos/geometry-nodes/gn-index-switch-lod-mesh-kit/viewport"
FRAME_TOTAL   = 90     # 3 seconds at 30 fps — 30 frames per LOD tier
FPS           = 30
ORBIT_DEGREES = 120    # total camera orbit arc (°)

def setup_camera() -> bpy.types.Object:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 50
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    cam_obj.location = (0, -3.5, 1.2)
    cam_obj.rotation_euler = (1.2, 0, 0)
    bpy.context.scene.camera = cam_obj
    return cam_obj


def setup_light() -> bpy.types.Object:
    light_data = bpy.data.lights.new("RecordKey", 'AREA')
    light_data.energy = 400
    light_data.size   = 2.0
    light_obj  = bpy.data.objects.new("RecordKey", light_data)
    bpy.context.collection.objects.link(light_obj)
    light_obj.location = (2, -2, 3)
    return light_obj


def keyframe_lod(ctrl: bpy.types.Object,
                 mod: bpy.types.NodesModifier,
                 nt: bpy.types.NodeTree) -> None:
    """Insert LOD Level keyframes: 0 for frames 1-30, 1 for 31-60, 2 for 61-90."""
    lod_id = next(
        s.identifier for s in nt.interface.items_tree
        if getattr(s, 'name', '') == 'LOD Level'
    )
    for tier, (start, end) in enumerate([(1, 30), (31, 60), (61, 90)]):
        mod[lod_id] = tier
        ctrl.keyframe_insert(data_path=f'modifiers["GN_LOD_Selector"]["{lod_id}"]',
                             frame=start)
        ctrl.keyframe_insert(data_path=f'modifiers["GN_LOD_Selector"]["{lod_id}"]',
                             frame=end)


def keyframe_orbit(cam: bpy.types.Object) -> None:
    """Gentle 120° orbit — enough to reveal wireframe density changes."""
    import math
    cam.keyframe_insert('rotation_euler', frame=1)
    cam.rotation_euler.z = math.radians(ORBIT_DEGREES)
    cam.keyframe_insert('rotation_euler', frame=FRAME_TOTAL)


def configure_render() -> None:
    scene = bpy.context.scene
    scene.render.engine         = 'BLENDER_EEVEE_NEXT'
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format  = 'MPEG4'
    scene.render.ffmpeg.codec   = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.filepath       = OUTPUT_PATH
    scene.render.resolution_x   = 1920
    scene.render.resolution_y   = 1080
    scene.render.fps            = FPS
    scene.frame_start           = 1
    scene.frame_end             = FRAME_TOTAL
    # Overlay: wireframe overlay lets viewer see polygon density change
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            area.spaces[0].overlay.show_wireframes = True
            area.spaces[0].overlay.wireframe_opacity = 0.3


def main() -> None:
    # Retrieve controller object + modifier from the blueprint run
    ctrl = bpy.data.objects.get("lod_selector")
    if ctrl is None:
        raise RuntimeError("Run blueprint.py first — 'lod_selector' not found.")
    mod = ctrl.modifiers.get("GN_LOD_Selector")
    nt  = mod.node_group

    cam = setup_camera()
    setup_light()
    keyframe_lod(ctrl, mod, nt)
    keyframe_orbit(cam)
    configure_render()

    bpy.ops.render.render(animation=True, write_still=False)
    print("record.py — viewport.mp4 written.")

main()

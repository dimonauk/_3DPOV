"""
Holoflow Studio — record.py
Viewport animation for: Python bpy — GN Tree from Python, Index Switch, Multi-Variant Poi Head

Outputs: public/library/videos/scripting/python-bpy-gn-tree-from-python-index-switch-poi-head-webxr/viewport.mp4
Duration: ~15 s at 30 fps = 450 frames
Technique: ShapeKey-less variant switching via modifier property animation.
           Each 150-frame act holds a different variant (sphere / drum / spike)
           and the camera completes a 120° arc around the object.

Run AFTER blueprint.py — the HF_PoiHead object and HF_PoiHead_v1 node group
must already exist.
"""

import bpy
import math

OBJECT_NAME  = 'HF_PoiHead'
GROUP_NAME   = 'HF_PoiHead_v1'
OUTPUT_PATH  = '//../../videos/scripting/python-bpy-gn-tree-from-python-index-switch-poi-head-webxr/viewport.mp4'

FPS          = 30
TOTAL_FRAMES = 450   # 15 s

# camera sweep
CAM_RADIUS   = 0.25
CAM_Z        = 0.08
CAM_START_ANGLE = math.radians(-30)   # °
CAM_END_ANGLE   = math.radians(330)   # full 360° orbit


def find_socket_id(ng, name):
    for item in ng.interface.items_tree:
        if getattr(item, 'name', None) == name and item.item_type == 'SOCKET':
            return item.identifier
    return None


def main():
    scene  = bpy.context.scene
    ob     = bpy.data.objects.get(OBJECT_NAME)
    ng     = bpy.data.node_groups.get(GROUP_NAME)

    if ob is None or ng is None:
        print('[HF record] Run blueprint.py first.')
        return

    mod    = ob.modifiers.get('PoiHeadGN')
    cam_ob = bpy.data.objects.get('HF_Cam')
    if mod is None or cam_ob is None:
        print('[HF record] Modifier or camera not found — run blueprint.py first.')
        return

    variant_id = find_socket_id(ng, 'Variant')
    if variant_id is None:
        print('[HF record] Variant socket identifier not found.')
        return

    scene.render.fps          = FPS
    scene.frame_start         = 1
    scene.frame_end           = TOTAL_FRAMES
    scene.frame_set(1)

    # ── clear existing fcurves on the modifier ───────────────────────────────
    if ob.animation_data and ob.animation_data.action:
        for fc in list(ob.animation_data.action.fcurves):
            if variant_id in (fc.data_path or ''):
                ob.animation_data.action.fcurves.remove(fc)

    # ── insert stepped variant keyframes ────────────────────────────────────
    # CONSTANT interpolation = hard switch (correct for integer variant selection)
    for act_start, variant_val in [(1, 0), (151, 1), (301, 2)]:
        scene.frame_set(act_start)
        mod[variant_id] = variant_val
        mod.keyframe_insert(data_path=f'["{variant_id}"]', frame=act_start)
        # Hold until next switch
        if act_start < 301:
            mod[variant_id] = variant_val
            mod.keyframe_insert(data_path=f'["{variant_id}"]', frame=act_start + 149)

    # Set all keyframes to CONSTANT interpolation (no lerp between variants)
    if ob.animation_data and ob.animation_data.action:
        for fc in ob.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'CONSTANT'

    # ── camera orbit ─────────────────────────────────────────────────────────
    if cam_ob.animation_data is None:
        cam_ob.animation_data_create()
    if cam_ob.animation_data.action is None:
        cam_ob.animation_data.action = bpy.data.actions.new('HF_CamOrbit')

    for frame in range(1, TOTAL_FRAMES + 1):
        t     = (frame - 1) / (TOTAL_FRAMES - 1)
        angle = CAM_START_ANGLE + t * (CAM_END_ANGLE - CAM_START_ANGLE)
        cam_ob.location = (
            CAM_RADIUS * math.cos(angle),
            CAM_RADIUS * math.sin(angle),
            CAM_Z,
        )
        cam_ob.keyframe_insert(data_path='location', frame=frame)

    # LINEAR interpolation for smooth orbit
    if cam_ob.animation_data and cam_ob.animation_data.action:
        for fc in cam_ob.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'

    # ── render settings ───────────────────────────────────────────────────────
    scene.render.engine               = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x         = 1920
    scene.render.resolution_y         = 1080
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format        = 'MPEG4'
    scene.render.ffmpeg.codec         = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.filepath             = OUTPUT_PATH

    # World: dark background
    world = scene.world or bpy.data.worlds.new('HF_World')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.02, 0.02, 0.05, 1.0)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.1
    scene.world = world

    print('[HF record] Animation set up. Press Ctrl+F12 (Render Animation) to export.')
    print(f'[HF record] Output: {OUTPUT_PATH}')
    print(f'[HF record] Frames 1–150 = sphere, 151–300 = drum, 301–450 = spike')

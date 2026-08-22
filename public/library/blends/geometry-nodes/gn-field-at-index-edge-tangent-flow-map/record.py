"""
record.py — Viewport animation for GN Field at Index / Edge Slope Map
Run AFTER blueprint.py.  Outputs:
  public/library/videos/geometry-nodes/gn-field-at-index-edge-tangent-flow-map/viewport.mp4

Camera orbits the coloured sphere over 90 frames (3 s at 30 fps).
The emission material makes the slope-gradient colours glow against a dark background.
"""

import bpy
import math
import os

# ── Settings ──────────────────────────────────────────────────────────────────
FRAME_COUNT   = 90
FPS           = 30
CAMERA_RADIUS = 2.8
CAMERA_HEIGHT = 0.6
VIDEO_PATH    = "//../../videos/geometry-nodes/gn-field-at-index-edge-tangent-flow-map/viewport.mp4"


def setup_camera():
    bpy.ops.object.camera_add(location=(CAMERA_RADIUS, 0.0, CAMERA_HEIGHT))
    cam_ob = bpy.context.active_object
    cam_ob.name = "RecordCam"

    # Track-to constraint so camera always faces origin
    con = cam_ob.constraints.new(type='TRACK_TO')
    con.target    = bpy.data.objects.get("edge_flow_sphere")
    con.track_axis = 'TRACK_NEGATIVE_Z'
    con.up_axis    = 'UP_Y'

    bpy.context.scene.camera = cam_ob
    return cam_ob


def add_orbit_animation(cam_ob):
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAME_COUNT

    for f in range(1, FRAME_COUNT + 1):
        angle = 2 * math.pi * (f - 1) / FRAME_COUNT
        cam_ob.location.x = CAMERA_RADIUS * math.cos(angle)
        cam_ob.location.y = CAMERA_RADIUS * math.sin(angle)
        cam_ob.location.z = CAMERA_HEIGHT
        cam_ob.keyframe_insert('location', frame=f)

    # Linear interpolation so orbit is constant-speed
    action = cam_ob.animation_data.action
    for fc in action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def setup_lighting():
    # Remove default lights
    for ob in list(bpy.data.objects):
        if ob.type == 'LIGHT':
            bpy.data.objects.remove(ob)

    # Dim fill to let emission dominate
    bpy.ops.object.light_add(type='AREA', location=(3, 2, 4))
    fill = bpy.context.active_object
    fill.data.energy = 12.0
    fill.data.size   = 4.0
    fill.name = "FillLight"

    # World: near-black for maximum emission contrast
    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new("World")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value    = (0.008, 0.008, 0.012, 1.0)
        bg.inputs['Strength'].default_value = 0.3


def configure_eevee():
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.render.fps    = FPS

    # Bloom for emission glow (EEVEE Next)
    eevee = scene.eevee
    eevee.use_bloom         = True
    eevee.bloom_threshold   = 0.6
    eevee.bloom_intensity   = 0.12
    eevee.bloom_radius      = 4.0

    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100

    # Output path
    out = bpy.path.abspath(VIDEO_PATH)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    scene.render.filepath            = out
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format       = 'MPEG4'
    scene.render.ffmpeg.codec        = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.ffmpeg.audio_codec  = 'NONE'


def main():
    cam = setup_camera()
    add_orbit_animation(cam)
    setup_lighting()
    configure_eevee()

    bpy.ops.render.render(animation=True)
    print(f"Recording saved → {bpy.path.abspath(VIDEO_PATH)}")


if __name__ == "__main__":
    main()

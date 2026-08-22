"""
record.py — viewport animation render for the NormalEditModifier tutorial.

Outputs: public/library/videos/scripting/
           python-bpy-normal-edit-modifier-radial-cel-shade-vrm-glb-webxr/viewport.mp4

Run after blueprint.py has been executed (hf_normal_edit_gem must exist).
Renders a 150-frame turntable at 24 fps (6.25 s) in EEVEE Next so the
spherical normals produce the toon-cel shading effect visible in final use.
A key frame at midpoint shows the modifier's mix_factor effect: the first
half of the orbit shows the gem lit by sphere normals; the camera rises
slightly in the second half to reveal the base facets keeping their flat
shading from the reduced vertex-group weight.
"""

import bpy
import math

# ─── CONSTANTS ────────────────────────────────────────────────────────────────
OUTPUT_PATH    = "//../../../../videos/scripting/python-bpy-normal-edit-modifier-radial-cel-shade-vrm-glb-webxr/viewport"
FRAME_START    = 1
FRAME_END      = 150
FPS            = 24
CAM_DISTANCE   = 2.8
CAM_HEIGHT_LOW = 0.9
CAM_HEIGHT_HIGH = 1.6
CAM_FOCUS_Z    = 0.0


def setup_camera():
    bpy.ops.object.camera_add(location=(CAM_DISTANCE, 0.0, CAM_HEIGHT_LOW))
    cam = bpy.context.active_object
    cam.name = "rec_cam"

    bpy.ops.object.empty_add(location=(0.0, 0.0, CAM_FOCUS_Z))
    target = bpy.context.active_object
    target.name = "rec_target"

    ct = cam.constraints.new('TRACK_TO')
    ct.target     = target
    ct.track_axis = 'TRACK_NEGATIVE_Z'
    ct.up_axis    = 'UP_Y'

    bpy.context.scene.camera = cam
    return cam


def keyframe_orbit(cam):
    """
    Full orbit + gentle camera lift in the second half.
    The lift reveals the flat-normal base verts at the bottom of the gem,
    illustrating the vertex-group weight gradient effect.
    """
    scene = bpy.context.scene
    mid   = (FRAME_END - FRAME_START) / 2.0
    for frame in range(FRAME_START, FRAME_END + 1):
        t     = (frame - FRAME_START) / max(FRAME_END - FRAME_START, 1)
        angle = math.tau * t
        # smoothstep lift in second half
        s = max(0.0, min(1.0, (t - 0.5) * 2.0))
        lift = s * s * (3.0 - 2.0 * s)
        height = CAM_HEIGHT_LOW + lift * (CAM_HEIGHT_HIGH - CAM_HEIGHT_LOW)

        cam.location.x = CAM_DISTANCE * math.cos(angle)
        cam.location.y = CAM_DISTANCE * math.sin(angle)
        cam.location.z = height
        scene.frame_set(frame)
        cam.keyframe_insert("location", frame=frame)


def add_lighting():
    # Three-point rig to show sphere-normal toon gradients clearly
    bpy.ops.object.light_add(type='AREA', location=(2.5, -1.5, 3.0))
    key = bpy.context.active_object
    key.data.energy = 300
    key.data.size   = 1.5

    bpy.ops.object.light_add(type='AREA', location=(-2.0, 1.0, 2.0))
    fill = bpy.context.active_object
    fill.data.energy = 80
    fill.data.size   = 2.0

    bpy.ops.object.light_add(type='POINT', location=(0.0, 2.5, -1.0))
    rim = bpy.context.active_object
    rim.data.energy = 60


def setup_render():
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    # EEVEE Next shows sphere-normal shading effect correctly
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.eevee.use_raytracing = False   # fast, not path-traced
    scene.eevee.taa_render_samples = 16

    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format  = 'MPEG4'
    scene.render.ffmpeg.codec   = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.resolution_x   = 1920
    scene.render.resolution_y   = 1080
    scene.render.resolution_percentage = 100
    scene.render.filepath       = OUTPUT_PATH


def main():
    cam = setup_camera()
    keyframe_orbit(cam)
    add_lighting()
    setup_render()
    bpy.ops.render.render(animation=True)
    print("[holoflow] viewport.mp4 rendered")


if __name__ == "__main__":
    main()

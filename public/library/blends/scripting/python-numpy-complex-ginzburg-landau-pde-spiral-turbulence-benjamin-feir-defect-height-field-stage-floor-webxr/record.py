"""
Holoflow Studio — viewport.mp4 recorder for CGLE Stage Floor.
Run AFTER blueprint.py in the same Blender session.
Outputs public/library/videos/scripting/<slug>/viewport.mp4 (10 s · 30 fps).

Technique: animate a shape-key evaluation time on the Action keyframe,
           step frame-by-frame, composite to OpenEXR, then re-render to mp4.
           (Here we morph from Basis → SK_Turbulent over 300 frames to show
            the Benjamin–Feir instability onset.)
"""
import bpy, os, math

SLUG   = ("python-numpy-complex-ginzburg-landau-pde-spiral-turbulence-"
           "benjamin-feir-defect-height-field-stage-floor-webxr")
FPS    = 30
FRAMES = 300   # 10 s

def setup_render():
    scene = bpy.context.scene
    scene.render.engine          = 'BLENDER_EEVEE_NEXT'
    scene.render.fps             = FPS
    scene.frame_start            = 1
    scene.frame_end              = FRAMES
    scene.render.resolution_x    = 1920
    scene.render.resolution_y    = 1080
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format   = 'MPEG4'
    scene.render.ffmpeg.codec    = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__),
                                              "../../../../"))
    out_dir = os.path.join(repo_root, "public", "library", "videos",
                           "scripting", SLUG)
    os.makedirs(out_dir, exist_ok=True)
    scene.render.filepath = os.path.join(out_dir, "viewport.mp4")


def keyframe_morph():
    """Morph Basis→SK_Turbulent (value 0→1) over FRAMES frames."""
    obj = bpy.data.objects.get("holoflow_cgl_floor")
    if obj is None:
        raise RuntimeError("Run blueprint.py first.")
    keys = obj.data.shape_keys.key_blocks
    turb = keys.get("SK_Turbulent")
    if turb is None:
        raise RuntimeError("SK_Turbulent shape key not found.")
    turb.value = 0.0
    turb.keyframe_insert("value", frame=1)
    turb.value = 1.0
    turb.keyframe_insert("value", frame=FRAMES)


def camera_orbit():
    """Bird's-eye perspective, slowly tilting forward."""
    scene = bpy.context.scene
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    import mathutils
    # Start: overhead-ish
    cam_obj.location = mathutils.Vector((0, -28, 24))
    cam_obj.rotation_euler = mathutils.Euler((math.radians(50), 0, 0), 'XYZ')
    cam_obj.keyframe_insert("location", frame=1)
    cam_obj.keyframe_insert("rotation_euler", frame=1)
    # End: lower, more dramatic
    cam_obj.location = mathutils.Vector((0, -20, 14))
    cam_obj.rotation_euler = mathutils.Euler((math.radians(38), 0, 0), 'XYZ')
    cam_obj.keyframe_insert("location", frame=FRAMES)
    cam_obj.keyframe_insert("rotation_euler", frame=FRAMES)

    # Smooth curves
    if cam_obj.animation_data:
        for fc in cam_obj.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'


def add_light():
    bpy.ops.object.light_add(type='SUN', location=(10, -10, 30))
    sun = bpy.context.active_object
    sun.data.energy = 3.5
    sun.data.angle  = math.radians(5)


def main():
    setup_render()
    keyframe_morph()
    camera_orbit()
    add_light()
    bpy.ops.render.render(animation=True)


if __name__ == "__main__":
    main()

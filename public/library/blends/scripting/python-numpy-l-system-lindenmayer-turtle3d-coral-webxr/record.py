# record.py — Viewport animation for L-System coral
# Animates bevel_factor_end 0→1 on each branch spline to grow the coral
# from root to tips, then renders to viewport.mp4 via Blender's OpenGL
# animation renderer. Run AFTER blueprint.py has built the scene.
#
# OUTPUT: public/library/videos/scripting/
#         python-numpy-l-system-lindenmayer-turtle3d-coral-webxr/viewport.mp4

import bpy

FRAME_START = 1
FRAME_END   = 96    # 4 s at 24 fps — fast enough to demo the growth
OUTPUT_MP4  = "//../../videos/scripting/python-numpy-l-system-lindenmayer-turtle3d-coral-webxr/viewport.mp4"

def setup_camera():
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    cam_obj.location = (2.0, -2.8, 1.5)
    cam_obj.rotation_euler = (1.05, 0.0, 0.70)   # tilted down-right
    bpy.context.scene.camera = cam_obj

def setup_lighting():
    # Point light below for underlit coral glow
    bpy.ops.object.light_add(type="POINT", location=(0, 0, -0.5))
    light = bpy.context.object
    light.data.energy = 120
    light.data.color  = (0.25, 0.85, 0.95)

    # Rim from upper right
    bpy.ops.object.light_add(type="AREA", location=(1.5, 1.2, 2.0))
    rim = bpy.context.object
    rim.data.energy = 60

def key_bevel_growth():
    """
    Animate bevel_factor_end 0→1 on the coral mesh object to grow it.
    Since we converted to mesh (no curve bevel), instead animate the
    object's Z scale 0→1 for a grow-up-from-ground effect.
    """
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END

    coral = bpy.data.objects.get("hf_l_system_coral_mesh")
    if coral is None:
        print("[HF] record.py: mesh not found; run blueprint.py first.")
        return

    coral.scale = (1.0, 1.0, 0.0)
    coral.keyframe_insert("scale", frame=FRAME_START)
    coral.scale = (1.0, 1.0, 1.0)
    coral.keyframe_insert("scale", frame=FRAME_END)

    # smooth in ease
    if coral.animation_data and coral.animation_data.action:
        for fc in coral.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"
                kp.easing = "EASE_IN_OUT"

def render_opengl():
    scene = bpy.context.scene
    scene.render.resolution_x     = 1280
    scene.render.resolution_y     = 720
    scene.render.fps               = 24
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format             = "MPEG4"
    scene.render.ffmpeg.codec              = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath = bpy.path.abspath(OUTPUT_MP4)

    # World: pure black for the bioluminescent look
    world = bpy.data.worlds.get("World")
    if world and world.use_nodes:
        bg = world.node_tree.nodes.get("Background")
        if bg:
            bg.inputs["Color"].default_value    = (0.0, 0.0, 0.0, 1.0)
            bg.inputs["Strength"].default_value = 0.0

    bpy.ops.render.opengl(animation=True)
    print(f"[HF] Viewport render complete → {OUTPUT_MP4}")

def main():
    setup_camera()
    setup_lighting()
    key_bevel_growth()
    render_opengl()

main()

"""
Record — GN Matrix Nodes FK Chain: Poi Staff (Blender 5.1)
==========================================================
Viewport animation render: 0→120 frames at 30 fps = 4 seconds.
Outputs to public/library/videos/geometry-nodes/
  gn-matrix-nodes-fk-chain-articulated-poi-staff/viewport.mp4

Run AFTER blueprint.py has been executed and the scene is saved.
"""

import bpy, math

SLUG     = "gn-matrix-nodes-fk-chain-articulated-poi-staff"
OUT_PATH = f"//../../videos/geometry-nodes/{SLUG}/viewport"

def setup_camera():
    cam_data = bpy.data.cameras.new("rec_cam")
    cam_data.lens = 50
    cam_obj = bpy.data.objects.new("rec_cam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    cam_obj.location = (1.8, -2.6, 1.2)
    cam_obj.rotation_euler = (math.radians(70), 0, math.radians(30))
    bpy.context.scene.camera = cam_obj


def animate_joint_angle():
    """
    Keyframe the 'Joint Angle' GN input (Input_3) from 0.30 to 1.10 rad
    across FRAME_END frames — the chain fans out as the angle grows,
    demonstrating FK chain expansion in the viewport.
    """
    obj = bpy.data.objects.get("hf_poi_staff")
    if obj is None:
        return
    mod = next((m for m in obj.modifiers if m.type == 'NODES'), None)
    if mod is None:
        return

    scene = bpy.context.scene
    obj.keyframe_insert(data_path='modifiers["HF_FK_Chain"]["Input_3"]',
                        frame=1)
    mod["Input_3"] = 1.10
    obj.keyframe_insert(data_path='modifiers["HF_FK_Chain"]["Input_3"]',
                        frame=scene.frame_end)
    mod["Input_3"] = 0.30   # reset after keying

    for fc in obj.animation_data.action.fcurves:
        if 'Input_3' in fc.data_path:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'


def configure_render():
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.fps = 30
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'MPEG4'
    scene.render.ffmpeg.codec = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.filepath = OUT_PATH

    # World (black background for poi aesthetic)
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = \
        (0.0, 0.0, 0.0, 1.0)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.0

    # Bloom for emission glow
    scene.eevee.use_bloom = True
    scene.eevee.bloom_intensity = 0.08
    scene.eevee.bloom_threshold = 0.6


def main():
    setup_camera()
    animate_joint_angle()
    configure_render()
    bpy.ops.render.render(animation=True)
    print(f"[{SLUG}] Render complete → {OUT_PATH}.mp4")


main()

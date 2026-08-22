"""
record.py — Viewport animation recorder for Penrose P3 Rhombus Tiling
CC0 · Holoflow Studio

Run AFTER blueprint.py.  Orbits the camera above the Penrose floor at a slow
45° arc (250 frames), triggers a Viewport Shading OpenGL render, and writes
the frame sequence to public/library/videos/scripting/python-numpy-penrose-p3-rhombus-quasicrystal-stage-floor-webxr/

Expected output:  viewport.mp4  (H.264, 1920×1080, 25fps → 10-second clip)
"""

import bpy
import math

# ---------------------------------------------------------------------------
# Parameters
# ---------------------------------------------------------------------------
FRAME_START   = 1
FRAME_END     = 250         # 10 s at 25 fps
FPS           = 25
CAM_HEIGHT    = 2.8         # m above the Penrose floor
CAM_RADIUS    = 3.5         # m orbit radius
CAM_TILT_DEG  = 55.0        # elevation angle from vertical

OUTPUT_DIR = "//../../../../videos/scripting/python-numpy-penrose-p3-rhombus-quasicrystal-stage-floor-webxr/"
OUTPUT_FILE = OUTPUT_DIR + "viewport"  # Blender appends #### and extension


def setup_camera():
    cam_data = bpy.data.cameras.new("HF_RecordCam")
    cam_data.lens = 28.0  # wide to show the full tiling expanse
    cam_ob = bpy.data.objects.new("HF_RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_ob)
    bpy.context.scene.camera = cam_ob
    return cam_ob


def animate_camera(cam_ob):
    """Orbit camera around origin, descending slightly from frame 1→250."""
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    cam_ob.animation_data_create()
    action = bpy.data.actions.new("HF_CamOrbit")
    cam_ob.animation_data.action = action

    for frame in range(FRAME_START, FRAME_END + 1, 10):
        t = (frame - FRAME_START) / (FRAME_END - FRAME_START)  # 0 → 1
        angle = math.radians(45.0 * t)  # 45° orbit arc

        # Camera world position
        x = CAM_RADIUS * math.cos(angle)
        y = CAM_RADIUS * math.sin(angle)
        z = CAM_HEIGHT * (1.0 - 0.15 * t)  # gently descend 15%

        cam_ob.location = (x, y, z)
        cam_ob.keyframe_insert("location", frame=frame)

        # Point toward origin
        dx, dy, dz = -x, -y, -z
        dist = math.sqrt(dx*dx + dy*dy + dz*dz)
        pitch = math.atan2(-dz, math.sqrt(dx*dx + dy*dy))
        yaw   = math.atan2(dy, dx) + math.pi

        cam_ob.rotation_euler = (
            math.pi / 2.0 - math.asin(z / dist),
            0.0,
            yaw
        )
        cam_ob.keyframe_insert("rotation_euler", frame=frame)

    # Smooth all fcurves
    for fc in action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"


def setup_render():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec  = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath = OUTPUT_FILE

    # Lighting: single warm key light above
    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new("HF_World")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value    = (0.04, 0.04, 0.06, 1.0)
        bg.inputs["Strength"].default_value = 0.5

    if "HF_KeyLight" not in bpy.data.lights:
        light_data = bpy.data.lights.new("HF_KeyLight", "SUN")
        light_data.energy = 4.0
        light_data.color  = (1.0, 0.95, 0.85)
        light_ob = bpy.data.objects.new("HF_KeyLight", light_data)
        bpy.context.collection.objects.link(light_ob)
        light_ob.rotation_euler = (math.radians(50), 0, math.radians(-30))


def main():
    import pathlib
    pathlib.Path(bpy.path.abspath(OUTPUT_DIR)).mkdir(parents=True, exist_ok=True)

    # Remove any pre-existing camera from blueprint run
    for ob in bpy.data.objects:
        if ob.type == "CAMERA":
            bpy.data.objects.remove(ob, do_unlink=True)

    cam_ob = setup_camera()
    animate_camera(cam_ob)
    setup_render()
    bpy.ops.render.render(animation=True)
    print("[holoflow] record.py: viewport animation written to", OUTPUT_FILE)


if __name__ == "__main__":
    main()

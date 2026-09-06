"""
record.py — Viewport animation render for LG Vortex Floor
==========================================================
Outputs:  public/library/videos/scripting/
          python-numpy-laguerre-gaussian-optical-vortex-.../viewport.mp4

Run inside Blender 5.1 AFTER blueprint.py has built the scene.
Duration: 10 seconds at 30 fps = 300 frames.

Animation plan (read blueprint.py first to understand the shape key naming):
  F  0–60   Orbit camera, Basis (l=1 p=0): single doughnut ring
  F 60–120  Morph to SK_l2 (l=2): ring expands, second arm appears
  F120–180  Morph to SK_l3 (l=3): three-arm star pattern
  F180–240  Morph to SK_p1 (l=1 p=1): two concentric rings
  F240–300  Return to Basis, full 360° final orbit

WHY morph-key animation not particle trail:
  LG modes are static beam profiles (not time-dependent in the paraxial regime),
  so what we animate is the MODE SPACE — changing l and p reveals the family
  structure.  Morphing shape keys in Blender preserves attribute colour per
  vertex without additional compositing.
"""

import bpy, math

FPS      = 30
FRAMES   = 300   # 10 s
CAM_R    = 5.5   # orbit radius (metres)
CAM_Z    = 3.5   # camera height
LOOK_AT  = (0.0, 0.0, 0.30)   # slight above-centre focus


def clear_animation():
    """Remove all existing keyframes so we start fresh."""
    for obj in bpy.data.objects:
        obj.animation_data_clear()
    for act in bpy.data.actions:
        bpy.data.actions.remove(act)


def setup_camera():
    if "Camera" not in bpy.data.objects:
        bpy.ops.object.camera_add(location=(CAM_R, 0, CAM_Z))
    cam = bpy.data.objects["Camera"]
    bpy.context.scene.camera = cam
    return cam


def orbit_angle(frame: int, start: int, end: int,
                angle_start: float, angle_end: float) -> float:
    """Linear interpolation of orbit angle between frames."""
    t = max(0.0, min(1.0, (frame - start) / max(end - start, 1)))
    return angle_start + t * (angle_end - angle_start)


def set_camera_orbit(cam, angle_deg: float):
    r = CAM_R
    a = math.radians(angle_deg)
    cam.location = (r * math.cos(a), r * math.sin(a), CAM_Z)
    # Point toward LOOK_AT
    dx = LOOK_AT[0] - cam.location.x
    dy = LOOK_AT[1] - cam.location.y
    dz = LOOK_AT[2] - cam.location.z
    dist_xy = math.hypot(dx, dy)
    cam.rotation_euler = (
        math.atan2(dist_xy, -dz),   # tilt down
        0.0,
        math.atan2(dy, dx) + math.pi / 2,
    )


def set_sk(obj, sk_name: str, value: float, frame: int):
    """Insert keyframe for shape-key value."""
    sk = obj.data.shape_keys.key_blocks[sk_name]
    sk.value = value
    sk.keyframe_insert("value", frame=frame)


def animate_shape_keys(obj):
    """
    Morph sequence through the four LG modes.
    Each transition takes 60 frames (2 s), hold 0 frames.
    """
    sk_names = ["Basis", "SK_l2", "SK_l3", "SK_p1"]

    # Initialise everything to 0 at frame 1
    for sn in sk_names:
        if sn in obj.data.shape_keys.key_blocks:
            set_sk(obj, sn, 0.0, 1)

    transitions = [
        # (from_name, to_name, frame_start, frame_end)
        ("Basis", "SK_l2", 50,  110),
        ("SK_l2", "SK_l3", 120, 180),
        ("SK_l3", "SK_p1", 190, 250),
        ("SK_p1", "Basis", 260, 300),
    ]

    for (from_sk, to_sk, fs, fe) in transitions:
        if from_sk in obj.data.shape_keys.key_blocks:
            set_sk(obj, from_sk, 1.0, fs)
            set_sk(obj, from_sk, 0.0, fe)
        if to_sk in obj.data.shape_keys.key_blocks:
            set_sk(obj, to_sk, 0.0, fs)
            set_sk(obj, to_sk, 1.0, fe)

    # Hold Basis=1 before first transition
    if "Basis" in obj.data.shape_keys.key_blocks:
        set_sk(obj, "Basis", 1.0, 1)


def setup_render():
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end   = FRAMES
    sc.render.fps   = FPS
    sc.render.resolution_x = 1920
    sc.render.resolution_y = 1080
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format   = "MPEG4"
    sc.render.ffmpeg.codec    = "H264"
    sc.render.ffmpeg.constant_rate_factor = "MEDIUM"
    sc.render.filepath = (
        "//../../videos/scripting/"
        "python-numpy-laguerre-gaussian-optical-vortex-allen-1992-"
        "orbital-angular-momentum-height-field-stage-floor-webxr/"
        "viewport.mp4"
    )
    # EEVEE Next for fast viewport-quality render
    sc.render.engine = "BLENDER_EEVEE_NEXT"
    sc.eevee.taa_render_samples = 16


def setup_lighting():
    """Area light above floor + ambient world for clean ring visibility."""
    bpy.ops.object.light_add(type="AREA", location=(0, 0, 4))
    light = bpy.context.active_object
    light.data.energy = 80
    light.data.size   = 3.0
    bpy.context.scene.world.node_tree.nodes["Background"].inputs[1].default_value = 0.15


def main():
    clear_animation()
    cam = setup_camera()

    obj = next((o for o in bpy.data.objects if "lg_vortex" in o.name), None)
    if obj is None:
        raise RuntimeError("lg_vortex object not found — run blueprint.py first")

    animate_shape_keys(obj)

    # Camera orbit: 0° → 360° over full animation
    for frame in range(1, FRAMES + 1):
        angle = orbit_angle(frame, 1, FRAMES, 20.0, 380.0)
        set_camera_orbit(cam, angle)
        cam.keyframe_insert("location", frame=frame)
        cam.keyframe_insert("rotation_euler", frame=frame)

    setup_lighting()
    setup_render()

    bpy.ops.render.render(animation=True)
    print("[record.py] LG Vortex viewport render complete.")


main()

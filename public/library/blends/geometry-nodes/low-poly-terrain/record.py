"""Viewport animation recording — low-poly faceted terrain
Blender 5.1 | Holoflow Studio | CC0

Run AFTER blueprint.py (terrain_faceted object must exist in the scene).
Open in Text Editor → Run Script (Alt + P).

Outputs → public/library/videos/geometry-nodes/low-poly-terrain/viewport.mp4

What it records
---------------
Frames 1–72  : noise Scale animates 0 → 3.2 (flat grid erupts into terrain)
Frames 73–144: camera orbits 360° around the finished terrain
Total        : 144 frames at 24 fps = 6 seconds

WHY animate Scale from 0 rather than showing the full terrain immediately:
the transition from flat grid to displaced facets demonstrates the
technique's driving parameter in a single cut, making the tutorial's
intent legible without any voiceover.
"""

import bpy
import math

OUTPUT_PATH     = "//../../videos/geometry-nodes/low-poly-terrain/viewport.mp4"
FRAME_START     = 1
FRAME_MORPH_END = 72    # Scale ramps 0 → SCALE_TARGET in this window
FRAME_END       = 144   # camera orbit fills the remainder
FPS             = 24
SCALE_TARGET    = 3.2   # matches blueprint.py NOISE_SCALE
CAM_RADIUS      = 9.0   # metres from origin
CAM_ELEVATION   = math.radians(38)


# ── camera ────────────────────────────────────────────────────────────────

def make_orbit_camera() -> bpy.types.Object:
    """
    Position a camera on a circular orbit path.
    Orbit is achieved via keyframed location + rotation — no constraints,
    no empties, so the script stays self-contained.
    """
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 35.0
    cam = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam

    # orbit keyframes: one per 30° step around the terrain
    for step in range(13):   # 0..360 inclusive
        angle = math.radians(step * 30)
        frame = FRAME_MORPH_END + step * ((FRAME_END - FRAME_MORPH_END) // 12)

        x = CAM_RADIUS * math.cos(angle)
        y = CAM_RADIUS * math.sin(angle)
        z = CAM_RADIUS * math.sin(CAM_ELEVATION)

        cam.location = (x, y, z)
        # point camera at origin — rotate to face (0,0,0) from current position
        direction = (-x, -y, -z)
        rot_quat  = bpy.context.scene.camera.rotation_euler
        cam.rotation_euler = (
            math.atan2(math.sqrt(x**2 + y**2), z) - math.pi / 2,
            0.0,
            math.atan2(y, x) + math.pi,
        )
        cam.keyframe_insert(data_path="location",       frame=frame)
        cam.keyframe_insert(data_path="rotation_euler", frame=frame)

    # make orbit interpolation linear so the spin is constant-speed
    if cam.animation_data and cam.animation_data.action:
        for fc in cam.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"

    return cam


# ── noise scale animation ─────────────────────────────────────────────────

def animate_noise_scale() -> None:
    """
    Keyframe the Noise Texture Scale input on the GN modifier from
    0 → SCALE_TARGET over FRAME_MORPH_END frames.

    WHY keyframe the node input directly rather than a custom property
    driver: the node socket default_value supports keyframes natively
    (via keyframe_insert on the socket). A driver would work too but
    adds a dependency chain. Direct keyframes are simpler and legible
    in the timeline.
    """
    obj = bpy.data.objects.get("terrain_faceted")
    if not obj:
        print("[record] terrain_faceted not found — run blueprint.py first")
        return

    mod = obj.modifiers.get("FacetedTerrain")
    if not mod or not mod.node_group:
        print("[record] FacetedTerrain GN modifier not found")
        return

    noise = next(
        (n for n in mod.node_group.nodes if n.bl_idname == "ShaderNodeTexNoise"),
        None,
    )
    if not noise:
        print("[record] ShaderNodeTexNoise not in GN tree")
        return

    scale_socket = noise.inputs["Scale"]
    scene        = bpy.context.scene

    scene.frame_set(FRAME_START)
    scale_socket.default_value = 0.0
    scale_socket.keyframe_insert(data_path="default_value", frame=FRAME_START)

    scene.frame_set(FRAME_MORPH_END)
    scale_socket.default_value = SCALE_TARGET
    scale_socket.keyframe_insert(data_path="default_value", frame=FRAME_MORPH_END)

    scene.frame_set(FRAME_END)
    scale_socket.default_value = SCALE_TARGET
    scale_socket.keyframe_insert(data_path="default_value", frame=FRAME_END)


# ── render setup ─────────────────────────────────────────────────────────

def setup_render() -> None:
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format  = "MPEG4"
    scene.render.ffmpeg.codec   = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath       = bpy.path.abspath(OUTPUT_PATH)
    scene.render.resolution_x   = 1920
    scene.render.resolution_y   = 1080
    scene.render.resolution_percentage = 100


# ── entry point ───────────────────────────────────────────────────────────

def main() -> None:
    animate_noise_scale()
    make_orbit_camera()
    setup_render()
    bpy.ops.render.render(animation=True)
    print(f"[record] viewport.mp4 written → {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

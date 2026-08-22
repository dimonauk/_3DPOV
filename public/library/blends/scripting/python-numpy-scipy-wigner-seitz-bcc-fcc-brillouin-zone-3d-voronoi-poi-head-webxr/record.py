"""
record.py — Viewport animation recording for the Wigner-Seitz cell tutorial.
Blender 5.1 | bpy | CC0 | Holoflow Studio

Run AFTER blueprint.py has built the three WS-cell objects (SC, BCC, FCC).
Animates a 180-frame turntable-rotation + perspective zoom sequence:
  F1–60   : All three cells rotate 360° in Z — showing the 3-fold / 4-fold symmetry.
  F61–120 : Camera swoops to close-up of BCC (truncated octahedron), highlighting
            its 14-face structure (8 hex + 6 square).
  F121–180: Camera steps to FCC (rhombic dodecahedron), 12 identical rhombic faces.

Output: public/library/videos/scripting/
  python-numpy-scipy-wigner-seitz-bcc-fcc-brillouin-zone-3d-voronoi-poi-head-webxr/
    viewport.mp4
"""

import bpy, math

# ─── Parameters ───────────────────────────────────────────────────────────────
FRAMES        = 180
FPS           = 24
VIDEO_PATH    = (
    "public/library/videos/scripting/"
    "python-numpy-scipy-wigner-seitz-bcc-fcc-brillouin-zone-3d-voronoi-poi-head-webxr/"
    "viewport.mp4"
)
OBJ_SC        = "HF_WS_SC"
OBJ_BCC       = "HF_WS_BCC"
OBJ_FCC       = "HF_WS_FCC"


# ─── Helpers ──────────────────────────────────────────────────────────────────

def kf_linear(obj, path, frame, value):
    """Insert a keyframe and force LINEAR interpolation."""
    setattr(obj if "." not in path else _nested(obj, path), path.split(".")[-1], value)
    obj.keyframe_insert(data_path=path, frame=frame)
    if obj.animation_data and obj.animation_data.action:
        for fc in obj.animation_data.action.fcurves:
            if fc.data_path == path:
                for kp in fc.keyframe_points:
                    kp.interpolation = "LINEAR"


def kf_euler(obj, frame, rx, ry, rz):
    """Keyframe Euler rotation with LINEAR interpolation."""
    obj.rotation_euler = (rx, ry, rz)
    obj.keyframe_insert(data_path="rotation_euler", frame=frame)
    if obj.animation_data and obj.animation_data.action:
        for fc in obj.animation_data.action.fcurves:
            if fc.data_path == "rotation_euler":
                for kp in fc.keyframe_points:
                    kp.interpolation = "LINEAR"


def kf_loc(obj, frame, loc):
    """Keyframe object location with LINEAR interpolation."""
    obj.location = loc
    obj.keyframe_insert(data_path="location", frame=frame)
    if obj.animation_data and obj.animation_data.action:
        for fc in obj.animation_data.action.fcurves:
            if fc.data_path == "location":
                for kp in fc.keyframe_points:
                    kp.interpolation = "LINEAR"


# ─── Camera setup ─────────────────────────────────────────────────────────────

def setup_camera():
    """
    Perspective camera starting at a 45° elevated overview of all three cells,
    then tracking to BCC and FCC for close-up segments.
    """
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens      = 50.0     # mm — mild telephoto keeps distortion low
    cam_data.clip_start = 0.01
    cam_data.clip_end   = 50.0

    cam_obj = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    # Phase 1: overview position (all three cells visible)
    # Elevation ~45°, azimuth ~30°, distance ~0.7 m
    kf_loc(cam_obj, 1,   (0.30,  -0.65, 0.50))
    kf_loc(cam_obj, 60,  (0.30,  -0.65, 0.50))
    # Phase 2: close-up on BCC (centre, y=0)
    kf_loc(cam_obj, 61,  (0.00,  -0.25, 0.18))
    kf_loc(cam_obj, 120, (0.00,  -0.25, 0.18))
    # Phase 3: close-up on FCC (right, x=+0.22)
    kf_loc(cam_obj, 121, (0.22,  -0.25, 0.18))
    kf_loc(cam_obj, 180, (0.22,  -0.25, 0.18))

    # Rotation: always tilted down toward the cells
    cam_obj.rotation_euler = (math.radians(40), 0, math.radians(30))
    cam_obj.keyframe_insert(data_path="rotation_euler", frame=1)
    cam_obj.keyframe_insert(data_path="rotation_euler", frame=180)

    return cam_obj


# ─── Object animation ─────────────────────────────────────────────────────────

def animate_cells():
    """
    Phase 1 (F1–60): All three cells perform a full 360° Z-rotation in unison.
    Phase 2–3 (F61–180): BCC and FCC continue rotating slowly; SC fades back.
    """
    TAU = 2 * math.pi

    for name in (OBJ_SC, OBJ_BCC, OBJ_FCC):
        obj = bpy.data.objects.get(name)
        if obj is None:
            print(f"[record] Object '{name}' not found — run blueprint.py first.")
            continue
        # Full 360° over first 60 frames
        kf_euler(obj, 1,   0.0, 0.0, 0.0)
        kf_euler(obj, 60,  0.0, 0.0, TAU)
        # Slow 180° over remaining 120 frames (cells keep spinning during close-ups)
        kf_euler(obj, 180, 0.0, 0.0, TAU * 2.0)


# ─── Render settings ──────────────────────────────────────────────────────────

def configure_render():
    scn = bpy.context.scene
    scn.frame_start = 1
    scn.frame_end   = FRAMES
    scn.render.fps  = FPS

    scn.render.engine         = "BLENDER_WORKBENCH"
    scn.display.shading.light = "MATCAP"
    scn.display.shading.color_type = "VERTEX"   # show CrystalFace colours
    scn.display.shading.show_cavity = False

    scn.render.resolution_x = 1920
    scn.render.resolution_y = 1080
    scn.render.image_settings.file_format = "FFMPEG"
    scn.render.ffmpeg.format              = "MPEG4"
    scn.render.ffmpeg.codec               = "H264"
    scn.render.ffmpeg.constant_rate_factor= "HIGH"
    scn.render.filepath = VIDEO_PATH

    print(f"[record] Render → {VIDEO_PATH}  ({FRAMES} frames @ {FPS} fps)")


# ─── Entry point ──────────────────────────────────────────────────────────────

def run():
    setup_camera()
    animate_cells()
    configure_render()
    bpy.ops.render.render(animation=True)
    print("[record] Done — viewport.mp4 written.")


run()

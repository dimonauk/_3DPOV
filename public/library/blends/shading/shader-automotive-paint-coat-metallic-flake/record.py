"""
RECORD.PY — Viewport animation: automotive paint flake sparkle
==============================================================
Outputs: public/library/videos/shading/shader-automotive-paint-coat-metallic-flake/viewport.mp4

Technique: orbit the camera around the panel in a 180° arc while keeping
it aimed at the panel centre.  The flake sparkle is strongly view-dependent
(each flake normal reflects toward a different camera angle), so the orbiting
movement turns a static-looking surface into a living galaxy of micro-sparks.

Duration: 10 seconds @ 24 fps = 240 frames.
The coat highlight sweeps from one side to the other; the flake layer
shimmers independently throughout — demonstrating both optical layers
in a single recording.

Run after blueprint.py has been executed (requires automotive_paint.blend loaded).
"""

import bpy, math, os

OUT_PATH = "//../../videos/shading/shader-automotive-paint-coat-metallic-flake/viewport.mp4"

RADIUS    = 1.6    # camera orbit radius (m)
HEIGHT    = 0.45   # camera height
ARC_START = -80.0  # degrees, left of panel
ARC_END   =  80.0  # degrees, right of panel
FRAMES    = 240    # 10 s at 24 fps
FPS       = 24

def setup_offscreen_render():
    sc = bpy.context.scene
    sc.render.engine               = "CYCLES"
    sc.cycles.samples              = 64          # low for speed; enough to see sparkle
    sc.cycles.use_denoising        = False        # denoising smears flake micro-detail
    sc.render.resolution_x         = 1920
    sc.render.resolution_y         = 1080
    sc.render.fps                  = FPS
    sc.frame_start                 = 1
    sc.frame_end                   = FRAMES
    sc.render.filepath             = OUT_PATH
    sc.render.image_settings.file_format     = "FFMPEG"
    sc.render.ffmpeg.format                  = "MPEG4"
    sc.render.ffmpeg.codec                   = "H264"
    sc.render.ffmpeg.constant_rate_factor    = "HIGH"

def orbit_camera():
    """
    Remove any existing camera animation, then insert keyframes placing the
    camera on a circular arc around the panel.  A TrackTo constraint keeps
    the lens aimed at (0, 0, 0) throughout without manual rotation keyframes.
    """
    cam = bpy.context.scene.camera
    if cam is None:
        raise RuntimeError("No active camera — run blueprint.py first.")

    # Clear prior animation data
    cam.animation_data_clear()

    # TrackTo: camera always looks at world origin (panel centre)
    if "TrackPanel" not in [c.name for c in cam.constraints]:
        ct = cam.constraints.new("TRACK_TO")
        ct.name       = "TrackPanel"
        ct.target     = None   # track to world origin
        ct.track_axis = "TRACK_NEGATIVE_Z"
        ct.up_axis    = "UP_Y"
        # Point at world origin by creating an empty at (0,0,0)
        bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
        empty = bpy.context.active_object
        empty.name  = "PanelTarget"
        empty.hide_render = True
        ct.target = empty

    # Keyframe position along arc
    for frame in range(1, FRAMES + 1):
        t     = (frame - 1) / (FRAMES - 1)          # 0 → 1
        angle = math.radians(ARC_START + t * (ARC_END - ARC_START))
        x     = RADIUS * math.sin(angle)
        y     = -RADIUS * math.cos(angle)
        cam.location = (x, y, HEIGHT)
        cam.keyframe_insert("location", frame=frame)

def main():
    setup_offscreen_render()
    orbit_camera()

    os.makedirs(bpy.path.abspath(
        "//../../videos/shading/shader-automotive-paint-coat-metallic-flake/"
    ), exist_ok=True)

    bpy.ops.render.render(animation=True, write_still=False)
    print(f"Viewport recording written to: {OUT_PATH}")

main()

# ─────────────────────────────────────────────────────────────────────────────
# record.py — Viewport animation recording for the SCA Coral tutorial
# Outputs: public/library/videos/scripting/
#          python-numpy-space-colonisation-algorithm-branching-coral-webxr/
#          viewport.mp4
#
# Run AFTER blueprint.py has built the scene.
# Blender 5.1 · Python 3.11
# ─────────────────────────────────────────────────────────────────────────────

import bpy, math

# ── OUTPUT PATH ──────────────────────────────────────────────────────────────
VIDEO_OUT = (
    "//../../../../videos/scripting/"
    "python-numpy-space-colonisation-algorithm-branching-coral-webxr/"
    "viewport.mp4"
)

# ── SCENE SETTINGS ───────────────────────────────────────────────────────────
FRAME_START = 1
FRAME_END   = 150       # 5 s @ 30 fps — orbit reveals full coral crown
FPS         = 30
RES_X       = 1920
RES_Y       = 1080

# ── CAMERA RIG ───────────────────────────────────────────────────────────────

def setup_camera():
    """Orbit camera circling the coral at mid-crown height."""
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 50.0
    cam_obj       = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    return cam_obj


def add_orbit_keyframes(cam):
    """Full 360° orbit over 150 frames at radius 3.5 m, height 1.2 m."""
    R, H = 3.5, 1.2
    for f in range(FRAME_START, FRAME_END + 1):
        t     = (f - FRAME_START) / (FRAME_END - FRAME_START)
        angle = t * 2 * math.pi
        cam.location = (R * math.cos(angle), R * math.sin(angle), H)
        # Point camera toward coral centroid (approx 0,0,0.9)
        dx = -R * math.cos(angle)
        dy = -R * math.sin(angle)
        dz = 0.9 - H
        horiz = math.sqrt(dx**2 + dy**2)
        cam.rotation_euler = (
            math.atan2(-dz, horiz),
            0.0,
            math.atan2(-dx, dy) + math.pi,
        )
        cam.keyframe_insert("location",       frame=f)
        cam.keyframe_insert("rotation_euler", frame=f)


# ── LIGHTING ─────────────────────────────────────────────────────────────────

def setup_lighting():
    """Three-point rig that makes the emissive coral glow pop."""
    # Key: warm overhead
    key      = bpy.data.lights.new("Key", "POINT")
    key.energy = 400
    key.color  = (1.0, 0.9, 0.8)
    key_obj  = bpy.data.objects.new("Key", key)
    key_obj.location = (0, 0, 3.5)
    bpy.context.scene.collection.objects.link(key_obj)

    # Rim: cool blue from behind
    rim      = bpy.data.lights.new("Rim", "POINT")
    rim.energy = 200
    rim.color  = (0.4, 0.6, 1.0)
    rim_obj  = bpy.data.objects.new("Rim", rim)
    rim_obj.location = (0, -3, 1.5)
    bpy.context.scene.collection.objects.link(rim_obj)


# ── RENDER SETTINGS ──────────────────────────────────────────────────────────

def configure_render():
    sc = bpy.context.scene
    sc.frame_start = FRAME_START
    sc.frame_end   = FRAME_END
    sc.render.fps  = FPS

    sc.render.resolution_x    = RES_X
    sc.render.resolution_y    = RES_Y
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format   = "MPEG4"
    sc.render.ffmpeg.codec    = "H264"
    sc.render.ffmpeg.constant_rate_factor = "HIGH"
    sc.render.filepath        = VIDEO_OUT

    # EEVEE Next for fast emission + depth-of-field
    sc.render.engine                    = "BLENDER_EEVEE_NEXT"
    sc.eevee.taa_render_samples         = 32
    sc.eevee.use_bloom                  = True
    sc.eevee.bloom_threshold            = 0.8
    sc.eevee.bloom_intensity            = 0.4


# ── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    cam = setup_camera()
    add_orbit_keyframes(cam)
    setup_lighting()
    configure_render()

    print("[record] Rendering SCA coral viewport animation …")
    bpy.ops.render.render(animation=True)
    print(f"[record] Done → {VIDEO_OUT}")


main()

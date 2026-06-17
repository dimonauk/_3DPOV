"""
record.py — Viewport animation render for boid flock tutorial
Blender 5.1  ·  CC0  ·  Holoflow Studio

Run after blueprint.py has produced boid_flock.blend.
Renders 120 frames of EEVEE viewport animation (1280×720 WebP strip) then
calls ffmpeg to assemble into viewport.mp4 at the canonical output path.

Output: public/library/videos/geometry-nodes/gn-simulation-zone-boid-flock/viewport.mp4
"""

import bpy, os, subprocess, math

FRAME_START  = 1
FRAME_END    = 120
OUTPUT_RES   = (1280, 720)
FRAMES_DIR   = '/tmp/boid_frames/'
VIDEO_PATH   = 'public/library/videos/geometry-nodes/gn-simulation-zone-boid-flock/viewport.mp4'


def configure_render(scene):
    scene.render.engine         = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x   = OUTPUT_RES[0]
    scene.render.resolution_y   = OUTPUT_RES[1]
    scene.render.fps            = 25
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath       = FRAMES_DIR
    scene.frame_start           = FRAME_START
    scene.frame_end             = FRAME_END

    # EEVEE settings for boid glow.
    eevee = scene.eevee
    eevee.use_bloom             = True   # legacy toggle; ignored in EEVEE-Next
    eevee.bloom_intensity       = 0.5
    eevee.taa_render_samples    = 16


def build_camera(scene):
    if scene.camera:
        return
    bpy.ops.object.camera_add(location=(0, -14, 4))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(80), 0, 0)
    scene.camera = cam


def advance_simulation(scene):
    """Warm up the simulation cache frame by frame before rendering."""
    for f in range(1, FRAME_END + 1):
        scene.frame_set(f)
        bpy.context.view_layer.update()


def render_frames(scene):
    os.makedirs(FRAMES_DIR, exist_ok=True)
    bpy.ops.render.render(animation=True, write_still=False)


def assemble_video():
    repo_root = bpy.path.abspath('//')
    out_path  = os.path.join(repo_root, '..', '..', '..', '..', VIDEO_PATH)
    out_path  = os.path.normpath(out_path)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    cmd = [
        'ffmpeg', '-y',
        '-framerate', '25',
        '-i', os.path.join(FRAMES_DIR, '%04d.png'),
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-crf', '20',
        out_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print('[record] ffmpeg error:', result.stderr)
    else:
        print(f'[record] viewport.mp4 written → {out_path}')


def main():
    scene = bpy.context.scene
    build_camera(scene)
    configure_render(scene)
    advance_simulation(scene)
    render_frames(scene)
    assemble_video()


main()

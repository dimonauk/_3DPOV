"""
record.py — viewport animation render for ink_diagram
Blender 5.1  |  CC0

Run AFTER blueprint.py has built the scene.

Renders 90 PNG frames (the full build reveal) to a temp directory, then
prints the ffmpeg command to produce viewport.mp4 at 24 fps.
The settled state at frame 91-100 gives a clean freeze at the end.

Output: public/library/videos/grease-pencil/gp3-layer-modifier-build-reveal-animated-ink-diagram/
"""

import bpy, os

# ── output path ───────────────────────────────────────────────────────────────
BLEND_DIR   = os.path.dirname(bpy.data.filepath) if bpy.data.filepath else "/tmp"
VIDEO_SLUG  = "gp3-layer-modifier-build-reveal-animated-ink-diagram"
FRAMES_DIR  = os.path.join(
    BLEND_DIR, "..", "..", "..", "videos", "grease-pencil", VIDEO_SLUG, "frames"
)
os.makedirs(FRAMES_DIR, exist_ok=True)

# ── scene must already be loaded (run blueprint.py first) ────────────────────
scene = bpy.context.scene
if scene.name != "ink_diagram":
    raise RuntimeError("Run blueprint.py first — scene 'ink_diagram' not found.")

# ── render settings ───────────────────────────────────────────────────────────
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode  = 'RGBA'
scene.render.resolution_x  = 1280
scene.render.resolution_y  = 720
scene.render.resolution_percentage = 100

# render frames 1 → 100: build reveals 1-90, settled pose 91-100
scene.frame_start = 1
scene.frame_end   = 100

for fr in range(1, 101):
    scene.frame_set(fr)
    out = os.path.join(FRAMES_DIR, f"frame_{fr:04d}.png")
    scene.render.filepath = out
    bpy.ops.render.render(write_still=True)
    print(f"  rendered frame {fr:03d}/100")

# ffmpeg command to assemble viewport.mp4
mp4_path = os.path.join(
    BLEND_DIR, "..", "..", "..", "videos", "grease-pencil", VIDEO_SLUG, "viewport.mp4"
)
ffmpeg_cmd = (
    f"ffmpeg -y -framerate 24 "
    f"-i '{FRAMES_DIR}/frame_%04d.png' "
    f"-vframes 100 "
    f"-c:v libx264 -pix_fmt yuv420p -crf 18 "
    f"'{mp4_path}'"
)
print("\n── ffmpeg command ──────────────────────────────────────────")
print(ffmpeg_cmd)
print("────────────────────────────────────────────────────────────")
print("✓ record.py complete — run ffmpeg command above to produce viewport.mp4")

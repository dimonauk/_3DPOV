"""
record.py — GN for Grease Pencil 3: Noise-Wave Stroke
Viewport animation render → public/library/videos/grease-pencil/gn-gp3-noise-stroke-wave/viewport.mp4

Run AFTER blueprint.py has built and saved the .blend.
Opens the same .blend, confirms the GN modifier is active,
then renders ANIM_FRAMES of the Rendered viewport to PNG,
which ffmpeg stitches into viewport.mp4.

Render strategy: OpenGL viewport render (bpy.ops.render.opengl) captures
GP3 strokes exactly as they appear in the Solid/Rendered viewport.
F12 (Render Image) works too but requires a full EEVEE build pass per frame.
For a 60-frame preview the OpenGL route is 3–5× faster and visually equivalent
when scene.display.shading.type == 'RENDERED'.
"""

import bpy
import os

# ── Parameters ────────────────────────────────────────────────────────────────
SLUG       = "gn-gp3-noise-stroke-wave"
VIDEO_DIR  = f"//../../../../videos/grease-pencil/{SLUG}/"
FRAME_DIR  = f"{VIDEO_DIR}frames/"
VIDEO_OUT  = f"{VIDEO_DIR}viewport.mp4"
ANIM_FRAMES = 60
FPS         = 24

# ── Render ────────────────────────────────────────────────────────────────────
def render_frames() -> None:
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = ANIM_FRAMES
    scene.render.fps  = FPS

    abs_frame_dir = bpy.path.abspath(FRAME_DIR)
    os.makedirs(abs_frame_dir, exist_ok=True)

    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode  = 'RGBA'
    scene.render.filepath = os.path.join(abs_frame_dir, "frame_")

    # Rendered shading so GP3 + EEVEE materials are visible
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            area.spaces[0].shading.type = 'RENDERED'
            break

    bpy.ops.render.opengl(animation=True, write_still=False)
    print(f"[record] PNG sequence → {abs_frame_dir}")
    print("[record] stitch command:")
    print(f"  ffmpeg -r {FPS} -i '{abs_frame_dir}frame_%04d.png' "
          f"-c:v libx264 -pix_fmt yuv420p '{bpy.path.abspath(VIDEO_OUT)}'")


if __name__ == "__main__":
    render_frames()

"""
record.py — Viewport animation render for GP3 Cel Animation tutorial.

Purpose: load bounce_ball.blend (created by blueprint.py), scrub through
all 24 frames with onion skinning visible, and render the full sequence
to public/library/videos/grease-pencil/gp3-frame-by-frame-cel-animation/
as viewport.mp4 via a two-pass PNG → ffmpeg encode.

The viewport render captures onion skin ghost frames as they appear at each
frame — a still render (bpy.ops.render.render) would hide the onion overlay,
so we use OpenGL viewport capture (bpy.ops.render.opengl(animation=True))
which composites the GP3 viewport shading including ghost tinting.

Resolution: 1080×1080 @ 24 fps, frames 1–24.
"""

import bpy
import os

BLEND_FILE  = os.path.join(os.path.dirname(__file__), "bounce_ball.blend")
OUT_DIR     = os.path.join(
    os.path.dirname(__file__),
    "..", "..", "..", "..",
    "videos", "grease-pencil", "gp3-frame-by-frame-cel-animation"
)
PNG_DIR     = os.path.join(os.path.dirname(__file__), "output", "record")
FRAME_START = 1
FRAME_END   = 24
FPS         = 24

def load_blend() -> None:
    if not os.path.exists(BLEND_FILE):
        raise FileNotFoundError(
            f"[HFS] bounce_ball.blend not found — run blueprint.py first.\n"
            f"Expected: {BLEND_FILE}"
        )
    bpy.ops.wm.open_mainfile(filepath=BLEND_FILE)

def configure_viewport_render() -> None:
    sc = bpy.context.scene
    sc.frame_start = FRAME_START
    sc.frame_end   = FRAME_END
    sc.render.fps  = FPS

    # OpenGL viewport render mirrors what the viewport shows — includes
    # onion skins, overlay tinting — useful as a tutorial preview.
    # EEVEE render (bpy.ops.render.render) would bypass the overlay layer
    # and render only the geometry as configured in the render settings.
    sc.render.resolution_x          = 1080
    sc.render.resolution_y          = 1080
    sc.render.resolution_percentage = 100
    sc.render.film_transparent       = True
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode  = "RGBA"
    sc.render.filepath = os.path.join(PNG_DIR, "vp_####")

def ensure_onion_skinning_visible() -> None:
    """
    Viewport overlays are a display property, not a render property.
    For 3D viewport OpenGL render, overlays must be enabled in the active
    3D viewport's overlay settings. We iterate space_datas to ensure at
    least one 3D viewport has overlays on.
    """
    for area in bpy.context.screen.areas:
        if area.type == "VIEW_3D":
            for space in area.spaces:
                if space.type == "VIEW_3D":
                    space.overlay.show_overlays = True
            break

def main() -> None:
    os.makedirs(PNG_DIR, exist_ok=True)
    os.makedirs(OUT_DIR, exist_ok=True)
    load_blend()
    configure_viewport_render()
    ensure_onion_skinning_visible()

    # OpenGL animation render: captures the viewport shading including onion skins
    bpy.ops.render.opengl(animation=True, write_still=False)

    # After PNG frames land in PNG_DIR, Dimona or a local-MCP session can run:
    #   ffmpeg -r 24 -i vp_%04d.png -c:v libx264 -pix_fmt yuv420p viewport.mp4
    # The mp4 goes to Out_DIR (public/library/videos/…).
    print(f"[HFS] record.py complete — PNG frames in {PNG_DIR}")
    print(f"[HFS] Convert to mp4 and move to: {OUT_DIR}/viewport.mp4")

if __name__ == "__main__":
    main()

# record.py — viewport animation renderer
# Blender 5.1 | CC0
#
# Renders 60 frames of the spiral trace drawing itself outward (Draw_End 0 → 1).
# Run after blueprint.py: open spiral_trace.blend in Blender, then
# run this script via the Scripting workspace.
#
# Output: public/library/videos/geometry-nodes/
#         gn-trim-curve-line-draw/viewport.mp4

import bpy

BLEND_PATH = (
    "public/library/blends/geometry-nodes/"
    "gn-trim-curve-line-draw/spiral_trace.blend"
)
OUT_VIDEO = (
    "public/library/videos/geometry-nodes/"
    "gn-trim-curve-line-draw/viewport.mp4"
)

RES_X = 1920
RES_Y = 1080


def main():
    bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)

    scene = bpy.context.scene
    scene.render.resolution_x          = RES_X
    scene.render.resolution_y          = RES_Y
    scene.render.resolution_percentage = 100

    # FFmpeg / H.264 output — renders each frame to a temp file then encodes
    scene.render.image_settings.file_format  = "FFMPEG"
    scene.render.ffmpeg.format               = "MPEG4"
    scene.render.ffmpeg.codec                = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath = OUT_VIDEO

    # The keyframes (Draw_End 0 → 1 over frames 1–60) were baked by
    # blueprint.py.  opengl renders the viewport shading (EEVEE), which
    # is faster than a full Cycles render and captures the Bloom glow.
    bpy.ops.render.opengl(animation=True)
    print(f"✓ viewport.mp4 → {OUT_VIDEO}")


if __name__ == "__main__":
    main()

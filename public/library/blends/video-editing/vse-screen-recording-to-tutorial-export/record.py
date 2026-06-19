"""
record.py — Viewport preview render for the VSE tutorial entry.
Builds a synthetic VSE sequence (no external video file required) using only
Color strips and Text strips, then renders 150 frames (5 s) to
public/library/videos/video-editing/vse-screen-recording-to-tutorial-export/
as an image sequence that ffmpeg can stitch into viewport.mp4.

The output demonstrates what the title card and lower-third look like in the
final composite — useful before you have a real screen recording in place.
"""

import bpy
import os

# ── Config ───────────────────────────────────────────────────────────────────
SCENE_NAME   = "VSERecord"
FPS          = 30
RES_X        = 1920
RES_Y        = 1080
FRAME_COUNT  = 150   # 5 s

OUT_DIR = "//../../../../public/library/videos/video-editing/vse-screen-recording-to-tutorial-export/frames/"


# ── Build scene ──────────────────────────────────────────────────────────────
def build() -> None:
    scene = bpy.data.scenes.get(SCENE_NAME)
    if scene is None:
        bpy.ops.scene.new(type="NEW")
        scene = bpy.context.scene
        scene.name = SCENE_NAME

    bpy.context.window.scene = scene
    scene.render.fps            = FPS
    scene.render.resolution_x   = RES_X
    scene.render.resolution_y   = RES_Y
    scene.render.resolution_percentage = 100
    scene.frame_start           = 1
    scene.frame_end             = FRAME_COUNT
    scene.render.use_sequencer  = True
    scene.render.use_compositing = False
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath       = OUT_DIR

    if scene.sequence_editor is None:
        scene.sequence_editor_create()
    se = scene.sequence_editor

    for s in list(se.sequences_all):
        se.sequences.remove(s)

    # ── Background: dark studio colour ──────────────────────────────────────
    bg = se.sequences.new_effect(
        name="BG", type="COLOR", channel=1, frame_start=1, frame_end=FRAME_COUNT
    )
    bg.color = (0.04, 0.04, 0.06)

    # ── Accent bar (horizontal rule under title) ─────────────────────────────
    bar = se.sequences.new_effect(
        name="AccentBar", type="COLOR", channel=2, frame_start=20, frame_end=FRAME_COUNT
    )
    bar.color       = (0.45, 0.12, 0.72)   # Holoflow violet
    bar.transform.offset_y  = -0.06 * RES_Y   # pixel offset below centre

    # ── Title text ───────────────────────────────────────────────────────────
    title = se.sequences.new_effect(
        name="Title", type="TEXT", channel=3, frame_start=1, frame_end=FRAME_COUNT
    )
    title.text       = "VSE Screen-Recording → Tutorial Export"
    title.font_size  = 72
    title.color      = (1.0, 1.0, 1.0, 1.0)
    title.location   = (0.5, 0.58)
    title.align_x    = "CENTER"
    title.align_y    = "CENTER"
    title.use_shadow = True
    title.shadow_color = (0.0, 0.0, 0.0, 0.85)
    title.blend_type = "ALPHA_OVER"

    # ── Subtitle ─────────────────────────────────────────────────────────────
    sub = se.sequences.new_effect(
        name="Subtitle", type="TEXT", channel=4, frame_start=15, frame_end=FRAME_COUNT
    )
    sub.text      = "Blender 5.1 · Video Sequence Editor · Holoflow Studio"
    sub.font_size = 40
    sub.color     = (0.8, 0.75, 1.0, 1.0)   # soft violet tint
    sub.location  = (0.5, 0.44)
    sub.align_x   = "CENTER"
    sub.blend_type = "ALPHA_OVER"
    sub.use_shadow = True

    # ── Lower-third watermark ─────────────────────────────────────────────────
    lt = se.sequences.new_effect(
        name="LowerThird", type="TEXT", channel=5, frame_start=30, frame_end=FRAME_COUNT
    )
    lt.text       = "holoflow.co.uk  ·  CC0 tutorial library"
    lt.font_size  = 32
    lt.color      = (0.9, 0.9, 0.9, 0.85)
    lt.location   = (0.5, 0.07)
    lt.align_x    = "CENTER"
    lt.blend_type = "ALPHA_OVER"

    print(f"[record.py] VSE synthetic scene built: {FRAME_COUNT} frames.")
    print(f"[record.py] Run Ctrl+F12 (or bpy.ops.render.render(animation=True))")
    print(f"[record.py] Output PNG sequence → {OUT_DIR}")
    print("[record.py] Stitch to MP4:")
    print("  ffmpeg -framerate 30 -i frames/%04d.png -c:v libx264 -crf 22 viewport.mp4")


build()

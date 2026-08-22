"""
VSE Screen-Recording to Tutorial Export — Blender 5.1
======================================================
Technique: Blender's Video Sequence Editor (VSE) assembles raw screen-recording
clips, inserts title cards and lower-thirds via Text strips, applies per-strip
Color Balance correction for consistent colour across sessions, and renders to
an H.264/MP4 deliverable at 1080p/30fps — the complete post-production stage of
the Holoflow tutorial-recording pipeline.

The VSE operates on the scene's frame range; strips sit in numbered channels
(higher = on top). A movie strip carries a video clip; a text strip is a
procedural overlay; a color strip is a solid fill used for title-card
backgrounds. Color Balance modifiers attach to individual strips and run in the
sequencer's compositing order — not the node compositor.

Run this script from Blender's Text Editor with the desired scene active.
Swap PLACEHOLDER_VIDEO_PATH for the actual screen-recording .mp4 produced by
OBS or Xbox Game Bar.
"""

import bpy

# ── Parameters ──────────────────────────────────────────────────────────────
PLACEHOLDER_VIDEO_PATH = "//screen_recording.mp4"   # swap for real clip
SCENE_NAME             = "TutorialEdit"
FPS                    = 30
RESOLUTION_X           = 1920
RESOLUTION_Y           = 1080

INTRO_DURATION         = 90   # 3 s title card
CLIP_FRAME_START       = 91   # main recording begins after title
CLIP_FRAME_END         = 900  # adjust to actual clip length in frames

OUTRO_FRAME_START      = CLIP_FRAME_END + 1
OUTRO_DURATION         = 60   # 2 s outro card

TOTAL_FRAMES           = OUTRO_FRAME_START + OUTRO_DURATION

CHANNEL_TITLE_BG       = 1
CHANNEL_MAIN_VIDEO     = 2
CHANNEL_COLOUR_CORRECT = 3   # unused channel; correction via modifier on ch2
CHANNEL_LOWER_THIRD    = 4
CHANNEL_TITLE_TEXT     = 5

OUTPUT_DIR             = "//output/"
OUTPUT_FILENAME        = "tutorial_export"


# ── Scene setup ──────────────────────────────────────────────────────────────
def get_or_create_scene() -> bpy.types.Scene:
    if SCENE_NAME in bpy.data.scenes:
        return bpy.data.scenes[SCENE_NAME]
    bpy.ops.scene.new(type="NEW")
    scene = bpy.context.scene
    scene.name = SCENE_NAME
    return scene


def configure_scene(scene: bpy.types.Scene) -> None:
    scene.render.fps               = FPS
    scene.render.resolution_x      = RESOLUTION_X
    scene.render.resolution_y      = RESOLUTION_H = RESOLUTION_Y
    scene.render.resolution_percentage = 100
    scene.frame_start              = 1
    scene.frame_end                = TOTAL_FRAMES
    # Tell the renderer to use the sequencer output, not 3-D viewport.
    scene.render.use_sequencer     = True
    scene.render.use_compositing   = False   # compositor pass-through is off


# ── Output / codec ───────────────────────────────────────────────────────────
def configure_output(scene: bpy.types.Scene) -> None:
    r = scene.render
    r.filepath = OUTPUT_DIR + OUTPUT_FILENAME
    r.image_settings.file_format  = "FFMPEG"
    ff = r.ffmpeg
    ff.format                     = "MPEG4"
    ff.codec                      = "H264"
    ff.audio_codec                = "AAC"
    ff.audio_bitrate              = 192          # kbps — adequate for tutorial VO
    ff.constant_rate_factor       = "MEDIUM"     # CRF 23 equivalent; 'HIGH' = ~18
    ff.gopsize                    = 18           # keyframe every 0.6 s at 30fps
    # 'MEDIUM' CRF is fine for screen-recording content (high spatial frequency,
    # low motion). Use 'HIGH' if you need cleaner text legibility on dark UIs.


# ── Sequence Editor ──────────────────────────────────────────────────────────
def ensure_sequencer(scene: bpy.types.Scene) -> bpy.types.SequenceEditor:
    # scene.sequence_editor is None until explicitly created.
    if scene.sequence_editor is None:
        scene.sequence_editor_create()
    return scene.sequence_editor


def clear_sequences(se: bpy.types.SequenceEditor) -> None:
    for strip in list(se.sequences_all):
        se.sequences.remove(strip)


# ── Title card (frames 1–90) ─────────────────────────────────────────────────
def add_title_card(se: bpy.types.SequenceEditor) -> None:
    # Solid dark background for the title card.
    bg: bpy.types.ColorSequence = se.sequences.new_effect(
        name="TitleBG",
        type="COLOR",
        channel=CHANNEL_TITLE_BG,
        frame_start=1,
        frame_end=INTRO_DURATION,
    )
    bg.color = (0.05, 0.05, 0.07)   # near-black with slight blue tint

    # Title text strip — centred at 55% vertical height.
    title: bpy.types.TextSequence = se.sequences.new_effect(
        name="TitleText",
        type="TEXT",
        channel=CHANNEL_TITLE_TEXT,
        frame_start=1,
        frame_end=INTRO_DURATION,
    )
    title.text            = "VSE Tutorial Export\nHoloflow Studio"
    title.font_size       = 80
    title.color           = (1.0, 1.0, 1.0, 1.0)
    title.location[0]     = 0.5    # 0=left, 1=right
    title.location[1]     = 0.55
    title.align_x         = "CENTER"
    title.align_y         = "CENTER"
    title.use_shadow      = True
    title.shadow_color    = (0.0, 0.0, 0.0, 0.8)
    # Fade the title in over 15 frames (0.5 s).
    title.blend_type      = "ALPHA_OVER"
    title.blend_alpha     = 1.0

    # Subtitle.
    sub: bpy.types.TextSequence = se.sequences.new_effect(
        name="SubtitleText",
        type="TEXT",
        channel=CHANNEL_LOWER_THIRD,
        frame_start=20,                  # 20-frame delay for visual hierarchy
        frame_end=INTRO_DURATION,
    )
    sub.text        = "Blender 5.1 — Video Sequence Editor"
    sub.font_size   = 42
    sub.color       = (0.85, 0.85, 0.85, 1.0)
    sub.location[0] = 0.5
    sub.location[1] = 0.42
    sub.align_x     = "CENTER"
    sub.align_y     = "CENTER"
    sub.blend_type  = "ALPHA_OVER"


# ── Main clip (frames 91–900) ────────────────────────────────────────────────
def add_main_video(se: bpy.types.SequenceEditor) -> bpy.types.MovieSequence | None:
    try:
        clip: bpy.types.MovieSequence = se.sequences.new_movie(
            name="ScreenRecording",
            filepath=PLACEHOLDER_VIDEO_PATH,
            channel=CHANNEL_MAIN_VIDEO,
            frame_start=CLIP_FRAME_START,
        )
        clip.frame_final_end = CLIP_FRAME_END
        return clip
    except RuntimeError:
        # Path is a placeholder; no video file on disk — skip gracefully.
        # Dimona: replace PLACEHOLDER_VIDEO_PATH at top of script before running.
        print("[VSE blueprint] Skipping movie strip — placeholder path not found.")
        return None


# ── Color Balance modifier on main clip ─────────────────────────────────────
def add_colour_correction(clip: bpy.types.MovieSequence | None) -> None:
    if clip is None:
        return
    mod = clip.modifiers.new(name="ScreenColour", type="COLOR_BALANCE")
    # Screen recordings typically have elevated blacks from display gamma.
    # A small lift pull into lift/gamma/gain mode corrects this.
    mod.color_balance.lift  = (0.97, 0.97, 0.97)   # slightly pull down shadows
    mod.color_balance.gamma = (1.02, 1.01, 0.99)   # mild warm mid push
    mod.color_balance.gain  = (1.05, 1.03, 1.00)   # mild warm highlight push
    # correction_method defaults to 'LIFT_GAMMA_GAIN' — that is what we want here.
    # Switch to 'OFFSET_POWER_SLOPE' (ASC-CDL) if you have a CDL file from DaVinci.


# ── Lower-third identifier during main clip ──────────────────────────────────
def add_lower_third(se: bpy.types.SequenceEditor) -> None:
    lt: bpy.types.TextSequence = se.sequences.new_effect(
        name="LowerThird",
        type="TEXT",
        channel=CHANNEL_LOWER_THIRD,
        frame_start=CLIP_FRAME_START,
        frame_end=CLIP_FRAME_START + 150,    # visible for 5 s
    )
    lt.text         = "holoflow.co.uk"
    lt.font_size    = 36
    lt.color        = (1.0, 1.0, 1.0, 0.9)
    lt.location[0]  = 0.05   # left-aligned
    lt.location[1]  = 0.08   # near bottom
    lt.align_x      = "LEFT"
    lt.blend_type   = "ALPHA_OVER"
    lt.use_shadow   = True


# ── Outro card ───────────────────────────────────────────────────────────────
def add_outro(se: bpy.types.SequenceEditor) -> None:
    bg: bpy.types.ColorSequence = se.sequences.new_effect(
        name="OutroBG",
        type="COLOR",
        channel=CHANNEL_TITLE_BG,
        frame_start=OUTRO_FRAME_START,
        frame_end=OUTRO_FRAME_START + OUTRO_DURATION,
    )
    bg.color = (0.05, 0.05, 0.07)

    outro: bpy.types.TextSequence = se.sequences.new_effect(
        name="OutroText",
        type="TEXT",
        channel=CHANNEL_TITLE_TEXT,
        frame_start=OUTRO_FRAME_START,
        frame_end=OUTRO_FRAME_START + OUTRO_DURATION,
    )
    outro.text      = "holoflow.co.uk\nAll tutorials CC0"
    outro.font_size = 60
    outro.color     = (1.0, 1.0, 1.0, 1.0)
    outro.location  = (0.5, 0.5)
    outro.align_x   = "CENTER"
    outro.align_y   = "CENTER"
    outro.use_shadow = True


# ── Entry point ──────────────────────────────────────────────────────────────
def main() -> None:
    scene = get_or_create_scene()
    bpy.context.window.scene = scene

    configure_scene(scene)
    configure_output(scene)

    se = ensure_sequencer(scene)
    clear_sequences(se)

    add_title_card(se)
    clip = add_main_video(se)
    add_colour_correction(clip)
    add_lower_third(se)
    add_outro(se)

    scene.frame_set(1)
    print(f"[VSE blueprint] Scene '{SCENE_NAME}' ready. "
          f"{TOTAL_FRAMES} frames @ {FPS}fps "
          f"({TOTAL_FRAMES/FPS:.1f}s). "
          f"Output: {OUTPUT_DIR}{OUTPUT_FILENAME}.mp4")
    print("  Run 'bpy.ops.render.render(animation=True)' or Ctrl+F12 to export.")


main()

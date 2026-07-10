"""
Holoflow Blender 5.1 Blueprint
bpy.types.SequenceEditor — VSE Script-Based Tutorial Assembly

WHY this workflow?
  Blender's Video Sequence Editor Python API (bpy.types.SequenceEditor) lets a
  single script ingest the library's viewport.mp4 + screen.mp4 recordings, assemble
  a polished tutorial video with colour-graded clips, text overlays, cross-dissolve
  transitions, and title/outro cards, then export H.264 MP4 — entirely inside Blender.
  The assembly is deterministic and repeatable: re-run the script any time the source
  recordings change without touching a single strip by hand.

KEY API CONCEPTS:
  scene.sequence_editor_create()      — creates the SequenceEditor on a scene
  se.sequences.new_movie()            — adds an .mp4 / .mov clip strip
  se.sequences.new_effect(type='...')— adds COLOR, TEXT, GAMMA_CROSS, SPEED strips
  strip.modifiers.new(type='...')     — adds COLOR_BALANCE colour-grading modifier
  strip.blend_type                    — compositing mode for each strip
"""

import bpy
import json
import math
import os

# ── CONFIGURATION ─────────────────────────────────────────────────────────────
SLUG      = 'python-bpy-sequence-editor-vse-script-tutorial-assembly'
TOPIC     = 'video-editing'
LIB_BASE  = bpy.path.abspath('//')
VIDEO_DIR = os.path.join(LIB_BASE, 'public', 'library', 'videos', TOPIC, SLUG)
BLEND_DIR = os.path.join(LIB_BASE, 'public', 'library', 'blends', TOPIC, SLUG)

VIEWPORT_MP4 = os.path.join(VIDEO_DIR, 'viewport.mp4')
SCREEN_MP4   = os.path.join(VIDEO_DIR, 'screen.mp4')
OUTPUT_MP4   = os.path.join(VIDEO_DIR, 'tutorial_assembled.mp4')

FPS = 30
# Duration constants (frames)
TITLE_DUR   = 3 * FPS
DISSOLVE    = max(1, FPS // 2)   # 15-frame dissolve window
FALLBACK_DUR = 15 * FPS          # assume 15s if file is missing

# Holoflow palette  — matches cel-shaded site palette
BRAND_BG    = (0.07, 0.07, 0.09)
BRAND_PINK  = (1.00, 0.32, 0.55)
TEXT_WHITE  = (0.95, 0.95, 0.95, 1.0)
TEXT_GREY   = (0.55, 0.55, 0.60, 1.0)


# ── HELPERS ───────────────────────────────────────────────────────────────────

def get_or_create_scene(name: str) -> 'bpy.types.Scene':
    """Return existing scene by name or create a clean empty one."""
    if name in bpy.data.scenes:
        return bpy.data.scenes[name]
    # WHY type='EMPTY'?  'FULL_COPY' imports the current scene's objects into
    # the new one.  We want a clean VSE canvas with no geometry clutter.
    return bpy.data.scenes.new(name)


def movie_duration(filepath: str) -> int:
    """
    Probe an .mp4 duration by adding a temporary strip to an existing scene,
    reading frame_duration, then removing the strip.

    WHY not use ffprobe or os.popen?
      bpy.types.MovieSequence.frame_duration is filled from the container header
      by Blender's libav backend — the same value the VSE would use.  It avoids
      a subprocess dependency and works inside the Blender Python sandbox.

    GOTCHA: new_movie() succeeds even if the file is missing.  A missing file
      produces a strip whose frame_duration == 0.  The fallback handles that.
    """
    if not os.path.isfile(filepath):
        print(f'[holoflow-vse] WARN: not found: {filepath} — using fallback')
        return FALLBACK_DUR

    probe = bpy.data.scenes[0]
    if probe.sequence_editor is None:
        probe.sequence_editor_create()
    se = probe.sequence_editor
    tmp = se.sequences.new_movie(
        name='_probe_', filepath=filepath, channel=99, frame_start=1
    )
    dur = tmp.frame_duration
    se.sequences.remove(tmp)
    return dur if dur > 0 else FALLBACK_DUR


def setup_render(scene: 'bpy.types.Scene') -> None:
    """
    Configure H.264/MP4 render output on the assembly scene.
    CRF MEDIUM = perceptual quality preset (CRF ~23) — good quality, reasonable size.
    """
    scene.render.resolution_x              = 1920
    scene.render.resolution_y              = 1080
    scene.render.resolution_percentage     = 100
    scene.render.fps                       = FPS
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format             = 'MPEG4'
    scene.render.ffmpeg.codec              = 'H264'
    # WHY CRF not constant bitrate?  CRF adjusts QP per-frame to maintain
    # perceptual quality regardless of scene complexity.  A static bitrate
    # wastes bits on static title cards and starves action clips.
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.ffmpeg.ffmpeg_preset       = 'GOOD'
    scene.render.filepath                  = OUTPUT_MP4
    scene.render.use_file_extension        = False


def colour_grade(strip, lift=(1, 1, 1), gamma=(1, 1, 1), gain=(1, 1, 1)):
    """
    Add a COLOR_BALANCE modifier — the per-strip ASC CDL equivalent.

    Lift:  shadow anchor.  Raise to crush blacks less (more visible in dark scenes).
    Gamma: midtone pivot.  > 1 brightens mids; < 1 darkens.
    Gain:  highlight scale. Multiply on top of gamma — use for highlight recovery.

    For viewport-vs-screen matching:  viewport OpenGL renders often have
    stronger contrast.  Cool the shadows (lift R↑G↑B↑) and warm the mids
    (gamma R↑G= B↓) to match a neutral screen capture.
    """
    mod = strip.modifiers.new(name='colour_grade', type='COLOR_BALANCE')
    mod.color_balance.lift  = lift
    mod.color_balance.gamma = gamma
    mod.color_balance.gain  = gain
    return mod


# ── ASSEMBLY ──────────────────────────────────────────────────────────────────

def build_assembly(se: 'bpy.types.SequenceEditor',
                   scene: 'bpy.types.Scene') -> None:
    """
    Lay out all strips.  Channel plan:
      1 — main content (COLOR title, MOVIE clips, COLOR outro) — sequential
      2 — chapter-marker TEXT lower-thirds, subtitle TEXT
      3 — subtitle TEXT on title card
      4 — GAMMA_CROSS dissolve effects (require seq1 + seq2 overlap in time)

    GAMMA_CROSS vs CROSS:
      CROSS is a linear opacity ramp — perceptually uneven (dark midpoint).
      GAMMA_CROSS applies sqrt() to maintain perceived brightness through the
      dissolve.  Always prefer GAMMA_CROSS for live-action and screen recordings.

    CHANNEL STAGGERING for transitions:
      ch1 strips must OVERLAP by DISSOLVE frames for GAMMA_CROSS to work.
      Strategy: start clip_B at (clip_A.frame_final_end - DISSOLVE) so they
      share exactly DISSOLVE frames.  The GAMMA_CROSS effect strip covers
      [overlap_start, overlap_start + DISSOLVE].
    """
    cur = 1   # current frame cursor

    # ── Title card ─────────────────────────────────────────────────────────
    title_bg = se.sequences.new_effect(
        name='title_bg', type='COLOR',
        channel=1, frame_start=cur, frame_end=cur + TITLE_DUR - 1,
    )
    title_bg.color = BRAND_BG

    title_txt = se.sequences.new_effect(
        name='title_text', type='TEXT',
        channel=2, frame_start=cur, frame_end=cur + TITLE_DUR - 1,
    )
    title_txt.text       = 'VSE Script Assembly'
    title_txt.font_size  = 72
    title_txt.color      = TEXT_WHITE
    title_txt.location   = (0.5, 0.6)
    title_txt.align_x    = 'CENTER'
    title_txt.align_y    = 'CENTER'
    title_txt.use_shadow = True
    title_txt.shadow_color = (0.0, 0.0, 0.0, 0.75)

    sub_txt = se.sequences.new_effect(
        name='subtitle_text', type='TEXT',
        channel=3, frame_start=cur, frame_end=cur + TITLE_DUR - 1,
    )
    sub_txt.text     = 'Holoflow Studio  ·  Blender 5.1'
    sub_txt.font_size = 30
    sub_txt.color    = TEXT_GREY
    sub_txt.location = (0.5, 0.42)
    sub_txt.align_x  = 'CENTER'
    sub_txt.align_y  = 'CENTER'

    title_end = cur + TITLE_DUR
    cur       = title_end - DISSOLVE   # overlap window starts here

    # ── Viewport recording ─────────────────────────────────────────────────
    vp_dur = movie_duration(VIEWPORT_MP4)
    vp = se.sequences.new_movie(
        name='viewport_clip',
        filepath=VIEWPORT_MP4,
        channel=1,
        frame_start=cur,
    )
    # Viewport renders typically have stronger contrast than screen captures.
    # Slight shadow lift + mid warm keeps the cut from jarring.
    colour_grade(vp,
                 lift=(0.96, 0.96, 0.97),
                 gamma=(1.08, 1.04, 1.00),
                 gain=(1.00, 1.00, 1.00))

    se.sequences.new_effect(
        name='dissolve_title_vp', type='GAMMA_CROSS',
        channel=4,
        frame_start=cur, frame_end=cur + DISSOLVE - 1,
        seq1=title_bg, seq2=vp,
    )

    # Lower-third chapter marker — appears 1 s into the clip
    ch1_lbl = se.sequences.new_effect(
        name='ch1_label', type='TEXT',
        channel=2,
        frame_start=vp.frame_final_start + FPS,
        frame_end=vp.frame_final_start + 4 * FPS,
    )
    ch1_lbl.text      = '01 — Viewport Recording'
    ch1_lbl.font_size = 28
    ch1_lbl.color     = (*BRAND_PINK, 1.0)
    ch1_lbl.location  = (0.03, 0.06)
    ch1_lbl.align_x   = 'LEFT'
    ch1_lbl.align_y   = 'BOTTOM'

    vp_end = cur + vp_dur
    cur    = vp_end - DISSOLVE

    # ── Screen recording ───────────────────────────────────────────────────
    sc_dur = movie_duration(SCREEN_MP4)
    sc = se.sequences.new_movie(
        name='screen_clip',
        filepath=SCREEN_MP4,
        channel=1,
        frame_start=cur,
    )
    # Screen captures are already neutral; slight gamma crush to match viewport.
    colour_grade(sc,
                 lift=(1.00, 1.00, 1.00),
                 gamma=(0.96, 0.96, 0.96),
                 gain=(1.00, 1.00, 1.00))

    se.sequences.new_effect(
        name='dissolve_vp_sc', type='GAMMA_CROSS',
        channel=4,
        frame_start=cur, frame_end=cur + DISSOLVE - 1,
        seq1=vp, seq2=sc,
    )

    ch2_lbl = se.sequences.new_effect(
        name='ch2_label', type='TEXT',
        channel=2,
        frame_start=sc.frame_final_start + FPS,
        frame_end=sc.frame_final_start + 4 * FPS,
    )
    ch2_lbl.text      = '02 — Screen Recording'
    ch2_lbl.font_size = 28
    ch2_lbl.color     = (*BRAND_PINK, 1.0)
    ch2_lbl.location  = (0.03, 0.06)
    ch2_lbl.align_x   = 'LEFT'
    ch2_lbl.align_y   = 'BOTTOM'

    sc_end = cur + sc_dur
    cur    = sc_end - DISSOLVE

    # ── Outro card ─────────────────────────────────────────────────────────
    OUTRO_DUR = 4 * FPS
    outro = se.sequences.new_effect(
        name='outro_bg', type='COLOR',
        channel=1,
        frame_start=cur, frame_end=cur + OUTRO_DUR - 1,
    )
    outro.color = BRAND_BG

    se.sequences.new_effect(
        name='dissolve_sc_outro', type='GAMMA_CROSS',
        channel=4,
        frame_start=cur, frame_end=cur + DISSOLVE - 1,
        seq1=sc, seq2=outro,
    )

    outro_txt = se.sequences.new_effect(
        name='outro_text', type='TEXT',
        channel=2,
        frame_start=cur + DISSOLVE + FPS // 2,
        frame_end=cur + OUTRO_DUR - 1,
    )
    outro_txt.text     = 'holoflow.co.uk'
    outro_txt.font_size = 52
    outro_txt.color    = TEXT_WHITE
    outro_txt.location = (0.5, 0.5)
    outro_txt.align_x  = 'CENTER'
    outro_txt.align_y  = 'CENTER'

    scene.frame_end = cur + OUTRO_DUR
    print(f'[holoflow-vse] assembly: {scene.frame_end} frames '
          f'({scene.frame_end / FPS:.1f} s)  →  {OUTPUT_MP4}')


# ── MANIFEST ──────────────────────────────────────────────────────────────────

def write_manifest(total_frames: int) -> None:
    os.makedirs(BLEND_DIR, exist_ok=True)
    manifest = {
        'schema': 'holoflow-vse-assembly/1.0',
        'slug': SLUG,
        'fps': FPS,
        'total_frames': total_frames,
        'output': OUTPUT_MP4,
        'sources': {'viewport': VIEWPORT_MP4, 'screen': SCREEN_MP4},
    }
    path = os.path.join(BLEND_DIR, 'assembly_manifest.json')
    with open(path, 'w') as fh:
        json.dump(manifest, fh, indent=2)
    print(f'[holoflow-vse] manifest → {path}')


# ── MAIN ──────────────────────────────────────────────────────────────────────

def main() -> None:
    os.makedirs(VIDEO_DIR, exist_ok=True)

    scene = get_or_create_scene('holoflow_vse_assembly')
    setup_render(scene)
    scene.sequence_editor_create()
    se = scene.sequence_editor

    # Clear any previous strips so re-runs are idempotent
    for s in list(se.sequences):
        se.sequences.remove(s)

    build_assembly(se, scene)
    write_manifest(scene.frame_end)

    # WHY not render automatically?
    #   A 30-minute tutorial renders in real time (30 fps × 30 min = 54 000 frames
    #   of video decode + H.264 encode).  We prepare the scene so you can review
    #   the timeline in the VSE workspace before committing to a render.
    #   To render: switch to the VSE workspace, set the active scene to
    #   'holoflow_vse_assembly', then press Ctrl+F12.
    #   Or from script: bpy.ops.render.render(animation=True)
    print('[holoflow-vse] Scene ready.  Ctrl+F12 in VSE workspace to render.')


main()


# ── TROUBLESHOOTING ───────────────────────────────────────────────────────────
#
# 'ValueError: frame_start and frame_end must not overlap with other sequences'
#   Two strips share the same channel and their frame ranges intersect.
#   Blender 5.1 does not auto-shift strips.  Audit cur_frame arithmetic.
#
# 'GAMMA_CROSS: seq1 and seq2 must overlap in time'
#   The DISSOLVE window must fall inside both source strips.
#   Increase DISSOLVE or ensure clip_B starts before clip_A ends.
#
# 'strip.frame_duration == 0 after new_movie()'
#   File path does not exist or codec is unsupported.  Check VIDEO_DIR.
#
# 'TEXT strip invisible in render'
#   TEXT strips composite via ALPHA_OVER on top of lower channels.
#   Ensure text channel > backdrop channel.  Also check font_size > 0.
#
# 'Render output is silent black'
#   scene.use_sequencer must be True (default on new scenes — confirm
#   it wasn't accidentally set False).

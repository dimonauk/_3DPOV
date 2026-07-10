"""
holoflow_macros/vse_tutorial_assembler.py
Reusable macro: assemble a tutorial video from library viewport + screen recordings.

Usage (from blueprint.py or any Blender script):
    from holoflow_macros.vse_tutorial_assembler import assemble_tutorial
    assemble_tutorial(
        slug='python-bpy-sequence-editor-vse-script-tutorial-assembly',
        topic='video-editing',
        lib_base=bpy.path.abspath('//'),
    )

Blender 5.1 compatible. CC0.
"""

import bpy
import json
import os

FPS          = 30
DISSOLVE     = max(1, FPS // 2)
TITLE_DUR    = 3 * FPS
FALLBACK_DUR = 15 * FPS
BRAND_BG     = (0.07, 0.07, 0.09)
BRAND_PINK   = (1.00, 0.32, 0.55)
TEXT_WHITE   = (0.95, 0.95, 0.95, 1.0)
TEXT_GREY    = (0.55, 0.55, 0.60, 1.0)


def _movie_duration(filepath: str) -> int:
    if not os.path.isfile(filepath):
        return FALLBACK_DUR
    probe = bpy.data.scenes[0]
    if probe.sequence_editor is None:
        probe.sequence_editor_create()
    se  = probe.sequence_editor
    tmp = se.sequences.new_movie(
        name='_probe_', filepath=filepath, channel=99, frame_start=1
    )
    dur = tmp.frame_duration
    se.sequences.remove(tmp)
    return dur if dur > 0 else FALLBACK_DUR


def _colour_grade(strip, lift=(1, 1, 1), gamma=(1, 1, 1), gain=(1, 1, 1)):
    mod = strip.modifiers.new(name='colour_grade', type='COLOR_BALANCE')
    mod.color_balance.lift  = lift
    mod.color_balance.gamma = gamma
    mod.color_balance.gain  = gain
    return mod


def assemble_tutorial(slug: str, topic: str, lib_base: str,
                      title_text: str = '', render: bool = False) -> None:
    """
    Build a holoflow VSE assembly scene from a library entry's recordings.

    Parameters
    ----------
    slug        Library entry slug (used to locate viewport.mp4 / screen.mp4)
    topic       Library topic subfolder (e.g. 'video-editing', 'scripting')
    lib_base    Absolute path to the repo root (bpy.path.abspath('//'))
    title_text  Override title card text (defaults to slug)
    render      If True, render immediately via bpy.ops.render.render(animation=True)
    """
    video_dir = os.path.join(lib_base, 'public', 'library', 'videos', topic, slug)
    blend_dir = os.path.join(lib_base, 'public', 'library', 'blends', topic, slug)
    vp_path   = os.path.join(video_dir, 'viewport.mp4')
    sc_path   = os.path.join(video_dir, 'screen.mp4')
    out_path  = os.path.join(video_dir, 'tutorial_assembled.mp4')
    os.makedirs(video_dir, exist_ok=True)
    os.makedirs(blend_dir, exist_ok=True)

    scene_name = f'vse_{slug[:30]}'
    if scene_name in bpy.data.scenes:
        scene = bpy.data.scenes[scene_name]
    else:
        scene = bpy.data.scenes.new(scene_name)

    # Render config
    scene.render.resolution_x               = 1920
    scene.render.resolution_y               = 1080
    scene.render.resolution_percentage      = 100
    scene.render.fps                        = FPS
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.filepath                   = out_path
    scene.render.use_file_extension         = False

    scene.sequence_editor_create()
    se = scene.sequence_editor
    for s in list(se.sequences):
        se.sequences.remove(s)

    cur = 1
    title_label = title_text or slug.replace('-', ' ').title()

    # Title card
    bg = se.sequences.new_effect(
        name='title_bg', type='COLOR',
        channel=1, frame_start=cur, frame_end=cur + TITLE_DUR - 1,
    )
    bg.color = BRAND_BG

    tt = se.sequences.new_effect(
        name='title_text', type='TEXT',
        channel=2, frame_start=cur, frame_end=cur + TITLE_DUR - 1,
    )
    tt.text = title_label[:60]
    tt.font_size = 64
    tt.color = TEXT_WHITE
    tt.location = (0.5, 0.55)
    tt.align_x = 'CENTER'
    tt.align_y = 'CENTER'
    tt.use_shadow = True
    tt.shadow_color = (0.0, 0.0, 0.0, 0.8)

    title_end = cur + TITLE_DUR
    cur       = title_end - DISSOLVE

    # Viewport clip
    vp_dur = _movie_duration(vp_path)
    vp = se.sequences.new_movie(
        name='viewport_clip', filepath=vp_path, channel=1, frame_start=cur,
    )
    _colour_grade(vp, lift=(0.96, 0.96, 0.97), gamma=(1.08, 1.04, 1.00))
    se.sequences.new_effect(
        name='dissolve_title_vp', type='GAMMA_CROSS',
        channel=4, frame_start=cur, frame_end=cur + DISSOLVE - 1,
        seq1=bg, seq2=vp,
    )
    cur += vp_dur - DISSOLVE

    # Screen clip
    sc_dur = _movie_duration(sc_path)
    sc = se.sequences.new_movie(
        name='screen_clip', filepath=sc_path, channel=1, frame_start=cur,
    )
    _colour_grade(sc, gamma=(0.96, 0.96, 0.96))
    se.sequences.new_effect(
        name='dissolve_vp_sc', type='GAMMA_CROSS',
        channel=4, frame_start=cur, frame_end=cur + DISSOLVE - 1,
        seq1=vp, seq2=sc,
    )
    cur += sc_dur - DISSOLVE

    # Outro
    OUTRO = 4 * FPS
    outro = se.sequences.new_effect(
        name='outro_bg', type='COLOR',
        channel=1, frame_start=cur, frame_end=cur + OUTRO - 1,
    )
    outro.color = BRAND_BG
    se.sequences.new_effect(
        name='dissolve_sc_outro', type='GAMMA_CROSS',
        channel=4, frame_start=cur, frame_end=cur + DISSOLVE - 1,
        seq1=sc, seq2=outro,
    )
    outro_txt = se.sequences.new_effect(
        name='outro_url', type='TEXT',
        channel=2, frame_start=cur + DISSOLVE, frame_end=cur + OUTRO - 1,
    )
    outro_txt.text = 'holoflow.co.uk'
    outro_txt.font_size = 52
    outro_txt.color = TEXT_WHITE
    outro_txt.location = (0.5, 0.5)
    outro_txt.align_x = 'CENTER'
    outro_txt.align_y = 'CENTER'
    scene.frame_end = cur + OUTRO

    # Manifest
    manifest = {
        'schema': 'holoflow-vse-assembly/1.0', 'slug': slug,
        'fps': FPS, 'total_frames': scene.frame_end, 'output': out_path,
        'sources': {'viewport': vp_path, 'screen': sc_path},
    }
    with open(os.path.join(blend_dir, 'assembly_manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=2)

    print(f'[holoflow-vse-macro] {slug}: {scene.frame_end} frames → {out_path}')

    if render:
        bpy.context.window.scene = scene
        bpy.ops.render.render(animation=True)

import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&rsquo;s Video Sequence Editor is best known as a hands-on
        drag-and-drop timeline, but its Python API &mdash;{" "}
        <code>bpy.types.SequenceEditor</code> and the{" "}
        <code>se.sequences.*</code> factory methods &mdash; exposes every strip
        operation as a scriptable call. A single script can ingest the{" "}
        <code>viewport.mp4</code> and <code>screen.mp4</code> files this
        library produces for every tutorial entry, assemble them with
        title-card colour strips, text overlays, and perceptually correct
        GAMMA_CROSS dissolves, apply per-clip ASC CDL colour grading, and
        write a full H.264 MP4 &mdash; without touching a single strip by
        hand. Re-run after re-recording one clip and the timeline rebuilds
        itself with correct timings. That determinism is the point.
      </p>

      <p>
        The critical geometry of the VSE Python API is <em>channels</em>.
        Strips on higher channel numbers composite on top of lower ones, so
        channel 1 is the base layer and channel 4 sits nearest the viewer.
        Effect strips such as{" "}
        <code>GAMMA_CROSS</code> are placed on a channel above both their
        source strips and require the two sources to <em>overlap in time</em>.
        That overlap must be engineered deliberately: start{" "}
        <code>clip_B</code> <code>DISSOLVE</code> frames before{" "}
        <code>clip_A</code> ends, then place the effect strip across exactly
        that window. Blender 5.1 does not auto-shift strips when a channel
        collision occurs &mdash; it raises a <code>ValueError</code> silently
        in older builds and throws in 5.1. The blueprint calculates every{" "}
        <code>frame_start</code> arithmetically from a running{" "}
        <code>cur</code> cursor for this reason.
      </p>

      <p>
        The colour-grading step illustrates the difference between{" "}
        <code>COLOR_BALANCE</code> and Curves modifiers. COLOR_BALANCE maps
        directly to the ASC CDL standard: <em>lift</em> is the shadow anchor
        (raise it to prevent blacks from crushing), <em>gamma</em> is the
        midtone pivot (above 1.0 brightens; below darkens), and{" "}
        <em>gain</em> is the highlight scalar. This tutorial uses a small lift
        + warm-gamma recipe on the viewport clip to match the neutral screen
        capture &mdash; without it, cutting between an OpenGL render and a
        desktop recording produces a jarring luminance jump. The{" "}
        <Link
          href="/tutorials/blender-tutorial-vse-screen-recording-to-tutorial-export"
          className={lk}
        >
          VSE screen-recording export tutorial
        </Link>{" "}
        covers the manual equivalent of these grading steps for reference. For
        the export codec choice, the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-render-engine-webxr-snapshot"
          className={lk}
        >
          custom render engine tutorial
        </Link>{" "}
        explains why CRF (constant rate factor) beats a fixed bitrate for
        tutorial content with a mix of static title cards and fast-moving
        viewport action.
      </p>

      <p>
        The <code>get_movie_duration()</code> helper demonstrates a lesser-known
        pattern: adding a temporary strip to an already-existing scene&rsquo;s
        sequence editor, reading <code>strip.frame_duration</code>, then
        removing the strip. This avoids spawning an ffprobe subprocess and
        works correctly inside the Blender Python sandbox. The key gotcha is
        that <code>new_movie()</code> <em>succeeds even when the source file
        does not exist</em> &mdash; a missing file produces a strip whose{" "}
        <code>frame_duration</code> is 0. The blueprint falls back to a
        configurable default so the assembly scene is always valid even during
        development before the recordings exist. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-modal-progress-bar-cancel-long-operation"
          className={lk}
        >
          progress-bar operator tutorial
        </Link>{" "}
        shows the same defensive pattern for long batch operations, and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          batch GLB exporter
        </Link>{" "}
        demonstrates how this assembled tutorial video fits into a broader
        per-entry output pipeline alongside the GLB and blend files.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "one evening",
    difficulty: "advanced",
    cost: "free",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    supplies: {
      materials: [
        {
          name: "viewport.mp4",
          note: "Output of record.py from any library entry",
        },
        {
          name: "screen.mp4",
          note: "OBS screen capture per SCREEN-RECORDING-NOTES.md",
        },
      ],
      tools: [],
    },
    steps: [
      {
        title: "Understand the SequenceEditor object model",
        body: "# Every scene carries exactly one optional SequenceEditor.\n# It is created lazily — it does not exist on new scenes by default.\n\nimport bpy\n\nscene = bpy.data.scenes.new('demo_vse')\nprint(scene.sequence_editor)  # None\n\nscene.sequence_editor_create()\nse = scene.sequence_editor\nprint(type(se))  # <class 'bpy.types.SequenceEditor'>\n\n# se.sequences is a SequenceElements collection — the strip container.\n# Every new_*() method on it returns the created strip immediately.\n# Strip types: MovieSequence, ImageSequence, ColorSequence,\n#   TextSequence, SoundSequence, MetaSequence, and all effect types.\nprint(len(se.sequences))  # 0\n\n# WHY create a dedicated scene for VSE assembly?\n#   Mixing strips and 3-D scene geometry in one scene causes the\n#   strip editor to appear in the same render pass as the viewport.\n#   A separate assembly scene keeps the render path clean.\n#\n#   'EMPTY' type prevents the new scene from importing the current\n#   scene's objects (which 'FULL_COPY' would do).",
      },
      {
        title: "Probe movie duration without ffprobe",
        body: "import bpy, os\n\ndef movie_duration(filepath: str, fallback: int = 450) -> int:\n    \"\"\"\n    Read clip duration (frames) via a throwaway sequence strip.\n    GOTCHA: new_movie() succeeds on missing files — frame_duration is 0.\n    \"\"\"\n    if not os.path.isfile(filepath):\n        print(f'WARN: {filepath} not found — using fallback')\n        return fallback\n\n    # WHY use scenes[0] as probe scene?\n    #   Any existing scene with a sequence_editor works.\n    #   We avoid creating yet another scene for a one-shot measurement.\n    probe = bpy.data.scenes[0]\n    if probe.sequence_editor is None:\n        probe.sequence_editor_create()\n    se = probe.sequence_editor\n\n    # channel=99 — far above any real strip; avoids channel collision\n    tmp = se.sequences.new_movie(\n        name='_probe_', filepath=filepath, channel=99, frame_start=1\n    )\n    dur = tmp.frame_duration   # 0 if file missing or codec unsupported\n    se.sequences.remove(tmp)\n    return dur if dur > 0 else fallback\n\n# Test\nvp_path = bpy.path.abspath('//public/library/videos/video-editing/'\n    'python-bpy-sequence-editor-vse-script-tutorial-assembly/viewport.mp4')\nprint('Duration:', movie_duration(vp_path), 'frames')\n\n# TROUBLESHOOTING:\n#   'frame_duration == 0 on a file that exists':\n#     Blender cannot decode the codec.  Ensure the .mp4 uses H.264,\n#     not AV1 or HEVC — both are not reliably decoded by libav in all builds.",
      },
      {
        title: "Build the title card — COLOR strip + TEXT overlays",
        body: "import bpy\n\nFPS         = 30\nTITLE_DUR   = 3 * FPS\nBRAND_BG    = (0.07, 0.07, 0.09)\nTEXT_WHITE  = (0.95, 0.95, 0.95, 1.0)\nTEXT_GREY   = (0.55, 0.55, 0.60, 1.0)\n\nscene = bpy.data.scenes.new('title_demo')\nscene.sequence_editor_create()\nse = scene.sequence_editor\ncur = 1\n\ntitle_bg = se.sequences.new_effect(\n    name='title_bg',\n    type='COLOR',\n    channel=1,\n    frame_start=cur,\n    frame_end=cur + TITLE_DUR - 1,\n)\ntitle_bg.color = BRAND_BG   # RGB 3-tuple, NOT 4-tuple\n\ntitle_txt = se.sequences.new_effect(\n    name='title_text',\n    type='TEXT',\n    channel=2,                      # above the background\n    frame_start=cur,\n    frame_end=cur + TITLE_DUR - 1,\n)\ntitle_txt.text        = 'VSE Script Assembly'\ntitle_txt.font_size   = 72\ntitle_txt.color       = TEXT_WHITE\ntitle_txt.location    = (0.5, 0.6)  # normalised screen coords [0,1]\ntitle_txt.align_x     = 'CENTER'\ntitle_txt.align_y     = 'CENTER'\ntitle_txt.use_shadow  = True\ntitle_txt.shadow_color = (0.0, 0.0, 0.0, 0.75)\n\nsubtitle = se.sequences.new_effect(\n    name='subtitle',\n    type='TEXT',\n    channel=3,\n    frame_start=cur,\n    frame_end=cur + TITLE_DUR - 1,\n)\nsubtitle.text      = 'Holoflow Studio  ·  Blender 5.1'\nsubtitle.font_size = 30\nsubtitle.color     = TEXT_GREY\nsubtitle.location  = (0.5, 0.42)\nsubtitle.align_x   = 'CENTER'\nsubtitle.align_y   = 'CENTER'\n\nprint('Strips:', [s.name for s in se.sequences])\n\n# KEY NOTE: COLOR strip .color is a 3-tuple (R,G,B).\n# TEXT strip .color is a 4-tuple (R,G,B,A).\n# Mixing these up raises a TypeError.",
      },
      {
        title:
          "Add movie clips with COLOR_BALANCE colour grading",
        body: "import bpy, os\n\nVIDEO_DIR = bpy.path.abspath('//public/library/videos/video-editing/'\n    'python-bpy-sequence-editor-vse-script-tutorial-assembly/')\n\ndef colour_grade(strip, lift=(1,1,1), gamma=(1,1,1), gain=(1,1,1)):\n    \"\"\"\n    ASC CDL colour grade on a single strip.\n    Lift:  shadow anchor   — raise to prevent black crush\n    Gamma: midtone pivot   — >1 brightens, <1 darkens\n    Gain:  highlight scale — final highlight multiplier\n    \"\"\"\n    mod = strip.modifiers.new(name='colour_grade', type='COLOR_BALANCE')\n    # Each of lift/gamma/gain is a 3-element RGB tuple\n    mod.color_balance.lift  = lift\n    mod.color_balance.gamma = gamma\n    mod.color_balance.gain  = gain\n    return mod\n\nscene = bpy.data.scenes.new('clip_demo')\nscene.sequence_editor_create()\nse = scene.sequence_editor\n\nvp_path = os.path.join(VIDEO_DIR, 'viewport.mp4')\nvp = se.sequences.new_movie(\n    name='viewport_clip',\n    filepath=vp_path,\n    channel=1,\n    frame_start=1,\n)\n# Viewport OpenGL renders have higher contrast than screen captures.\n# Cool lift + warm gamma matches them perceptually.\ncolour_grade(vp,\n             lift=(0.96, 0.96, 0.97),\n             gamma=(1.08, 1.04, 1.00),\n             gain=(1.00, 1.00, 1.00))\n\nsc_path = os.path.join(VIDEO_DIR, 'screen.mp4')\nsc = se.sequences.new_movie(\n    name='screen_clip',\n    filepath=sc_path,\n    channel=1,\n    frame_start=1,   # will be adjusted in full assembly\n)\ncolour_grade(sc,\n             lift=(1.00, 1.00, 1.00),\n             gamma=(0.96, 0.96, 0.96),\n             gain=(1.00, 1.00, 1.00))\n\n# WHY not use the Curves modifier instead?\n#   Curves give precise per-channel control but the keyframe representation\n#   is a CurveMapping, not intuitive RGB triples.  COLOR_BALANCE aligns\n#   with the ASC CDL vocabulary used by DaVinci Resolve and professional\n#   colourists, making it easier to port grades across tools.",
      },
      {
        title:
          "Add GAMMA_CROSS dissolve transitions with channel staggering",
        body: "import bpy\n\nFPS     = 30\nDISSOLVE = FPS // 2   # 15-frame = 0.5 s overlap\n\nscene = bpy.data.scenes.new('dissolve_demo')\nscene.sequence_editor_create()\nse = scene.sequence_editor\n\n# Simulate two sequential clips that must dissolve.\n# They must overlap by DISSOLVE frames for GAMMA_CROSS to work.\nclip_a = se.sequences.new_effect(\n    name='clip_a', type='COLOR',\n    channel=1, frame_start=1, frame_end=90,\n)\nclip_a.color = (0.2, 0.45, 0.85)   # blue\n\n# clip_b starts DISSOLVE frames before clip_a ends — creating the overlap\noverlap_start = 90 - DISSOLVE + 1\nclip_b = se.sequences.new_effect(\n    name='clip_b', type='COLOR',\n    channel=1, frame_start=overlap_start, frame_end=overlap_start + 90,\n)\nclip_b.color = (0.85, 0.50, 0.20)  # orange\n\n# GAMMA_CROSS goes on channel 4 (above both sources)\n# seq1, seq2 must be provided; channel must be > both source channels.\n# WHY GAMMA_CROSS not CROSS?\n#   CROSS is a linear alpha ramp.  At 50% blend, the perceived brightness\n#   is ~70% of either source (gamma darkening).  GAMMA_CROSS applies sqrt()\n#   to maintain constant perceived luminance through the dissolve.\ndissolve = se.sequences.new_effect(\n    name='dissolve_a_b',\n    type='GAMMA_CROSS',\n    channel=4,\n    frame_start=overlap_start,\n    frame_end=overlap_start + DISSOLVE - 1,\n    seq1=clip_a,\n    seq2=clip_b,\n)\n\nprint(f'Dissolve: frames {dissolve.frame_start}–{dissolve.frame_final_end}')\nprint(f'Overlap verified: clip_a end={clip_a.frame_final_end}, '\n      f'clip_b start={clip_b.frame_final_start}')\n\n# TROUBLESHOOTING:\n#   'ValueError: sequence does not overlap':\n#     clip_b.frame_start must be < clip_a.frame_final_end.\n#     Increase DISSOLVE or move clip_b earlier.",
      },
      {
        title:
          "Set up H.264 render and write the assembly manifest",
        body: "import bpy, json, os\n\nSLUG      = 'python-bpy-sequence-editor-vse-script-tutorial-assembly'\nVIDEO_DIR = bpy.path.abspath(f'//public/library/videos/video-editing/{SLUG}/')\nOUTPUT    = os.path.join(VIDEO_DIR, 'tutorial_assembled.mp4')\nFPS       = 30\n\nscene = bpy.data.scenes['holoflow_vse_assembly']  # created by blueprint.py\n\n# ── Render settings ──────────────────────────────────────────────────────\nscene.render.resolution_x                   = 1920\nscene.render.resolution_y                   = 1080\nscene.render.resolution_percentage          = 100\nscene.render.fps                            = FPS\nscene.render.image_settings.file_format     = 'FFMPEG'\nscene.render.ffmpeg.format                  = 'MPEG4'\nscene.render.ffmpeg.codec                   = 'H264'\n# CRF MEDIUM = CRF 23 (x264 default) — good quality, ~2-4 Mbps typical\nscene.render.ffmpeg.constant_rate_factor    = 'MEDIUM'\nscene.render.ffmpeg.ffmpeg_preset           = 'GOOD'\nscene.render.filepath                       = OUTPUT\nscene.render.use_file_extension             = False   # path already has .mp4\n\n# ── Assembly manifest ────────────────────────────────────────────────────\nblend_dir = bpy.path.abspath(f'//public/library/blends/video-editing/{SLUG}/')\nmanifest = {\n    'schema':       'holoflow-vse-assembly/1.0',\n    'slug':         SLUG,\n    'fps':          FPS,\n    'total_frames': scene.frame_end,\n    'output':       OUTPUT,\n    'sources': {\n        'viewport': os.path.join(VIDEO_DIR, 'viewport.mp4'),\n        'screen':   os.path.join(VIDEO_DIR, 'screen.mp4'),\n    },\n}\nos.makedirs(blend_dir, exist_ok=True)\nwith open(os.path.join(blend_dir, 'assembly_manifest.json'), 'w') as f:\n    json.dump(manifest, f, indent=2)\nprint('Manifest written')\n\n# ── Render (optional — usually press Ctrl+F12 in the VSE workspace) ──────\n# bpy.context.window.scene = scene\n# bpy.ops.render.render(animation=True)\n#\n# WHY not render automatically?\n#   A 3-minute tutorial takes ~3 minutes of H.264 encode.  Calling render()\n#   inside the script blocks the UI thread.  Reviewing the strip layout in\n#   the VSE workspace first is always safer before committing to a render.",
      },
    ],
  },
  {
    slug: "blender-tutorial-python-bpy-sequence-editor-vse-script-tutorial-assembly",
    title:
      "Python bpy.types.SequenceEditor — VSE Script-Based Tutorial Assembly from Viewport Recordings",
    date: "2026-07-10",
    kind: "tutorial",
    excerpt:
      "Script Blender's Video Sequence Editor to ingest viewport.mp4 + screen.mp4 recordings and assemble a polished tutorial video with text overlays, GAMMA_CROSS dissolves, and ASC CDL colour grading — entirely via the Python API.",
    Body,
  }
);

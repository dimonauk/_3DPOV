import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function VseScreenRecordingBody() {
  return (
    <>
      <p>
        Blender&apos;s Video Sequence Editor (VSE) is a non-linear editor
        that sits inside the same application as your 3-D scene: strips live
        in numbered channels (higher channel = rendered on top), the frame
        range is the same timeline used by the animation system, and the
        render pipeline simply substitutes the VSE composite for the 3-D
        viewport output when{" "}
        <code>scene.render.use_sequencer = True</code>. The practical
        consequence is that a single Blender project can contain both the 3-D
        assets <em>and</em> the edit of the tutorial that explains those
        assets — which is exactly how the Holoflow recording pipeline
        closes the loop. The{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-camera-rig-dolly-focus-pull"
          className={lk}
        >
          camera-rig dolly tutorial
        </Link>{" "}
        describes how to set up and record a smooth 3-D viewport animation;
        this entry covers what happens <em>after</em> the OBS recording
        lands on disk — how to cut it, colour-correct it, stamp a title
        card over it, and export it as a web-ready MP4.
      </p>

      <p>
        A VSE strip carries one of several <em>types</em>: Movie (an
        external video file), Sound (an audio file), Color (a solid fill
        generated at render time), Text (a procedural text overlay), Image
        (a still), or Effect (a blend or speed operation between two
        existing strips). The{" "}
        <strong>Color strip</strong> is the correct primitive for a title-card
        background because it has zero disk dependency and renders
        deterministically across machines. The{" "}
        <strong>Text strip</strong> generates anti-aliased type without
        requiring an image asset — it respects the scene&apos;s frame
        dimensions and can carry its own alpha-blend mode, shadow, and
        box-background. Both are created through{" "}
        <code>se.sequences.new_effect(type=&apos;COLOR&apos;)</code> and{" "}
        <code>se.sequences.new_effect(type=&apos;TEXT&apos;)</code>
        respectively. The main screen-recording clip uses{" "}
        <code>se.sequences.new_movie(filepath=...)</code> — this is a
        direct-access wrapper around the FFMPEG demuxer; Blender does not
        re-encode the clip until the final render, so scrubbing is nearly
        instant on H.264 source material. Compare this approach with the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-color-grading-rgb-curves-cdl"
          className={lk}
        >
          node-compositor colour-grading pipeline
        </Link>
        , which works on rendered EXR frames: the compositor colour pipeline
        is more precise (scene-linear, AOV-driven) but requires a completed
        3-D render; the VSE pipeline works directly on the captured video
        and is the appropriate tool for post-processing screen recordings.
      </p>

      <p>
        <strong>Color Balance modifiers</strong> attach to individual strips
        via <code>strip.modifiers.new(name, type=&apos;COLOR_BALANCE&apos;)</code>
        and run inside the sequencer compositing pass — they do not involve
        the node compositor. The default mode is{" "}
        <code>LIFT_GAMMA_GAIN</code>. The mild warm-tone correction applied to
        the screen-recording clip (<code>gain=(1.05, 1.03, 1.00)</code>) pushes
        the image away from the greenish-cool cast that display-referred
        sRGB screen captures tend to have. This is less mathematically formal
        than the ASC-CDL Offset/Power/Slope pipeline in the compositor (no
        physical light model is in play — the source is already display-encoded)
        but it is the right tool for this material. If you have a CDL file
        exported from DaVinci Resolve, switch the modifier&apos;s{" "}
        <code>correction_method</code> to{" "}
        <code>&apos;OFFSET_POWER_SLOPE&apos;</code> and paste the values
        directly. The{" "}
        <Link
          href="/tutorials/blender-tutorial-freestyle-npr-line-rendering"
          className={lk}
        >
          Freestyle NPR line-rendering tutorial
        </Link>{" "}
        demonstrates how render-side colour decisions (background tint,
        line colour) affect what the screen capture looks like before the VSE
        correction — designing the 3-D scene with the VSE pass in mind saves
        correction work downstream.
      </p>

      <p>
        The <strong>render output</strong> is configured for H.264 inside an
        MP4 container with AAC audio, at CRF Medium (≈ CRF 23). For
        screen-recording content — which has high spatial frequency (crisp UI
        text, hard edges) and generally low motion — CRF 23 is borderline
        adequate; switch to <code>&apos;HIGH&apos;</code> (≈ CRF 18) if text
        legibility suffers. The keyframe interval (<code>ff.gopsize = 18</code>
        at 30 fps = one keyframe every 0.6 s) ensures web players can seek
        to any point within 0.6 s of accuracy, which is acceptable for a
        tutorial. Longer GOPs reduce file size but break scrubbing in
        embedded players. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          batch GLB exporter
        </Link>{" "}
        uses a similar approach to output configuration: named constants at
        the top of the script, a single entry-point function that wires
        everything, and no direct use of{" "}
        <code>bpy.ops</code> where the data API suffices.
      </p>

      <p>
        <strong>Outside sources.</strong>{" "}
        The Blender VSE manual (CC-BY-SA-4.0, Blender Foundation) documents
        the full strip type catalogue, modifier system, and retiming handles
        at{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/video_editing/"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org/manual/en/latest/video_editing/
        </a>
        ; the Python API reference for{" "}
        <code>bpy.types.SequenceEditor</code> (also CC-BY-SA-4.0) lives at{" "}
        <a
          href="https://docs.blender.org/api/current/bpy.types.SequenceEditor.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org/api/current/bpy.types.SequenceEditor.html
        </a>
        .{" "}
        <strong>OpenTimelineIO</strong> (Apache-2.0, Pixar / Academy Software
        Foundation) is the open interchange format for editorial timelines —
        the VSE&apos;s channel/strip model maps cleanly to OTIO&apos;s
        Track/Clip model, and tooling exists to round-trip between the two at{" "}
        <a
          href="https://github.com/AcademySoftwareFoundation/OpenTimelineIO"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/AcademySoftwareFoundation/OpenTimelineIO
        </a>
        . Sibling ASWF projects include OpenColorIO (Apache-2.0), OpenEXR
        (BSD-3-Clause), and MaterialX (Apache-2.0).
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-vse-screen-recording-to-tutorial-export",
  title:
    "VSE — Screen-Recording to Published Tutorial: Strip Editing, Color Balance & H.264 Export (Blender 5.1)",
  date: "2026-06-19",
  kind: "tutorial",
  excerpt:
    "Complete Blender 5.1 Video Sequence Editor pipeline for turning a raw OBS screen-recording into a published tutorial MP4: Color strip title card, Text strip overlays with alpha-blend and shadow, Movie strip with per-strip Color Balance modifier (warm-tone correction for display-encoded sRGB captures), lower-third watermark, outro card, and H.264/AAC render at CRF Medium. Includes Python blueprint, synthetic viewport-preview renderer, and OBS recording notes.",
  Body: VseScreenRecordingBody,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    time: "one session",
    difficulty: "beginner",
    libraryPath:
      "blends/video-editing/vse-screen-recording-to-tutorial-export",
    prerequisites: [
      "A screen recording .mp4 from OBS or Xbox Game Bar (see SCREEN-RECORDING-NOTES.md). The blueprint runs without it (placeholder path) but the Movie strip will be skipped.",
      "Basic Blender navigation — switching workspaces, opening the Text Editor, running a script with Alt+R.",
      "No 3-D modelling knowledge required; the VSE is a 2-D compositing timeline.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "VSE Text strip (bpy.types.TextSequence) and strip Color Balance modifiers (bpy.types.StripsModifierColorBalance) available since Blender 3.x. FFMPEG codec configuration via bpy.types.FFmpegSettings unchanged through 4.x–5.x. Retiming handles (strip.retiming_handles) introduced in Blender 5.0.",
      },
      {
        name: "OBS Studio",
        version: "30+",
        url: "https://obsproject.com/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "Or Xbox Game Bar (Windows) / QuickTime (macOS). Output: 1920×1080, 30fps, H.264. See SCREEN-RECORDING-NOTES.md.",
      },
    ],
    steps: [
      {
        title: "Switch to the Video Editing workspace and ensure the sequencer exists",
        body:
          "Blender ships a 'Video Editing' workspace preset (top tab row). Selecting it\narranges the screen into: Preview (top left), VSE timeline (bottom), Properties\n(right). Alternatively, any area can be split and set to 'Sequencer' or\n'Sequencer / Preview'.\n\nIn Python, the sequence editor is not created until first use:\n\n  se = scene.sequence_editor          # None on a fresh scene\n  if se is None:\n      scene.sequence_editor_create()  # creates the SequenceEditor data-block\n  se = scene.sequence_editor          # now a valid SequenceEditor\n\nAttempting to set scene.render.use_sequencer = True before calling\nsequence_editor_create() has no effect — the renderer will fall back to the\n3-D viewport.",
      },
      {
        title: "Build the title card: Color strip + Text strips",
        body:
          "Channels are numbered 1–N from the bottom. Higher channel = rendered on top\n(like Photoshop layers). The solid background must be in channel 1:\n\n  bg = se.sequences.new_effect(\n      name='TitleBG', type='COLOR',\n      channel=1, frame_start=1, frame_end=90\n  )\n  bg.color = (0.05, 0.05, 0.07)   # near-black\n\nTitle text in channel 5 (above everything):\n\n  title = se.sequences.new_effect(\n      name='TitleText', type='TEXT',\n      channel=5, frame_start=1, frame_end=90\n  )\n  title.text         = 'My Tutorial'\n  title.font_size    = 80\n  title.color        = (1.0, 1.0, 1.0, 1.0)   # RGBA\n  title.location     = (0.5, 0.55)             # (0–1 normalised by scene res)\n  title.align_x      = 'CENTER'\n  title.use_shadow   = True\n  title.blend_type   = 'ALPHA_OVER'            # composite over lower channels\n\nNote: location[0]=0.5 is horizontal centre; location[1]=0.55 is 55% up\nfrom the bottom. These are normalised by resolution_x and resolution_y\nrespectively — they do not need to change when you export at a different res.\n'ALPHA_OVER' blend type uses the strip's alpha to composite; without it the\nText strip renders as a solid rectangle.",
      },
      {
        title: "Add the main video clip and set its trim points",
        body:
          "Movie strips reference an external file. The strip's channel-level frame\nrange determines where it sits in the timeline; frame_final_end trims the\nright edge without discarding source frames:\n\n  clip = se.sequences.new_movie(\n      name='ScreenRecording',\n      filepath='//screen_recording.mp4',  # // = relative to .blend file\n      channel=2,\n      frame_start=91,               # immediately after the 90-frame title\n  )\n  clip.frame_final_end = 900        # trim to frame 900 (30 s at 30fps)\n\nFrame offsets within the source:\n  clip.frame_offset_start = 30     # skip first 30 source frames (1 s lead-in)\n  clip.frame_offset_end   = 15     # trim 15 frames off the source tail\n\nThese offsets are non-destructive — the source file is unchanged.\nframe_final_duration = frame_final_end - frame_final_start reports the\neffective length.",
      },
      {
        title: "Attach a Color Balance modifier for warm-tone correction",
        body:
          "Screen captures are display-referred sRGB — not scene-linear. The VSE's\nColor Balance modifier is appropriate here (not the node compositor's\nColor Balance node, which expects linear-light input).\n\n  mod = clip.modifiers.new(name='ScreenColour', type='COLOR_BALANCE')\n  # correction_method defaults to 'LIFT_GAMMA_GAIN'\n  mod.color_balance.lift  = (0.97, 0.97, 0.97)  # pull shadows slightly\n  mod.color_balance.gamma = (1.02, 1.01, 0.99)  # mild warm mids\n  mod.color_balance.gain  = (1.05, 1.03, 1.00)  # warm highlights\n\nLift/Gamma/Gain operate in display space:\n  out = gain × (in ^ (1/gamma)) + lift   (simplified)\n\nValues > 1.0 brighten; < 1.0 darken. Lift shifts the black point; Gamma\ncontrols mid-tone brightness; Gain scales the white point. The mild warm\npush here compensates for the slightly cool-greenish cast common to\nWindows/macOS screen captures.\n\nFor ASC-CDL interchange (e.g. from DaVinci Resolve):\n  mod.correction_method = 'OFFSET_POWER_SLOPE'\n  mod.color_balance.offset = (r, g, b)\n  mod.color_balance.power  = (r, g, b)\n  mod.color_balance.slope  = (r, g, b)",
      },
      {
        title: "Configure H.264 / AAC render output",
        body:
          "The scene must tell the renderer to use VSE output, not the 3-D viewport:\n\n  scene.render.use_sequencer    = True\n  scene.render.use_compositing  = False  # skip node compositor for speed\n\nCodec configuration:\n\n  r  = scene.render\n  r.filepath                          = '//output/tutorial_export'\n  r.image_settings.file_format        = 'FFMPEG'\n  ff = r.ffmpeg\n  ff.format                           = 'MPEG4'\n  ff.codec                            = 'H264'\n  ff.audio_codec                      = 'AAC'\n  ff.audio_bitrate                    = 192    # kbps\n  ff.constant_rate_factor             = 'MEDIUM'  # CRF ≈ 23\n  ff.gopsize                          = 18        # keyframe every 0.6 s\n\nff.constant_rate_factor options (best to worst quality):\n  'LOSSLESS', 'PERC_LOSSLESS', 'HIGH' (~18), 'MEDIUM' (~23),\n  'LOW' (~28), 'VERYLOW' (~36), 'LOWEST' (~45)\n\nFor screen recordings with static UI and rapid text: 'HIGH' or 'MEDIUM'.\nFor 3-D viewport captures (motion, gradients): 'HIGH'.\n\nRender: Ctrl+F12 (or bpy.ops.render.render(animation=True)).",
      },
    ],
    troubleshooting: [
      {
        symptom:
          "Text strip renders as a solid white rectangle with no text visible",
        cause:
          "blend_type is not set to 'ALPHA_OVER'. Default blend_type is 'REPLACE', which composites the text strip as a full opaque frame, hiding its transparent background.",
        fix:
          "Set strip.blend_type = 'ALPHA_OVER'. This uses the strip's alpha channel to composite only the text pixels over the channels below. Also verify strip.blend_alpha = 1.0 (fully opaque composite).",
      },
      {
        symptom:
          "Movie strip shows 'File not found' and renders as a solid black frame",
        cause:
          "The filepath uses '//' (Blender-relative) but the .blend file has not been saved to disk yet, so '//' cannot be resolved.",
        fix:
          "Save the .blend file first (Ctrl+S → choose a location), then re-run the script. Alternatively, use an absolute path for the video file. Blender resolves '//' at load time relative to the saved .blend path.",
      },
      {
        symptom:
          "Rendered MP4 has no audio despite the screen recording having audio",
        cause:
          "Only Movie strips carrying audio AND with audio enabled contribute to the VSE audio mix. A Movie strip's audio is separate from its video track internally.",
        fix:
          "Select the Movie strip in the VSE. In the Strip Properties sidebar (N), confirm 'Volume' > 0 and 'Mute' is unchecked. Also verify ff.audio_codec = 'AAC' and ff.audio_bitrate > 0 in render settings — if audio codec is 'NONE' the audio is silently dropped.",
      },
      {
        symptom:
          "Color Balance modifier has no visible effect on the clip",
        cause:
          "The modifier was added but its 'enabled' toggle was turned off, or the strip's blend_type is 'REPLACE' and the modifier is processing the replaced frame (not the composite).",
        fix:
          "Select the strip, open the Strip Properties sidebar (N) → Modifiers tab. Confirm the modifier eye icon is enabled. Modifiers run before blend compositing — they affect the strip's own image data, which is then composited per blend_type.",
      },
      {
        symptom:
          "scene.sequence_editor_create() raises AttributeError",
        cause:
          "Called on bpy.context.scene before a valid scene is active, or called when the sequence editor already exists (the method is idempotent in 4.x but raised in older builds).",
        fix:
          "Always guard: 'if scene.sequence_editor is None: scene.sequence_editor_create()'. The method does not raise if called multiple times in Blender 5.1, but the guard makes intent clear and protects against older version regressions.",
      },
    ],
  },
  base,
);

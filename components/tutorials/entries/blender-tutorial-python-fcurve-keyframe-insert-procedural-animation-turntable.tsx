import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&rsquo;s Graph Editor lets you sculpt FCurves by hand, but every
        production pipeline eventually needs to author them in code — batch
        turntable renders, procedural reveal sequences, headless asset bakes.
        The <code>bpy.types.FCurve</code> and{" "}
        <code>bpy.types.Keyframe</code> data-blocks give you direct write
        access to every channel Blender can animate: interpolation mode, easing
        type, handle positions, and FCurve modifiers that persist through NLA
        evaluation.  The trade-off is that the glTF 2.0 format stores only
        sampled keyframe arrays — no FCurve modifiers, no drivers — so any
        clever modifier-based looping must be baked to per-frame data before
        export.  This tutorial builds three channels entirely via script, then
        bakes and exports a self-contained GLB for WebXR playback.
      </p>

      <h2>The mandatory two-step: <code>options={'{'}'FAST'{'}'}</code> + <code>fc.update()</code></h2>
      <p>
        <code>keyframe_points.insert(frame, value, options={'{'}'FAST'{'}'}</code>
        ) skips per-keyframe handle recalculation — essential when inserting
        dozens of keyframes in a loop, as recalculating after every insert is
        O(n²) in time.  The cost: Blender holds stale tangent data until you
        call <code>fc.update()</code>.  Evaluating the curve between that
        insert and the update returns garbage.  The rule is therefore:
        <strong> bulk-insert with {'{'}'FAST'{'}'}, then call{" "}
        <code>fc.update()</code> exactly once.</strong>  Setting handle types
        after the update (e.g. <code>kp.handle_left_type = 'AUTO_CLAMPED'</code>)
        requires a second <code>fc.update()</code> call because changing handle
        types invalidates the tangent cache again.
      </p>

      <h2>Channel 1 — Turntable: LINEAR + FModifierCycles</h2>
      <p>
        A full 360° rotation over 120 frames takes exactly two keyframes:
        frame 1 at 0 rad and frame 120 at <code>math.tau</code> (2π). LINEAR
        interpolation keeps the angular velocity constant throughout.  To make
        the rotation loop indefinitely without re-keying, attach an{" "}
        <code>FModifierCycles</code> with{" "}
        <code>mode_before = mode_after = 'REPEAT_OFFSET'</code>.{" "}
        <strong>REPEAT_OFFSET is essential</strong>: plain{" "}
        <code>'REPEAT'</code> would snap the value back to 0 rad at the start
        of each cycle, producing a sawtooth jerk in the viewport.
        REPEAT_OFFSET adds the delta of the keyed range to each repetition, so
        frame 121 reads as 2π + a tiny linear offset, giving smooth continuous
        rotation.  This modifier does not survive glTF export — see the bake
        step below.
      </p>
      <p>
        Compare this to the modifier-based approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-fcurve-modifiers-noise-cycles-stepped"
          className={lk}
        >
          FCurve Modifiers tutorial
        </Link>
        , which layers NOISE and CYCLES modifiers on existing keyframes through
        the Graph Editor UI rather than via script.
      </p>

      <h2>Channel 2 — Hover: sine wave baked to BEZIER keyframes</h2>
      <p>
        The hover oscillation samples <code>math.sin()</code> every 2 frames
        and writes BEZIER keyframes with <code>AUTO_CLAMPED</code> handles.
        Dense enough that the handles reconstruct the wave faithfully between
        samples; sparse enough that the action stays compact. An FCurve SINE
        modifier would be simpler to author but fails the export test: if the
        NLA strip that wraps the action has a non-unit scale, the modifier
        evaluates at the wrong period during bake.  Explicit keyframes are
        always strip-scale-agnostic.
      </p>
      <p>
        Note the handle-setting order. After <code>kps.add(n)</code> and bulk
        <code>kp.co = (frame, value)</code> assignments, call{" "}
        <code>fc.update()</code> <em>before</em> setting{" "}
        <code>handle_left_type</code>. Blender computes AUTO handle positions
        relative to adjacent keyframe co-ordinates — if the co values are stale
        when you set the handle type, the handles are placed wrongly.
      </p>

      <h2>Channel 3 — Elastic entrance: three-point overshoot</h2>
      <p>
        Blender&rsquo;s built-in <code>ELASTIC</code> interpolation mode with{" "}
        <code>EASE_IN_OUT</code> produces a damped oscillation that looks
        convincing for a reveal, but a two-point ELASTIC curve from 0 to 1
        overshoots unpredictably at the start frame: the first bounce can
        exceed the peak by a factor that depends on the curve length in pixels
        rather than time.  Three control points — (frame 1, 0), (frame 15,
        ELASTIC_PEAK), (frame 30, 1.0) — fix the overshoot magnitude
        explicitly.  The first segment carries the ELASTIC interpolation; the
        second is plain BEZIER.  The result is a controlled bounce that settles
        before the main animation loop begins.
      </p>

      <h2>NLA push + bake for GLB</h2>
      <p>
        Once all three channels are authored, the action moves to an NLA strip
        via <code>nla_tracks.new()</code> and{" "}
        <code>track.strips.new(name, frame_start, action)</code>.  The strip
        frame range matches the action range — no scale or offset — which means
        the NLA evaluates identically to the raw action.  Before glTF export,{" "}
        <code>bpy.ops.nla.bake(visual_keying=True, use_current_action=True)</code>{" "}
        samples every frame, replacing the FModifierCycles on the rotation
        channel with 120 explicit keyframes.  The resulting action is what glTF
        reads.
      </p>
      <p>
        For the full GLB export pipeline including material baking and batch
        multi-object export, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-nla-bake-ik-fk-action-push"
          className={lk}
        >
          NLA Bake: IK to FK Action Push
        </Link>{" "}
        tutorial, which covers the <code>bpy.ops.nla.bake</code> parameter set
        in detail, and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-depsgraph-evaluated-geometry-gn-instances-batch-export"
          className={lk}
        >
          Depsgraph Evaluated Geometry and Batch GLB Export
        </Link>{" "}
        tutorial for multi-object export pipelines driven from evaluated
        instances.
      </p>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>Curve evaluates incorrectly between inserts</strong> — you
          called <code>fc.update()</code> before finishing all inserts, then
          added more keyframes. Solution: complete all{" "}
          <code>kp.co</code> assignments, then call <code>fc.update()</code>{" "}
          once, then set handle types, then call <code>fc.update()</code> again.
        </li>
        <li>
          <strong>Turntable jitters at loop point in GLB</strong> — NLA bake
          was skipped or <code>export_optimize_animation_size=True</code>{" "}
          collapsed the last keyframe away. Set{" "}
          <code>export_optimize_animation_size=False</code> and ensure{" "}
          <code>visual_keying=True</code> on the bake.
        </li>
        <li>
          <strong>ELASTIC easing ignored in baked GLB</strong> — glTF 2.0
          supports only LINEAR and STEP and CUBICSPLINE samplers. Blender bakes
          ELASTIC curves to CUBICSPLINE tangents, which approximates the
          bounce. If the result looks wrong in Three.js, switch the elastic
          entrance to BEZIER with carefully placed handles and re-bake.
        </li>
        <li>
          <strong><code>action.fcurves.new()</code> raises RuntimeError</strong>{" "}
          — a curve for that data_path + index already exists. Use{" "}
          <code>action.fcurves.find(data_path, index=index)</code> first and
          remove it before creating a fresh one, or call{" "}
          <code>fc.keyframe_points.clear()</code> on the existing curve.
        </li>
      </ul>

      <h2>Sources and attribution</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/api/5.1/bpy.types.FCurve.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Foundation — Python API: bpy.types.FCurve
          </a>{" "}
          (CC-BY-SA 4.0, Blender Foundation) — the canonical reference for all
          FCurve, Keyframe, and FModifier data-block properties used in this
          blueprint.  Related documentation from the same site:{" "}
          <a
            href="https://docs.blender.org/api/5.1/bpy.types.ActionFCurves.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.ActionFCurves
          </a>{" "}
          and{" "}
          <a
            href="https://docs.blender.org/api/5.1/bpy.types.FModifierCycles.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.FModifierCycles
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/njankowski/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njankowski/blender-scripting
          </a>{" "}
          (MIT, Nick Jankowski) — a reference collection of Blender Python
          scripting examples covering procedural geometry, materials, and
          animation authored via the bpy data API.  Related projects from the
          same author:{" "}
          <a
            href="https://github.com/njankowski/blenderpy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blenderpy
          </a>{" "}
          (MIT) — helper utilities for headless Blender Python sessions.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-fcurve-keyframe-insert-procedural-animation-turntable",
  title:
    "Python — FCurve API: Procedural Keyframe Authoring — Turntable, Hover Oscillation & Elastic Entrance (Blender 5.1)",
  date: "2026-07-04",
  kind: "tutorial",
  excerpt:
    "Build three animation channels entirely via the bpy data API — a linear turntable rotation with FModifierCycles, a sine-wave hover oscillation baked to BEZIER keyframes, and a three-point elastic entrance — then push to NLA and bake to explicit keyframes before exporting a self-contained WebXR GLB.",
  Body,
};

export const entry = buildInstructable(
  {
    time: "one afternoon",
    difficulty: "intermediate",
    cost: "free — Blender 5.1 and this script",
    supplies: {
      materials: [
        "Blender 5.1",
        "blueprint.py from this library entry",
        "record.py for the viewport render",
      ],
      tools: [
        "Blender Text Editor (Shift+F11)",
        "Graph Editor (Shift+F6 in any panel)",
        "NLA Editor (Shift+F12 in any panel)",
        "Terminal to run headless or inspect output",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py and inspect the Graph Editor",
        body:
          "Open a new Blender 5.1 session.  In the Text Editor load blueprint.py and press Run Script.\n\n" +
          "Switch any editor to Graph Editor (Shift+F6).  You should see three channel groups:\n" +
          "  • Rotation — one linear ramp from frame 1 to 120 with a CYCLES modifier badge (the circular arrow icon)\n" +
          "  • Location Z — a sine-wave curve of 60 BEZIER keyframes\n" +
          "  • Scale X/Y/Z — three identical elastic curves with a visible overshoot peak at frame 15\n\n" +
          "Press Spacebar in the 3D viewport. The gem should rotate, float, and bounce into view.",
      },
      {
        title: "Understand the FAST insert + update contract",
        body:
          "Open blueprint.py and locate build_hover_oscillation().\n\n" +
          "The loop calls kps[i].co = (frame, value) on pre-allocated keyframe slots " +
          "(added via kps.add(n) once before the loop). It does NOT call fc.update() inside " +
          "the loop — each update would be O(n) over all existing keyframes, making the whole " +
          "insert O(n²).\n\n" +
          "After the loop, fc.update() runs once. Then handle types are set. Then fc.update() " +
          "runs a second time. Skip either update and the curve will evaluate incorrectly.\n\n" +
          "To test: comment out the second fc.update() call, re-run, and observe in the Graph " +
          "Editor that the AUTO_CLAMPED handles are placed at wrong positions.",
      },
      {
        title: "Inspect FModifierCycles on the rotation channel",
        body:
          "In the Graph Editor, select the rotation_euler[2] channel.\n\n" +
          "In the Properties region (N key) → Modifiers tab, you will see a CYCLES entry.\n" +
          "Mode Before and Mode After should both read 'Repeat with Offset'.\n\n" +
          "Scrub past frame 120 in the timeline. The rotation should continue increasing " +
          "smoothly beyond 2π — frame 121 evaluates as slightly more than 2π, frame 240 " +
          "as approximately 4π (two full turns).\n\n" +
          "Change Mode After to 'Repeat' (without Offset) and scrub past 120 again. " +
          "The value snaps back to near-zero — the sawtooth jump that REPEAT_OFFSET prevents.",
      },
      {
        title: "Bake and inspect the glTF-ready action",
        body:
          "In the NLA Editor (Shift+F12), the Turntable strip should be visible on the object track.\n\n" +
          "Run export_glb() in isolation (or run the full script which calls it at the end).\n\n" +
          "After bpy.ops.nla.bake completes, switch to the Graph Editor and select the " +
          "rotation_euler[2] channel. The CYCLES modifier badge is gone — replaced by 120 " +
          "individual LINEAR keyframes from frame 1 to 120. This is what glTF stores.\n\n" +
          "Open the exported turntable_prop.glb in a glTF viewer or drag it into " +
          "a Three.js scene. The animation clip should play as a smooth 5-second turntable loop.",
      },
      {
        title: "Adapt the elastic entrance for a different easing style",
        body:
          "To swap ELASTIC for BOUNCE (a different physical-feeling settle):\n\n" +
          "  kps[0].interpolation = 'BOUNCE'\n" +
          "  kps[0].easing        = 'EASE_OUT'\n\n" +
          "EASE_OUT starts fast and decelerates — the reverse of EASE_IN_OUT.\n" +
          "Remove the middle peak keyframe (kps.add(2) instead of 3, skip kps[1]).\n\n" +
          "BOUNCE easing does not overshoot above the target value — it bounces " +
          "between the start and end, always approaching from below. If you need " +
          "the overshoot-above effect, keep ELASTIC with three points.",
      },
    ],
    finalResult:
      "A baked GLB containing a faceted gem that rotates 360° over 5 seconds, " +
      "hovers sinusoidally ±6 cm on the Z axis, and scales in with an elastic bounce " +
      "over the first 1.25 seconds — all animation channels authored purely via the " +
      "bpy FCurve data API, NLA-pushed, baked, and exported in one script invocation.",
    variations: [
      "Audio-reactive turntable: replace the static sine hover with a sound-baked FCurve. Run bpy.ops.graph.sound_bake() on an imported audio file, then copy the resulting keyframes onto the location[2] channel with fc.keyframe_points.insert() — the hover amplitude follows the beat.",
      "Multi-object batch turntable: wrap build_turntable_rotation() and export_glb() in a loop over bpy.data.objects filtered by a custom property 'holoflow:facet'. Each object gets its own action, baked, and exported as a separate GLB — useful for product-line renders where every SKU needs a turntable clip.",
      "Easing ramp preview: before baking, iterate over all kps in the elastic channel and print (kp.co[0], fc.evaluate(kp.co[0])) to confirm the evaluated value matches your expectations. This is faster than scrubbing the timeline frame-by-frame when debugging handle drift.",
    ],
    troubleshooting: [
      {
        symptom: "Turntable rotation jitters or resets at the GLB loop point",
        cause:
          "The bake frame range did not cover a full cycle, or export_optimize_animation_size=True removed the final keyframe because its value was numerically close to the penultimate one.",
        fix:
          "Set export_optimize_animation_size=False. Also confirm FRAME_END in the bake call matches FRAME_END in the script — if they differ by even one frame the loop point breaks.",
      },
      {
        symptom: "AUTO_CLAMPED handles on the hover channel form sharp corners",
        cause:
          "fc.update() was called before the kp.co values were fully written, so Blender placed handles based on stale co positions.",
        fix:
          "Assign all kp.co values in a single pass, call fc.update(), then set handle types, then call fc.update() a second time. Never interleave handle-setting and co-assignment.",
      },
      {
        symptom: "action.fcurves.new() raises RuntimeError: 'F-Curve already exists'",
        cause:
          "A previous script run left an action with the same curves attached to the object.",
        fix:
          "Call clear_scene() at the start (included in blueprint.py) or find and remove the existing action: a = bpy.data.actions.get(ACTION_NAME); if a: bpy.data.actions.remove(a).",
      },
      {
        symptom: "ELASTIC entrance looks linear in the GLB viewer",
        cause:
          "glTF 2.0 CUBICSPLINE tangents approximate ELASTIC but most real-time viewers sample them as linear between knots.",
        fix:
          "Bake the elastic channel to dense keyframes (every frame for frames 1–30) before export. Change the bake step: bpy.ops.nla.bake(frame_start=1, frame_end=30, step=1) on a second pass targeting only the scale curves.",
      },
    ],
  },
  base,
);

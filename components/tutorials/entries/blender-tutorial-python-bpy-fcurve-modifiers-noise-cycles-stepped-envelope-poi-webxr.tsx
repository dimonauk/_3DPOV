import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        FCurve modifiers are procedural operators stacked on top of keyframe
        data.  They do not add keyframes — they modify the evaluated curve value
        at query time, so a single modifier can transform an entire animation
        without touching the keyframe list.  Four types cover the most useful
        cases: <strong>NOISE</strong> for organic flutter, <strong>CYCLES</strong>{" "}
        for infinite looping, <strong>STEPPED</strong> for stop-motion
        quantisation, and <strong>GENERATOR</strong> for polynomial drift.
        Because glTF/GLB bakes to discrete keyframes there is no glTF equivalent
        of any of these — so the final step samples{" "}
        <code>fc.evaluate(frame)</code> for every export frame and writes the
        result as a real keyframe before removing the modifiers.
      </p>
      <p>
        This tutorial builds two poi balls.  Ball A carries CYCLES + NOISE on all
        three location axes.  Ball B carries CYCLES + STEPPED on the Y axis and
        GENERATOR on Z, producing a stop-motion orbit with a constant height
        offset.  After the modifier stacks are built, a single bake pass samples
        160 frames and writes LINEAR keyframes to both actions, leaving the scene
        ready for GLB export to WebXR.
      </p>

      <h2>The FCurve modifier type hierarchy</h2>
      <p>
        <code>bpy.types.FCurveModifiers</code> is a collection on every FCurve.
        Modifiers are evaluated in order from top to bottom.  Each modifier
        receives the value so far and can add to it, replace it, or multiply it.
        NOISE and GENERATOR are additive by default; CYCLES transforms the frame
        lookup before the other modifiers run (it remaps the query frame into the
        looping range).  This ordering matters: if CYCLES runs after NOISE, the
        noise is applied before the frame is clamped to the loop range, which
        causes discontinuities at loop boundaries — CYCLES should always be
        first.  Adding via <code>fc.modifiers.new()</code> appends to the end,
        so add CYCLES first, then NOISE or STEPPED.
      </p>
      <pre>{`# Correct order — CYCLES first, then additive modifiers
fc.modifiers.new(type='CYCLES')
fc.modifiers.new(type='NOISE')  # runs after CYCLES remaps the frame`}</pre>

      <h2>CYCLES — infinite looping without keyframe duplication</h2>
      <p>
        CYCLES tiles the range defined by the first and last keyframe.  Two copy
        modes are available: <code>REPEAT</code> replays the exact trajectory on
        each repeat — correct for a closed orbit where the ball returns to its
        start position.  <code>REPEAT_OFFSET</code> shifts each repeat by the
        delta between the first and last keyframe value, useful for accumulating
        rotation (a wheel spinning forever) but wrong for a closed orbit.
      </p>
      <pre>{`def _add_cycles(fc):
    mod = fc.modifiers.new(type='CYCLES')
    mod.mode_before   = 'REPEAT'
    mod.mode_after    = 'REPEAT'
    mod.cycles_before = 0   # 0 = infinite repeats
    mod.cycles_after  = 0`}</pre>
      <p>
        Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-action-nla-fcurve-keyframe-poi-performance-webxr"
          className={lk}
        >
          NLA Action &amp; FCurve tutorial
        </Link>
        , which sequences three separate Actions in the NLA editor.  CYCLES
        achieves infinite repetition of a single Action without the NLA overhead
        — simpler for looping performance animations destined for WebXR.
      </p>

      <h2>NOISE — Perlin noise flutter</h2>
      <p>
        NOISE generates bandlimited Perlin noise and adds it to the curve.{" "}
        <code>strength</code> sets amplitude in the channel&apos;s own units
        (metres for location channels).  <code>scale</code> is the period in
        frames — lower values produce faster variation.  <code>phase</code>{" "}
        shifts the noise along the time axis; give each axis a different phase
        so X, Y, and Z noise are uncorrelated and the ball moves
        three-dimensionally rather than in a single plane.  <code>depth</code>{" "}
        controls the number of Perlin octaves — 1 gives broad blobs, 3 adds fine
        detail on top.
      </p>
      <pre>{`def _add_noise(fc, phase_offset=0.0):
    mod          = fc.modifiers.new(type='NOISE')
    mod.scale    = 0.8     # one variation period ≈ 19 frames at this setting
    mod.strength = 0.12    # ±0.12 m amplitude
    mod.phase    = phase_offset
    mod.depth    = 2
    mod.blend_in  = 0.0   # no fade-in; full effect from frame 1
    mod.blend_out = 0.0`}</pre>

      <h2>STEPPED — stop-motion quantisation</h2>
      <p>
        STEPPED holds the curve value constant for <code>frame_step</code>{" "}
        frames before jumping to the next evaluated position.  Applied to a
        single axis this creates anisotropic stepping — the Y position stutters
        while X and Z move continuously, giving a mechanical rhythm that reads
        as intentional stylisation.  The modifier is bounded by{" "}
        <code>frame_start</code> and <code>frame_end</code>; outside these
        bounds the original curve value passes through unmodified.
      </p>
      <pre>{`def _add_stepped(fc):
    mod                  = fc.modifiers.new(type='STEPPED')
    mod.frame_step       = 3            # hold for 3 frames, then snap
    mod.frame_start      = 1
    mod.frame_end        = 160
    mod.use_frame_start  = True
    mod.use_frame_end    = True`}</pre>

      <h2>GENERATOR — polynomial drift</h2>
      <p>
        GENERATOR evaluates a polynomial P(x) = Σ coefficients[i] × x^i and
        adds it to the curve.  A degree-1 polynomial with{" "}
        <code>coefficients = [offset, 0]</code> gives P(x) = offset — a constant
        additive lift at every frame with no keyframes required.  A non-zero
        linear term <code>[0, 0.001]</code> creates a slow linear ascent; a
        quadratic <code>[0, 0, 0.00001]</code> gives a parabolic arc.  Here the
        constant form lifts ball B 0.20 m above the stage plane.
      </p>
      <pre>{`def _add_generator(fc):
    mod                = fc.modifiers.new(type='GENERATOR')
    mod.mode           = 'POLYNOMIAL'
    mod.poly_order     = 1
    mod.coefficients[0] = 0.20   # constant lift in metres
    mod.coefficients[1] = 0.0    # zero linear term`}</pre>

      <h2>Baking for GLB export</h2>
      <p>
        <code>FCurve.evaluate(frame)</code> applies every enabled modifier and
        returns one float.  Sampling this at every export frame and writing the
        result as a LINEAR keyframe captures the full modifier stack.  LINEAR
        interpolation is correct for pre-sampled noise — Bézier handles would
        smooth between samples and potentially reintroduce artefacts the baking
        was meant to preserve.
      </p>
      <pre>{`def _bake(obj):
    action = obj.animation_data.action
    for fc in action.fcurves:
        samples = [(float(f), fc.evaluate(float(f)))
                   for f in range(1, 161)]

        fc.keyframe_points.clear()
        for mod in list(fc.modifiers):
            fc.modifiers.remove(mod)

        fc.keyframe_points.add(len(samples))
        for i, (fr, val) in enumerate(samples):
            kp = fc.keyframe_points[i]
            kp.co            = (fr, val)
            kp.interpolation = 'LINEAR'
        fc.update()`}</pre>
      <p>
        This pattern mirrors the depsgraph sampling used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-kuramoto-coupled-oscillators-phase-sync-poi-webxr"
          className={lk}
        >
          Kuramoto phase-sync tutorial
        </Link>
        , where simulation results are similarly baked to keyframes before
        export.  The difference here is that modifier evaluation is purely
        local to each FCurve — no depsgraph update is needed because the
        noise and cycling are computed from the frame number alone, not from
        object world-space data.
      </p>

      <h2>Pre-allocating keyframes: why it matters</h2>
      <p>
        <code>fc.keyframe_points.add(N)</code> pre-allocates N slots in a single
        C-side allocation, then filling via <code>kp.co = (fr, val)</code> is an
        indexed write with no sorting.  Calling{" "}
        <code>keyframe_points.insert(frame, value)</code> inside a loop
        re-sorts the entire list on every call — O(N²) for N keyframes, visibly
        slow above 200 keys.  The batch pattern here handles 160 keys per FCurve
        without noticeable pause.  See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-fcurve-keyframe-insert-procedural-animation-turntable"
          className={lk}
        >
          procedural turntable tutorial
        </Link>{" "}
        for a deeper treatment of the insertion cost model.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>CYCLES modifier shows no repetition in the Graph Editor</strong>{" "}
          — the first and last keyframe must not be at the same frame.  The
          cycle range is derived from the first and last key coordinates; if
          those are identical the cycle has zero length and Blender skips
          repetition silently.
        </li>
        <li>
          <strong>NOISE produces no visible effect</strong> — check that{" "}
          <code>mod.strength</code> is not zero and that the modifier is enabled
          (the eye icon in the modifier list must be active).
        </li>
        <li>
          <strong>GLB export lacks animation</strong> — confirm that the bake
          pass ran and that <code>action.fcurves</code> contains keyframes with
          <code>interpolation = &apos;LINEAR&apos;</code> rather than modifiers.
          Inspect via Graph Editor → F-Curve list; modifier overlays should be
          absent after baking.
        </li>
        <li>
          <strong>GENERATOR offset not applying</strong> — verify{" "}
          <code>mod.poly_order</code> matches the length of{" "}
          <code>mod.coefficients</code>.  A poly_order of 1 exposes indices 0
          and 1; accessing index 2 silently clamps or errors depending on the
          Blender build.
        </li>
      </ul>

      <h2>Studio extensions</h2>
      <p>
        The NOISE modifier is the correct technique for organic breathing motion
        on VRM avatar props — apply low-strength noise to a bone rotation FCurve
        for a subtle idle sway without keyframes.  This integrates directly with
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-drivers-parametric-shader"
          className={lk}
        >
          animation drivers tutorial
        </Link>
        : a single custom property can control <code>mod.strength</code> across
        multiple FCurves, switching between completely smooth and noisy motion
        states via one driver input — useful for scripted WebXR performance
        states.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-bpy-fcurve-modifiers-noise-cycles-stepped-envelope-poi-webxr",
  title:
    "Python bpy FCurve Modifiers — Noise Flutter, Cycles Loop, Stepped Stop-Motion & Generator Drift for Poi Animation (Blender 5.1)",
  date: "2026-07-25",
  kind: "tutorial",
  excerpt:
    "Stack NOISE, CYCLES, STEPPED, and GENERATOR modifiers on location FCurves for two poi balls, then bake the evaluated result to LINEAR keyframes for GLB/WebXR export. Expert coverage of modifier ordering, the evaluate() bake pattern, REPEAT vs REPEAT_OFFSET cycle modes, and why pre-allocated keyframe arrays matter for batch baking.",
  Body,
  related: [
    {
      href: "/tutorials/blender-tutorial-python-bpy-action-nla-fcurve-keyframe-poi-performance-webxr",
      label: "Python bpy Action & NLA Editor — FCurve Batch Insertion",
      note: "The pre-allocated keyframe pattern this tutorial's bake pass builds on.",
    },
    {
      href: "/tutorials/blender-tutorial-animation-drivers-parametric-shader",
      label: "Animation Drivers — Custom Properties Controlling Shader Sockets",
      note: "Combine drivers with FCurve modifiers for parameter-controlled noise intensity.",
    },
    {
      href: "/tutorials/blender-tutorial-python-kuramoto-coupled-oscillators-phase-sync-poi-webxr",
      label: "Python Kuramoto Coupled Oscillators — Phase Sync Poi",
      note: "Parallel baking pattern: depsgraph sampling vs fc.evaluate() for modifier stacks.",
    },
  ],
};

export const entry = buildInstructable(base, {
  type: "blend",
  blueprintPath:
    "public/library/blends/scripting/python-bpy-fcurve-modifiers-noise-cycles-stepped-envelope-poi-webxr/blueprint.py",
  recordPath:
    "public/library/blends/scripting/python-bpy-fcurve-modifiers-noise-cycles-stepped-envelope-poi-webxr/record.py",
  screenNotesPath:
    "public/library/blends/scripting/python-bpy-fcurve-modifiers-noise-cycles-stepped-envelope-poi-webxr/SCREEN-RECORDING-NOTES.md",
  outsideSources: [
    {
      title: "Blender Manual — F-Curve Modifiers",
      url: "https://docs.blender.org/manual/en/latest/editors/graph_editor/fcurves/modifiers.html",
      licence: "CC-BY-SA 4.0",
      author: "Blender Foundation",
    },
    {
      title: "Blender Python API — FModifierNoise",
      url: "https://docs.blender.org/api/current/bpy.types.FModifierNoise.html",
      licence: "CC-BY-SA 4.0",
      author: "Blender Foundation",
    },
  ],
});

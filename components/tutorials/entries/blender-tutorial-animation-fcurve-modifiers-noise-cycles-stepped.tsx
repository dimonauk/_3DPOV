import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function AnimationFcurveModifiersNoiseCyclesSteppedBody() {
  return (
    <>
      <p>
        F-Curve modifiers are waveform post-processors that live at the tail of
        Blender&apos;s animation evaluation pipeline — after keyframe
        interpolation runs but before the resulting value reaches the datablock.
        Unlike{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-drivers-parametric-shader"
          className={lk}
        >
          drivers
        </Link>
        , which map one channel to another via expression, modifiers reshape the
        curve itself: stretching it in time (CYCLES), adding controlled randomness
        (NOISE), or quantising the output to stepped holds (STEPPED). Three
        modifiers, three fundamentally different uses, all composable on any
        animated channel without touching a single keyframe.
      </p>
      <p className="mt-3">
        The classic paired workflow is CYCLES + NOISE: CYCLES loops a short
        authored arc indefinitely; NOISE stacked above adds frame-by-frame
        organic variation so no two loops look identical. This is the standard
        recipe behind breathing idles in{" "}
        <Link
          href="/tutorials/blender-tutorial-nla-action-clips-vrm"
          className={lk}
        >
          VRM character rigs
        </Link>
        , camera handheld shake, and any looping prop animation that needs to
        feel alive without hand-crafting hundreds of keyframes.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Evaluation order — why CYCLES must come before NOISE
      </h2>
      <p>
        Modifiers in <code>fcurve.modifiers</code> are evaluated in index order:
        index 0 first, index 1 second. CYCLES remaps the <em>time axis</em> —
        it converts the current frame into a position within the looping segment.
        NOISE adds a random value to the <em>output</em> of whatever precedes it.
        Stack CYCLES first, NOISE second: every loop receives the same noise
        pattern at the equivalent frame-within-loop position, giving you
        consistent-but-alive looping motion.
      </p>
      <p className="mt-3">
        Reverse the stack: NOISE runs on the raw timeline first, so it builds up
        a different pattern in every loop cycle. CYCLES then tries to wrap a
        noisy curve, producing a jarring pop at the cycle boundary where the
        noise values don&apos;t align. It&apos;s not wrong — it&apos;s a
        different tool — but it&apos;s rarely what you want for organic idles.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# CORRECT stack order (index 0 = first evaluated)
fc = find_fcurve(action, "location", 2)  # loc.Z

cycles = fc.modifiers.new(type="CYCLES")   # index 0 — remaps time
cycles.mode_before = "REPEAT"
cycles.mode_after  = "REPEAT"
# cycles_before/cycles_after left at 0 → infinite looping

noise = fc.modifiers.new(type="NOISE")    # index 1 — adds after loop
noise.blend_type = "ADD"
noise.scale      = 8.0    # time scale: higher → faster fluctuation
noise.strength   = 0.18   # amplitude: ±0.18 rad
noise.phase      = 42     # random seed — change per object to desync
noise.depth      = 2      # octave count (1=smooth blob, 4=jagged)
`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        CYCLES — three repeat modes
      </h2>
      <p>
        <code>mode_before</code> and <code>mode_after</code> control what happens
        outside the keyframe segment. <strong>REPEAT</strong> resets the value at
        each cycle boundary — the right choice for any loop where the first and
        last keyframe share the same value (position bounce, breathing). Use
        it here.
      </p>
      <p className="mt-3">
        <strong>REPEAT_OFFSET</strong> adds the full-cycle delta each iteration:
        if your 24-frame segment climbs 1 m on Z, frame 25 starts 1 m higher
        than frame 1. Ideal for an endlessly ascending staircase or a clock hand
        that never stops. See how it compares to the{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-constraints-follow-path-track-to"
          className={lk}
        >
          Follow Path constraint
        </Link>{" "}
        which achieves a similar continuous-orbit effect via a different
        mechanism. <strong>MIRROR</strong> ping-pongs: forward, then reversed,
        then forward again — good for pendulums and piston pistons.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        NOISE blend_type — ADD vs REPLACE
      </h2>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto">{`# ADD (default for shake/wobble):
#   result = base_curve_value + noise_output * influence
# The sphere still bounces — noise adds a random offset on top.

# REPLACE:
#   result = noise_output * influence
# The curve value is discarded entirely; pure noise on this channel.
# Useful for a flag's secondary Z-jitter where you have no authored keyframes
# on that axis and want fully procedural flap from the modifier alone.

# MULTIPLY:
#   result = base_curve_value * (1 + noise_output)
# Amplitude-modulates the base — louder sections get more noise variation.

noise.blend_type = "ADD"     # what we want for organic bounce wobble
noise.influence  = 1.0       # 0.0–1.0 master weight of the modifier
`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        STEPPED — ratchet gear & cel animation
      </h2>
      <p>
        STEPPED quantises the <em>time</em> axis: it holds the output value
        constant for <code>frame_step</code> frames, then jumps to the next
        sample. Applied to a linearly rotating disc, it produces a mechanical
        ratchet click. Applied to a camera rotation with{" "}
        <code>frame_step=2</code> it recreates traditional cel-animation
        &ldquo;on-twos&rdquo; — every pose held for two frames, which the human
        eye reads as deliberate stylisation rather than low frame rate.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# Ratchet disc: one full 360° rotation over 96 frames
ratchet.rotation_euler.z = 0.0
ratchet.keyframe_insert(data_path="rotation_euler", index=2, frame=1)
ratchet.rotation_euler.z = math.tau    # 2π radians
ratchet.keyframe_insert(data_path="rotation_euler", index=2, frame=96)

for kp in fc_ratchet.keyframe_points:
    kp.interpolation = "LINEAR"        # constant angular speed before quantisation

stepped = fc_ratchet.modifiers.new(type="STEPPED")
stepped.frame_step    = 4.0   # 96 frames / 4 = 24 steps → 360°/24 = 15° per click
stepped.snap_in_frame = 0.0   # sample frame 0 of each 4-frame block
# Result: disc snaps 15° every 4 frames instead of drifting smoothly
`}</pre>
      <p className="mt-3">
        <code>snap_in_frame</code> shifts which frame within each block is
        sampled. Default 0 = first frame of the block (leading-edge hold).
        Set it to <code>frame_step / 2</code> for mid-block sampling, which
        centres the hold around the motion-blur window in a{" "}
        <Link
          href="/tutorials/blender-tutorial-render-cycles-dof-motion-blur-bokeh"
          className={lk}
        >
          Cycles motion-blur
        </Link>{" "}
        render — reducing the blur artifact at the step boundary.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Camera handheld shake via NOISE on static loc channels
      </h2>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto">{`# Camera has NO intentional motion — two identical keyframes mark it static.
cam_obj.keyframe_insert(data_path="location", frame=1)
cam_obj.keyframe_insert(data_path="location", frame=96)

act_cam = cam_obj.animation_data.action

for axis_idx, phase in ((0, 17), (1, 91)):   # X and Y, different phases
    fc_cam = find_fcurve(act_cam, "location", axis_idx)
    noise_c = fc_cam.modifiers.new(type="NOISE")
    noise_c.blend_type = "ADD"
    noise_c.scale      = 5.0    # ~1 drift per second at 24 fps
    noise_c.strength   = 0.04   # ±4 cm shake — subtle but perceptible
    noise_c.phase      = float(phase)   # 17 vs 91 → x/y shake desynchronised
    noise_c.depth      = 2

# WHY different phases on X vs Y:
# Same phase would make the camera drift diagonally in a perfectly
# correlated direction — very artificial. Different phases break the
# correlation so the shake feels 2-dimensional and genuinely handheld.
`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Frame-range restriction — blend_in / blend_out
      </h2>
      <p>
        Every FCurveModifier supports an optional frame restriction:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto">{`noise.use_restricted_range = True
noise.frame_start = 48     # noise ramps in from frame 48
noise.frame_end   = 96     # noise ramps out at frame 96
noise.blend_in    = 12     # 12-frame fade-in from frame_start
noise.blend_out   = 12     # 12-frame fade-out before frame_end
# Useful for: character notices something → starts fidgeting mid-take
# without re-authoring the base action.
`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Export to GLB
      </h2>
      <p>
        F-Curve modifiers are .blend-only. They are invisible to the glTF
        exporter. To ship animated modifier output in a GLB:
      </p>
      <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
        <li>
          Select the objects you want to bake.
        </li>
        <li>
          Object ▸ Animation ▸ Bake Action. Enable{" "}
          <strong>Visual Keying</strong>, set Step = 1, enable{" "}
          <strong>Clear Modifiers</strong>.
        </li>
        <li>
          This writes a dense keyframe per frame that encodes the modifier
          output as raw curve values — identical behaviour at runtime, now
          portable to Three.js via{" "}
          <code>AnimationClip</code>.
        </li>
      </ol>
      <p className="mt-3">
        Baked noise at Step 1 produces one keyframe per frame — 96 keyframes
        for a 4-second clip. If the channel only needs coarse sampling (camera
        position for a 30-fps WebXR scene), bake at Step 2 and halve the data.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Sources</h2>
      <ul className="list-disc list-inside text-sm space-y-1">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/editors/graph_editor/fcurves/modifiers.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            F-Curve Modifiers — Blender Manual
          </a>{" "}
          — CC-BY-SA 4.0, Blender Documentation Team. Canonical reference for
          all modifier types including GENERATOR and ENVELOPE (not covered
          here).
        </li>
        <li>
          <a
            href="https://docs.blender.org/api/current/bpy.types.FModifierNoise.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.FModifierNoise — Blender Python API
          </a>{" "}
          — CC-BY-SA 4.0, Blender Foundation. Complete property listing for
          the NOISE modifier, including <code>depth</code> and{" "}
          <code>offset</code> which are absent from the manual UI description.
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njanakiev/blender-scripting
          </a>{" "}
          (MIT, Nicolas Janakiev) — scripting patterns used as reference for
          fcurve traversal idioms; related companion repo{" "}
          <a
            href="https://github.com/njanakiev/blender-scripting/blob/master/docs/animation.md"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            animation.md
          </a>{" "}
          covers NLA + driver setup.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "one evening",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1"],
      tools: [
        "Graph Editor — F-Curve Modifiers panel",
        "Properties ▸ Object Properties (animation_data)",
        "bpy scripting console",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py to build the demo scene",
        body: "Open Blender ▸ Scripting workspace, load blueprint.py, and run. Three objects appear: BounceSphere (with CYCLES + NOISE), RatchetDisc (STEPPED), and Camera (NOISE shake).",
      },
      {
        title: "Inspect modifiers in the Graph Editor",
        body: "Select BounceSphere. Open Graph Editor. In the N panel ▸ Modifiers tab, expand CYCLES on loc.Z: mode_before/after = REPEAT. Below it, NOISE on rot.Z: blend_type = ADD, strength = 0.18.",
      },
      {
        title: "Play animation — observe the bounce loop",
        body: "Press Space. The sphere bounces on a 24-frame period courtesy of CYCLES. Watch for slight rotation variation at the apex — that is the NOISE modifier on rot.Z adding organic wobble each loop.",
      },
      {
        title: "Select RatchetDisc — inspect STEPPED",
        body: "Click RatchetDisc. In Graph Editor, the rot.Z FCurve shows a staircase shape instead of a straight diagonal. frame_step=4, so the disc snaps 15° every 4 frames rather than rotating continuously.",
      },
      {
        title: "Switch to Camera view — observe handheld shake",
        body: "Numpad 0 for Camera view. Play. The ground plane reference points drift slightly — the NOISE modifiers on camera loc.X and loc.Y (different phases) produce a 2D handheld shake at ±0.04 m.",
      },
      {
        title: "Bake and export as GLB",
        body: "Select all animated objects. Object ▸ Animation ▸ Bake Action. Enable Visual Keying, Step 1, Clear Modifiers. Export as GLB — the resulting AnimationClips now carry the baked modifier output as standard keyframes.",
      },
    ],
  },
  {
    slug: "blender-tutorial-animation-fcurve-modifiers-noise-cycles-stepped",
    title:
      "F-Curve Modifiers — Noise + Cycles + Stepped: Procedural Animation Variation (Blender 5.1)",
    date: "2026-06-14",
    kind: "tutorial",
    excerpt:
      "Use CYCLES to loop any keyframe sequence infinitely, NOISE to add organic per-frame variation without touching keyframes, and STEPPED to quantise motion into ratchet clicks or cel-animation on-twos — all composable on any FCurve channel.",
    Body: AnimationFcurveModifiersNoiseCyclesSteppedBody,
  },
);

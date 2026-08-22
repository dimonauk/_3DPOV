import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function AnimationSoundBakeFcurveAudioReactiveBody() {
  return (
    <>
      <p>
        Blender&apos;s <code>bpy.ops.graph.sound_bake()</code> operator is
        gated behind Graph Editor UI context — it cannot be called safely from
        a Text Editor script. The pure-Python alternative is cleaner anyway:
        read the WAV with the standard library&apos;s <code>wave</code> and{" "}
        <code>struct</code> modules, compute per-frame RMS amplitude, and write
        keyframes directly onto a custom object property via{" "}
        <code>obj.keyframe_insert(data_path='["audio_amplitude"]')</code>. A
        Scripted Driver then bridges that property to a Geometry Nodes modifier
        input socket, and the GN tree displaces a grid mesh with a radial
        concentric-wave whose height scales with the amplitude value evaluated
        at each frame.
      </p>
      <p className="mt-3">
        The result is a subdivided plane that pulses in sync with a synthetic
        kick+snare beat at 120 BPM — every thump in the WAV produces a visible
        wave crest radiating outward from the grid centre. The same pipeline
        works with any WAV you drop in: field recordings, music stems, speech.
        Connect it to the{" "}
        <Link
          href="/tutorials/wiring-spatial-audio-in-the-framework"
          className={lk}
        >
          spatial-audio framework
        </Link>{" "}
        for a WebXR audio visualiser, or feed it to a bone scale driver for a
        character that literally reacts to its own soundtrack.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Why RMS amplitude, not peak
      </h2>
      <p>
        Peak amplitude is the single highest sample in the window. For a 24 fps
        animation at 44 100 Hz, each frame&apos;s window contains 1 838 samples.
        A single-sample transient spike produces a large peak but is inaudible —
        it drives an unmotivated visual burst. RMS (root-mean-square) integrates
        energy across the window and correlates with perceived loudness. A kick
        drum, whose energy persists for 80–150 ms, produces a sustained RMS peak
        that maps cleanly to 2–4 animation frames — readable as deliberate motion
        at normal playback speed.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# Per-frame RMS from raw 16-bit PCM
def wav_rms_per_frame(path, fps, n_frames):
    with wave.open(path, 'r') as wf:
        sr   = wf.getframerate()
        raw  = wf.readframes(wf.getnframes())
    floats = [s / 32768.0 for s in struct.unpack(f'<{len(raw)//2}h', raw)]
    spf    = sr / fps                       # samples per animation frame
    result = []
    for f in range(n_frames):
        chunk = floats[int(f*spf) : int((f+1)*spf)]
        rms   = (sum(s*s for s in chunk) / len(chunk)) ** 0.5 if chunk else 0.0
        result.append(rms)
    peak = max(result) or 1.0
    return [v / peak for v in result]      # normalise to [0, 1]`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Keyframing a custom property
      </h2>
      <p>
        Custom properties on Blender objects (<code>obj["key"] = value</code>)
        are animatable via <code>keyframe_insert</code> with the data path{" "}
        <code>{`'["key"]'`}</code>. The quotes are part of the path syntax —
        it&apos;s an RNA path into the ID&apos;s property bag. Compare this to{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-drivers-parametric-shader"
          className={lk}
        >
          driver expressions
        </Link>
        , which read a property but do not keyframe it: here we want dense
        keyframe data, one per animation frame, encoding the baked amplitude.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`obj["audio_amplitude"] = 0.0
obj.animation_data_create()
action = bpy.data.actions.new("AudioAmplitude")
obj.animation_data.action = action

for frame_i, amp in enumerate(amplitudes, start=1):
    obj["audio_amplitude"] = amp
    obj.keyframe_insert(data_path='["audio_amplitude"]', frame=frame_i)

# Each keyframe uses CONSTANT interpolation by default —
# changing to BEZIER or LINEAR in the FCurve smooths out rapid beats
# but blurs the attack transient. Keep CONSTANT for percussive content.`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Scripted Driver on the GN modifier input
      </h2>
      <p>
        In Blender 5.x, a Geometry Nodes modifier exposes its Group Input
        sockets as properties keyed by the interface identifier string (e.g.{" "}
        <code>"Socket_1"</code>). That identifier is stable after the tree is
        built and is retrievable via{" "}
        <code>nt.interface.items_tree</code>. Adding a driver to this path
        couples the GN input to any value source — here the custom property.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# Find the "Amplitude" socket identifier from the GN tree interface
amp_socket = next(
    s for s in nt.interface.items_tree
    if getattr(s, 'name', '') == "Amplitude"
)

# Add driver to the modifier's socket property
fc  = mod.driver_add(f'["{amp_socket.identifier}"]')
drv = fc.driver
drv.type       = 'SCRIPTED'
drv.expression = 'amp'                # single variable, no arithmetic needed

var = drv.variables.new()
var.name             = 'amp'
var.type             = 'SINGLE_PROP'
var.targets[0].id        = obj
var.targets[0].data_path = '["audio_amplitude"]'

# Why SCRIPTED over AVERAGE/MIN/MAX:
# SCRIPTED lets you rename the variable cleanly and add arithmetic later
# (e.g. 'amp * 2.0' for exaggeration) without changing the target setup.`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        GN tree — radial concentric-wave displacement
      </h2>
      <p>
        The Geometry Nodes tree computes{" "}
        <code>z = sin(√(x²+y²) × freq) × amplitude × scale</code> per vertex.
        Radial distance from the grid centre naturally reads as&nbsp;&ldquo;sound
        propagating outward from a point source&rdquo;. Concentric rings remain
        legible as the amplitude decays between beats, distinguishing a silent
        frame from a quiet beat. Compare to a flat Z-lift (no spatial structure)
        or a one-axis standing wave — both lose information about amplitude
        dynamics that the concentric pattern preserves.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# Node chain inside the GN tree
# Position → Separate XYZ → X², Y² → Add → SQRT → radius
# radius × WAVE_FREQ → SINE → × Amplitude (Group Input) → × HEIGHT_SCALE
# → Combine XYZ [Z] → Set Position [Offset]

WAVE_FREQ    = 10.0   # concentric rings per world unit × 2π
HEIGHT_SCALE = 0.7    # max displacement at amplitude = 1.0

# Raising WAVE_FREQ packs more rings onto the grid (sharp ripples).
# Lowering it spreads them out (slow rolling swells).
# WAVE_FREQ × GRID_SCALE / π ≈ number of half-rings visible at rest.`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Synthetic WAV generation
      </h2>
      <p>
        The blueprint synthesises a 6-second 120 BPM kick+snare pattern in pure
        Python using exponentially decaying sine bursts — kick at 60 Hz (beats 1
        &amp; 3), snare at 200 Hz + 4 kHz transient (beats 2 &amp; 4). No
        external audio library is needed. The WAV is written to the OS temp
        directory and regenerated on each blueprint run — it is not committed.
        Drop in any WAV you own and pass its path to{" "}
        <code>wav_rms_per_frame()</code> directly: the rest of the pipeline is
        format-agnostic.
      </p>
      <p className="mt-3">
        The same technique drives spatial audio in the{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-fcurve-modifiers-noise-cycles-stepped"
          className={lk}
        >
          F-Curve Modifiers
        </Link>{" "}
        tutorial&apos;s amplitude-modulated NOISE modifier — the difference is
        that here the amplitude values come from real audio data rather than a
        procedural modifier. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-set-position-noise-displacement"
          className={lk}
        >
          GN Set Position Noise Displacement
        </Link>{" "}
        tutorial covers the Set Position node in detail if the radial-wave GN
        tree warrants further study.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Failure modes</h2>
      <ul className="list-disc list-inside text-sm space-y-1 mt-2">
        <li>
          <strong>Driver not evaluating:</strong> if the GN socket shows a
          constant 0, the identifier string has changed (GN interface was
          modified after driver creation). Delete and re-add the modifier, or
          re-run blueprint.py from scratch — the script always retrieves the
          identifier from the live interface.
        </li>
        <li>
          <strong>Flat mesh at all frames:</strong> check that the custom
          property FCurve exists — Graph Editor → select object → press A. If
          the <code>audio_amplitude</code> curve is missing, the action was not
          attached. Look for an orphan action named &ldquo;AudioAmplitude&rdquo;
          in the Outliner ▸ Blender File ▸ Actions.
        </li>
        <li>
          <strong>struct.error on WAV parse:</strong> confirms the WAV is not
          16-bit PCM. Convert with Audacity: File ▸ Export Audio → WAV
          (Microsoft) → Encoding: Signed 16-bit PCM.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Sources</h2>
      <ul className="list-disc list-inside text-sm space-y-1">
        <li>
          <a
            href="https://docs.blender.org/api/current/bpy.types.Driver.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.Driver — Blender Python API
          </a>{" "}
          — CC-BY-SA 4.0, Blender Foundation. Canonical reference for
          driver types, variable types, and expression evaluation. Related:
          the <code>NodeInterfaceSocketFloat</code> docs detail how GN socket
          identifiers are assigned.
        </li>
        <li>
          <a
            href="https://docs.python.org/3/library/wave.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Python <code>wave</code> module — Python 3 Standard Library
          </a>{" "}
          — PSF Licence, Python Software Foundation. Complete API for reading
          and writing WAV files without external dependencies. Sibling module{" "}
          <code>audioop</code> (removed in 3.13) formerly provided RMS
          computation; the manual calculation here is forward-compatible.
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
          (MIT, Nicolas Janakiev) — idioms for action creation and keyframe
          insertion used as reference; related companion doc{" "}
          <a
            href="https://github.com/njanakiev/blender-scripting/blob/master/docs/animation.md"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            animation.md
          </a>{" "}
          covers custom property animation patterns in detail.
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
        "Scripting workspace — Text Editor",
        "Graph Editor — FCurve inspection",
        "Properties ▸ Object Properties ▸ Custom Properties",
        "Geometry Nodes modifier",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py",
        body: "Scripting workspace → open blueprint.py → Run Script. Info bar confirms '144 frames | peak amplitude baked'. A cyan emission grid appears in the 3D viewport.",
      },
      {
        title: "Inspect the amplitude FCurve",
        body: "Select AudioReactiveMesh. Open Graph Editor → press A to show all FCurves. The audio_amplitude curve pulses: tall spikes on kick frames (1, 13, 25…), lower spikes on snare frames (7, 19, 31…), near-zero between beats.",
      },
      {
        title: "Verify the driver",
        body: "Properties ▸ Modifier ▸ GeometryNodes. The Amplitude input shows a driver icon (purple). Hover and press Ctrl+D to open the driver editor — confirms SCRIPTED driver reading obj[\"audio_amplitude\"].",
      },
      {
        title: "Play the animation",
        body: "Press Space. The grid pulses radial concentric waves: kick beats produce tall dense rings, snare beats produce shorter rings, silence collapses the grid almost flat. Scrub slowly to inspect individual beat frames.",
      },
      {
        title: "Swap the WAV (optional)",
        body: "Replace the wav_path in blueprint.py with any 16-bit PCM WAV. Re-run the script. The amplitude FCurve updates automatically; the GN driver requires no changes.",
      },
      {
        title: "Record viewport animation",
        body: "Scripting workspace → open record.py → Run Script. Output writes to public/library/videos/animation/animation-sound-bake-fcurve-audio-reactive/viewport.mp4 (144 frames, 24 fps, H.264).",
      },
    ],
  },
  {
    slug: "blender-tutorial-animation-sound-bake-fcurve-audio-reactive",
    title:
      "Sound Bake to F-Curve — Audio-Reactive Mesh via WAV Amplitude + Geometry Nodes (Blender 5.1)",
    date: "2026-06-14",
    kind: "tutorial",
    excerpt:
      "Parse a WAV file frame-by-frame in pure Python, keyframe the RMS amplitude onto a custom object property, then drive a Geometry Nodes radial concentric-wave displacement via a Scripted Driver — no UI-context operators required.",
    Body: AnimationSoundBakeFcurveAudioReactiveBody,
  },
);

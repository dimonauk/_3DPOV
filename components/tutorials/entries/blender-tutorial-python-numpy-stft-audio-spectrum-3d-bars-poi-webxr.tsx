import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A Short-Time Fourier Transform (STFT) slices an audio signal into
        overlapping windows and runs an FFT on each — producing a 2-D
        spectrogram where rows are time frames and columns are frequency bins.
        This tutorial maps each time frame directly to a Blender frame, each
        frequency bin to one bar column, and the keyframed Z-scale of that
        column to the FFT magnitude. The result is a 120-frame animated 3D
        frequency-spectrum that exports as a fully-rigged GLB for WebXR — no
        external audio file required, because the signal is synthesised in
        pure Python with numpy.
      </p>

      <h2>Why STFT and not a single FFT?</h2>
      <p>
        A single FFT of the whole signal would give you the{" "}
        <em>average</em> frequency content across all 5 seconds. The STFT
        gives you <em>evolving</em> content: the drone sits in bins 0–3
        throughout, while the chirp&rsquo;s peak bin marches from bin 10 to bin
        20 as it sweeps from 220 Hz to 440 Hz. Compare this to the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-fft-epicycles-fourier-phasor-chain-poi-webxr"
          className={lk}
        >
          FFT Epicycles tutorial
        </Link>
        , which takes a single DFT of a closed path shape and decomposes it
        into rotating phasors — a spatial rather than temporal analysis. STFT
        is the time-domain counterpart: same mathematics, different domain.
      </p>

      <h2>Hann windowing — why it matters</h2>
      <p>
        Feeding a raw rectangular chunk of samples into an FFT causes{" "}
        <strong>spectral leakage</strong>: the discontinuity at the chunk
        edges smears energy across neighbouring bins, making sharp peaks look
        broad and noisy. Multiplying by a Hann window (
        <code>numpy.hanning(WINDOW_SIZE)</code>) tapers both edges to zero,
        eliminating the discontinuity. The trade-off: frequency resolution
        drops by roughly factor 2 (the effective bandwidth of each bin
        doubles). For 32-bar music visualisation that trade-off is entirely
        acceptable — you gain a clean, readable spectrum.
      </p>
      <pre>{`window = numpy.hanning(2048)   # shape (2048,)
spec   = numpy.fft.rfft(chunk * window)  # shape (1025,)
mags   = numpy.abs(spec)[:32]            # first 32 bins: 0–688 Hz`}</pre>

      <h2>Audio synthesis — the synthetic chirp-drone signal</h2>
      <p>
        The blueprint synthesises three components so the .blend is
        self-contained:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Sub-bass drone</strong> — 55 Hz (A1) sine, amplitude 0.55.
          Fills bars 0–3 throughout. Provides the held floor that makes the
          animated chirp feel like it emerges from beneath.
        </li>
        <li>
          <strong>Linear chirp</strong> — starts at 220 Hz (A3), sweeps to
          440 Hz (A4) over 5 seconds, amplitude 0.40. Bin index ≈
          freq&thinsp;/&thinsp;21.5, so it travels from bar 10 (220/21.5) to
          bar 20 (440/21.5). Chirps are generated with the standard quadratic
          phase formula:{" "}
          <code>φ(t) = 2π·(f₀·t + 0.5·(f₁−f₀)/T·t²)</code>.
        </li>
        <li>
          <strong>White noise floor</strong> — amplitude 0.08, seeded
          deterministically via{" "}
          <code>numpy.random.default_rng(42)</code> so every run of the
          blueprint produces the same spectrogram. Scatters low-level energy
          across all bars for visual texture.
        </li>
      </ul>

      <h2>Frame-to-sample alignment</h2>
      <p>
        For Blender frame <em>f</em> (1-indexed), the audio sample at the
        centre of the FFT window is:
      </p>
      <pre>{`centre = int( (f / 24) * 44_100 )`}</pre>
      <p>
        Half the window (1024 samples = 23 ms) is extracted on each side.
        Edges of the signal are zero-padded — the first and last frames have
        partial data but still produce valid magnitude estimates. This is
        intentional: the window rolls on gradually, giving the bars a smooth
        fade-in from silence to full amplitude at frame 1.
      </p>

      <h2>Keyframe insertion loop</h2>
      <p>
        The bar-animation loop is deliberately straightforward. Unlike the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-action-nla-fcurve-keyframe-poi-performance-webxr"
          className={lk}
        >
          NLA performance tutorial
        </Link>{" "}
        which inserts keyframes via{" "}
        <code>bpy.types.Action.fcurves.new()</code> for efficiency,
        <code>keyframe_insert</code> is used here because each bar&rsquo;s
        Z-scale and Z-location must both update per frame, and the two-call
        pattern keeps the code readable:
      </p>
      <pre>{`for f in range(120):
    bpy.context.scene.frame_set(f + 1)
    for idx, bar in enumerate(bars):
        bar.scale.z    = float(mags[f, idx]) * BAR_MAX_Z + 0.05
        bar.location.z = bar.scale.z / 2.0   # keep origin at bottom
        bar.keyframe_insert("scale",    index=2, frame=f + 1)
        bar.keyframe_insert("location", index=2, frame=f + 1)`}</pre>
      <p>
        All keyframe points are set to{" "}
        <code>interpolation = &quot;LINEAR&quot;</code> after insertion.
        Bezier (the Blender default) would smooth between magnitude values —
        destroying the step-function character of a real spectrum and making
        the bars look like they are oscillating independently rather than
        snapping to the instantaneous FFT magnitude.
      </p>

      <h2>The poi reactive sphere</h2>
      <p>
        A second emissive object, <code>Poi_Dot</code>, encodes two pieces of
        spectral data as positional animation:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>X position</strong> = <code>argmax(mags[f])</code> ×
          BAR_WIDTH — the bar with peak energy. As the chirp sweeps, this
          value moves left-to-right across the visualiser.
        </li>
        <li>
          <strong>Z position</strong> = <code>RMS(mags[f])</code> ×
          BAR_MAX_Z — the total loudness. Drops slightly as the chirp energy
          spreads across adjacent bins mid-sweep, then recovers at the
          narrowband peaks.
        </li>
      </ul>
      <p>
        Rendered with motion blur (<code>shutter = 0.5</code>), the sphere
        traces an arc from bar 10 to bar 20 across the 120-frame run — the
        same arc a poi performer would draw in the air if their speed were
        encoded in frequency rather than in physical space. Connecting
        light-painting to signal analysis is the Holoflow intent:{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-van-der-pol-nonlinear-limit-cycle-poi"
          className={lk}
        >
          Van der Pol
        </Link>{" "}
        uses oscillator dynamics; STFT uses audio dynamics. The poi trail is
        the same in both cases.
      </p>

      <h2>GLB export notes</h2>
      <p>
        The 32 bars plus the poi sphere parent to a root empty named{" "}
        <code>hf_spectrum</code>. Draco compression is disabled for this
        export because the bar animations contain dense per-frame scale
        keyframes; Draco degrades float precision on animated attributes in
        ways that produce visible stepping artefacts in the bar heights.
        For static geometry, enable Draco level 6 as usual (see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr"
          className={lk}
        >
          Gray-Scott export pattern
        </Link>{" "}
        for comparison). The GLTF <code>KHR_draco_mesh_compression</code>{" "}
        extension covers geometry, not animation tracks — so Draco off has
        no impact on file size for the animation curves.
      </p>
    </>
  );
}

const data = {
  title:
    "Python numpy — STFT Audio Spectrum: Short-Time Fourier Transform as 3D Bar Visualiser & Poi Reactive Trail (Blender 5.1)",
  lede:
    "Synthesise a chirp-drone signal with numpy, compute a per-frame STFT spectrogram, and keyframe 32 bar columns in Blender from the FFT magnitudes — then track the peak frequency bin with an emissive poi sphere for a light-painting arc.",
  date: "2026-07-25",
  steps: [
    {
      title: "Set parameters",
      body: "Open blueprint.py. N_BARS = 32 covers 0–688 Hz at 21.5 Hz per bin. TOTAL_FRAMES = 120 (5 s at 24 fps). BAR_MAX_Z = 3.5 sets the tallest bar height at peak magnitude. CHIRP_F0 / CHIRP_F1 control the sweep range — try 110→880 Hz for a wider two-octave sweep.",
    },
    {
      title: "Run the script",
      body: "Scripting workspace → Open blueprint.py → ▶ Run Script. The script synthesises ≈ 270 000 samples of audio, computes 120 STFT frames, then inserts 120 × 32 × 2 = 7 680 keyframes. On a 2020-era laptop this takes 8–15 seconds. The console prints the normalised peak magnitude when done.",
    },
    {
      title: "Play the animation",
      body: "Switch to 3D Viewport, Rendered shading (Z → Rendered). Press Spacebar. Bars 0–3 pulse with the sub-bass drone; bars 10–20 show the chirp peak sweeping rightward from frame 1 to frame 120. The orange poi sphere follows the brightest bar — its arc is the STFT peak-tracking path.",
    },
    {
      title: "Adjust Hann window size",
      body: "Change WINDOW_SIZE from 2048 to 512 in blueprint.py and re-run. Smaller window = finer time resolution but coarser frequency resolution (86 Hz/bin instead of 21.5 Hz/bin). The chirp peak moves in larger jumps but responds faster to transients. This is the classic STFT time-frequency uncertainty trade-off.",
    },
    {
      title: "Swap to linear chirp interpolation",
      body: "By default, bar keyframes use LINEAR interpolation (crisp step-function bars). Change kp.interpolation to 'BEZIER' to smoothly interpolate between STFT frames — the bars become fluid ribbons rather than bar charts. Both are valid visualisation choices; BEZIER suits slower, sustained sounds.",
    },
    {
      title: "Export GLB for WebXR",
      body: "The script auto-exports hf_spectrum.glb. Load it in Three.js with AnimationMixer — each bar's scale and location tracks play back at 24 fps. The poi sphere's location track provides the spectrally-reactive position. Add an emissive trail by sampling Poi_Dot's world position each frame and pushing points to a BufferGeometry.",
    },
  ],
  sources: [
    {
      label: "NumPy FFT Documentation (numpy.fft.rfft) — BSD-3-Clause",
      href: "https://numpy.org/doc/stable/reference/generated/numpy.fft.rfft.html",
    },
    {
      label:
        "Blender Python API — keyframe_insert (Blender 5.1) — CC-BY-SA-4.0",
      href: "https://docs.blender.org/api/5.1/bpy.types.Object.html#bpy.types.Object.keyframe_insert",
    },
    {
      label: "Hann Function — Wikipedia — CC-BY-SA-4.0",
      href: "https://en.wikipedia.org/wiki/Hann_function",
    },
  ],
  see_also: [
    {
      label:
        "Python numpy — FFT Epicycles: Fourier-Series Phasor Chain for Poi Light-Painting",
      href: "/tutorials/blender-tutorial-python-numpy-fft-epicycles-fourier-phasor-chain-poi-webxr",
    },
    {
      label:
        "Python bpy — Action & NLA: Programmatic FCurve Keyframe Insertion",
      href: "/tutorials/blender-tutorial-python-bpy-action-nla-fcurve-keyframe-poi-performance-webxr",
    },
    {
      label:
        "GN Simulation Zone — Van der Pol Oscillator: Nonlinear Limit Cycle for Poi",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-van-der-pol-nonlinear-limit-cycle-poi",
    },
    {
      label:
        "Python numpy — Gray-Scott Reaction-Diffusion: Spot & Stripe Turing Patterns for WebXR",
      href: "/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-numpy-stft-audio-spectrum-3d-bars-poi-webxr",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "scripting",
      "animation",
      "audio",
      "signal-processing",
      "webxr",
      "poi",
    ],
    body: Body,
  },
  data,
);

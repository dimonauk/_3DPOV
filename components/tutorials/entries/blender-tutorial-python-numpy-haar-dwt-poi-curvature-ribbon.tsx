import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-fft-epicycles-fourier-phasor-chain-poi-webxr"
          className={lk}
        >
          Fourier phasor-chain tutorial
        </Link>{" "}
        and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-stft-audio-spectrum-3d-bars-poi-webxr"
          className={lk}
        >
          STFT audio spectrum tutorial
        </Link>{" "}
        both decompose signals into frequency components using the Fourier
        transform. The Fourier basis is global — each coefficient describes a
        frequency that is present <em>everywhere</em> in the signal. The
        Discrete Wavelet Transform takes the opposite stance: it decomposes a
        signal into components that are localised in both frequency AND time (or
        space). A spike in the rose-coloured d1 band at a particular arc-length
        position tells you that a rapid curvature change happened precisely there
        — something the DFT cannot tell you without a sliding window.
      </p>

      <h2>The Haar wavelet</h2>
      <p>
        The Haar wavelet is the oldest and simplest orthonormal wavelet. Its
        mother function ψ(t) is 1 on [0, ½) and −1 on [½, 1), zero elsewhere.
        The discrete transform built from this function reduces to pure integer
        arithmetic: at each decomposition level, adjacent pairs of samples are
        averaged (low-pass) and differenced (high-pass):
      </p>
      <pre>{`a[i]  = (s[2i] + s[2i+1]) * INV_SQRT2   ← approximation (trend)
d[i]  = (s[2i] - s[2i+1]) * INV_SQRT2   ← detail (edge / change)

INV_SQRT2 = 1/√2 preserves L² norm:  ‖a‖² + ‖d‖² = ‖s‖²  (Parseval's theorem)`}</pre>
      <p>
        Applying J = 3 levels halves the approximation band three times, yielding
        bands of lengths N/2, N/4, N/8. The four bands together have N
        coefficients — identical to the original signal's length. No information
        is created or destroyed. You can reconstruct the signal exactly by
        reversing the transforms:
      </p>
      <pre>{`Level 1:   s (N)   →  a1 (N/2)  +  d1 (N/2)   ← finest detail
Level 2:  a1 (N/2) →  a2 (N/4)  +  d2 (N/4)   ← medium detail
Level 3:  a2 (N/4) →  a3 (N/8)  +  d3 (N/8)   ← coarsest detail
Result: [a3, d3, d2, d1]  — J+1 = 4 bands, N total coefficients`}</pre>

      <h2>Curvature as the signal</h2>
      <p>
        The poi path P(t) is a 3D spiral. Its curvature κ(i) measures how
        sharply the path bends at sample i. This is computed from the
        Menger formula using central finite differences:
      </p>
      <pre>{`P'  ≈ (P[i+1] - P[i-1]) / 2h           ← tangent vector
P'' ≈ (P[i+1] - 2·P[i] + P[i-1]) / h²  ← curvature vector

κ(i) = |P' × P''| / |P'|³              ← scalar curvature`}</pre>
      <p>
        High κ = tight bend (the poi is snapping direction). Low κ = straight
        glide. The curvature signal is rich: it spikes at the entry and exit
        of each turn, dips in the straight sections, and has a slow oscillation
        imposed by the sinusoidal radial perturbation.
      </p>

      <h2>From coefficients to visible ribbons</h2>
      <p>
        Each wavelet band has fewer samples than the path — d1 has N/2, d3 has
        N/8. To place them as Bezier curve control points alongside the path,
        all bands are linearly up-sampled to N/2 via{" "}
        <code>numpy.interp</code>. Each ribbon is offset laterally from the
        ghost path using the Frenet normal at each point; the bevel radius at
        each control point is set proportional to the absolute coefficient
        value via <code>bezier_point.radius</code>. The ribbon is therefore
        physically thin where the curvature is smooth and fat where rapid
        changes are detected — a tangible multi-scale analysis you can tumble
        and examine in the 3D Viewport.
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-to-mesh-ribbon-trim-tilt-webxr"
          className={lk}
        >
          GN ribbon tutorial
        </Link>{" "}
        and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-biot-savart-magnetic-field-line-tracer-poi-webxr"
          className={lk}
        >
          Biot-Savart field-line tracer
        </Link>{" "}
        both use the same bevel-depth-on-curve technique. The difference here
        is that the bevel is non-uniform — a per-point radius rather than a
        single global value — which requires the BEZIER spline type rather
        than POLY.
      </p>

      <h2>Colour coding</h2>
      <p>
        Four emission materials distinguish the frequency bands at a glance:
        white for the approximation a3 (overall shape trend), cerulean for d3
        (slow oscillations), jade for d2 (medium-speed changes), and rose for
        d1 (fastest local flicks). In rendered view the four ribbons glow
        against a dark environment — the result looks like a frequency
        spectrum dissolved into the physical path.
      </p>
    </>
  );
}

const data = {
  title:
    "Python numpy — Haar DWT: Multi-Scale Poi Curvature Decomposition into Frequency-Band Light Ribbons",
  lede:
    "Implement the Haar Discrete Wavelet Transform from first principles with numpy, decompose the discrete curvature of a spiralling poi path into four localised frequency bands, and render each band as a variable-bevel BEZIER ribbon that pulses with its wavelet coefficient magnitude.",
  date: "2026-07-25",
  steps: [
    {
      title: "Open Blender 5.1 — Scripting workspace",
      body: "New General file. Click the Scripting tab in the top header. Click New in the text editor. Verify numpy is available: type import numpy; print(numpy.__version__) and press Alt+P — you should see 1.26.x or later in the System Console.",
    },
    {
      title: "Paste and run blueprint.py",
      body: "Copy blueprint.py into the text editor. Press Alt+P. The System Console (Window → Toggle System Console on Windows) prints four lines: band name, coefficient count, and ribbon control-point count. Runtime is under 2 seconds on any modern CPU.",
    },
    {
      title: "Inspect the four ribbons",
      body: "Press Z → Material Preview. Press Numpad 7 for top orthographic view — the four colour-coded ribbons fan out laterally around the grey ghost path. The white a3 ribbon should be the thickest near the spiral's turning points where the overall curvature is highest. The rose d1 ribbon should be thinner overall but with tiny high-frequency spikes.",
    },
    {
      title: "Understand the coefficient magnitudes",
      body: "Select the DWT_d1 ribbon (rose). In the Item tab (N panel), note bevel_depth = 0.12. This is the SCALE constant; actual per-point depth is bevel_depth × normalised_coefficient. Press Tab to enter Edit Mode — each control point shows its radius as a tiny circle. Points near path kinks are visibly fatter.",
    },
    {
      title: "Increase perturbation amplitude",
      body: "Change PERTURB_AMP = 0.35 to 0.70 in the parameters block and re-run. The d2 and d3 bands widen dramatically because the sinusoidal perturbation operates at exactly the scale those bands resolve. The a3 band shifts shape. This demonstrates that the DWT resolves which scale is responsible for a given curvature pattern.",
    },
    {
      title: "Increase decomposition depth",
      body: "Change J = 3 to J = 4 and re-run. This adds a fourth detail band d4 (the script allocates a new entry in BAND_COLOURS; add a fifth colour entry, e.g. (1.0, 0.5, 0.0, 1.0), and a fifth name 'DWT_d4' before re-running). The original d3 band becomes d4 and a new d3 appears at half its original length.",
    },
    {
      title: "Record viewport animation",
      body: "Open record.py in a second text editor tab. Press Alt+P. The script adds a 270° orbiting camera and renders a 120-frame viewport animation to public/library/videos/scripting/python-numpy-haar-dwt-poi-curvature-ribbon/viewport.mp4. The orbit makes all four bands visible from every angle.",
    },
    {
      title: "Record screen tutorial with OBS",
      body: "Follow SCREEN-RECORDING-NOTES.md. Capture steps 3–6 above with the System Console visible in a split layout. Recommended duration: 4–5 minutes.",
    },
  ],
  troubleshooting: [
    {
      symptom: "All four ribbons are the same constant thickness",
      cause:
        "The bevel radius on BEZIER control points defaults to 1.0, not to the value set in the script. This can happen if the script ran but threw a Python exception partway through.",
      fix: "Check the System Console for a traceback. The most likely cause is that N is not divisible by 2^J (e.g. N=500 with J=3 — 500/8 = 62.5). Ensure N is a power of 2 or at least divisible by 2^J.",
    },
    {
      symptom: "DWT_d1 ribbon is nearly invisible",
      cause:
        "The path has very low high-frequency curvature — the perturbation frequency is too slow relative to the band. This is expected for smooth paths.",
      fix: "Add high-frequency noise to the path by including a second PERTURB term with amplitude 0.05 and frequency 20.0 radians/turn. The d1 band will then show visible detail.",
    },
    {
      symptom: "RuntimeError: N is not divisible by 2^J",
      cause:
        "The Haar transform requires each successive halving to produce an integer length. N=512 and J=3 gives 64 — fine. N=512 and J=4 gives 32 — also fine. But N=300 and J=3 gives 37.5 — invalid.",
      fix: "Keep N a power of 2 (256, 512, 1024) or at minimum a multiple of 2^J. The script does not enforce this at runtime; add an assert N % (2**J) == 0 after the parameters block.",
    },
    {
      symptom: "Ribbons overlap — hard to distinguish bands",
      cause:
        "LATERAL_GAP is too small relative to the spiral radius.",
      fix: "Increase LATERAL_GAP from 0.55 to 0.90. Alternatively, reduce RADIUS to 1.0 to tighten the spiral and give the same absolute gap more visual separation.",
    },
  ],
  externalLinks: [
    {
      label:
        "PyWavelets — Open-source wavelet transform library for Python — MIT licence — PyWavelets Contributors",
      href: "https://github.com/PyWavelets/pywt",
    },
    {
      label:
        "NumPy Documentation — numpy.interp, array slicing — BSD-3-Clause — NumPy Developers",
      href: "https://numpy.org/doc/stable/reference/generated/numpy.interp.html",
    },
    {
      label:
        "Mallat, S. (1989). A Theory for Multiresolution Signal Decomposition: the Wavelet Representation. IEEE PAMI 11(7):674-693. Foundational wavelet paper.",
      href: "https://ieeexplore.ieee.org/document/192463",
    },
  ],
  relatedTutorials: [
    {
      label:
        "Python numpy — FFT Epicycles: Fourier-Series Phasor Chain, DFT Coefficient Ordering & Depsgraph Trail for Poi Light-Painting",
      href: "/tutorials/blender-tutorial-python-numpy-fft-epicycles-fourier-phasor-chain-poi-webxr",
    },
    {
      label:
        "Python numpy STFT — Audio Spectrum 3D Bar Visualiser: Short-Time Fourier Transform keyed to Blender animation bars & Poi Reactive Trail",
      href: "/tutorials/blender-tutorial-python-numpy-stft-audio-spectrum-3d-bars-poi-webxr",
    },
    {
      label:
        "GN Curve to Mesh — Trim, Tilt & Radius Ramp: Light Ribbon Prop for WebXR",
      href: "/tutorials/blender-tutorial-gn-curve-to-mesh-ribbon-trim-tilt-webxr",
    },
    {
      label:
        "Python bpy — Biot-Savart Magnetic Field-Line Tracer: Helix Wire Current → RK4 Integration → Light-Painting Curves for WebXR",
      href: "/tutorials/blender-tutorial-python-bpy-biot-savart-magnetic-field-line-tracer-poi-webxr",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-numpy-haar-dwt-poi-curvature-ribbon",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "scripting",
      "signal-processing",
      "mathematics",
      "poi",
      "animation",
    ],
    body: Body,
  },
  data,
);

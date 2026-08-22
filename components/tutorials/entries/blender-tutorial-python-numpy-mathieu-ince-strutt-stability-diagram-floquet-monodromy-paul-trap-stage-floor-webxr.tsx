import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-mathieu-ince-strutt-stability-diagram-floquet-monodromy-paul-trap-stage-floor-webxr";

function Body() {
  return (
    <>
      <p>
        The Mathieu equation <code>ẍ + (a − 2q cos 2t) x = 0</code> is the
        simplest Hill equation: a linear oscillator whose restoring constant
        oscillates cosinusoidally at twice the natural frequency. The two
        parameters are easy to interpret: <em>a</em> is the time-averaged
        spring constant (squared natural frequency), and <em>q</em> is the
        modulation depth — how hard the spring is being pumped. Edward Lindsay
        Ince tabulated the boundary curves in 1927; Marshall Harvey Strutt
        extended them in 1932. The resulting chart in (a, q) space is the
        Ince–Strutt diagram: a map of stability tongues separated by instability
        bands where amplitude grows without bound.
      </p>
      <p>
        The diagram matters beyond pure mathematics. A Paul ion trap — the
        device that won Wolfgang Paul the 1989 Nobel Prize in Physics — confines
        charged particles by superimposing a static and an oscillating electric
        field. The equations of motion for each spatial axis are Mathieu
        equations, and the trap works only when the operating point (a, q) lies
        inside the first stability triangle (the cobalt region near the origin).
        The trap is essentially a machine for parking a point inside an
        Ince–Strutt diagram.
      </p>

      <h2>Floquet theory and the monodromy matrix</h2>
      <p>
        Floquet's theorem (1883) states that any linear system{" "}
        <code>ẋ = A(t) x</code> with T-periodic coefficients has a fundamental
        matrix of the form <code>Φ(t) = P(t) e^{Bt}</code>, where P is
        T-periodic and B is constant. All long-term behaviour is encoded in one
        matrix: the <em>monodromy matrix</em> M = Φ(T, 0), which maps the
        state at the start of a period to the state at the end.
      </p>
      <p>
        For the Mathieu equation over one half-period T = π:
      </p>
      <ul>
        <li>
          Integrate two fundamental solutions: c(t) with c(0) = 1, c′(0) = 0,
          and s(t) with s(0) = 0, s′(0) = 1.
        </li>
        <li>
          M = [[c(π), s(π)], [c′(π), s′(π)]].
        </li>
        <li>
          The Wronskian det(M) = 1 exactly (verified in the script console), so
          the two Floquet multipliers ρ satisfy ρ₁ρ₂ = 1.
        </li>
        <li>
          Stability criterion: |tr(M)/2| ≤ 1. When satisfied both multipliers
          lie on the unit circle (bounded oscillations). When violated one
          satisfies |ρ| &gt; 1 (exponential growth, parametric resonance).
        </li>
        <li>
          Growth rate: λ/π = cosh⁻¹(|tr(M)/2|) / π when unstable; zero
          otherwise.
        </li>
      </ul>
      <p>
        The trace shortcut is why computing two scalar trajectories is
        sufficient: we never need to store the full monodromy matrix, only c(π)
        and s′(π).
      </p>

      <h2>Vectorised RK4 across the parameter grid</h2>
      <p>
        Naïvely this is a nested loop: for each (a, q) pair, run an ODE
        integrator for N_STEPS steps. With a 160 × 140 grid and 400 steps that
        is 9 million ODE evaluations — in Python that would take minutes. The
        blueprint avoids it entirely.
      </p>
      <p>
        The state arrays c and s are shaped (160, 140, 2): all parameter pairs
        simultaneously. At each RK4 sub-step the Mathieu coefficient{" "}
        <code>g = A − 2Q cos(2t)</code> is a (160, 140) broadcast array.
        The right-hand side{" "}
        <code>[v, −g · x]</code> is three numpy operations on 22,400-element
        arrays. The only Python loop is the 400 time-step loop; NumPy executes
        each step in C, dropping wall-clock time below three seconds on a
        mid-range laptop.
      </p>
      <p>
        This is the same strategy used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr"
          className={lk}
        >
          Duffing oscillator tutorial
        </Link>{" "}
        and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-henon-heiles-hamiltonian-kam-tori-poincare-section-poi-webxr"
          className={lk}
        >
          Hénon–Heiles tutorial
        </Link>
        : vectorise over parameters, not over time, so the integrator runs
        once.
      </p>

      <h2>The height-field mesh</h2>
      <p>
        The growth array (160 × 140) maps directly to a rectangular terrain
        mesh. The a-parameter runs along world-X (0 → 5 m), q runs along
        world-Y (0 → 4 m), and the growth rate λ/π sets the height after
        normalisation to H_SCALE = 0.45 m. The quad face list is built entirely
        with vectorised index arithmetic — no Python loop over cells.
      </p>
      <p>
        Vertex colour uses a three-stop ramp: cobalt (0.02, 0.20, 0.72) for
        λ = 0, white at the tongue boundary, amber (0.95, 0.52, 0.04) for high
        growth. The two shape keys SK_Exaggerated (z × 2.5) and SK_Flat (z = 0)
        let the viewer exaggerate tongue height or collapse to a plan-view
        colour map.
      </p>

      <h2>Arnold tongues and parametric resonance connection</h2>
      <p>
        The instability tongues of the Mathieu equation are the linear-ODE
        precursors of the Arnold tongues in circle maps (the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-arnold-tongue-circle-map-mode-locking-poi-disc-webxr"
          className={lk}
        >
          Arnold tongue tutorial
        </Link>{" "}
        plots these for a nonlinear map). The Mathieu tongues sit at
        a ≈ n² for integer n: at q = 0 the system is a harmonic oscillator at
        frequency √a, and tongue n touches this axis where √a = n, i.e. a = n².
        Forcing at frequency 2 drives the n = 1 resonance; forcing at frequency
        1 drives n = 2; and so on — parametric resonance occurs when the
        forcing frequency is a rational multiple of the natural frequency.
      </p>
      <p>
        The Bloch–Floquet theorem in solid-state physics is the same mathematics
        applied to the Schrödinger equation in a periodic potential: electron
        band gaps correspond precisely to the Mathieu instability tongues, with
        the crystal lattice playing the role of the periodic forcing.
      </p>

      <h2>Bench steps</h2>
      <ol>
        <li>
          Open Blender 5.1. Switch to the Scripting workspace. Paste or open{" "}
          <code>blueprint.py</code>.
        </li>
        <li>
          Press Alt+P (Run Script). The console should report something like:
          <pre>{`Stable   : 13,120/22,400  (58.6 %)
Unstable : 9,280/22,400  (41.4 %)
Max λ/π  : 1.78352`}</pre>
          The exact split depends on grid resolution but should be roughly 60/40
          stable/unstable.
        </li>
        <li>
          In the 3-D viewport, press Numpad 7 (top view). You should see the
          colour map: three amber tongues separated by cobalt triangles. The
          widest tongue occupies the lower-left (n=0), the next (n=1) begins
          near x = 0.56 m (a ≈ 1).
        </li>
        <li>
          Press Numpad 1 (front view) then orbit 45°. The amber ridges now read
          as mountain ranges, tallest at the n=0 centre and progressively lower
          for n=1, n=2.
        </li>
        <li>
          Select the mesh. In Properties → Object Data → Shape Keys, scrub
          SK_Exaggerated from 0 to 1. The ridges amplify 2.5×, making the
          three-tongue hierarchy unmistakable.
        </li>
        <li>
          Scrub SK_Flat to 1 and SK_Exaggerated to 0. The surface flattens —
          the Ince–Strutt diagram as a purely 2-D colour map, readable as a
          reference chart.
        </li>
        <li>
          The .blend and .glb files land next to the script. The GLB is
          Draco-6 compressed with WebP textures and two morph targets for
          WebXR.
        </li>
      </ol>

      <h2>Failure modes and fixes</h2>
      <ul>
        <li>
          <strong>All cobalt, no tongues visible:</strong> A_MIN or A_MAX is
          wrong, or N_STEPS is too low (try 200 first). Check the console
          growth stats.
        </li>
        <li>
          <strong>Slow computation:</strong> Reduce N_A × N_Q (try 80 × 70).
          The vectorised RK4 is fast even at full resolution on most hardware;
          the bottleneck is more likely the Blender mesh-from-pydata call.
        </li>
        <li>
          <strong>Shape-key vertex count mismatch:</strong> This should not
          occur because shape-key arrays are pre-computed from the same
          verts_np array. If it does, restart Blender and run blueprint.py in
          a clean session.
        </li>
        <li>
          <strong>GLB export error on shape keys:</strong> Confirm
          export_morph=True is set and that the mesh has at least one shape key
          beyond Basis.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <p>Related studio work:</p>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-simulation-zone-coupled-pendulums-mathieu-resonance"
            className={lk}
          >
            GN — Coupled Pendulums &amp; Mathieu Resonance
          </Link>{" "}
          — Geometry Nodes simulation of the physical system this diagram
          describes: 20 pendulums on a parametrically driven pivot, where
          resonance tongues appear as runaway amplitude chains.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-arnold-tongue-circle-map-mode-locking-poi-disc-webxr"
            className={lk}
          >
            Arnold Tongue Circle Map
          </Link>{" "}
          — the nonlinear analogue: mode-locking regions in a driven
          nonlinear oscillator form Arnold tongues that are the continuous
          generalisation of the Mathieu instability bands.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-simulation-zone-van-der-pol-nonlinear-limit-cycle-poi"
            className={lk}
          >
            Van der Pol Oscillator
          </Link>{" "}
          — adds nonlinear damping to the parametric picture: the limit
          cycle competes with the resonance growth.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          NIST Digital Library of Mathematical Functions §28 — Mathieu Functions
          and Hill&apos;s Equation. Volkmer H, in Olver FWJ et al (eds), NIST
          DLMF 2010. Public Domain (US Government).{" "}
          <a
            href="https://dlmf.nist.gov/28"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            dlmf.nist.gov/28
          </a>
          . Related: NIST Handbook of Mathematical Functions (Cambridge UP 2010);
          Abramowitz &amp; Stegun Chapter 20 (1964, PD).
        </li>
        <li>
          NumPy Developers — BSD-3-Clause.{" "}
          <a
            href="https://numpy.org/doc/stable/"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            numpy.org/doc/stable/
          </a>
          . Related:{" "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/numpy/numpy
          </a>
          . SciPy provides Mathieu characteristic values via{" "}
          <code>scipy.special.mathieu_a</code> / <code>mathieu_b</code> (BSD-3-Clause,{" "}
          <a
            href="https://github.com/scipy/scipy"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/scipy/scipy
          </a>
          ).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Mathieu Equation: Ince–Strutt Stability Diagram, Floquet Monodromy Matrix & Parametric-Resonance Ridge Stage Floor for WebXR",
  description:
    "Vectorised Floquet monodromy over a 160×140 (a, q) grid — two " +
    "fundamental solutions integrated in parallel via RK4 numpy broadcast — " +
    "extruded into a cobalt-valley / amber-ridge terrain that reads as the " +
    "classical Ince–Strutt chart, with SK_Exaggerated and SK_Flat shape keys.",
  tags: [
    "blender",
    "python",
    "numpy",
    "mathieu-equation",
    "floquet-theory",
    "monodromy-matrix",
    "parametric-resonance",
    "ince-strutt",
    "paul-trap",
    "stage-floor",
    "height-field",
    "webxr",
    "glb",
  ],
  date: "2026-08-22",
  blenderVersion: "5.1",
  libraryPath:
    "public/library/blends/scripting/python-numpy-mathieu-ince-strutt-stability-diagram-floquet-monodromy-paul-trap-stage-floor-webxr",
  Body,
});

import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-kuramoto-sivashinsky-pde-spatiotemporal-chaos-etd2rk-spectral-flame-front-stage-floor-webxr";

const TITLE =
  "Python numpy — Kuramoto–Sivashinsky PDE (1977/1978): Spatiotemporal Chaos, " +
  "ETD2RK Pseudo-Spectral Integration & Flame-Front Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "The Kuramoto–Sivashinsky equation is the minimal one-dimensional PDE that combines " +
  "a long-wave instability, short-wave damping, and nonlinear saturation into genuine " +
  "spatiotemporal chaos. It was derived independently to describe propagating chemical " +
  "waves and unstable flame fronts, and it remains one of the most-studied PDE attractors " +
  "in applied mathematics. This blueprint integrates the equation pseudo-spectrally using " +
  "ETD2RK — an exponential time-differencing scheme that handles the stiff fourth-order " +
  "linear operator exactly — and records 64 time snapshots across a 128-node periodic domain, " +
  "assembling the space–time Hovmöller diagram as a WebXR stage floor. Four shape keys " +
  "sweep the domain length from near-onset quasi-regular waves through to dense many-cell turbulence.";

function Body() {
  return (
    <>
      <p>
        Most PDEs you encounter in undergraduate physics are either stable (the solution
        decays to zero) or unstable (it grows without bound). Real pattern-forming systems
        sit in a narrow corridor between those extremes: a mechanism that amplifies certain
        wavelengths and a separate mechanism that damps others, with a nonlinearity that
        shuffles energy between scales to prevent divergence. The Kuramoto–Sivashinsky
        equation is the simplest 1-D PDE with exactly that architecture.
      </p>

      <h2>Equation and term analysis</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`u_t = −u_xxxx − u_xx − u·u_x

Term by term (Fourier mode with wavenumber k):

  −u_xxxx  →  −k⁴ û    (hyper-diffusion: always damping, strongest at high k)
  −u_xx    →  +k² û    (anti-diffusion: growth at k < 1, decay at k > 1)
  −u·u_x   →  nonlinear: shuffles energy upward from unstable to stable band

Net linear rate: L̂(k) = k² − k⁴
  • k < 1:  L̂ > 0  → exponential growth (long waves amplified)
  • k = 1:  L̂ = 0  → neutral
  • k > 1:  L̂ < 0  → exponential decay (short waves suppressed)

Fastest growing mode:  d/dk (k² − k⁴) = 0  →  k_c = 1/√2 ≈ 0.707
Maximum growth rate:   L̂(k_c) = 1/4

Instability threshold: on domain [0, L] with periodic BC, the lowest available
wavenumber is k_min = 2π/L.  Instability requires k_min < 1, i.e. L > 2π ≈ 6.28.
Chaos requires enough unstable modes: L ≳ 20 (roughly L > 3·2π).`}
      </pre>

      <h2>Why ETD2RK and not explicit RK4?</h2>
      <p>
        The stability limit for explicit Runge–Kutta on a stiff linear operator scales as
        dt&nbsp;&lt;&nbsp;C&nbsp;/&nbsp;|L̂<sub>max</sub>|. For this grid (NX&nbsp;=&nbsp;128,
        L&nbsp;=&nbsp;64) the highest wavenumber is k<sub>max</sub>&nbsp;=&nbsp;π·NX/L
        ≈&nbsp;6.28, giving |L̂<sub>max</sub>|&nbsp;=&nbsp;k<sub>max</sub>⁴&nbsp;≈&nbsp;1558.
        An explicit scheme needs dt&nbsp;≲&nbsp;1.8 × 10⁻³. To warm up 1&thinsp;200 steps
        that costs ~666&thinsp;000 function evaluations. ETD2RK folds the linear part into
        an integrating factor e<sup>L̂·h</sup> that is evaluated once at setup time, freeing
        the time step to be chosen purely on accuracy grounds: dt&nbsp;=&nbsp;0.25 is stable
        for all four domain lengths here.
      </p>

      <h2>The ETD2RK scheme</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# Precomputed matrices (per Fourier mode k):
E     = exp(L_hat · dt)           # integrating factor, full step
E_h   = exp(L_hat · dt/2)         # integrating factor, half step
φ₁(z) = (e^z − 1) / z             # ≈ 1 for |z| < 10⁻⁸ (Taylor limit)

# Dealiased nonlinear evaluation (2/3 rule):
N̂(û) = −(ik/2) · rfft(irfft(û)²)   [modes > NX//3 zeroed]

# ETD2RK step (Heun's predictor-corrector lifted to exponential factors):
N1      = N̂(û_n)
ŵ       = E_h · û_n + φ₁(L·h/2) · N1    # predictor: ETD-Euler half-step
N2      = N̂(ŵ)
û_{n+1} = E   · û_n + φ₁(L·h)   · N2    # corrector: full step with stage-2 N

Why Heun here rather than the classic Cox–Matthews formula?
  The full Cox–Matthews ETD2RK uses both N1 and N2 in the corrector via
  φ₂(z) = (e^z − 1 − z) / z² weights.  The Heun variant (predictor N1 at h/2,
  corrector uses only N2) is equivalent in order (second-order in time) and
  simpler to implement while remaining stable.  For visual-quality KS
  simulations the difference is indistinguishable.`}
      </pre>

      <h2>Space–time (Hovmöller) floor layout</h2>
      <p>
        Rather than animating the 1-D field over time as a moving curve, we bake
        the entire trajectory into a static 2-D height field: x-axis = spatial
        position on [0, L], y-axis = time, z-axis = u(x, t) amplitude. This
        &ldquo;Hovmöller diagram&rdquo; is a standard meteorology display technique that
        makes the propagation velocity and cell-merging events immediately readable
        from the geometry. In WebXR the visitor can walk along the time axis.
      </p>

      <h2>Shape keys and what they reveal</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis   L = 64  →  ~8 active cells; chaotic merging and birth events
SK_Onset L = 22  →  2-cell quasi-regular travelling wave (near bifurcation)
SK_Short L = 32  →  3–4 cell sparse chaos; longer-lived coherent structures
SK_Long  L = 96  →  12+ cells; dense turbulence, fast cell replacement

KS_Velocity FLOAT_COLOR:
  cobalt (0.06, 0.14, 0.66) → u = min  (valleys, trough regions)
  amber  (0.88, 0.52, 0.04) → u = max  (ridges, advancing fronts)`}
      </pre>

      <h2>Running blueprint.py</h2>
      <ol>
        <li>
          Open Blender 5.1 → Scripting workspace. Load or paste{" "}
          <code>blueprint.py</code>.
        </li>
        <li>
          Click <strong>Run Script</strong>. Each{" "}
          <code>_solve_ks()</code> call takes ~5 s on a modern CPU (four
          calls total, one per shape key). Watch the console for vertex counts.
        </li>
        <li>
          Save the file as <code>ks_flame_floor.blend</code>, then run{" "}
          <code>record.py</code> to render the viewport animation.
        </li>
      </ol>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Floor looks flat:</strong> the HEIGHT constant (0.55 m) is scaled
          relative to max |u|. For SK_Onset the field amplitude is smaller — this is
          correct: near-onset waves have less nonlinear saturation.
        </li>
        <li>
          <strong>Blurry colour gradient:</strong> confirm the material uses{" "}
          <code>ShaderNodeAttribute</code> → <code>KS_Velocity</code> rather than a
          UV map. FLOAT_COLOR is vertex-interpolated, not texture-sampled.
        </li>
        <li>
          <strong>Aliasing artifacts (jagged diagonal stripes):</strong> the 2/3 rule
          in <code>nonlinear_hat()</code> should eliminate these. Check that{" "}
          <code>dmask[alias_cut:]&nbsp;=&nbsp;0</code> is applied before and after
          the physical-space squaring step.
        </li>
        <li>
          <strong>NaN or Inf in snapshots:</strong> the ETD2RK scheme is
          unconditionally stable for the linear part but can blow up if the
          nonlinear term produces extreme values at t=0. Reduce IC amplitude from
          0.5 / 0.3 / 0.1 to 0.2 / 0.1 / 0.05 and the warm-up will damp it.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            className={lk}
            href="https://doi.org/10.1016/0094-5765(77)90096-0"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sivashinsky (1977) — Nonlinear analysis of hydrodynamic instability in
            laminar flames, <em>Acta Astronaut</em> 4(11–12):1177–1206
          </a>{" "}
          (equations public domain). Related: Sivashinsky&rsquo;s later work on
          pattern selection in combustion.
        </li>
        <li>
          <a
            className={lk}
            href="https://doi.org/10.1143/PTP.55.356"
            target="_blank"
            rel="noopener noreferrer"
          >
            Kuramoto &amp; Tsuzuki (1976) — Persistent propagation of concentration
            waves, <em>Prog Theor Phys</em> 55(2):356–369
          </a>{" "}
          (equations public domain). Related:{" "}
          <a
            className={lk}
            href="https://github.com/spectralDNS/spectralDNS"
            target="_blank"
            rel="noopener noreferrer"
          >
            spectralDNS (MIT)
          </a>{" "}
          and its sibling{" "}
          <a
            className={lk}
            href="https://github.com/spectralDNS/shenfun"
            target="_blank"
            rel="noopener noreferrer"
          >
            shenfun (MIT)
          </a>{" "}
          — pseudo-spectral solver frameworks from the same group.
        </li>
        <li>
          <a
            className={lk}
            href="https://doi.org/10.1006/jcph.2002.6995"
            target="_blank"
            rel="noopener noreferrer"
          >
            Cox &amp; Matthews (2002) — Exponential time differencing for stiff
            systems, <em>J Comput Phys</em> 176(2):430–455
          </a>{" "}
          (equations public domain). ETD2RK algorithm used in blueprint.py.
        </li>
        <li>
          <a
            className={lk}
            href="https://numpy.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            NumPy (BSD-3-Clause)
          </a>{" "}
          — <code>rfft</code>, <code>irfft</code>, <code>rfftfreq</code>, vectorised
          array operations.
        </li>
      </ul>

      <h2>Related studio content</h2>
      <ul>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-brusselator-prigogine-lefever-1968-turing-instability-hopf-dissipative-stage-floor-webxr">
            Brusselator PDE — Turing Instability &amp; Dissipative Structures Stage Floor
          </Link>{" "}
          — 2-D reaction-diffusion; compare Turing patterns with KS&rsquo;s 1-D chaos.
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-swift-hohenberg-pde-hexagonal-rolls-benard-convection-stage-floor-webxr">
            Swift–Hohenberg PDE — Bénard Convection Rolls Stage Floor
          </Link>{" "}
          — another pattern-forming PDE sharing KS&rsquo;s long-wave instability
          mechanism, but with a preferred wavenumber that selects periodic rolls.
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-fermi-pasta-ulam-tsingou-recurrence-anharmonic-chain-alpha-fpu-stage-floor-webxr">
            Fermi–Pasta–Ulam–Tsingou Recurrence — Anharmonic Chain Stage Floor
          </Link>{" "}
          — 1-D nonlinear wave chain; Hovmöller layout identical in spirit,
          recurrence instead of chaos.
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-rayleigh-taylor-instability-2d-boussinesq-vorticity-streamfunction-spectral-height-field-stage-floor-webxr">
            Rayleigh–Taylor Instability — Pseudo-Spectral Height-Field Stage Floor
          </Link>{" "}
          — 2-D fluid PDE, same ETD/spectral solver family.
        </li>
      </ul>
    </>
  );
}

const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: new Date("2026-09-01"),
  tags: [
    "blender",
    "blender-5-1",
    "python",
    "numpy",
    "pde",
    "kuramoto-sivashinsky",
    "spatiotemporal-chaos",
    "etd2rk",
    "pseudo-spectral",
    "stage-floor",
    "webxr",
    "scripting",
    "flame-front",
  ],
  body: Body,
});

export default entry;

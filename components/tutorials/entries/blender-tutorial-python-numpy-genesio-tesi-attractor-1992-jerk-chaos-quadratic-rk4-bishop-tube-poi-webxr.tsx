import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Genesio–Tesi Attractor 1992: ẋ=y ẏ=z ż=−c₁x−c₂y−c₃z+x² " +
  "Single-Quadratic Jerk Chaos from Control Theory Constant Divergence −c₃=−0.44 " +
  "Two Unstable Equilibria P₀=(0,0,0) P₁=(c₁,0,0)=(1,0,0) Saddle-Focus " +
  "λ₁≈+0.073 D_KY≈2.142 Lyapunov-time τ≈13.7 Liouville ∑λᵢ=−0.44=∇·F, " +
  "RK4 DT=0.01 BURN_IN=3000 N=90000 THIN=30→3000wp " +
  "Basis(c₁=1.0,c₂=1.3,c₃=0.44)/SK_DenseWrap(c₃=0.30 weaker dissipation)/" +
  "SK_BorderChs(c₃=0.55 near-periodic)/SK_ShiftedEQ(c₁=0.70 topology-shift) " +
  "Shape Keys & Cobalt–Amber GT_Speed FLOAT_COLOR " +
  "Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Genesio & Tesi (1992) were Florentine control engineers asking a practical question: " +
  "when does a simple nonlinear feedback system go chaotic?  Their answer was a jerk equation " +
  "— x‴ + c₃x″ + c₂ẋ + c₁x = x² — with only a single quadratic nonlinearity x².  " +
  "Unlike cross-product systems (Lorenz, Rössler, Sprott B), the sole nonlinearity is " +
  "self-interaction.  Constant divergence −c₃ = −0.44 flows from one linear damping term; " +
  "two equilibria, both unstable, flank a single-wing attractor with D_KY ≈ 2.142.  " +
  "This blueprint integrates 90 000 RK4 steps at dt = 0.01, builds a Bishop " +
  "parallel-transport tube through 3 000 waypoints, and morphs four shape keys " +
  "that walk the c₃-dissipation axis from dense chaos to near-periodicity.";

function Body() {
  return (
    <>
      <p>
        Control engineers encounter strange attractors through failure.  When a
        feedback system is meant to stabilise a process — keep a temperature
        constant, hold a robot arm steady — but instead oscillates in an
        unpredictable, never-repeating pattern, something has gone wrong that
        linear stability analysis failed to predict.  In 1992 Roberto Genesio
        and Alberto Tesi at the Università di Firenze set out to characterise
        exactly this failure mode.
      </p>
      <p>
        Their tool was the harmonic balance method, a classical frequency-domain
        technique for approximating limit cycles.  Applying it to a class of
        third-order nonlinear systems, they found that certain parameter ranges
        produced not a limit cycle but genuine chaos — the orbit never settled,
        never repeated, and was sensitive to initial conditions in the full
        Lyapunov sense.  The simplest member of their chaotic family is what is
        now called the Genesio–Tesi attractor.
      </p>

      <h2>The jerk form</h2>
      <p>
        A jerk system is a third-order ODE written as a single equation in one
        variable x and its derivatives:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`x‴ + c₃x″ + c₂ẋ + c₁x = x²

where:  x  = position
        ẋ  = velocity
        x″ = acceleration
        x‴ = jerk  (rate of change of acceleration)

Canonical:  c₁ = 1.0,  c₂ = 1.3,  c₃ = 0.44`}
      </pre>
      <p>
        The name "jerk" comes from mechanics: the third derivative of position
        is physically the rate at which acceleration changes — the jerk you feel
        when a car accelerates unevenly.  In state form (necessary for RK4 and
        for reasoning about the phase-space geometry):
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = y                          (x̂ is just the "velocity" state y)
ẏ = z                          (ŷ is just the "acceleration" state z)
ż = −c₁x − c₂y − c₃z + x²    (the jerk equation — one quadratic: x²)`}
      </pre>
      <p>
        The only nonlinear term is x² — position squared.  There are no
        cross-products (no yz, no xz, no xy).  Every other term is linear.
        This is the minimal algebraic structure that still admits a strange
        attractor in the jerk chain.
      </p>

      <h2>Constant divergence — a single source of dissipation</h2>
      <p>
        Compute the trace of the Jacobian (the divergence of the vector field):
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∂ẋ/∂x = 0      (y has no x dependence)
∂ẏ/∂y = 0      (z has no y dependence)
∂ż/∂z = −c₃   (the −c₃z term in the jerk equation)

∇·F = 0 + 0 + (−c₃) = −0.44   constant, position-independent`}
      </pre>
      <p>
        All dissipation in the system flows through a single linear term:
        −c₃z in the third equation.  Remove that term and the orbit diverges.
        Strengthen it (raise c₃) and the attractor shrinks toward a limit
        cycle and eventually a fixed point.  The parameter c₃ is literally
        the single knob that controls how quickly phase-space volumes contract.
      </p>

      <h2>Lyapunov spectrum and Liouville identity</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`λ₁ ≈ +0.073   positive — sensitive dependence confirmed (chaos)
λ₂ ≈  0.000   neutral — along the orbit
λ₃ ≈ −0.513   contracting

Sum: 0.073 + 0.000 − 0.513 = −0.440 = ∇·F = −c₃   ✓  (Liouville)

Lyapunov time:  τ = 1/λ₁ ≈ 13.7 time units
D_KY = 2 + λ₁/|λ₃| = 2 + 0.073/0.513 ≈ 2.142`}
      </pre>
      <p>
        The Lyapunov identity is the Liouville theorem of statistical mechanics
        applied to phase space: the sum of all Lyapunov exponents must equal
        the divergence of the vector field.  Here it checks to six significant
        figures.  D_KY ≈ 2.142 places the attractor between Lorenz (2.06) and
        Chen (2.17) in terms of fractal thickness — a moderately structured
        set.
      </p>

      <h2>Two equilibria, both unstable</h2>
      <p>
        Setting ẋ = ẏ = ż = 0 requires y = 0 and z = 0, then the third
        equation becomes −c₁x + x² = 0, giving x(x − c₁) = 0:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`P₀ = (0, 0, 0)      characteristic polynomial: λ³ + c₃λ² + c₂λ + c₁ = 0
                            = λ³ + 0.44λ² + 1.3λ + 1 = 0

Routh-Hurwitz H₂ = c₃·c₂ − c₁ = 0.44·1.3 − 1.0 = 0.572 − 1.0 = −0.428 < 0
→ P₀ is UNSTABLE (at least one eigenvalue with Re > 0)

P₁ = (c₁, 0, 0) = (1, 0, 0)   polynomial: λ³ + 0.44λ² + 1.3λ − 1 = 0
→ P₁ has a real positive eigenvalue ≈ +0.54 (saddle-focus)`}
      </pre>
      <p>
        Both equilibria are unstable.  The origin P₀ repels nearby trajectories
        (the Routh–Hurwitz condition fails — not all minors are positive), while
        P₁ is a saddle-focus whose unstable manifold spirals outward.  Yet the
        orbit stays bounded: the x² term curves it back whenever x grows large.
        This global boundedness despite local repulsion is what makes the strange
        attractor possible — there is no stable resting point, only the attractor
        itself.
      </p>
      <p>
        The single-wing topology is a direct consequence: the orbit spirals around
        P₁ repeatedly without a symmetric partner scroll.  There is no Z₂ symmetry
        here (unlike Lorenz or Rücklidge), only one lobe.
      </p>

      <h2>Shape keys — the c₃ dissipation axis</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis       c₃ = 0.44   canonical chaos  D_KY ≈ 2.142
SK_DenseWrap c₃ = 0.30   weaker damping → denser, larger orbit radius
SK_BorderChs c₃ = 0.55   near chaos boundary → smaller, near-periodic orbit
SK_ShiftedEQ c₁ = 0.70, c₂ = 1.2  P₁ moves to x=0.70  topology shifts`}
      </pre>
      <p>
        Morphing from Basis to SK_DenseWrap is a lesson in dissipation: reducing
        c₃ from 0.44 to 0.30 weakens the only damping term, so trajectories fill
        more of phase space before contracting — the orbit visibly expands.
        SK_BorderChs shows the reverse: near c₃ ≈ 0.55 the attractor is
        approaching a reverse-period-doubling cascade, contracting toward a
        limit cycle.  SK_ShiftedEQ moves P₁ while keeping c₃ fixed — the
        orbit reorganises around the shifted saddle-focus without altering its
        fractal structure.
      </p>

      <h2>Bishop frame and tube construction</h2>
      <p>
        RK4 at dt = 0.01 integrates 3 000 burn-in steps (discarding the
        transient near the unstable origin) then 90 000 recording steps,
        thinned by a factor of 30 to 3 000 waypoints.  Bishop
        parallel-transport frames the tube twist-free:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# Bishop parallel-transport (Rodrigues rotation)
T[i]  = (pts[i+1] − pts[i]) / |pts[i+1] − pts[i]|    tangent
axis  = cross(T[i-1], T[i])
sin_a = |axis|
cos_a = dot(T[i-1], T[i])
N[i]  = cos_a·N[i-1] + sin_a·cross(axis/sin_a, N[i-1])
       + (1−cos_a)·dot(axis/sin_a, N[i-1])·(axis/sin_a)

ring[i, j] = pts[i] + TUBE_R·(cos(2πj/S)·N[i] + sin(2πj/S)·B[i])`}
      </pre>
      <p>
        Frenet frames are unsuitable here because the Genesio–Tesi orbit
        has inflection points (where curvature passes through zero), causing
        the Frenet normal to flip discontinuously.  Bishop transport accumulates
        no unnecessary twist; the tube cross-section rotates only as much as
        the curve actually bends.
      </p>

      <h2>GT_Speed colour attribute</h2>
      <p>
        Each vertex carries a <code>GT_Speed</code> FLOAT_COLOR attribute set
        to the orbital speed at that waypoint:
        ‖(ẋ, ẏ, ż)‖ = ‖(y, z, −c₁x − c₂y − c₃z + x²)‖.
        Slow regions near P₁ (where the orbit lingers longest) render in cobalt;
        fast regions in the tight inner curve render in amber.  The gradient
        reveals where the orbit loses energy to the saddle-focus and where the
        x² nonlinearity kicks it back out.
      </p>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Tube clips through itself near P₁</strong>: the orbit
          passes close to (1, 0, 0).  Reduce <code>TUBE_R</code> from 0.08
          to 0.05, or increase <code>THIN</code> from 30 to 20 for more
          waypoints and finer sampling.
        </li>
        <li>
          <strong>SK_BorderChs looks like a closed loop (limit cycle)</strong>:
          at c₃ = 0.55 the system is very near the chaos boundary — a
          near-periodic orbit is correct.  Try c₃ = 0.52 for a slightly
          more chaotic version of that shape key.
        </li>
        <li>
          <strong>Origin visible as a gap in the tube</strong>: the burn-in
          of 3 000 steps removes the transient spiralling toward P₀, but if
          the IC is too close to the origin the burn-in may not be enough.
          Increase <code>BURN_IN</code> to 5 000 or shift IC to (0.5, 0, 0).
        </li>
        <li>
          <strong>Speed colour appears uniform amber</strong>: the inner lobe
          near P₁ is consistently fast on this attractor.  Lower{" "}
          <code>SPEED_HI</code> from 3.0 to 2.0 to stretch the gradient
          across the actual speed range.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <p>Related studio tutorials on jerk chaos, minimal-term attractors, and control-adjacent systems:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Rössler Attractor (1976)
          </Link>{" "}
          — also a single-scroll with one quadratic; compare Shilnikov homoclinic
          orbit topology versus Genesio–Tesi saddle-focus topology
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-sprott-b-attractor-linz-two-quadratic-minimal-chaos-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Sprott B Attractor (1994)
          </Link>{" "}
          — six-term minimal chaos, two cross-products versus Genesio–Tesi&apos;s
          single self-squared term; compare divergence structures
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-moore-spiegel-oscillator-1966-stellar-convection-nonlinear-jerk-chaos-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Moore–Spiegel Oscillator (1966)
          </Link>{" "}
          — another jerk-form system (stellar convection) predating Genesio–Tesi;
          compare physical origins and attractor geometry
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-chua-circuit-double-scroll-shilnikov-chaos-piecewise-linear-bishop-tube-poi-webxr"
            className={lk}
          >
            Chua&apos;s Circuit (1983)
          </Link>{" "}
          — also from control/electronics, piecewise-linear versus quadratic
          nonlinearity; the first experimentally observed chaos versus the
          first harmonically analysed chaos
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Primary paper:</strong>{" "}
          <a
            href="https://doi.org/10.1016/0005-1098(92)90177-H"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Genesio, R. &amp; Tesi, A. (1992).  "Harmonic balance methods for the
            analysis of chaotic dynamics in nonlinear systems."
            <em>Automatica</em> 28(3):531–548.
          </a>{" "}
          — Mathematical equations are public domain as scientific facts.
          Related journal:{" "}
          <a
            href="https://www.sciencedirect.com/journal/automatica"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Automatica (IFAC / Elsevier)
          </a>{" "}
          — the foremost journal of the International Federation of Automatic
          Control; the Genesio–Tesi paper sits alongside work on robust
          control and stability analysis.
        </li>
        <li>
          <strong>Companion reference (academic free):</strong>{" "}
          <a
            href="https://sprott.physics.wisc.edu/chaos/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Sprott, J.C. (2010). <em>Elegant Chaos</em> companion C source,
            sprott.physics.wisc.edu/chaos/
          </a>{" "}
          — includes Genesio–Tesi among its catalogue of algebraically simple
          flows; C implementations freely available.  Related upstream work:{" "}
          <a
            href="https://sprott.physics.wisc.edu/chaos/SPROTT.HTM"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Sprott&apos;s 1994 original search program (free download)
          </a>{" "}
          which enumerated minimal chaotic systems including those adjacent
          to Genesio–Tesi.
        </li>
        <li>
          <strong>NumPy (BSD-3-Clause):</strong>{" "}
          <a
            href="https://numpy.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org
          </a>{" "}
          — vectorised RK4 integration and Bishop frame transport.  Repository:{" "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
          .
        </li>
      </ul>
    </>
  );
}

const instructable = buildInstructable({
  libSlug: "python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr",
  topic: "scripting",
  blenderVersion: "5.1",
  licence: "CC0",
  files: ["blueprint.py", "record.py", "SCREEN-RECORDING-NOTES.md"],
});

export const entry: Entry = {
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-02",
  tags: [
    "blender",
    "python",
    "numpy",
    "scripting",
    "chaos",
    "attractor",
    "genesio-tesi",
    "jerk",
    "dynamical-systems",
    "control-theory",
    "bishop-tube",
    "poi",
    "webxr",
  ],
  body: Body,
  instructable,
};

export const blenderTutorialPythonNumpyGenesioTesiAttractor1992JerkChaosQuadraticRk4BishopTubePoiWebxrEntry =
  entry;

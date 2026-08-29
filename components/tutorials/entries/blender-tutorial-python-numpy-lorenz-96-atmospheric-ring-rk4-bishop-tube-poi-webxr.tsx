import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-lorenz-96-atmospheric-ring-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Lorenz-96 Atmospheric Ring: N=8 Chaotic ODE, Hopf Threshold F≈5.76, Lyapunov Spectrum, RK4, Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Edward Lorenz designed this deceptively simple N-dimensional ODE in 1996 as the minimal test bed for atmospheric data assimilation: N variables equally spaced on a latitude circle, coupled by a quadratic advection term, a linear damping term, and a scalar forcing F. With N=8 and F=8 the system has two positive Lyapunov exponents and is the canonical benchmark for Ensemble Kalman Filters. This blueprint integrates the equations with RK4 at dt=0.005, projects the state onto (X₀, X₁, X₂), and wraps the resulting strange-attractor trajectory in a Bishop parallel-transport tube — four shape keys then sweep from near-Hopf periodicity (F=5), through the exact bifurcation threshold (F=5.76), the canonical chaotic benchmark (F=8), and on into the dense turbulent regime (F=16).";

function Body() {
  return (
    <>
      <p>
        Every weather forecast implicitly relies on a system like this one.
        The Lorenz-96 model is not itself a forecast model — it has no
        geography, no moisture, no three-dimensional dynamics — but it
        captures the statistical heart of atmospheric turbulence: energy
        advected around a latitude ring, dissipated internally, and driven
        by a uniform external forcing. That is enough to produce genuine
        chaos with a well-defined Lyapunov spectrum, which makes it the
        standard benchmark for testing data-assimilation algorithms.
      </p>

      <h2>The equations</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`dXᵢ/dt = (Xᵢ₊₁ − Xᵢ₋₂) · Xᵢ₋₁  −  Xᵢ  +  F      i = 0 … N−1 (mod N)

Three terms:
  (Xᵢ₊₁ − Xᵢ₋₂)·Xᵢ₋₁  — quadratic advection: energy transport westward
  − Xᵢ                   — linear damping: internal dissipation
  + F                    — constant forcing: solar / thermal drive

Conservation: d/dt Σ Xᵢ = − Σ Xᵢ + N·F
  → steady state <X> = F (each variable averages to the forcing)
  → attractor dimension scales as O(N) for large N`}
      </pre>

      <h2>Why N ≥ 4?</h2>
      <p>
        The advection term needs neighbours at i−2, i−1, and i+1. For N=4
        the system is periodic; for N ≥ 5 period-doubling and chaos are
        possible. Lorenz chose N=8 for his original 1996 manuscript
        (published 1998 with Emanuel) and N=40 for weather-like
        complexity — with N=40 and F=8 there are approximately 13 positive
        Lyapunov exponents.
      </p>

      <h2>Dynamical phases (N = 8)</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`F < 1    : X_i → F everywhere  (trivial fixed point)
F ≈ 1    : pitchfork bifurcation → two asymmetric fixed points
1 < F < 5.76 : limit cycle / quasi-periodic orbit
F ≈ 5.76 : first Hopf bifurcation to chaos (Ott et al. 2003)
F = 8    : 2 positive Lyapunov exponents — EnKF benchmark
F = 16   : 4+ positive exponents — sub-grid turbulence regime`}
      </pre>

      <h2>Lyapunov spectrum and the Kaplan–Yorke dimension</h2>
      <p>
        The Lyapunov exponents λ₁ ≥ λ₂ ≥ … ≥ λ_N characterise how
        neighbouring trajectories separate or converge in each direction
        of phase space. For N=8, F=8 one finds roughly λ₁ ≈ 1.68,
        λ₂ ≈ 0.54, with all remaining exponents negative. The
        Kaplan–Yorke (Lyapunov) attractor dimension:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`D_KY = k + Σᵢ₌₁ᵏ λᵢ / |λₖ₊₁|

where k is the largest index with Σᵢ₌₁ᵏ λᵢ > 0.
N=8, F=8 → D_KY ≈ 3.6  (the 3-D projection underrepresents this)`}
      </pre>

      <h2>RK4 integration strategy</h2>
      <p>
        Classical fourth-order Runge–Kutta at dt = 0.005. The
        characteristic Lyapunov time (1/λ₁) is roughly 0.6 time units,
        so each Lyapunov time contains about 120 integration steps — more
        than adequate for trajectory accuracy over the 300-unit integration
        window. The right-hand side is vectorised with{" "}
        <code>numpy.roll</code>: <code>roll(X, -1)</code> gives X[i+1]
        and <code>roll(X, 2)</code> gives X[i−2] across all i
        simultaneously.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`def l96_deriv(X, F):
    Xm2 = np.roll(X, 2)   # X[i-2]
    Xm1 = np.roll(X, 1)   # X[i-1]
    Xp1 = np.roll(X, -1)  # X[i+1]
    return (Xp1 - Xm2) * Xm1 - X + F`}
      </pre>

      <h2>Bishop parallel-transport frame</h2>
      <p>
        The L96 trajectory in (X₀, X₁, X₂) space crosses itself many
        times — it is a genuine strange attractor, not a simple knot.
        Building a tube around such a curve with the Frenet frame would
        cause sudden 180° twists wherever curvature vanishes (inflection
        points). The Bishop frame avoids this by propagating the cross-
        section normal with the <em>smallest possible rotation</em> that
        keeps it perpendicular to the advancing tangent:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`axis  = T[i-1] × T[i]            # rotation axis between tangents
angle = arctan2(|axis|, T[i-1]·T[i])
N[i]  = Rodrigues(N[i-1], axis, angle)  # minimal rotation`}
      </pre>
      <p>
        This is the same technique used for poi-head tubes in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-double-pendulum-lagrangian-chaos-rk4-butterfly-bishop-tube-poi-webxr"
          className={lk}
        >
          Double Pendulum
        </Link>
        ,{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-rikitake-two-disc-dynamo-geomagnetic-reversal-bullard-chaos-bishop-tube-poi-webxr"
          className={lk}
        >
          Rikitake Dynamo
        </Link>
        , and{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-three-body-figure-8-choreography-chenciner-montgomery-bishop-tube-poi-webxr"
          className={lk}
        >
          Three-Body Figure-8
        </Link>{" "}
        tutorials.
      </p>

      <h2>Shape keys — the dynamical story</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis     F = 8.00  canonical chaos — two positive Lyapunov exponents
SK_Hopf   F = 5.00  near-Hopf onset — loose loopy quasi-periodic orbit
SK_Onset  F = 5.76  exact bifurcation threshold — ordered-chaos boundary
SK_Strong F = 16.0  strong turbulence — fast dense tangle`}
      </pre>
      <p>
        Each shape key runs an independent integration from the same
        initial condition, scaled to fit the same POI_R = 0.082 m bounding
        sphere. The visual difference between SK_Hopf and Basis captures
        the whole story of how increasing forcing turns organised
        atmospheric wave patterns into turbulent disorder.
      </p>

      <h2>Vertex colour — non-uniform time sampling</h2>
      <p>
        Strange attractors spend more time in some regions than others.
        The cobalt-to-amber gradient encodes the local orbital speed
        ‖Ẋ‖ at each waypoint: slow-moving segments (cobalt) are where
        the orbit lingers, fast-moving segments (amber) are where it
        shoots through. This is complementary to — but different from —
        the Poincaré section density used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-chirikov-standard-map-kam-breakdown-greene-critical-threshold-stage-floor-webxr"
          className={lk}
        >
          Chirikov Standard Map
        </Link>{" "}
        tutorial.
      </p>

      <h2>Trouble-shooting</h2>
      <ul className="list-disc pl-6">
        <li>
          <strong>Tube self-intersects badly</strong> — reduce TUBE_R or
          increase N_SKIP to thin the orbit. The L96 attractor is not a
          simple knot so some visual overlap is expected and correct.
        </li>
        <li>
          <strong>SK_Hopf looks identical to Basis</strong> — check that
          N_WARMUP is at least 4 000; with too few warmup steps the orbit
          at F = 5 may still be in transient and not yet on its limit cycle.
        </li>
        <li>
          <strong>Integration blows up for large F</strong> — reduce DT.
          At F = 16 the fastest Lyapunov exponent is roughly 2×, so the
          Courant condition is tighter; dt ≤ 0.003 is safe.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-6">
        <li>
          Lorenz, E. N. &amp; Emanuel, K. A. (1998).{" "}
          <em>
            Optimal Sites for Supplementary Weather Observations:
            Simulation with a Small Model
          </em>
          . <em>J. Atmos. Sci.</em> <strong>55</strong>, 399–414.{" "}
          <a
            href="https://doi.org/10.1175/1520-0469(1998)055<0399:OSFSWO>2.0.CO;2"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            DOI (journal, PD for equations)
          </a>
          . This is the canonical reference. Lorenz presented the model
          first at a 1996 ECMWF seminar; the equations are in the public
          domain. Related:{" "}
          <a
            href="https://github.com/DataWaveProject/L96_emulator"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            DataWave L96 emulator (MIT)
          </a>{" "}
          — PyTorch neural ODE surrogate for L96, used in ML-for-NWP
          research.
        </li>
        <li>
          Ott, E. et al. (2004).{" "}
          <em>
            Estimating the State of a Geophysical System with Sparse
            Observations: Time Behavior and Data Ensemble Assimilation
          </em>
          . <em>Mon. Weather Rev.</em>{" "}
          <a
            href="https://doi.org/10.1175/1520-0493(2004)132<1850:ETSOAS>2.0.CO;2"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            DOI (AMS, PD equations)
          </a>
          . Establishes F ≈ 5.76 as the N=8 Hopf threshold and provides
          the first rigorous Lyapunov spectrum measurements used here.
          Related:{" "}
          <a
            href="https://github.com/envfluids/lorenz96"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            envfluids/lorenz96 (MIT)
          </a>{" "}
          — clean Python reference implementation of the L96 system with
          Lyapunov exponent computation.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-08-29",
  tags: [
    "blender",
    "scripting",
    "python",
    "chaos",
    "atmospheric",
    "lorenz",
    "dynamical-systems",
    "webxr",
    "mathematics",
  ],
  body: Body,
});

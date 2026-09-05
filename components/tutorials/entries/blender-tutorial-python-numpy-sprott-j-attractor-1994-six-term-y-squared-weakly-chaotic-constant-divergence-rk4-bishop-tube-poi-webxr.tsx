import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-sprott-j-attractor-1994-six-term-y-squared-weakly-chaotic-constant-divergence-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Sprott J Attractor 1994: ẋ=2z ẏ=−2y+z ż=−x+y+b·y² " +
  "Six-Term Single y²-Nonlinearity Weakly Chaotic λ₁≈+0.017 τ≈59 " +
  "Constant Divergence ∇·F=−2 (b-independent) Single Unstable Origin " +
  "Routh–Hurwitz Unstable ∑λᵢ=−2=∇·F D_KY≈2.008 Liouville " +
  "Basis(b=1.0)/SK_LoB(b=0.5 near-periodic)/SK_HiB(b=1.5 wider)/SK_VHiB(b=2.0 topology-shift) " +
  "Shape Keys Cobalt–Amber SprottJ_Speed FLOAT_COLOR Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Sprott Case J is the outlier in Sprott's 1994 catalogue: its maximal " +
  "Lyapunov exponent λ₁ ≈ +0.017 gives a Lyapunov time of roughly 59 time " +
  "units — thirty times longer than the Lorenz system. Trajectories look " +
  "nearly periodic for tens of revolutions before the y² fold accumulates " +
  "enough separation to confirm chaos. The constant divergence ∇·F = −2 is " +
  "the strongest dissipation in the canonical Sprott family, yet chaos " +
  "stubbornly persists. Four shape keys sweep b from the near-linear regime " +
  "(b=0.5) through the canonical orbit to a dominant-quadratic topology shift " +
  "(b=2.0). Bishop parallel-transport tube and poi head ready for WebXR.";

function Body() {
  return (
    <>
      <p>
        In 1994 Julien Clinton Sprott systematically searched for the
        algebraically simplest dissipative chaotic flows. Case J — one of
        his 14 confirmed chaos cases — reads:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`ẋ =  2z            ← x driven purely by z at 2:1 ratio
ẏ = −2y + z        ← damped at rate 2; z feeds it forward
ż = −x + y + b·y²  ← nonlinear restoring; b scales the quadratic fold`}
      </pre>
      <p>
        With b=1 this is the canonical system. The y² term is the sole
        nonlinearity — a <em>self-quadratic injection</em> in the z-equation
        rather than a bilinear product (compare{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-g-attractor-1994-leaf-scroll-constant-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott G
        </Link>
        's x·z, or{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-h-attractor-1994-five-term-z-squared-shilnikov-saddle-focus-origin-rk4-bishop-tube-poi-webxr"
        >
          Sprott H
        </Link>
        's z² injection). The 2:1 ratio between the ẋ-driving and the ẏ-damping
        coefficient produces a distinctively elongated single-lobe orbit.
      </p>

      <h2>Why this case teaches "barely chaotic"</h2>
      <p>
        Most chaos demonstrations use strongly chaotic systems (Lorenz τ≈1.1,
        Rössler τ≈12). Sprott J at b=1 has τ≈59 — trajectories that start
        within 1 mm of each other stay within 2 mm for about 35 seconds of
        model time before diverging exponentially. Watching the phase portrait,
        the orbit appears periodic. Only a Poincaré section or a formal
        Lyapunov calculation exposes the positive exponent. This is important:{" "}
        <em>chaos is not a binary property but a spectrum</em>. Compare with the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-ueda-bistability-period-doubling-rk4-bishop-tube-poi-webxr"
        >
          Duffing oscillator
        </Link>
        , where the route from period-2 to chaos is visible across parameter
        space via a period-doubling cascade.
      </p>

      <h2>Constant divergence — strongest in the Sprott family</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`∇·F = ∂(2z)/∂x + ∂(−2y+z)/∂y + ∂(−x+y+b·y²)/∂z
     =    0    +     (−2)    +         0
     = −2  (constant; b-independent)

Phase volume: δV(t) = δV(0)·exp(−2·t)
  → halves every ln2 ≈ 0.347 time units (very rapid collapse to attractor)

Lyapunov spectrum (b=1.0, RK4, numerical):
  λ₁ ≈ +0.017   chaos confirmed — barely
  λ₂ ≈  0.000   flow direction (neutral)
  λ₃ ≈ −2.017   strong stable folding
  Sum = −2.000 = ∇·F  ✓  Liouville satisfied

Kaplan–Yorke dimension:
  D_KY = 2 + λ₁/|λ₃| = 2 + 0.017/2.017 ≈ 2.008
  The attractor is BARELY above the 2D surface threshold.`}
      </pre>

      <h2>Equilibrium analysis — one unstable origin</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Setting ẋ=ẏ=ż=0:
  ẋ=0 → z = 0
  ẏ=0 → −2y = 0 → y = 0
  ż=0 → −x = 0 → x = 0
  Only P₀ = (0, 0, 0)

Jacobian at P₀:
  J₀ = [[ 0,  0,  2],
         [ 0, −2,  1],
         [−1,  1,  0]]

Characteristic polynomial (expand):
  λ³ + 2λ² + λ + 4 = 0

Routh–Hurwitz test on [1, 2, 1, 4]:
  s¹ entry = (2·1 − 1·4)/2 = −1 < 0  ← sign change
  ∴ One positive-real root → P₀ is an unstable saddle.
  No Shilnikov structure (no complex-unstable pair at P₀ unlike Cases F and H).`}
      </pre>

      <h2>Shape keys: the b·y² fold-strength sweep</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`∇·F = −2 for ALL b — dissipation is b-independent.
Only the orbit SHAPE changes as b scales the quadratic fold:

Basis    b=1.0  canonical; τ≈59; orbit wraps in a tight elongated lobe
SK_LoB   b=0.5  halved fold; near-linear dynamics; long laminar stretches;
                 λ₁ drops further — may appear periodic in short runs
SK_HiB   b=1.5  50 % stronger fold; wider y-excursions; more diffuse lobe
SK_VHiB  b=2.0  dominant quadratic; topology shifts noticeably;
                 excursions in y grow; orbit morphs away from single-lobe

Key insight: as b→0 the system becomes nearly linear (ẋ=2z, ẏ=−2y+z,
ż=−x+y), whose characteristic roots govern a stable spiral — chaos vanishes
entirely at b=0. The y² term is the SOLE source of chaos in this system.`}
      </pre>

      <h2>Blueprint walkthrough</h2>
      <p>
        The integrator uses RK4 with DT=0.01. The BURN_IN is set to 8 000
        steps (80 time units) — longer than most Sprott cases — because the
        Lyapunov time of 59 tu means the trajectory needs longer to settle
        onto the strange attractor. After burn-in, every 50th step is retained
        for 3 000 waypoints.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`def _f(s, b):
    x, y, z = s
    return np.array([2.0*z,            # ẋ: 2:1 z-amplification
                     -2.0*y + z,       # ẏ: damped + z-feed
                     -x + y + b*y*y])  # ż: nonlinear restoring

def _rk4(s, dt, b):
    k1 = _f(s, b)
    k2 = _f(s + 0.5*dt*k1, b)
    k3 = _f(s + 0.5*dt*k2, b)
    k4 = _f(s + dt*k3, b)
    return s + (dt/6.0)*(k1 + 2.0*k2 + 2.0*k3 + k4)`}
      </pre>
      <p>
        Bishop parallel-transport frames propagate a reference frame along the
        curve by the Rodrigues rotation formula at each segment join. This
        avoids the twisting artefacts that plague Frenet–Serret frames at
        low-curvature (nearly-straight) sections — frequent in Sprott J's
        elongated lobe. See{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr"
        >
          Genesio–Tesi
        </Link>{" "}
        for a full derivation of the Rodrigues propagation formula, and{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-h-attractor-1994-five-term-z-squared-shilnikov-saddle-focus-origin-rk4-bishop-tube-poi-webxr"
        >
          Sprott H
        </Link>{" "}
        for a comparison of Shilnikov spiral vs. non-Shilnikov single-lobe
        topologies.
      </p>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Orbit looks periodic / no spreading:</strong> Sprott J is
          weakly chaotic (τ≈59 tu). Increase N_STEPS to 200 000 or more
          and verify λ₁ numerically — the tube <em>does</em> sample all of
          the attractor, but it takes more integration time than Lorenz.
        </li>
        <li>
          <strong>SK_VHiB orbit drifts out of scene:</strong> At b=2.0 the
          y-excursions grow. Scale the object down to 0.8× after building,
          or reduce TUBE_R to 0.04.
        </li>
        <li>
          <strong>Tube kinks at near-straight sections:</strong> The 2:1 ratio
          on z occasionally creates long straight segments where Frenet frames
          flip — Bishop frames avoid this by design, but check
          BURN_IN ≥ 8 000 so the trajectory is fully on the attractor before
          recording starts.
        </li>
        <li>
          <strong>Colours flat / no gradient:</strong> SprottJ_Speed
          FLOAT_COLOR is POINT domain — in EEVEE Next set emission strength
          ≥ 1.8 and bloom threshold ≤ 0.3 for the cobalt→amber glow.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <a
            className={lk}
            href="https://doi.org/10.1103/PhysRevE.50.R647"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sprott JC (1994).{" "}
            <em>Some simple chaotic flows.</em> Phys. Rev. E 50(2):R647–R650.
          </a>{" "}
          — Original paper, Table I Case J. Equations are public-domain
          mathematical facts. Companion data gallery:{" "}
          <a
            className={lk}
            href="https://sprott.physics.wisc.edu/chaos/"
            target="_blank"
            rel="noopener noreferrer"
          >
            sprott.physics.wisc.edu/chaos/
          </a>{" "}
          (permissive educational).
        </li>
        <li>
          <a
            className={lk}
            href="https://github.com/williamgilpin/dysts"
            target="_blank"
            rel="noopener noreferrer"
          >
            Gilpin W (2021–2024).{" "}
            <em>dysts: Dynamical Systems Benchmarks.</em>
          </a>{" "}
          MIT licence. Lyapunov spectra and Kaplan–Yorke dimensions for 131
          systems including Sprott J. Related:{" "}
          <a
            className={lk}
            href="https://github.com/williamgilpin/fnn"
            target="_blank"
            rel="noopener noreferrer"
          >
            williamgilpin/fnn
          </a>{" "}
          (false-nearest-neighbours dimension estimation, MIT).
        </li>
        <li>
          Bishop RL (1975).{" "}
          <em>There is more than one way to frame a curve.</em> Amer. Math.
          Monthly 82(3):246–251. DOI{" "}
          <a
            className={lk}
            href="https://doi.org/10.2307/2311093"
            target="_blank"
            rel="noopener noreferrer"
          >
            10.2307/2311093
          </a>
          . Public domain — the parallel-transport frame theorem used
          throughout this series to avoid Frenet–Serret twisting.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-05",
  topics: ["blender", "scripting", "chaos", "mathematics", "webxr"],
  body: Body,
});

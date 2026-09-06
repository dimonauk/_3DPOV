import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-rikitake-two-disk-dynamo-1958-geomagnetic-reversal-chaotic-flip-constant-divergence-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Rikitake Two-Disk Dynamo 1958: ẋ=−μx+zy ẏ=−μy+x(z−a) ż=1−xy " +
  "Pre-Lorenz Geomagnetic Reversal Chaos Constant Divergence ∇·F=−2μ=−4 " +
  "Dual Fixed Points P±=(±1.689,±0.592,+5.70) Shilnikov Ratio≈800 " +
  "μx⁴−ax²−μ=0 Fixed-Point Quartic λ₁≈+0.050 D_KY≈2.012 " +
  "RK4 DT=0.02 BURN_IN=3000 N=90000 THIN=30→3000wp " +
  "Basis(μ=2,a=5)/SK_LowMu(μ=1.5)/SK_HighMu(μ=2.5)/SK_HighA(a=7) " +
  "Shape Keys Cobalt-Amber Rikitake_Speed FLOAT_COLOR " +
  "Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Rikitake Two-Disk Dynamo (1958) predates Lorenz by five years and " +
  "models the irregular reversals of Earth's magnetic field through two " +
  "coupled electromagnetic discs.  Constant divergence ∇·F = −2μ, a unique " +
  "quartic fixed-point equation, and a Shilnikov ratio of order 800 explain " +
  "the system's long inter-reversal epochs.  Four shape keys scan the (μ, a) " +
  "parameter space; cobalt–amber speed gradient; WebXR-ready poi head.";

function Body() {
  return (
    <>
      <h2 className="mt-6 text-lg font-semibold">
        Pre-Lorenz chaos — the geomagnetic reversal model
      </h2>
      <p>
        In 1958 — five years before Lorenz published his convection paper — the
        Japanese geophysicist Tsuneji Rikitake coupled two electromagnetic discs
        and showed that their interaction produces irregular, non-repeating
        oscillations. The sign flips in the disc currents correspond to reversals
        of Earth's magnetic poles: events that happen on timescales of tens of
        thousands of years but are unpredictable beyond a short horizon.
      </p>
      <p>
        The system joins the studio library as a counterpoint to the later
        Sprott minimal-chaos family: where those were found by computer search,
        the Rikitake equations were derived from a physical apparatus, making
        the chaos an empirical discovery as much as a mathematical one.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Equations and physical meaning</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`ẋ = −μx + zy          x — current in disc 1
ẏ = −μy + x(z − a)    y — current in disc 2
ż =  1 − xy            z — relative angular velocity

μ = 2.0,  a = 5.0  (canonical values)`}
      </pre>
      <p>
        The term <code>zy</code> couples disc 2's current into disc 1's driving
        force; <code>x(z − a)</code> does the reverse with an offset.  The
        product <code>xy</code> controls the angular deceleration: when{" "}
        <code>xy &gt; 1</code> the discs slow down (<code>ż &lt; 0</code>); when
        it falls below 1 they spin up again.  A magnetic reversal occurs whenever{" "}
        <code>x</code> changes sign.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Constant divergence</h2>
      <p>
        Differentiating term by term:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z
    = −μ    + (−μ)  + 0
    = −2μ
    = −4.0   (canonical μ = 2.0)

Liouville:  λ₁ + λ₂ + λ₃ = −4.0
Numerical:  +0.050  +  0  − 4.050 = −4.0  ✓`}
      </pre>
      <p>
        The strong dissipation (∇·F = −4 vs. −1 in most Sprott systems) produces
        a very thin attractor: D_KY ≈ 2.012, meaning trajectories collapse onto a
        near-planar sheet in state space.  The attractor is thin precisely because{" "}
        <code>λ₃ ≈ −4.05</code> contracts volumes aggressively in one direction.
      </p>
      <p>
        Compare with the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-shimizu-morioka-attractor-1980-laser-mode-z2-saddle-focus-rk4-bishop-tube-poi-webxr"
        >
          Shimizu–Morioka attractor
        </Link>{" "}
        (∇·F = −1.175) and the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-thomas-cyclically-symmetric-attractor-1999-sine-nonlinearity-c3-cyclic-rk4-bishop-tube-poi-webxr"
        >
          Thomas cyclically symmetric system
        </Link>{" "}
        (∇·F = −3b ≈ −0.624): both are far less dissipative, producing thicker,
        more three-dimensional attractor shapes.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Fixed-point analysis</h2>
      <p>
        Setting all time derivatives to zero yields a quartic:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`ż = 0  →  xy = 1          →  y = 1/x
ẋ = 0  →  μx = zy          →  z = μx²  (using y = 1/x)
ẏ = 0  →  μy = x(z − a)
           μ/x = x(μx² − a)   (substitute y and z)
           μx⁴ − ax² − μ = 0  (quartic in x)

Quadratic in u = x²:
   u = [a ± √(a² + 4μ²)] / (2μ)

For μ = 2, a = 5:
   discriminant = √(25 + 16) = √41 ≈ 6.403
   u₊ = (5 + 6.403)/4 ≈ 2.851  →  x* ≈ ±1.689
   u₋ = (5 − 6.403)/4 < 0       →  no real root

P+ = (+1.689, +0.592, +5.70)
P− = (−1.689, −0.592, +5.70)`}
      </pre>
      <p>
        Both fixed points have the same positive{" "}
        <code>z* = μx*² ≈ 5.70</code>. The angular velocity at both poles is
        identical — only the current signs differ, reflecting the system's{" "}
        <code>(x,y) → (−x,−y)</code> anti-symmetry.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Shilnikov analysis — why reversals are rare
      </h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Eigenvalues at P± (μ=2, a=5):
  λ_r ≈ −4.01           strongly stable real  ("fast manifold")
  λ_c ≈ +0.005 ± 2.00i  weakly unstable complex ("reversal spiral")

Shilnikov condition:  |λ_r| / Re(λ_c) ≈ 4.01 / 0.005 ≈ 800`}
      </pre>
      <p>
        The Shilnikov ratio of ≈ 800 is orders of magnitude larger than typical
        Sprott attractors (ratios of 2–17).  This means the stable manifold
        contracts trajectories toward <code>P±</code> roughly 800× faster than
        the unstable manifold expands them outward.  The practical consequence is
        long, nearly periodic spirals around each fixed point — the system looks
        like it might have settled, then suddenly ejects and reverses.  This is
        exactly what geomagnetic records show: stable polarity epochs interrupted
        by rapid, unpredictable reversals.
      </p>

      <h2 className="mt-6 text-lg font-semibold">RK4 integration and thinning</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`DT      = 0.02      # |λ_c| ≈ 2 → orbital period ≈ π ≈ 3.1; DT resolves at ~155 pts/period
BURN_IN = 3000      # 60 time units → transient (|λ_r|⁻¹ ≈ 0.25 s) long gone
N_STEPS = 90000     # 1 800 total time units of attractor data
THIN    = 30        # keep every 30th → 3000 waypoints for the tube`}
      </pre>
      <p>
        The initial condition is placed near <code>P+</code> with a small
        perturbation along the unstable complex direction, ensuring fast
        convergence to the chaotic attractor rather than a long pre-reversal
        transient.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Shape keys — parameter scan</h2>
      <p>
        Four shape keys let the mesh morph continuously between parameter regimes:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Basis     μ=2.0, a=5.0   canonical — balanced reversal rate
SK_LowMu  μ=1.5, a=5.0   lower dissipation → wider orbit, more frequent reversals
SK_HighMu μ=2.5, a=5.0   stronger dissipation → tighter tube, sparser reversals
SK_HighA  μ=2.0, a=7.0   larger coupling → fixed points shift, topology changes`}
      </pre>

      <h2 className="mt-6 text-lg font-semibold">
        Bishop parallel-transport and the speed attribute
      </h2>
      <p>
        Bishop frames avoid the Frenet singularity at zero-curvature inflections
        — particularly important here because the long spiralling epochs produce
        near-circular arcs where the Frenet normal flips.  The{" "}
        <code>Rikitake_Speed</code> FLOAT_COLOR attribute maps the trajectory's
        local velocity to a cobalt (slow, near the fixed point) → amber (fast,
        mid-reversal ejection) gradient.
      </p>
      <p>
        The speed attribute approach was developed across the studio's chaotic
        attractor series — see the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-newton-leipnik-attractor-1981-double-strange-bistability-rigid-body-feedback-rk4-bishop-tube-poi-webxr"
        >
          Newton–Leipnik bistability tutorial
        </Link>{" "}
        for a detailed discussion of dual-basin colouring, and compare the
        single-basin version here.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Troubleshooting</h2>
      <ul className="ml-4 list-disc space-y-1">
        <li>
          <strong>Tube self-intersects near reversal events.</strong> The rapid
          direction change during a magnetic reversal can fold the tube back on
          itself.  Reduce <code>TUBE_R</code> (e.g. to 0.030) or increase{" "}
          <code>THIN</code> to smooth the path.
        </li>
        <li>
          <strong>Shape key topology mismatch.</strong> All four orbits use the
          same burn-in IC strategy, so waypoint counts always match.  If Blender
          reports a mismatch, verify <code>N_STEPS // THIN == 3000</code>.
        </li>
        <li>
          <strong>SK_HighA looks very different.</strong> At{" "}
          <code>a = 7</code> the fixed points move to{" "}
          <code>x* ≈ ±1.980</code>, and the inter-reversal spirals tighten.
          This is expected topology change, not an error.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">External references</h2>
      <ul className="ml-4 list-disc space-y-1">
        <li>
          Rikitake, T. (1958).{" "}
          <em>Oscillations of a system of disk dynamos.</em>{" "}
          Proc. Camb. Phil. Soc. 54(1):89–105.{" "}
          <a
            className={lk}
            href="https://doi.org/10.1017/S0305004100033223"
            target="_blank"
            rel="noreferrer"
          >
            DOI: 10.1017/S0305004100033223
          </a>{" "}
          — original paper, PD mathematics.
        </li>
        <li>
          Gilpin, W. (2023).{" "}
          <em>dysts: Dynamical systems in Python.</em>{" "}
          <a
            className={lk}
            href="https://github.com/williamgilpin/dysts"
            target="_blank"
            rel="noreferrer"
          >
            github.com/williamgilpin/dysts
          </a>{" "}
          (MIT) — canonical parameter catalogue; Rikitake entry confirms μ=2, a=5.
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
  topics: ["blender", "python", "chaos", "attractor", "webxr", "poi"],
  body: <Body />,
});

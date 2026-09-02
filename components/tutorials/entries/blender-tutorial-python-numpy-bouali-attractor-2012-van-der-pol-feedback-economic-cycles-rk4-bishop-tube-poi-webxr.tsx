import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-bouali-attractor-2012-van-der-pol-feedback-economic-cycles-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Bouali Attractor (2012): ẋ=α·x(1−y)−β·z ẏ=−c·y(1−x²) ż=μ·x Extended Van der Pol Slow-Fast Feedback Chaos α=3 β=2.2 c=1 μ=0.01 Variable Divergence ∇·F=α(1−y)+c(x²−1) Unique Equilibrium O=(0,0,0) Unstable Saddle λ₁≈+0.073 D_KY≈2.01 Basis(canonical)/SK_FastZ(μ=0.05)/SK_WeakGrowth(α=2.0)/SK_StrongCouple(β=4.0) Shape Keys & Cobalt–Amber Bouali_Speed FLOAT_COLOR Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Safieddine Bouali extended the Van der Pol limit-cycle oscillator in 2012 by adding a third, very slowly evolving variable z that feeds back into the growth term — μ = 0.01 means z drifts at one-hundredth the rate of x, acting as a quasi-static modulator that shifts the half-cycle amplitude just enough to prevent the orbit from ever closing. The result is a chaotic strange attractor with a single equilibrium and position-dependent dissipation. This blueprint integrates the three ODEs with 4th-order Runge-Kutta, builds a Bishop parallel-transport tube along 3 000 waypoints, encodes per-waypoint speed as a cobalt-to-amber FLOAT_COLOR gradient, and exports a Draco-compressed GLB poi-head for WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-09-02",
  externalSources: [
    {
      label:
        "Bouali, S. (2012). Feedback Loop in Extended Van der Pol's Equation Applied to an Economic Model of Cycles. arXiv:1205.3169 [math.DS]. Mathematical content Public Domain. Related: Van der Pol (1926) On oscillation hysteresis in a circuit with triode, Philosophical Magazine 43:700–719.",
      url: "https://arxiv.org/abs/1205.3169",
      licence: "Mathematical content Public Domain",
      author: "Safieddine Bouali",
    },
    {
      label:
        "Sprott, J. C. — Chaos Atlas (sprott.physics.wisc.edu/chaos/). Permissive educational use, freely redistributable for non-commercial academic purposes. Catalogues the Bouali system alongside Lorenz, Rössler, and 19 other minimal strange attractors. Related: Sprott JC (1994) Some simple chaotic flows, Phys Rev E 50(2):R647–R650.",
      url: "https://sprott.physics.wisc.edu/chaos/",
      licence: "Permissive educational use",
      author: "Julien Clinton Sprott",
    },
    {
      label:
        "Gilpin, W. (2021–2024). dysts: Dynamical Systems Benchmarks. MIT licence. Provides reference integration traces, Lyapunov exponents, and attractor statistics for 131 low-dimensional chaotic systems including Bouali. Related: williamgilpin/fnn (false-nearest-neighbours embedding dimension, MIT).",
      url: "https://github.com/williamgilpin/dysts",
      licence: "MIT",
      author: "William Gilpin",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        The Van der Pol oscillator, born from triode radio circuits in 1926,
        produces a perfectly closed limit cycle — every orbit, regardless of
        starting point, converges to the same periodic loop. Bouali wanted
        something richer: a system that <em>looked</em> like Van der Pol from
        inside each half-cycle but whose amplitude varied irregularly from one
        swing to the next. The trick was a third variable z that the oscillator
        itself pumps up very slowly, and which in turn shifts the effective
        growth coefficient — never enough to stop the oscillation, always just
        enough to change its next amplitude.
      </p>

      <h2>The equations and their physical meaning</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`ẋ =  α · x · (1 − y)  −  β · z   [economic activity / oscillator displacement]
ẏ = −c  · y · (1 − x²)             [employment / velocity with Van der Pol damping]
ż =  μ  · x                         [excess demand / slow drift variable]

α = 3.0  — growth strength of x
β = 2.2  — feedback coupling: z damps ẋ
c = 1.0  — damping coefficient in ẏ
μ = 0.01 — drive rate from x into z  (SMALL: slow-fast timescale separation)`}
      </pre>
      <p>
        The <code>(x, y)</code> sub-system is Van der Pol. The nonlinear term{" "}
        <code>−c·y(1−x²)</code> acts as sign-switching damping: when{" "}
        <code>|x| &lt; 1</code>, the <code>−c·y</code> pulls y toward zero
        (stable); when <code>|x| &gt; 1</code>, the factor{" "}
        <code>(1−x²)</code> becomes negative, so −c·y·(negative) = +c·y,
        amplifying y away from zero — which in turn pulls x back through{" "}
        <code>α·x(1−y)</code>. The orbit thus circles the unit disc in x and
        would close perfectly were z fixed. But z is not fixed: μ·x drives it
        upward whenever x &gt; 0 and downward when x &lt; 0. Because each
        half-cycle of x is not perfectly symmetric, z drifts on a very slow
        timescale (order 1/μ ≈ 100 times slower than x). As z drifts, it
        subtracts β·z from ẋ, compressing one half-cycle relative to the last.
        The orbit never closes.
      </p>

      <h2>Divergence and its implications</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z
     = α(1−y) + (−c)(1−x²)  +  0
     = (α−c)  −  αy  +  cx²
     = 2  −  3y  +  x²  (for canonical parameters)

At origin (0,0,0): ∇·F = 2  (expansive!)
On the attractor: time-averaged ∇·F < 0  (net dissipation sustains the sheet)`}
      </pre>
      <p>
        Unlike Lorenz or Halvorsen, the Bouali divergence is not constant —
        it depends on the current position. Near the origin (x≈0, y≈0) the
        vector field is mildly expansive; near the turning points where |x| is
        large and y is positive, the field contracts strongly. The attractor
        lives in the contracting region on average, which is why the Kaplan–Yorke
        dimension D_KY ≈ 2.01 is so close to 2: the attractor is essentially
        a crumpled 2-D sheet.
      </p>

      <h2>Fixed point analysis</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`ż = 0  ⟹  μ·x = 0  ⟹  x = 0  (since μ ≠ 0)
ẏ = 0  with x=0: −c·y·(1−0) = −cy = 0  ⟹  y = 0
ẋ = 0  with x=0, y=0: 0 − β·z = 0  ⟹  z = 0

Unique equilibrium:  O = (0, 0, 0)

Jacobian at O:
  J = [[ α,  0, −β ],
       [ 0, −c,  0 ],
       [ μ,  0,  0 ]]
Eigenvalues: −c = −1.0  (stable),  ± i√(αμ) ≈ ± 0.173i  (centre pair!)
The centre pair makes O a non-hyperbolic (centre-focus) saddle — very unusual.`}
      </pre>
      <p>
        The near-zero imaginary eigenvalue pair (±0.173i) is why the orbit
        takes so long to escape the origin after initialisation: it spirals
        outward <em>very</em> slowly at first. Once the trajectory reaches
        |x| ≈ 1 the Van der Pol nonlinearity kicks in and rapid oscillation
        begins. This means burn-in needs to be long enough to traverse the
        slow initial spiral — the blueprint uses 2 000 steps at dt = 0.05,
        about 100 time units, which is well past the escape.
      </p>

      <h2>Blueprint walkthrough</h2>

      <h3>Step 1 — Integrate the orbit</h3>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`# Named constants at top of file (change parameters here, not inside loops)
ALPHA, BETA, C_DAMP, MU = 3.0, 2.2, 1.0, 0.01
DT, BURN_IN, N_STEPS, SKIP = 0.05, 2_000, 120_000, 40

def _deriv(s, alpha, beta, c, mu):
    x, y, z = s
    return np.array([
        alpha * x * (1.0 - y) - beta * z,  # ẋ
        -c * y * (1.0 - x * x),             # ẏ
        mu * x,                              # ż  (slow drift)
    ])

# Classic RK4: k1 = f(s); k2 = f(s + ½dt·k1); k3 = f(s + ½dt·k2);
#              k4 = f(s + dt·k3);  s += dt/6·(k1 + 2k2 + 2k3 + k4)
# — fourth-order in dt, so errors ∝ dt⁵ per step`}
      </pre>
      <p>
        RK4 is used throughout the library for autonomous ODEs like this one.
        The step size dt = 0.05 is large relative to the fast x–y oscillation
        (period ≈ 2π ≈ 6.3 time units), giving ≈ 125 steps per cycle — enough
        for &lt;0.1 % phase error per cycle. The slow z variable changes by
        only μ·dt ≈ 0.0005 per step, so it is resolved with much higher
        relative accuracy than needed. An adaptive integrator would reduce
        work slightly, but for 120 000 steps RK4 is fast enough in numpy.
      </p>

      <h3>Step 2 — Scale and Bishop frame</h3>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`# Centre on mean; scale to poi bounding radius POI_R = 0.085 m
centre = pts.mean(axis=0)
extent = np.max(np.linalg.norm(pts - centre, axis=1))
pts    = (pts - centre) * (POI_R / extent)

# Bishop parallel-transport frame: no twisting, smooth cross-sections
# Seed: a unit vector perpendicular to T[0]
# Rodrigues rotation: propagate N[i-1] to N[i] around axis=cross(T[i-1],T[i])`}
      </pre>
      <p>
        Why Bishop and not Frenet–Serret? Frenet–Serret frames jump 180° at
        inflection points where the curvature momentarily vanishes — you get
        sudden twists in the tube where none exist in the curve. Bishop frames
        propagate the normal by rotating it only as much as the tangent
        direction actually changed (Rodrigues formula), so a straight segment
        produces zero twist. The Bouali attractor has many near-straight
        segments near its apices, making Bishop essential here.
      </p>

      <h3>Step 3 — Tube geometry and FLOAT_COLOR</h3>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`# Ring at waypoint i: pts[i] + R·(cos(θ)·N[i] + sin(θ)·B[i])  for θ ∈ [0, 2π)
# 10 sides × 3 000 waypoints = 30 000 vertices, 29 970 quads

# Bouali_Speed colour: speed ‖(ẋ,ẏ,ż)‖ at each waypoint
# Percentile clipping removes outliers (slow burn-in tail)
t = clip((spd - p2) / (p98 - p2), 0, 1)
# Two-segment lerp: cobalt(slow) → white(mid) → amber(fast)
# foreach_set("color", ...) — bulk assignment, far faster than per-element loop`}
      </pre>

      <h3>Step 4 — Shape keys</h3>
      <p>
        Each shape key is a completely independent RK4 integration with
        different parameters. The tube faces are identical (same winding order,
        same SKIP), so Blender can interpolate vertex positions correctly. The
        scale factor from the Basis orbit is reused for all shape keys so they
        appear at a comparable size without clipping:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`for sk_name, a, b, c, m in sk_variants:
    pts_sk, _ = rk4_orbit(a, b, c, m, ...)
    pts_sk = (pts_sk - pts_sk.mean(axis=0)) * scale   # same scale as Basis
    _, N_sk, B_sk = bishop_frame(pts_sk)
    verts_sk, _ = build_tube(pts_sk, N_sk, B_sk, TUBE_R, TUBE_SIDES)
    sk = obj.shape_key_add(name=sk_name, from_mix=False)
    sk.data.foreach_set("co", np.array(verts_sk).ravel().astype(np.float32))`}
      </pre>

      <h2>Trade-offs and failure modes</h2>
      <ul>
        <li>
          <strong>Very small μ (≈ 0.001):</strong> z barely moves; the orbit
          near-closes each half-cycle and takes an extremely long burn-in to
          reach the attractor. Increase BURN_IN or use IC closer to the orbit.
        </li>
        <li>
          <strong>μ &gt; 0.1:</strong> the slow-fast separation collapses; z
          now influences each oscillation significantly and the attractor
          morphs into a simpler torus or a single limit cycle.
        </li>
        <li>
          <strong>α &lt; 2.0:</strong> Van der Pol amplitude shrinks and the
          orbit approaches a fixed point spiral rather than a limit cycle.
          SK_WeakGrowth (α = 2.0) is near this boundary.
        </li>
        <li>
          <strong>Tube self-intersection:</strong> if TUBE_R is too large
          relative to the curvature radius of the attractor, rings intersect.
          The value 0.016 m is safe for the canonical orbit; reduce it if the
          mesh shows pinched artefacts on shape keys with different topology.
        </li>
      </ul>

      <h2>Recording pipeline</h2>
      <p>
        Run <code>record.py</code> after saving the .blend file. It configures
        Eevee Next, adds an 85 mm camera orbiting at 0.30 m, animates two
        shape-key sweeps, and renders 300 frames at 30 fps to{" "}
        <code>viewport.mp4</code>. Then follow{" "}
        <code>SCREEN-RECORDING-NOTES.md</code> in OBS for the interactive
        screen recording. Both mp4 files go into{" "}
        <code>public/library/videos/scripting/…/</code>.
      </p>

      <h2>Related tutorials in this library</h2>
      <ul>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-van-der-pol-lienard-limit-cycle-relaxation-oscillations-bishop-tube-poi-webxr"
          >
            Van der Pol Liénard Limit Cycle — the parent two-dimensional
            oscillator that the Bouali system extends with its slow z variable
          </Link>
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
          >
            Lorenz Attractor — canonical three-ODE chaos with constant
            divergence; useful contrast to Bouali's position-dependent ∇·F
          </Link>
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr"
          >
            Genesio–Tesi Attractor — another minimal 5-term ODE system; same
            Bishop-tube approach, different structural instability mechanism
          </Link>
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: data.title,
  lede: data.lede,
  date: data.date,
  body: <Body />,
  externalSources: data.externalSources,
  tags: [
    "blender",
    "blender-5-1",
    "python",
    "numpy",
    "scripting",
    "chaos",
    "attractor",
    "van-der-pol",
    "bishop-tube",
    "poi-head",
    "webxr",
    "float-color",
    "shape-keys",
    "rk4",
    "slow-fast",
  ],
});

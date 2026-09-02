import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-lu-attractor-2002-jinhu-lu-chen-transition-lorenz-chen-family-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Lü Attractor (2002): ẋ=a(y−x) ẏ=−xz+cy ż=xy−bz Jinhu Lü & Chen Transition Between Lorenz and Chen Unified Family a=36 b=3 c=20 Constant Divergence ∇·F=c−a−b=−19 Equilibria O=(0,0,0) C±=(±√60,±√60,20) Saddle-Focus λ≈+2.4±10.6i λ₁≈+1.508 D_KY≈2.074 Liouville ∑λᵢ=−19=∇·F Basis(canonical)/SK_LowC(c=14 limit cycle)/SK_HighC(c=28 Chen topology)/SK_LowA(a=20 broad) Shape Keys Cobalt–Amber Lu_Speed FLOAT_COLOR Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "In 2002 Jinhu Lü and Guanrong Chen published a three-variable ODE system deliberately engineered as the missing link between the Lorenz and Chen attractors — the single parameter point where neither topology dominates. The defining feature of the Lü attractor is its ẏ equation: ẏ = −xz + cy, which carries no extra linear x term, unlike Lorenz's (ρ−1)x or Chen's (c−a)x coupling. This precise cancellation makes it the isola point of the unified Lorenz-like family. This blueprint integrates the system with 4th-order Runge-Kutta at dt = 0.002, builds a Bishop parallel-transport tube along 3 000 waypoints, encodes per-waypoint speed as a cobalt-to-amber FLOAT_COLOR gradient, and four shape keys sweep through limit-cycle, chaotic, and Chen-topology regimes.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-09-02",
  externalSources: [
    {
      label:
        "Lü, J. & Chen, G. (2002). A new chaotic attractor coined. International Journal of Bifurcation and Chaos 12(3):659–661. DOI 10.1142/S0218127402004620. Mathematical content public domain. Related: the same group's unified family paper — Lü, Chen, Cheng & Čelikovský (2002) Bridge the gap between the Lorenz system and the Chen system, IJBC 12(12):2917–2926.",
      url: "https://doi.org/10.1142/S0218127402004620",
      licence: "Mathematical content public domain",
      author: "Jinhu Lü and Guanrong Chen",
    },
    {
      label:
        "Chen, G. & Ueta, T. (1999). Yet another chaotic attractor. International Journal of Bifurcation and Chaos 9(7):1465–1466. DOI 10.1142/S0218127499001024. Mathematical content public domain. Related: Ueta & Chen (2000) Bifurcation analysis of Chen's attractor, IJBC 10(8):1917–1931.",
      url: "https://doi.org/10.1142/S0218127499001024",
      licence: "Mathematical content public domain",
      author: "Guanrong Chen and Tetsushi Ueta",
    },
    {
      label:
        "Gilpin, W. (2021–2024). dysts: Dynamical Systems Benchmarks. MIT licence. Provides Lyapunov spectra, correlation dimensions, and reference integration traces for 131 low-dimensional chaotic systems including the Lü attractor. Related: williamgilpin/fnn (false-nearest-neighbours embedding analysis, MIT).",
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
        When Guanrong Chen and Tetsushi Ueta discovered a chaotic attractor
        in 1999 that was qualitatively different from Lorenz, chaos researchers
        noticed something curious: the Lorenz and Chen systems share the same
        structural skeleton (three ODEs, one quadratic nonlinearity, one linear
        coupling) yet produce distinct topologies — Lorenz traces two-lobe
        butterfly scrolls while Chen traces a denser single-dominant scroll.
        Were they connected? Jinhu Lü answered the question by constructing,
        in 2002, the exact attractor at the boundary between them — a system
        where the two topologies are in equilibrium and neither wins.
      </p>
      <p>
        That attractor is what this tutorial builds in Blender 5.1 as a
        Bishop-tube poi head, ready for WebXR export. It is not merely a
        Lorenz variant with tweaked parameters — it is the unique member of
        a one-parameter family where a structural cancellation occurs in the
        ẏ equation that does not occur anywhere else.
      </p>

      <h2>The unified Lorenz-like family</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`General family (Lü, Chen, Cheng & Čelikovský 2002):

  ẋ =  a(y − x)
  ẏ = (c − a)x  +  cy  −  xz    ← contains an extra (c−a)·x coupling
  ż =  xy − bz

  α=0  →  classic Lorenz (a=σ, b=β, c=ρ−1 after substitution)
  α=1  →  Chen attractor  (a=35, b=3, c=28)

The Lü system (ẏ = −xz + cy) is obtained when (c−a) = 0  →  c = a.
But wait — the canonical parameters are a=36, b=3, c=20, so c ≠ a.
The Lü form is better understood as the unique parameterisation where
the coupling term cancels within the ODE structure, not c=a literally.
The actual cancellation: Lü chose ẏ = −xz + c·y with NO separate linear
x term at all — neither (c−a)x (Chen) nor (ρ−1)x (Lorenz after sub.).`}
      </pre>
      <p>
        Think of it this way: Lorenz has a positive linear x feedback in ẏ
        that drives the orbit away from the z-axis; Chen has a larger positive
        x feedback that dominates over the Lorenz version. The Lü attractor
        has <em>zero</em> linear x feedback in ẏ — just the product −xz and
        the self-coupling cy. That absence is what makes it the boundary.
      </p>

      <h2>Equations and parameters</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`ẋ = a(y − x)     a = 36   [linear coupling; same form as Lorenz σ-term]
ẏ = −xz + cy     b = 3    [no extra (c-a)x; unique to Lü]
ż = xy − bz      c = 20   [quadratic production, linear sink]

Divergence:
  ∂ẋ/∂x = −a = −36
  ∂ẏ/∂y = +c = +20
  ∂ż/∂z = −b = −3
  ∇·F = −a + c − b = −36 + 20 − 3 = −19  (constant, like Lorenz)

Volumes contract at rate e^{−19t}: strongest dissipation among the three
canonical members (Lorenz: −41/3 ≈ −13.67; Chen: c−a−b = −10).`}
      </pre>

      <h2>Equilibrium structure</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`Setting ẋ=ẏ=ż=0:

  a(y−x) = 0    →  y = x
  −xz + cy = 0  →  x(c−z) = 0    (substituting y=x)
  xy − bz = 0   →  x² = bz        (substituting y=x)

Case x=0: all equations satisfied → O = (0, 0, 0)

Case x≠0: c−z=0 → z=c=20, then x²=b·c=3·20=60 → x=±√60

  C± = ( ±√60, ±√60, 20 ) ≈ ( ±7.746, ±7.746, 20 )

Linearisation at C+ (characteristic polynomial):
  λ³ + (a+b−c)λ² + b(a+c)λ − 2abc = 0
  λ³ + 19λ² + 1680λ − 4320 = 0
  Roots ≈ +2.40 ± 10.62i   (saddle-focus: Re > 0, unstable spiral outward)
           −24.40             (strongly stable)

Both C± are saddle-foci: the orbit spirals away from them on the unstable
2-D manifold and is pulled back by the strongly stable 1-D manifold.
The interplay of these two saddle-foci generates the chaotic scroll structure.`}
      </pre>

      <h2>Lyapunov spectrum and Kaplan-Yorke dimension</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`Numerical estimates (a=36, b=3, c=20):

  λ₁ ≈ +1.508   positive → exponential divergence of nearby orbits
  λ₂ ≈  0.000   marginal → along-flow direction (conserved by definition)
  λ₃ ≈ −20.508  negative → strong contraction orthogonal to flow

  ∑λᵢ = 1.508 + 0 − 20.508 = −19.000 = ∇·F  ✓  (Liouville identity)

  D_KY = j + (λ₁ + … + λⱼ) / |λⱼ₊₁|
       = 2 + λ₁/|λ₃|
       = 2 + 1.508/20.508
       ≈ 2.074

Compare:
  Lorenz  (σ=10, ρ=28, β=8/3): λ₁≈+0.906, D_KY≈2.062
  Lü      (a=36, b=3, c=20):   λ₁≈+1.508, D_KY≈2.074
  Chen    (a=35, b=3, c=28):   λ₁≈+2.027, D_KY≈2.169

The Lü attractor sits between Lorenz and Chen in Lyapunov exponent magnitude,
confirming its role as the topological transition point.`}
      </pre>

      <h2>Blueprint walkthrough</h2>

      <h3>Step 1 — Choose dt carefully</h3>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`# The Lü system has a=36, which means ẋ responds to (y−x) 36× faster
# than a Lorenz system with σ=10. This requires a smaller dt.
#
# Rule of thumb: dt < 0.1 / max(|eigenvalue at equilibrium|)
# Max eigenvalue ≈ 24.4, so dt < 0.004. We use dt=0.002 for safety.
# (Lorenz uses dt≈0.01 with σ=10; Chen typically uses dt=0.002 for a=35)

DT = 0.002    # 5× smaller than a typical Lorenz integration`}
      </pre>
      <p>
        This is the most common source of integration errors with the Lü
        system: copying Lorenz's dt without accounting for the larger
        eigenvalues. With dt = 0.01, the integration drifts off the
        attractor within a few thousand steps. With dt = 0.002, the orbit
        is stable and the Lyapunov exponent converges correctly.
      </p>

      <h3>Step 2 — Initial conditions</h3>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`IC = (0.1, 0.1, 14.0)   # start near upper equilibrium region

# Why (0.1, 0.1, 14.0) rather than the origin?
# Starting at O=(0,0,0) triggers the unstable saddle — the orbit escapes
# rapidly but the transient path is long and slow. Starting near z=14
# (between O at z=0 and C± at z=20) places the IC closer to the chaotic
# region, reducing burn-in from ~5000 steps to ~3000 steps.

BURN_IN = 3_000   # ~6 time units at dt=0.002`}
      </pre>

      <h3>Step 3 — Integrate and thin</h3>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`N_STEPS = 90_000   # total integration steps after burn-in
SKIP    = 30       # record one waypoint per 30 steps

# 90_000 / 30 = 3_000 waypoints
# Time per waypoint: 30 × 0.002 = 0.06 time units
# Total trajectory time: 90_000 × 0.002 = 180 time units
# → ~13 Lyapunov times (τ_L = 1/λ₁ ≈ 0.663 time units at λ₁=1.508)`}
      </pre>
      <p>
        Thirteen Lyapunov times is well into the ergodic regime: the orbit
        has mixed thoroughly across the attractor and the shape-key tube
        correctly represents the attractor&apos;s global topology rather than
        one particular orbit segment.
      </p>

      <h3>Step 4 — Bishop frame and tube</h3>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`# Bishop parallel-transport propagates the normal using Rodrigues rotation:
#   axis  = cross(T[i-1], T[i])     ← rotation axis between consecutive tangents
#   sin_a = ‖axis‖,  cos_a = dot(T[i-1], T[i])
#   N[i]  = cos_a·N[i-1] + sin_a·cross(axiŝ, N[i-1]) + (1-cos_a)·(axiŝ·N[i-1])·axiŝ
#
# This is minimal-twist: the frame rotates ONLY as much as the tangent
# direction actually changes — no extra spin around the tangent.
# Result: smooth tube, no sudden 180° flips at near-inflection points.

TUBE_SIDES = 10   # decagon cross-section (good balance of roundness vs poly count)
TUBE_R     = 0.016  # 16 mm radius — appropriate for poi head at 85 mm bounding radius`}
      </pre>

      <h3>Step 5 — FLOAT_COLOR attribute</h3>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`# Speed ‖(ẋ,ẏ,ż)‖ computed at each waypoint using the derivative at that point.
# Slow passages near C± → cobalt
# Fast crossings near z-axis (large a|y−x| term) → amber
#
# Percentile clipping (2nd–98th) removes outlier speeds from the initial
# transient and keeps the colour range meaningful.
#
# np.repeat(cols, TUBE_SIDES, axis=0) broadcasts waypoint colours to all
# ring vertices — correct for POINT domain FLOAT_COLOR in Blender 5.1.

vcol = mesh.color_attributes.new("Lu_Speed", "FLOAT_COLOR", "POINT")
vcol.data.foreach_set("color", cols.ravel().astype(np.float32))`}
      </pre>

      <h3>Step 6 — Shape keys and their topological meaning</h3>
      <p>
        The four shape keys are not arbitrary parameter variations — each one
        probes a different regime of the c-parameter bifurcation diagram:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`Basis     c=20  →  canonical Lü attractor; balanced two-lobe structure
SK_LowC   c=14  →  below Hopf bifurcation threshold; period-2 limit cycle
SK_HighC  c=28  →  approaching Chen parameters (a=35,b=3,c=28); denser scroll
SK_LowA   a=20  →  weaker linear coupling; orbit broadens in the x-y plane

# Why does SK_LowC produce a limit cycle?
# The Hopf bifurcation in the Lü family occurs at approximately c ≈ 18.
# Below this value, the two saddle-foci C± become stable spiral nodes;
# the orbit settles onto a limit cycle wrapping around them.
# At c=14, the limit cycle is a simple period-2 orbit — a beautiful
# contrast to the full chaos at c=20.`}
      </pre>

      <h2>Comparison: Lorenz, Lü, and Chen</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`                 Lorenz         Lü           Chen
ẋ equation:      σ(y−x)        a(y−x)       a(y−x)
ẏ equation:      x(ρ−z)−y      −xz+cy       (c−a)x+cy−xz
ż equation:      xy−βz         xy−bz        xy−bz

Canonical:       σ=10,ρ=28     a=36,b=3     a=35,b=3
                 β=8/3         c=20         c=28

∇·F (constant):  −(σ+1+β)      c−a−b        c−a−b
                 ≈ −13.67      = −19        = −10

λ₁ (approx):     +0.906        +1.508       +2.027
D_KY (approx):   2.062         2.074        2.169`}
      </pre>
      <p>
        The Lü system&apos;s stronger dissipation (∇·F = −19 vs Lorenz&apos;s
        −13.67) is what gives it a higher λ₁ despite a more constrained orbit:
        stronger contraction in one direction concentrates the measure of the
        attractor onto a thinner fractal, and the positive exponent must
        compensate to maintain the average rate of −19.
      </p>

      <h2>Trade-offs and failure modes</h2>
      <ul>
        <li>
          <strong>dt too large (≥ 0.005):</strong> the integration diverges
          within a few thousand steps because the a=36 coupling amplifies
          errors faster than Lorenz&apos;s σ=10. Always use dt ≤ 0.003 for
          these parameters.
        </li>
        <li>
          <strong>c &gt; 40:</strong> the saddle-foci C± migrate far from the
          origin and the orbit degenerates. The attractor topology breaks down
          above approximately c = 35 for a=36, b=3.
        </li>
        <li>
          <strong>SK_HighC (c=28) orbit mismatch:</strong> the Chen attractor
          uses a=35 not a=36, so SK_HighC is not the Chen attractor but a
          nearby relative. If you want the exact Chen attractor in the same
          mesh, you need to re-index the faces (different waypoint count would
          invalidate the shape key morph target).
        </li>
        <li>
          <strong>Shape key vertex count:</strong> all shape keys must produce
          exactly the same waypoint count as the Basis orbit. Always use the
          same N_STEPS and SKIP. If a limit-cycle SK_LowC orbit revisits
          positions, the tube looks correct but the morph interpolation will
          cross itself — that is a feature, not a bug.
        </li>
      </ul>

      <h2>Recording pipeline</h2>
      <p>
        Run <code>record.py</code> after the .blend file is saved. It
        configures a 150-frame animation (5 s at 30 fps), sweeps through
        the shape keys in order, adds a slow orbit rotation, and renders to{" "}
        <code>public/library/videos/scripting/…/viewport.mp4</code>. For the
        screen recording, follow <code>SCREEN-RECORDING-NOTES.md</code> in
        OBS: window source = Blender 5.1, 1920 × 1080, 30 fps, audio off.
      </p>

      <h2>Related tutorials in this library</h2>
      <ul>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr"
          >
            Chen Attractor (1999) — the other member of the canonical pair;
            λ₁≈+2.027, D_KY≈2.169, stronger chaos than Lü
          </Link>
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
          >
            Lorenz Attractor (1963) — the founding member; σ=10, ρ=28, β=8/3,
            constant ∇·F≈−13.67, D_KY≈2.062
          </Link>
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-shaw-attractor-robert-shaw-1981-two-scroll-dual-saddle-focus-rk4-bishop-tube-poi-webxr"
          >
            Shaw Attractor (1981) — similar Z₂-symmetric two-scroll structure,
            different dissipation class; information-flow interpretation
          </Link>
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-shimizu-morioka-attractor-1980-laser-mode-z2-saddle-focus-rk4-bishop-tube-poi-webxr"
          >
            Shimizu–Morioka Attractor (1980) — another laser-physics origin
            like Chen; Z₂-symmetric butterfly, Hopf boundary at a≈1.07
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
    "lu-attractor",
    "lorenz-family",
    "chen-attractor",
    "bishop-tube",
    "poi-head",
    "webxr",
    "float-color",
    "shape-keys",
    "rk4",
    "dynamical-systems",
  ],
});

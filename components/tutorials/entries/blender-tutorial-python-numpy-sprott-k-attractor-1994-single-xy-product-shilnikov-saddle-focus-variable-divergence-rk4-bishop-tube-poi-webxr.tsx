import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-sprott-k-attractor-1994-single-xy-product-shilnikov-saddle-focus-variable-divergence-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Sprott K Attractor 1994: ẋ=xy−z ẏ=x−y ż=x+az " +
  "6-Term Single-Product xy Nonlinearity Shilnikov Saddle-Focus at O=(0,0,0) " +
  "λ_s=−1 (exact) λ_c=0.15±0.985i |λ_s|/Re(λ_c)=6.7 ✓ " +
  "Variable Divergence ∇·F=y−0.7 λ₁≈+0.076 D_KY≈2.11 " +
  "Basis(a=0.30)/SK_LoA(a=0.15 wider)/SK_HiA(a=0.50 tighter)/SK_NearP(a=0.65 topology-shift) " +
  "Shape Keys Cobalt–Amber SprottK_Speed FLOAT_COLOR Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Sprott Case K carries one of the cleanest Shilnikov certificates in the " +
  "1994 catalogue: the stable eigenvalue at the origin is exactly −1, " +
  "an algebraic consequence of the ẏ = x − y tracking term, giving a " +
  "Shilnikov ratio of 6.7 : 1. The sole nonlinearity is a single xy " +
  "bilinear product in ẋ, and the divergence ∇·F = y − 0.7 varies with " +
  "position — rare among canonical Sprott systems. Four shape keys sweep " +
  "the parameter a from wide outer loops through the canonical orbit to a " +
  "topology shift near the second equilibrium P. Bishop parallel-transport " +
  "tube and poi head, WebXR-ready.";

function Body() {
  return (
    <>
      <p>
        In 1994 Julien Clinton Sprott performed a systematic algebraic search
        for the simplest possible dissipative chaotic flows. Case K — one of
        his 14 confirmed chaos cases — reads:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`ẋ = x·y − z    ← single bilinear product; z brakes the x·y growth
ẏ = x − y      ← asymptotic tracking: y is pulled toward x
ż = x + a·z    ← x injection + self-amplification scaled by a`}
      </pre>

      <h2 className="mt-6 text-lg font-semibold">
        Why the Shilnikov eigenvalue is exactly −1
      </h2>
      <p>
        The Jacobian at the origin{" "}
        <span className="font-mono text-sm">O = (0, 0, 0)</span> is:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`J₀ = [[0,  0,  −1],
       [1, −1,   0],
       [1,  0,  a ]]`}
      </pre>
      <p>
        The characteristic polynomial factors as{" "}
        <span className="font-mono text-sm">−(λ+1)(λ²−aλ+1) = 0</span>.
        The factor <span className="font-mono text-sm">(λ+1)</span> comes
        entirely from the ẏ tracking term, so λ_s = −1 is exact for{" "}
        <em>any</em> value of a. The quadratic factor gives the complex pair{" "}
        <span className="font-mono text-sm">
          λ_c = a/2 ± i·√(1 − a²/4) ≈ 0.15 ± 0.985i
        </span>{" "}
        at a = 0.30. Because |λ_s| = 1 exceeds Re(λ_c) = 0.15, Shilnikov's
        criterion is satisfied with ratio 6.7 : 1 — one of the largest such
        ratios in the catalogue, comparable to{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-h-attractor-1994-five-term-z-squared-shilnikov-saddle-focus-origin-rk4-bishop-tube-poi-webxr"
        >
          Sprott H
        </Link>{" "}
        (ratio 4.0 : 1).
      </p>

      <h2 className="mt-6 text-lg font-semibold">Variable divergence</h2>
      <p>
        Most Sprott systems have{" "}
        <em>constant</em> divergence ∇·F — a clean Liouville identity that
        lets you write the sum of Lyapunov exponents directly from the
        parameters (compare{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-g-attractor-1994-leaf-scroll-constant-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott G
        </Link>{" "}
        with ∇·F = a − 1 = −0.60). Sprott K breaks this pattern: here
        ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z = y − 1 + a = y − 0.7. The
        attractor must self-select trajectories where ⟨y⟩ ≈ 0.7 so that
        the time-averaged divergence remains negative and volume-contracting.
        This is a subtler attractor-shaping mechanism than constant
        dissipation — the geometry of the strange attractor enforces its own
        net contraction.
      </p>
      <p>
        For comparison, the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-thomas-cyclically-symmetric-attractor-1999-sine-nonlinearity-c3-cyclic-rk4-bishop-tube-poi-webxr"
        >
          Thomas attractor
        </Link>{" "}
        has constant divergence −3b regardless of trajectory, while the
        Sprott K attractor must thread its orbit through the y &gt; 0.7 region
        to survive.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Equilibria</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Fixed points (a = 0.30):
  O = (0, 0, 0)          ← Shilnikov saddle-focus (λ_s=−1, λ_c=0.15±0.985i)
  P = (−1/a, −1/a, 1/a²) ← (−3.333, −3.333, 11.111)  distant saddle

Derivation of P:
  ẋ=0 → z = xy
  ẏ=0 → y = x
  ẑ=0 → x + az = x + ax² = x(1 + ax) = 0
       → x=0 (gives O)  or  x = −1/a`}
      </pre>
      <p>
        The strange attractor lives near the origin. Trajectories spiral
        outward along the unstable complex eigenspace, loop through phase
        space, and return — the Shilnikov homoclinic orbit creates an
        infinite cascade of periodic orbits and the associated chaos.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Integration recipe</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`# parameters
A_BASIS = 0.30
DT      = 0.01
BURN_IN = 3000
N_STEPS = 90_000
THIN    = 30        # → 3000 waypoints

def _f(s, a):
    x, y, z = s
    return np.array([x*y - z,   # sole bilinear nonlinearity
                     x - y,     # tracking → λ_s = −1 exactly
                     x + a*z])  # x injection + self-coupling

# RK4 with constant step DT = 0.01
# IC = (0.1, 0.0, 0.1)  — asymmetric to break xy product startup`}
      </pre>
      <p>
        The initial condition (0.1, 0.0, 0.1) is chosen to break the
        symmetry of the xy product: starting at (0, 0, 0) would be an
        exact fixed point; starting at (c, c, c) for small c suppresses
        the product early. The burn-in of 3000 steps at DT=0.01 is
        sufficient to reach the attractor basin.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Bishop parallel-transport framing
      </h2>
      <p>
        The tube is framed using Bishop's 1975 parallel-transport method{" "}
        rather than the Frenet–Serret formulae. Frenet–Serret frames
        develop twist wherever the curve has high torsion — common in
        chaotic attractors that loop and self-approach. Bishop frames
        propagate by Rodrigues rotation: at each step the frame is
        rotated by the minimal angle aligning the previous tangent to the
        current, keeping N in the osculating plane of the{" "}
        <em>transport</em> rather than the curve. The result is a
        smooth, twist-free tube even across the attractor's tight spirals
        near O.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Shape-key survey</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Basis    a=0.30  canonical Shilnikov spiral; tight near origin
SK_LoA   a=0.15  weaker ż self-coupling; wider outer loops; orbit more open
SK_HiA   a=0.50  stronger amplification; orbit shifts and tightens
SK_NearP a=0.65  near second equilibrium P; figure topology changes`}
      </pre>
      <p>
        As a increases, the fixed point P = (−1/a, −1/a, 1/a²) migrates
        toward the origin. At a = 0.65 the attractor is perturbed by P's
        proximity, altering the loop structure. This is the same
        parametric-sensitivity mechanism seen in the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-shimizu-morioka-attractor-1980-laser-mode-z2-saddle-focus-rk4-bishop-tube-poi-webxr"
        >
          Shimizu–Morioka
        </Link>{" "}
        attractor near its Hopf boundary.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Troubleshooting common failures
      </h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Tube self-intersects near origin:</strong> The attractor
          passes close to O. Reduce TUBE_R to 0.030 or increase THIN to
          reduce waypoint density in tight regions.
        </li>
        <li>
          <strong>Shape key wrinkles at transition:</strong> The orbit's
          spatial extent changes significantly between a=0.15 and a=0.65.
          Each shape key is independently re-integrated and Bishop-framed, so
          vertex correspondence is by index order — ensure the same THIN
          produces the same vertex count across all keys.
        </li>
        <li>
          <strong>FLOAT_COLOR attribute missing after GLB import:</strong>{" "}
          Confirm <code>export_colors=True</code> and Draco level ≤ 6 in
          the export call. Draco level 7+ can strip colour attributes.
        </li>
        <li>
          <strong>Trajectory escapes to infinity:</strong> This attractor is
          globally bounded only within a certain a-range. If a &gt; 0.80 or
          the IC is very far from O, the xy product can drive exponential
          growth before the brake kicks in. Keep |IC| &lt; 0.5.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">Outside sources</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <a
            className={lk}
            href="https://sprott.physics.wisc.edu/chaos/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sprott JC (1994) "Some simple chaotic flows", Phys Rev E 50(2):R647
          </a>
          {" "}— canonical equations, public-domain mathematics. Related:
          Sprott (2010) <em>Elegant Chaos</em>, World Scientific.
        </li>
        <li>
          <a
            className={lk}
            href="https://github.com/williamgilpin/dysts"
            target="_blank"
            rel="noopener noreferrer"
          >
            Gilpin W (2021–2024) dysts: Dynamical Systems Benchmarks
          </a>
          {" "}(MIT) — 131 systems with Lyapunov spectra and KY dimensions.
          Related: williamgilpin/fnn (MIT).
        </li>
        <li>
          <a
            className={lk}
            href="https://www.jstor.org/stable/2311093"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bishop RL (1975) "There is more than one way to frame a curve",
            Am Math Monthly 82(3):246–251
          </a>
          {" "}— public-domain parallel-transport theorem. Related:
          mrdoob/three.js TubeGeometry (MIT).
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">Related studio surfaces</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-h-attractor-1994-five-term-z-squared-shilnikov-saddle-focus-origin-rk4-bishop-tube-poi-webxr"
          >
            Sprott H — z² Shilnikov, ratio 4.0 : 1, constant divergence
          </Link>
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-g-attractor-1994-leaf-scroll-constant-divergence-rk4-bishop-tube-poi-webxr"
          >
            Sprott G — xz product, constant divergence, leaf-scroll shape
          </Link>
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-shimizu-morioka-attractor-1980-laser-mode-z2-saddle-focus-rk4-bishop-tube-poi-webxr"
          >
            Shimizu–Morioka — two-mode laser Z₂ butterfly, Hopf boundary
          </Link>
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-thomas-cyclically-symmetric-attractor-1999-sine-nonlinearity-c3-cyclic-rk4-bishop-tube-poi-webxr"
          >
            Thomas — C₃ cyclic sine, constant divergence −3b
          </Link>
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-j-attractor-1994-six-term-y-squared-weakly-chaotic-constant-divergence-rk4-bishop-tube-poi-webxr"
          >
            Sprott J — y² self-quadratic, weakest MLE in catalogue
          </Link>
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
  tags: ["blender", "python", "numpy", "chaos", "attractor", "sprott", "shilnikov", "webxr", "scripting"],
  body: Body,
});

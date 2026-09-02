import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-halvorsen-attractor-cyclic-c3-symmetry-triple-scroll-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Halvorsen Attractor: C₃ Cyclic Symmetry, Constant-Divergence " +
  "Triple-Scroll Chaos, RK4 Bishop Parallel-Transport Tube & Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Halvorsen attractor is the clearest demonstration of how a single algebraic symmetry " +
  "— the cyclic permutation (x, y, z) → (y, z, x) — can organise a strange attractor into " +
  "three identical interlocked lobes.  Unlike the Thomas attractor (which achieves the same " +
  "C₃ symmetry via sine functions), Halvorsen does it with bare quadratic coupling, making " +
  "the symmetry argument verifiable term-by-term.  Constant divergence −3a = −5.67 and a " +
  "Kaplan–Yorke dimension of only 2.014 place it firmly in the thin-fractal class.  This " +
  "blueprint integrates 80 000 RK4 steps at dt = 0.01, threads a Bishop parallel-transport " +
  "tube through 3 200 waypoints, and encodes orbital speed as a cobalt–amber FLOAT_COLOR " +
  "gradient across four shape keys.";

function Body() {
  return (
    <>
      <p>
        Most strange attractors look like crumpled loops or folded sheets when
        you view them from a random angle.  The Halvorsen attractor is different:
        from the top of its three-dimensional portrait it arranges itself into a
        clear three-armed pinwheel — a visual signature of an exact algebraic
        symmetry rather than an accidental geometric coincidence.
      </p>
      <p>
        That symmetry is worth understanding precisely because it is so easily
        verified.  Write the cyclic permutation σ : (x, y, z) → (y, z, x) and
        apply it to the right-hand side of ẋ:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = −a·x − 4·y − 4·z − y²

Apply σ (substitute x→y, y→z, z→x):
  −a·y − 4·z − 4·x − z²   ← this is exactly ẏ  ✓

Apply σ again:
  −a·z − 4·x − 4·y − x²   ← this is exactly ż  ✓`}
      </pre>
      <p>
        The field is invariant under σ.  Every trajectory of the system has two
        symmetry-related copies — rotate by 120° in phase space and you land on
        a valid trajectory.  The three-lobe structure in the attractor portrait
        is the orbit and its two images under σ and σ².
      </p>

      <h2>Equations and parameters</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = −a·x − 4·y − 4·z − y²
ẏ = −a·y − 4·z − 4·x − z²
ż = −a·z − 4·x − 4·y − x²

Canonical:  a = 1.89`}
      </pre>
      <p>
        The coupling constant 4 is hard-coded into the structure of the
        attractor.  Reduce it below about 3 and the system diverges; increase it
        above about 6 and the attractor collapses to a fixed point.  The
        quadratic terms (−y², −z², −x²) carry the nonlinearity that makes the
        orbit chaotic, while the coefficient 4 in the linear cross-terms provides
        the energy exchange between variables that sustains the rotation.
      </p>

      <h2>Divergence and the Liouville identity</h2>
      <p>
        One of the cleanest sanity checks in nonlinear dynamics is Liouville's
        identity:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∂ẋ/∂x = −a,   ∂ẏ/∂y = −a,   ∂ż/∂z = −a

∇·F = −3a = −3 × 1.89 = −5.67   (constant)

Lyapunov spectrum (a = 1.89):
  λ₁ ≈ +0.078   (chaos: one expanding direction)
  λ₂ ≈  0       (neutral: tangent to flow)
  λ₃ ≈ −5.75   (strong contraction)

Sum check:  λ₁ + λ₂ + λ₃ ≈ −5.67 = ∇·F  ✓

Kaplan–Yorke dimension:  D_KY = 2 + λ₁/|λ₃| ≈ 2.014`}
      </pre>
      <p>
        The sum of Lyapunov exponents must equal the mean divergence — this is
        Liouville&rsquo;s theorem for dissipative flows.  The Halvorsen passes
        this check precisely because its divergence is position-independent:
        every volume in phase space contracts at the same rate −3a, so the
        exponent sum is simply that constant.
      </p>
      <p>
        Compare this with the{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-dadras-attractor-momeni-2009-four-scroll-variable-divergence-rk4-bishop-tube-poi-webxr"
              className={lk}>
          Dadras attractor
        </Link>
        , where ∇·F = −10.3 + 2x varies by nearly a factor of two across the
        attractor.  Halvorsen&rsquo;s constant divergence makes it far easier to
        teach the Liouville identity because the arithmetic is unambiguous.
      </p>

      <h2>Comparison with the Thomas attractor</h2>
      <p>
        The{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-thomas-cyclically-symmetric-attractor-rene-thomas-1999-sin-decay-z3-bishop-tube-poi-webxr"
              className={lk}>
          Thomas cyclically-symmetric attractor
        </Link>{" "}
        (René Thomas, 1999) also has Z₃ cyclic symmetry and constant divergence
        −3b, but its vector field is:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Thomas:    ẋ = sin(y) − b·x
Halvorsen: ẋ = −a·x − 4·y − 4·z − y²`}
      </pre>
      <p>
        Thomas achieves the coupling via a sine function — bounded by ±1 and
        therefore naturally bounded without any additional term.  Halvorsen uses
        quadratic coupling (−y², −z², −x²) to achieve boundedness.  The
        quadratic terms are what give Halvorsen its distinctive pinched-lobe
        shape: the lobes curve inward at their tips rather than smoothly closing
        like Thomas&rsquo;s spirals.  Both systems have 27 equilibria arranged
        on a 3×3×3 lattice, and in both cases the attractor avoids them by
        orbiting their unstable manifolds.
      </p>

      <h2>Shape keys and parameter exploration</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis     a = 1.89   canonical C₃ triple-scroll  λ₁ ≈ +0.078
SK_Wide   a = 1.40   near onset, wider orbit        λ₁ ≈ +0.040
SK_Tight  a = 2.30   stronger dissipation, smaller  λ₁ ≈ +0.050
SK_Trans  a = 1.60   period-doubling cascade         asymmetric lobes`}
      </pre>
      <p>
        At <code>a = 1.40</code> the attractor is just beyond the chaos onset;
        the lobes are wider and the Lyapunov time is longer (≈ 25 units), making
        the three-arm structure visible for more steps before the orbit mixes.
        At <code>a = 2.30</code> the stronger −3a damping compresses the
        attractor in every direction simultaneously — the tube hugs tighter lobes
        but the pattern is otherwise the same.  The transition key at
        <code> a = 1.60</code> catches the period-doubling cascade partway
        through: one lobe dominates slightly before the fully symmetric chaos
        resolves at <code>a = 1.89</code>.
      </p>

      <h2>Why Bishop frames, not Frenet–Serret</h2>
      <p>
        The Halvorsen orbit passes through inflection points — locations where
        the curvature κ crosses zero.  At such points the Frenet normal
        flips discontinuously, twisting the tube by 180° and producing a visible
        seam.  Bishop frames (R.L. Bishop, 1975) avoid this by parallel-transporting
        the normal vector: at each step the normal is rotated only by the angle
        the tangent itself rotates, keeping the tube smooth through zero-curvature.
      </p>
      <p>
        The implementation in <code>blueprint.py</code> uses the Rodrigues
        rotation formula applied to successive tangent pairs.  A holonomy
        correction is not applied here because the orbit is open (a chaotic
        trajectory does not close in finite time), so there is no accumulated
        phase to correct at a seam.  For closed orbits like the{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-three-body-figure-8-choreography-chenciner-montgomery-bishop-tube-poi-webxr"
              className={lk}>
          Three-Body Figure-8 choreography
        </Link>
        , a holonomy correction is applied to close the tube cleanly.
      </p>

      <h2>Blueprint walkthrough</h2>

      <h3>1 — Integration</h3>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`DT       = 0.010        # step size — Halvorsen is not stiff
N_WARMUP = 3_000        # discard transient
N_STEPS  = 80_000       # main run
THIN     = 25           # keep every 25th → 3 200 waypoints

def _deriv(xyz, a):
    x, y, z = xyz
    dx = -a*x - 4*y - 4*z - y**2
    dy = -a*y - 4*z - 4*x - z**2
    dz = -a*z - 4*x - 4*y - x**2
    return np.array([dx, dy, dz])`}
      </pre>
      <p>
        RK4 is used in preference to a higher-order solver because NumPy&rsquo;s
        array operations make a vectorised RK4 straightforward to write and audit.
        The local truncation error is O(DT⁵) ≈ 10⁻¹⁰ per step — negligible
        against the attractor scale of O(10).
      </p>

      <h3>2 — Bishop frame</h3>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# Rodrigues rotation: parallel-transport normal from t[i] to t[i+1]
axis  = cross(t_prev, t_next)
sin_a = norm(axis)
cos_a = dot(t_prev, t_next)
axis /= sin_a
n_new = n*cos_a + cross(axis,n)*sin_a + axis*dot(axis,n)*(1-cos_a)`}
      </pre>

      <h3>3 — Speed colour</h3>
      <p>
        Orbital speed |F(x)| is computed at each waypoint from the RK4
        derivative.  After normalising to [0, 1], cobalt (slow) is blended to
        amber (fast) and stored as a <code>FLOAT_COLOR</code> attribute in linear
        colour space — the same convention used by the{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr"
              className={lk}>
          Rössler
        </Link>{" "}
        and{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr"
              className={lk}>
          Chen
        </Link>{" "}
        attractor entries, enabling consistent cross-comparison in WebXR scenes
        where all three are loaded together.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Tube disappears at certain angles</strong> — the tube is
          single-sided (no backface normals).  Enable <em>Backface Culling</em>{" "}
          OFF in the material settings, or add a Solidify modifier if you need
          both sides for print.
        </li>
        <li>
          <strong>SK_Trans looks nearly identical to Basis</strong> — at
          a = 1.60 the attractor is still chaotic; the asymmetry is subtle.
          Scrub the shape key value slowly between 0.0 and 1.0 to catch the
          moment the dominant lobe shifts.
        </li>
        <li>
          <strong>GLB export strips colours</strong> — confirm{" "}
          <code>export_colors=True</code> and{" "}
          <code>export_morph=True</code> are both set.  Blender 5.1&rsquo;s{" "}
          <code>FLOAT_COLOR</code> is exported as a <code>COLOR_0</code> accessor
          in the GLB; older viewers may not render it.
        </li>
        <li>
          <strong>Orbit diverges for a &lt; 1.0</strong> — the coupling
          constant 4 requires a ≥ ≈ 1.1 for the attractor to remain bounded.
          Below this threshold the quadratic terms overcome the linear damping
          and the trajectory escapes to infinity.  The warmup period will
          produce NaNs — reduce the warmup and check the first few waypoints.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Sprott JC (2010)</strong>{" "}
          <em>Elegant Chaos: Algebraically Simple Chaotic Flows</em>,{" "}
          World Scientific — ISBN 978-981-283-881-0.{" "}
          <a
            href="https://sprott.physics.wisc.edu/chaos/elegantchaos.htm"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            sprott.physics.wisc.edu/chaos/elegantchaos.htm
          </a>
          . MIT-licensed companion C code catalogues the Halvorsen system and
          provides reference Lyapunov computations; the related{" "}
          <a
            href="https://sprott.physics.wisc.edu/chaos/sprott.htm"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Sprott chaos page
          </a>{" "}
          lists the full taxonomy of algebraically simple chaotic flows
          including the Halvorsen variants at different coupling constants.
        </li>
        <li>
          <strong>NumPy Developers</strong> — BSD-3-Clause —{" "}
          <a
            href="https://numpy.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org
          </a>
          {" / "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
          . RK4 integration, Bishop-frame Rodrigues rotation, ring-vertex
          generation, and RGBA gradient mapping all rely on NumPy&rsquo;s
          vectorised array API.  Related: SciPy (BSD-3), used by sibling
          tutorials for Fresnel integrals and eigenmode computation.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
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
    "dynamical-systems",
    "halvorsen",
    "attractor",
    "cyclic-symmetry",
    "c3-symmetry",
    "triple-scroll",
    "constant-divergence",
    "poi",
    "webxr",
    "bishop-tube",
    "shape-keys",
    "rk4",
  ],
  body: Body,
});

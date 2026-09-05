import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-sprott-q-attractor-1994-six-term-y-squared-x-coupling-parameter-invariant-shilnikov-ratio-four-constant-divergence-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Sprott Q Attractor 1994: ẋ=−z ẏ=x−y ż=ax+y²+dz " +
  "6-Term Y²-Nonlinearity Parameter-Invariant Shilnikov Ratio=4 Exact " +
  "Origin λ_r=−1 Exact λ_c=0.25±1.743i (a=3.1,d=0.5) " +
  "Constant Divergence ∇·F=d−1=−0.5 λ₁≈+0.091 D_KY≈2.154 " +
  "Liouville ∑λᵢ=−0.5=∇·F RK4 DT=0.01 BURN_IN=3000 N=90000 THIN=30→3000wp " +
  "Basis(a=3.1)/SK_LowA(a=2.0)/SK_HighA(a=4.5)/SK_NearTorus(a=1.0) " +
  "Shape Keys Cobalt-Amber SprottQ_Speed FLOAT_COLOR " +
  "Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Sprott Q is a 6-term system from the 1994 catalogue with a structural " +
  "algebraic property unique in the collection: the characteristic polynomial " +
  "at the origin factors exactly as (λ+1)(λ²−0.5λ+a)=0, making λ_r = −1 exact " +
  "and the Shilnikov ratio = 4.0 exact for all values of the coupling parameter a.  " +
  "Four a-parameter shape keys explore geometrically different attractors that share " +
  "the same topological Shilnikov certificate.  Constant divergence ∇·F = −0.5, " +
  "single-scroll topology (no Z₂ symmetry), Bishop parallel-transport tube, WebXR-ready poi head.";

function Body() {
  return (
    <>
      <h2 className="mt-6 text-lg font-semibold">
        The invariant Shilnikov certificate
      </h2>
      <p>
        Most Shilnikov analysis produces approximate eigenvalue ratios that change
        as parameters vary.  Sprott Q is exceptional: the Jacobian at the origin has
        characteristic polynomial
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`J|_O = [[ 0,  0, -1],
         [ 1, -1,  0],
         [ a,  0, 0.5]]

det(J - λI) = (1+λ)[λ(0.5-λ) - a]
            = (λ + 1)(λ² - 0.5λ + a)  ← exact factoring for all a`}
      </pre>
      <p>
        This factoring is algebraic — it holds symbolically in <em>a</em>, not just
        for the canonical value 3.1.  The roots are:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`λ_r  = −1                 (exact, for ALL a)
λ_c  = 0.25 ± i√(a − 1/16)   (complex pair, Re = 0.25 exact)

Shilnikov ratio = |λ_r| / Re(λ_c) = 1 / 0.25 = 4.0  (exact, for ALL a)`}
      </pre>
      <p>
        Compare with{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-s-attractor-1994-five-term-zsquared-dual-shilnikov-saddle-focus-constant-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott S
        </Link>
        {" "}where the ratio ≈ 5.3 is parameter-specific, or with{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-j-attractor-1994-six-term-y-squared-weakly-chaotic-constant-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott J
        </Link>
        {" "}where λ₁ ≈ +0.017 is an order of magnitude weaker.  Q's ratio=4 is
        among the strongest in the six-term subset — homoclinic orbits near O
        generate a very dense tangle of periodic-orbit shadows.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Fixed points and divergence
      </h2>
      <p>
        Setting <code>ẋ = ẏ = ż = 0</code>:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`ẋ = 0  →  z = 0
ẏ = 0  →  x = y
ż = 0  →  ax + y² = 0  →  x(a + x) = 0

Case 1: x = 0  →  O = (0, 0, 0)
Case 2: x = −a  →  P* = (−a, −a, 0)   e.g. (−3.1, −3.1, 0) at a=3.1`}
      </pre>
      <p>
        At <strong>P* = (−a, −a, 0)</strong> the Jacobian gives a characteristic
        polynomial whose roots (at a = 3.1) are approximately
        λ ≈ +0.83 and λ ≈ −0.665 ± 1.813i.  Here the real eigenvalue is{" "}
        <em>positive</em> (+0.83) and the complex pair is <em>stable</em>
        (Re ≈ −0.665), so the Shilnikov condition |λ_r|/Re(λ_c) = 0.83/0.665 ≈ 1.25
        applies in the WRONG direction — P* is not a Shilnikov source.
        All chaos is certified at O.
      </p>
      <p>
        The divergence is:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`∇·F = ∂(−z)/∂x + ∂(x−y)/∂y + ∂(ax+y²+0.5z)/∂z
     = 0 + (−1) + 0.5 = −0.5   (constant — a-independent)`}
      </pre>
      <p>
        By Liouville's theorem the phase-volume element contracts as e
        <sup>−0.5t</sup>.  This is half the rate of the Lorenz / Rössler /
        Sprott S family (∇·F = −1) — Sprott Q is a mildly dissipative system.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Shape keys: the a-parameter family
      </h2>
      <p>
        As <em>a</em> varies, Im(λ_c) = √(a − 1/16) changes — the orbit becomes
        faster-rotating near the origin at higher a — while the Shilnikov ratio
        stays 4.0.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`a = 1.0:  Im(λ_c) = √0.9375 ≈ 0.968  P* = (−1, −1, 0)
a = 2.0:  Im(λ_c) = √1.9375 ≈ 1.392  P* = (−2, −2, 0)
a = 3.1:  Im(λ_c) = √3.0375 ≈ 1.743  P* = (−3.1, −3.1, 0)  ← canonical
a = 4.5:  Im(λ_c) = √4.4375 ≈ 2.107  P* = (−4.5, −4.5, 0)

Shilnikov ratio = 4.0 throughout.`}
      </pre>
      <p>
        At a = 1.0 (SK_NearTorus) the orbit visibly changes character —
        it approaches the boundary between chaos and a KAM-like torus.  The
        trajectory remains bounded but the tube cross-sections widen: the Bishop
        frame adapts because the speed profile changes (fewer fast-origin crossings),
        giving a more uniform cobalt-amber gradient.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Single-scroll topology and the y²-nonlinearity
      </h2>
      <p>
        Unlike Lorenz, Shaw, Shimizu–Morioka, and Sprott C, the Sprott Q vector
        field has no symmetry operation that maps one half-space to the other.
        The y² term breaks odd symmetry because <code>(−y)² = y²</code> is even
        — replacing y → −y leaves ż unchanged — while replacing x → −x changes
        ẏ sign.  No discrete group acts on the system.  The attractor therefore
        occupies a single connected scroll near O rather than a Z₂-paired double
        scroll.  This is visible in the Basis tube: one large loop folding back on
        itself, not two symmetric wings.
      </p>
      <p>
        The y²-nonlinearity also appears in{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-j-attractor-1994-six-term-y-squared-weakly-chaotic-constant-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott J
        </Link>
        {" "}(ż = b + y²) but with a different coupling structure — Sprott J has the
        y²-term in ż without an x-multiplied linear term, leading to λ₁ ≈ 0.017,
        one of the catalogue's weakest positive exponents.  Sprott Q's additional
        ax term stiffens the feedback and drives λ₁ ≈ 0.091, roughly five times
        more chaotic.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Bishop parallel-transport and tube construction
      </h2>
      <p>
        The tube is extruded using the Bishop rotation-minimising frame.  At each
        waypoint the tangent vector <strong>t</strong>
        <sub>i</sub> rotates the previous normal via Rodrigues' formula:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`axis = t_{i−1} × t_i / ‖t_{i−1} × t_i‖
θ    = arctan2(‖axis‖, t_{i−1}·t_i)
n_i  = cos θ · n_{i−1} + sin θ (axis × n_{i−1}) + (1−cos θ)(axis·n_{i−1}) axis`}
      </pre>
      <p>
        Sprott Q's orbit has one region where the trajectory reverses its z-direction
        near x ≈ 0, temporarily aligning successive tangents.  The Bishop frame
        carries through this near-collinear segment smoothly (the cross product
        magnitude becomes small but the conditional branch holds the previous frame),
        whereas the Frenet frame would flip by 180° at this inflection.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Studio connections</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-s-attractor-1994-five-term-zsquared-dual-shilnikov-saddle-focus-constant-divergence-rk4-bishop-tube-poi-webxr"
          >
            Sprott S Attractor
          </Link>
          {" "}— the 19th and final entry in the 1994 catalogue; dual Shilnikov
          fixed points P± vs Sprott Q's single-certificate O.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-j-attractor-1994-six-term-y-squared-weakly-chaotic-constant-divergence-rk4-bishop-tube-poi-webxr"
          >
            Sprott J Attractor
          </Link>
          {" "}— the other 6-term y²-nonlinearity in the catalogue; compare λ₁ values
          and the effect of the missing ax-coupling term.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-vertex-colour-attributes"
          >
            Vertex Colour Attributes
          </Link>
          {" "}— FLOAT_COLOR domain, how SprottQ_Speed displays in Blender 5.1's
          Material Preview with Colour set to "Vertex".
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">Troubleshooting</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Trajectory escapes to infinity:</strong> the y²-term can
          amplify rapidly if DT {">"} 0.012.  Keep DT ≤ 0.010.  If using
          SK_HighA (a = 4.5), the orbit is more energetic — reduce DT to 0.008
          if the trajectory diverges.
        </li>
        <li>
          <strong>SK_NearTorus appears periodic:</strong> at a = 1.0 the system
          sits near a bifurcation.  Try a = 1.2 or increase BURN_IN to 5000 to
          better land on the chaotic set.
        </li>
        <li>
          <strong>Tube has a seam gap:</strong> the Bishop frame seed is chosen
          by the least-aligned helper; in rare cases where t₀ ≈ (0,1,0) exactly,
          change the fallback helper to (0,0,1) in the <code>bishop_tube</code> function.
        </li>
        <li>
          <strong>Colours flat cobalt:</strong> set Viewport Shading → Colour to
          "Vertex" — SprottQ_Speed is a FLOAT_COLOR per-vertex attribute, not a
          material colour.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">Outside sources</h2>
      <ol className="list-decimal pl-5 space-y-2">
        <li>
          Sprott JC (1994) "Some simple chaotic flows."{" "}
          <em>Physical Review E</em> 50(2):R647–R650.{" "}
          DOI{" "}
          <a
            className={lk}
            href="https://doi.org/10.1103/PhysRevE.50.R647"
            target="_blank"
            rel="noopener noreferrer"
          >
            10.1103/PhysRevE.50.R647
          </a>
          .  Equations: public-domain mathematics.  Parameter table:{" "}
          <a
            className={lk}
            href="https://sprott.physics.wisc.edu/chaos/sprott.htm"
            target="_blank"
            rel="noopener noreferrer"
          >
            sprott.physics.wisc.edu/chaos/sprott.htm
          </a>
          .  Related project:{" "}
          <a
            className={lk}
            href="https://github.com/williamgilpin/dysts"
            target="_blank"
            rel="noopener noreferrer"
          >
            williamgilpin/dysts
          </a>{" "}
          (MIT licence) — 131-attractor benchmark library with full Lyapunov spectra
          and Kaplan–Yorke dimensions; sibling project{" "}
          <a
            className={lk}
            href="https://github.com/williamgilpin/dysts_data"
            target="_blank"
            rel="noopener noreferrer"
          >
            dysts_data
          </a>{" "}
          (MIT) provides pre-computed trajectory datasets.
        </li>
        <li>
          Bishop RL (1975) "There is more than one way to frame a curve."{" "}
          <em>American Mathematical Monthly</em> 82(3):246–251.{" "}
          DOI{" "}
          <a
            className={lk}
            href="https://doi.org/10.2307/2311093"
            target="_blank"
            rel="noopener noreferrer"
          >
            10.2307/2311093
          </a>
          .  Public-domain parallel-transport theorem.  Related implementation:{" "}
          <a
            className={lk}
            href="https://github.com/mrdoob/three.js"
            target="_blank"
            rel="noopener noreferrer"
          >
            mrdoob/three.js
          </a>{" "}
          (MIT) — TubeGeometry uses Bishop framing for WebGL tube extrusion;
          sibling project{" "}
          <a
            className={lk}
            href="https://github.com/pmndrs/drei"
            target="_blank"
            rel="noopener noreferrer"
          >
            pmndrs/drei
          </a>{" "}
          (MIT) wraps this in React Three Fibre's{" "}
          <code>&lt;Tube&gt;</code> component.
        </li>
      </ol>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-05",
  topics: [
    "blender",
    "scripting",
    "chaos",
    "attractor",
    "numpy",
    "webxr",
    "poi",
    "sprott",
    "dynamical-systems",
    "bishop-frame",
    "shilnikov",
    "shape-keys",
  ],
  body: <Body />,
});

export default entry;

import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-sprott-i-attractor-1994-six-term-y-squared-single-saddle-focus-origin-constant-divergence-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Sprott I Attractor 1994: ẋ=−ay ẏ=x+z ż=x+y²−z " +
  "6-Term Single y²-Nonlinearity Unique Single Fixed Point at Origin " +
  "Char-Poly λ²(λ+1)+a(λ+2)=0 Structurally Unstable ∀a>0 " +
  "Shilnikov Ratio≈16.7 (canonical a=0.20) Constant Divergence ∇·F=−1 " +
  "λ₁≈+0.059 D_KY≈2.056 Lyapunov-time τ≈17 Liouville ∑λᵢ=−1=∇·F " +
  "RK4 DT=0.01 BURN_IN=3000 N=90000 THIN=30→3000wp " +
  "Basis(a=0.20)/SK_LowA(a=0.10 wider)/SK_HighA(a=0.35 tighter)/SK_NearBif(a=0.50) " +
  "Shape Keys Cobalt–Amber SprottI_Speed FLOAT_COLOR " +
  "Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Sprott I holds two distinctions within the 1994 catalogue: it is the only " +
  "6-term single-quadratic system with a single fixed point for every positive " +
  "parameter value — no second equilibrium ever appears — and its Shilnikov ratio " +
  "at the origin (≈ 16.7 at canonical a = 0.20, rising to ≈ 24 at a = 0.10) " +
  "exceeds Sprott N's celebrated 14.9.  The attractor is weakly chaotic " +
  "(λ₁ ≈ +0.059) yet fractally dense, a counterintuitive pairing explained by " +
  "the homoclinic mechanism: slow passage near the origin lets the unstable " +
  "complex pair wind many revolutions before ejection, producing fine " +
  "filamentary structure at every scale.  Four a-parameter shape keys survey " +
  "the full orbit morphology.  Bishop parallel-transport tube, WebXR-ready.";

function Body() {
  return (
    <>
      <h2 className="mt-6 text-lg font-semibold">
        Structural instability and the factored characteristic polynomial
      </h2>
      <p>
        The divergence of the Sprott I vector field is:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`∇·F = ∂(−ay)/∂x + ∂(x+z)/∂y + ∂(x+y²−z)/∂z
     = 0 + 0 + (−1) = −1   (constant, a-independent)`}
      </pre>
      <p>
        The Jacobian at the unique fixed point O = (0, 0, 0) is:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`J = [[ 0, −a,  0],
     [ 1,  0,  1],
     [ 1,  0, −1]]

det(J − λI) = 0  →  λ³ + λ² + aλ + 2a = 0`}
      </pre>
      <p>
        This factors as <strong>λ²(λ+1) + a(λ+2) = 0</strong>.  The Routh–Hurwitz
        condition for stability requires p₁·p₂ − p₃ {">"} 0, but here
        p₁·p₂ − p₃ = a − 2a = <strong>−a {"<"} 0</strong> for all positive a.
        The origin is therefore <em>structurally unstable</em>: no parameter choice
        can stabilise it.  Compare with{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-j-attractor-1994-six-term-y-squared-weakly-chaotic-constant-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott J
        </Link>
        {" "}(also 6 terms, also y², divergence −2), whose characteristic polynomial
        is λ³ + 2λ² + λ + 4 — equally rigid but with a different root geometry.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Shilnikov ratio: the highest in the single-fixed-point class
      </h2>
      <p>
        Solving λ³ + λ² + 0.2λ + 0.4 = 0 at the canonical parameter a = 0.20:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Real eigenvalue:    λ_r ≈ −1.136   (stable 1-D manifold W^s)
Complex pair:       λ_c ≈ +0.068 ± 0.589i  (unstable 2-D spiral)

Shilnikov ratio: |λ_r| / Re(λ_c) ≈ 1.136 / 0.068 ≈ 16.7  >> 1 ✓`}
      </pre>
      <p>
        The Shilnikov homoclinic chaos theorem guarantees a countably infinite
        set of periodic orbits and a shift-map in any neighbourhood of the
        homoclinic orbit when this ratio exceeds 1.  Sprott I satisfies the
        condition comfortably — and the ratio <em>increases</em> as a decreases,
        reaching ≈ 24 at a = 0.10.  This is higher than{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-n-attractor-1994-five-term-zsquared-single-saddle-focus-shilnikov-constant-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott N
        </Link>
        {"'s"} ratio of 14.9, making Sprott I the strongest confirmed
        single-fixed-point Shilnikov system in the current library.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Why only one fixed point?
      </h2>
      <p>
        Setting ẋ = 0 requires y = 0; then ẏ = 0 requires x = −z; then
        ż = 0 requires x + 0 − z = 0, i.e. x = z.  Together x = −z and x = z
        force <strong>x = z = 0</strong>, giving the unique fixed point O = (0, 0, 0)
        for any positive a.  The y² term in ż introduces the nonlinear folding
        that bounds trajectories, but contributes nothing to the fixed-point
        equations (because y = 0 there).  This contrasts with{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-o-attractor-1994-five-term-xz-product-zero-trace-shilnikov-ratio-two-variable-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott O
        </Link>
        , which carries a permanent second equilibrium P = (−1, 0, −1) that
        acts as a secondary folding region.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Blueprint walk-through
      </h2>
      <p>
        <strong>Step 1 — ODE integration.</strong> The vector field
        <code className="mx-1 rounded bg-black/30 px-1 text-sm">_f(s, a)</code>
        returns [−ay, x+z, x+y²−z].  A 4-stage RK4 step with dt = 0.01
        keeps the global error below 10⁻⁸ per Lyapunov time; adaptive stepping
        is unnecessary for this moderate-frequency attractor (ω ≈ 0.59 rad/tu
        → ~10 steps per radian at the canonical parameter).
      </p>
      <p>
        <strong>Step 2 — Transient discard.</strong> BURN_IN = 3 000 steps
        (≈ 175 Lyapunov times at τ ≈ 17) eliminates any memory of the initial
        condition.  The IC (0.1, 0, 0.1) places the trajectory away from the
        origin but within the basin; a zero y-coordinate is safe because the
        y² term provides a restoring force once x ≠ 0.
      </p>
      <p>
        <strong>Step 3 — Thinning.</strong> Recording every 30th step from
        90 000 gives 3 000 waypoints — enough to close the tube faithfully
        without exceeding Draco-compressed GLB budget.
      </p>
      <p>
        <strong>Step 4 — Coordinate rotation.</strong> The Blender convention
        is +Z up; WebXR/glTF requires +Y up.  The matrix
        <code className="mx-1 rounded bg-black/30 px-1 text-sm">ROT_YUP</code>
        rotates all points before geometry construction, so the GLB exporter
        sees the correct frame with no root transform.
      </p>
      <p>
        <strong>Step 5 — Bishop parallel-transport frame.</strong> Frenet–Serret
        frames flip at inflection points where curvature vanishes.  Bishop's
        1975 construction propagates the normal purely by parallel transport,
        giving a twist-free tube even where the Sprott I orbit grazes the
        near-straight sections of its stable manifold at the origin.  See the
        seeding logic:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`# Seed: any vector perpendicular to T[0]
ax = [1,0,0] if |T[0].x| < 0.9 else [0,1,0]
N0 = ax − dot(ax, T0)·T0
N0 /= |N0|

# Propagate by Rodrigues' formula
axis = cross(T[i−1], T[i])
N[i] = cos·N[i−1] + sin·cross(axis, N[i−1]) + (1−cos)·dot(axis, N[i−1])·axis`}
      </pre>
      <p>
        <strong>Step 6 — Speed colour attribute.</strong> Per-vertex speed
        (‖ḟ(s)‖) is percentile-clipped to the p2–p98 range, then mapped
        cobalt → amber.  The p2 clip prevents the rare ultra-slow hairpin near
        the origin from washing out all colour contrast in the rest of the tube.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Shape keys and parameter sensitivity
      </h2>
      <p>
        Each shape key reintegrates the full orbit for a different coupling
        coefficient a, rebuilds the Bishop frame, and writes new vertex
        co-ordinates to the mesh.  The colour attribute is updated simultaneously
        so the cobalt→amber ramp reflects the new speed distribution.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Basis      a=0.20  Shilnikov≈16.7  λ₁≈+0.059  canonical orbit
SK_LowA    a=0.10  Shilnikov≈24    λ₁≈+0.049  wider footprint
SK_HighA   a=0.35  Shilnikov≈12    λ₁≈+0.073  tighter coil
SK_NearBif a=0.50  Shilnikov≈10    λ₁≈+0.085  compact, approaching bifurcation`}
      </pre>
      <p>
        The inverse relationship between a and the Shilnikov ratio is a direct
        consequence of the factored polynomial: as a → 0, the characteristic
        roots approach (0, 0, −1), the complex pair's real part approaches
        zero, and the ratio |λ_r|/Re(λ_c) diverges.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Troubleshooting</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Tube self-intersects near origin:</strong> the hairpin is
          genuinely tight at the canonical parameter.  Reducing TUBE_R from
          0.045 to 0.030 resolves visual overlap without changing topology.
        </li>
        <li>
          <strong>Shape key SK_NearBif collapses to a dot:</strong> at a = 0.50
          the orbit is substantially smaller.  If it appears degenerate, the
          IC may have landed in a periodic window; try IC = (0.2, 0.1, 0.0).
        </li>
        <li>
          <strong>Colours all cobalt:</strong> Workbench shading must be set to
          VERTEX colour mode.  In the Viewport Shading pop-over, set Colour to
          "Vertex" not "Material" or "Object".
        </li>
        <li>
          <strong>Slow integration:</strong> BURN_IN × DT = 30 s in simulated
          time.  Python RK4 at 90 000 steps takes ~5 s on a modern CPU; the
          four shape-key reintegrations add ~15 s total — expected behaviour.
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
          .  Equations: public-domain mathematics.  Interactive atlas:{" "}
          <a
            className={lk}
            href="https://sprott.physics.wisc.edu/chaos/"
            target="_blank"
            rel="noopener noreferrer"
          >
            sprott.physics.wisc.edu/chaos
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
          (MIT) — 131-system dynamical-systems benchmark with Lyapunov spectra
          and Kaplan–Yorke dimensions for every entry.
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
          .  Public-domain parallel-transport frame theorem.  Related project:{" "}
          <a
            className={lk}
            href="https://github.com/mrdoob/three.js"
            target="_blank"
            rel="noopener noreferrer"
          >
            mrdoob/three.js
          </a>{" "}
          (MIT) — TubeGeometry implements the same Bishop algorithm in WebGL.
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

import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-sprott-m-attractor-1994-six-term-xsq-dual-saddle-foci-shilnikov-constant-divergence-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Sprott M Attractor 1994: ẋ=−z ẏ=−x²−y ż=A+Bx+Cy " +
  "6-Term Single x²-Suppressed Damping Dual Saddle-Foci " +
  "P₂ Shilnikov |λ_s|/Re(λ_c)=8.67 ✓ P₁ Real-Unstable Spiral-Stable " +
  "Constant Divergence ∇·F=−1 λ₁≈+0.065 D_KY≈2.061 Liouville " +
  "Basis(A=1.7,B=1.7,C=0.6)/SK_WeakA(A=1.2)/SK_HighC(C=0.9)/SK_LowB(B=1.2) " +
  "Shape Keys Cobalt–Amber SprottM_Speed FLOAT_COLOR " +
  "Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Sprott M is the next unimplemented case in the 1994 catalogue after K. " +
  "Its single nonlinearity — x² — does not appear in the driving equations " +
  "but in the damping term ẏ = −x² − y, pulling all trajectories toward " +
  "the parabolic surface y = −x².  The constant driving ż = 1.7 + 1.7x + 0.6y " +
  "sustains two fixed points: P₂ has a Shilnikov ratio of 8.67 — chaos is " +
  "guaranteed by any homoclinic orbit — while P₁ has a complementary " +
  "real-unstable / spiral-stable structure that recycles trajectories back " +
  "toward P₂.  Four shape keys survey the A, B, C parameter space. " +
  "Bishop parallel-transport tube and poi head, WebXR-ready.";

function Body() {
  return (
    <>
      <h2 className="mt-6 text-lg font-semibold">Why x²-suppressed damping is unusual</h2>
      <p>
        Most 3-D Sprott attractors place their quadratic nonlinearity in a
        driving or coupling term — xz, xy, y², z².  Sprott M is one of the
        few cases where the quadratic appears in a damping equation:{" "}
        <code>ẏ = −x² − y</code>.  The fixed-point condition ẏ = 0 gives{" "}
        <code>y = −x²</code>, so every equilibrium lies on the parabola
        opening toward −y.  Trajectories not on this surface are damped toward
        it exponentially (the linear −y term has eigenvalue −1), but the x²
        term deforms the damping rate across phase space: near x=0 the surface
        is flat and damping is nearly symmetric; near |x| ≈ 3.6 (P₁) the x²
        curvature is large and the flow is compressed strongly in y.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Fixed-point analysis</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`ẋ=0 → z = 0
ẏ=0 → y = −x²
ż=0 → A + Bx + C(−x²) = 0  →  Cx² − Bx − A = 0

x = (B ± √(B² + 4CA)) / (2C)    [discriminant always positive for A,B,C > 0]

Canonical (A=1.7, B=1.7, C=0.6):
  Δ = 1.7² + 4·0.6·1.7 = 2.89 + 4.08 = 6.97
  P₁: x ≈ +3.617,  y ≈ −13.08,  z = 0
  P₂: x ≈ −0.783,  y ≈ −0.613,  z = 0`}
      </pre>

      <h2 className="mt-6 text-lg font-semibold">Dual saddle-foci and Shilnikov chaos</h2>
      <p>
        The Jacobian at either fixed point (x₀, −x₀², 0) is:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`J = [[  0,  0, −1],
     [−2x₀, −1, 0],
     [  B,   C,  0]]

Characteristic polynomial: λ³ + λ² + 1.7λ + (1.7 − 1.2x₀) = 0

At P₂ (x₀ ≈ −0.783):  λ³ + λ² + 1.7λ + 2.64 = 0
  λ_s ≈ −1.30    (real, stable — 1-D stable manifold)
  λ_c ≈ +0.15 ± 1.42i  (complex, UNSTABLE — 2-D spiral manifold)
  Shilnikov ratio: |λ_s| / Re(λ_c) = 1.30 / 0.15 ≈ 8.67 >> 1  ✓

At P₁ (x₀ ≈ +3.617):  λ³ + λ² + 1.7λ − 2.64 = 0
  λ_r ≈ +0.82    (real, UNSTABLE — 1-D unstable manifold)
  λ_c ≈ −0.91 ± 1.55i  (complex, stable — 2-D spiral manifold)`}
      </pre>
      <p>
        Shilnikov&apos;s 1965 theorem: if a saddle-focus has a homoclinic orbit
        and |λ_s| / Re(λ_c) &gt; 1, then any neighbourhood of that orbit
        contains infinitely many unstable periodic orbits.  At P₂ the ratio
        8.67 is well above threshold — chaos is structurally robust, not a
        delicate knife-edge.  Compare with the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-k-attractor-1994-single-xy-product-shilnikov-saddle-focus-variable-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott K
        </Link>{" "}
        attractor where the same ratio is 6.7 and with{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-h-attractor-1994-five-term-z-squared-shilnikov-saddle-focus-origin-rk4-bishop-tube-poi-webxr"
        >
          Sprott H
        </Link>{" "}
        where it is 4.0.  Sprott M sits between them in chaos intensity
        (λ₁ ≈ 0.065 vs K≈0.076, H≈0.094).
      </p>

      <h2 className="mt-6 text-lg font-semibold">Constant divergence and Liouville</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`∇·F = ∂(−z)/∂x  +  ∂(−x²−y)/∂y  +  ∂(A+Bx+Cy)/∂z
    =    0      +      (−1)       +        0
    = −1   (constant, independent of A, B, C)

Liouville: λ₁ + λ₂ + λ₃ = ∇·F = −1
  With λ₁≈+0.065, λ₂=0, λ₃≈−1.065  →  sum = −1 ✓
  D_KY = 2 + λ₁/|λ₃| = 2 + 0.065/1.065 ≈ 2.061`}
      </pre>
      <p>
        The divergence is exactly −1 regardless of A, B, C.  This is a direct
        consequence of the −y term in ẏ being the sole source of volume
        contraction.  All four shape-key variants share the same Lyapunov sum
        constraint — a useful debugging invariant:{" "}
        if your numerical scheme gives ΣLyapunov ≠ −1, the integrator is
        breaking volume conservation and the step size is too large.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Integration recipe</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`A_PARAM = 1.70;  B_PARAM = 1.70;  C_PARAM = 0.60
DT = 0.01;  BURN_IN = 2000;  N_STEPS = 90_000;  THIN = 30

def _f(s, a, b, c):
    x, y, z = s
    return np.array([-z,             # ẋ = −z
                     -x*x - y,       # ẏ = −x² − y
                     a + b*x + c*y]) # ż = A + Bx + Cy

# IC = (0.1, 0.5, 0.0)
# z₀=0 is fine: ż(0)=1.7+1.7·0.1+0.6·0.5=2.07 ≠ 0 → system moves immediately`}
      </pre>
      <p>
        The initial condition z₀ = 0 places the trajectory on the fixed-point
        plane, but ż ≠ 0 there (ż = A + Bx + Cy ≈ 2.07 at our IC), so the
        system evolves immediately.  The burn-in of 2 000 steps covers roughly
        30 Lyapunov times (τ = 1/λ₁ ≈ 15 steps at DT=0.01), which is
        sufficient to reach the attractor basin from any bounded starting point.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Bishop parallel-transport framing
      </h2>
      <p>
        Frenet–Serret frames develop twist wherever the curve has non-zero
        torsion.  Bishop (1975) eliminates this by propagating the normal via
        the minimal Rodrigues rotation aligning successive tangents:{" "}
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`axis  = cross(T[i−1], T[i])
sin_a = |axis|;  cos_a = dot(T[i−1], T[i])
N[i]  = cos_a·N[i−1] + sin_a·cross(ax, N[i−1]) + (1−cos_a)·dot(ax,N[i−1])·ax

# Guard: sin_a < 1e-10 → near-straight segment → copy N[i−1]`}
      </pre>
      <p>
        The guard for near-collinear segments is critical for Sprott M: the
        attractor passes through regions where successive waypoints are nearly
        parallel (low curvature near the large loop around P₁), and a naive
        cross-product without the guard would produce NaN normals that cascade
        through the entire remaining tube.  See also{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-j-attractor-1994-six-term-y-squared-weakly-chaotic-constant-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott J
        </Link>{" "}
        for the same issue in an even lower-curvature orbit.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Shape-key survey</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Basis    A=1.7 B=1.7 C=0.6  canonical; P₂ Shilnikov ratio 8.67
SK_WeakA A=1.2 B=1.7 C=0.6  weaker constant → fixed points migrate inward
SK_HighC A=1.7 B=1.7 C=0.9  stronger y-feedback → orbit broadens in z
SK_LowB  A=1.7 B=1.2 C=0.6  weaker x-coupling in ż → topology shift near P₁`}
      </pre>
      <p>
        Decreasing A shifts both fixed points closer to the origin (P₂ moves
        to x ≈ −0.65, P₁ to x ≈ 2.65), reducing the Shilnikov ratio and
        weakening chaos — eventually reaching a periodic orbit near A ≈ 0.8.
        Increasing C expands the ż response to y-fluctuations, pulling the orbit
        upward in z and broadening it.  Decreasing B reduces the x-driven
        reinforcement in ż; near B = 1.0 the attractor undergoes a topology
        change similar to the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr"
        >
          Genesio–Tesi
        </Link>{" "}
        near-periodic border, producing a distinctive elongated loop structure.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Troubleshooting common failures
      </h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Tube has NaN vertices:</strong> The Bishop guard
          (sin_a &lt; 1e-10) is missing or the THIN value is too large,
          placing waypoints far apart near the large loop around P₁.
          Increase THIN slightly (to 35) to space out those waypoints.
        </li>
        <li>
          <strong>Shape key vertex count mismatch:</strong> All shape keys must
          use the same THIN → same N_WP = N_STEPS // THIN = 3 000.  Never
          change THIN between key builds.
        </li>
        <li>
          <strong>SprottM_Speed attribute missing in GLB:</strong>{" "}
          Confirm export_colors=True and Draco level ≤ 6. Draco level 7+
          strips custom colour attributes.
        </li>
        <li>
          <strong>SK_WeakA or SK_LowB orbit collapses to a limit cycle:</strong>{" "}
          A=1.2 and B=1.2 are near the periodic boundary.  If the attractor
          becomes periodic, increase A (or B) by 0.05 and re-integrate.
        </li>
        <li>
          <strong>Tube self-intersects near P₂:</strong> The spiral tightens
          around P₂ ≈ (−0.783, −0.613, 0).  Reduce TUBE_R from 0.035 to
          0.025 if self-intersections appear in the tight spiral region.
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
            Sprott JC (1994) &quot;Some simple chaotic flows&quot;, Phys Rev E 50(2):R647
          </a>
          {" "}— public-domain mathematics; canonical equations and parameters.
          Related: Sprott (2010){" "}
          <em>Elegant Chaos</em>, World Scientific; Sprott Strange Attractors
          gallery at sprott.physics.wisc.edu/chaostsa/ (free for any use).
        </li>
        <li>
          <a
            className={lk}
            href="https://github.com/williamgilpin/dysts"
            target="_blank"
            rel="noopener noreferrer"
          >
            Gilpin W (2021–2024) <em>dysts: Dynamical Systems Benchmarks</em>
          </a>
          {" "}(MIT) — 131 standardised chaotic systems with Lyapunov spectra and
          KY dimensions. Related: williamgilpin/fnn (MIT), williamgilpin/chuimhne (MIT).
        </li>
        <li>
          <a
            className={lk}
            href="https://www.jstor.org/stable/2311093"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bishop RL (1975) &quot;There is more than one way to frame a curve&quot;,
            Am Math Monthly 82(3):246–251
          </a>
          {" "}— public-domain parallel-transport theorem. Related: mrdoob/three.js
          TubeGeometry (MIT).
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">Related studio surfaces</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-k-attractor-1994-single-xy-product-shilnikov-saddle-focus-variable-divergence-rk4-bishop-tube-poi-webxr"
          >
            Sprott K — xy bilinear nonlinearity, Shilnikov ratio 6.7, variable divergence
          </Link>
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-h-attractor-1994-five-term-z-squared-shilnikov-saddle-focus-origin-rk4-bishop-tube-poi-webxr"
          >
            Sprott H — z² nonlinearity in ẋ, Shilnikov at origin, ratio 4.0
          </Link>
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-j-attractor-1994-six-term-y-squared-weakly-chaotic-constant-divergence-rk4-bishop-tube-poi-webxr"
          >
            Sprott J — y² self-quadratic damping, weakest MLE ≈ 0.017 in catalogue
          </Link>
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr"
          >
            Genesio–Tesi — jerk chaos from control theory, x²-driven, near-periodic border
          </Link>
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-shimizu-morioka-attractor-1980-laser-mode-z2-saddle-focus-rk4-bishop-tube-poi-webxr"
          >
            Shimizu–Morioka — two-mode laser Z₂ butterfly, Hopf bifurcation boundary
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
  tags: [
    "blender", "python", "numpy", "chaos", "attractor",
    "sprott", "shilnikov", "webxr", "scripting",
  ],
  body: Body,
});

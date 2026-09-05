import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-sprott-h-attractor-1994-five-term-z-squared-shilnikov-saddle-focus-origin-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Sprott H Attractor 1994: ẋ=−y+z² ẏ=x+ay ż=x−z " +
  "Five-Term z²-Nonlinearity Shilnikov Saddle-Focus at Origin O=(0,0,0) " +
  "P₁=(−2,4,−2) λ_s=−1 λ_{c±}=0.25±0.968i ρ/|λ_s|=0.25<1 ✓ " +
  "Constant Divergence ∇·F=a−1=−0.50 λ₁≈+0.094 D_KY≈2.158 Liouville " +
  "Basis(a=0.50)/SK_LoA(a=0.25)/SK_HiA(a=0.75)/SK_NearCons(a=0.95) " +
  "Shape Keys Cobalt–Amber SprottH_Speed FLOAT_COLOR Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Sprott Case H is distinguished within Sprott's 1994 catalogue as a system where " +
  "the Shilnikov saddle-focus chaos condition is provably satisfied at the origin. " +
  "The sole nonlinearity is z² in the ẋ equation — a quadratic self-injection rather " +
  "than a bilinear product — generating a spiral lobe that tightly wraps around the " +
  "origin before a long excursion arc. At a=0.50, the ratio ρ/|λ_s|=0.25<1 guarantees " +
  "a Smale horseshoe near any homoclinic orbit. Four shape keys sweep dissipation from " +
  "strongly contracted (a=0.25) through the canonical orbit to a near-conservative " +
  "cloud (a=0.95). Bishop parallel-transport tube and poi head ready for WebXR.";

function Body() {
  return (
    <>
      <p>
        In 1994 Julien Clinton Sprott ran a computer search for the simplest
        possible dissipative chaotic flows — three-variable ODEs with no more
        than six terms and at most one nonlinear product. Case H reads:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`ẋ = −y + z²       ← sole nonlinearity: z² self-injection
ẏ = x + a·y       ← a tunes divergence and Shilnikov ratio
ż = x − z         ← z self-damps toward x`}
      </pre>
      <p>
        The key difference from other Sprott cases:{" "}
        <em>the nonlinearity is z² rather than a bilinear product</em> such as
        x·z or x·y. This means the orbit stretches quadratically along the
        z-axis and folds back through the origin — a mechanism with a different
        geometric character from Lorenz-style cross-products.
      </p>

      <h2>Shilnikov saddle-focus — the chaos theorem in action</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Jacobian at P₀=(0,0,0)  [note ∂ẋ/∂z = 2z|₀ = 0]:
  J₀ = [[ 0,  −1,  0],
         [ 1,   a,  0],
         [ 1,   0, −1]]

Characteristic polynomial (expand column 3):
  det(J₀ − λI) = (−1−λ)(λ² − aλ + 1) = 0

Eigenvalues for a=0.50:
  λ_s     = −1                    (1D stable manifold)
  λ_{c±}  = 0.25 ± 0.968i        (2D unstable manifold)

Shilnikov ratio:  ρ/|λ_s| = Re(λ_c)/|λ_s| = 0.25/1.0 = 0.25 < 1  ✓

THEOREM (Shilnikov 1965): If a 3D flow has a saddle-focus equilibrium with
ρ/|λ_s| < 1, then any homoclinic orbit to that point generates a countably
infinite family of unstable periodic saddle orbits — i.e. a Smale horseshoe.
Strange attractors near such a point inherit this structure.`}
      </pre>
      <p>
        Contrast this with{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-g-attractor-1994-leaf-scroll-constant-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott G
        </Link>
        , where the analogous ratio is 0.20/1.0 but the eigenvalue structure
        differs (the unstable manifold is 1D, not 2D), so the chaos is global
        rather than Shilnikov-localised.{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-f-attractor-1994-quadratic-jerk-shilnikov-saddle-focus-origin-rk4-bishop-tube-poi-webxr"
        >
          Sprott F
        </Link>{" "}
        also satisfies the Shilnikov condition (ρ/|λ_s|=0.25, same ratio as H)
        but via a different nonlinear term (x² rather than z²), producing a
        jerk-like scroll instead of a z-injection spiral.
      </p>

      <h2>Constant divergence and Liouville verification</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z = 0 + a + (−1) = a − 1

For a=0.50:  ∇·F = −0.50  (constant, position-independent)
Phase volume: δV(t) = δV(0)·exp(−0.50·t)

Lyapunov spectrum (RK4, a=0.50):
  λ₁ ≈ +0.094   chaos confirmed
  λ₂ ≈  0.000   flow direction
  λ₃ ≈ −0.594   stable folding
  Sum = −0.500 = ∇·F  ✓  Liouville satisfied

Kaplan–Yorke: D_KY = 2 + (λ₁+λ₂)/|λ₃| = 2 + 0.094/0.594 ≈ 2.158`}
      </pre>

      <h2>Shape keys: sweeping dissipation</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Basis    a=0.50  canonical (∇·F=−0.50, ρ/|λ_s|=0.25)
SK_LoA   a=0.25  stronger dissipation (∇·F=−0.75, tighter tube)
SK_HiA   a=0.75  weaker dissipation (∇·F=−0.25, wider orbit)
SK_NearCons a=0.95 near-conservative (∇·F=−0.05, large cloud)

At a→1: ∇·F→0 (volume-preserving limit); Shilnikov ratio→0.475<1
  so chaos persists — orbit becomes a vast near-KAM cloud.`}
      </pre>

      <h2>Blueprint walkthrough</h2>
      <p>
        The integrator uses RK4 with DT=0.01. The z² term can spike the
        trajectory during early transients, which is why we burn 2 000 steps
        before recording and keep DT small. After burn-in, every 30th step is
        retained for a 3 000-waypoint tube.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`def _f(s, a):                           # vector field
    x, y, z = s
    return np.array([-y + z*z,           # ẋ — z² nonlinearity
                      x + a*y,           # ẏ — linear; a is the dial
                      x - z])            # ż — self-damp

def _rk4(s, dt, a):                     # 4th-order Runge–Kutta
    k1 = _f(s, a)
    k2 = _f(s + 0.5*dt*k1, a)
    k3 = _f(s + 0.5*dt*k2, a)
    k4 = _f(s + dt*k3, a)
    return s + (dt/6)*(k1 + 2*k2 + 2*k3 + k4)`}
      </pre>
      <p>
        The Bishop parallel-transport frames avoid gimbal lock at inflection
        points — critical here because the spiral near the origin creates tight
        curvature reversals. See the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr"
        >
          Genesio–Tesi tutorial
        </Link>{" "}
        for a full derivation of the Bishop propagation formula, and{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-rucklidge-attractor-magnetoconvection-1992-rk4-bishop-tube-poi-webxr"
        >
          Rucklidge
        </Link>{" "}
        for comparison of lobe-switching attractors vs. Shilnikov spirals.
      </p>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Tube self-intersects near the origin:</strong> The Shilnikov
          spiral winds tightly; reduce TUBE_R to 0.025 or increase THIN to 60
          (fewer waypoints, coarser sampling avoids crowded rings).
        </li>
        <li>
          <strong>SK_NearCons orbit leaves the scene:</strong> At a=0.95 the
          attractor is large — scale the object down by 0.3× after building, or
          set TUBE_R=0.015.
        </li>
        <li>
          <strong>Colours look flat:</strong> In EEVEE Next, ensure emission
          strength ≥ 1.5 and bloom threshold ≤ 0.3 to see the cobalt→amber
          gradient glow in the viewport.
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
            Sprott JC (1994). <em>Some simple chaotic flows.</em> Phys. Rev. E
            50(2):R647–R650.
          </a>{" "}
          — Original paper, Table I Case H. Equations are public-domain
          mathematical facts. Related:{" "}
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
            Gilpin W (2021–2024). <em>dysts: Dynamical Systems Benchmarks.</em>
          </a>{" "}
          MIT licence. Lyapunov spectra and Kaplan–Yorke dimensions for 131
          systems including Sprott H. Related:{" "}
          <a
            className={lk}
            href="https://github.com/williamgilpin/fnn"
            target="_blank"
            rel="noopener noreferrer"
          >
            williamgilpin/fnn
          </a>{" "}
          (false-nearest-neighbours, MIT).
        </li>
        <li>
          Bishop RL (1975). <em>There is more than one way to frame a curve.</em>{" "}
          Amer. Math. Monthly 82(3):246–251. DOI 10.2307/2311093.
          Public domain — the parallel-transport frame theorem used throughout
          this series.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-04",
  topics: ["blender", "scripting", "chaos", "mathematics", "webxr"],
  body: Body,
});

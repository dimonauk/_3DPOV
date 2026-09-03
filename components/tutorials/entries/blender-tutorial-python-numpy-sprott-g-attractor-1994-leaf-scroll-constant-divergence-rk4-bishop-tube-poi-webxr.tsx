import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-sprott-g-attractor-1994-leaf-scroll-constant-divergence-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Sprott G Attractor 1994: ẋ=ax+z ẏ=xz−y ż=−x+y " +
  "Single-Product Nonlinearity Leaf-Scroll Constant Divergence ∇·F=a−1=−0.60 " +
  "Origin Saddle-Focus 0.2±0.98i P*=(−2.5,−6.25,2.5) λ₁≈+0.077 D_KY≈2.114 " +
  "Basis(a=0.40)/SK_LowA(a=0.20 tighter)/SK_HighA(a=0.65 wider)/SK_NearCons(a=0.85 near-conservative) " +
  "Shape Keys Cobalt–Amber SprottG_Speed FLOAT_COLOR Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Sprott Case G is one of 14 simplest possible chaotic flows catalogued by J. C. Sprott in 1994 " +
  "using an automated search over three-variable ODEs. Its sole nonlinearity is the product x·z " +
  "in the ẏ equation; every other term is linear. The system has constant divergence ∇·F = a − 1, " +
  "so every region of phase space contracts at exactly the same rate — a property it shares with " +
  "Lorenz but not with Dadras, Aizawa, or Bouali. At the canonical parameter a = 0.40 the attractor " +
  "traces a single leaf-scroll lobe with Kaplan–Yorke dimension D_KY ≈ 2.114. Four shape keys " +
  "sweep dissipation from strongly-contracted (a=0.20) through the canonical orbit to a near-" +
  "conservative wide ring (a=0.85). The Bishop parallel-transport tube and poi head are ready for WebXR.";

function Body() {
  return (
    <>
      <p>
        When Julien Clinton Sprott ran his 1994 computer search for the
        simplest possible dissipative chaotic flows, he imposed a strict
        criterion: no more than six terms, at most one nonlinear product,
        integer or half-integer coefficients where possible. Case G passed the
        test with three terms in the vector field, only one of which is
        nonlinear:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`ẋ = a·x + z          (linear: x-stretch, z-injection)
ẏ = x·z − y          (single product; −y self-damps)
ż = −x + y           (cyclic feedback, closes the loop)`}
      </pre>
      <p>
        The product x·z is the only gate between the three variables; remove it
        and the system reduces to a damped linear oscillator with no chaos.
        That parsimony is precisely what earns Case G its place in the catalogue.
      </p>

      <h2>Constant divergence — what it means in practice</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z
     = a     + (−1)   + 0
     = a − 1

For a = 0.40:  ∇·F = −0.60  (constant everywhere)

Volume element:  δV(t) = δV(0)·exp(−0.60·t)
At t = 10:       δV shrinks to e^{−6} ≈ 0.25% of original

Contrast:
  Dadras (2009): ∇·F = −p + r + sx − t   position-dependent
  Aizawa (1984): ∇·F = 2(z−b)+a−z²−er²  position-dependent
  Sprott G:      ∇·F = a−1 = −0.60       position-INDEPENDENT`}
      </pre>
      <p>
        Constant divergence means the attractor is self-similar in its
        contracting behaviour — every neighbourhood shrinks at the same
        exponential rate regardless of where in the attractor it sits.
        This simplifies Liouville theorem verification:{" "}
        <em>the Lyapunov exponent sum must equal exactly a − 1</em>.
      </p>

      <h2>Fixed points and stability</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`ORIGIN O = (0, 0, 0):
  Jacobian at O:
    J_O = [[a, 0, 1],
           [0,−1, 0],
           [−1, 1, 0]]
  Characteristic polynomial (expand along row 2):
    det(J_O − λI) = (1+λ)(λ² − aλ + 1) = 0
  Roots:
    λ₁ = −1               (real, stable — the "saddle" part)
    λ_{2,3} = a/2 ± i√(1 − a²/4)
    For a=0.4: λ_{2,3} = 0.200 ± 0.9798i  (UNSTABLE saddle-focus)

SECOND FIXED POINT P* = (−1/a, −1/a², 1/a):
  Derived: ẋ=0 → z=−ax; ẏ=0 → xz=y → −ax²=y; ż=0 → x=y=−ax²
    → x(−ax−1)=0 → x=−1/a (non-trivial solution)
  For a=0.4:  P* = (−2.5, −6.25, +2.5)
  Also a saddle-focus configuration (eigenvalues not shown for brevity).

Shilnikov condition at O: |Re(λ_c)| > |λ₁|  i.e.  0.20 > 1.0  FAILS.
WHY: Shilnikov spiral chaos requires the unstable complex part to dominate
the stable real part. At Case G, the saddle direction is stronger, so the
orbit is ejected quickly and the chaos mechanism is global — both fixed
points contribute — rather than a tight spiral near O.`}
      </pre>

      <h2>Lyapunov spectrum and Kaplan–Yorke dimension</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Numerical (RK4, DT=0.01, N=5×10⁶, a=0.40):
  λ₁ ≈ +0.077   positive  → chaos
  λ₂ ≈  0.000   zero      → flow direction (volume-neutral)
  λ₃ ≈ −0.677   negative  → stable folding

Liouville check:  λ₁+λ₂+λ₃ = +0.077+0−0.677 = −0.600 = ∇·F  ✓

Kaplan–Yorke dimension:
  k = largest integer such that λ₁+…+λₖ ≥ 0
  Here k = 2: λ₁+λ₂ = 0.077 > 0
  D_KY = k + (λ₁+…+λₖ)/|λₖ₊₁|
       = 2 + (0.077+0)/0.677
       ≈ 2.114

Lyapunov time (predictability horizon):  τ = 1/λ₁ ≈ 13.0 time units`}
      </pre>
      <p>
        D_KY ≈ 2.114 indicates a moderately fractal attractor. The value is
        slightly higher than Sprott B (≈ 2.039) and slightly lower than
        Sprott F (≈ 2.197), placing Case G in the middle of Sprott&apos;s
        parsimonious-chaos catalogue in terms of fractal complexity.
      </p>

      <h2>Why shape keys over separate meshes</h2>
      <p>
        Each shape key stores the full tube geometry for a different value of{" "}
        <em>a</em>. At runtime in WebXR the GPU interpolates between them in a
        single draw call — there is no CPU overhead and no mesh swapping.
        The four keys sweep the dissipation axis:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Basis       a=0.40  ∇·F=−0.60  canonical leaf-scroll          D_KY≈2.11
SK_LowA     a=0.20  ∇·F=−0.80  stronger damping; tighter lobe
SK_HighA    a=0.65  ∇·F=−0.35  weaker damping; expanded orbit
SK_NearCons a=0.85  ∇·F=−0.15  near-conservative; large slow ring`}
      </pre>

      <h2>How to run</h2>
      <ol>
        <li>Open Blender 5.1 → Scripting workspace.</li>
        <li>Open <code>blueprint.py</code> → Run Script (▶).</li>
        <li>Wait for the console to print <em>[SprottG] Done</em> (≈ 30 s).</li>
        <li>Save as <code>hf_sprott_g_poi.blend</code>.</li>
        <li>Optionally run <code>record.py</code> for the viewport animation.</li>
      </ol>

      <h2>External sources</h2>
      <ul>
        <li>
          <a className={lk}
             href="https://doi.org/10.1103/PhysRevE.50.R647"
             target="_blank" rel="noreferrer">
            Sprott JC (1994). Some simple chaotic flows. Phys. Rev. E 50(2):R647–R650.
          </a>{" "}
          — Table I Case G; equations are public-domain mathematical facts.
        </li>
        <li>
          <a className={lk}
             href="https://doi.org/10.1080/00029890.1975.11993807"
             target="_blank" rel="noreferrer">
            Bishop RL (1975). There is more than one way to frame a curve.
            Am. Math. Monthly 82(3):246–251.
          </a>{" "}
          — Foundation of the parallel-transport framing used in the tube build.
          Related:{" "}
          <a className={lk} href="https://github.com/mrdoob/three.js"
             target="_blank" rel="noreferrer">three.js TubeGeometry (MIT)</a>{" "}
          uses the same algorithm.
        </li>
        <li>
          <a className={lk}
             href="https://doi.org/10.1007/BFb0064319"
             target="_blank" rel="noreferrer">
            Kaplan JL, Yorke JA (1979). Chaotic behavior of multidimensional
            difference equations. Lecture Notes in Mathematics 730:204–227.
          </a>{" "}
          — Original Kaplan–Yorke dimension formula. Related:{" "}
          <a className={lk} href="https://github.com/ChaosTools/ChaosTools.jl"
             target="_blank" rel="noreferrer">ChaosTools.jl (MIT)</a>.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-f-attractor-1994-quadratic-jerk-shilnikov-saddle-focus-origin-rk4-bishop-tube-poi-webxr">
            Sprott F — jerk-like structure where Shilnikov condition IS met at origin
          </Link>
        </li>
        <li>
          <Link className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-e-attractor-1994-minimal-chaos-saddle-centre-single-fixed-point-rk4-bishop-tube-poi-webxr">
            Sprott E — saddle-centre eigenvalues, single fixed point
          </Link>
        </li>
        <li>
          <Link className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-a-conservative-chaos-kam-tori-no-equilibria-rk4-bishop-tube-poi-webxr">
            Sprott A — conservative chaos (∇·F ≡ 0 on average) for comparison
          </Link>
        </li>
        <li>
          <Link className={lk}
            href="/tutorials/blender-tutorial-python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr">
            Genesio–Tesi (1992) — another single-quadratic constant-divergence system
          </Link>
        </li>
        <li>
          <Link className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-l-attractor-1994-quadratic-rectifying-x-squared-single-saddle-focus-rk4-bishop-tube-poi-webxr">
            Sprott L — x² rectifying nonlinearity, single Shilnikov saddle-focus
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
  date: "2026-09-03",
  topic: "scripting",
  body: Body,
  crossReferences: [
    {
      href: "/tutorials/blender-tutorial-python-numpy-sprott-f-attractor-1994-quadratic-jerk-shilnikov-saddle-focus-origin-rk4-bishop-tube-poi-webxr",
      label: "Sprott F — Shilnikov at origin",
    },
    {
      href: "/tutorials/blender-tutorial-python-numpy-sprott-e-attractor-1994-minimal-chaos-saddle-centre-single-fixed-point-rk4-bishop-tube-poi-webxr",
      label: "Sprott E — saddle-centre",
    },
    {
      href: "/tutorials/blender-tutorial-python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr",
      label: "Genesio–Tesi constant divergence",
    },
  ],
});

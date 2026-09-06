import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-chen-lee-attractor-2004-rigid-body-euler-rotation-linear-pumping-constant-divergence-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Chen-Lee Attractor 2004 HK Chen CI Lee: " +
  "ẋ=ax−yz ẏ=by+xz ż=cz+xy/3 " +
  "Rigid-Body Euler Rotation Linear Anti-Control Pumping " +
  "a=+5 b=−10 c=−0.38 Constant Divergence ∇·F=a+b+c=−5.38 " +
  "Five Fixed Points O P₁–P₄=(±√11.4,±√5.7,±5√2) Z₂×Z₂-Symmetry " +
  "λ₁≈+2.1 D_KY≈2.28 Liouville ∑λᵢ=−5.38=∇·F " +
  "RK4 DT=0.001 BURN_IN=5000 N=120000 THIN=40→3000wp " +
  "Basis(a=5)/SK_LowA(a=3 tighter)/SK_HighC(c=−0.10 z-stretch)/SK_WeakB(b=−7 y-widen) " +
  "Shape Keys Cobalt–Amber ChenLee_Speed FLOAT_COLOR " +
  "Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "H.K. Chen and C.I. Lee derived this strange attractor in 2004 by adding " +
  "linear anti-control terms — one axis pumped, two axes damped — to Euler's " +
  "equations for a freely tumbling rigid body.  The nonlinear coupling terms " +
  "y·z, x·z, x·y/3 are the exact Euler torques; the linear terms a·x, b·y, c·z " +
  "are the engineered feedback.  Five fixed points sit at the origin and at four " +
  "Z₂×Z₂-symmetric off-origin locations (±√11.4, ±√5.7, ±5√2), and the " +
  "attractor threads between them in a pair of interleaved figure-eights.  " +
  "This blueprint integrates 3 000 waypoints per shape key with 4th-order " +
  "Runge-Kutta, builds a Bishop parallel-transport tube, colours vertices by " +
  "instantaneous orbit speed, and exports a WebXR-ready GLB.";

function Body() {
  return (
    <>
      <p>
        Every autonomous strange attractor in the chaos section of this library
        has a physical story.{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-rikitake-two-disk-dynamo-1958-geomagnetic-reversal-chaotic-flip-constant-divergence-rk4-bishop-tube-poi-webxr"
        >
          The Rikitake dynamo
        </Link>{" "}
        models geomagnetic reversals; the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-lorenz-stenflo-attractor-1996-atmospheric-acoustic-gravity-wave-4d-lorenz-extension-rk4-bishop-tube-poi-webxr"
        >
          Lorenz-Stenflo system
        </Link>{" "}
        models acoustic-gravity wave coupling in the atmosphere.  The Chen-Lee
        attractor is different: rather than <em>discovering</em> chaos in a
        physical system, Chen and Lee deliberately <em>engineered</em> it into
        an integrable one — Euler&rsquo;s rigid-body equations — using a
        technique known as anti-control.
      </p>

      <h2>The parent system: Euler&rsquo;s rigid body</h2>
      <p>
        Euler&rsquo;s equations describe the angular velocity (x, y, z) of a
        torque-free symmetric top rotating about its principal axes with moments
        of inertia I₁, I₂, I₃:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`I₁ẋ = (I₂ − I₃) y·z
I₂ẏ = (I₃ − I₁) z·x
I₃ż = (I₁ − I₂) x·y`}
      </pre>
      <p>
        This is a Hamiltonian system with two conserved quantities: kinetic
        energy and angular momentum magnitude.  Orbits lie on the intersection
        of two ellipsoids — always quasi-periodic, never chaotic.
      </p>

      <h2>Anti-control: pumping chaos in</h2>
      <p>
        The idea of <em>anti-controlling</em> a system — adding feedback to
        create rather than suppress chaos — was formalised around 2000.  Chen
        and Lee applied it to the Euler system by rescaling so the moments of
        inertia disappear and adding linear feedback terms with independent gain
        parameters a, b, c:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = a·x − y·z     ← Euler torque + x-axis pump (a > 0)
ẏ = b·y + x·z     ← Euler torque + y-axis damp (b < 0)
ż = c·z + x·y/3   ← Euler torque + z-axis weak damp (c small, < 0)

Canonical  a = +5   b = −10   c = −0.38`}
      </pre>
      <p>
        The x-axis is pumped (a &gt; 0) while y is strongly damped (b &lt; 0)
        and z is weakly damped (c slightly &lt; 0).  This asymmetry drives the
        system away from its integrable manifold into sustained chaotic motion.
      </p>

      <h2>Divergence and dissipation</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∂ẋ/∂x = a     ∂ẏ/∂y = b     ∂ż/∂z = c
∇·F = a + b + c = 5 + (−10) + (−0.38) = −5.38`}
      </pre>
      <p>
        Constant divergence means the phase-space volume contracts at a uniform
        exponential rate −5.38 per unit time — regardless of where the orbit
        is.  The Liouville identity then pins the Lyapunov spectrum exactly:
        λ₁ + λ₂ + λ₃ ≈ +2.1 + 0 − 7.48 = −5.38 = ∇·F.
      </p>

      <h2>Five fixed points and their symmetry</h2>
      <p>
        Setting all derivatives to zero, multiplying the first two equations
        together, and using the third to eliminate one variable yields:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`z*² = −ab = 50        → z* = ±5√2   ≈ ±7.071
y*² = −3ac = 5.7      → y* = ±√5.7  ≈ ±2.387
x*  = 10y*/z*         → x* = ±√11.4 ≈ ±3.375

O  = (0, 0, 0)                    saddle  [eigenvalues +5, −10, −0.38]
P₁ = (+√11.4, +√5.7, +5√2)
P₂ = (−√11.4, −√5.7, +5√2)       σ₁-image of P₁
P₃ = (−√11.4, +√5.7, −5√2)
P₄ = (+√11.4, −√5.7, −5√2)       σ₁-image of P₃`}
      </pre>
      <p>
        The four off-origin points form a single orbit under the symmetry group
        Z₂×Z₂: σ₁: (x,y,z)→(−x,−y,z) swaps P₁↔P₂ and P₃↔P₄; σ₂:
        (x,y,z)→(x,−y,−z) swaps P₁↔P₄ and P₂↔P₃.  In WebXR the four
        equilibria appear as four faintly visible convergence points at the
        centres of the lobes — watch the orbit slow to cobalt near each.
      </p>

      <h2>Lyapunov spectrum</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`λ₁ ≈ +2.1   primary chaos
λ₂ ≈  0     orbit-tangent direction
λ₃ ≈ −7.48
Σλᵢ ≈ −5.38 = ∇·F  (Liouville ✓)
D_KY = 2 + λ₁/|λ₃| ≈ 2 + 2.1/7.48 ≈ 2.28
Lyapunov time τ ≈ 1/λ₁ ≈ 0.48 s`}
      </pre>
      <p>
        The large positive exponent λ₁ ≈ 2.1 makes this one of the more
        strongly chaotic systems in the library — compare the Sprott A
        conservative system at λ₁ ≈ 0.014, or the Vallis ENSO attractor at
        λ₁ ≈ 0.120.  Nearby trajectories diverge with an e-folding time of
        roughly half a unit, which is why the attractor appears so vigorously
        tangled.
      </p>

      <h2>Integration choices</h2>
      <p>
        The nonlinear terms grow as |x||y|, |x||z|, |y||z|, so step size
        matters more than for linearly-coupled systems like Lorenz.  DT = 0.001
        keeps the local truncation error of RK4 comfortably below 10⁻⁸ across
        the attractor.  A burn-in of 5 000 steps at this step size ensures the
        orbit has reached the attractor before any waypoints are recorded.
      </p>

      <h2>Shape-key parameter study</h2>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-white/20">
            <th className="text-left py-1 pr-4">Key</th>
            <th className="text-left py-1 pr-4">Parameters</th>
            <th className="text-left py-1">Effect</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-white/10">
            <td className="py-1 pr-4 font-mono">Basis</td>
            <td className="py-1 pr-4 font-mono">a=5 b=−10 c=−0.38</td>
            <td className="py-1">Canonical Chen-Lee chaos, D_KY≈2.28</td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-1 pr-4 font-mono">SK_LowA</td>
            <td className="py-1 pr-4 font-mono">a=3 b=−10 c=−0.38</td>
            <td className="py-1">Weaker x-pump; orbit tightens toward period boundary</td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-1 pr-4 font-mono">SK_HighC</td>
            <td className="py-1 pr-4 font-mono">a=5 b=−10 c=−0.10</td>
            <td className="py-1">Weaker z-damp; orbit elongates along z-axis</td>
          </tr>
          <tr>
            <td className="py-1 pr-4 font-mono">SK_WeakB</td>
            <td className="py-1 pr-4 font-mono">a=5 b=−7 c=−0.38</td>
            <td className="py-1">Weaker y-damp; lobes widen in x-y plane</td>
          </tr>
        </tbody>
      </table>

      <h2>Colour attribute: orbit speed</h2>
      <p>
        The Bishop tube carries a <code>ChenLee_Speed</code> FLOAT_COLOR
        attribute that encodes the instantaneous orbit speed |ẋ,ẏ,ż|.  Cobalt
        marks slow regions — the orbit dwelling near the four off-origin fixed
        points — and amber marks the fast free-flight arcs between lobes.  This
        is directly analogous to how{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr"
        >
          the 1999 Chen attractor
        </Link>{" "}
        uses speed colouring to reveal its butterfly structure.
      </p>

      <h2>Outside references</h2>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li>
          Chen HK &amp; Lee CI (2004).{" "}
          <em>Anti-control of chaos in rigid body motion.</em>{" "}
          Chaos, Solitons &amp; Fractals 21(4):957-965.{" "}
          <a
            className={lk}
            href="https://doi.org/10.1016/j.chaos.2003.12.034"
            target="_blank"
            rel="noopener noreferrer"
          >
            doi:10.1016/j.chaos.2003.12.034
          </a>{" "}
          — original publication. Equations are mathematical objects in the
          public domain. Related: Euler L 1758 (parent rigid-body system);
          Ott, Grebogi &amp; Yorke 1990 Phys Rev Lett 64:1196 (OGY control,
          inspiration for anti-control).
        </li>
        <li>
          NumPy developers (2020).{" "}
          <em>Array programming with NumPy.</em>{" "}
          Nature 585:357-362.{" "}
          <a
            className={lk}
            href="https://numpy.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org
          </a>{" "}
          — BSD-3-Clause.{" "}
          <a
            className={lk}
            href="https://github.com/numpy/numpy"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
        </li>
        <li>
          Bishop RL (1975).{" "}
          <em>There is more than one way to frame a curve.</em>{" "}
          Amer Math Monthly 82(3):246-251.{" "}
          <a
            className={lk}
            href="https://www.jstor.org/stable/2319846"
            target="_blank"
            rel="noopener noreferrer"
          >
            jstor.org/stable/2319846
          </a>{" "}
          — public domain. Related: Hanson AJ &amp; Ma H 1995 IEEE TVCG 1(2):89
          (parallel transport in computer graphics).
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr"
          >
            Chen Attractor (Guanrong Chen &amp; Ueta 1999)
          </Link>{" "}
          — the other major attractor bearing the Chen name; a Lorenz-family
          system rather than a rigid-body system.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-lu-attractor-2002-jinhu-lu-chen-transition-lorenz-chen-family-rk4-bishop-tube-poi-webxr"
          >
            Lü Attractor (2002)
          </Link>{" "}
          — the transition system between Lorenz and Chen in the unified family.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-rikitake-two-disk-dynamo-1958-geomagnetic-reversal-chaotic-flip-constant-divergence-rk4-bishop-tube-poi-webxr"
          >
            Rikitake Two-Disk Dynamo (1958)
          </Link>{" "}
          — another physically-derived attractor with constant divergence.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-quaternion-villarceau-circles-stereographic-poi-webxr"
          >
            Hopf Fibration
          </Link>{" "}
          — rigid-body rotation appears naturally in the Hopf fibration via
          quaternion algebra; compare the orbit geometry.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-lorenz-stenflo-attractor-1996-atmospheric-acoustic-gravity-wave-4d-lorenz-extension-rk4-bishop-tube-poi-webxr"
          >
            Lorenz-Stenflo Attractor (1996)
          </Link>{" "}
          — constant-divergence 4D extension; same Bishop-tube technique.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-06",
  topic: "scripting",
  tags: [
    "blender-5-1",
    "python",
    "numpy",
    "chaos",
    "attractor",
    "rigid-body",
    "euler-equations",
    "anti-control",
    "rk4",
    "bishop-tube",
    "poi",
    "webxr",
    "float-color",
    "shape-keys",
    "glb",
  ],
  body: Body,
  libraryPath:
    "public/library/blends/scripting/python-numpy-chen-lee-attractor-2004-rigid-body-euler-rotation-linear-pumping-constant-divergence-rk4-bishop-tube-poi-webxr/",
});

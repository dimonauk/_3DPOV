import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-shaw-attractor-robert-shaw-1981-two-scroll-dual-saddle-focus-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Shaw Attractor: Robert Shaw 1981 ẋ=−a(x+y) ẏ=−y−axz ż=axy+b " +
  "5-Term Two-Scroll Z₂-Symmetric Chaos, Constant Divergence ∇·F=−(a+1)=−11, " +
  "Dual Saddle-Focus Equilibria P±=(±√(b/a),∓√(b/a),1/a), λ₁≈+0.368 D_KY≈2.032, " +
  "Basis(a=10,b=4.272)/SK_LoA(a=7)/SK_HiA(a=12)/SK_HiB(b=7.5) Shape Keys & " +
  "Cobalt–Amber Shaw_Speed FLOAT_COLOR Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Robert Shaw's 1981 paper in Zeitschrift für Naturforschung A is one of the " +
  "founding documents of chaos theory: it gave chaotic systems an " +
  "information-theoretic interpretation, with the positive Lyapunov exponent " +
  "measuring the rate at which the system destroys the precision of any initial " +
  "measurement.  The Shaw attractor has only 5 terms — one fewer than Lorenz — " +
  "and two symmetric saddle-focus equilibria that drive a crisp Z₂-symmetric " +
  "two-scroll topology.  This blueprint integrates 150 000 RK4 steps at dt=0.002, " +
  "frames a Bishop parallel-transport tube through 3 000 waypoints, and morphs " +
  "four shape keys across the (a, b) parameter family.";

function Body() {
  return (
    <>
      <p>
        When Edward Lorenz published his butterfly attractor in 1963, he was
        studying atmospheric convection and the equations arose from physics.
        Robert Shaw's 1981 paper took a different approach: he asked what
        properties a minimal chaotic system must have from an information-
        theoretic standpoint, and worked backwards to an explicit ODE.  The
        result is a 5-term system with an unusually strong positive Lyapunov
        exponent and a clean analytical structure that makes the two-scroll
        mechanism transparent.
      </p>

      <h2>Equations and structure</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = −a(x + y)         5 terms total (one fewer than Lorenz)
ẏ = −y − a · x · z    quadratic coupling via x·z
ż =  a · x · y + b    quadratic coupling via x·y, plus constant forcing

Canonical: a = 10, b = 4.272`}
      </pre>
      <p>
        The system has exactly two quadratic terms — the same count as Lorenz —
        but places them differently: both appear in ẏ and ż, leaving ẋ as a
        purely linear combination of x and y.  The coefficient a appears in
        every term, making it the single coupling scale.
      </p>

      <h2>Constant divergence</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∂ẋ/∂x = −a    ∂ẏ/∂y = −1    ∂ż/∂z = 0
∇·F = −(a + 1) = −11   (constant, position-independent)

Liouville: λ₁ + λ₂ + λ₃ ≈ +0.368 + 0 − 11.368 = −11.000 = ∇·F  ✓`}
      </pre>
      <p>
        All dissipation in the Shaw system comes from two sources: the −a·x
        term in ẋ (contributing −a to the divergence) and the −y term in ẏ
        (contributing −1).  The ż equation has no direct self-coupling, so its
        contribution to ∇·F is zero.  Raising a increases the contraction rate
        uniformly across phase space — a clean way to vary dissipation without
        changing the topology.
      </p>

      <h2>Dual symmetric equilibria</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = 0  →  y = −x
ẏ = 0  →  z = 1/a           (non-trivial solution)
ż = 0  →  x = ±√(b/a)

P± = ( ±√(b/a),  ∓√(b/a),  1/a )
   ≈ ( ±0.6538,  ∓0.6538,   0.1 )   [canonical a=10, b=4.272]`}
      </pre>
      <p>
        The Z₂ symmetry (x, y, z) → (−x, −y, z) maps P+ to P− exactly,
        making both equilibria equivalent by symmetry.  Each is a saddle-focus
        with one real contracting eigenvalue and a complex-conjugate pair with
        positive real part.  The trajectory spirals out from one equilibrium
        until the unstable manifold carries it across to the other — the
        defining mechanism of a two-scroll attractor.
      </p>

      <h2>Lyapunov spectrum and information flow</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`λ₁ ≈ +0.368   (positive — chaos)
λ₂ ≈  0.000   (neutral — along-orbit direction)
λ₃ ≈ −11.368  (contraction; |λ₃| ≈ 31× λ₁)

D_KY = 2 + λ₁/|λ₃| ≈ 2.032   (very thin fractal, almost a 2-D surface)
τ    = 1/λ₁ ≈ 2.72 time units  (Lyapunov prediction horizon)`}
      </pre>
      <p>
        Shaw's key insight was that h_KS = λ₁ ≈ 0.368 nats per time unit
        measures the rate at which the system generates new information
        that cannot be recovered from any finite-precision initial state.
        A trajectory starting 10⁻⁶ away from another becomes indistinguishable
        within τ·ln(10⁶) ≈ 45 time units — about 0.09 seconds of physical
        evolution at the canonical parameters.
      </p>

      <h2>Bishop frame implementation</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# parallel-transport step (Rodrigues formula)
axis  = cross(T[i-1], T[i])
sin_a = norm(axis)
cos_a = dot(T[i-1], T[i])
if sin_a > 1e-10:
    axis /= sin_a
    N[i] = (cos_a * N[i-1]
            + sin_a * cross(axis, N[i-1])
            + (1 - cos_a) * dot(axis, N[i-1]) * axis)
    N[i] /= norm(N[i])`}
      </pre>
      <p>
        The Shaw orbit spirals tightly near both equilibria with slowly-varying
        curvature — a regime where Frenet normals are well-defined but can
        rotate rapidly.  Bishop parallel transport minimises integrated twist,
        giving a visually clean tube with no spurious twist bands.
      </p>

      <h2>Shape-key parameter family</h2>
      <p>
        Each shape key reintegrates the Shaw ODE at a different (a, b) and
        recomputes the Bishop tube, allowing real-time morphing in Blender and
        in the WebXR viewer:
      </p>
      <ul className="list-disc pl-6">
        <li>
          <strong>Basis</strong> (a=10, b=4.272): canonical two-scroll, P±≈(±0.654, ∓0.654, 0.1)
        </li>
        <li>
          <strong>SK_LoA</strong> (a=7): lower coupling, ∇·F=−8, broader orbit,
          P±≈(±0.781, ∓0.781, 0.143)
        </li>
        <li>
          <strong>SK_HiA</strong> (a=12): higher coupling, ∇·F=−13, tighter orbit,
          P±≈(±0.596, ∓0.596, 0.083)
        </li>
        <li>
          <strong>SK_HiB</strong> (a=10, b=7.5): larger forcing, P±≈(±0.866, ∓0.866, 0.1)
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-6">
        <li>
          <strong>Tube self-intersects</strong>: increase TUBE_SEGS from 8 to 12,
          or reduce TUBE_RADIUS from 0.045 to 0.030.
        </li>
        <li>
          <strong>Shape key misalignment</strong>: ensure each integration uses the
          same THIN=50 so waypoint counts match the Basis mesh.
        </li>
        <li>
          <strong>Integration diverges at SK_LoA (a=7)</strong>: lower a reduces
          dissipation; if the orbit escapes, increase N_WARMUP to 8 000 to
          better settle onto the attractor before recording.
        </li>
        <li>
          <strong>No chaos at SK_HiA (a=12)</strong>: very high a can push the
          system towards a stable limit cycle; if so, reduce to a=11.5 or verify
          with a Poincaré section that the orbit is genuinely aperiodic.
        </li>
      </ul>

      <h2>Related tutorials</h2>
      <ul className="list-disc pl-6">
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr" className={lk}>
            Lorenz attractor
          </Link>{" "}
          — 7-term Z₂-symmetric two-scroll; compare term count and topology
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr" className={lk}>
            Rössler attractor (1976)
          </Link>{" "}
          — 7 terms, one scroll only, Shilnikov homoclinic orbit
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-sprott-b-attractor-linz-two-quadratic-minimal-chaos-rk4-bishop-tube-poi-webxr" className={lk}>
            Sprott B attractor
          </Link>{" "}
          — 6 terms, one equilibrium, constant ∇·F=−1 (compare with Shaw's −11)
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr" className={lk}>
            Chen attractor (1999)
          </Link>{" "}
          — 7 terms, Lorenz-dual, λ₁≈+2.03 (even faster chaos than Shaw)
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-rikitake-two-disc-dynamo-geomagnetic-reversal-bullard-chaos-bishop-tube-poi-webxr" className={lk}>
            Rikitake dynamo
          </Link>{" "}
          — another two-scroll attractor, from geomagnetic reversal modelling
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-6">
        <li>
          Shaw R (1981) "Strange attractors, chaotic behavior, and information
          flow."{" "}
          <em>Z Naturforsch A</em> <strong>36</strong>(1):80–112.{" "}
          <a href="https://doi.org/10.1515/zna-1981-0115" className={lk} target="_blank" rel="noopener noreferrer">
            DOI 10.1515/zna-1981-0115
          </a>
          {" "}(PD — mathematical equations and results)
        </li>
        <li>
          Sprott JC (2010) <em>Elegant Chaos: Algebraically Simple Chaotic Flows</em>,
          World Scientific.{" "}
          <a href="https://sprott.physics.wisc.edu/chaos/elegantchaos.htm" className={lk} target="_blank" rel="noopener noreferrer">
            MIT companion C code
          </a>
          {" "}— Shaw system catalogued as "SH" in the taxonomy table
        </li>
        <li>
          NumPy Developers,{" "}
          <a href="https://numpy.org" className={lk} target="_blank" rel="noopener noreferrer">
            NumPy
          </a>{" "}
          (BSD-3-Clause) —{" "}
          <a href="https://github.com/numpy/numpy" className={lk} target="_blank" rel="noopener noreferrer">
            github.com/numpy/numpy
          </a>
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = {
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-02",
  tags: [
    "blender",
    "python",
    "numpy",
    "chaos",
    "attractor",
    "shaw",
    "dynamical-systems",
    "rk4",
    "bishop-tube",
    "poi",
    "webxr",
    "scripting",
    "information-theory",
  ],
  body: <Body />,
  instructable: buildInstructable(SLUG, TITLE),
};

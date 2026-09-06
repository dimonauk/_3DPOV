import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-liu-attractor-2004-lorenz-variant-x-squared-z-driving-z2-symmetry-constant-divergence-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Liu Attractor (Liu et al 2004): ẋ=a(y−x) ẏ=bx−kxz ż=−cz+hx² " +
  "Lorenz-Variant x²-Z-Drive Z₂-Symmetric Butterfly, Constant Divergence ∇·F=−(a+c)=−12.5, " +
  "Wings P±=(±5,±5,40) Saddle-Node λ≈+9.05 Stable-Spiral −10.78±10.24i, " +
  "λ₁≈+1.847 D_KY≈2.129 RK4 DT=0.005 BURN_IN=3000 N=90000 THIN=30→3000wp " +
  "Basis(b=40,c=2.5)/SK_LoB(b=28)/SK_HiB(b=52)/SK_SoftZ(c=1.5) " +
  "Shape Keys Cobalt–Amber Liu_Speed FLOAT_COLOR Bishop Parallel-Transport Tube " +
  "Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Liu attractor (2004) is the clearest demonstration that replacing Lorenz's " +
  "xy product in the z-equation with hx² completely changes the chaos mechanism " +
  "while preserving the Z₂-symmetric butterfly shape. Because x² is always " +
  "non-negative, z is always driven upward and the attractor lives entirely in " +
  "z > 0 — a constraint Lorenz does not share. This blueprint integrates 90 000 " +
  "RK4 steps at dt=0.005, threads a Bishop parallel-transport frame through " +
  "3 000 waypoints, and morphs four shape keys across the (b, c) parameter family, " +
  "from compact to expanded wings.";

function Body() {
  return (
    <>
      <p>
        When Lorenz wrote down his butterfly equations in 1963, the coupling term
        in the z-equation was <code>xy</code>: the product of the field amplitude
        and its rate of change. C. Liu and colleagues asked in 2004 what happens
        if you replace that product with <code>hx²</code> — the square of the
        amplitude alone, which is always non-negative. The answer is a new strange
        attractor with constant-sign z-driving, a different fixed-point stability
        type at each wing, and a Lyapunov exponent nearly four times larger than
        Lorenz's.
      </p>

      <h2>Equations and the key substitution</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Lorenz (1963):   ẋ=σ(y−x)   ẏ=rx−y−xz   ż=xy−bz
Liu   (2004):    ẋ=a(y−x)   ẏ=bx−kxz    ż=−cz+hx²

Canonical (Liu): a=10  b=40  k=1  c=2.5  h=4

Structural difference
─────────────────────
Lorenz: ż=xy−bz  →  xy changes sign when x and y have opposite signs
Liu:    ż=hx²−cz →  hx² ≥ 0 always; z is never driven downward by the orbit

Consequence: the Liu attractor lives entirely in z > 0.  The Lorenz
butterfly straddles z=0 symmetrically; Liu's does not.`}
      </pre>

      <h2>Constant divergence and Liouville check</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∂ẋ/∂x = −a = −10     (linear self-coupling)
∂ẏ/∂y =  0            (no y-dependence in ẏ)
∂ż/∂z = −c = −2.5

∇·F = −a − c = −12.5   (position-independent)

Liouville identity (from Liu 2004):
  λ₁ + λ₂ + λ₃  =  +1.847 + 0.000 − 14.347  =  −12.500  =  ∇·F  ✓
  D_KY = 2 + λ₁/|λ₃| = 2 + 1.847/14.347 ≈ 2.129`}
      </pre>
      <p>
        The absence of y in the ẏ equation is the unusual term: <code>bx−kxz</code>{" "}
        depends on x and z but not on y, so <code>∂ẏ/∂y = 0</code> and the entire
        volume contraction falls on the two linear self-damping terms −a and −c.
        This is structurally simpler than Lorenz (which has contributions from all
        three equations to its divergence −(σ+1+b)).
      </p>

      <h2>Equilibria: origin and the two wings</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Setting ẋ=ẏ=ż=0:

  ẋ=0 → y=x   (everything on the y=x plane)
  ẏ=0 → x(b−kz)=0 → x=0  or  z=b/k=40
  ż=0 → hx²=cz

Origin O=(0,0,0):
  J|_O = [[−a,a,0],[b,0,0],[0,0,−c]] — block-diagonal
  λ_O1 = (−a + √(a²+4ab))/2 = (−10 + √1700)/2 ≈ +15.62  (unstable)
  λ_O2 = (−a − √(a²+4ab))/2 ≈ −25.62                     (stable)
  λ_O3 = −c = −2.5                                         (stable)

Wings P± = (±5, ±5, 40):
  [z=b/k=40 from ẏ=0;  x²=cz/h=2.5·40/4=25 → x=±5 from ż=0]

  J|_{P+} = [[−10,10,0],[0,0,−5],[40,0,−2.5]]
  Char-poly: λ³ + 12.5λ² + 25λ − 2000 = 0
  λ_real    ≈ +9.05       UNSTABLE (trajectories blown off wing)
  λ_complex ≈ −10.78±10.24i  STABLE (trajectories spiral toward wing)

→ P± are SADDLE-NODES (1 unstable real + 2 stable complex).
  This is NOT the Shilnikov saddle-focus of Rössler/Lorenz wings,
  which have 2 unstable complex + 1 stable real.  The chaos mechanism
  here is heteroclinic re-injection between the wings' unstable manifolds.`}
      </pre>
      <p>
        The sign reversal between Liu's wings and those in Rössler or Lorenz is
        significant: in those systems the wing equilibrium drives trajectories{" "}
        <em>outward</em> in a spiral (the unstable pair), then they are
        re-captured by the stable real direction. In Liu, the wing <em>attracts</em>{" "}
        trajectories spirally inward (the stable complex pair), then suddenly
        ejects them along the single unstable real eigenvector back toward the
        origin. The orbit looks similar — a butterfly — but the local geometry
        is inverted.
      </p>

      <h2>Z₂ symmetry</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Map S: (x, y, z) → (−x, −y, z)

  Sẋ = a(−y − (−x)) = a(x − y) = −a(y − x) = −ẋ   → sign flips with x  ✓
  Sẏ = b(−x) − k(−x)z = −bx + kxz = −(bx − kxz)   = −ẏ              ✓
  Sż = −cz + h(−x)² = −cz + hx²                     = ż   (unchanged) ✓

The system is equivariant under S.  The two wings P+ and P−
are exact mirror images; any orbit on one wing has a mirror image on the other.`}
      </pre>

      <h2>Blueprint: RK4 + Bishop tube in bpy</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# Liu vector field
def _f(s, a, b, k, c, h):
    x, y, z = s
    return np.array([a*(y - x), b*x - k*x*z, -c*z + h*x*x])

# RK4 step
def _rk4(s, dt, a, b, k, c, h):
    k1 = _f(s,         a, b, k, c, h)
    k2 = _f(s+dt/2*k1, a, b, k, c, h)
    k3 = _f(s+dt/2*k2, a, b, k, c, h)
    k4 = _f(s+dt*k3,   a, b, k, c, h)
    return s + dt*(k1 + 2*k2 + 2*k3 + k4)/6

# Integration: burn-in 3000 × DT=0.005, then collect 3000 waypoints
def integrate(a=10, b=40, k=1, c=2.5, h=4):
    s = np.array([1.0, 1.0, 1.0])
    for _ in range(3000): s = _rk4(s, 0.005, a, b, k, c, h)
    pts, spd = [], []
    for i in range(90_000):
        s = _rk4(s, 0.005, a, b, k, c, h)
        if i % 30 == 0:
            pts.append(s.copy())
            spd.append(np.linalg.norm(_f(s, a, b, k, c, h)))
    return np.array(pts), np.array(spd)`}
      </pre>
      <p>
        DT=0.005 is conservative for this system: the largest eigenvalue at the
        origin is ≈+15.6, and RK4 stability for linear problems requires
        DT·|λ| ≤ 2.8, giving DT ≤ 0.18. At DT=0.005 we are well inside the
        stable zone. The speed colour attribute records the instantaneous velocity
        magnitude <code>|ẋ, ẏ, ż|</code>, not displacement per step — this
        captures the rapid passages near the origin (fast) and the slow
        winding near each wing (slow).
      </p>

      <h2>Bishop frames: why not Frenet</h2>
      <p>
        Frenet frames (<em>T, N, B</em> defined by curvature and torsion) are
        undefined at inflection points where curvature vanishes — and the Liu
        orbit, like most strange attractors, passes through near-zero-curvature
        segments. Bishop&apos;s 1975 parallel-transport construction avoids this:
        the normal frame is propagated from step to step by requiring zero
        twist about the tangent, producing a smooth, twist-free tube with no
        sudden rotations.
      </p>

      <h2>Shape keys: exploring the parameter family</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis   a=10, b=40, c=2.5  canonical Liu 2004
SK_LoB  b=28           wings at P±=(±4.18,±4.18,28)  — compact
SK_HiB  b=52           wings at P±=(±5.70,±5.70,52)  — expanded
SK_SoftZ c=1.5         wings at P±=(±3.87,±3.87,40)  — same z, narrower x

Wing x-coordinate formula: x± = ±√(c·b/(h·k)) = ±√(c·z_fixed/h)
Wing z-coordinate formula: z_fixed = b/k  (independent of c)`}
      </pre>
      <p>
        Note the asymmetry: changing <em>b</em> shifts the wing altitude and
        the x-extent together; changing <em>c</em> shifts only the x-extent
        (the wing z stays fixed at b/k). This is because z_fixed comes from
        ẏ=0, which involves b and k but not c, while x comes from ż=0 where
        c appears.
      </p>

      <h2>Troubleshooting</h2>
      <p>
        <strong>Orbit diverges</strong> — reduce DT to 0.002; the basin of
        attraction is large but not all of ℝ³. <strong>Shape keys look
        identical</strong> — confirm the slider is at 1.0; SK_LoB vs SK_HiB
        differs in z-extent, easiest seen from the side. <strong>Colour
        attribute not showing</strong> — in the Attribute node set type to
        <em>Geometry</em>, not Object.
      </p>

      <h2>Further reading</h2>
      <ul>
        <li>
          Liu C, Liu T, Liu L, Liu K (2004). "A new chaotic attractor."{" "}
          <em>Chaos Solitons Fractals</em> 22(5):1031–1038.
          DOI{" "}
          <a
            href="https://doi.org/10.1016/j.chaos.2004.02.060"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            10.1016/j.chaos.2004.02.060
          </a>
          {" "}— original paper (equations in the public domain).
        </li>
        <li>
          Sprott JC (2010). <em>Elegant Chaos: Algebraically Simple Chaotic Flows</em>.
          World Scientific. Companion C code (MIT):{" "}
          <a
            href="https://sprott.physics.wisc.edu/chaos/elegantchaos.htm"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            sprott.physics.wisc.edu/chaos/elegantchaos.htm
          </a>
        </li>
        <li>
          Harris CR et al (2020). "Array programming with NumPy."{" "}
          <em>Nature</em> 585:357–362.{" "}
          <a
            href="https://numpy.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org
          </a>{" "}
          (BSD-3-Clause).
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
            className={lk}
          >
            Lorenz attractor
          </Link>{" "}
          — the original butterfly; compare xy vs hx² z-driving.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-lu-attractor-2002-jinhu-lu-chen-transition-lorenz-chen-family-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Lü attractor (2002)
          </Link>{" "}
          — the same unified Lorenz–Chen family, different parameter regime.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Chen attractor (1999)
          </Link>{" "}
          — Guanrong Chen&apos;s dual-butterfly, yet another Lorenz variant.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-shimizu-morioka-attractor-1980-laser-mode-z2-saddle-focus-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Shimizu–Morioka attractor (1980)
          </Link>{" "}
          — five-term Z₂-symmetric butterfly with conventional Shilnikov
          saddle-focus wings (contrast the inverted topology of Liu).
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
  topics: ["blender", "scripting", "chaos", "attractors", "webxr", "python", "numpy"],
  body: Body,
});

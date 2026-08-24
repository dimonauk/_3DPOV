import Link from "next/link";
import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-scipy-cornu-spiral-fresnel-clothoid-linear-curvature-bishop-tube-poi-webxr";

function Body() {
  return (
    <>
      <p>
        The Cornu spiral traces a path whose curvature grows in direct
        proportion to its own arc length: κ(t) = πt. That single constraint —
        bending rate proportional to distance travelled — produces an S-shaped
        curve that spirals tighter and tighter toward two limiting points, then
        flares back out symmetrically. It surfaces in Fresnel&apos;s wave
        optics, Euler&apos;s elastica theory, and the clothoid transition
        curves that let a railway carriage enter a bend without a jolt. This
        blueprint integrates the Fresnel integrals via{" "}
        <code>scipy.special.fresnel</code>, wraps the result in a Bishop
        parallel-transport tube, and exports a curvature-coloured WebXR poi
        head with a shape key that lifts the flat S-spiral into a 3-D helical
        clothoid.
      </p>

      <h2>Three discoverers, one curve</h2>
      <p>
        The integral definitions go back further than the spiral diagram. In
        1768 Leonhard Euler evaluated{" "}
        <code>∫₀^∞ cos(t²) dt = ∫₀^∞ sin(t²) dt = ½√(π/2)</code> in his{" "}
        <em>Institutionum Calculi Integralis</em>. He did not draw the curve
        defined by plotting one Fresnel integral against the other. In 1818
        Augustin-Jean Fresnel derived the integrals C(t) and S(t) to compute
        the intensity distribution at the geometric shadow edge of a straight
        diffracting obstacle. Marie Alfred Cornu&apos;s 1874 contribution was
        graphical: he plotted C vs S on a single diagram — the Cornu spiral —
        as a slide-rule substitute for computing diffraction patterns. Read the
        phasor amplitude from one spiral, read the intensity from the squared
        chord length between any two points on it.
      </p>
      <p>
        In railway engineering the same curve appears under the name clothoid or
        Euler spiral. William John Macquorn Rankine described its use as a
        transition curve in 1862; Arthur Talbot refined the practical design
        tables in the 1890s. The requirement is simple: a train moving at
        constant speed must experience lateral acceleration that grows linearly
        from zero at the tangent point (straight track) to the full centripetal
        value at the start of the circular arc. Since lateral acceleration ∝ κ
        and distance ∝ t, the clothoid κ = ct is the unique solution.
      </p>

      <h2>Fresnel integrals</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`C(t) = ∫₀ᵗ cos(πu²/2) du   Fresnel cosine integral
S(t) = ∫₀ᵗ sin(πu²/2) du   Fresnel sine integral

Position on the Cornu spiral:  (x, y) = (C(t), S(t))
Arc length:   s = t   (natural parameterisation — unit-speed curve)
Tangent angle: θ(t) = πt²/2
Curvature:    κ(t) = dθ/dt = πt      ← linear in arc length

Limiting points:   as t → +∞, (C, S) → (½, ½)
                   as t → −∞, (C, S) → (−½, −½)

scipy.special.fresnel(t) returns (S(t), C(t)) — note reversed order.`}
      </pre>
      <p>
        The convention difference in SciPy (S first, then C) is a common source
        of silent bugs. The blueprint unpacks as{" "}
        <code>S, C = fresnel(t)</code> explicitly; the variable names serve as
        the corrective annotation.
      </p>

      <h2>Why the tangent angle is πt²/2</h2>
      <p>
        The tangent direction at arc-length t is the angle θ(t) that the
        velocity vector makes with the positive x-axis. For a unit-speed curve
        in 2D, the velocity is{" "}
        <code>(ẋ, ẏ) = (cos θ, sin θ)</code>. Differentiating the integral
        definitions gives exactly <code>ẋ = cos(πt²/2)</code> and{" "}
        <code>ẏ = sin(πt²/2)</code>, confirming{" "}
        <code>θ = πt²/2</code>. Curvature is the rate of turning per unit arc:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`κ = dθ/ds = dθ/dt (since ds = dt for unit-speed)
  = d(πt²/2)/dt = πt

At t = 0: κ = 0  (locally straight — railway tangent point)
At t = T_MAX = 3: κ = 3π ≈ 9.42 rad/m  (tightly coiled tip)`}
      </pre>

      <h2>Why Bishop frame for this curve</h2>
      <p>
        The Frenet–Serret normal vector is defined as{" "}
        <code>N = κ⁻¹ · dT/ds</code>. At t = 0 the curvature κ = 0 and the
        Frenet normal is undefined. The Cornu spiral is smooth at the origin —
        the failure is in the Frenet formula, not the curve. Bishop
        parallel-transport avoids this entirely: the frame rotates from each
        tangent to the next via the minimum-rotation (Rodrigues) step, making
        no reference to κ whatsoever. For an open curve (the bilateral spiral
        from −T_MAX to +T_MAX is not closed) no holonomy correction is needed
        — the transported frame simply accumulates from one endpoint to the
        other.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Rodrigues step (Bishop transport):
  axis = T[i−1] × T[i]          (rotation axis between consecutive tangents)
  c    = T[i−1] · T[i]          (cosine of bending angle)
  s    = √(1 − c²)

  N[i] = c·N[i−1] + s·(axis × N[i−1]) + (1−c)(axis·N[i−1])·axis

Open curve → no seam, no holonomy correction needed.`}
      </pre>

      <h2>3-D helical clothoid (SK_Helix)</h2>
      <p>
        Adding a constant-speed z component while keeping the same (C(t), S(t))
        in the horizontal plane yields the helical Cornu spiral:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`x(t) = SCALE × C(t)
y(t) = SCALE × S(t)
z(t) = HELIX_RISE × t    (HELIX_RISE = 0.055 in blueprint.py)

Spatial curvature:   κ₃ᴅ(t) = πt / √(1 + (HELIX_RISE / SCALE)²)
Torsion:             τ₃ᴅ     ≈ HELIX_RISE × κ(t) / (κ² + τ²)^½

This is a form of the "spherical clothoid" used in 3-D autonomous vehicle
path planning and in helical RFID antenna phase ramp design.`}
      </pre>
      <p>
        In SK_Helix the curvature still increases linearly (rescaled by the
        helix pitch factor) and the torsion is non-constant — the curve truly
        spirals through 3D space rather than merely rotating a 2D pattern.
      </p>

      <h2>Mesh topology and end caps</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Ring vertices:    N_LONG × N_CIRC = 360 × 12 = 4 320
Cap centres:      2  (one per endpoint)
Total vertices:   4 322

Ring-to-ring quads:  (N_LONG − 1) × N_CIRC = 359 × 12 = 4 308
Start cap tris:       N_CIRC = 12
End cap tris:         N_CIRC = 12
Total faces:          4 332

Topology: open cylinder (two disk caps) — NOT a torus.
          Cap centres placed at the spine endpoints.`}
      </pre>

      <h2>Curvature colour (Cornu_Kappa)</h2>
      <p>
        The FLOAT_COLOR POINT attribute maps the absolute curvature{" "}
        <code>|κ(t)| = π|t|</code> to a Cobalt → Amber gradient:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Cobalt  (0.055, 0.408, 0.918): t = 0  → κ = 0    (straight, railway tangent)
Amber   (0.918, 0.510, 0.055): |t| = T_MAX → κ = πT_MAX ≈ 9.42  (tight coil tip)

Linear interpolation: col = (1 − |t|/T_MAX) × Cobalt + (|t|/T_MAX) × Amber`}
      </pre>
      <p>
        This makes the stress distribution legible at a glance: Cobalt
        marks the low-curvature midsection (where a beam experiences minimum
        bending stress) and Amber marks the high-curvature tips (where a thin
        beam would yield first). In diffraction terms, Cobalt is the
        low-phase-gradient region and Amber is the high-phase-gradient region
        where Fresnel zones are densest.
      </p>

      <h2>Shape keys</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Basis    T_MAX=3.0, z=0,             TUBE_R=0.018  flat 2-D S-spiral
SK_Helix T_MAX=3.0, z=0.055×t,         TUBE_R=0.018  3-D helical clothoid
SK_Tight T_MAX=1.5, z=0,               TUBE_R=0.014  fewer coils, relaxed centre
SK_Fat   T_MAX=3.0, z=0,               TUBE_R=0.029  same curve, thicker tube`}
      </pre>

      <h2>Cross-references</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-euler-elastica-jacobi-dn-curvature-lemniscate-ribbon-poi-webxr"
          >
            Euler Elastica — Jacobi dn, curvature lemniscate, ribbon poi
          </Link>{" "}
          — the elastica minimises ∫κ² ds (energy minimiser under prescribed
          endpoints), while the Cornu spiral prescribes κ = cs directly; both
          are intrinsic curvature problems from Euler&apos;s 18th-century
          corpus and both encode bending in thin elastic beams
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-viviani-curve-sphere-cylinder-intersection-bishop-tube-figure8-poi-webxr"
          >
            Viviani&apos;s Curve — sphere × cylinder, Bishop tube, figure-8 poi
          </Link>{" "}
          — the same Bishop parallel-transport construction handles the Viviani
          self-intersection (zero curvature at the crossing) for the same
          reason: Rodrigues transport makes no reference to κ at any point
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-dini-surface-pseudosphere-sine-gordon-kink-tractrix-poi-webxr"
          >
            Dini Surface / Pseudosphere — tractrix, sine-Gordon kink
          </Link>{" "}
          — the tractrix is the curve whose tangent segment to the x-axis has
          constant length; like the clothoid it is most naturally described by
          an intrinsic equation κ = sech(s) relating curvature to arc length,
          placing both in the broader family of "intrinsic-equation curves"
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-kuen-dini-pseudosphere-k-minus-1-sine-gordon-poi-webxr"
          >
            Kuen Surface — pseudospherical, K = −1, sine-Gordon
          </Link>{" "}
          — a pseudospherical surface whose geodesics exhibit arc-length
          dependent curvature behaviour analogous to the clothoid, arising via
          the Bäcklund transformation of the constant-curvature tractrix
        </li>
      </ul>

      <h2>External references</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>
          Olver, F. W. J. et al. (eds.) (2010).{" "}
          <em>
            NIST Digital Library of Mathematical Functions — Chapter 7: Error
            Functions, Dawson&apos;s and Fresnel Integrals
          </em>
          . Release 1.2.1, 2024.{" "}
          <a
            className={lk}
            href="https://dlmf.nist.gov/7.2"
            target="_blank"
            rel="noopener noreferrer"
          >
            dlmf.nist.gov/7.2
          </a>
          . Licence: Public Domain (US Government / NIST). The DLMF is the
          definitive authority on Fresnel integral notation, limiting values,
          asymptotic expansions, and the connection to Euler&apos;s 1768
          computation. Related NIST projects: Digital Library of Mathematical
          Functions (DLMF, PD), NIST Handbook of Mathematical Functions
          Cambridge University Press 2010 (ISBN 978-0-521-19225-5), and the
          DLMF GitHub mirror at{" "}
          <a
            className={lk}
            href="https://github.com/DLMF/NIST-Digital-Library-of-Mathematical-Functions"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/DLMF/NIST-Digital-Library-of-Mathematical-Functions
          </a>{" "}
          (Creative Commons).
        </li>
        <li>
          SciPy Contributors (2001–present).{" "}
          <em>SciPy Reference Guide — scipy.special.fresnel</em>. Licence:
          BSD-3-Clause.{" "}
          <a
            className={lk}
            href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.special.fresnel.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.scipy.org/doc/scipy/reference/generated/scipy.special.fresnel.html
          </a>
          . <code>scipy.special.fresnel(x)</code> returns{" "}
          <code>(S(x), C(x))</code> in Fresnel&apos;s 1818 normalisation
          (πu²/2 argument) for scalar or array x; handles negative x via
          odd-symmetry automatically. Related projects: NumPy
          (BSD-3-Clause, numpy.org), the SciPy source code at{" "}
          <a
            className={lk}
            href="https://github.com/scipy/scipy"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/scipy/scipy
          </a>{" "}
          (BSD-3-Clause), and Cephes Mathematical Functions Library
          (BSD-2-Clause, netlib.org/cephes/) which provides the underlying
          rational approximations for the Fresnel integral computation inside
          SciPy.
        </li>
      </ul>
    </>
  );
}

const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python scipy — Cornu Spiral: Euler 1768 Fresnel 1818 Cornu 1874, κ(t)=πt Linear Curvature in Arc Length, C(t)=∫cos(πu²/2)du S(t)=∫sin(πu²/2)du Fresnel Integrals, Clothoid Railway Transition Curve, 3-D Helical Clothoid SK_Helix, Bishop Open Tube, Cornu_Kappa FLOAT_COLOR Cobalt→Amber & S-Spiral Poi Head for WebXR (Blender 5.1)",
  date: "2026-08-23",
  tags: [
    "blender",
    "python",
    "scipy",
    "cornu-spiral",
    "euler-spiral",
    "clothoid",
    "fresnel-integrals",
    "railway-design",
    "bishop-frame",
    "parallel-transport",
    "intrinsic-curvature",
    "open-tube",
    "shape-keys",
    "vertex-color",
    "webxr",
    "glb",
  ],
  series: "scripting",
  body: Body,
  outside_sources: [
    {
      author: "Olver F W J et al (eds)",
      year: 2010,
      title:
        "NIST Digital Library of Mathematical Functions — Chapter 7: Fresnel Integrals",
      url: "https://dlmf.nist.gov/7.2",
      licence: "Public Domain (US Government / NIST)",
      notes:
        "Definitive notation and limiting values for C(t), S(t). §7.2 defines the Fresnel integrals in the πu²/2 normalisation used by SciPy and this blueprint. §7.12 gives asymptotic expansions showing (C, S) → (½, ½) as t→+∞. Related: DLMF GitHub mirror (Creative Commons, github.com/DLMF/NIST-Digital-Library-of-Mathematical-Functions); NIST Handbook of Mathematical Functions Cambridge 2010.",
    },
    {
      author: "SciPy Contributors",
      year: 2001,
      title: "scipy.special.fresnel — SciPy Reference Guide",
      url: "https://docs.scipy.org/doc/scipy/reference/generated/scipy.special.fresnel.html",
      licence: "BSD-3-Clause",
      notes:
        "BSD-3-Clause. scipy.special.fresnel returns (S, C) — S before C — which reverses the alphabetical order and is a common unpacking error. The blueprint uses `S, C = fresnel(t)` with explicit variable names as the guard. Underlying implementation: Cephes Mathematical Functions Library BSD-2-Clause rational Padé approximations (netlib.org/cephes/). Related: NumPy (BSD-3-Clause, numpy.org); SciPy source (BSD-3-Clause, github.com/scipy/scipy).",
    },
  ],
});

export { entry };

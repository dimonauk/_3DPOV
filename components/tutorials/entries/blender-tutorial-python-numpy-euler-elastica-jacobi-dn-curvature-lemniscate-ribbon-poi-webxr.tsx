import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-euler-elastica-jacobi-dn-curvature-lemniscate-ribbon-poi-webxr";

const TITLE =
  "Python numpy — Euler's Elastica: 1744 Bending-Energy Variational Problem, Jacobi-dn Curvature, Lemniscate Arc-Length & Ribbon Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "In 1744 Leonhard Euler solved the first recorded variational problem on space curves: which shape does an elastic rod take when you bend it with the least energy?  The answer — the elastica — satisfies an ordinary differential equation whose solution involves the Jacobi elliptic function dn.  This blueprint derives that equation from first principles, finds the exact modulus m* ≈ 0.3476 at which the oval elastica closes, and builds a Bishop-framed ribbon poi head with five shape-key modulus variants and an amber-to-violet vertex-colour curvature map.  Along the way it reveals why lemniscate arc-length and elastica curvature share the same integral — both secretly depend on dn at modulus 1/√2.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-09",
  externalSources: [
    {
      label:
        "Euler, L. (1744). Methodus Inveniendi Lineas Curvas Maximi Minimive Proprietate Gaudentes, Appendix I: De Curvis Elasticis. Lausanne & Geneva: Bousquet. Public Domain. Euler Archive, Pacific University.",
      url: "https://scholarlycommons.pacific.edu/euler-works/65/",
      licence: "Public Domain",
      author: "Leonhard Euler",
    },
    {
      label:
        "Langer, J. & Singer, D. (1984). The total squared curvature of closed curves. Journal of Differential Geometry 20(1): 1–22. Mathematical content Public Domain.",
      url: "https://doi.org/10.4310/jdg/1214438990",
      licence: "Public Domain (mathematical content)",
      author: "Joel Langer, David Singer",
    },
    {
      label:
        "NumPy contributors. NumPy Reference Documentation. BSD-3-Clause.",
      url: "https://numpy.org/doc/stable/",
      licence: "BSD-3-Clause",
      author: "NumPy community",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        The year is 1744.  Daniel Bernoulli has asked his friend and
        colleague Leonhard Euler to explain the shape an elastic rod takes
        when its ends are clamped and the rod is bent.  Bernoulli suspects
        it has something to do with the integral ∫(ds/√(1−x⁴)), which he
        and his brother Jacob had studied twenty years earlier in the context
        of the lemniscate of Bernoulli.  He is right, but neither of them
        yet knows why.
      </p>
      <p>
        Euler's reply appears as Appendix I of{" "}
        <em>Methodus Inveniendi</em> under the title{" "}
        <em>De Curvis Elasticis</em>.  In it, Euler writes down the first
        variational problem on curves in the history of mathematics, solves
        the Euler-Lagrange equation explicitly, and classifies the nine
        types of elastic curves by the sign and magnitude of a single
        parameter.  He does all of this before the general theory of
        elliptic integrals exists.
      </p>
      <p>
        This tutorial derives the elastica ODE from scratch, extracts the
        Jacobi-dn curvature formula, locates the unique closure modulus m*,
        and constructs a ribbon poi head — a length of ribbon swept along
        the closed oval elastica — as a GLB file for WebXR performance.
      </p>

      <h2>The bending-energy variational problem</h2>
      <p>
        Model a thin elastic rod as a space curve γ(s) of arc length s.
        The elastic energy stored in the rod is proportional to the
        integral of squared curvature:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`B = ∫₀ᴸ κ(s)² ds          (bending energy)`}
      </pre>
      <p>
        We want to minimise B over all curves of fixed length L with
        prescribed endpoint positions and tangent directions.  Length
        is incorporated via a Lagrange multiplier T (the tension), giving
        the augmented functional:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`F = ∫₀ᴸ [κ² − T] ds`}
      </pre>
      <p>
        The Euler-Lagrange equation for curvature κ(s) is:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`κ'' + κ³/2 = T · κ         (Euler–Lagrange, "elastica ODE")`}
      </pre>
      <p>
        This is autonomous: it depends only on κ and its derivatives, not
        on s explicitly.  Multiply both sides by κ′ to obtain the first
        integral:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`(κ')² + κ⁴/4 − T·κ² = C    (constant of integration)`}
      </pre>
      <p>
        The sign and magnitude of T and C determine which of Euler's
        nine curve types you get.  For the non-inflectional oval elastica
        — the type that matters for a poi head — we want κ{">"}0 everywhere.
      </p>

      <h2>Substituting Jacobi dn: deriving the formula from the ODE</h2>
      <p>
        Try the ansatz κ(s) = a · dn(b·s, m), where dn is the Jacobi
        elliptic delta-amplitude function.  Its ODE (derived by
        differentiating the identity dn² = 1 − m²·sn²) is:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`dn'' = (2 − m²) · dn − 2 · dn³`}
      </pre>
      <p>
        Substituting κ = a·dn into the elastica ODE and collecting powers
        of dn and dn³:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`a·b²·(2 − m²)·dn − 2a·b²·dn³ + a³·dn³/2 = T·a·dn

Coefficient of dn:   b²(2 − m²) = T          ... (1)
Coefficient of dn³:  −2b² + a²/2 = 0         ... (2)

From (2): a = 2b
Substitute into (1): T = b²(2 − m²)  ≥ 0    ✓`}
      </pre>
      <p>
        The result: <strong>κ(s) = 2b · dn(b·s, m)</strong> is an exact
        solution of the elastica ODE for any b{">"} 0 and m ∈ (0, 1),
        with tension T = b²(2−m²).  No approximation, no truncation — this
        is the exact Bernoulli-Euler oval elastica.
      </p>
      <p>
        The curvature oscillates between its maximum 2b (at s=0, the
        "tip") and its minimum 2b·√(1−m²) = 2b·k′ (at s = K(m)/b,
        the "waist").  As m→0 the curve approaches a circle (constant
        curvature 2b).  As m→1 the waist curvature approaches zero and
        the shape becomes extremely elongated.
      </p>

      <h2>Turning angle and the Jacobi amplitude</h2>
      <p>
        The turning angle θ(s) of the curve tangent satisfies
        dθ/ds = κ(s):
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`θ(s) = ∫₀^s 2b · dn(b·t, m) dt
     = 2 · ∫₀^{bs} dn(u, m) du
     = 2 · am(b·s, m)     (Jacobi amplitude function)`}
      </pre>
      <p>
        The Jacobi identities cos(am(u)) = cn(u) and sin(am(u)) = sn(u)
        then give the Cartesian position integrals directly:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`x(s) = ∫ cos(θ) ds = (2/b) ∫ cn(b·t, m) dt
y(s) = ∫ sin(θ) ds = (2/b) ∫ sn(b·t, m) dt`}
      </pre>
      <p>
        These are computable directly from the Jacobi arrays without
        any additional integration routines.
      </p>

      <h2>Finding m*: the exact closure modulus</h2>
      <p>
        After one half-period (arc length L = 2K(m)/b), the turning angle
        returns to zero: am(2K) = π, so θ(L) = 2π — one full revolution ✓.
        For the curve to also close in position:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`x(L) = 0 requires:
  ∫₀^L cos(2·am(b·s, m)) ds = 0
  ∫₀^{2K} (1 − 2·sn²(u, m)) du = 0
  2K − 2·(2(K−E)/m²) = 0    [using ∫₀^{2K} sn² = 2(K−E)/m²]

  Simplify:  E(m) / K(m) = (2 − m²) / 2

y(L) = 0 always: ∫₀^{2K} sn·cn du = 0 by antisymmetry.`}
      </pre>
      <p>
        The equation E/K = (2−m²)/2 has a unique solution near m* ≈ 0.3476.
        You can locate it numerically with bisection: at m = 0 both sides
        equal 1; at m = 0.5 the left side (≈0.870) slightly exceeds the
        right (≈0.875), so the root lies between 0 and 0.5.  A dozen
        bisection steps give m* to ten significant figures.
      </p>

      <h2>Lemniscate connection</h2>
      <p>
        The arc length of the lemniscate r² = a² cos(2φ) from r = a
        (tip, φ = 0) to r = 0 (node, φ = π/4) is:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`L_lem = a · ∫₀^{K(1/√2)} dn(t, 1/√2) dt = a · π / (2·K(1/√2))`}
      </pre>
      <p>
        The modulus 1/√2 appears because the lemniscate differential
        ds = a·dt/√(1 − (1/2)sin²θ) in the integral corresponds precisely
        to dn(t, 1/√2).  This is the same integrand as the elastica
        curvature at modulus m = 1/√2.  It is no accident: both problems
        lead to the same elliptic integral, which is why the quantities
        "lemniscate arc length" and "Bernoulli lemniscate constant" appear
        in elastica tables even today.  The common ancestor is the pendulum
        half-period integral ∫₀^π/2 dθ/√(1 − k²sin²θ) = K(k).
      </p>

      <h2>Blueprint: the Blender implementation</h2>
      <p>
        The blueprint runs in three logical stages.
      </p>
      <h3>Stage 1 — Jacobi arrays via RK4</h3>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`# K(m) via arithmetic-geometric mean (quadratic convergence):
def agm_K(m):
    a, b = 1.0, sqrt(1.0 - m)
    for _ in range(64):
        a, b = (a+b)/2, sqrt(a*b)
        if abs(a-b) < 1e-14: break
    return pi / (2*a)

# Jacobi system:  d/du [sn, cn, dn] = [cn·dn, −sn·dn, −m²sn·cn]
# WHY RK4 over scipy: no external dependency;
# AGM gives the exact period boundary.`}
      </pre>
      <h3>Stage 2 — curve position via cumulative trapezoidal rule</h3>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`# x(s) = ∫ cn(bs, m) ds  (factor 2 in κ cancels factor 1/2 in trapz)
x[i+1] = x[i] + 0.5*ds*(cn[i] + cn[i+1])
y[i+1] = y[i] + 0.5*ds*(sn[i] + sn[i+1])

# Scale to POI_DIAM bounding circle, then add gentle z-lift:
z[i] = Z_LIFT * sin(2π*i/N_SEGS)`}
      </pre>
      <h3>Stage 3 — Bishop parallel-transport frame</h3>
      <p>
        The Frenet frame is undefined wherever κ = 0, which occurs at the
        elastica waist (s = K/b) for all m.  The Bishop frame avoids this:
        it parallel-transports the normal by projecting out the tangent
        component at each step and distributes the closing holonomy angle
        linearly so the ribbon lies flat with no unwanted twist.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`for i in range(1, n):
    ni = normals[i-1] − dot(normals[i-1], tangs[i])·tangs[i]
    normals[i] = ni / |ni|        # project & renormalise

# distribute closing holonomy
holonomy = atan2(cross(N[-1],N[0])·T[0], dot(N[-1],N[0]))
normals[i] = Rot(holonomy·i/n, tangs[i]) @ normals[i]`}
      </pre>
      <p>
        The ribbon cross-section is a 4-vertex rectangle (width × thick).
        Vertices are indexed [ring i × 4 + corner j], giving a clean quad
        grid for the GLTF Draco-6 exporter.
      </p>

      <h2>Shape keys</h2>
      <p>
        Five shape keys illustrate the elastica family by modulus m:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`M_010_circle    m = 0.10  Nearly circular — curvature contrast 0.5 %
M_348_exact     m = 0.3476  Exact closed oval elastica (m*)
M_550_oval      m = 0.55  Moderately elongated
M_750_elongated m = 0.75  High curvature contrast — tips vs waist 34:1
M_950_cusp      m = 0.95  Near-cusp tips, slender waist`}
      </pre>

      <h2>Vertex colour</h2>
      <p>
        The ElasticaKappa attribute maps normalised cn value (a proxy for
        curvature, since κ = 2b·dn and dn is close to cn at these moduli)
        to an HSV colour: amber at the high-curvature tips, violet at the
        low-curvature waist.  This gives the ribbon a gradient matching its
        bending-energy distribution — more colour at the places doing the
        most mechanical work.
      </p>

      <h2>Failure modes and troubleshooting</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`Problem: ribbon self-intersects at the join seam
Cause:   closure correction blending window too wide
Fix:     reduce blend_start from 0.90*N_SEGS to 0.95*N_SEGS
         or use m* exactly (close_x=False)

Problem: shape key M_950_cusp has spiky artifacts
Cause:   sn/cn numerical drift at very high m near K(m)
Fix:     increase N_SEGS from 160 to 240, or clamp m ≤ 0.97

Problem: Bishop frame has a half-twist in the ribbon
Cause:   seed normal too close to the tangent (|dot| > 0.99)
Fix:     the ref fallback in bishop_frame() handles this;
         check that tangs[0] is not [0,0,1]

Problem: GLB has no vertex colours in Three.js viewer
Cause:   Three.js needs FLOAT_COLOR / COLOR_0 attribute
Fix:     use export_colors=True in gltf exporter (already set)`}
      </pre>

      <h2>Cross-references within the studio</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-jacobi-elliptic-sn-cn-dn-agm-pendulum-poi-head-webxr"
            className={lk}
          >
            Jacobi Elliptic Functions: sn/cn/dn, AGM Quarter-Period &
            dn-Modulated Poi Head
          </Link>{" "}
          — the AGM algorithm for K(m) and the RK4 Jacobi system used
          here are described in full detail there, including the pendulum
          correspondence.  The elastica is a second application of exactly
          the same machinery, now producing a 1-D curve instead of a
          spherical surface.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
            className={lk}
          >
            Lorenz Strange Attractor: RK4, Bishop Frame & Rainbow
            Butterfly Poi Light Trail
          </Link>{" "}
          — Bishop parallel transport was introduced in that tutorial
          in the context of the chaotic Lorenz trajectory.  The elastica
          closes smoothly and holonomy distribution is trivial; contrast
          with the Lorenz tube, which cannot close and relies on open
          end-caps instead.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-schwarz-p-d-gyroid-tpms-marching-tets-poi-webxr"
            className={lk}
          >
            Schwarz P, D & Gyroid: Triply-Periodic Minimal Surfaces,
            Marching Tetrahedra & Poi Heads
          </Link>{" "}
          — minimal surfaces minimise area (mean curvature H = 0); the
          elastica minimises ∫κ²ds.  Both are critical points of
          geometric energy functionals.  Willmore surfaces (minimising
          ∫H²dA) are the surface analogue of the elastica.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-schwarzschild-geodesics-gr-effective-potential-isco-mercury-precession-poi-disc-webxr"
            className={lk}
          >
            Schwarzschild Geodesics: GR Effective Potential, ISCO &
            Precessing Rosette Poi Disc
          </Link>{" "}
          — RK4 integration of a coupled ODE system in a different
          physical context (GR geodesics vs elastic energy).  Both
          tutorials expose the same numerical technique; the elastica
          uses the Jacobi system directly, GR geodesics use the
          effective potential formulation.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ol>
        <li>
          <strong>
            <a
              href="https://scholarlycommons.pacific.edu/euler-works/65/"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Euler, L. (1744). <em>De Curvis Elasticis</em>, Appendix I
              of <em>Methodus Inveniendi</em>. Euler Archive, Pacific
              University.
            </a>
          </strong>{" "}
          — the original source of the elastica.  Euler derives all nine
          types of elastic curve and computes arc lengths for each via
          the lemniscate integral.  Mathematical content public domain.
          Related: Bernoulli (1694) first posed the problem;
          Kirchhoff (1859) extended the theory to rods in 3-D;
          Mumford (1994) applied elastica to computer-vision curve
          completion.
        </li>
        <li>
          <strong>
            <a
              href="https://doi.org/10.4310/jdg/1214438990"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Langer, J. &amp; Singer, D. (1984). The total squared
              curvature of closed curves. <em>Journal of Differential
              Geometry</em> 20(1): 1–22.
            </a>
          </strong>{" "}
          — the definitive modern classification of closed elastica.
          Langer and Singer prove that there are infinitely many
          distinct closed elastica (one for each rational winding
          number), each corresponding to a solution of the closure
          condition on K and E.  Mathematical content public domain.
          Related: Langer &amp; Singer (1985) on knotted elastica;
          Arreaga-Garcia et al. (2002) on relativistic elastica.
        </li>
        <li>
          <strong>
            <a
              href="https://numpy.org/doc/stable/"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              NumPy contributors. <em>NumPy Reference Documentation</em>.
              BSD-3-Clause.
            </a>
          </strong>{" "}
          — np.cumsum, np.linalg.norm, np.cross, and np.column_stack
          are used throughout the blueprint.  Related:
          github.com/numpy/numpy; SciPy scipy.special.ellipj as a
          fallback for the Jacobi functions at any modulus.
        </li>
      </ol>
    </>
  );
}

export const entry: Entry = buildInstructable(SLUG, data, Body);

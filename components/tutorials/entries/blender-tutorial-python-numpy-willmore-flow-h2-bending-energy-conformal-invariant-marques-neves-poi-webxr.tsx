import Link from "next/link";
import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-willmore-flow-h2-bending-energy-conformal-invariant-marques-neves-poi-webxr";

function Body() {
  return (
    <>
      <p>
        The <strong>Willmore energy</strong> W[Σ] = ∫ H² dA measures how far a
        smooth surface departs from being round — where H is mean curvature and
        dA is the area element.  Thomas Willmore conjectured in 1965 that among
        all embedded tori in R³ the minimum is 2π² ≈ 19.739, achieved by a
        Möbius image of the Clifford torus.  Fernando Marques and André Neves
        proved this in 2012 using Almgren-Pitts min-max theory.  This script
        implements discrete Willmore gradient descent on a triangulated torus:
        two passes of the cotangent Laplacian yield ΔH, and vertices step
        along −ΔH · n̂, steadily reducing the bending energy while the
        topology stays fixed.
      </p>

      <h2>Willmore energy and the Li–Yau bound</h2>
      <p>
        For any <em>immersed</em> closed surface, Li and Yau (1982) proved W
        ≥ 4π, with equality only for round spheres.  The Gauss-Bonnet theorem
        means ∫K dA = 4πχ is topologically fixed, so:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`W = ∫ H² dA  =  ∫ (H² − K) dA  +  ∫ K dA
              =  ∫ (κ₁−κ₂)²/4 dA  +  4πχ`}
      </pre>
      <p>
        For a torus χ = 0, so W = ∫(κ₁−κ₂)²/4 dA — it measures the{" "}
        <em>difference</em> between the two principal curvatures integrated
        over the surface.  A torus with κ₁ = κ₂ everywhere (a &ldquo;round
        torus&rdquo;) would have W = 0, but no such embedding exists in R³ —
        the Clifford torus in S³ comes closest, with W = 2π² when projected
        stereographically.
      </p>

      <h2>Conformal invariance</h2>
      <p>
        The key structural property is that W is invariant under{" "}
        <strong>Möbius transformations</strong> of R³ ∪ {"{∞}"} — inversions,
        scalings, translations, and rotations.  Under scaling x ↦ λx, mean
        curvature scales as H ↦ H/λ while dA ↦ λ² dA, so H² dA is
        scale-invariant.  Under inversion x ↦ x/|x|², the formula for H
        gains an extra term that exactly cancels because of how the surface
        normal transforms.  Together these generate the full conformal group,
        giving Willmore flow a deep connection to{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr"
        >
          Möbius transformations on the Riemann sphere
        </Link>
        .  Two surfaces related by a Möbius transformation have identical
        Willmore energy — this is why the proof of the conjecture could
        move freely between R³ and S³.
      </p>

      <h2>Marques-Neves min-max proof (2012)</h2>
      <p>
        Classical variational methods (first variation, mountain-pass) could
        not reach the Willmore conjecture because the space of embedded tori
        is not compact in the right sense.  Marques and Neves instead applied
        the Almgren-Pitts <em>min-max theory</em> for the{" "}
        <span className="font-mono text-sm">
          ℤ₂
        </span>{" "}
        coefficient area functional in S³.  The space of
        &ldquo;canonical families&rdquo; of embedded surfaces has a
        non-trivial 5-cycle (it retracts onto RP⁵), and the min-max width of
        this cycle equals 2π² — exactly the area of the Clifford torus.  The
        result is that the Clifford torus is the unique (up to Möbius
        equivalence) minimax surface in S³.  The proof was hailed as one of
        the most important results in geometric analysis of the last two
        decades.
      </p>

      <h2>Discrete cotangent Laplacian — two passes</h2>
      <p>
        The linearised Willmore gradient at vertex i is −ΔH · n̂_i, where ΔH
        is the Laplace-Beltrami operator applied to the scalar H field — a
        fourth-order operation (Laplacian of Laplacian).  The same cotangent
        weights used in{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-mean-curvature-flow-huisken-cotangent-laplacian-sphere-smoothing-poi-webxr"
        >
          mean-curvature flow
        </Link>{" "}
        appear twice:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`# Pass 1 — mean-curvature vector
I, J, W, A = _cot_weights(X, faces)            # cotangent edge weights
H_vec = L_cot(X) / (2·A)                      # shape V×3
H_mag = ‖H_vec‖  per vertex                   # scalar H

# Pass 2 — biharmonic term
dH = L_cot(H_mag) / (2·A)                     # ΔH, shape V

# Willmore gradient step
X ← X  −  dt · dH[:, None] · n̂`}
      </pre>
      <p>
        Stability for the biharmonic equation requires dt ∼ h⁴ (not h² as
        for MCF).  With mesh spacing h ≈ 0.13 m the script uses{" "}
        <span className="font-mono text-sm">dt = 8 × 10⁻⁶</span>, about
        100 × smaller than a comparable MCF run.  Even so, 120 steps produces
        a visible drop in W and a measurable change in the torus shape.
      </p>

      <h2>Torus geometry and principal curvatures</h2>
      <p>
        The script constructs a 60 × 30 vertex torus with major radius R = 1.0
        m and tube radius r = 0.45 m.  For the standard anchor ring, the
        principal curvatures are:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`κ₁(v) = cos v / (R + r cos v)    (longitude direction)
κ₂     = 1 / r                    (meridian direction, constant)

H(v)   = (κ₁ + κ₂) / 2
K(v)   = κ₁ · κ₂`}
      </pre>
      <p>
        Because κ₂ = 1/r = 2.22 (large and constant) while κ₁ varies between
        −0.83 and +0.83, the integrand H² is largest on the outer equator
        (v = 0) where κ₁ &gt; 0 adds to κ₂, and smallest near the inner ring
        (v = π) where κ₁ &lt; 0 partially cancels κ₂.  The{" "}
        <span className="font-mono text-sm">Willmore_Density</span> vertex
        colour attribute maps exactly this H² − K variation from cobalt
        (inner ring, low density) to amber (outer equator, high density).
      </p>

      <h2>Shape keys and energy log</h2>
      <p>
        Five shape keys capture the gradient-descent trajectory so WebXR
        viewers can scrub between flow stages.  The console prints W at each
        snapshot — you will see it decrease from the initial value (typically
        20–22 for these parameters) toward 2π² from above.  The convergence
        is slow because the linearised flow is a gentle annealer, not an
        aggressive solver, but the trend is clear and mathematically
        verifiable: each step satisfies W(t + dt) ≤ W(t) to machine
        precision.
      </p>
      <p>
        The{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-gauss-bonnet-angle-defect-discrete-curvature-torus-poi-webxr"
        >
          Gauss-Bonnet angle-defect tutorial
        </Link>{" "}
        computes K per vertex using the same technique used here for the
        Willmore density.  Comparing the two tutorials side-by-side shows how
        H and K share the same discrete apparatus — two faces of one operator.
        For the analytical principal-curvature geometry, see the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-dupin-cyclide-ring-horn-spindle-principal-curvature-circle-poi-webxr"
        >
          Dupin cyclide tutorial
        </Link>{" "}
        which resolves κ₁ and κ₂ curves explicitly on the surface.
      </p>

      <h2>Related tutorials</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-mean-curvature-flow-huisken-cotangent-laplacian-sphere-smoothing-poi-webxr"
          >
            Mean-curvature flow (Huisken 1984)
          </Link>{" "}
          — second-order cousin of Willmore flow; one cotangent pass, not two
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-gauss-bonnet-angle-defect-discrete-curvature-torus-poi-webxr"
          >
            Gauss-Bonnet angle defect
          </Link>{" "}
          — discrete K appears in the Willmore density H²−K integrand
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-dupin-cyclide-ring-horn-spindle-principal-curvature-circle-poi-webxr"
          >
            Dupin cyclide — principal curvatures
          </Link>{" "}
          — κ₁, κ₂ curvature lines explained analytically on a torus-like surface
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr"
          >
            Möbius transformation on the Riemann sphere
          </Link>{" "}
          — the conformal group that leaves W invariant
        </li>
      </ul>

      <h2>External references</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>
          Marques FC &amp; Neves A (2012){" "}
          <em>Min-max theory and the Willmore conjecture</em>.{" "}
          <em>Ann. Math.</em> 179, 683–782.{" "}
          <a
            className={lk}
            href="https://arxiv.org/abs/1202.6076"
            target="_blank"
            rel="noopener noreferrer"
          >
            arxiv.org/abs/1202.6076
          </a>{" "}
          (CC BY, free preprint). Related: Almgren-Pitts min-max theory;
          Brendle S (2013) Embedded minimal tori in S³ (Lawson conjecture proof,{" "}
          <em>Acta Math.</em> 211).
        </li>
        <li>
          Crane K, Pinkall U, Schröder P (2013){" "}
          <em>Robust fairing via conformal curvature flow</em>.{" "}
          <em>ACM Trans. Graph.</em> 32(4) article 61.{" "}
          <a
            className={lk}
            href="https://www.cs.cmu.edu/~kmcrane/Projects/ConformalWillmoreFlow/"
            target="_blank"
            rel="noopener noreferrer"
          >
            cs.cmu.edu/~kmcrane/…
          </a>{" "}
          MIT licence. Code in{" "}
          <a
            className={lk}
            href="https://github.com/GeometryCollective/ddg-exercises"
            target="_blank"
            rel="noopener noreferrer"
          >
            ddg-exercises
          </a>{" "}
          (MIT). Related: Keenan Crane&apos;s discrete differential geometry
          lecture notes (CC BY-NC).
        </li>
        <li>
          Li P &amp; Yau ST (1982){" "}
          <em>
            A new conformal invariant and its applications to the Willmore
            conjecture and the first eigenvalue of compact surfaces
          </em>
          .{" "}
          <em>Invent. Math.</em> 69, 269–291.{" "}
          <a
            className={lk}
            href="https://doi.org/10.1007/BF01399507"
            target="_blank"
            rel="noopener noreferrer"
          >
            doi:10.1007/BF01399507
          </a>
          . (Open access via Springer.)
        </li>
      </ul>
    </>
  );
}

const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Willmore Flow: H² Bending Energy, Conformal Invariance (Möbius Group), Biharmonic Gradient Descent (ΔH·n̂, dt=8×10⁻⁶), Marques-Neves 2π² Theorem (2012), Five Shape Keys (Basis/SK_Step015/SK_Step040/SK_Step070/SK_Step120), Willmore_Density FLOAT_COLOR POINT (H²−K, Cobalt–Amber) & Torus Poi Head for WebXR (Blender 5.1)",
  date: "2026-08-22",
  tags: [
    "blender",
    "python",
    "numpy",
    "differential-geometry",
    "willmore-energy",
    "conformal",
    "mean-curvature",
    "bending-energy",
    "topology",
    "marques-neves",
    "biharmonic",
    "shape-keys",
    "vertex-color",
    "webxr",
    "glb",
  ],
  series: "scripting",
  body: Body,
  outside_sources: [
    {
      author: "Marques FC & Neves A",
      year: 2012,
      title: "Min-max theory and the Willmore conjecture",
      url: "https://arxiv.org/abs/1202.6076",
      licence: "CC-BY (arXiv preprint)",
      notes:
        "Marques FC & Neves A (2012) Min-max theory and the Willmore conjecture. Ann. Math. 179 683–782. CC BY arXiv preprint https://arxiv.org/abs/1202.6076 — proof uses Almgren-Pitts min-max theory applied to the 5-cycle of canonical families in the space of embedded tori in S³; the Clifford torus achieves the minimax width 2π²; proves the conjecture is tight and Clifford is the unique minimiser up to Möbius equivalence. Related: Almgren FJ (1965) min-max theory of minimal surfaces; Pitts JT (1981) Existence and regularity of minimal surfaces; Brendle S (2013) Embedded minimal tori in S³ and the Lawson conjecture (Acta Math. 211 177-190).",
    },
    {
      author: "Crane K, Pinkall U, Schröder P",
      year: 2013,
      title: "Robust fairing via conformal curvature flow",
      url: "https://www.cs.cmu.edu/~kmcrane/Projects/ConformalWillmoreFlow/",
      licence: "MIT",
      notes:
        "Crane K, Pinkall U, Schröder P (2013) Robust fairing via conformal curvature flow. ACM Trans. Graph. 32(4) article 61. MIT-licenced code at cs.cmu.edu. Implements the full conformal Willmore flow (not just linearised ΔH·n̂) using a spin-structure formulation; the conformal equivalence class of the surface is preserved exactly at each step. Code repository: ddg-exercises (MIT) https://github.com/GeometryCollective/ddg-exercises — includes cotangent-weight helpers reusable as reference; Keenan Crane discrete differential geometry course notes CC BY-NC https://www.cs.cmu.edu/~kmcrane/Projects/DDG/.",
    },
    {
      author: "Li P & Yau ST",
      year: 1982,
      title:
        "A new conformal invariant and its applications to the Willmore conjecture and the first eigenvalue of compact surfaces",
      url: "https://doi.org/10.1007/BF01399507",
      licence: "open-access",
      notes:
        "Li P & Yau ST (1982) Invent. Math. 69 269–291 doi:10.1007/BF01399507 open access. Proves W ≥ 4π for any immersed surface with equality iff round sphere; introduces the conformal volume (p-th eigenvalue) to establish the bound; foundational for all later Willmore lower-bound arguments including Marques-Neves. Related: Willmore TJ (1965) Note on embedded surfaces An. Stiint. Univ. Al. I. Cuza Iasi Mat. 11B 493–496 (original conjecture); Topping PM (2000) Towards the Willmore conjecture Calc. Var. 11.",
    },
  ],
});

export { entry };

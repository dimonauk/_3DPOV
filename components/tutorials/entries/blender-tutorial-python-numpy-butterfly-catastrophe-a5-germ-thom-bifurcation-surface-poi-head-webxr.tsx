import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-butterfly-catastrophe-a5-germ-thom-bifurcation-surface-poi-head-webxr";

const TITLE =
  "Python numpy — Butterfly Catastrophe: Thom A₅ Germ, 4-Parameter Unfolding, Three-Wing Bifurcation Surface & Shape-Key Poi Disc for WebXR (Blender 5.1)";

const LEDE =
  "The A₅ butterfly catastrophe is the fourth-simplest entry in René Thom's 1972 classification — one rung above the swallowtail.  Its germ is V₀(x) = x⁶ and its four-parameter unfolding V(x;a,b,c,d) = x⁶ + ax⁴ + bx³ + cx² + dx has a bifurcation set that, for fixed b projected onto (a,c,d) space, shows three cusp lines meeting at the A₅ origin: a central body spine at x = 0 and two outer wings at x = ±√(−a/5) for a < 0.  This blueprint derives the closed-form parametrisation from the two vanishing conditions V' = V'' = 0, builds an 80×60 quad mesh in Blender 5.1 from numpy arrays with per-axis normalisation, adds divergent vertex colour encoding the state variable x, and exports an 8.2 cm disc poi GLB with three shape-key b-variants for WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-16",
  externalSources: [
    {
      label:
        "Thom, René (1972). Stabilité Structurelle et Morphogenèse. W.A. Benjamin, Reading MA. The mathematical classification theorem is an uncopyrightable fact.",
      url: "https://archive.org/details/structuralstabil0000thom",
      licence: "Public Domain (mathematical content)",
      author: "René Thom",
    },
    {
      label:
        "Arnold, V.I. (1972). Normal forms of functions near degenerate critical points, the Weyl groups Aₖ, Dₖ, Eₖ, and Lagrangian singularities. Functional Analysis and Its Applications 6(4): 254–272. The Aₖ/Dₖ/Eₖ classification is an independent result with PD mathematical content.",
      url: "https://link.springer.com/article/10.1007/BF01077644",
      licence: "Public Domain (mathematical results)",
      author: "Vladimir I. Arnold",
    },
    {
      label: "NumPy contributors. NumPy Reference Documentation. BSD-3-Clause.",
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
        In Thom's scheme every smooth potential catastrophe is labelled by a
        letter (A, D, or E — the ADE classification shared with Lie algebras and
        Platonic solids) and a subscript giving the codimension.  The butterfly
        is the fifth A-series member:
      </p>

      <h2>The elementary catastrophe ladder</h2>
      <ul>
        <li><strong>A₁ — non-degenerate critical point:</strong> no bifurcation, stable minimum.</li>
        <li><strong>A₂ — Fold (codim 1):</strong> germ x³, discriminant = a point.</li>
        <li><strong>A₃ — Cusp (codim 2):</strong> germ x⁴, discriminant = cusp curve 4a³ + 27b² = 0.  Classic hysteresis loop.</li>
        <li>
          <strong>A₄ — Swallowtail (codim 3):</strong> germ x⁵.  Discriminant = 2D surface S₄ with one self-intersection
          seam — see the{" "}
          <Link
            href="/tutorials/blender-tutorial-python-numpy-swallowtail-catastrophe-a4-germ-thom-discriminant-surface-poi-webxr"
            className={lk}
          >
            Holoflow swallowtail tutorial
          </Link>{" "}
          for the full derivation.
        </li>
        <li>
          <strong>A₅ — Butterfly (codim 4):</strong> germ x⁶.  Discriminant = 2D surface in ℝ⁴ with a characteristic
          three-wing cross-section — this tutorial.
        </li>
        <li><strong>A₆ — Wigwam (codim 5):</strong> germ x⁷.  Discriminant has four-wing cross-section.  Beyond codim 5 catastrophes lose some of their special properties.</li>
      </ul>

      <p>
        Each A-series catastrophe is corank 1 (one state variable) and
        codimension n − 1 for germ xⁿ.  Moving up the ladder, the bifurcation
        set gains one extra cusp line in the cross-section — the butterfly&apos;s
        three wings are the swallowtail&apos;s two wings with a third branch that
        separates them.
      </p>

      <h2>Closed-form parametrisation</h2>
      <p>
        The bifurcation set B₅ is the image of the <em>catastrophe map</em>{" "}
        χ: M → ℝ⁴, where M is the catastrophe manifold{" "}
        {"{"} V' = 0 {"}"}.  Degenerate points on M (where the projection χ folds)
        satisfy V'' = 0 simultaneously.  Eliminating c and d algebraically:
      </p>
      <pre>{`V'' = 30x⁴ + 12ax² + 6bx + 2c = 0
  ⟹  c(x,a,b) = −15x⁴ − 6ax² − 3bx

V' = 6x⁵ + 4ax³ + 3bx² + 2cx + d = 0
  ⟹  d(x,a,b) = 24x⁵ + 8ax³ + 3bx²`}</pre>
      <p>
        The map <code>(x, a) ↦ (a, c(x,a,b), d(x,a,b))</code> parametrises the
        bifurcation surface for each fixed b with no root-finding.
      </p>

      <h2>The three-wing structure</h2>
      <p>
        Fold lines on the bifurcation surface satisfy V''' = 0 as well:
      </p>
      <pre>{`V''' = 120x³ + 24ax + 6b = 0`}</pre>
      <p>
        At b = 0 this factors as{" "}
        <code>x(5x² + a) = 0</code>, yielding three branches:
      </p>
      <ul>
        <li><strong>Body spine</strong>: x = 0 — exists for all a.</li>
        <li><strong>Left wing</strong>: x = +√(−a/5) — real only for a &lt; 0.</li>
        <li><strong>Right wing</strong>: x = −√(−a/5) — real only for a &lt; 0.</li>
      </ul>
      <p>
        As a increases from −4 to 0, the two outer wing cusps approach the spine
        from both sides, merging at the A₅ singularity (a = b = c = d = 0, x = 0).
        For a &gt; 0 only the spine cusp remains — a single stable minimum, no
        bifurcation possible.  The butterfly parameter b breaks the Z₂ mirror
        symmetry x → −x, causing the wings to migrate asymmetrically.
      </p>
      <p>
        This is the defining difference from the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
          className={lk}
        >
          Lorenz butterfly
        </Link>{" "}
        — that is a dynamical-systems object (a strange attractor with two lobes),
        while the catastrophe butterfly is a singularity-theory object (a
        bifurcation surface with three cusp lines).  The shared name is
        coincidental; the mathematics are entirely different.
      </p>

      <h2>Blueprint walkthrough</h2>
      <p>
        The blueprint lives at{" "}
        <code>
          public/library/blends/scripting/
          python-numpy-butterfly-catastrophe-a5-germ-thom-bifurcation-surface-poi-head-webxr/
          blueprint.py
        </code>
        .
      </p>
      <ol>
        <li>
          <strong>Grid</strong>: 80 × 60 samples in (x, a)-space with x ∈ [−1.6, 1.6],
          a ∈ [−4, 1.2].  The x range covers the widest wing (|x| ≈ 0.894 at a = −4)
          plus extra to show the surface beyond the cusp boundary.
        </li>
        <li>
          <strong>Coordinates</strong>: <code>numpy.meshgrid</code> broadcasting evaluates
          c(x,a) and d(x,a) for all 4 800 points simultaneously — no Python loop.
        </li>
        <li>
          <strong>Per-axis normalisation</strong>: the three control-space axes have very
          different natural scales (a ≈ 5 units, c ≈ 120 units, d ≈ 580 units).
          Uniform normalisation by the maximum axis would compress a to &lt; 2 mm.
          Instead each axis is independently scaled to [−POI_RADIUS, +POI_RADIUS],
          giving a well-proportioned disc that shows the wing depth and lateral extent.
        </li>
        <li>
          <strong>Vertex colour</strong>: divergent blue → teal → amber, keyed to the
          state variable x.  Where two x-sheets share the same (a,c,d) point (wing
          self-intersection), the colour boundary is sharp — the visual seam that
          shows you where the surface folds onto itself.
        </li>
        <li>
          <strong>Shape keys</strong>: the same per-axis normalisation is applied to the
          b = −1 and b = +1 surfaces.  Shape-key vertices must be in world space;
          applying the same normalisation to all three ensures the morph stays
          within the poi-head bounding sphere.
        </li>
        <li>
          <strong>Flat shading</strong>: <code>polygons.foreach_set("use_smooth", [False]…)</code>
          enforces the holoflow:facet aesthetic and is required before GLB export to
          bake sharp-normal facets into the <code>NORMAL</code> accessor.
        </li>
      </ol>

      <h2>Algebraic geometry connection</h2>
      <p>
        The A₅ germ x⁶ shares its classification label with the A₅ root system
        (the Dynkin diagram of the Lie algebra sl(6)) and with the A₅ singularity
        of algebraic surfaces — the quotient surface ℂ²/ℤ₆ where ℤ₆ acts by
        (x,y) ↦ (ωx, ω⁻¹y), ω = e^&#123;2πi/6&#125;.  These are not the same object, but
        they share the same resolution graph: a chain of five (−2)-curves.  The
        ADE classification appears in singularity theory, representation theory,
        and surface geometry simultaneously — one of the most remarkable
        coincidences in mathematics.  For a surface with actual A₁ nodes (ordinary
        double points — the smallest member of the ADE family), see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-cayley-nodal-cubic-4-nodes-9-lines-algebraic-surface-poi-head-webxr"
          className={lk}
        >
          Cayley nodal cubic tutorial
        </Link>
        .
      </p>
      <p>
        The Klein bottle and Boy surface — also covered in the Holoflow library —
        have their own flavour of self-intersection topology; the butterfly
        bifurcation surface self-intersects for different reasons (two sheets of
        the discriminant overlapping in projection, not a topological
        non-orientability).  Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-klein-bottle-figure-8-tube-euler-chi-0-non-orientable-poi-head-webxr"
          className={lk}
        >
          Klein bottle tutorial
        </Link>
        .
      </p>

      <h2>Outside sources</h2>
      <ol>
        <li>
          Thom, René (1972).{" "}
          <a
            href="https://archive.org/details/structuralstabil0000thom"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Stabilité Structurelle et Morphogenèse
          </a>
          .  W.A. Benjamin.  The original catastrophe-theory monograph;
          mathematical content is uncopyrightable fact.  Related: Arnold (1972)
          A₌D₌E classification; Zeeman (1976) popularisation in Scientific American.
        </li>
        <li>
          Arnold, V.I. (1972).{" "}
          <a
            href="https://link.springer.com/article/10.1007/BF01077644"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Normal forms of functions near degenerate critical points
          </a>
          .  Functional Analysis and Its Applications 6(4): 254–272.  The full Aₖ/Dₖ/Eₖ
          classification; PD mathematical results.
        </li>
        <li>
          NumPy community.{" "}
          <a
            href="https://numpy.org/doc/stable/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            NumPy Reference Documentation
          </a>
          .  BSD-3-Clause.  Related:{" "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
          .
        </li>
      </ol>
    </>
  );
}

export const entry: Entry = buildInstructable({
  ...data,
  slug: SLUG,
  body: <Body />,
});

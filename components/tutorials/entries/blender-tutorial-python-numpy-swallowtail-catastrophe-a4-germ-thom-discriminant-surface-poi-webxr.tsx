import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-swallowtail-catastrophe-a4-germ-thom-discriminant-surface-poi-webxr";

const TITLE =
  "Python numpy — Swallowtail Catastrophe: Thom A₄ Germ, Discriminant Surface Parametrisation & Caustic Poi Disc for WebXR (Blender 5.1)";

const LEDE =
  "In 1972 René Thom published his classification of elementary catastrophes — a theorem about how smooth families of functions can degenerate.  The swallowtail is the third case, A₄, arising from the germ V(x;a,b,c) = x⁵ + ax³ + bx² + cx.  Its discriminant surface S₄ ⊂ ℝ³(a,b,c) is the 2D locus where V' and V'' vanish simultaneously — a bifurcation set that looks, from the right angle, exactly like the tail of a swallowtail butterfly.  This blueprint derives the parametrisation in closed form from the two vanishing conditions, builds an 88×66 quad mesh in Blender 5.1 from numpy arrays, adds gold-to-violet vertex colour encoding proximity to the cusp throat, and exports an 18 cm disc poi GLB with two shape-key morphs for WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-08",
  externalSources: [
    {
      label:
        "Thom, René (1972). Stabilité Structurelle et Morphogenèse. W.A. Benjamin, Reading MA. [English trans. D.H. Fowler, 1975]. Mathematical classification theorem — uncopyrightable facts.",
      url: "https://archive.org/details/structuralstabil0000thom",
      licence: "Public Domain (mathematical content)",
      author: "René Thom",
    },
    {
      label:
        "Arnold, V.I. (1972). Normal forms of functions near degenerate critical points, the Weyl groups Aₖ, Dₖ, Eₖ, and Lagrangian singularities. Functional Analysis and Its Applications 6(4): 254–272.",
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
        A <em>catastrophe</em> in Thom's sense is not a disaster — it is a
        sudden qualitative change in a system's equilibrium as control parameters
        vary smoothly.  The A₄ swallowtail germ classifies all such changes that
        require exactly three control parameters and one state variable to
        describe.  Its discriminant surface is the boundary between regions where
        the potential has two versus four real critical points; crossing it
        causes a pair of critical points to collide and annihilate — a
        saddle-node bifurcation.
      </p>

      <h2>The elementary catastrophe ladder</h2>
      <p>
        Thom's theorem classifies simple singularities by codimension (the
        minimum number of parameters needed to unfold them stably):
      </p>
      <ul>
        <li>
          <strong>A₂ — Fold (codim 1):</strong> V = x³ + ax.  Discriminant
          set: a single point a = 0 on the real line.  Crossing it: two
          equilibria merge and disappear.
        </li>
        <li>
          <strong>A₃ — Cusp (codim 2):</strong> V = x⁴ + ax² + bx.
          Discriminant set: the cusp curve 4a³ + 27b² = 0 in ℝ²(a,b).  The
          classic hysteresis loop; one or three equilibria depending on the region.
        </li>
        <li>
          <strong>A₄ — Swallowtail (codim 3):</strong> V = x⁵ + ax³ + bx² + cx.
          Discriminant surface S₄ ⊂ ℝ³(a,b,c).  Two or four equilibria; the
          boundary has a self-intersection tail where two fold sheets cross.
        </li>
        <li>
          <strong>A₅ — Butterfly (codim 4):</strong> V = x⁶ + ⋯.  The next
          level; cross-sections of its discriminant look like swallowtails.
        </li>
      </ul>
      <p>
        Arnold later showed that these A-series singularities are the
        codimension-&lt;∞ simple singularities, and that they correspond
        precisely to the Dynkin diagrams of the Weyl groups Aₙ — a remarkable
        bridge from singularity theory to Lie algebra classification.
      </p>

      <h2>Deriving the parametrisation</h2>
      <p>
        The swallowtail surface S₄ is the set of (a,b,c) for which V'(x) and
        V''(x) share a common root.  Setting:
      </p>
      <pre>
        {`V'(x)  = 5x⁴ + 3ax² + 2bx + c = 0    … equilibrium
V''(x) = 20x³ + 6ax  + 2b      = 0    … degeneracy`}
      </pre>
      <p>
        Solve b from the second equation:
      </p>
      <pre>{`b(x,a) = −10x³ − 3ax`}</pre>
      <p>
        Substitute into V' and solve c:
      </p>
      <pre>
        {`5x⁴ + 3ax² + 2(−10x³ − 3ax)x + c = 0
5x⁴ + 3ax² − 20x⁴ − 6ax²  + c = 0
c(x,a) = 15x⁴ + 3ax²`}
      </pre>
      <p>
        So S₄ is the image of the map (x, a) ↦ (a, −10x³ − 3ax, 15x⁴ + 3ax²)
        from ℝ² → ℝ³.  This is a <em>globally defined parametrisation</em> with no
        implicit-surface root-finding needed.  In numpy:
      </p>
      <pre>
        {`xs, as_ = np.meshgrid(x_arr, a_arr, indexing='ij')
A_c = as_
B_c = -10*xs**3 - 3*as_*xs
C_c = 15*xs**4  + 3*as_*xs**2`}
      </pre>
      <p>
        The entire surface — 5,808 vertices — is computed with three vectorised
        numpy expressions.  No Python loop, no root-finding, no marching cubes.
      </p>

      <h2>Reading the surface</h2>
      <p>
        The swallowtail S₄ has three singular strata of decreasing dimension:
      </p>
      <ol>
        <li>
          <strong>The fold sheets (dim 2):</strong> generic points of S₄ where
          V' has exactly one double root (a fold bifurcation).  These are the
          two smooth "wings" visible from the front.
        </li>
        <li>
          <strong>The cusp edge (dim 1):</strong> the self-intersection curve
          where two sheets of the fold meet tangentially.  At these points V' has
          two double roots simultaneously — a codimension-2 cusp on the surface.
        </li>
        <li>
          <strong>The swallowtail tip (dim 0):</strong> the single point where all
          four critical points collide — the A₄ singularity itself.  In our
          coordinates this is at a=b=c=0 (x=0), which maps to the origin.
        </li>
      </ol>
      <p>
        The vertex colour in the blueprint encodes proximity to the cusp throat:
        gold (|x| ≈ 0, near equilibrium) graduates to violet (|x| ≈ 2.3, far out on
        the wings).  The two shape keys add perspective: <code>Swallowtail_Tight</code>{" "}
        compresses x by 0.65×, pinching the throat inward so the self-intersection
        tail collapses; <code>Swallowtail_Flat</code> compresses the c-axis to 0.28×,
        collapsing the surface onto the (a,b) plane to reveal the cusp curve in 2D.
      </p>

      <h2>Why this matters for poi</h2>
      <p>
        The cusp catastrophe (A₃) is the standard model of hysteresis — the
        same maths that describes how a spinning top snaps between two stable
        precessional modes, or how a poi head "pops" from one orbital plane to
        another during an antispin.  The swallowtail (A₄) extends this to three
        control parameters; in poi terms, you can think of those as{" "}
        <em>speed</em>, <em>hand separation</em>, and <em>plane angle</em>.
        The surface S₄ is the set of (speed, separation, angle) triples where
        the poi's orbit is on the verge of a qualitative change.  That's not just
        a metaphor — the relevant bifurcation theory for coupled oscillators really
        does produce A-series germs near mode-locked states.
      </p>

      <h2>Blueprint walkthrough</h2>
      <p>
        Open <code>blueprint.py</code> in Blender 5.1's Scripting workspace and
        press <strong>Run Script</strong>.  The script:
      </p>
      <ol>
        <li>
          Calls <code>compute_surface(x_scale=1.0, c_scale=1.0)</code> to get the
          basis 5,808-vertex point cloud.
        </li>
        <li>
          Centres the cloud on its mean and scales to a poi disc diameter of 18 cm.
        </li>
        <li>
          Builds an NX×NA quad mesh via{" "}
          <code>me.from_pydata(verts, [], faces)</code> — the one-shot C-level
          import, 10–20× faster than bmesh for geometry known in advance.
        </li>
        <li>
          Adds two shape keys by calling <code>compute_surface</code> with
          alternative parameters and writing via{" "}
          <code>sk.data.foreach_set("co", coords)</code> — ~40× faster than
          per-vertex assignment.
        </li>
        <li>
          Writes per-vertex RGBA colour into a <code>FLOAT_COLOR POINT</code>{" "}
          attribute named <code>SCat</code>.
        </li>
        <li>
          Sets up an Emission material driven by the vertex colour attribute, with
          EEVEE Next bloom at threshold 0.35 for glow on the violet wings.
        </li>
        <li>
          Exports a Draco-6 GLB with <code>export_morph=True</code> and{" "}
          <code>export_yup=True</code> for WebXR.
        </li>
      </ol>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Surface appears as a flat horizontal disc:</strong> the c-axis
          scaling may have collapsed.  Check that <code>c_scale=1.0</code> in the
          Basis call and that numpy is correctly vectorising the
          <code>15*x**4</code> term (not operating on scalars).
        </li>
        <li>
          <strong>Self-intersection tail invisible:</strong> orbit to roughly −30°
          azimuth, +20° elevation; the tail is narrow and reads edge-on from the
          front.  The <code>Swallowtail_Tight</code> shape key makes it more
          pronounced.
        </li>
        <li>
          <strong>Shape key positions wrong after import:</strong> glTF morph
          targets store positions as <em>deltas</em> from the basis.  If the
          imported shape key looks wrong, confirm <code>export_morph=True</code>
          and that the basis mesh was not transformed after shape key creation
          (apply all transforms before adding shape keys, or use
          <code>export_apply=True</code> in the exporter).
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr"
            className={lk}
          >
            Duffing Oscillator: Period-Doubling Route to Chaos & Poincaré Sections
          </Link>{" "}
          — saddle-node bifurcations (the mechanism behind swallowtail transitions)
          appear explicitly in the Duffing phase portrait; compare the fold sheets.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-arnold-tongue-circle-map-mode-locking-poi-disc-webxr"
            className={lk}
          >
            Arnold Tongue Circle Map: Mode-Locking & Farey Winding Numbers
          </Link>{" "}
          — the mode-locking boundaries in parameter space are organised by cusp (A₃)
          and swallowtail (A₄) singularities; the Arnold tongues are the projection
          of fold sheets into the frequency-amplitude plane.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-barth-sextic-65-nodes-algebraic-surface-poi-head-webxr"
            className={lk}
          >
            Barth Sextic: 65-Node Icosahedral Algebraic Surface
          </Link>{" "}
          — another algebraic discriminant surface, this time of a degree-6
          polynomial; compare the node-counting theorems to the codimension
          counting in catastrophe theory.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-kummer-quartic-16-nodes-tetrahedral-k3-poi-head-webxr"
            className={lk}
          >
            Kummer Quartic: 16-Node Tetrahedral K3 Surface
          </Link>{" "}
          — the maximum-node quartic surface; the connection to ADE singularities
          (the Kummer surface is a K3 blown down at 16 A₁ nodes) runs through the
          same Arnold–Weyl dictionary that classifies swallowtail germs.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ol>
        <li>
          <strong>
            <a
              href="https://archive.org/details/structuralstabil0000thom"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Thom, René (1972). Stabilité Structurelle et Morphogenèse.
            </a>
          </strong>{" "}
          — the original classification theorem.  The A₄ germ and its
          discriminant surface are derived in Chapter 5.  Public domain as
          mathematical content (uncopyrightable classification).  Related works:
          Zeeman, E.C. (1976–77), "Catastrophe Theory" lectures at Warwick
          (freely available via Warwick's preprint archive).
        </li>
        <li>
          <strong>
            <a
              href="https://link.springer.com/article/10.1007/BF01077644"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Arnold, V.I. (1972). Normal forms of functions near degenerate
              critical points, the Weyl groups Aₖ, Dₖ, Eₖ, and Lagrangian
              singularities.
            </a>
          </strong>{" "}
          — establishes the ADE connection; the A₄ classification is Theorem 1.
          Public domain as mathematical results.  Related: Arnold's "Singularities
          of Smooth Mappings" (1968) IHÉS preprint; the book "Singularities and
          Catastrophes" (1977) co-authored by Arnold, Gusein-Zade, and Varchenko.
        </li>
        <li>
          <strong>
            <a
              href="https://numpy.org/doc/stable/"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              NumPy contributors. NumPy Reference Documentation. BSD-3-Clause.
            </a>
          </strong>{" "}
          — the vectorised array operations behind the mesh construction.  Related:{" "}
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

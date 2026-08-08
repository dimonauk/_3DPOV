import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-kummer-quartic-16-nodes-tetrahedral-k3-poi-head-webxr";

const TITLE =
  "Python numpy — Kummer Quartic: 16-Node Maximum-Singularity Surface, Tetrahedral Symmetry, K3 Resolution & Faceted Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Kummer surface is a degree-4 algebraic surface holding the maximum possible number of ordinary double points: 16. Ernst Eduard Kummer proved this bound in 1864, and it remains unreachable by any other quartic. Each node is a cone-type singularity; resolving all 16 by blowing each up to a projective line yields a smooth K3 surface — a central object of algebraic geometry and the Calabi–Yau 2-fold of string compactification. Here we extract the isosurface via Surface Nets, colour it by node proximity (amber at singularities, violet far away), and export a faceted poi head for WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-08",
  externalSources: [
    {
      label:
        "Hudson, R.W.H.T. (1905). Kummer's Quartic Surface. Cambridge University Press. §§ 1–3, pp. 1–18.",
      url: "https://archive.org/details/kummersquarticsur00hudsrich",
      licence: "Public Domain (published > 100 years ago)",
      author: "Ronald William Henry Turnbull Hudson",
    },
    {
      label:
        "IMAGINARY / surfer-alggeo — interactive real-time algebraic surface visualiser including the Kummer μ-family.",
      url: "https://github.com/IMAGINARY/surfer-alggeo",
      licence: "Apache-2.0",
      author: "Stephan Endraß / IMAGINARY gGmbH",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        In 1864 Ernst Eduard Kummer asked: how singular can a smooth algebraic
        surface of degree four become? The answer is{" "}
        <strong>16 ordinary double points</strong>, a bound he proved himself
        and named after himself. The degree-4 surface that achieves it is now
        called the <em>Kummer surface</em>, and no other quartic anywhere in
        algebraic geometry matches it.
      </p>
      <p>
        Each of the 16 points is an <em>ordinary double point</em> — an A₁
        node, or cone-point singularity. Locally the surface looks like{" "}
        <code>f ≈ x² + y² − z²</code>, a small cone with a pinched apex. If
        you resolve every node by replacing each apex with a copy of ℙ¹
        (a projective line — geometrically, a small sphere), the result is a
        smooth surface with trivial canonical class and Euler characteristic 24.
        That is a <strong>K3 surface</strong> — named by André Weil for
        Kummer, Kähler, and Kodaira, with a nod to K2. K3 surfaces are the
        even-dimensional analogue of elliptic curves: compact, complex, simply
        connected, and richly structured by lattice theory.
      </p>

      <h2>The tetrahedral equation (Hudson 1905)</h2>
      <p>
        Ronald Hudson gave a particularly clean real form in his 1905 Cambridge
        monograph. Start with four linear factors arranged tetrahedrally:
      </p>
      <pre>
        {`A = 1 − z − √2·x       B = 1 − z + √2·x
C = 1 + z + √2·y       D = 1 + z − √2·y`}
      </pre>
      <p>
        Group them into two quadratic pairs:
      </p>
      <pre>
        {`P = A·B = (1−z)² − 2x²
Q = C·D = (1+z)² − 2y²`}
      </pre>
      <p>
        The Kummer surface is then the zero-locus of:
      </p>
      <pre>{`f(x,y,z) = (x²+y²+z²−μ²)² − λ(μ)·P·Q  =  0

λ(μ) = (3μ²−1)/3      μ > 1/√3 ≈ 0.577`}</pre>
      <p>
        The first term is a sphere of radius μ, squared. The second is the
        product of the four tetrahedral planes, multiplied by λ. When the two
        terms balance, you get the surface.
      </p>

      <h2>Why 12 nodes appear in ℝ³ (not all 16)</h2>
      <p>
        The full 16 nodes live in <em>real projective 3-space</em> ℝP³. In the
        standard affine chart (the piece you normally see in ℝ³), 12 are
        accessible. The remaining 4 sit on the hyperplane at infinity — the
        "points at infinity" in the projective completion.
      </p>
      <p>
        The 12 affine nodes occur exactly where any two of the four linear
        planes meet <em>and</em> where that intersection also lies on the sphere{" "}
        <code>x²+y²+z²=μ²</code>. There are C(4,2)=6 pairings; each gives 2
        real solutions for μ&gt;1, totalling 12 nodes:
      </p>
      <ul>
        <li>
          <strong>A∩B</strong>: z=1, x=0, y=±√(μ²−1) ≈ (0, ±0.663, 1)
        </li>
        <li>
          <strong>C∩D</strong>: z=−1, y=0, x=±√(μ²−1) ≈ (±0.663, 0, −1)
        </li>
        <li>
          <strong>A∩C, A∩D, B∩C, B∩D</strong>: 4 cross-pairs each giving a
          node at z=±√((μ²−1)/2) ≈ ±0.469, with the other coordinates derived
          from the plane equations.
        </li>
      </ul>
      <p>
        For μ=1.2: all 12 are real and lie on the sphere of radius 1.2. The
        vertex colour in the blueprint uses Gaussian proximity to these positions
        to paint each node in warm amber, fading to violet across the surface.
      </p>

      <h2>Surface Nets extraction</h2>
      <p>
        Rather than Marching Cubes (which requires a 256-case lookup table and
        produces more triangles on smooth fields), the blueprint uses{" "}
        <strong>Surface Nets</strong> (Sarah Gibson, 1998). The algorithm is:
      </p>
      <ol>
        <li>
          Evaluate{" "}
          <code>f(x,y,z)</code> on an N³ regular grid (vectorised numpy — ~4 MB
          at N=90).
        </li>
        <li>
          Mark every grid cell that has at least one sign-change on a forward
          edge — these are the surface cells.
        </li>
        <li>
          Place one vertex per surface cell at the centroid of its ISO-crossing
          edge points (linear interpolation to f=0).
        </li>
        <li>
          For each sign-change edge, locate the 4 surrounding surface cells and
          emit a quad. Flip winding if the interior (f≥0) side is already the
          first cell.
        </li>
        <li>Triangulate, merge doubles, shade flat.</li>
      </ol>
      <p>
        At N=90 the node-cones are ~3 cells wide — enough to show their pointed
        character but not to resolve them perfectly. Increasing N to 120 sharpens
        the tips at roughly 2.4× the compute time.
      </p>

      <h2>K3 surfaces and their lattice</h2>
      <p>
        The smooth K3 surface obtained by resolving the 16 nodes carries a
        remarkable algebraic structure. Its second cohomology H²(K3; ℤ) is a
        free ℤ-module of rank 22, equipped with the intersection form — a
        unimodular even lattice of signature (3, 19). This is the{" "}
        <strong>K3 lattice</strong>, sometimes written Λ_{K3} or 3H ⊕ 2(−E₈).
      </p>
      <p>
        Every smooth K3 surface is diffeomorphic to every other (Kodaira, 1964),
        but they are not all isomorphic as complex surfaces — the moduli space of
        K3 surfaces is a 20-dimensional period domain. The Kummer surface occupies
        a specific 16-dimensional stratum (one dimension per node blown up),
        and moving away from it in the moduli space corresponds to "un-resolving"
        the nodes (smoothing the singularities by deformation).
      </p>
      <p>
        In string theory, compactifying on a K3 surface preserves half the
        supersymmetry. The Kummer surface is the simplest explicit K3, making
        it the most-studied model for heterotic string compactifications to six
        dimensions.
      </p>

      <h2>Running the blueprint</h2>
      <ol>
        <li>
          Open Blender 5.1. Scripting workspace → open{" "}
          <code>blueprint.py</code>.
        </li>
        <li>
          Run the script. Console should print{" "}
          <code>[kummer] done — … tris</code> in about 30–60 seconds at N=90.
        </li>
        <li>
          The poi head (<code>hf_kummer_poi.glb</code>) appears in the same
          directory. Load it into your WebXR scene via the holoflow exporter.
        </li>
        <li>
          To record the viewport animation: open the saved{" "}
          <code>hf_kummer_poi.blend</code>, then run <code>record.py</code>.
          A 4-second 360° orbit renders to{" "}
          <code>public/library/videos/…/viewport.mp4</code>.
        </li>
      </ol>

      <h2>Trade-offs and failure modes</h2>
      <ul>
        <li>
          <strong>N=90 vs N=120</strong>: at 90, node-tips are blunt cones.
          At 120, they sharpen noticeably but memory doubles and time triples.
          For a first pass, 90 gives the correct topology.
        </li>
        <li>
          <strong>μ near 1</strong>: as μ → 1⁺, the A∩B and C∩D nodes approach
          each other (y→0, x→0). The surface develops very thin necks that
          Surface Nets may bridge with stray quads. Increase N if this happens.
        </li>
        <li>
          <strong>λ sign</strong>: λ must be positive (μ &gt; 1/√3). If you
          set μ=0.5 the surface becomes an isolated sphere with no real nodes —
          mathematically fine, but visually uninteresting for this tutorial.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-barth-sextic-65-nodes-algebraic-surface-poi-head-webxr">
            Barth Sextic (65-node maximum for degree-6) — the same Surface Nets
            pipeline, applied to the icosahedral maximum-node record-holder.
          </Link>
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-marching-cubes-gyroid-sdf-isosurface-webxr">
            Gyroid TPMS — the Surface Nets algorithm explained from first
            principles, with the minimal-surface SDF as the test case.
          </Link>
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-sdf-csg-quilez-smooth-boolean-poi-head-webxr">
            SDF CSG — Quilez smooth-union and smooth-subtraction: complementary
            technique for implicit surfaces where algebraic degree is
            irrelevant.
          </Link>
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-600-cell-quaternion-binary-icosahedral-stereographic-shadow-webxr">
            600-Cell — the other famous "maximum" polytope: 600 tetrahedral
            cells, binary icosahedral symmetry, stereographically projected poi
            head.
          </Link>
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a className={lk} href="https://archive.org/details/kummersquarticsur00hudsrich" target="_blank" rel="noreferrer">
            Hudson, R.W.H.T. (1905). <em>Kummer&rsquo;s Quartic Surface</em>.
            Cambridge University Press.
          </a>{" "}
          — The original monograph, now public domain. §§ 1–3 derive the
          tetrahedral equation, enumerate the 16 nodes, and describe the
          16₆ configuration. Related: Nikulin (1979) lattice polarisations;
          Mukai (1984) symplectic automorphisms of K3 surfaces.
        </li>
        <li>
          <a className={lk} href="https://github.com/IMAGINARY/surfer-alggeo" target="_blank" rel="noreferrer">
            IMAGINARY / surfer-alggeo (Stephan Endraß, Apache-2.0)
          </a>{" "}
          — Interactive real-time algebraic-surface visualiser. Running the
          Kummer equation in Surfer validates the Surface Nets output from
          this blueprint. Related repos:{" "}
          <a className={lk} href="https://github.com/IMAGINARY/surfer2" target="_blank" rel="noreferrer">
            IMAGINARY/surfer2
          </a>
          ,{" "}
          <a className={lk} href="https://github.com/IMAGINARY/cindyjs" target="_blank" rel="noreferrer">
            IMAGINARY/cindyjs
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  ...data,
  slug: SLUG,
  tags: ["blender", "python", "numpy", "algebraic-surface", "k3", "poi", "webxr"],
  body: <Body />,
});

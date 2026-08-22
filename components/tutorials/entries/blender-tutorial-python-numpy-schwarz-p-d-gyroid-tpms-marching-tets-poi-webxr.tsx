import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-schwarz-p-d-gyroid-tpms-marching-tets-poi-webxr";

const TITLE =
  "Python numpy — Schwarz P, D & Gyroid: Triply-Periodic Minimal Surfaces via Marching Tetrahedra & Gauss-Map Vertex Colour for WebXR (Blender 5.1)";

const LEDE =
  "In 1867 Hermann Amandus Schwarz described two infinite minimal surfaces that tile all of space by translation — the Primitive and the Diamond.  In 1970 Alan Schoen, working at NASA, found a third: the Gyroid, chiral and without a single mirror plane, later discovered coating the wing scales of the green hairstreak butterfly.  This blueprint extracts all three as Blender 5.1 mesh objects using Marching Tetrahedra — a table-free algorithm that splits each voxel into six tetrahedra, reducing the topological case count from 256 to 16 — then colours each vertex by the z-component of the analytic unit normal, revealing the saddle-point geography that makes TPMS both structurally stiff and visually hypnotic.  Three 8.2 cm poi heads are exported as a single Draco-compressed GLB for WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-08",
  externalSources: [
    {
      label:
        "Schoen, Alan H. (1970). Infinite Periodic Minimal Surfaces Without Self-Intersections. NASA Technical Note D-5541. Public Domain (US Government work).",
      url: "https://ntrs.nasa.gov/citations/19700020472",
      licence: "Public Domain",
      author: "Alan H. Schoen",
    },
    {
      label:
        "Doi, Akio & Koide, Akio (1991). An Efficient Method of Triangulating Equi-Valued Surfaces by Using Tetrahedral Cells. IEICE Transactions on Information and Systems E74-D(1): 214–224. Algorithm is factual / Public Domain.",
      url: "https://search.ieice.org/bin/summary.php?id=e74-d_1_214",
      licence: "Public Domain (factual algorithm)",
      author: "Akio Doi & Akio Koide",
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
        A <em>minimal surface</em> satisfies H = (κ₁ + κ₂)/2 = 0 everywhere.
        A <em>triply-periodic</em> one tiles all of ℝ³ by three independent
        translations — it is a surface that never ends and never intersects
        itself.  The plane is the trivial example.  Everything else is exotic.
      </p>

      <h2>The three fundamental TPMS</h2>
      <p>
        Hermann Schwarz found the first two non-trivial TPMS in 1867 by
        constructing soap-film analogues of crystal lattices.  The{" "}
        <strong>Primitive (P)</strong> surface bridges cubic cell faces;
        its nodal approximation is simply{" "}
        <code>cos x + cos y + cos z = 0</code>, the first non-trivial Fourier
        mode consistent with cubic Pm-3m symmetry.  The{" "}
        <strong>Diamond (D)</strong> surface bridges the carbon-atom pairs in a
        diamond lattice; its four-term trigonometric polynomial reflects the
        Fd-3m space group.
      </p>
      <p>
        The <strong>Gyroid</strong> is Schoen's 1970 discovery.  Its implicit
        equation <code>sin x cos y + sin y cos z + sin z cos x = 0</code>{" "}
        looks deceptively simple, but the surface has no mirror planes and no
        inversion centre — it is chiral, existing in left- and right-handed
        enantiomers.  Schoen proved minimality by verifying the period conditions
        numerically; a rigorous proof was not given until Große-Brauckmann &
        Wohlgemuth (1996).  The Gyroid later appeared in butterfly wing scales
        (<em>Callophrys rubi</em>), block-copolymer self-assembly (the "gyroid
        phase"), and additive-manufacturing lattice scaffolds — everywhere
        engineers need maximum surface area for minimum material in a periodic
        volume.
      </p>

      <h2>Bonnet rotation: a one-parameter family</h2>
      <p>
        The three surfaces are not merely similar — they are isometric.  The{" "}
        <strong>Bonnet rotation</strong> θ ∈ [0°, 90°] continuously deforms P
        into D through G at θ ≈ 38.015°, preserving the intrinsic metric (every
        distance measured along the surface) while changing the extrinsic
        embedding in ℝ³.  This is possible because all three share the same
        Gauss map image — they tile S² in the same pattern — so the
        Weierstrass–Enneper representation differs only by a phase rotation
        e^{iθ} on the holomorphic 1-form.
      </p>
      <p>
        The Bonnet family connects P and D, but the intermediate surfaces are{" "}
        <em>not</em> embedded for general θ: they self-intersect.  The Gyroid
        is the unique intermediate surface that is still embedded, which is
        precisely why it took over 100 years to find.
      </p>

      <h2>Marching Tetrahedra vs Marching Cubes</h2>
      <p>
        Lorensen & Cline's 1987 Marching Cubes algorithm tessellates an
        isosurface through a grid of cubes.  Each cube has 8 vertices, each
        either inside or outside the surface, giving 2⁸ = 256 sign patterns.
        After symmetry reduction there are 15 distinct topological cases —
        and case 12, a saddle configuration, is <em>ambiguous</em>: two
        complementary triangulations are equally valid, and choosing the wrong
        one creates holes.
      </p>
      <p>
        Marching Tetrahedra (Doi & Koide 1991) avoids the ambiguity.  Split
        each cube into 6 tetrahedra sharing the body-diagonal edge.  A
        tetrahedron has 4 vertices → 2⁴ = 16 sign patterns, reducing to just{" "}
        <strong>3 topological outcomes</strong>:
      </p>
      <ul>
        <li>
          <strong>0 or 4 vertices inside</strong> — no surface crosses this tet.
        </li>
        <li>
          <strong>1 or 3 vertices inside</strong> — exactly 3 edges are cut;
          they form one triangle.
        </li>
        <li>
          <strong>2 vertices inside</strong> — exactly 4 edges are cut; they
          form a quadrilateral split into two triangles.
        </li>
      </ul>
      <p>
        No lookup table is required.  The cut point on each edge is found by
        linear interpolation: <code>t = (iso − fₐ)/(f_b − fₐ)</code>, then{" "}
        <code>p = vₐ + t·(v_b − vₐ)</code>.  The result is watertight, free
        of holes, and handles all surface topologies including the complex
        saddle geometry of TPMS.
      </p>

      <h2>Gaussian curvature on a minimal surface</h2>
      <p>
        On any minimal surface, κ₁ = −κ₂ (the principal curvatures are equal
        and opposite).  Therefore K = κ₁κ₂ = −κ₁² ≤ 0 everywhere — minimal
        surfaces are{" "}
        <em>everywhere saddle-shaped or flat</em>.  The Gauss-Bonnet theorem
        then constrains their topology: a closed minimal surface of genus g has{" "}
        <code>∫K dA = 4π(1 − g)</code>.  TPMS have topological genus → ∞ per
        period cell, which is why they can partition space without
        self-intersecting.
      </p>
      <p>
        This blueprint colours each vertex by the z-component of the unit
        normal n̂ = ∇F/|∇F| (computed analytically from the implicit
        equation F = 0).  Red → n_z {">"} 0 (normal points up); blue → n_z {"<"} 0
        (normal points down); green → horizontal saddle.  On the Gyroid the
        colours alternate in a quasi-crystalline rhythm — a direct visual
        consequence of the I4₁32 screw symmetry.
      </p>

      <h2>Blueprint walk-through</h2>
      <p>
        The script follows five stages.  First, it evaluates the chosen TPMS
        function on an N³ numpy array over [0, 2π]³.  Second, it uses numpy
        slicing to identify <em>active cells</em> — those whose eight corner
        values straddle the iso-level — avoiding a Python loop over the full
        grid.  Third, it runs the Python marching-tet loop only over active
        cells; each cell contributes at most 12 triangles.  Fourth, vertices are
        deduplicated via a Python dict keyed on rounded coordinates.  Fifth,{" "}
        <code>mesh.from_pydata()</code> builds the Blender mesh, and analytic
        normals colour each vertex.
      </p>
      <p>
        At N = 32 (default) the active-cell filter reduces the work by
        roughly 70 %, bringing the typical run time to 8–15 seconds on a
        modern CPU.  The three poi heads are offset along X and exported as a
        single GLB with Draco level 6 compression.
      </p>

      <h2>Failure modes and tuning</h2>
      <ul>
        <li>
          <strong>Empty mesh:</strong> if N is too small, active cells may all
          be missed.  Increase to N = 40 and re-run.
        </li>
        <li>
          <strong>Holes in the surface:</strong> the vertex-deduplication dict
          uses eight decimal places of rounding.  Very thin cells at high N
          can produce hash collisions.  Switch the key to{" "}
          <code>tuple(np.round(pt, 6))</code> if holes appear.
        </li>
        <li>
          <strong>Gyroid vs. iso ≠ 0:</strong> shifting the iso-level to
          ±0.4 thickens one channel of the two-channel structure, producing a
          "solid Gyroid" — useful for 3D-print lattice scaffolds.
        </li>
        <li>
          <strong>Scale:</strong> the script normalises by the bounding-box
          half-diagonal.  The Schwarz D surface is more elongated than P or
          G; its POI_RADIUS will be slightly compressed — expected behaviour.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-scherk-doubly-periodic-minimal-surface-saddle-tower-poi-webxr"
            className={lk}
          >
            Scherk Doubly-Periodic Minimal Surface
          </Link>{" "}
          — the 1835 predecessor: doubly- rather than triply-periodic; the
          implicit level-set approach is the same family of ideas.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-costa-minimal-surface-weierstrass-enneper-elliptic-three-ends-poi-webxr"
            className={lk}
          >
            Costa Minimal Surface
          </Link>{" "}
          — genus-1 embedded surface; contrast with TPMS genus → ∞ per period.
          The Weierstrass–Enneper representation used there is dual to the
          Bonnet rotation family here.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-sdf-csg-quilez-smooth-boolean-poi-head-webxr"
            className={lk}
          >
            SDF CSG with Quilez Smooth Booleans
          </Link>{" "}
          — another implicit-function workflow; signed-distance fields can
          approximate TPMS at the cost of losing the exact H=0 property.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-scipy-weaire-phelan-a15-voronoi-kelvin-foam-poi-webxr"
            className={lk}
          >
            Weaire–Phelan Foam
          </Link>{" "}
          — the optimal space-partition is the dual view of the Schwarz P
          surface: where TPMS separates two interpenetrating labyrinths, the
          Weaire–Phelan cell fills one labyrinth with polyhedra.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ol>
        <li>
          <strong>
            <a
              href="https://ntrs.nasa.gov/citations/19700020472"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Schoen, Alan H. (1970). Infinite Periodic Minimal Surfaces Without
              Self-Intersections. NASA TN D-5541. Public Domain.
            </a>
          </strong>{" "}
          — the original Gyroid paper.  Schoen catalogued 17 TPMS; the Gyroid
          (surface no. 3) was the only chiral one.  Related: NASA Technical
          Reports Server{" "}
          <a
            href="https://ntrs.nasa.gov/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            ntrs.nasa.gov
          </a>
          .
        </li>
        <li>
          <strong>
            <a
              href="https://search.ieice.org/bin/summary.php?id=e74-d_1_214"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Doi & Koide (1991). Marching Tetrahedra. IEICE E74-D(1):214–224.
              Factual algorithm, Public Domain.
            </a>
          </strong>{" "}
          — the source algorithm this blueprint implements.  The production
          alternative is scikit-image's{" "}
          <a
            href="https://scikit-image.org/docs/stable/api/skimage.measure.html#skimage.measure.marching_cubes"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            <code>marching_cubes</code>
          </a>{" "}
          (BSD-3-Clause,{" "}
          <a
            href="https://github.com/scikit-image/scikit-image"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/scikit-image
          </a>
          ).
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
          — vectorised field evaluation and the sparse active-cell filter.
          Related:{" "}
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

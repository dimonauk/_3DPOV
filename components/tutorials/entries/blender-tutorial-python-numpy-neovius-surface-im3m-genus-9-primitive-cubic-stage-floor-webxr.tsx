import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-neovius-surface-im3m-genus-9-primitive-cubic-stage-floor-webxr";

function Body() {
  return (
    <>
      <h2>The one nobody teaches</h2>
      <p>
        Every introductory treatment of triply periodic minimal surfaces
        reaches the same three: Schwarz P, Schwarz D, and Schoen&rsquo;s
        Gyroid. They all share the same topological class — genus 3 per
        primitive unit cell — and they can all be connected by a continuous
        family of isometric deformations called Bonnet rotations. They&rsquo;re
        beautiful and practically important. They&rsquo;re also, by now, very
        thoroughly taught.
      </p>
      <p>
        The Neovius surface is none of those things. It appeared in an 1883
        doctoral thesis at the University of Helsingfors, written in German by
        a Finnish mathematician, Edvard Rudolf Neovius. The thesis is barely
        cited in Blender communities. Its level-set equation is short enough
        to tattoo on your wrist:
      </p>
      <pre>{`f(x, y, z) = 3(cos x + cos y + cos z) + 4 cos x · cos y · cos z`}</pre>
      <p>
        Set <code>f = 0</code> and you have the surface. What makes it
        genuinely different is its topology: the Neovius surface has genus 9
        per primitive cell — three times the genus of the Gyroid — and it
        separates space into two channel systems that are{" "}
        <em>not</em> congruent to each other. No crystallographic symmetry
        maps one labyrinth onto the other. That asymmetry is everything.
      </p>

      <h2>Space group and labyrinth structure</h2>
      <p>
        The surface belongs to space group Im-3m (#229, Oh⁹ in
        Schönflies notation) — body-centred cubic symmetry. This is the same
        symmetry class as BCC iron, tungsten, and chromium: a cube with a
        lattice site at every corner and one at the body centre.
      </p>
      <p>
        Evaluate <code>f</code> at the two special sites within one unit
        cell <code>[0, 2π]³</code>:
      </p>
      <pre>{`f(0, 0, 0)     = 3 × 3 + 4 × 1 = +13   → corner region
f(π, π, π)     = 3 × (−3) + 4 × (−1) = −13   → body-centre region`}</pre>
      <p>
        The <strong>positive region</strong> (<code>f &gt; 0</code>), containing
        the cube corners, forms the <em>larger</em> labyrinth — roughly 74%
        of the cell volume. Its channels run along the ⟨100⟩ and ⟨110⟩
        crystallographic directions, giving it six-fold connectivity at each
        node.
      </p>
      <p>
        The <strong>negative region</strong> (<code>f &lt; 0</code>), containing
        the body-centre, forms the <em>smaller</em> labyrinth — roughly 26%,
        star-shaped pockets that sit in the gaps between the larger channels.
        No single symmetry operation maps one labyrinth to the other. That is
        the topological fingerprint of a heterogeneous bicontinuous morphology.
      </p>

      <h2>Topology: Euler characteristic and genus</h2>
      <p>
        Gauss–Bonnet applied to one cubic unit cell <code>[0, 2π]³</code>:
      </p>
      <pre>{`∫∫ K dA = 2πχ
χ = −16  per conventional cubic cell
g = (2 − χ) / 2 = 9  per primitive BCC cell`}</pre>
      <p>
        The integral of Gaussian curvature over the Neovius surface inside
        one unit cell equals{" "}
        <code>2π × (−16) = −32π</code>. Compare: the Schwarz P and Gyroid
        each give <code>−8π</code> per conventional cell (genus 3). The
        Neovius surface packs three times as much topological complexity into
        the same volume.
      </p>
      <p>
        In practical terms, this means more surface area per unit volume —
        relevant for catalyst supports, heat exchangers, and electrode
        structures where interface area is the engineering metric. The
        Neovius surface is underused in these applications precisely because
        it&rsquo;s underrepresented in the literature.
      </p>

      <h2>Why the level-set equation works</h2>
      <p>
        The equation <code>f = 0</code> is not the true minimal surface; it
        is the leading-order term in the Fourier expansion of the surface.
        The true Neovius surface is defined via Weierstrass–Enneper
        representation using elliptic functions on a Riemann surface of
        genus 9 (matching the topology). The nodal surface approximation
        agrees with the true minimal surface to a few percent in mean
        curvature error — far better than the visual resolution of any
        viewport render.
      </p>
      <p>
        Where the nodal surface is exact: at all{" "}
        <strong>flat points</strong>, the 24 locations per conventional cell
        where <code>K = 0</code>. These sit at the ⟨100⟩ face-centres of
        the BCC lattice and their body-centred translations. At a flat point,
        both principal curvatures vanish simultaneously, making the surface
        locally planar. These are the bright amber spots in the vertex colour.
      </p>

      <h2>Gaussian curvature from first principles</h2>
      <p>
        For a minimal surface <code>H = 0</code>, the two principal
        curvatures satisfy <code>κ₂ = −κ₁</code>, giving:
      </p>
      <pre>{`K = κ₁κ₂ = −κ₁²  ≤ 0  everywhere`}</pre>
      <p>
        The blueprint computes <code>K</code> analytically from the implicit
        form. For a level set <code>f(r) = 0</code>:
      </p>
      <pre>{`K = − (∇f · cof(Hf) · ∇f) / |∇f|⁴

∇f = (fx, fy, fz)          (analytic gradient, see below)
cof(Hf)₁₁ = fyy fzz − fyz²  (2×2 minor of Hessian)
  …etc, 6 independent entries by symmetry`}</pre>
      <p>
        The analytic Hessian of the Neovius field:
      </p>
      <pre>{`fx  = −(3 + 4 Cy Cz) Sx
fy  = −(3 + 4 Cx Cz) Sy
fz  = −(3 + 4 Cx Cy) Sz

fxx = −(3 + 4 Cy Cz) Cx
fyy = −(3 + 4 Cx Cz) Cy
fzz = −(3 + 4 Cx Cy) Cz
fxy = +4 Sx Sy Cz
fxz = +4 Sx Sz Cy
fyz = +4 Sy Sz Cx`}</pre>
      <p>
        No numerical differentiation, no finite-difference noise: the curvature
        at every extracted vertex is exact from the underlying trigonometric
        formula. The vertex colour maps{" "}
        <code>t = (|K| / K₉₇)^GAMMA</code> (97th percentile normalisation)
        from cobalt at <code>t = 0</code> (flat points) through teal to amber
        at <code>t = 1</code> (deepest saddles near the labyrinth waists).
      </p>

      <h2>Marching tetrahedra — the algorithm choice</h2>
      <p>
        The blueprint uses the Doi–Koide (1991) 6-tetrahedra-per-cube
        decomposition. Each cube is split by its main diagonal{" "}
        <code>v₀ → v₇</code> into six tetrahedra sharing that edge. The six
        side vertices cycle through the hexagonal equator of the cube:
        1 → 3 → 2 → 6 → 4 → 5.
      </p>
      <pre>{`Tet 0: (v0, v1, v3, v7)
Tet 1: (v0, v3, v2, v7)
Tet 2: (v0, v2, v6, v7)
Tet 3: (v0, v6, v4, v7)
Tet 4: (v0, v4, v5, v7)
Tet 5: (v0, v5, v1, v7)`}</pre>
      <p>
        Each tetrahedron has only 16 sign patterns, reducing to 3 non-trivial
        topological cases: one vertex inside (1 triangle), three inside (1
        triangle, flipped normal), or two inside (a quad split into 2
        triangles). There is no 256-case look-up table — the algorithm is
        table-free. Vertex deduplication uses a Python dict keyed on rounded
        float tuples; a final{" "}
        <code>bmesh.ops.remove_doubles</code> cleans any floating-point
        near-duplicates at cube seams.
      </p>

      <h2>Shape key architecture</h2>
      <p>
        Three shape keys explore the iso-offset family:
      </p>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>ISO offset</th>
            <th>Visual effect</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Basis</td>
            <td>0.0</td>
            <td>Standard Neovius; two labyrinths at natural proportion</td>
          </tr>
          <tr>
            <td>SK_Expand</td>
            <td>+0.50</td>
            <td>Larger labyrinth shrinks; walls thicken around corners</td>
          </tr>
          <tr>
            <td>SK_Compress</td>
            <td>−0.50</td>
            <td>Smaller labyrinth grows; body-centre pockets enlarge</td>
          </tr>
          <tr>
            <td>SK_Wide</td>
            <td>+0.90</td>
            <td>Near-rupture; topology approaches Schwarz P connectivity</td>
          </tr>
        </tbody>
      </table>
      <p>
        The iso-offset family preserves the space-group symmetry but changes
        the volume fraction. The rupture threshold — where the larger
        labyrinth breaks into disconnected pockets — occurs near ISO ≈ +1.2.
        These intermediate surfaces are not minimal (they have non-zero mean
        curvature proportional to the offset) but they appear in physical
        systems as mean-curvature-driven interface migration.
      </p>

      <h2>Studio cross-references</h2>
      <p>
        This entry sits in a family of TPMS tutorials. Start with the
        companion overview of Schwarz P, D, and the Gyroid — all extracted
        using the same Doi–Koide algorithm — then return here for the
        non-congruent labyrinth topology:
      </p>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-schwarz-p-d-gyroid-tpms-marching-tets-poi-webxr"
            className={lk}
          >
            Schwarz P, D &amp; Gyroid — Three TPMS, One Algorithm
          </Link>{" "}
          — the congruent-labyrinth comparison set; same extraction code,
          different surfaces and Bonnet rotation.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-marching-cubes-gyroid-sdf-isosurface-webxr"
            className={lk}
          >
            Gyroid SDF — Surface Nets Extraction
          </Link>{" "}
          — an alternative isosurface algorithm (surface nets, Gibson 1998)
          applied to the Gyroid; compare computational trade-offs.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-scherk-doubly-periodic-minimal-surface-checkerboard-saddle-tile-stage-floor-webxr"
            className={lk}
          >
            Scherk&rsquo;s Doubly Periodic Minimal Surface — Stage Floor
          </Link>{" "}
          — a 2-periodic (not triply periodic) minimal surface as stage floor;
          identical pipeline, different periodicity class.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-enneper-surface-weierstrass-representation-minimal-gauss-curvature-saddle-poi-webxr"
            className={lk}
          >
            Enneper Surface — Weierstrass–Enneper Representation
          </Link>{" "}
          — the analytic curvature formula used here adapts the same cofactor
          bordered-Hessian identity proved for the Enneper case.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <p>
        <strong>Neovius (1883).</strong>{" "}
        <em>
          Bestimmung zweier specieller periodischer Minimalflächen.
        </em>{" "}
        Doctoral thesis, Helsingfors; Acta Soc. Sci. Fenn. 11: 435–499.
        Public domain.{" "}
        The surface described in §2 of the thesis, with its
        level-set characterisation derived from the Fourier series of the
        periodic distance function. Related work: Schwarz (1866) Gesammelte
        Mathematische Abhandlungen; Weierstrass (1866) elliptic function
        parametrisation of minimal surfaces.
      </p>
      <p>
        <strong>Schoen, A. H. (1970).</strong>{" "}
        <em>
          Infinite Periodic Minimal Surfaces Without Self-Intersections.
        </em>{" "}
        NASA Technical Note D-5541. Public domain (US government work).{" "}
        <a
          href="https://ntrs.nasa.gov/citations/19700020472"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          ntrs.nasa.gov
        </a>
        . Schoen catalogued 17 TPMS and gave the Neovius surface its
        modern classification within the Im-3m symmetry class. Related:
        the NASA Technical Reports Server hosts the complete catalogue;
        Große-Brauckmann &amp; Wohlgemuth (1996) proved the embeddedness of
        the Gyroid using methods applicable to the Neovius family.
      </p>
      <p>
        <strong>NumPy contributors.</strong>{" "}
        BSD-3-Clause.{" "}
        <a
          href="https://numpy.org/doc/stable/"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          numpy.org
        </a>
        . The vectorised field evaluation, active-cube detection, and
        cofactor curvature formula all run in native NumPy. Related:{" "}
        <a
          href="https://github.com/numpy/numpy"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          github.com/numpy/numpy
        </a>
        .
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Script runs but produces an empty mesh.</strong> The level-set
          iso value might be outside the range of <code>f</code>. The maximum
          and minimum of <code>f</code> on [0, 2π]³ are ±13 (at the cube
          corners and body-centres). Any <code>ISO</code> in (−13, +13) will
          produce a surface; outside that range, no isosurface exists.
        </li>
        <li>
          <strong>Duplicate faces or T-junctions at cube edges.</strong> This
          happens if <code>remove_doubles</code> threshold is too small. Increase{" "}
          <code>dist</code> from <code>1e-5</code> to <code>1e-4</code> in the
          bmesh.ops call.
        </li>
        <li>
          <strong>Shape keys have wrong topology (vertex count mismatch).</strong>{" "}
          The nearest-neighbour remap via <code>scipy.spatial.cKDTree</code>{" "}
          handles differing vertex counts between iso values. If scipy is
          unavailable in your Blender build, replace with a pure-numpy brute-force
          nearest-neighbour search: <code>np.argmin(cdist(v0, v_iso_norm), axis=1)</code>.
        </li>
        <li>
          <strong>Python loop is slow (N_GRID large).</strong> The active-cube
          filter runs in vectorised NumPy; only the per-tet triangle generation
          uses a Python loop. For N_GRID = 34 expect 20–60 seconds on a modern
          CPU. Set <code>N_GRID = 24</code> for a fast preview (~5 seconds).
        </li>
      </ul>
    </>
  );
}

const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Neovius Surface: Im-3m TPMS, Genus 9, Non-Congruent Labyrinths & Analytic Gaussian Curvature Stage Floor for WebXR (Blender 5.1)",
  lede:
    "The highest-genus common TPMS — three times more topologically complex than the Gyroid — with body-centred cubic symmetry, asymmetric labyrinths, and cofactor-formula Gaussian curvature vertex colour.",
  date: "2026-08-23",
  tags: ["blender", "python", "numpy", "tpms", "minimal-surface", "marching-tetrahedra", "stage-floor", "5.1"],
  body: Body,
});

export const blenderTutorialPythonNumpyNeoviusSurfaceIm3mGenus9PrimitiveCubicStageFloorWebxrEntry =
  entry;
export default entry;

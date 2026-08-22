import Link from "next/link";
import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-schoen-gyroid-tpms-chiral-ia3d-zero-mean-curvature-poi-head-webxr";

function Body() {
  return (
    <>
      <p>
        Alan Schoen was an applied mathematician at NASA in 1970 when he
        catalogued a family of infinite periodic minimal surfaces and found one
        that nobody had noticed before: a surface threaded by two interlocked
        but never-touching labyrinthine channels, one left-handed and one
        right-handed, with zero mean curvature at every point.  He called it
        the <em>gyroid</em>.  It is the only member of the associate family of
        Schwarz-P and D surfaces that carries no straight lines and no mirror
        planes — a property that makes it intrinsically chiral and therefore
        the simplest known chiral minimal surface.
      </p>
      <p>
        Fifty years on, the gyroid turns up everywhere materials need to pack
        the maximum interface into the minimum volume: butterfly wing scales
        (the iridescent blue of <em>Parides sesostris</em> arises from a
        biological gyroid grown in the wing-scale cuticle), block-copolymer
        self-assembly, mitochondrial cristae, silica sponge spicules, and — of
        most relevance to this studio — lightweight 3D-printed lattices where
        the double-network topology distributes stress symmetrically.
      </p>

      <h2>The nodal approximation</h2>
      <p>
        The exact gyroid surface satisfies a complex set of coupled ODEs that
        Schoen solved numerically.  The <em>nodal approximation</em> —
        introduced by von Schnering &amp; Nesper (1991) — replaces the exact
        equation with its dominant Fourier harmonic:
      </p>
      <pre className="bg-zinc-900 text-zinc-100 rounded p-3 text-sm overflow-x-auto">
        f(x,y,z) = sin x · cos y + sin y · cos z + sin z · cos x = 0
      </pre>
      <p>
        This is a single-term approximation, yet it is within 1 % of the exact
        mean curvature [Lord &amp; Mackay 2003].  The function{" "}
        <span className="font-mono text-sm">f</span> has the full crystallographic
        symmetry of space group Ia-3d (#230) — cubic, body-centred — but{" "}
        <em>no</em> mirror planes: the only symmetry operations are rotations and
        screw axes.
      </p>

      <h2>Marching tetrahedra</h2>
      <p>
        The blueprint evaluates{" "}
        <span className="font-mono text-sm">f</span> on a 60³ grid over{" "}
        [−2π, 2π]³ (two full unit cells per axis).  Each cube is subdivided
        into six tetrahedra that share the body diagonal v₀→v₆.  Any
        tetrahedron with a sign change across an edge gets interpolated vertices
        at the crossing point.  An active-cell filter — built with numpy{" "}
        <span className="font-mono text-sm">argwhere</span> on per-corner{" "}
        min/max — restricts the per-Python-loop work to only those cubes where
        the surface actually passes through, keeping total execution time under
        90 seconds on a mid-range CPU.
      </p>
      <p>
        The winding of triangles from the n=1 and n=3 inside-vertex cases is
        handled by the same sign convention used in the studio's Barth sextic
        and Mandelbulb blueprints.  Duplicate vertices are collapsed via a
        rounded-coordinate hash map, keeping the mesh clean for flat shading.
      </p>

      <h2>Offset-surface shape keys</h2>
      <p>
        The gyroid belongs to a continuous one-parameter family of level sets of{" "}
        <span className="font-mono text-sm">f</span>: the surface{" "}
        <span className="font-mono text-sm">f = c</span> for{" "}
        <span className="font-mono text-sm">c ≠ 0</span> is no longer minimal
        but still divides space into two connected channel networks.  As{" "}
        <span className="font-mono text-sm">c</span> increases from 0, one
        network narrows (approaching closure at the{" "}
        <span className="font-mono text-sm">|c| ≈ 1.5</span> nodal maximum)
        while the other widens.  Setting{" "}
        <span className="font-mono text-sm">c = −c</span> swaps their roles.
      </p>
      <p>
        The blueprint encodes this sweep as two shape keys.  Rather than
        re-marching at a different threshold (which would produce a different
        vertex count and break shape key compatibility), each vertex is shifted
        along the gradient direction by the first-order approximation:
      </p>
      <pre className="bg-zinc-900 text-zinc-100 rounded p-3 text-sm overflow-x-auto">
        δv ≈ Δc · ∇f / |∇f|²
      </pre>
      <p>
        This is the gradient-flow offset: moving distance{" "}
        <span className="font-mono text-sm">Δc / |∇f|</span> along the unit
        normal raises{" "}
        <span className="font-mono text-sm">f</span> by{" "}
        <span className="font-mono text-sm">Δc</span> to first order.{" "}
        <span className="font-mono text-sm">SK_LevelP4</span> uses Δc = +0.4
        and <span className="font-mono text-sm">SK_LevelN4</span> uses Δc = −0.4.
        Scrubbing between them in the WebXR viewer lets you feel how the two
        channel systems respond to one another.
      </p>

      <h2>Vertex colour: chiral twist via n_z</h2>
      <p>
        The surface normal at each vertex is the normalised gradient{" "}
        <span className="font-mono text-sm">n = ∇f / |∇f|</span>.  The
        z-component{" "}
        <span className="font-mono text-sm">
          n_z = (−sin y sin z + cos z cos x) / |∇f|
        </span>{" "}
        varies between −1 and +1 and encodes whether the local surface patch
        faces upward or downward.  Mapping cobalt (n_z = −1) to amber
        (n_z = +1) makes the gyroid's helical winding pattern immediately
        visible: the two channel networks appear as interleaved spirals of warm
        and cool colour, unambiguously demonstrating the chirality even in a
        static image.
      </p>

      <h2>Studio conventions</h2>
      <p>
        The mesh is scaled to a POI_RADIUS = 0.082 m bounding sphere and
        exported flat-shaded (
        <span className="font-mono text-sm">holoflow:facet = True</span>), so
        the crystallographic facets are crisp in the XR viewer.  The GLB uses
        Draco level 6 compression and WebP textures with +Y up, consistent with
        all other Holoflow Studio library entries.
      </p>

      <h2>Cross-references</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-enneper-surface-weierstrass-representation-minimal-gauss-curvature-saddle-poi-webxr"
            className={lk}>
            Enneper surface — Weierstrass-Enneper parametrisation, another H=0 surface
          </Link>
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-differential-growth-laplacian-smooth-ruffle-poi-webxr"
            className={lk}>
            Differential growth — Laplacian smoothing and Föppl-von Kármán ruffling
          </Link>
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-mean-curvature-flow-huisken-cotangent-laplacian-sphere-smoothing-poi-webxr"
            className={lk}>
            Mean-curvature flow — cotangent Laplacian, H·n PDE, Huisken 1984
          </Link>
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ol className="list-decimal pl-5 space-y-2">
        <li>
          <a className={lk}
            href="https://ntrs.nasa.gov/citations/19700020490"
            target="_blank" rel="noopener noreferrer">
            Schoen AH (1970). <em>Infinite Periodic Minimal Surfaces Without
            Self-Intersections</em>. NASA Technical Note D-5541.
          </a>{" "}
          US government work — public domain.  Upstream repository: the NASA
          Technical Reports Server at ntrs.nasa.gov, which also hosts related
          reports on soap-film analogues and crystallographic minimal surfaces.
        </li>
        <li>
          <a className={lk}
            href="https://www.currentscience.ac.in/Volumes/85/03/0346.pdf"
            target="_blank" rel="noopener noreferrer">
            Lord EA &amp; Mackay AL (2003). Periodic minimal surfaces of cubic
            symmetry. <em>Current Science</em> 85(3): 346–362.
          </a>{" "}
          Open-access journal.  Related work: Mackay's earlier crystallographic
          surfaces (Mackay 1985, Physica B) and Hyde &amp; Andersson (1984,
          Z. Kristallogr.) on bicontinuous cubic phases.
        </li>
        <li>
          NumPy (BSD-3-Clause).{" "}
          <a className={lk}
            href="https://numpy.org/"
            target="_blank" rel="noopener noreferrer">
            numpy.org
          </a>
        </li>
      </ol>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Schoen Gyroid TPMS: Nodal Approximation sin(x)cos(y)+sin(y)cos(z)+sin(z)cos(x)=0, " +
    "Space Group Ia-3d, Genus-3 Dual-Channel Network, Offset-Surface Shape Keys SK_LevelP4/SK_LevelN4, " +
    "Cobalt–Amber n_z Chiral Colour & Intrinsically Chiral Poi Head for WebXR (Blender 5.1)",
  description:
    "Marching-tetrahedra isosurface of the Schoen gyroid nodal approximation " +
    "over [−2π, 2π]³. Space group Ia-3d, genus 3, H=0. Shape keys sweep the " +
    "offset-surface family; vertex colour maps n_z to reveal chiral winding.",
  tags: [
    "blender-5-1",
    "python",
    "numpy",
    "gyroid",
    "tpms",
    "triply-periodic-minimal-surface",
    "minimal-surface",
    "marching-tetrahedra",
    "implicit-function",
    "shape-keys",
    "vertex-colour",
    "chiral",
    "poi-head",
    "webxr",
    "glb",
    "ia-3d",
  ],
  date: "2026-08-22",
  blenderVersion: "5.1",
  libraryPath:
    "public/library/blends/scripting/python-numpy-schoen-gyroid-tpms-chiral-ia3d-zero-mean-curvature-poi-head-webxr",
  Body,
});

import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-scipy-weaire-phelan-a15-kelvin-conjecture-foam-bubble-cage-poi-webxr";

function Body() {
  return (
    <>
      <h2>A 107-year-old problem</h2>
      <p>
        In 1887, Lord Kelvin posed what sounds deceptively simple: partition
        three-dimensional space into equal-volume cells with the minimum total
        interfacial area. The motive was soap foam physics — real bubbles
        achieve exactly this minimum as surface tension pulls every film toward
        least area. His own answer was the bitruncated cubic honeycomb: a
        tiling of truncated octahedra, each with 14 faces (8 hexagonal, 6
        square), filling space with no gaps and touching in flat soap films.
      </p>
      <p>
        That answer stood for 107 years. In 1994, Denis Weaire and Robert
        Phelan at Trinity College Dublin found a two-cell periodic structure
        that beats it by approximately 0.3 % in surface area per unit volume.
        Not a large margin, but it is enough to disprove Kelvin&rsquo;s
        conjecture definitively. No structure has bettered it since — and no
        one has proved it optimal either.
      </p>
      <p>
        The structure has since been used for the façade of the Beijing National
        Aquatics Centre (the &ldquo;Water Cube&rdquo;, 2008 Olympic Games) — 22,000 steel
        members and 4,000 ETFE cushions tiled along a cross-section of the
        Weaire-Phelan foam.
      </p>

      <h2>The A15 crystal lattice</h2>
      <p>
        Weaire and Phelan did not invent their structure from scratch. They
        borrowed it from crystallography: the A15 crystal phase, a well-known
        binary alloy structure whose prototype is Cr₃Si (chromium silicide).
        It belongs to space group <strong>Pm-3n (#223)</strong>, a cubic group
        with full octahedral symmetry.
      </p>
      <p>
        The unit cell contains 8 atoms at two distinct Wyckoff sites:
      </p>
      <pre>{`Wyckoff 2a  (type A, Si sites):  (0, 0, 0)  and  (½, ½, ½)
Wyckoff 6c  (type B, Cr sites):  cyclic permutations of (0, ¼, ½)
             → (0, ¼, ½)  (0, ¾, ½)
               (½, 0, ¼)  (½, 0, ¾)
               (¼, ½, 0)  (¾, ½, 0)`}</pre>
      <p>
        The type-B atoms form three orthogonal pairs of chains along the
        three Cartesian directions — the characteristic motif of the A15
        phase. Take the Voronoi tessellation of these 8 seeds (with periodic
        boundary conditions) and you get exactly the Weaire-Phelan foam:
      </p>
      <ul>
        <li>
          <strong>Type-A cells</strong> (2 per unit cell, around the 2a
          sites): <em>pentagonal dodecahedra</em> — 12 pentagonal faces,
          30 edges, 20 vertices.
        </li>
        <li>
          <strong>Type-B cells</strong> (6 per unit cell, around the 6c
          sites): <em>tetrakaidecahedra</em> — 12 pentagonal + 2 hexagonal
          faces = 14 faces total, 36 edges, 24 vertices.
        </li>
      </ul>
      <p>
        All 8 cells have equal volume (each is 1/8 of the unit cell). The
        ratio 2:6 = 1:3 means for every dodecahedron there are three
        tetrakaidecahedra. The hexagonal faces of adjacent type-B cells
        meet each other; all other adjacencies involve pentagonal faces.
      </p>

      <h2>Why the Voronoi of a crystal works</h2>
      <p>
        The Voronoi cell of a point in a set of points is the region of
        space closer to that point than to any other. When the points are
        the atoms of a crystal, the Voronoi cells are the Wigner-Seitz cells
        of the crystal structure (covered in the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-scipy-wigner-seitz-bcc-fcc-brillouin-zone-3d-voronoi-poi-head-webxr"
        >
          Wigner-Seitz / Brillouin Zone tutorial
        </Link>
        ).
      </p>
      <p>
        For a simple lattice like BCC (body-centred cubic), all seeds are
        equivalent by symmetry, so all Voronoi cells are identical — the
        truncated octahedron of Kelvin&rsquo;s conjecture. The A15 lattice breaks
        that symmetry: its 2a and 6c sites are inequivalent, so the Voronoi
        cells differ. The key insight of Weaire and Phelan was that <em>
        precisely this symmetry-breaking can reduce the total surface area
        </em>, even though the cells are no longer all the same shape.
      </p>

      <h2>Periodic boundary conditions in SciPy</h2>
      <p>
        <code>scipy.spatial.Voronoi</code> operates on a finite point set in
        ℝ³ without periodic boundaries. Cells near the boundary of the seed
        set are unbounded (flagged with <code>-1</code> in{" "}
        <code>vor.ridge_vertices</code>). The standard fix — used in the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-scipy-wigner-seitz-bcc-fcc-brillouin-zone-3d-voronoi-poi-head-webxr"
        >
          Wigner-Seitz tutorial
        </Link>{" "}
        — is to tile the seed set into a supercell large enough that the
        central seeds&rsquo; Voronoi vertices lie comfortably inside the supercell:
      </p>
      <pre>{`# 3×3×3 supercell: 27 tiles × 8 seeds = 216 seeds total
offsets = np.array([[dx, dy, dz]
                    for dx in (-1, 0, 1)
                    for dy in (-1, 0, 1)
                    for dz in (-1, 0, 1)]) * L
all_pts = np.vstack([SEEDS + o for o in offsets])
vor = Voronoi(all_pts)

# Central tile is supercell index 13 (0,0,0 offset in lex order)
central_start = 13 * 8
cidx = list(range(central_start, central_start + 8))`}</pre>
      <p>
        The 3-layer shell of periodic images is more than sufficient: the
        Voronoi radius of any cell in the A15 structure is less than 0.6 L,
        well within the 1 L buffer provided by the supercell padding.
      </p>

      <h2>Extracting Voronoi polyhedra</h2>
      <p>
        <code>scipy.spatial.Voronoi</code> stores the vertices of each
        Voronoi cell in <code>vor.regions[vor.point_region[i]]</code> as an
        unordered list of vertex indices. Recovering the faces (and their
        correct vertex order) from this list is non-trivial in general.
        There is a clean shortcut available for Voronoi cells:
      </p>
      <p>
        <strong>Voronoi cells are always convex.</strong> Therefore the convex
        hull of their vertex set is exactly the polyhedron we want.
        <code>scipy.spatial.ConvexHull</code> returns the hull&rsquo;s triangulated
        faces via <code>hull.simplices</code>, each a triple of vertex
        indices into the local vertex array.
      </p>
      <pre>{`def cell_triangles(vor, seed_idx):
    region = vor.regions[vor.point_region[seed_idx]]
    if -1 in region or len(region) < 4:
        return []                          # unbounded — should not occur
    pts  = vor.vertices[np.array(region)] # (m, 3) convex vertex set
    hull = ConvexHull(pts)
    return [pts[s] for s in hull.simplices]  # list of (3,3) triangles`}</pre>
      <p>
        Each call to <code>cell_triangles</code> returns a list of triangles
        (numpy arrays of shape (3, 3)) forming the triangulated surface of one
        Voronoi cell. For a pentagonal dodecahedron with 20 vertices and 12
        faces, the convex hull has 20 triangular simplices (12 pentagons ×
        3 triangles per pentagon divided appropriately by the Euler relation).
        For a tetrakaidecahedron (24 vertices, 14 faces), expect ~24 simplices.
      </p>

      <h2>BMesh construction and material assignment</h2>
      <p>
        Each triangle from <code>cell_triangles</code> becomes a BMesh face.
        The material index (0 = amber, 1 = cobalt) is set per face to encode
        the cell type:
      </p>
      <pre>{`for i, seed_idx in enumerate(cidx):
    mat_i = TYPES[i]          # 0 for type-A, 1 for type-B
    for tri in cell_triangles(vor, seed_idx):
        bverts = [bm.verts.new(tuple(v)) for v in tri]
        face   = bm.faces.new(bverts)
        face.material_index = mat_i

bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)`}</pre>
      <p>
        <code>remove_doubles</code> merges coincident vertices (Voronoi
        vertices are shared by three adjacent cells — each appears three
        times in the raw build). <code>recalc_face_normals</code> ensures
        outward-facing normals for the EEVEE-NEXT render.
      </p>
      <p>
        The <code>FLOAT_COLOR POINT</code> attribute <code>WP_Colour</code> is
        added after scaling by averaging the material colours of adjacent faces
        per vertex. Vertices shared between type-A and type-B cells get a
        blend; this creates a smooth colour transition at cell boundaries that
        reads beautifully in WebXR.
      </p>

      <h2>Scale, shape keys and wireframe cage</h2>
      <p>
        After BMesh construction, the foam is centred at the origin and
        uniformly scaled so its bounding sphere radius equals{" "}
        <code>POI_R = 0.082 m</code>. Two shape keys animate the foam:
      </p>
      <pre>{`# SK_Tight: each vertex nudged 12 mm toward origin
# SK_Expanded: each vertex nudged 12 mm away from origin
dirs = vco / np.linalg.norm(vco, axis=1, keepdims=True)
sk_tight.data[i].co    = tuple(co - dirs[i] * 0.012)
sk_expanded.data[i].co = tuple(co + dirs[i] * 0.012)`}</pre>
      <p>
        The Wireframe modifier (<code>thickness = 1.3 mm</code>,{" "}
        <code>use_replace = False</code>) overlays the cell-edge cage on top
        of the solid faces. In EEVEE-NEXT with a dark background this creates
        the signature luminous-wire poi-head aesthetic, with the amber and
        cobalt face regions visible behind the bone-white cage lines.
      </p>
      <p>
        This technique is shared with the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-goldberg-polyhedra-gp11-c60-truncated-icosahedron-hexagonal-cage-poi-webxr"
        >
          Goldberg GP(1,1) buckminsterfullerene cage tutorial
        </Link>
        , where the same Wireframe + two-material pattern reveals the
        hexagonal/pentagonal face distinction.
      </p>

      <h2>Comparison: Kelvin vs Weaire-Phelan</h2>
      <p>
        To see the 0.3 % surface area difference concretely:
      </p>
      <pre>{`# Kelvin structure — BCC Voronoi seeds
bcc_seeds = np.array([
    [0.0, 0.0, 0.0],
    [0.5, 0.5, 0.5],
]) * L
# Voronoi → truncated octahedra: 14-faced, equal surface tension arms

# Weaire-Phelan — A15 Voronoi seeds (this blueprint)
# 2 dodecahedra + 6 tetrakaidecahedra: less total area`}</pre>
      <p>
        The Kelvin truncated octahedron has surface area
        ≈ 5.31 V^(2/3) per unit volume V. The Weaire-Phelan average is
        ≈ 5.29 V^(2/3). The difference is small but provably real and
        consistent across every cell in the infinite periodic structure.
      </p>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-scipy-wigner-seitz-bcc-fcc-brillouin-zone-3d-voronoi-poi-head-webxr"
            className={lk}
          >
            Wigner-Seitz / Brillouin Zone — scipy.spatial.Voronoi poi head
          </Link>{" "}
          — the BCC Voronoi cell is the Kelvin truncated octahedron; the same{" "}
          <code>periodic_seeds() → Voronoi → ConvexHull</code> pipeline used
          here is documented in full there.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-schwarz-p-d-gyroid-tpms-marching-tets-poi-webxr"
            className={lk}
          >
            Schwarz P, D &amp; Gyroid TPMS — Marching Tetrahedra poi
          </Link>{" "}
          — the Gyroid and Schwarz surfaces also partition space into two
          channel networks with minimal interfacial area. TPMS = zero mean
          curvature everywhere; Weaire-Phelan = minimal total area with
          flat films — different optimisation, same physical motivation.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-neovius-surface-im3m-genus-9-primitive-cubic-stage-floor-webxr"
            className={lk}
          >
            Neovius Surface — Im-3m TPMS, Genus 9 stage floor
          </Link>{" "}
          — another body-centred-cubic periodic structure with two
          non-congruent labyrinth channels. Different optimisation problem
          (minimal surface area for a fixed topology), similar crystallographic
          symmetry class.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-differential-growth-laplacian-smooth-ruffle-poi-webxr"
            className={lk}
          >
            Differential Growth — Föppl-von Kármán ruffling poi disc
          </Link>{" "}
          — biological foam formation emerges from the same surface-tension
          minimisation that drives Weaire-Phelan. Soap films and cell
          membranes converge to minimal configurations for different physical
          reasons (elasticity vs surface energy) but governed by the same
          variational calculus.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-goldberg-polyhedra-gp11-c60-truncated-icosahedron-hexagonal-cage-poi-webxr"
            className={lk}
          >
            Goldberg Polyhedra GP(1,1) — C₆₀ buckminsterfullerene cage
          </Link>{" "}
          — the Goldberg polyhedra and Weaire-Phelan share the key design
          principle: pentagonal faces must appear in any closed or space-filling
          system of polygonal faces (Euler&rsquo;s formula for convex polyhedra
          requires exactly 12 pentagons regardless of the number of hexagons).
        </li>
      </ul>

      <h2>Outside sources</h2>
      <p>
        <strong>Thomson, W. (Lord Kelvin) (1887).</strong>{" "}
        &ldquo;On the division of space with minimum partitional area.&rdquo;{" "}
        <em>Acta Mathematica</em> 11: 121–134; also{" "}
        <em>Philosophical Magazine</em> 24: 503–514. Public domain.{" "}
        <a
          href="https://link.springer.com/article/10.1007/BF02612322"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          link.springer.com
        </a>
        . The original conjecture and the proposed truncated-octahedron
        solution. Related: Kelvin&rsquo;s complete works at{" "}
        <a
          href="https://archive.org/search?query=Lord+Kelvin+mathematical+physical+papers"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          archive.org
        </a>
        ; and Weaire &amp; Phelan (1994){" "}
        <em>Philosophical Magazine Letters</em> 69(2): 107–110 (the counter-example).
      </p>
      <p>
        <strong>SciPy contributors.</strong>{" "}
        BSD-3-Clause.{" "}
        <a
          href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.Voronoi.html"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          docs.scipy.org/doc/scipy/reference/spatial
        </a>
        . The <code>Voronoi</code> and <code>ConvexHull</code> classes used
        here wrap the Qhull computational geometry library. Related:{" "}
        <a
          href="https://github.com/scipy/scipy"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          github.com/scipy/scipy
        </a>{" "}
        and <a href="https://qhull.org" target="_blank" rel="noopener noreferrer" className={lk}>qhull.org</a>{" "}
        (Barber et al. 1996, ACM Trans. Math. Software 22(4): 469–483).
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
        . Vectorised seed generation, vertex array manipulation, and the
        vertex-colour averaging loop all run in native NumPy. Related:{" "}
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
          <strong>
            <code>-1</code> in region — unbounded cell warning.
          </strong>{" "}
          This should not occur for the central 8 seeds in a 3×3×3
          supercell. If it does, increase the tiling to 5×5×5 (125 tiles ×
          8 seeds = 1000 seeds). Check that <code>SEEDS</code> are all
          strictly inside <code>[0, L]³</code> — seeds exactly on a face
          can cause degenerate cells.
        </li>
        <li>
          <strong>QhullError on ConvexHull.</strong> Occurs when fewer than
          4 non-coplanar vertices are in the region list. This indicates a
          degenerate Voronoi cell, usually from numerically coincident seeds.
          The try/except in <code>cell_triangles</code> skips the cell; add a
          print to diagnose which seed_idx is affected.
        </li>
        <li>
          <strong>Mesh has visible gaps between cells.</strong>{" "}
          The <code>remove_doubles</code> threshold <code>DB_DIST = 1e-5</code>{" "}
          is in abstract units (L = 1.0). If you set L to a very small or
          very large value, scale <code>DB_DIST</code> accordingly:
          set it to about <code>L * 1e-5</code>.
        </li>
        <li>
          <strong>Faces appear inside-out in solid mode.</strong>{" "}
          <code>recalc_face_normals</code> computes outward normals from the
          centroid of the mesh, not per-cell. For a non-convex arrangement
          of cells, some normals may flip. Fix with{" "}
          Edit Mode → Select All → Mesh → Normals → Recalculate Outside
          (Alt+N).
        </li>
        <li>
          <strong>SciPy not found in Blender Python.</strong>{" "}
          Run from a terminal:
          <br />
          <code>
            /path/to/blender-5.1/python/bin/pip install scipy
          </code>
          <br />
          Or add SciPy as a Blender Extension via Preferences → Extensions.
          The studio&rsquo;s{" "}
          <code>tools/blender-addon/README.md</code> lists the recommended
          Python environment setup.
        </li>
      </ul>
    </>
  );
}

const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy scipy — Weaire-Phelan A15 Foam: Kelvin's 1887 Conjecture, Pm-3n Space Group, Periodic Voronoi (2 Pentagonal Dodecahedra + 6 Tetrakaidecahedra per Cell), 0.3% Surface-Area Advantage & Bicolour Cage Poi Head for WebXR (Blender 5.1)",
  lede:
    "The 1994 disproof of Kelvin's optimal-foam conjecture — built from the A15 crystal Voronoi tessellation, two cell types, and a periodic-supercell SciPy computation.",
  date: "2026-08-23",
  tags: [
    "blender",
    "python",
    "numpy",
    "scipy",
    "voronoi",
    "foam",
    "crystal",
    "poi-head",
    "5.1",
  ],
  body: Body,
});

export const blenderTutorialPythonNumpyScipyWeairePhelanA15KelvinConjectureFoamBubbleCagePoiWebxrEntry =
  entry;
export default entry;

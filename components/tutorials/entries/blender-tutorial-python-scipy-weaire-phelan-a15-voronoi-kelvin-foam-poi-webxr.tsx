import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-scipy-weaire-phelan-a15-voronoi-kelvin-foam-poi-webxr";

const TITLE =
  "Python scipy — Weaire-Phelan Foam: A15 Voronoi Cells, Kelvin's Conjecture & Pyritohedron/Tetrakaidecahedron Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "In 1887 Lord Kelvin asked how space can be partitioned into equal-volume cells with the least surface area, and conjectured his bitruncated-cubic honeycomb was optimal. For 107 years the answer was 'we don't know any better.' Then Weaire & Phelan (1994) computed a structure built on the A15 crystal lattice that beats Kelvin by 0.3 %. We reconstruct that structure in Blender by placing 8 seeds in the unit cell — 2 pyritohedra + 6 tetrakaidecahedra — and computing the periodic 3-D Voronoi diagram with scipy.spatial.Voronoi. The result is the actual convex polyhedral cells, colour-coded by type, with shape keys that morph between foam-thickness states for real-time WebXR inspection.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-08",
  externalSources: [
    {
      label:
        "Weaire, D. & Phelan, R. (1994). A counter-example to Kelvin's conjecture. Philosophical Magazine Letters 69(2):107–110.",
      url: "https://doi.org/10.1080/09500839408241577",
      licence: "Academic journal — cited for attribution; algorithm implemented independently",
      author: "Denis Weaire, Robert Phelan",
    },
    {
      label:
        "SciPy community — scipy.spatial.Voronoi. BSD-3-Clause.",
      url: "https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.Voronoi.html",
      licence: "BSD-3-Clause",
      author: "SciPy community",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        Lord Kelvin's 1887 question sounds almost childlike: if you must fill
        three-dimensional space with identical bubbles, how do you make the
        bubble walls as thin as possible? He proposed a lattice of{" "}
        <em>truncated octahedra</em> — the Kelvin cell — and spent the rest of
        his life convinced it was the answer.
      </p>
      <p>
        It wasn't. In 1994 Denis Weaire and Robert Phelan ran a computer search
        and found a structure with{" "}
        <strong>0.3 % less surface area per unit volume</strong>. The margin is
        tiny but the implication is profound: one of the 19th century's most
        celebrated geometers was wrong, and a combinatorial computer search found
        the counterexample.
      </p>

      <h2>Two cell types, one unit cell</h2>
      <p>
        The Weaire-Phelan structure uses two polyhedra instead of one, in the
        ratio <strong>2 : 6</strong> per unit cell:
      </p>
      <ul>
        <li>
          <strong>Type A — pyritohedron (12 faces)</strong>: all-pentagonal,
          with pyrite (<em>FeS₂</em>) crystallographic symmetry T<sub>h</sub>.
          Sits at the BCC corner and body-centre of the unit cell.
        </li>
        <li>
          <strong>Type B — tetrakaidecahedron (14 faces)</strong>: 12 pentagons
          + 2 hexagons, elongated along one axis, symmetry D<sub>2h</sub>.
          Sits at the 6 face-chain positions of the A15 lattice.
        </li>
      </ul>
      <p>
        Every face is slightly curved in the true soap-film realisation (all
        mean curvatures satisfy the Young-Laplace pressure balance). The
        polyhedral approximation we build here flattens those faces, which is
        correct for visualisation and 3-D printing but not for foam-physics
        simulation.
      </p>

      <h2>The A15 crystal lattice</h2>
      <p>
        The Weaire-Phelan structure lives on the{" "}
        <strong>A15 lattice</strong> (also called the Cr₃Si or β-tungsten
        structure). Eight atoms occupy the cubic unit cell: 2 at BCC sites and
        6 at face-chain sites. Those 8 atoms are the Voronoi seed points.
      </p>
      <pre>{`# Normalised to [0,1]³ unit cell
A_NORM = [[0.00, 0.00, 0.00],   # Si — pyritohedron
          [0.50, 0.50, 0.50]]   # Si — pyritohedron (body centre)

B_NORM = [[0.25, 0.50, 0.00],   # Cr — tetrakaidecahedron (×6)
          [0.75, 0.50, 0.00],
          [0.00, 0.25, 0.50],
          [0.00, 0.75, 0.50],
          [0.50, 0.00, 0.25],
          [0.50, 0.00, 0.75]]`}</pre>
      <p>
        The face-chain Cr positions come in three pairs — one pair per
        Cartesian axis — and each pair sits at ¼ and ¾ along that axis
        while centred at ½ in the other two. This 3-fold repetition is why
        the B-type tetrakaidecahedron has an elongated axis: its generating
        chain breaks the cubic symmetry.
      </p>

      <h2>Periodic Voronoi construction</h2>
      <p>
        <code>scipy.spatial.Voronoi</code> computes the Voronoi diagram of a
        finite point set, but our seeds repeat with periodicity{" "}
        <code>CELL_SIZE</code>. We handle this by tiling the 8 seeds in a
        5 × 5 × 5 supercell (TILE_N = 2), then extracting only the central
        unit cell's 8 regions:
      </p>
      <pre>{`shifts = np.array([[i,j,k]
    for i in range(-TILE_N, TILE_N+1)
    for j in range(-TILE_N, TILE_N+1)
    for k in range(-TILE_N, TILE_N+1)])       # 125 shifts
tiled_pts = (SEEDS[None] + (shifts * CELL_SIZE)[:,None]).reshape(-1, 3)
vor = Voronoi(tiled_pts)                       # 1000 input points → 8000+ vertices`}</pre>
      <p>
        Why 5³ and not 3³? Any central seed's Voronoi region may span up to
        two lattice periods before all bounding ridges terminate.  Using
        TILE_N = 2 (5³ = 125 tile copies) ensures every ridge involving a
        central seed has a valid finite opposite, eliminating the{" "}
        <code>−1</code> sentinel vertices that mark open (infinite) ridges.
      </p>

      <h2>Polygon face extraction from ridges</h2>
      <p>
        SciPy's ridge table gives us the geometry directly without a convex-hull
        reconstruction step:
      </p>
      <pre>{`for ridge_idx, (p1, p2) in enumerate(vor.ridge_points):
    if p1 != global_seed_idx and p2 != global_seed_idx:
        continue
    verts_idx = vor.ridge_vertices[ridge_idx]
    if -1 in verts_idx:
        continue            # open ridge — seed too near boundary
    pts = vor.vertices[verts_idx]
    # Sort vertices by angle around face centroid (outward-normal frame)
    centre = pts.mean(axis=0)
    normal = (centre - seed_pos) / np.linalg.norm(centre - seed_pos)
    ref    = pts[0] - centre; ref -= np.dot(ref, normal)*normal; ref /= np.linalg.norm(ref)
    perp   = np.cross(normal, ref)
    angles = np.arctan2((pts - centre) @ perp, (pts - centre) @ ref)
    faces_out.append([verts_idx[i] for i in np.argsort(angles)])`}</pre>
      <p>
        The outward-normal frame for sorting is crucial: projecting onto the
        wrong plane (say, a global xy-plane) would sort correctly only for faces
        nearly parallel to xy, and scramble the rest. Using the face's own
        normal — computed as the direction from the Voronoi seed to the face
        centroid — works universally for convex Voronoi cells.
      </p>

      <h2>Shape keys: foam thickness morphs</h2>
      <p>
        Each cell is shrunk toward its seed centre by four factors (0.98, 0.92,
        0.84, 0.74), creating shape keys that open gap between the cells in
        WebXR. This is a geometric proxy for the{" "}
        <em>soap-film thickness parameter</em>: as a real foam dries out,
        surface tension pulls each cell inward and the Plateau borders (the
        ridges where three films meet) become visible as dark lines.
      </p>
      <pre>{`sk = obj.shape_key_add(name=f"shrink_{int(factor*100)}", from_mix=False)
for j, v in enumerate(sk.data):
    v.co = coords[j] * factor + seed_pos * (1.0 - factor)`}</pre>

      <h2>Colour convention and material</h2>
      <p>
        Type A pyritohedra use teal emission (0.20, 0.85, 0.95); type B
        tetrakaidecahedra use coral (0.90, 0.30, 0.65). The material is a 35 %
        emission / 65 % Principled BSDF mix so the cells read clearly in
        both lit and unlit WebXR contexts. The <code>holoflow:facet</code> flag
        is set on every object so the Holoflow exporter preserves flat shading
        rather than auto-smoothing.
      </p>

      <h2>The Water Cube connection</h2>
      <p>
        The National Aquatics Centre for the 2008 Beijing Olympics — commonly
        called the <em>Water Cube</em> (水立方, Shuǐ Lì Fāng) — used the
        Weaire-Phelan geometry as the basis for its ETFE (ethylene
        tetrafluoroethylene) façade. Architects PTW/Arup sliced the structure at
        a 45° angle to the unit cell, producing the characteristic irregular
        polygon grid visible on the building exterior. This is a direct
        engineering application of the same 8-seed Voronoi construction you just
        ran in Blender.
      </p>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>Missing scipy</strong>: Blender 5.1 ships Python 3.12 with
          pip. Run{" "}
          <code>
            import subprocess; subprocess.run([bpy.app.binary_path_python,
            '-m', 'pip', 'install', 'scipy'])
          </code>{" "}
          once from the Blender Python console.
        </li>
        <li>
          <strong>Fewer than 8 cells exported</strong>: A ridge with a{" "}
          <code>−1</code> vertex is silently skipped, leaving an incomplete
          cell. Increase <code>TILE_N</code> to 3 (7³ = 343 tile copies).
        </li>
        <li>
          <strong>Non-manifold faces</strong>: If two sorted-polygon vertices
          are nearly coincident, bmesh will reject the face. Add a small
          merge-by-distance pass:{" "}
          <code>bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)</code>
        </li>
      </ul>

      <h2>Further reading & studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-marching-cubes-gyroid-sdf-isosurface-webxr"
            className={lk}
          >
            Gyroid TPMS — Surface Nets level-set extraction
          </Link>{" "}
          — contrast the level-set / Surface-Nets approach with this direct
          Voronoi cell construction; both describe foam-like minimal surfaces
          but via entirely different algorithms
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-scipy-wigner-seitz-bcc-fcc-brillouin-zone-3d-voronoi-poi-head-webxr"
            className={lk}
          >
            Wigner-Seitz BCC/FCC — scipy Voronoi on crystal lattices
          </Link>{" "}
          — the same <code>scipy.spatial.Voronoi</code> workflow applied to FCC
          and BCC lattices; a direct precursor to the A15 construction here
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-scipy-thompson-problem-coulomb-energy-tammes-s2-poi-head-webxr"
            className={lk}
          >
            Thomson Problem — Coulomb energy minimisation on S²
          </Link>{" "}
          — another "what arrangement minimises a geometric cost?" problem;
          the spirit of Kelvin's conjecture in a spherical setting
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-scherk-doubly-periodic-minimal-surface-saddle-tower-poi-webxr"
            className={lk}
          >
            Scherk Minimal Surface — doubly-periodic saddle-tower lattice
          </Link>{" "}
          — a TPMS defined by the same zero-mean-curvature principle that
          governs soap-film cell walls in real foam
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ol>
        <li>
          <strong>
            <a
              href="https://doi.org/10.1080/09500839408241577"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Weaire, D. & Phelan, R. (1994). "A counter-example to Kelvin's
              conjecture on minimal surfaces." Phil. Mag. Lett. 69(2):107–110.
            </a>
          </strong>{" "}
          — the original paper introducing the A15 counterexample, with the
          seed coordinates and surface-area comparison that overturned Kelvin's
          107-year-old conjecture. Algorithm implemented independently; paper
          cited for attribution.
        </li>
        <li>
          <strong>
            <a
              href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.Voronoi.html"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              SciPy community — scipy.spatial.Voronoi. BSD-3-Clause.
            </a>
          </strong>{" "}
          — the Qhull-backed Voronoi implementation used to compute the
          periodic cell diagram.{" "}
          Related:{" "}
          <a
            href="https://github.com/scipy/scipy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/scipy/scipy
          </a>
          {" "}and the upstream Qhull library at{" "}
          <a
            href="http://www.qhull.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            qhull.org
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

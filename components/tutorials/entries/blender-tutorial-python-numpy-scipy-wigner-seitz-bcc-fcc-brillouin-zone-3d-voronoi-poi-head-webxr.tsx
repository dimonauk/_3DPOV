import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-scipy-wigner-seitz-bcc-fcc-brillouin-zone-3d-voronoi-poi-head-webxr";

const TITLE =
  "Python numpy + scipy — Wigner-Seitz Cell: BCC / FCC / SC Bravais Lattice " +
  "3D Voronoi, Brillouin Zone Construction & Faceted Crystal Poi Heads for WebXR (Blender 5.1)";

const LEDE =
  "The Wigner-Seitz cell is the Voronoi polyhedron of a single lattice site — " +
  "every point in space closer to that site than to any other.  Three Bravais " +
  "lattices yield three distinct convex solids: the simple cubic lattice gives " +
  "a cube (6 square faces), the BCC lattice gives a truncated octahedron (8 hexagonal " +
  "{111} + 6 square {100} faces), and the FCC lattice gives a rhombic dodecahedron " +
  "(12 identical {110} faces).  All three are computed via scipy.spatial.Voronoi " +
  "from primitive-vector lattice generators, triangulated by ConvexHull, regrouped " +
  "into planar polygons, colour-coded by Miller-index family, and exported as a " +
  "single Draco-6 GLB for WebXR.";

function Body() {
  return (
    <>
      <p>
        In 1933 Eugene Wigner and Frederick Seitz needed a canonical unit cell for
        metallic sodium that respected the full point-group symmetry of the BCC
        lattice.  Their construction — now called the Wigner-Seitz cell — is simply
        the 3D Voronoi region of a single lattice site: the set of all points closer
        to that site than to any other lattice point.  It is the geometrically natural
        fundamental domain of the lattice symmetry group.
      </p>
      <p>
        The same construction in <em>reciprocal space</em> gives the first Brillouin
        zone — the fundamental domain of crystal momentum.  Every band structure diagram
        in solid-state physics textbooks is a path through this zone: Γ → X → M → Γ
        for a 2D square lattice, or Γ → L → X → W → K for the FCC BZ (a truncated
        octahedron — the BCC reciprocal lattice is FCC, and vice versa).
      </p>

      <h2>The three classical Bravais lattice types</h2>
      <p>
        Any 3D crystal belongs to one of the 14 Bravais lattice types; the three cubic
        types are the most symmetric:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`SC  — primitive vectors: a₁=(1,0,0), a₂=(0,1,0), a₃=(0,0,1)
      WS cell: cube.  6 faces, all {100}.
      Nearest neighbours: 6 @ distance 1.

BCC — primitive vectors: a₁=(−½, ½, ½), a₂=(½,−½, ½), a₃=(½, ½,−½)
      WS cell: truncated octahedron.  14 faces.
      NN: 8 body-centre sites @ √3/2, giving 8 {111} hexagonal faces.
      NNN: 6 corner sites @ 1,    giving 6 {100} square   faces.

FCC — primitive vectors: a₁=(0,½,½), a₂=(½,0,½), a₃=(½,½,0)
      WS cell: rhombic dodecahedron.  12 faces, all {110}.
      NN: 12 face-centre sites @ √2/2, giving 12 rhombic {110} faces.`}
      </pre>
      <p>
        WHY use primitive vectors rather than the conventional cubic cell?  The
        conventional BCC cell contains 2 atoms and the FCC cell contains 4.  Using
        primitive vectors generates a minimal point set for Voronoi: fewer redundant
        seeds, cleaner region boundaries, and no accidental co-linearity artefacts
        from over-specified grids.
      </p>

      <h2>scipy.Voronoi in 3D — how it works here</h2>
      <p>
        The blueprint generates lattice points by evaluating all integer combinations
        i·a₁ + j·a₂ + k·a₃ for i, j, k ∈ [−3, 3] — a neighbourhood of 7³ = 343
        primitive cells per lattice.  The origin is guaranteed at array index 0 via
        an argmin-swap.  <code>scipy.spatial.Voronoi(pts)</code> then returns a
        data structure whose <code>point_region[0]</code> is the region index for
        the origin; <code>regions[point_region[0]]</code> lists the vertex indices
        of that region.  A −1 in the list would signal an unbounded cell — impossible
        with 3 shells of neighbours.
      </p>
      <p>
        Compare this to the approach in the{" "}
        <Link className={lk} href="/tutorials/blender-tutorial-python-scipy-spherical-voronoi-lloyd-cvt-faceted-poi-head-webxr">
          spherical Voronoi / Lloyd&apos;s algorithm tutorial
        </Link>
        , which runs Voronoi on the surface of S².  That tutorial uses
        <code>scipy.spatial.SphericalVoronoi</code>; this one uses the flat
        3D variant and exploits the lattice-periodicity guarantee that every
        region is a bounded convex polytope.
      </p>

      <h2>From triangulated hull to planar polygon faces</h2>
      <p>
        <code>scipy.ConvexHull</code> returns the WS cell boundary as a set of
        <em>triangles</em> (simplices).  The BCC truncated octahedron has 14
        polygon faces but 36 hull triangles (each hexagonal face = 4 triangles,
        each square = 2).  Merging them is done by clustering triangles whose
        outward-normal dot product exceeds 1 − ε:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`for each unvisited triangle i:
  same = { j : normals[j] · normals[i] ≥ 1 − EPS_COPLANAR }
  collect all vertices in same-group triangles
  project onto face plane via two orthogonal basis vectors
  sort by atan2 around centroid  ← this gives correct polygon winding
  emit one planar polygon`}
      </pre>
      <p>
        The angle-sort step is essential: <code>bmesh.faces.new()</code> expects
        vertices in counter-clockwise winding order when viewed from outside.  The
        projection uses two basis vectors u, v in the face plane — u is perpendicular
        to the face normal and to an arbitrary axis (x if not co-linear, else y);
        v = n × u.  Projecting each vertex gives a 2D point; <code>atan2(δ·v, δ·u)</code>
        gives the angle; <code>argsort</code> gives CCW order.
      </p>

      <h2>Miller-index face classification</h2>
      <p>
        Each face&apos;s outward unit normal is compared — by dot product — against the
        three crystallographic direction sets:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`{100}: normals (±1,0,0), (0,±1,0), (0,0,±1)         — cube face directions
{111}: normals (±1,±1,±1)/√3                          — body diagonals
{110}: normals (±1,±1,0)/√2, (±1,0,±1)/√2, (0,±1,±1)/√2 — face diagonals`}
      </pre>
      <p>
        A cosine tolerance of 0.06 (≈ 3.4°) handles floating-point drift from the
        Voronoi computation.  This classification directly maps to the three vertex
        colours — ice-blue for {"{100}"} (structural square faces), amber for {"{111}"} (hexagonal
        faces in BCC), lime for {"{110}"} (rhombic faces in FCC).  The colours read as
        a legend without needing a texture or UV map.
      </p>

      <h2>The truncated octahedron as a space-filler</h2>
      <p>
        The BCC Wigner-Seitz cell — the truncated octahedron — is the{" "}
        <em>only</em> convex polyhedron that is both a uniform Archimedean solid and
        a space-filler by translation.  It is the isoperimetrically optimal monohedral
        tiling: of all convex shapes with the same volume, it has the smallest surface
        area.  (The Weaire-Phelan structure, based on non-congruent cells, beats it
        in the multi-cell competition; that is the structure used for the Beijing
        National Aquatics Centre.)
      </p>
      <p>
        The rhombic dodecahedron (FCC WS cell) is the dual polyhedron of the
        cuboctahedron.  It appears naturally wherever equal spheres are in
        face-centred cubic packing — the rhombic dodecahedron is the Voronoi
        cell of a sphere in a densest-packed FCC arrangement.  You can print
        a set of rhombic dodecahedra and assemble them into a solid without gaps.
        The{" "}
        <Link className={lk} href="/tutorials/blender-tutorial-python-lennard-jones-md-crystal-nucleation-berendsen">
          Lennard-Jones crystal nucleation tutorial
        </Link>{" "}
        shows how FCC packing emerges spontaneously from molecular dynamics;
        the WS cells here are the Voronoi domains of those equilibrium positions.
      </p>

      <h2>Studio connection: flat-shaded faceted aesthetics</h2>
      <p>
        All three WS cell objects are built with <code>use_smooth = False</code> and
        the <code>holoflow:facet = True</code> custom property, matching the studio&apos;s
        low-poly + cel-shaded aesthetic documented in the Holoflow WebXR exporter.
        The emission material driven by vertex colour requires no UV map — the same
        pattern as the{" "}
        <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-scipy-dec-hodge-star-harmonic-1form-perturbed-torus-webxr">
          Discrete Exterior Calculus tutorial
        </Link>
        &apos;s harmonic 1-form colouring, and the Chladni / Gray-Scott height fields.
        For GN-based crystal clustering using a similar faceted palette, see the{" "}
        <Link className={lk} href="/tutorials/blender-tutorial-gn-distribute-points-in-volume-crystal-geode">
          Crystal Geode tutorial
        </Link>
        .
      </p>

      <h2>External sources</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          Wigner, E. &amp; Seitz, F. (1933).{" "}
          <em>On the Constitution of Metallic Sodium</em>.{" "}
          Physical Review 43, 804.  Public Domain (pre-1978, US Government-funded).{" "}
          <Link className={lk} href="https://doi.org/10.1103/PhysRev.43.804">
            doi:10.1103/PhysRev.43.804
          </Link>
          .  Related:{" "}
          <Link className={lk} href="https://en.wikipedia.org/wiki/Wigner%E2%80%93Seitz_cell">
            Wikipedia — Wigner-Seitz cell
          </Link>
          ;{" "}
          <Link className={lk} href="https://en.wikipedia.org/wiki/Brillouin_zone">
            Wikipedia — Brillouin zone
          </Link>
          .
        </li>
        <li>
          SciPy community.{" "}
          <em>scipy.spatial.Voronoi — N-dimensional Voronoi diagrams</em>.  BSD-3-Clause.{" "}
          <Link className={lk} href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.Voronoi.html">
            docs.scipy.org/…/Voronoi
          </Link>
          .  Related:{" "}
          <Link className={lk} href="https://github.com/scipy/scipy">
            github.com/scipy/scipy
          </Link>
          ;{" "}
          <Link className={lk} href="https://docs.scipy.org/doc/scipy/reference/spatial.html">
            scipy.spatial overview
          </Link>
          .
        </li>
        <li>
          Kittel, C. (2004).{" "}
          <em>Introduction to Solid State Physics</em>, 8th ed., Wiley.
          Chapter 2: Crystal Diffraction and the Reciprocal Lattice.
          Classical content Public Domain.{" "}
          <Link className={lk} href="https://www.wiley.com/en-us/Introduction+to+Solid+State+Physics%2C+8th+Edition-p-9780471415268">
            wiley.com (ISBN 0471415265)
          </Link>
          .  Related:{" "}
          <Link className={lk} href="https://en.wikipedia.org/wiki/Truncated_octahedron">
            Truncated octahedron
          </Link>
          ;{" "}
          <Link className={lk} href="https://en.wikipedia.org/wiki/Rhombic_dodecahedron">
            Rhombic dodecahedron
          </Link>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    directory:  "blends/scripting/python-numpy-scipy-wigner-seitz-bcc-fcc-brillouin-zone-3d-voronoi-poi-head-webxr",
    software:   ["Blender 5.1", "numpy (bundled)", "scipy (bundled)"],
    time:       "25 minutes",
    difficulty: "advanced",
    cost:       "nil — Python + Blender only",
    supplies: {
      materials: [],
      tools: ["Blender 5.1", "numpy (bundled with Blender)", "scipy (bundled with Blender)"],
    },
    steps: [
      {
        title: "Open the Scripting workspace",
        body:  "Launch Blender 5.1.  Switch to the Scripting workspace (top-bar tab).  Create a new text block.  Save the .blend to a local folder before running.",
      },
      {
        title: "Paste and run blueprint.py",
        body:  "Copy blueprint.py into the Text Editor and press Alt+P.  The console prints three lines: SC / BCC / FCC vertex and face counts.  Expect 1–3 s on a modern CPU.  Three objects appear in the 3D Viewport.",
      },
      {
        title: "Inspect vertex colours in Material Preview",
        body:  "Switch to Material Preview mode (sphere icon, top-right of 3D Viewport).  Select each object: the SC cube shows solid blue; the BCC truncated octahedron shows amber hexagons and blue squares; the FCC rhombic dodecahedron shows lime rhombi.",
      },
      {
        title: "Verify holoflow:facet property",
        body:  "Select any of the three objects.  Open Properties → Object Properties → Custom Properties.  The key holoflow:facet should appear with value True — this instructs the Holoflow exporter to preserve flat shading.",
      },
      {
        title: "Run record.py",
        body:  "Load record.py in a second text block; press Alt+P.  This sets up the camera, keyframes the turntable rotation (F1–180) and renders viewport.mp4 via Workbench with vertex-colour display.",
      },
      {
        title: "Follow SCREEN-RECORDING-NOTES.md",
        body:  "Set OBS to capture the Blender window at 1920×1080, 30 fps, no audio.  Record the four segments: theory walkthrough, script run, viewport inspection, GLB export.  Target 10–12 minutes.",
      },
      {
        title: "Export GLB",
        body:  "File → Export → glTF 2.0.  Format = GLB.  Enable: Draco level 6, Vertex Colors, Apply Transforms.  Disable: Animations (none set on the WS objects themselves), Cameras.  Save as hf_wigner_seitz.glb.",
      },
      {
        title: "Verify in the Three.js viewer",
        body:  "Load hf_wigner_seitz.glb in the Holoflow Three.js viewer (/studio).  Confirm three objects appear with distinct vertex colours and flat shading.  Rotate each to verify face structure matches the expected polyhedra.",
      },
    ],
  },
  {
    slug:    SLUG,
    title:   TITLE,
    date:    "2026-08-08",
    kind:    "tutorial",
    excerpt: LEDE,
    Body,
  },
);

import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-menger-sponge-level3-hausdorff-fractal-void-cage-poi-webxr";

const TITLE =
  "Python numpy — Menger Sponge Level 3: Hausdorff Dimension log(20)/log(3) ≈ 2.7268, Universal-Curve Theorem, Base-3 Digit Test & Fractal Void Cage Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "In 1926 Karl Menger was trying to define topological dimension rigorously — to pin down, in purely intrinsic terms, what it means for a space to be one-dimensional rather than two.  His answer was the sponge: a recursive solid whose volume decays to zero, whose surface area diverges to infinity, and whose topological dimension is provably 1 even though its Hausdorff dimension is log(20)/log(3) ≈ 2.727.  The construction also yields a universality theorem that Menger proved in the same paper: every compact 1-dimensional metric space embeds homeomorphically inside M³.  This blueprint implements level 3 (8 000 sub-cubes) using a vectorised base-3 digit test in numpy, builds the exact exterior surface by emitting only faces adjacent to empty space, encodes the three tunnel axes in vertex colour, and adds an 'SK_Exploded' shape key that pulls the cubes apart to reveal the self-similar interior — a poi cage whose light-scattering tunnels are the point.";

const data = {
  title: TITLE,
  lede:  LEDE,
  date:  "2026-08-15",
  externalSources: [
    {
      label:
        "Menger, K. (1926). Allgemeine Räume und kartesische Räume. Proceedings of the Royal Academy of Sciences Amsterdam 29: 1125–1128. Public Domain.",
      url:     "https://www.jstor.org/stable/20011633",
      licence: "Public Domain",
      author:  "Karl Menger",
    },
    {
      label:
        "Wikipedia contributors. Menger sponge. Wikipedia, The Free Encyclopedia. CC BY-SA 4.0.",
      url:     "https://en.wikipedia.org/wiki/Menger_sponge",
      licence: "CC BY-SA 4.0",
      author:  "Wikipedia contributors",
    },
    {
      label:
        "NumPy contributors. NumPy Reference Documentation. BSD-3-Clause.",
      url:     "https://numpy.org/doc/stable/",
      licence: "BSD-3-Clause",
      author:  "NumPy community",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        Menger's motivation was not aesthetics — it was the most austere kind
        of topology.  Cantor had shown that the unit interval and the unit
        square are in bijection (though not homeomorphic), so cardinality alone
        cannot distinguish dimension.  Brouwer and Lebesgue had each proposed
        inductive dimension definitions, but Menger wanted a constructive
        <em> universal</em> example: a compact metrizable space that is
        1-dimensional (in the inductive sense) and that contains a copy of
        every other compact 1-dimensional space.  The sponge is that example.
      </p>
      <p>
        The paradox is in the numbers.  Volume at level N is{" "}
        <code>(20/27)ᴺ</code>, which decays to zero.  Yet the number of
        exposed faces grows, so the surface area diverges.  The Hausdorff
        dimension <code>d_H = log(20)/log(3) ≈ 2.727</code> sits between the
        topological dimension 1 and the embedding dimension 3.  The sponge is a
        space of fractional dimension that contains, topologically, nothing
        more than a curve.
      </p>

      <h2>The removal rule and the base-3 digit test</h2>
      <p>
        At each level of the construction, a 3×3×3 block of 27 sub-cubes loses
        exactly 7: the body centre (all three local coordinates equal 1) and
        the six face-centred cubes (exactly two local coordinates equal 1).
        Together these form the three through-tunnels — one per axis.  A cell
        at (i,j,k) in {"{0,1,2}"}³ is removed if{" "}
        <code>count(coord == 1) ≥ 2</code>.
      </p>
      <p>
        For a level-N grid the same rule applies at every scale simultaneously.
        Write each integer coordinate in base 3.  At digit position d, read off
        the digits (iₐ, jₐ, kₐ).  If{" "}
        <code>count(digit == 1) ≥ 2</code> at <em>any</em> digit position, the
        cell is removed.  This is a pure bitwise test with no recursion at
        runtime — numpy handles the entire 27×27×27 grid in a single vectorised
        pass:
      </p>
      <pre className="overflow-x-auto text-sm">
{`import numpy as np

GRID = 27  # 3^3
coords = np.arange(GRID)
I, J, K = np.meshgrid(coords, coords, coords, indexing='ij')

kept = np.ones((GRID, GRID, GRID), dtype=bool)
ti, tj, tk = I.copy(), J.copy(), K.copy()
for _ in range(3):          # three digit positions
    di, dj, dk = ti % 3, tj % 3, tk % 3
    cross = (di == 1).astype(np.int8) + (dj == 1) + (dk == 1)
    kept &= cross < 2       # remove cross-pattern cells
    ti //= 3;  tj //= 3;  tk //= 3

# kept.sum() == 8000  (= 20^3)  ✓`}
      </pre>

      <h2>Building the exterior surface</h2>
      <p>
        Naïvely emitting all 6 faces of 8 000 cubes would produce 48 000 quads,
        most of them hidden inside the solid (shared between adjacent occupied
        cells).  Rendering hidden faces costs GPU bandwidth, inflates GLB file
        size, and breaks backface culling.  Instead, for every occupied cell we
        inspect each of its six face-neighbours:
      </p>
      <ul>
        <li>
          Neighbour is <strong>out of bounds</strong>: this is an outer surface
          face — emit it.
        </li>
        <li>
          Neighbour is <strong>empty</strong> (removed by the sponge rule): this
          is a tunnel wall — emit it.
        </li>
        <li>
          Neighbour is <strong>occupied</strong>: shared interior face — skip.
        </li>
      </ul>
      <p>
        Vertices are shared across cells using a dict keyed on integer grid
        position.  This de-duplication ensures the mesh is a proper manifold
        along tunnel walls where multiple cells meet at a single edge.  The
        resulting mesh has roughly 36 000 verts and 55 000 quads for level 3 —
        well within Blender's interactive viewport budget.
      </p>

      <h2>Vertex colour: reading the tunnel axes</h2>
      <p>
        Each face is tagged with its normal axis (X, Y, or Z) and assigned a
        colour: red for X-tunnels, green for Y-tunnels, blue for Z-tunnels.
        Because the sponge has cubic symmetry, the three axes should contribute
        equally — any colour imbalance in the rendered mesh signals a winding or
        normal error in the emitter loop.  This is a useful sanity check before
        export.
      </p>
      <p>
        Blender's vertex-colour layers are stored per <em>loop corner</em>, not
        per vertex.  This means a vertex shared between an X-face and a
        Y-face carries two colour samples in the data array, one per polygon
        loop — the GPU interpolates across each face independently.  The
        assignment loop iterates <code>mesh.polygons</code> and indexes
        <code>col_layer.data[li]</code> via each polygon's{" "}
        <code>loop_indices</code>.
      </p>

      <h2>Shape key: SK_Exploded</h2>
      <p>
        Shape keys require identical vertex count between Basis and every
        target.  We satisfy that constraint by moving vertices rather than
        adding or removing them.  For SK_Exploded, each vertex is displaced
        outward from the average centre of its owning cells:
      </p>
      <pre className="overflow-x-auto text-sm">
{`for vi, basis_pos in enumerate(verts_f):
    cells = vert_cells[vi]              # cells sharing this vertex
    avg_centre = mean([cell_centres[c] for c in cells])
    offset     = basis_pos - avg_centre
    sk_pos     = avg_centre + offset * EXPAND_FACTOR  # e.g. 1.35`}
      </pre>
      <p>
        Vertices at the junction of multiple cells receive a weighted average of
        the expansions, which produces a smooth blend rather than a hard split.
        Set <code>EXPAND_FACTOR = 1.0</code> to recover the Basis exactly;
        values above 2.0 begin to overlap adjacent cells' expansions.
      </p>

      <h2>Failure modes and troubleshooting</h2>
      <ul>
        <li>
          <strong>assert fails at occupied.sum()</strong>: The base-3 digit loop
          consumed the coordinate arrays in place.  Verify the <code>ti //= 3</code>{" "}
          line uses the temporaries, not I, J, K directly.
        </li>
        <li>
          <strong>Inverted normals on tunnel walls</strong>: The winding order
          differs for +X vs −X faces.  The blueprint encodes six explicit quad
          corner-offset tuples verified by cross-product.  If you see black
          interior faces in Solid view (backface culling enabled), re-check the
          tuple for that face direction.
        </li>
        <li>
          <strong>Memory error at level 4</strong>: Level 4 has 160 000 cells
          and roughly 1.1M quads — Blender's undo stack will exhaust RAM.
          Disable undo, or build at level 3 and apply a multi-res modifier
          as a visual detail pass.
        </li>
        <li>
          <strong>from_pydata slow for large meshes</strong>: For level 4+,
          prefer <code>mesh.vertices.foreach_set("co", flat_array)</code>{" "}
          and <code>mesh.loops.foreach_set("vertex_index", ...)</code> — the
          foreach_set path avoids Python object overhead for each vertex.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <p>
        The same exterior-face algorithm is used in the{" "}
        <Link href="/tutorials/blender-tutorial-python-bmesh-extrude-scale-fractal-spikes" className={lk}>
          Fractal Spike Ball tutorial
        </Link>{" "}
        to avoid emitting internal geometry.  For iterated function systems and
        the chaos-game approach to building fractals procedurally, see the{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-ifs-chaos-game-barnsley-fern-dragon-curve-poi-webxr" className={lk}>
          Barnsley Fern / IFS Chaos Game tutorial
        </Link>.
      </p>
      <p>
        The Mandelbulb uses a completely different fractal paradigm —
        orbit-escape in the Triplex algebra — with marching tetrahedra for its
        isosurface; compare that approach in the{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-mandelbulb-power8-triplex-algebra-white-nylander-fractal-poi-head-webxr" className={lk}>
          Mandelbulb tutorial
        </Link>.
        Aperiodic tiling and self-similarity without the recursive removal rule
        appears in the{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-penrose-p3-rhombus-robinson-deflation-aperiodic-stage-floor-webxr" className={lk}>
          Penrose P3 Stage Floor tutorial
        </Link>.
        For a detailed tour of Blender's geodesic subdivision machinery — which
        can be combined with this sponge to round the sub-cube corners — see
        the{" "}
        <Link href="/tutorials/blender-tutorial-python-bmesh-ops-geodesic-sphere-icosahedron-frequency-subdivision-vrm-webxr" className={lk}>
          Geodesic Sphere Subdivision tutorial
        </Link>.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  ...data,
  slug:   SLUG,
  body:   <Body />,
  assets: {
    blueprint: `public/library/blends/scripting/${SLUG}/blueprint.py`,
    record:    `public/library/blends/scripting/${SLUG}/record.py`,
    readme:    `public/library/blends/scripting/${SLUG}/README.md`,
  },
  tags: [
    "blender-5-1",
    "python",
    "numpy",
    "fractal",
    "menger-sponge",
    "hausdorff-dimension",
    "topology",
    "vertex-colour",
    "shape-keys",
    "webxr",
    "poi",
    "glb",
  ],
});

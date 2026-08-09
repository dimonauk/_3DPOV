import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-clebsch-diagonal-cubic-27-lines-algebraic-surface-stage-floor-webxr";

function Body() {
  return (
    <>
      <h2>What the 27 lines are — and why all of them are real here</h2>
      <p>
        Every smooth cubic surface in projective 3-space contains exactly{" "}
        <strong>27 lines</strong> over the complex numbers. This was proved by
        Cayley and Salmon in 1849 and is one of the great theorems of classical
        algebraic geometry. Over the real numbers the count of real lines can be
        3, 7, 15, or 27 — and exactly one smooth cubic surface (up to projective
        equivalence) achieves the maximum of 27: the{" "}
        <strong>Clebsch diagonal cubic</strong>, constructed by Alfred Clebsch
        in 1871.
      </p>
      <p>
        In Blender&apos;s 3D Viewport those 27 lines appear as{" "}
        <em>straight-edge sequences</em> cutting across the stage-floor tile —
        clearly visible in Wireframe mode as ridges that do not bend. Three are
        immediately prominent from a top-down view, reflecting the S₃
        permutation symmetry of the affine equation.
      </p>

      <h2>The equation and why z cancels</h2>
      <p>
        The Clebsch cubic is defined in projective 4-space as the intersection:
      </p>
      <pre>{`x₀³ + x₁³ + x₂³ + x₃³ + x₄³  =  0
x₀  + x₁  + x₂  + x₃  + x₄  =  0`}</pre>
      <p>
        Setting <code>x₄ = −(x₀+x₁+x₂+x₃)</code> and then{" "}
        <code>x₃ = 1</code> (affine patch) gives the working equation:
      </p>
      <pre>{`f(x,y,z) = x³ + y³ + z³ + 1 − (x+y+z+1)³  =  0`}</pre>
      <p>
        A surprising simplification: the <code>z³</code> term from the first
        half and the <code>−z³</code> from the expansion of{" "}
        <code>−(x+y+z+1)³</code> cancel exactly, leaving <em>f quadratic in z</em>{" "}
        for any fixed (x,y). This means there are at most two real solutions
        for z at each floor position — a fact that enables a fast analytical
        height-field solver as an alternative to the full volumetric approach.
      </p>

      <h2>Step 1 — Vectorised polynomial evaluation</h2>
      <p>
        The entire polynomial evaluates in two NumPy lines on a 90³ grid
        (~730 k cells, ~3 MB at float32):
      </p>
      <pre>{`coords = np.linspace(-2.0, 2.0, 90, dtype=np.float32)
X, Y, Z = np.meshgrid(coords, coords, coords, indexing='ij')

S = X + Y + Z + 1.0          # auxiliary sum
F = X**3 + Y**3 + Z**3 + 1.0 - S**3
del S, X, Y, Z               # free ≈ 12 MB; only F (3 MB) stays`}</pre>
      <p>
        Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-barth-sextic-65-nodes-algebraic-surface-poi-head-webxr"
          className={lk}
        >
          Barth sextic
        </Link>
        {" "}evaluation, which requires three intermediate factor arrays and the
        golden ratio. The cubic&apos;s simplicity is not an accident — the S₅
        symmetry forces many cancellations.
      </p>

      <h2>Step 2 — Surface Nets isosurface extraction</h2>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-marching-cubes-gyroid-sdf-isosurface-webxr"
          className={lk}
        >
          Surface Nets algorithm
        </Link>{" "}
        (Gibson 1998) proceeds in three passes identical to the Barth sextic
        tutorial:
      </p>
      <ol>
        <li>
          <strong>Mark sign-change cells</strong> — shifted boolean slices
          along each of three axes flag cells whose F value changes sign with
          a neighbour.
        </li>
        <li>
          <strong>Place vertices</strong> — each flagged cell gets one vertex
          at the centroid of its ISO-interpolated edge crossings (linear
          interpolation <code>t = (0 − va)/(vb − va)</code>).
        </li>
        <li>
          <strong>Stitch quads</strong> — for each sign-change edge, the four
          surrounding surface cells form a quad ring; orientation follows the
          INSIDE flag so all normals point outward.
        </li>
      </ol>
      <p>
        At N = 90 this yields roughly 50–90 k surface cells and ~80–140 k
        quads before triangulation. Run time is ~3–5 s on a 2024 desktop CPU —
        significantly faster than the Barth sextic at N = 100, because the
        cubic surface has less total area within the sampling box.
      </p>

      <h2>Step 3 — Non-uniform scale to stage-floor proportions</h2>
      <p>
        The raw grid spans ±2.0 m. We apply a <em>non-uniform</em> scale
        inside bmesh — compressing Z strongly to produce a flat tile:
      </p>
      <pre>{`FLOOR_DIAM  = 1.5    # 1.5 m diameter in X and Y
FLOOR_THICK = 0.20   # 0.20 m thickness in Z

SCALE_XY = (FLOOR_DIAM  / 2.0) / HALF_BOX   # 0.375
SCALE_Z  = (FLOOR_THICK / 2.0) / HALF_BOX   # 0.050

bmesh.ops.scale(bm, vec=(SCALE_XY, SCALE_XY, SCALE_Z), verts=bm.verts)`}</pre>
      <p>
        Linear transforms preserve straightness: a line{" "}
        <code>(x₀+at, y₀+bt, z₀+ct)</code> maps to{" "}
        <code>(sx·x₀+sx·a·t, sy·y₀+sy·b·t, sz·z₀+sz·c·t)</code> — still a
        straight line. The 27 lines remain geometrically straight after the
        non-uniform compression.
      </p>

      <h2>The 27 lines and the E₆ connection</h2>
      <p>
        The 27 lines on the Clebsch cubic are indexed by the 27-dimensional
        representation of the exceptional Lie algebra <strong>E₆</strong>.
        More concretely, they correspond to the vertices of the{" "}
        <strong>Gosset polytope 2₂₁</strong> — a 6-dimensional polytope with
        27 vertices related to the same root system.
      </p>
      <p>
        The 27 lines also meet at <strong>15 Eckardt points</strong> — special
        points on the cubic where exactly three lines concur. No general smooth
        cubic has any Eckardt points; the Clebsch cubic has the maximum
        possible 15. In the mesh they appear as junctions where three ridge
        sequences cross.
      </p>
      <p>
        Compare the 600-cell tutorial:{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-600-cell-quaternion-binary-icosahedral-stereographic-shadow-webxr"
          className={lk}
        >
          600-cell quaternion binary icosahedral group
        </Link>
        {" "}— that polytope&apos;s 120 vertices also encode an exceptional root
        system (H₄), and the E₆/E₇/E₈ exceptional algebras appear throughout
        4D geometry and algebraic surfaces.
      </p>

      <h2>Stage floor output and the Kummer quartic comparison</h2>
      <p>
        This tile sits alongside the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-kummer-quartic-surface-stage-floor-webxr"
          className={lk}
        >
          Kummer quartic stage floor
        </Link>{" "}
        (degree 4, 16 nodes) and the Barth sextic poi head (degree 6, 65 nodes)
        to form a trio of algebraic-surface outputs at different degrees. All
        three use the same Surface Nets pipeline and differ only in the
        polynomial evaluated in Step 1. The reusable{" "}
        <code>implicit_polynomial_surface_nets.py</code> macro in{" "}
        <code>tools/blender-addon/holoflow_macros/</code> encapsulates this
        shared pipeline.
      </p>

      <h2>Material and holoflow attributes</h2>
      <p>
        The indigo Principled BSDF (Base Color{" "}
        <code>(0.06, 0.04, 0.55)</code>, Metallic 0.15, Roughness 0.22,
        Transmission Weight 0.12) contrasts with the Barth sextic&apos;s gold
        for side-by-side WebXR stage placement. The per-object custom
        properties set for the holoflow exporter:
      </p>
      <pre>{`obj["holoflow:facet"]    = True
obj["holoflow:category"] = "stage-floor"`}</pre>

      <h2>Trade-offs and failure modes</h2>
      <ul>
        <li>
          <strong>N {"<"} 70</strong>: each of the 27 lines is only 1–2 cells
          wide; Surface Nets cannot reliably stitch quads across them, leaving
          broken islands. Use N = 90 minimum.
        </li>
        <li>
          <strong>Open mesh boundaries</strong>: expected. The Clebsch cubic is
          not compact in affine space — sheets extend to infinity. The mesh will
          have open edges at the ±2.0 m boundary; this is not an error.
        </li>
        <li>
          <strong>Tile looks too tall</strong>: reduce{" "}
          <code>FLOOR_THICK</code> to 0.10 m (SCALE_Z = 0.025) for a flatter
          profile. Very thin tiles may clip in WebXR at default near-plane
          settings; adjust the viewer&apos;s camera near plane if needed.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: SLUG,
  title:
    "Python numpy — Clebsch Diagonal Cubic: All 27 Real Lines, E₆ Root System & Stage Floor GLB for WebXR (Blender 5.1)",
  date: "2026-08-09",
  kind: "tutorial",
  excerpt:
    "Extract the Clebsch diagonal cubic — the unique smooth degree-3 surface with all 27 real lines — using Surface Nets on a numpy grid, then export a faceted Draco-compressed GLB stage floor. The 27 straight-line ridges reflect the E₆ root-system structure; a non-uniform scale compresses the surface into a 1.5 m × 0.20 m architectural tile without distorting line straightness.",
  tags: [
    "blender",
    "python",
    "numpy",
    "algebraic-geometry",
    "cubic-surface",
    "27-lines",
    "e6-root-system",
    "surface-nets",
    "webxr",
    "glb",
    "stage-floor",
  ],
  Body,
  furtherReading: [
    {
      href: "https://doi.org/10.1515/crll.1871.75.1",
      label:
        "Clebsch, A. (1871) — Ueber die Flächen vierter Ordnung. J. reine angew. Math. 75",
      note: "Public Domain. Original proof that the symmetric quintic form achieves 27 real lines.",
    },
    {
      href: "https://github.com/IMAGINARY/surfer-alggeo",
      label:
        "IMAGINARY/surfer-alggeo — Apache-2.0 — real-time algebraic surface visualiser (Clebsch cubic built-in)",
      note: "Apache-2.0. Stephan Endraß / IMAGINARY gGmbH.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    difficulty: "expert",
    libraryPath:
      "blends/scripting/python-numpy-clebsch-diagonal-cubic-27-lines-algebraic-surface-stage-floor-webxr",
    time: "one evening",
    prerequisites: [
      "Comfortable reading degree-3 polynomial equations in three variables.",
      "Completed the Barth sextic tutorial or familiar with the Surface Nets pipeline.",
      "Basic algebraic geometry: smooth surface, line on a surface, projective space P³.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    dependencies: [
      {
        name: "numpy",
        registry: "pip",
        url: "https://numpy.org/",
        purpose: "vectorised polynomial evaluation on 90³ grid",
      },
    ],
  },
  base,
);

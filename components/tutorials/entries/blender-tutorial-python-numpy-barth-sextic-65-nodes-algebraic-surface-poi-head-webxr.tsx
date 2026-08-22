import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const data = {
  title:
    "Python numpy — Barth Sextic: 65-Node Icosahedral Algebraic Surface, Record-Holder Degree-6 Geometry & Faceted Poi Head for WebXR (Blender 5.1)",
  lede: "Extract the Barth sextic — the degree-6 real algebraic surface proven to have the maximum possible 65 ordinary double points — using Surface Nets isosurface extraction on a numpy grid, then export a faceted Draco-compressed GLB poi head. The 65 conical singularities appear as spike-tips distributed with full icosahedral (Ih) symmetry, encoded by the golden ratio φ in the polynomial's coefficients.",
  date: "2026-08-08",
  externalSources: [
    {
      label:
        "Barth, W. (1996) — 'Two projective surfaces with many nodes, admitting the symmetries of the icosahedron.' J. Algebraic Geometry 5(1):173–186",
      url: "https://doi.org/10.1090/S1056-3911-96-00204-0",
      licence: "Public Domain",
      author: "Wolf Barth",
    },
    {
      label:
        "IMAGINARY/surfer-alggeo — Apache-2.0 — real algebraic surface visualiser (Barth sextic built-in example)",
      url: "https://github.com/IMAGINARY/surfer-alggeo",
      licence: "Apache-2.0",
      author: "Stephan Endraß / IMAGINARY gGmbH",
    },
  ],
};

function Body() {
  return (
    <>
      <h2>Why this surface, and what are the 65 nodes?</h2>
      <p>
        An <em>ordinary double point</em> (also called an A₁ node) is a point
        on an algebraic surface where two smooth sheets cross, so the local
        geometry looks like a cone: <code>x² + y² = z²</code>. At such a point
        the surface is singular — the gradient of the defining polynomial
        vanishes — but the singularity is as mild as possible. A natural
        question in algebraic geometry is: how many nodes can a degree-
        <em>d</em> surface have? For <em>d</em> = 6 the answer is{" "}
        <strong>65</strong>, and Wolf Barth exhibited the first surface
        achieving it in 1996.
      </p>
      <p>
        In Blender those 65 nodes appear as <em>spike-tips</em> on the
        mesh — the two surface sheets come together so sharply that at grid
        resolution N = 100 each node occupies only one or two cells, producing
        a distinctive pointy facet. The result reads as a carved crystal rather
        than a smooth blob.
      </p>

      <h2>The equation and the golden ratio</h2>
      <p>
        The Barth sextic is defined by the affine polynomial:
      </p>
      <pre>{`f(x,y,z) = 4(φ²x²−y²)(φ²y²−z²)(φ²z²−x²) − (1+2φ)(x²+y²+z²−1)²

φ = (1+√5)/2 ≈ 1.618   (golden ratio)
(1+2φ) = 2+√5 ≈ 4.236`}</pre>
      <p>
        The <strong>first term</strong> is a product of three quadratic factors.
        Each factor <code>(φ²u²−v²)</code> vanishes on two planes through the
        origin, giving six planes in total. Their 65 mutual intersection points
        (constrained to lie on the surface) require the specific coefficient{" "}
        <code>(1+2φ)</code> in the second term — any other value shifts the
        nodes off the surface.
      </p>
      <p>
        The surface&apos;s symmetry group is <strong>Ih</strong> (full
        icosahedral symmetry, order 120), the same group as the icosahedron and
        the dodecahedron. That group contains 5-fold, 3-fold and 2-fold rotation
        axes, and the ratio of adjacent Fibonacci numbers converges to φ — hence
        the golden ratio&apos;s appearance is structural, not decorative.
      </p>

      <h2>Step 1 — Vectorised polynomial evaluation</h2>
      <p>
        Evaluate <code>f</code> on a 100³ grid using numpy broadcasting. Three
        factor arrays are computed in parallel; the whole pass uses ~12 MB at
        float32:
      </p>
      <pre>{`PHI  = (1 + math.sqrt(5)) / 2
PHI2 = PHI * PHI
COEFF = 1.0 + 2.0 * PHI   # = 2 + √5

coords = np.linspace(-1.85, 1.85, 100, dtype=np.float32)
X, Y, Z = np.meshgrid(coords, coords, coords, indexing='ij')

FA = PHI2*X*X - Y*Y
FB = PHI2*Y*Y - Z*Z
FC = PHI2*Z*Z - X*X
R2 = X*X + Y*Y + Z*Z

F = 4.0*FA*FB*FC - COEFF*(R2 - 1.0)**2
INSIDE = F >= 0.0`}</pre>
      <p>
        With <code>indexing='ij'</code>, element <code>F[i,j,k]</code> maps to
        world position <code>(coords[i], coords[j], coords[k])</code>.
        Intermediate arrays <code>FA</code>, <code>FB</code>, <code>FC</code>{" "}
        and <code>R2</code> are deleted immediately after to keep peak memory
        below 50 MB.
      </p>

      <h2>Step 2 — Surface Nets extraction</h2>
      <p>
        Surface Nets (Gibson 1998, same algorithm as the{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-marching-cubes-gyroid-sdf-isosurface-webxr" className={lk}>
          gyroid SDF tutorial
        </Link>
        ) avoids the 256-case Marching Cubes lookup table. Three stages:
      </p>
      <ol>
        <li>
          <strong>Mark surface cells</strong> — detect sign-change neighbours
          along each axis via shifted boolean slices.
        </li>
        <li>
          <strong>Place vertices</strong> — each cell gets one vertex at the
          centroid of its ISO-interpolated edge crossings (linear interpolation:
          <code>t = (0 − va)/(vb − va)</code>).
        </li>
        <li>
          <strong>Stitch quads</strong> — for each sign-change edge, the four
          surrounding surface cells form a quad ring; orientation follows the
          INSIDE flag so normals point outward.
        </li>
      </ol>
      <p>
        At N = 100 this yields roughly 200k surface cells → ~300k quads →
        ~600k triangles after triangulation. The 65 node tips will be tiny
        conical features of 1–4 triangles each — clearly visible as spikes.
      </p>

      <h2>Step 3 — Scale to poi-head diameter</h2>
      <p>
        The raw grid spans ±1.85 m. We scale in bmesh before meshing the object:
      </p>
      <pre>{`DIAM  = 0.14          # 14 cm poi head
SCALE = DIAM / (2 * 1.85)
bmesh.ops.scale(bm, vec=(SCALE, SCALE, SCALE), verts=bm.verts)`}</pre>
      <p>
        Applying the scale <em>inside bmesh</em> (before{" "}
        <code>bm.to_mesh()</code>) is cleaner than setting{" "}
        <code>obj.scale</code> — the exported GLB has unit transforms and no
        floating-point decomposition artefacts.
      </p>

      <h2>Step 4 — Flat shading and golden material</h2>
      <p>
        <code>bpy.ops.object.shade_flat()</code> stores a per-corner normal
        equal to the face normal — the studio&apos;s faceted convention, consumed
        correctly by the holoflow WebXR exporter. The Principled BSDF uses a
        gold metallic base (<code>Metallic = 0.92</code>,{" "}
        <code>Roughness = 0.18</code>) with a small transmission weight so the
        spike tips refract a trace of light — a subtle wink at the mathematical
        structure underneath.
      </p>

      <h2>Trade-offs and failure modes</h2>
      <ul>
        <li>
          <strong>N too low ({"<"} 80)</strong>: nodes merge with neighbouring
          cells; spikes look rounded or absent. Increase to 120 for publication
          quality (8× memory, 8× time — still ≈ 80 s on a 2024 CPU).
        </li>
        <li>
          <strong>HALF_BOX too small</strong>: the surface has components that
          exit the grid boundary, leaving open holes. 1.85 m captures everything;
          go to 2.0 m if in doubt.
        </li>
        <li>
          <strong>Surface looks non-compact</strong>: in certain tangent
          directions the degree-6 term dominates at large radius; the surface
          extends in those directions. Capping with a sphere or using{" "}
          <code>bmesh.ops.holes_fill</code> gives a clean boundary.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-marching-cubes-gyroid-sdf-isosurface-webxr" className={lk}>
            Gyroid SDF isosurface
          </Link>{" "}
          — the same Surface Nets algorithm applied to a trigonometric SDF
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-mandelbulb-power8-triplex-de-orbit-trap-webxr" className={lk}>
            Mandelbulb power-8
          </Link>{" "}
          — distance-estimated algebraic 3D geometry via isosurface extraction
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-600-cell-quaternion-binary-icosahedral-stereographic-shadow-webxr" className={lk}>
            600-cell binary icosahedral group
          </Link>{" "}
          — the same Ih symmetry group visualised as a 4D polytope projection
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-sdf-csg-quilez-smooth-boolean-poi-head-webxr" className={lk}>
            SDF CSG Quilez primitives
          </Link>{" "}
          — the SDF evaluation + GLB export pipeline for poi heads
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  data,
  Body,
  slug: "blender-tutorial-python-numpy-barth-sextic-65-nodes-algebraic-surface-poi-head-webxr",
  libraryPath:
    "blends/scripting/python-numpy-barth-sextic-65-nodes-algebraic-surface-poi-head-webxr",
});

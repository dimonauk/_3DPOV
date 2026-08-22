import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-mandelbulb-power8-triplex-algebra-white-nylander-fractal-poi-head-webxr";

const TITLE =
  "Python numpy — Mandelbulb Power-8: White–Nylander Triplex Algebra, Smooth Escape-Time, Marching Tetrahedra & Sphere↔Bulb Shape-Key Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Mandelbulb is the first convincing 3D analogue of the Mandelbrot set, constructed using the triplex power operation: for a vector z=(x,y,z) written in spherical coordinates (r,θ,φ), the n-th power is z^n = r^n·(sin nθ·cos nφ, sin nθ·sin nφ, cos nθ). Iterating z_{k+1} = z_k^8 + c from z_0=(0,0,0) and testing escape against |z|>2 yields an implicit fractal solid whose isosurface at the smooth iteration count threshold is extracted by marching tetrahedra on a NumPy-vectorised 26³ grid. The result is a bulbous poi head with eight equatorial lobes, a polar crown, and filaments that become arbitrarily fine as MAX_ITER increases. A Sphere↔Mandelbulb shape key lets the recording show the fractal emerging from a perfect sphere.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-15",
  externalSources: [
    {
      label:
        "White D & Nylander P (2007–2009) Triplex Mandelbulb — Fractalforums.com. PD mathematical description. White introduced the triplex power operation in November 2007; Nylander provided the explicit spherical-coordinate formulation and the n=8 parameterisation that produces the canonical eight-lobed bulb. The thread also contains the first rendered images. The mathematical description is factual (PD). Related: Mandelbrot B (1982) The Fractal Geometry of Nature (Freeman); Julia set iteration theory; Douady A & Hubbard J (1982) Itération des polynômes quadratiques complexes CRAS Paris 294; Munafo R — Mandelbrot Set Glossary (CC0) https://mrob.com/pub/muths/; Hart JC (1994) Sphere Tracing ray-marching (related rendering technique) WSCG 1994.",
      url: "https://www.fractalforums.com/3d-fractal-generation/true-3d-mandlebrot-type-fractal/",
      licence: "PD (mathematical description, no code copied)",
      author: "Daniel White, Paul Nylander",
    },
    {
      label:
        "Quílez I 'Smooth Iteration Count for the Mandelbrot Set' — iquilezles.org. MIT licence. Iñigo Quílez derives the continuous colouring formula: smooth = i − log₂(log₂|z_escape|). Without this, the escape-time field has integer steps at the iso-threshold, producing banding artefacts on the isosurface. The log₂(log₂|z|) term cancels the geometric growth of |z| between iterations, so the field is C¹ (not just C⁰) across the boundary. The same formula generalises to any power n by replacing log₂ with log_n. Related: Quílez I 'Rendering Worlds With Two Triangles' SIGGRAPH 2008 (ray-marching techniques, MIT); Scape Software 'Mandelbulber v2' (GPL, NOT used here); KDE Spectacle fractals module; glslsandbox.com Mandelbulb shader collections.",
      url: "https://iquilezles.org/articles/mset_smooth/",
      licence: "MIT",
      author: "Iñigo Quílez",
    },
    {
      label:
        "NumPy Developers (2020) Array programming with NumPy. Nature 585:357–362. BSD-3-Clause — https://numpy.org. Uses: np.meshgrid + indexing='ij' for the 3D coordinate grid; np.arctan2 for θ and φ; vectorised power, sin, cos for triplex multiplication; np.clip for smooth iteration guard; np.log2 for Quílez colouring; np.stack for the 8-corner corner sub-fields; np.argwhere for sparse active-cell selection. Related: https://github.com/numpy/numpy; SciPy (BSD-3) for potential extension to distance-estimator DE(c) = |z|·ln|z|/(2|dz/dc|) to replace marching tetrahedra with sphere-tracing.",
      url: "https://numpy.org",
      licence: "BSD-3-Clause",
      author: "NumPy Developers",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        The Mandelbulb is named for the Mandelbrot set, but it is not a
        simple extension of it: the complex plane has a natural algebra
        (multiplication rotates and scales), whereas ℝ³ has no equivalent.
        The triplex operation is an{" "}
        <em>ad hoc</em> choice of angle-doubling in spherical coordinates —
        aesthetically powerful but not algebraically closed in the way ℂ is.
        That gap is what makes it interesting to study: the shape is not
        the &ldquo;true&rdquo; 3D Mandelbrot set (which likely does not exist
        for a simple formula), but it is the most visually compelling candidate
        found so far.
      </p>

      <h2>The triplex power operation</h2>
      <p>
        Write any vector z = (x, y, z) ∈ ℝ³ in spherical coordinates:
      </p>
      <p className="font-mono text-sm pl-4">
        r = √(x²+y²+z²)<br />
        θ = atan2(√(x²+y²), z)   ← polar angle from the +z axis (colatitude)<br />
        φ = atan2(y, x)           ← azimuthal angle in the xy-plane
      </p>
      <p>
        Then z^n is defined as the vector of magnitude r^n whose direction
        is obtained by multiplying both angles by n:
      </p>
      <p className="font-mono text-sm pl-4">
        z^n = r^n · ( sin(nθ)·cos(nφ),  sin(nθ)·sin(nφ),  cos(nθ) )
      </p>
      <p>
        At n=1 this is the identity. At n=2 it is the &ldquo;spherical
        squaring&rdquo; that produces the Mandelbrot set when restricted to
        the xz-plane with y=0. At n=8 — the canonical Mandelbulb power — the
        equatorial belt of the escape set acquires eight-fold rotational
        structure and the characteristic lobes appear.
      </p>
      <p>
        The operation is{" "}
        <em>not</em> associative in the way complex multiplication is:
        (z^2)^4 ≠ z^8 under this definition, because the angle-tripling
        rule distributes differently. This is why the Mandelbulb is not a
        true 3D Mandelbrot analogue — the algebra does not close.
      </p>

      <h2>Smooth escape-time colouring</h2>
      <p>
        The raw escape-time field is integer-valued: a point escapes at
        iteration 3 or at iteration 4, with a hard jump between them. That
        jump propagates to the isosurface as a discrete ridge — a visible
        step in the mesh. Iñigo Quílez&rsquo;s smooth colouring formula
        removes it:
      </p>
      <p className="font-mono text-sm pl-4">
        smooth = i − log₂( log₂|z_escape| )
      </p>
      <p>
        At the escape iteration i, the magnitude |z| has grown geometrically:
        |z| ≈ bail^(2^fractional part). The log₂(log₂|z|) term measures
        exactly that fractional growth and subtracts it, so the corrected value
        varies continuously between i and i+1 as the orbit crosses the bailout
        sphere from within. The result is a C¹ field, and the isosurface at
        threshold 0.5 is smooth rather than stepped.
      </p>
      <p>
        In the blueprint this is guarded with{" "}
        <code>r_esc.clip(1.001)</code> to prevent log of a value near 1 from
        returning near-zero, which would make the correction term blow up.
        The guard is safe because any point that actually crossed{" "}
        <code>bail = 2.0</code> has |z| ≥ 2.0, well clear of 1.001.
      </p>

      <h2>NumPy vectorisation strategy</h2>
      <p>
        A 26³ grid has 17,576 sample points. Evaluating the triplex iteration
        in a Python for-loop over those points (outer loop over voxels, inner
        over iterations) would take roughly two minutes. The blueprint instead
        keeps the{" "}
        <em>spatial</em> loop vectorised at all times and only iterates in the{" "}
        <em>time</em> direction:
      </p>
      <ol className="list-decimal pl-6 space-y-1">
        <li>
          Flatten the 3D grid into arrays{" "}
          <code>cx, cy, cz</code> of shape (17576,).
        </li>
        <li>
          Maintain <code>zx, zy, zz</code> (same shape) as the running
          orbit state.
        </li>
        <li>
          At each of the 14 iterations, apply the triplex formula with
          NumPy broadcasting across all 17,576 points simultaneously.
        </li>
        <li>
          Use a boolean mask <code>trapped</code> to exclude already-escaped
          points from further computation.
        </li>
      </ol>
      <p>
        The <code>trapped</code> mask is critical: once a point escapes at
        iteration 3, it must not be re-evaluated at iterations 4–14, because
        the magnitude will have grown so large that floating-point overflow
        corrupts the smooth colouring. The mask also speeds up later
        iterations, since fewer points remain trapped.
      </p>

      <h2>Marching tetrahedra</h2>
      <p>
        The isosurface algorithm follows the same marching-tetrahedra kernel
        used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-schwarz-p-d-gyroid-tpms-marching-tets-poi-webxr"
          className={lk}
        >
          Schwarz P / Gyroid / D TPMS tutorial
        </Link>
        : each voxel cube is split into six tetrahedra sharing the
        body-diagonal edge v₀=(0,0,0)→v₆=(1,1,1). For each tetrahedron,
        count how many of the four vertices are &ldquo;inside&rdquo; (field
        &lt; ISO = 0.5). The four topological cases (0, 1, 2, 3 vertices
        inside) produce 0, 1, 2, or 1 triangles via linear edge interpolation.
      </p>
      <p>
        The sparse active-cell filter (<code>np.argwhere</code> on the
        per-cell min/max bracket) avoids processing the ~85% of cells that
        are entirely inside or entirely outside the fractal, which would
        contribute zero triangles. On a 26-grid this cuts the marching loop
        from ~25,000 cells to ~3,000–4,000 active cells.
      </p>

      <h2>Shape keys: Sphere → Mandelbulb</h2>
      <p>
        Both shape keys use the same vertex count — the marching-tetrahedra
        mesh. The Basis shape key places each vertex at{" "}
        <code>direction_from_origin × POI_RADIUS</code>: every vertex is
        projected radially outward to a sphere. The Mandelbulb key uses the
        actual extracted positions. Because the vertex topology (and the
        face-to-vertex connectivity) is fixed across all shape keys, Blender
        interpolates linearly between corresponding vertex pairs as the
        shape-key value moves from 0 to 1. The morph looks like the fractal
        erupting outward from a smooth sphere — an effective teaching device
        for showing where the lobes and filaments actually live relative to
        the enclosing sphere.
      </p>

      <h2>Implementation steps</h2>
      <ol className="list-decimal pl-6 space-y-1">
        <li>
          <strong>Field:</strong>{" "}
          <code>mandelbulb_field(N, EXTENT, POWER, MAX_ITER, BAIL)</code> →
          scalar field (26, 26, 26). Trapped points = 0; escaped = smooth
          iteration count ≥ 1.
        </li>
        <li>
          <strong>Isosurface:</strong>{" "}
          <code>extract_isosurface(field, N, EXTENT, ISO=0.5)</code> →
          <code>raw_verts (V,3)</code>, <code>raw_faces list</code>.
        </li>
        <li>
          <strong>Scale:</strong>{" "}
          <code>2 × POI_RADIUS / ptp_max</code> maps the bounding box to
          the poi diameter.
        </li>
        <li>
          <strong>Basis shape key:</strong> project each vertex to radius
          POI_RADIUS (<code>dirs × POI_RADIUS</code>). Create mesh from
          sphere positions using <code>mesh.from_pydata</code>.
        </li>
        <li>
          <strong>Mandelbulb shape key:</strong>{" "}
          <code>ob.shape_key_add(name="Mandelbulb")</code> then{" "}
          <code>sk_bulb.data[vi].co = Vector(pos)</code> for each vertex.
        </li>
        <li>
          <strong>Vertex colour:</strong> z-height → HSV manual computation
          (hue 0.66 violet at bottom → 0.0 red at top), written to{" "}
          <code>mesh.color_attributes["Col"]</code> (BYTE_COLOR, POINT domain).
        </li>
        <li>
          <strong>Material:</strong> ShaderNodeAttribute → ShaderNodeEmission
          at strength 3.0. <code>mat.shadow_method = "NONE"</code>.
        </li>
        <li>
          <strong>Export:</strong>{" "}
          <code>export_apply=False</code> (shape keys must not be baked),{" "}
          <code>export_morph=True</code>, Draco level 6, WebP.
        </li>
      </ol>

      <h2>Key parameters and their effects</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>POWER=8</strong> — the canonical Mandelbulb; eight equatorial
          lobes, polar crown. At POWER=4 the surface becomes a cauliflower-like
          form; at POWER=12 the filaments are finer but the basic lobe count
          does not change.
        </li>
        <li>
          <strong>MAX_ITER=14</strong> — more iterations reveal finer detail
          near the boundary but increase computation time linearly. Below 8,
          the surface is noticeably inflated (large near-miss orbits are
          included as trapped); above 20, diminishing returns on a 26³ grid.
        </li>
        <li>
          <strong>N=26</strong> — the marching grid. Increase to 32 for a
          finer mesh (~2× more active cells, ~4× more triangles). Decrease to
          20 for prototyping (~3× faster). The marching-tetrahedra loop is
          O(N³) in the worst case but O(surface area) in the sparse-cell
          approximation.
        </li>
        <li>
          <strong>ISO=0.5</strong> — the isosurface threshold. Increasing it
          slightly (0.7–1.0) inflates the surface inward; decreasing it
          contracts it, revealing more filament tips. Below 0.3 the surface
          becomes very thin and may have holes at the grid resolution.
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>No vertices extracted:</strong> check that the{" "}
          <code>trapped fraction</code> printout is in the range 0.3–0.6.
          Below 0.2 suggests the grid does not enclose the Mandelbulb (reduce
          EXTENT or increase the bailout test). Above 0.7 suggests MAX_ITER is
          too low.
        </li>
        <li>
          <strong>Smooth colouring shows banding:</strong> the{" "}
          <code>np.log2(np.log2(r_esc.clip(1.001)))</code> guard may be
          triggering because some escaped points have |z| very close to bail.
          Increase BAIL to 2.5 or add one extra iteration after escape is
          detected to let |z| grow further before sampling.
        </li>
        <li>
          <strong>Shape keys disappear after GLB round-trip:</strong> confirm{" "}
          <code>export_morph=True</code> and{" "}
          <code>export_apply=False</code>. In Three.js, set{" "}
          <code>mesh.morphTargetInfluences[1] = 1.0</code> (index 1 =
          Mandelbulb key) to activate the morph target on load.
        </li>
        <li>
          <strong>Vertex colours black in WebXR:</strong> the GLB shader must
          read the <code>COLOR_0</code> attribute and route it to the emissive
          input. In Three.js: <code>material.vertexColors = true</code> and
          use <code>MeshBasicMaterial</code> or a custom GLSL shader that
          samples <code>vColor</code>.
        </li>
        <li>
          <strong>Script takes more than 30 seconds:</strong> the NumPy
          vectorisation should run in &lt;2 s on modern hardware for N=26.
          Slow execution usually means an import error caused Python to fall
          back to a pure-Python fallback for NumPy ops. Check{" "}
          <code>import numpy; numpy.__version__</code> in the Blender console.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <p>
        The marching-tetrahedra isosurface extraction in this tutorial uses
        the same Doi–Koide body-diagonal decomposition as the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-schwarz-p-d-gyroid-tpms-marching-tets-poi-webxr"
          className={lk}
        >
          Schwarz P / Gyroid / Schwarz D TPMS tutorial
        </Link>
        {" "} — the code is re-exported to{" "}
        <code>tools/blender-addon/holoflow_macros/mandelbulb_field.py</code>{" "}
        for reuse across future fractal entries. The escape-time iteration
        pattern is the same chaotic-orbit approach used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
          className={lk}
        >
          Lorenz attractor tutorial
        </Link>
        {" "} — both deal with orbits that may escape to infinity depending on
        initial conditions, though Lorenz uses an ODE integrator rather than
        an algebraic iteration. The recursive self-similar geometry of the
        Mandelbulb surface shares structural kinship with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-apollonian-gasket-descartes-circle-theorem-inversive-geometry-poi-disc-webxr"
          className={lk}
        >
          Apollonian gasket tutorial
        </Link>
        {" "} — both are fractals built by repeated application of an inversion
        rule (Möbius vs. triplex). The Grey-Scott reaction-diffusion tutorial
        also uses a scalar-field-on-a-grid approach to generate organic forms;
        see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-morphogenesis-poi-sphere-webxr"
          className={lk}
        >
          Turing morphogenesis tutorial
        </Link>
        {" "} for comparison of the two field-generation strategies.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  ...data,
  slug: SLUG,
  body: <Body />,
  libraryPath:
    "blends/scripting/python-numpy-mandelbulb-power8-triplex-algebra-white-nylander-fractal-poi-head-webxr",
});

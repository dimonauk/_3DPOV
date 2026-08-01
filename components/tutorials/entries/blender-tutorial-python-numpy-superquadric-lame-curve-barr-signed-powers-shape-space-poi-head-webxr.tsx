import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-superquadric-lame-curve-barr-signed-powers-shape-space-poi-head-webxr";

const TITLE =
  "Python numpy — Superquadric Surfaces: Barr Signed Powers, Lamé Curve Extension & Shape-Space Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Alan Barr's 1981 paper extended the 2D Lamé curve |x|^n + |y|^n = 1 to a full 3D parametric surface using two independent exponents (e1, e2) and a signed-power function fexp(s,e)=sgn(s)·|s|^e. Because every (e1,e2) parameterisation shares the same grid topology, a single Blender mesh can carry the entire shape space as glTF morph targets — animating smoothly from sphere to cube to eight-pointed star to cylindrical pillow, all from one Python script.";

function Body() {
  return (
    <>
      <p>
        Grab a poi head and look at it closely. It&rsquo;s a sphere — but a
        sphere is just one point in a much larger space of shapes. Alan Barr
        identified this space in 1981 and gave it a clean parameterisation: the{" "}
        <em>superquadric</em>. Two numbers (e1, e2) control the shape
        continuously from concave star through sphere through pillow cube through
        flat disc. Because every point in this space uses the same vertex grid,
        you can load all the shapes into Blender as Shape Keys and let WebXR
        interpolate between them in real time — a morphing poi head that cycles
        through its own design space.
      </p>

      <h2>The Lamé curve and its 3D extension</h2>
      <p>
        Gabriel Lamé wrote the family of 2D curves |x/a|^n + |y/b|^n = 1 in
        1818. At n=2 it is an ellipse; as n→∞ it approaches a rectangle; at
        n=1 it is a diamond; at n=0.5 it is a four-pointed astroid. Barr&rsquo;s
        insight was to extend this to a 3D parametric surface by treating the
        latitude and longitude cross-sections as independent Lamé curves, each
        with its own exponent. The result is:
      </p>
      <pre><code>{`x = r · fexp(cos v, e1) · fexp(cos u, e2)
y = r · fexp(cos v, e1) · fexp(sin u, e2)
z = r · fexp(sin v, e1)

fexp(s, e) = sgn(s) · |s|^e   # signed power`}</code></pre>
      <p>
        where u ∈ [−π, π] is longitude and v ∈ [−π/2, π/2] is latitude. The
        exponent e1 controls how the surface curves from equator to pole (the
        north-south profile); e2 controls the equatorial cross-section. At
        (e1, e2) = (1, 1) you get a perfect sphere. At (0.2, 0.2) the surface
        approaches a cube (each face flattens out). At (2.5, 2.5) each face
        buckles inward and you get an eight-pointed star.
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-scipy-spherical-voronoi-lloyd-cvt-faceted-poi-head-webxr"
          className={lk}
        >
          Centroidal Voronoi Tessellation tutorial
        </Link>{" "}
        builds a poi head by subdividing the sphere into irregular facets via
        Lloyd relaxation. That approach fixes topology to the Voronoi diagram.
        The superquadric approach fixes topology to a regular latitude-longitude
        grid and instead varies the <em>shape</em> of that grid by moving every
        vertex in the radial direction — perfect for morph targets.
      </p>

      <h2>Why the signed power, not a plain power</h2>
      <p>
        The naive implementation uses <code>cos(v)**e1</code>. This fails at
        v=π because cos(π) is negative and a negative base raised to a
        fractional power is undefined in the reals (Python and NumPy both return
        NaN or raise). The fix is the signed power:
      </p>
      <pre><code>{`def _fexp(s, e):
    return np.sign(s) * np.abs(s) ** e`}</code></pre>
      <p>
        This maps each value to a positive absolute value, applies the power,
        then restores the sign. At e=1 it is exactly s. As e→0 it approaches
        sgn(s), which is why small e values produce cube-like shapes: each
        cosine/sine quickly saturates to ±1 and the surface becomes flat. As e
        grows beyond 1, the power amplifies the curvature near 0 and compresses
        it near ±1 — which is why large e values produce concave (star) shapes.
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-catmull-clark-subdivision-from-scratch-valence-weight-poi-head-webxr"
          className={lk}
        >
          Catmull-Clark subdivision tutorial
        </Link>{" "}
        also deals with floating-point edge cases at extraordinary vertices;
        both tutorials share the lesson that numerical stability requires
        explicit handling of sign and magnitude rather than trusting the
        language&rsquo;s default power operator.
      </p>

      <h2>Shared topology makes shape keys valid</h2>
      <p>
        A Blender Shape Key stores an array of vertex positions of length equal
        to the base mesh. If you change the number of vertices, shape keys
        become invalid. The superquadric family avoids this: every (e1, e2)
        produces exactly the same number of vertices from the same (NU+1)×(NV+2)
        grid. Changing exponents moves vertices but never adds or removes them.
        That means every shape key is a valid morph target from the same base
        mesh.
      </p>
      <p>
        Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-spherical-harmonics-real-sh-shape-keys-atomic-orbital-webxr"
          className={lk}
        >
          Spherical Harmonics tutorial
        </Link>
        , which uses the same trick: a fixed icosphere grid, with each harmonic
        mode applied as a radial displacement shape key. The mathematical family
        determines which vertex moves how much; the topology stays constant.
        glTF morph targets work the same way — they store vertex deltas, not
        topology — so both tutorials export to exactly the same{" "}
        <code>primitives[0].targets</code> structure in the GLB file.
      </p>

      <h2>BMesh construction without bmesh.ops</h2>
      <p>
        The grid is built directly from <code>mesh.from_pydata()</code> with a
        hand-computed face list, rather than starting from a primitive and
        applying modifiers. This is faster (one allocation, no bpy.ops context
        overhead) and makes the vertex index arithmetic explicit:
      </p>
      <pre><code>{`for ri in range(n_lat - 1):
    for ci in range(n_lon - 1):
        a = ri * n_lon + ci
        b = ri * n_lon + ci + 1
        c = (ri + 1) * n_lon + ci + 1
        d = (ri + 1) * n_lon + ci
        faces.append((a, b, c, d))`}</code></pre>
      <p>
        The longitude column u[0] == u[−1] (both equal −π = π) intentionally
        duplicates the seam. This is correct for a sphere grid — the seam
        column is separate geometry. It produces a single sharp seam edge,
        which is invisible with flat shading and irrelevant for glTF export.
        If you want a perfectly welded seam, call{" "}
        <code>bmesh.ops.remove_doubles</code> with threshold 1e-5 after
        importing the mesh into a BMesh — but then you lose the clean array
        indexing for shape key assignment.
      </p>

      <h2>Shape key data path and glTF export</h2>
      <p>
        Adding shape keys from Python requires a specific sequence. First, call{" "}
        <code>obj.shape_key_add(name=&quot;Basis&quot;, from_mix=False)</code>{" "}
        to create the reference shape. Every subsequent key is relative to
        Basis. Set vertex positions directly:
      </p>
      <pre><code>{`sk = obj.shape_key_add(name="cube", from_mix=False)
for i, co in enumerate(verts_np):
    sk.data[i].co = (float(co[0]), float(co[1]), float(co[2]))`}</code></pre>
      <p>
        Using <code>from_mix=False</code> is essential — it prevents Blender
        from baking the current mix of other active shape keys into the new one.
        Without it, running the script a second time on a scene that already
        has morph weights set would produce corrupted keys.
      </p>
      <p>
        For glTF export, pass <code>export_morph=True</code>. This serialises
        shape keys as <code>primitives[0].targets</code> arrays in the GLB.
        Also pass <code>export_apply=False</code> — the shape key system lives
        on the mesh data-block, and applying modifiers would destroy it. This
        is the opposite of the pattern used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-scipy-thomas-cyclically-symmetric-attractor-labyrinth-chaos-poi-webxr"
          className={lk}
        >
          Thomas attractor tutorial
        </Link>
        , where <code>export_apply=True</code> was needed because NURBS curves
        must be tessellated before export.
      </p>

      <h2>Poi head design implications</h2>
      <p>
        For a physical poi head the exponent pair (e1, e2) controls the balance
        between two competing requirements. A sphere distributes impact evenly
        across its surface — good for durability. A cube concentrates stress at
        edges — bad for durability. But a pillow shape (e1=1, e2=0.2) keeps the
        top and bottom flat for easier LED placement while rounding the equator
        for impact absorption. The superquadric gives you a formal parameter
        to scan.
      </p>
      <p>
        For 3D-print toolpath planning, flat faces (small e) are preferable
        because the slicer generates fewer support structures. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-resin-msla-light-sculpture-nested-shell-led-cavity-tir-drainage"
          className={lk}
        >
          Resin MSLA Light Sculpture tutorial
        </Link>{" "}
        covers hollowing and drainage holes; a superquadric outer shell with
        e1=e2=0.3 gives a cube-ish body that prints with minimal bridging on an
        Elegoo Saturn.
      </p>

      <h2>Step-by-step bench notes</h2>
      <ol>
        <li>
          Open Blender 5.1. Scripting workspace. New text block → open or paste
          <code>blueprint.py</code>.
        </li>
        <li>
          Set <code>OUT_DIR</code> to an absolute path on your machine (e.g.{" "}
          <code>/home/you/output</code> or <code>C:/output</code>).
        </li>
        <li>
          Run Script (Alt+P). Console should print five lines like:
          <code>[superquadric] done. shape keys: [&lsquo;Basis&rsquo;, &lsquo;cube&rsquo;, &lsquo;star&rsquo;, ...]</code>
        </li>
        <li>
          Properties → Object Data Properties → Shape Keys. Drag the{" "}
          <em>star</em> slider to 1.0 — the mesh should buckle inward on every
          face. Drag it back, then try <em>cube</em> — the mesh should flatten
          into a rounded cuboid.
        </li>
        <li>
          Open <code>record.py</code> in a second text block. Run it. This
          keyframes the morph sequence and renders the viewport animation
          (240 frames ≈ 8 s at 30 fps).
        </li>
      </ol>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>NaN in vertex positions:</strong> the signed-power function
          should prevent this, but check NumPy version — ensure{" "}
          <code>np.abs(s) ** e</code> is used, never <code>s ** e</code> on a
          raw array that may contain negative values.
        </li>
        <li>
          <strong>Shape keys look identical:</strong> confirm{" "}
          <code>from_mix=False</code> on every{" "}
          <code>shape_key_add</code> call. Also check that the correct{" "}
          <code>verts_np</code> array (with the correct e1, e2) is being passed
          — print <code>verts_np[:3]</code> for each key to verify the values
          differ.
        </li>
        <li>
          <strong>GLB morph targets missing in Three.js:</strong> inspect the
          file with{" "}
          <a
            href="https://gltf.report"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            gltf.report
          </a>{" "}
          — look for <code>primitives[0].targets</code>. If absent, re-export
          with <code>export_morph=True</code> and{" "}
          <code>export_apply=False</code>.
        </li>
        <li>
          <strong>Seam visible in rendered output:</strong> the longitude seam
          appears as a sharp edge because u[0] == u[−1] == −π creates
          duplicate vertices. Merge with{" "}
          <code>bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)</code>{" "}
          if you need a welded seam. Reconstruct shape key data after the merge
          by re-running the assignment loop (vertex indices shift).
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Barr, A. H. (1981). &ldquo;Superquadrics and angle-preserving
          transformations.&rdquo; <em>IEEE Computer Graphics and Applications</em>{" "}
          1(1):11–23.{" "}
          <a
            href="https://doi.org/10.1109/MCG.1981.1673799"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            doi:10.1109/MCG.1981.1673799
          </a>
          . Public-domain mathematics. Barr later extended superquadrics to
          deformable objects in &ldquo;Global and local deformations of solid
          primitives&rdquo; (SIGGRAPH 1984), also PD-mathematical. Related:
          the entire class of implicit superquadric surfaces used in robotics
          grasping (Jaklic, Leonardis &amp; Solina 2000,{" "}
          <a
            href="https://link.springer.com/book/10.1007/978-94-015-9444-2"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Segmentation and Recovery of Superquadrics
          </a>
          ).
        </li>
        <li>
          NumPy Developers. <em>NumPy — Fundamental package for scientific
          computing with Python</em>. BSD-3-Clause.{" "}
          <a
            href="https://numpy.org"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            numpy.org
          </a>
          . Related:{" "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/numpy/numpy
          </a>
          . The <code>np.sign</code> and <code>np.abs</code> ufuncs used in
          the signed-power function are vectorised C kernels — the entire
          vertex grid is computed in one NumPy call with no Python loop per
          vertex.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-08-01",
  tags: [
    "blender",
    "scripting",
    "python",
    "numpy",
    "superquadric",
    "shape-keys",
    "webxr",
    "poi",
  ],
  body: Body,
  libraryPath:
    "blends/scripting/python-numpy-superquadric-lame-curve-barr-signed-powers-shape-space-poi-head-webxr",
});

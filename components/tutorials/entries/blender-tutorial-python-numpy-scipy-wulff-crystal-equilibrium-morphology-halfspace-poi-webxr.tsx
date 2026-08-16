import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-scipy-wulff-crystal-equilibrium-morphology-halfspace-poi-webxr";

function Body() {
  return (
    <>
      <h2>What a crystal knows about energy</h2>
      <p>
        Grow a salt crystal slowly in solution and it forms a cube. Grow an alum
        crystal and you get an octahedron. Why does each material prefer its own
        shape? In 1901 Georg Wulff supplied the answer: a crystal in thermal
        equilibrium minimises total surface energy ∫ γ(n̂) dA for fixed volume,
        where γ(n̂) is the surface energy per unit area for a face with outward
        normal n̂. The equilibrium shape is not spherical — it reflects the
        crystal&apos;s symmetry and the relative cost of each family of atomic
        planes. The result is the{" "}
        <strong>Wulff construction</strong>, a convex body built from halfspace
        intersections.
      </p>
      <p>
        This tutorial builds a Blender 5.1 poi head that sweeps the full{" "}
        <strong>morphological phase diagram</strong> of a cubic crystal — cube,
        truncated cube, cuboctahedron, truncated octahedron, octahedron — as
        five shape keys driven by a single ratio d₁₁₁/d₁₀₀. The algorithm is
        a pure-numpy Wulff radius formula projected onto a fixed icosphere,
        keeping shape-key topology constant across all five morphologies.
      </p>
      <p>
        If convex-hull methods for curved surfaces interest you, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-scipy-oloid-convex-hull-schatz-1929-poi-head-webxr"
          className={lk}
        >
          Oloid (Schatz 1929)
        </Link>{" "}
        tutorial which wraps two perpendicular circles in a{" "}
        <code>scipy.spatial.ConvexHull</code>. For the dual picture — given a
        lattice, build its Wigner-Seitz cell — see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-scipy-wigner-seitz-bcc-fcc-brillouin-zone-3d-voronoi-poi-head-webxr"
          className={lk}
        >
          Wigner-Seitz / Brillouin zone
        </Link>{" "}
        tutorial. The Wulff construction is the{" "}
        <em>energy dual</em>: crystal → shape, whereas Wigner-Seitz is the{" "}
        <em>lattice dual</em>: lattice point → cell.
      </p>

      <h2>The Wulff theorem</h2>
      <p>
        Define the surface-energy function γ: S² → ℝ₊. The equilibrium crystal
        is the convex body whose <em>support function</em> equals γ:
      </p>
      <pre>{`W = ∩_{n̂ ∈ S²} { x ∈ ℝ³ : n̂·x ≤ γ(n̂) }`}</pre>
      <p>
        Every halfspace {"{"}x : n̂·x ≤ γ(n̂){"}"} has n̂ as its outward
        normal and is positioned at signed distance γ(n̂) from the origin. The
        intersection W is the <em>largest</em> convex body that fits inside all
        those halfspaces simultaneously.
      </p>
      <p>
        Pierre Curie had glimpsed the idea in 1885 (attributing shape to surface
        tension), but Wulff gave the sharp geometric statement and construction
        algorithm. The proof that W genuinely minimises surface energy at fixed
        volume was completed by Dinghas (1944) and Taylor (1978).
      </p>

      <h2>Oh symmetry: the three face families</h2>
      <p>
        A cubic crystal has the octahedral symmetry group O<sub>h</sub> of order
        48 (rotations + reflections of a cube). Within that group, γ is constant
        on orbits: all faces in the same {"{"}hkl{"}"} family share one energy
        value. The three families that dominate real fcc and bcc metals are:
      </p>
      <ul>
        <li>
          <strong>{"{100}"}</strong>: 6 halfspaces, unit normals (±1,0,0) etc.
          — cube faces, low packing density.
        </li>
        <li>
          <strong>{"{110}"}</strong>: 12 halfspaces, normals (±1,±1,0)/√2 etc.
          — rhombic dodecahedron faces.
        </li>
        <li>
          <strong>{"{111}"}</strong>: 8 halfspaces, normals (±1,±1,±1)/√3 —
          octahedron faces, close-packed planes in fcc metals.
        </li>
      </ul>
      <p>
        Setting d₁₁₀ ≫ d₁₀₀ removes the {"{110}"} family and leaves a clean
        two-parameter diagram. The critical ratios (derived by intersecting the
        two halfspace families at a shared edge) are:
      </p>
      <pre>{`d₁₁₁/d₁₀₀ > √3  ≈ 1.732  →  cube           (only {100})
d₁₁₁/d₁₀₀ = 2/√3 ≈ 1.155  →  cuboctahedron  ({100} + {111} equal)
d₁₁₁/d₁₀₀ < 1/√3 ≈ 0.577  →  octahedron     (only {111})`}</pre>
      <p>
        Why 2/√3? A cuboctahedron vertex sits at (d₁₀₀, d₁₀₀, 0) (edge midpoint
        of the cube). The {"{111}"} halfspace passes through it when
        (d₁₀₀ + d₁₀₀ + 0)/√3 = d₁₁₁, giving d₁₁₁ = 2d₁₀₀/√3.
      </p>
      <p>
        Compare the constant-width body in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-reuleaux-tetrahedron-four-sphere-intersection-meissner-constant-width-poi-webxr"
          className={lk}
        >
          Reuleaux Tetrahedron
        </Link>{" "}
        tutorial, which is also defined as a halfspace (sphere) intersection —
        four spheres rather than 26 planes. Both constructions give convex bodies
        from geometric constraints.
      </p>

      <h2>Why project the icosphere?</h2>
      <p>
        Computing the exact Wulff polytope vertices via{" "}
        <code>scipy.spatial.HalfspaceIntersection</code> is clean for a single
        morphology, but the vertex count changes with shape:
      </p>
      <pre>{`cube:           8 vertices
truncated cube: 24 vertices
cuboctahedron:  12 vertices
trunc. octa.:   24 vertices
octahedron:      6 vertices`}</pre>
      <p>
        Blender shape keys require identical vertex count and edge topology
        across all keys. Rebuilding the mesh per key breaks shape keys. The
        solution is the{" "}
        <strong>Wulff radius formula</strong>: for any unit direction{" "}
        <strong>u</strong>, the distance from the origin to the Wulff body
        surface is:
      </p>
      <pre>{`r(u) = min_{i : n̂ᵢ · u > 0}  dᵢ / (n̂ᵢ · u)`}</pre>
      <p>
        We project every vertex of a fixed level-2 icosphere (162 vertices)
        radially to distance r(u)·u. Because the Wulff body is a convex
        polytope, all projected points on the same face are exactly coplanar.
        Flat shading groups these coplanar triangles into apparent gem facets
        with zero extra work.
      </p>
      <p>
        This trick — project a fixed sphere mesh to an arbitrary convex body —
        generalises to any support-function body. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-kepler-poinsot-star-polyhedra-schlafli-symbol-four-regular-star-poi-webxr"
          className={lk}
        >
          Kepler-Poinsot star polyhedra
        </Link>{" "}
        tutorial uses a related idea (spiking an icosahedron out from each
        face centroid) to build non-convex stellation shapes as poi heads.
      </p>

      <h2>Blueprint walkthrough</h2>
      <pre>{`# 26 face normals for Oh symmetry (6 + 12 + 8)
n100 = [[1,0,0],[-1,0,0], ...]
n110 = [[1,1,0], ...] / √2
n111 = [[1,1,1], ...] / √3
_NORMALS = np.vstack([n100, n110, n111])   # (26, 3)

def wulff_radius(dirs, d100, d110, d111):
    d_vec = [d100]*6 + [d110]*12 + [d111]*8   # (26,)
    dots  = _NORMALS @ dirs.T                  # (26, N)
    safe  = np.where(dots > 1e-9, dots, inf)   # mask back-facing
    return np.min(d_vec / safe, axis=0)        # (N,) Wulff radii`}</pre>
      <p>
        The broadcast <code>_NORMALS @ dirs.T</code> computes all 26×N dot
        products in one call. <code>np.where(dots &gt; 1e-9, dots, inf)</code>{" "}
        masks back-facing normals so they contribute +∞ and never win the
        minimum. The result is exact: every projected vertex lies on a face
        plane of the Wulff polytope.
      </p>

      <pre>{`# Build icosphere, project to Wulff surface, create mesh
bm_tmp = bmesh.new()
bmesh.ops.create_icosphere(bm_tmp, subdivisions=2, radius=1.0)
dirs = verts / ‖verts‖     # unit directions
r0   = wulff_radius(dirs, d100=1.0, d110=9.9, d111=1.9)  # cube
co0  = dirs * r0[:,None] * SCALE

# Build shape keys (same dirs, different d-ratios)
for name, d100, d110, d111 in SHAPE_KEYS:
    sk  = ob.shape_key_add(name=name, from_mix=False)
    r   = wulff_radius(dirs, d100, d110, d111)
    co  = dirs * r[:,None] * SCALE
    for i, c in enumerate(co):
        sk.data[i].co = c`}</pre>

      <h2>Flat shading and the faceted crystal look</h2>
      <p>
        After projecting, every triangle on a {"{100}"} face of the Wulff cube
        has the exact same face normal: (1, 0, 0). Flat shading (
        <code>poly.use_smooth = False</code>) assigns each triangle its computed
        face normal — so all those triangles display identically. Across the
        silhouette edge to a {"{111}"} face the normal jumps discontinuously →
        a sharp crystal edge at zero extra cost.
      </p>
      <p>
        Contrast this with the curvature-colour approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-gauss-bonnet-angle-defect-discrete-curvature-torus-poi-webxr"
          className={lk}
        >
          Discrete Gaussian Curvature
        </Link>{" "}
        tutorial, where angle-defect colouring highlights where the mesh
        departs from zero curvature. On the Wulff crystal, Gaussian curvature
        is zero on every flat face and a Dirac delta on each edge — the
        discrete Gauss-Bonnet theorem still holds (Euler characteristic = 2
        for the sphere-topology poi head).
      </p>

      <h2>Material: diamond-IOR gem</h2>
      <p>
        Principled BSDF with IOR = 2.42 (diamond), transmission weight = 0.90,
        and full clearcoat at roughness 0. In EEVEE Next, the clearcoat sheen
        maps per-face highlights — each flat crystal face picks up the HDRI
        probe independently, giving that characteristic bright-spot-per-facet
        gem look. The base colour is near-white with a slight blue cast to read
        as aquamarine or ice crystal rather than gold.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>ImportError: No module named scipy</strong> — run
          <code>
            blender-5.1/python/bin/python3.11 -m pip install scipy
          </code>
          once before running the blueprint.
        </li>
        <li>
          <strong>Shape keys collapsed to identical shape</strong> — check that{" "}
          <code>d111</code> is sweeping across the critical ratios. If all five
          values are identical, the wulff_radius calls will return the same
          result.
        </li>
        <li>
          <strong>Facets look smooth instead of flat</strong> — ensure{" "}
          <code>poly.use_smooth = False</code> ran on all polygons and no
          Smooth by Angle modifier was added post-hoc (it overrides flat
          shading).
        </li>
        <li>
          <strong>GLB morph targets missing in Three.js</strong> — confirm{" "}
          <code>export_morph=True</code> in the gltf exporter call. The
          Draco compression codec must be available (included in Blender 4.2+
          as a bundled extension).
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Wulff G (1901).{" "}
          <em>
            Zur Frage der Geschwindigkeit des Wachsthums und der Auflösung der
            Krystallflächen.
          </em>{" "}
          Zeitschrift für Krystallographie und Mineralogie{" "}
          <strong>34</strong>: 449–530.{" "}
          <a
            href="https://www.biodiversitylibrary.org/page/35535673"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            biodiversitylibrary.org
          </a>{" "}
          — Public domain (1901); the original construction proof and geometric
          statement. Digitised by Biodiversity Heritage Library. Related later
          work: Dinghas (1944) completing the minimality proof; Taylor (1978)
          establishing the sharp crystalline variational problem in geometric
          measure theory.
        </li>
        <li>
          Curie P (1885).{" "}
          <em>
            Sur la formation des cristaux et sur les constantes capillaires de
            leurs différentes faces.
          </em>{" "}
          Bulletin de la Société minéralogique de France{" "}
          <strong>8</strong>: 145–150.{" "}
          <a
            href="https://archive.org/details/bulletindelasoci08soci/page/145"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            archive.org
          </a>{" "}
          — Public domain; Pierre Curie&apos;s 1885 symmetry-energy observation
          that predates Wulff&apos;s formal construction. Related work: his
          Curie symmetry principle (dissymmetry of cause and effect), which
          connects to the Oh symmetry group used here.
        </li>
        <li>
          SciPy Developers (2020). SciPy 1.0: fundamental algorithms for
          scientific computing in Python. <em>Nature Methods</em>{" "}
          <strong>17</strong>: 261–272. BSD-3-Clause —{" "}
          <a
            href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.HalfspaceIntersection.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            scipy.spatial.HalfspaceIntersection
          </a>{" "}
          — used here for reference and design of the dual construction;
          the blueprint uses the equivalent direct radius formula instead to
          avoid the variable-vertex-count problem. Related projects:{" "}
          <a
            href="https://github.com/scipy/scipy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/scipy/scipy
          </a>
          ; QHull library (BSD) underlying{" "}
          <code>ConvexHull</code> and <code>HalfspaceIntersection</code>.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Wulff Crystal Construction: Equilibrium Morphology, Oh Symmetry Halfspaces & Cube↔Octahedron Shape-Key Poi Head for WebXR",
  description:
    "Build the complete {100}/{111} morphological phase diagram (cube → cuboctahedron → octahedron) as five Blender shape keys, using Wulff's 1901 halfspace-intersection theorem and a fixed icosphere projection for constant topology.",
  tags: [
    "python",
    "numpy",
    "scipy",
    "wulff",
    "crystal",
    "equilibrium-shape",
    "oh-symmetry",
    "halfspace",
    "morphology",
    "shape-keys",
    "poi-head",
    "webxr",
    "glb",
  ],
  date: "2026-08-16",
  blenderVersion: "5.1",
  libraryPath:
    "public/library/blends/scripting/python-numpy-scipy-wulff-crystal-equilibrium-morphology-halfspace-poi-webxr",
  Body,
});

import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-scipy-thompson-problem-coulomb-energy-tammes-s2-poi-head-webxr";

const TITLE =
  "Python numpy + scipy — Thomson Problem: Coulomb Energy Minimisation, " +
  "Riemannian Gradient Descent & Tammes Fibonacci Sphere as Faceted Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Thomson problem asks how N equal point charges must be arranged on a unit " +
  "sphere S² to minimise their total Coulomb repulsion energy E = Σᵢ<ⱼ 1/|pᵢ−pⱼ|. " +
  "For small N the answers are the Platonic solids: N=4 gives a tetrahedron, N=12 " +
  "an icosahedron. This blueprint finds the local minimum for N=32 using Riemannian " +
  "projected gradient descent initialised from a Fibonacci (golden-angle) sphere " +
  "lattice, builds the convex hull as a faceted poi head, encodes per-vertex energy " +
  "as vertex colours, and stores the disordering trajectory — random → mid-energy " +
  "→ optimal — as three Blender shape keys. Exported as Draco-6 GLB for WebXR.";

function Body() {
  return (
    <>
      <p>
        In 1904 J.J. Thomson was trying to understand atomic structure before
        the nuclear model existed. He imagined electrons embedded in a uniform
        positive charge cloud — the &ldquo;plum-pudding&rdquo; atom — and asked
        where they would sit if allowed to reach equilibrium. The answer is a
        purely geometric optimisation problem that has kept mathematicians busy
        for 120 years: how do N equal repelling charges arrange themselves on a
        sphere?
      </p>
      <p>
        The total Coulomb potential energy is:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`E = Σᵢ<ⱼ  1 / |pᵢ − pⱼ|

For small N, the optimal configurations are classical:
  N=4  → regular tetrahedron           (4 vertices, 4 faces)
  N=6  → regular octahedron            (6 vertices, 8 faces)
  N=8  → square antiprism              (NOT a cube — the cube is a saddle point)
  N=12 → regular icosahedron           (12 vertices, 20 faces)
  N=20 → nearly-regular dodecahedron   (approximate)
  N=60 → truncated icosahedron / C₆₀  (buckyball geometry)`}
      </pre>
      <p>
        The icosahedron result for N=12 explains a deep biological fact:
        spherical virus capsids arrange their protein subunits at the vertices
        of an icosahedron because evolution found the same energy minimum that
        Thomson posed. Geodesic dome strut placement, optimal satellite
        constellations, and blue-noise sampling kernels all exploit the same
        geometry.
      </p>

      <h2>Riemannian gradient descent on S²</h2>
      <p>
        Ordinary gradient descent in ℝ³ would move charges off the sphere.
        To stay on S², every gradient step must be <em>projected onto the
        tangent plane</em> at each point, then the result normalised back to
        the sphere. This is the standard Riemannian retraction for S²:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# Euclidean gradient at vertex i:
#   ∂E/∂pᵢ = Σⱼ≠ᵢ  −(pᵢ − pⱼ) / |pᵢ − pⱼ|³
# The sign: increasing |pᵢ−pⱼ| lowers 1/|pᵢ−pⱼ|,
# so the gradient points *toward* pⱼ (downhill on E means spreading out).

diff    = pts[:, None, :] - pts[None, :, :]   # (N,N,3) pᵢ−pⱼ
inv_r3  = 1.0 / np.linalg.norm(diff, axis=2)**3
eucl_g  = -np.sum(diff * inv_r3[:, :, None], axis=1)  # (N,3)

# Project onto tangent plane at pᵢ (remove the radial / normal component):
radial   = np.sum(eucl_g * pts, axis=1, keepdims=True)
riem_g   = eucl_g - radial * pts   # tangential Riemannian gradient

# Gradient descent step + retraction back to S²:
pts = pts - alpha * riem_g
pts /= np.linalg.norm(pts, axis=1, keepdims=True)`}
      </pre>
      <p>
        The learning rate decays exponentially (<code>alpha = LR * decay**step</code>)
        so the optimiser takes bold steps early and fine-tunes near the minimum
        without oscillating. After 6 000 steps the energy change per step is
        typically below 10⁻⁷.
      </p>

      <h2>Fibonacci sphere initialisation — why random is wrong</h2>
      <p>
        Starting from purely random sphere points leads to degenerate
        configurations: two or more charges may start very close together,
        creating enormous repulsion forces that fling them to the antipodal
        side of the sphere and cause the optimiser to oscillate. The Fibonacci
        (golden-angle) lattice places points with near-optimal initial spacing,
        matching the &ldquo;Tammes problem&rdquo; (maximise the minimum
        pairwise angular separation) without any iteration. The golden angle
        φ = 2π/Φ² ≈ 137.508° is irrational, so no two meridional longitudes
        ever coincide for any finite N:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`def fibonacci_sphere(n):
    i    = np.arange(n, dtype=np.float64)
    cosT = 1.0 - (2*i + 1.0) / n   # equal-area latitude spacing
    sinT = np.sqrt(1 - cosT**2)
    phi  = np.pi * (1 + np.sqrt(5)) * i   # golden angle
    return np.column_stack([sinT*np.cos(phi), sinT*np.sin(phi), cosT])`}
      </pre>
      <p>
        The three shape keys in the final mesh compare this initialiser with
        the converged optimal and with a pure random start, making the
        improvement concrete and interactive. Compare the Fibonacci sphere
        approach used here with the low-discrepancy Halton sequence in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-halton-sequence-fibonacci-sphere-lattice-scatter-poi-webxr"
          className={lk}
        >
          Halton sequence tutorial
        </Link>
        , which uses a different quasi-random strategy to distribute scatter
        points on the sphere.
      </p>

      <h2>Convex hull → faceted poi head</h2>
      <p>
        The N=32 optimal points all lie on S², so their convex hull equals S²
        itself — every point is a vertex of the hull. <code>scipy.spatial.ConvexHull</code>
        returns the simplices (triangles) as index triplets. These are passed
        directly to a bmesh to build the mesh, then{" "}
        <code>bmesh.ops.recalc_face_normals</code> ensures all triangles face
        outward. The result is a faceted polyhedron with 32 vertices and
        approximately 60 triangular faces (Euler: V − E + F = 2 gives
        F ≈ 2V − 4 = 60 for a convex polyhedron with V = 32).
      </p>
      <p>
        For an alternative route to faceted sphere heads — using Lloyd&apos;s
        algorithm and Centroidal Voronoi Tessellation rather than energy
        minimisation — see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-scipy-spherical-voronoi-lloyd-cvt-faceted-poi-head-webxr"
          className={lk}
        >
          CVT/Lloyd sphere tessellation tutorial
        </Link>
        . Lloyd&apos;s algorithm minimises a different potential (mass-weighted
        centroid distance) and tends to produce more uniform face areas; the
        Thomson optimiser produces more regular vertex-to-vertex distances.
      </p>

      <h2>Per-vertex energy as vertex colours</h2>
      <p>
        After optimisation, some vertices are slightly closer to their neighbours
        than others — the sphere is not perfectly uniform. Per-vertex energy
        Vᵢ = Σⱼ≠ᵢ 1/|pᵢ−pⱼ| reveals which vertices are most &ldquo;crowded.&rdquo;
        These values are normalised to [0, 1] and stored as a{" "}
        <code>FLOAT_COLOR</code> attribute, mapped to a cyan → magenta gradient:
        cyan marks well-spaced vertices; magenta marks crowded ones. In the
        optimal N=32 configuration the spread is narrow — the optimiser has
        found a solution close to the global uniform arrangement — so the
        colours will be nearly uniform with subtle variation.
      </p>
      <p>
        This vertex-colour-as-field technique also appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-600-cell-quaternion-binary-icosahedral-stereographic-shadow-webxr"
          className={lk}
        >
          600-cell stereographic projection tutorial
        </Link>
        , where vertex colours encode the 4D depth of each projected vertex,
        and in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-superquadric-lame-curve-barr-signed-powers-shape-space-poi-head-webxr"
          className={lk}
        >
          superquadric shape-space tutorial
        </Link>
        , where shape key morphing blends between parametric surface forms.
      </p>

      <h2>Sources</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          Thomson, J.J. (1904). &ldquo;On the Structure of the Atom.&rdquo;{" "}
          <em>Philosophical Magazine</em> <strong>7</strong>(39), 237–265.{" "}
          <a
            href="https://doi.org/10.1080/14786440409463107"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            doi:10.1080/14786440409463107
          </a>{" "}
          — original problem statement; mathematical content public domain.
          Related:{" "}
          <a
            href="https://en.wikipedia.org/wiki/Thomson_problem"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Wikipedia: Thomson problem
          </a>
          ,{" "}
          <a
            href="https://en.wikipedia.org/wiki/Tammes_problem"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Tammes problem
          </a>
          .
        </li>
        <li>
          Sloane, N.J.A., Hardin, R.H., Smith, W.D. (1994–2014).{" "}
          <em>Tables of Spherical Codes / Tammes Problem Data.</em>{" "}
          <a
            href="http://neilsloane.com/packings/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            neilsloane.com/packings/
          </a>{" "}
          — CC0 numerical data tables giving best-known energies for each N.
          Related:{" "}
          <a
            href="https://oeis.org/A005891"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            OEIS A005891
          </a>{" "}
          (centred pentagonal numbers appear in Thomson optimal counts).
        </li>
        <li>
          NumPy community. <em>NumPy</em> (BSD-3-Clause).{" "}
          <a
            href="https://numpy.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org
          </a>{" "}
          — vectorised pairwise distance computation and gradient loops.
          Related:{" "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
          .
        </li>
        <li>
          SciPy community. <em>SciPy</em> (BSD-3-Clause).{" "}
          <a
            href="https://scipy.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            scipy.org
          </a>{" "}
          — <code>scipy.spatial.ConvexHull</code> (QHull wrapper) for mesh topology.
          Related:{" "}
          <a
            href="https://github.com/scipy/scipy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/scipy/scipy
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "45 minutes",
    difficulty: "intermediate",
    cost: "nil — Python + Blender only",
    supplies: {
      materials: [],
      tools: [
        "Blender 5.1",
        "numpy (bundled with Blender)",
        "scipy (install via bundled pip if missing)",
      ],
    },
    steps: [
      {
        title: "Open Scripting workspace",
        body: "Launch Blender 5.1. Switch to the Scripting workspace. Create a new text datablock and save the .blend so that '//' paths resolve correctly.",
      },
      {
        title: "Install scipy if needed",
        body: "In the Blender Python console run: import subprocess, sys; subprocess.run([sys.executable, '-m', 'pip', 'install', 'scipy']). Skip if scipy is already available.",
      },
      {
        title: "Paste and run blueprint.py",
        body: "Copy blueprint.py into the text editor. Press Alt+P. The console prints energy values at each stage. With N=32 and 6000 steps, expect 30–90 s runtime.",
      },
      {
        title: "Verify energy convergence",
        body: "Compare the printed values: E(fibonacci) < E(random) confirms the Fibonacci initialiser is better. E(optimal) should be ≈ 137.3 for N=32 (matching Sloane's tables for the known best configuration).",
      },
      {
        title: "Inspect vertex colours",
        body: "In the 3D Viewport, press Z → Material Preview. The poi head appears with a cyan–magenta gradient. Nearly uniform colour means the optimiser found a well-distributed arrangement.",
      },
      {
        title: "Explore shape keys",
        body: "Object Properties → Shape Keys. Drag Mid_Energy to 1.0: vertices shift to a partially converged state. Drag Random to 1.0: the mesh deforms to the random initial scatter. Scrub between states.",
      },
      {
        title: "Run record.py",
        body: "Load record.py and press Alt+P. The script renders 150 frames animating the Optimal → Mid_Energy → Random → Optimal morph to viewport.mp4.",
      },
      {
        title: "Save .blend and capture screen.mp4",
        body: "File → Save As → hf_thompson_poi.blend. Follow SCREEN-RECORDING-NOTES.md to capture the full OBS session: theory, code walkthrough, live run, shape key demo.",
      },
    ],
  },
  {
    slug: SLUG,
    title: TITLE,
    date: "2026-08-02",
    kind: "tutorial",
    excerpt: LEDE,
    Body,
  },
);

import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every flat-lattice reaction-diffusion blueprint in this library —
        Gray-Scott, Cahn-Hilliard, SmoothLife — operates on a regular 2-D grid
        where the Laplacian is a cheap <code>np.roll</code> stencil and
        boundary conditions are toroidal.  Real biological pattern formation
        happens on <em>curved surfaces</em>: a poi head, a VRM character's skin,
        a waveguide shell.  Once you integrate the same Gray-Scott PDEs on the
        actual vertex graph of a triangulated mesh, the patterns conform to the
        geometry — spots elongate near poles where vertices are sparser, stripes
        follow the curvature, and the result is ready to drive vertex colours
        and radial displacement without UV mapping.
      </p>
      <p>
        The key ingredient is the <strong>discrete Laplace-Beltrami operator</strong>.
        This blueprint uses the umbrella (uniform-weight) variant:
      </p>
      <pre>{`(LU)[i] = (1/deg_i) Σ_{j∈N(i)} U[j]  −  U[i]

where N(i) = set of vertices sharing an edge with vertex i
      deg_i = |N(i)|  (vertex degree)`}</pre>
      <p>
        Unlike the flat-grid <code>np.roll</code> Laplacian, this one operates on
        an arbitrary connectivity graph built from the mesh's edge topology.  The
        umbrella normalisation (dividing by vertex degree) bounds all eigenvalues
        to [−2, 0] for any connected graph — an explicit-Euler timestep of 0.5
        is unconditionally stable for Du = 0.16, just as on the flat grid.
      </p>

      <h2>Umbrella vs cotangent Laplacian</h2>
      <p>
        The geometrically accurate alternative is the <strong>cotangent-weighted
        Laplacian</strong> (Desbrun et al. 1999 "Implicit Fairing"):
      </p>
      <pre>{`W[i,j] = (cot α_ij + cot β_ij) / 2   for each shared edge
(LU)[i] = (W·U)[i] / A_i             A_i = lumped vertex Voronoi area

where α_ij, β_ij are the angles opposite edge (i,j) in the two adjacent triangles`}</pre>
      <p>
        The cotangent Laplacian is isometric — it is invariant under rigid-body
        motions and correctly handles both flat and curved regions of the mesh.
        Turing patterns from it are area-proportional: faces with large area
        produce large spots, and vice versa (exactly what is seen in giraffe
        neck vs belly patches).
      </p>
      <p>
        The trade-off is a much tighter stability constraint.  The cotangent
        Laplacian's maximum eigenvalue scales as 1/h² for mesh edge length h.
        On a 0.15 m sphere (subdivisions=4, h ≈ 0.016 m):
      </p>
      <pre>{`λ_max ≈ 4 000   (cotangent, sphere h=0.016 m)
λ_max ≈ 2       (umbrella, any graph)

Explicit-Euler stable DT:
  cotangent: DT < 1/(4 · Du · 4 000) ≈ 0.001
  umbrella:  DT < 1/(4 · Du · 2)     ≈ 0.78

Ratio: 780×  →  cotangent needs 780× more steps for the same simulation time.`}</pre>
      <p>
        Without an implicit solver (Cholesky factorisation of M − DT·Du·W each
        step), the cotangent version is impractical at this mesh scale.  Use the
        umbrella Laplacian for exploratory work; switch to cotangent + implicit
        integration when geometric accuracy is required for production bakes.
        Compare the same tradeoff in the mesh-smoothing context in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-mesh-from-pydata-enneper-minimal-surface-faceted-webxr"
          className={lk}
        >
          Python bpy Mesh from pydata — Enneper Minimal Surface blueprint
        </Link>
        .
      </p>

      <h2>Scatter-based Laplacian with <code>np.add.at</code></h2>
      <p>
        Computing <code>(Σ&#123;j∈N(i)&#125; U[j]) / deg_i</code> without a Python loop
        over neighbours uses two numpy primitives:
      </p>
      <pre>{`# Pre-built arrays at startup (O(E) memory, built once):
rows[k], cols[k] = source vertex i, neighbour vertex j  for edge k

# Per-step Laplacian (O(E) compute):
sums = np.zeros(n)
np.add.at(sums, rows, U[cols])   # scatter: sums[i] += U[j] for each edge i→j
LU = sums / deg - U`}</pre>
      <p>
        <code>np.add.at</code> is an <em>unbuffered</em> scatter — it handles
        repeated indices correctly (unlike <code>sums[rows] += U[cols]</code>,
        which uses buffered indexing and silently gives wrong results when the
        same index appears multiple times in <code>rows</code>).  This distinction
        matters here because each vertex i appears deg_i times in <code>rows</code>.
      </p>
      <p>
        The same scatter pattern appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr"
          className={lk}
        >
          flat-grid Gray-Scott blueprint
        </Link>{" "}
        as <code>np.roll</code> — equivalent for a regular lattice but
        non-generalisable to arbitrary meshes.
      </p>

      <h2>Seeding on a sphere</h2>
      <p>
        The north-pole cap seed (all vertices with z &gt; 0.8·R initialised at
        V = 0.25 plus noise) is intentional.  A uniform random seed fills the
        entire sphere with noise simultaneously, producing a disordered patchwork
        with many small domain defects.  A localised seed lets the reaction front
        propagate symmetrically outward, producing a cleaner hexagonal arrangement
        — closer to how real embryological patterning works (the tip of a limb
        bud seeds before the rest of the limb forms).
      </p>
      <p>
        Icosahedral icospheres have 5-fold symmetry at the north and south poles.
        The <code>rng.uniform(-0.01, 0.01, n)</code> noise breaks this symmetry
        so spots fill the domain rather than growing in a perfect pentagonal star.
        Change <code>SEED</code> to any other integer for a different arrangement.
      </p>

      <h2>Applying to a VRM character or any mesh</h2>
      <p>
        Replace <code>make_sphere()</code> with any mesh import — a VRM body,
        a torus knot, a sculpted form — and the rest of the pipeline is unchanged.
        The Laplacian construction reads only from <code>bmesh.faces</code>, so
        it handles arbitrary topology.  The vertex colour output can drive a
        VRM material's <em>Subsurface Colour</em> input or a Geometry Nodes
        colour attribute for stylised skin.  Compare the vertex-attribute write
        approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-cahn-hilliard-phase-separation-spinodal-displacement-webxr"
          className={lk}
        >
          Cahn-Hilliard phase separation blueprint
        </Link>
        .
      </p>
      <p>
        For a VRM character, run the simulation on the body mesh at rest pose
        and bake the result to a texture before rigging.  The vertex colours do
        not deform with the rig — baking to an image texture (via the Bake node
        or the Python Bake API) is required for animated characters.  See the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing"
          className={lk}
        >
          GN Simulation Zone Turing blueprint
        </Link>{" "}
        for the Geometry-Nodes equivalent that can drive materials directly
        without baking.
      </p>
    </>
  );
}

const data = {
  title:
    "Python numpy — Surface Reaction-Diffusion via Mesh Laplacian: Turing Spots on a Poi Head Sphere for VRM & WebXR (Blender 5.1)",
  lede:
    "Integrate the Gray-Scott PDEs on a triangulated icosphere using the umbrella Laplacian as a discrete Laplace-Beltrami operator, producing geometry-conforming Turing spots mapped to radial displacement and vertex colour for a poi-head GLB.",
  date: "2026-07-26",
  steps: [
    {
      title: "Run blueprint.py",
      body: "Open Blender Scripting workspace, load blueprint.py, click ▶ Run Script. The terminal logs V range at every 2 000 steps. Expect V_max ≈ 0.20–0.22 when spots have matured. Runtime: 60–120 s on a modern CPU (642 verts × 12 000 steps × two Laplacian calls).",
    },
    {
      title: "Inspect the sphere",
      body: "Switch to 3D Viewport. The icosphere should show ~10 raised bumps (Turing spots) in roughly hexagonal arrangement on a navy background. Toggle Material Preview to see the navy-to-gold vertex colour ramp. If the sphere is flat with no bumps, V_max is near zero — see Troubleshooting.",
    },
    {
      title: "Try stripe parameters",
      body: "Change F_RATE to 0.035 and K_RATE to 0.060, re-run. The spots shift to meandering stripe labyrinths. Self-replicating spot trains appear at F=0.025, K=0.060 — new spots bud from the edges of existing clusters over time.",
    },
    {
      title: "Apply to a different mesh",
      body: "Replace make_sphere() with an import of any triangulated object (a VRM body, torus, poi staff). The extract_topology() and build_umbrella_adjacency() functions work on any mesh. The pattern scale relative to the mesh depends on the vertex density — denser meshes produce smaller spots.",
    },
    {
      title: "Record viewport animation",
      body: "Run record.py to generate the 10-snapshot shape-key animation. At the peak frame of each shape key the sphere shows the simulation at that stage. Hit F12 (Render Animation) to produce viewport.mp4 showing the spot pattern evolving from north-pole nucleation to full coverage.",
    },
    {
      title: "Export and use in WebXR",
      body: "The auto-exported hf_surface_rd.glb includes COLOR_0 vertex colours. In Three.js, set material.vertexColors = true on a MeshStandardMaterial applied to the loaded mesh. The radial displacement is already baked into vertex positions — no displacement map needed.",
    },
  ],
  troubleshooting: [
    {
      symptom: "Sphere is flat — V ∈ [0.0000, 0.0001]",
      cause:
        "The (F, K) parameters are outside the Turing-instability band. The uniform steady state U=1, V=0 is stable and the seed decays.",
      fix: "Use the default pair (F=0.060, K=0.062). The instability band on a sphere is the same as on the flat grid — Pearson's 1993 map applies. If you changed SUBDIVISIONS, verify that the north-pole seed still contains vertices (z > 0.8·SPHERE_R); on SUBDIVISIONS=1 (12 verts) the north pole is a single vertex and seeding may be too sparse.",
    },
    {
      symptom: "V ∈ [nan, nan] — simulation blows up immediately",
      cause:
        "DT > 1/(8·DU) violated the stability bound (or adjacency arrays built incorrectly, giving deg_i = 0 for isolated vertices).",
      fix: "Reduce DT to 0.3. Also confirm SUBDIVISIONS ≥ 2 — icosphere at subdivisions=1 has 12 fully connected vertices and the adjacency builds correctly, but subdivisions=0 is not a standard primitive and may have degenerate faces. Add assert (deg > 0).all() after build_umbrella_adjacency to verify.",
    },
    {
      symptom: "Spots appear only near the north pole, south pole is blank",
      cause:
        "N_STEPS is too low — the reaction front has not yet propagated to the south pole.",
      fix: "Increase N_STEPS to 16 000. On a subdivisions=4 sphere, propagation to the south pole takes ~8 000 steps at DT=0.50. Alternatively, seed the south pole as well: add south = verts[:, 2] < -SPHERE_R * 0.8 and apply the same initial condition.",
    },
    {
      symptom: "Vertex colours missing in Three.js / Babylon.js",
      cause:
        "The BYTE_COLOR attribute named 'Col' was not exported or the material does not read COLOR_0.",
      fix: "In Blender, verify Properties > Object Data > Color Attributes shows 'Col' as BYTE_COLOR with domain POINT. In Three.js: const mat = new THREE.MeshStandardMaterial({ vertexColors: true }); Load with GLTFLoader — COLOR_0 maps automatically to vertexColors.",
    },
    {
      symptom: "record.py shape keys produce additive displacement (double bumps)",
      cause:
        "Multiple shape keys have non-zero values simultaneously and Blender is summing their offsets from Basis rather than blending.",
      fix: "Ensure LINEAR fcurve interpolation was applied (the script sets this, but verify via Graph Editor that all fcurve keyframes show straight segments). At any given frame only two adjacent shape keys should be non-zero — if more are non-zero the shape key INSERT loop did not complete correctly.",
    },
  ],
  externalLinks: [
    {
      label:
        "Gray & Scott (1985) — Autocatalytic reactions — Chem. Eng. Sci. 39:1087 — mathematical results (PD)",
      href: "https://doi.org/10.1016/0009-2509(84)87017-7",
    },
    {
      label:
        "Discrete Laplace–Beltrami operator — Wikipedia — CC BY-SA 4.0 — umbrella vs cotangent formulation",
      href: "https://en.wikipedia.org/wiki/Discrete_Laplace%E2%80%93Beltrami_operator",
    },
    {
      label:
        "NumPy — numpy.add.at — BSD-3-Clause — NumPy Developers — unbuffered scatter operation",
      href: "https://numpy.org/doc/stable/reference/generated/numpy.ufunc.at.html",
    },
  ],
  relatedTutorials: [
    {
      label:
        "Python numpy — Gray-Scott Reaction-Diffusion on a Flat 128×128 Lattice (np.roll Laplacian)",
      href: "/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr",
    },
    {
      label:
        "GN Simulation Zone — Reaction-Diffusion Turing Spots (Gierer-Meinhardt, BlurAttribute Laplacian)",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing",
    },
    {
      label:
        "Python numpy — Cahn-Hilliard Phase Separation: Spinodal Decomposition → Displaced WebXR Mesh",
      href: "/tutorials/blender-tutorial-python-numpy-cahn-hilliard-phase-separation-spinodal-displacement-webxr",
    },
    {
      label:
        "Python bpy — Mesh from pydata: Enneper Minimal Surface & Faceted WebXR Export",
      href: "/tutorials/blender-tutorial-python-bpy-mesh-from-pydata-enneper-minimal-surface-faceted-webxr",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-numpy-surface-rd-mesh-laplacian-turing-vrm-webxr",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "scripting",
      "simulation",
      "physics",
      "materials",
      "webxr",
    ],
    body: Body,
  },
  data,
);

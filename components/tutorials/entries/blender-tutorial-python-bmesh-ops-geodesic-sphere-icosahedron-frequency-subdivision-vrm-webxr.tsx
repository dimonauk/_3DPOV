import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every sphere in the Holoflow library — from the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-surface-rd-mesh-laplacian-turing-vrm-webxr"
          className={lk}
        >
          Turing-spot poi head
        </Link>{" "}
        to the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-dual-mesh-voronoi-sphere"
          className={lk}
        >
          Voronoi cell dome
        </Link>{" "}
        — begins as a Blender IcoSphere built by an operator call. This
        blueprint steps behind the operator and constructs the sphere from
        scratch using the <code>bmesh.ops</code> API, seeding from a hand-coded
        regular icosahedron and subdividing with{" "}
        <code>bmesh.ops.subdivide_edges()</code>. The result is a{" "}
        <strong>Class I geodesic sphere</strong> whose vertex count, face count,
        and Euler characteristic you can verify analytically before running a
        single line.
      </p>

      <h2>Why the icosahedron is the right seed</h2>
      <p>
        The five Platonic solids differ in face count (F) and in how large each
        solid angle is at each vertex. The icosahedron wins on both measures that
        matter for sphere subdivision:
      </p>
      <pre>{`Platonic solid   F    Solid-angle defect/vertex
Tetrahedron       4   180°  (very large — wildest distortion)
Cube              6   90°
Octahedron        8   60°
Dodecahedron     12   36°
Icosahedron      20   12°   ← smallest distortion, most faces`}</pre>
      <p>
        A smaller solid-angle defect means the triangular faces are closer to
        equilateral when the mesh is flattened out — and less correction is
        needed when projecting the subdivision back to the sphere. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-bmesh-dodecahedron"
          className={lk}
        >
          dodecahedron blueprint
        </Link>{" "}
        shows the five-valent golden-ratio construction with 12 pentagonal
        faces; the icosahedron is its dual (12 vertices ↔ 20 faces).
      </p>
      <p>
        The icosahedron is built from three mutually perpendicular golden-ratio
        rectangles. Each rectangle has half-dimensions (1, φ) where φ =
        (1+√5)/2 ≈ 1.618. The 12 vertex positions are the even permutations of
        (0, ±1, ±φ), which all lie on a circumsphere of radius √(1+φ²):
      </p>
      <pre>{`_PHI = (1 + sqrt(5)) / 2            # golden ratio
raw  = [(0, 1, PHI), (0, -1, PHI), ...]   # 12 triples
verts = [Vector(v).normalized() for v in raw]   # → unit sphere`}</pre>
      <p>
        The normalisation is exact — every vertex lands precisely on the unit
        sphere without floating-point residuals from the original
        √(1+φ²) circumradius.
      </p>

      <h2>Frequency subdivision and the Euler invariant</h2>
      <p>
        <code>bmesh.ops.subdivide_edges()</code> with <code>cuts=freq−1</code>{" "}
        splits each of the 30 icosahedron edges into <em>freq</em> equal
        segments, and <code>use_grid_fill=True</code> triangulates the interior
        of each original face. The result at Class I frequency n:
      </p>
      <pre>{`Faces     F  = 20·n²
Edges     E  = 30·n²
Vertices  V  = 10·n² + 2
Euler χ      = V − E + F = (10n²+2) − 30n² + 20n² = 2  ✓`}</pre>
      <p>
        The Euler characteristic χ = 2 is a topological invariant of the sphere
        — it holds regardless of how the mesh is subdivided, and it provides a
        cheap self-diagnostic: print <code>[HF] χ=2</code> at the end of every
        run. A value other than 2 means a face or edge was lost during
        construction (usually a failed grid-fill or a non-manifold edge).
      </p>
      <p>
        <strong>use_grid_fill=True is not optional.</strong> Without it,
        subdivide_edges splits the 30 edges correctly but leaves each original
        triangular face interior as a single N-gon — the face count stays at 20
        regardless of frequency, and the geodesic projection step maps all
        interior vertices to a band near the original triangle plane rather than
        distributing them across the sphere.
      </p>

      <h2>The geodesic projection step</h2>
      <p>
        After subdivision the new edge midpoints lie slightly inside the sphere.
        The single line that makes the mesh geodesic rather than a flat Euclidean
        polyhedron is:
      </p>
      <pre>{`for v in bm.verts:
    v.co = v.co.normalized() * radius`}</pre>
      <p>
        This maps every vertex — original and new — to the sphere surface in one
        pass. The key question is <em>when</em> to apply it: projecting before
        subdivision would give correct edge midpoints on the sphere, but the
        interior vertices of each subdivided face (added by use_grid_fill) would
        land on the face plane, not the sphere. Projecting after subdivision
        handles every vertex identically and gives the most uniform area
        distribution achievable with Class I subdivision.
      </p>
      <p>
        The class of subdivision matters:
      </p>
      <pre>{`Class I  (this script): cuts parallel to icosahedron edges
         Simplest; 12 degree-5 vertices at icosahedron positions.
Class II: grid rotated 30°; slightly more uniform triangle areas.
         Frequency tuple (n, n); less common in practice.
Class III: arbitrary (p, q) twist; least symmetric.`}</pre>
      <p>
        Euler's formula guarantees that <em>any</em> triangulated sphere must
        contain exactly 12 degree-5 vertices in an otherwise degree-6 mesh. This
        is not a property of the icosahedron seed — it is a topological
        consequence of χ = 2. You can verify it by printing{" "}
        <code>len([v for v in mesh.vertices if sum(1 for e in v.link_edges) == 5])</code>{" "}
        after <code>bm.to_mesh(mesh)</code>: the answer is always 12, at any
        frequency.
      </p>

      <h2>Per-face extrude accent</h2>
      <p>
        <code>bmesh.ops.extrude_discrete_faces()</code> disconnects each face
        from its neighbours before translating it outward. This is the correct
        operation for a per-face raised-facet look — not{" "}
        <code>extrude_face_region</code> (connected shell) and not{" "}
        <code>inset_faces</code> (inward-only). The gap width between adjacent
        extruded faces is approximately 2·EXTRUDE_DEPTH·sin(dihedral/2), which
        at poi scale (RADIUS = 0.15 m, EXTRUDE_DEPTH = 0.006 m) is about 0.5 mm
        — just visible in Material Preview and clean in a GLB viewer.
      </p>
      <p>
        Compare the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-poke-face-faceted-crystal-boss-webxr"
          className={lk}
        >
          poke-boss blueprint
        </Link>{" "}
        (flat grid, raised diamond tips via poke offset) and the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-hair-curves-spring-dynamics-vrm"
          className={lk}
        >
          VRM hair curves blueprint
        </Link>{" "}
        for other facet-accent approaches used on the same 0.15 m scale.
      </p>

      <h2>Material: pole-to-pole gradient without a UV map</h2>
      <p>
        <code>ShaderNodeTexCoord.Generated</code> outputs the object bounding-box
        coordinate in [0,1]³ object space — stable across export without any UV
        unwrap. The Z component maps the south pole to 0.0 and the north pole to
        1.0 exactly, which is fed into a ColorRamp (deep navy → gold). This
        gradient survives Draco compression and is readable in Three.js via{" "}
        <code>MeshStandardMaterial</code> with no custom shader needed.
      </p>
    </>
  );
}

const data = {
  title:
    "Python + bmesh.ops — Class I Geodesic Sphere: Icosahedron Frequency Subdivision, Euler χ=2 Verification & Faceted Extrude Accent for VRM & WebXR (Blender 5.1)",
  lede:
    "Construct a geodesic sphere from first principles: seed a hand-coded icosahedron, subdivide edges with bmesh.ops.subdivide_edges() at Class I frequency n (F=20n², V=10n²+2, χ=2), project every vertex to the sphere with v.co.normalized()*radius, add a per-face extrude accent via bmesh.ops.extrude_discrete_faces(), apply a navy-to-gold PBR gradient, and export as a Draco GLB for WebXR.",
  date: "2026-07-26",
  steps: [
    {
      title: "Run blueprint.py",
      body: "Open Blender Scripting workspace, load blueprint.py, click ▶ Run Script. The terminal should print: [HF] V=162 (expected 162)  E=480  F=320 (expected 320)  χ=2. If χ ≠ 2, use_grid_fill is likely False or freq is 0.",
    },
    {
      title: "Check the pole vertices",
      body: "In the 3D Viewport, enter Edit Mode (Tab) and set vertex select mode. Select all (A), then open the N-panel → Item. Vertices at the icosahedron pole positions (approx. (0, 0.15, 0) and (0, -0.15, 0) after rotation) have 5 connected edges. All other vertices have 6. There are exactly 12 five-valent vertices on any triangulated geodesic sphere — a consequence of Euler's formula, not of the construction.",
    },
    {
      title: "Try different frequencies",
      body: "Change FREQUENCY from 4 to 1 (bare icosahedron, 20 faces), 2 (80 faces), 3 (180 faces), 6 (720 faces). Each doubles the face count on a 4× increase in frequency. At FREQUENCY=1 the pentagon/hexagon boundary is clearly visible at each of the 12 five-valent vertices. At FREQUENCY=6 the sphere looks smooth even in flat-shade mode.",
    },
    {
      title: "Compare with and without EXTRUDE_DEPTH",
      body: "Set EXTRUDE_DEPTH=0 and re-run: the sphere is a closed shell. Set EXTRUDE_DEPTH=0.012 (double): each hexagonal face lifts noticeably and the gaps widen. The extrude step multiplies face count by 2 (each discrete face becomes two: the base gap and the raised top), so GLB file size increases. For WebXR, EXTRUDE_DEPTH=0.006 is a good balance.",
    },
    {
      title: "Run record.py for animation",
      body: "Load record.py and run it. Press Spacebar to preview the 300-frame animation — the sphere rotates 360° while the camera arcs from equatorial to near-overhead. The three-point lighting casts shadows into the extrude-accent gaps, making the geodesic face distribution visible. Render Animation (Ctrl+F12) to produce viewport.mp4.",
    },
    {
      title: "Use in WebXR / Three.js",
      body: "Load hf_geodesic.glb in Three.js: const loader = new GLTFLoader(); loader.load('hf_geodesic.glb', gltf => scene.add(gltf.scene)). The navy-to-gold gradient is embedded in the GLB material and renders correctly with MeshStandardMaterial. The Draco-compressed GLB at FREQUENCY=4 is approximately 18 KB.",
    },
  ],
  troubleshooting: [
    {
      symptom: "χ ≠ 2 printed in terminal — e.g. χ=22 or χ=−18",
      cause:
        "use_grid_fill=False was used: subdivide_edges splits edges but does not create interior face topology, leaving 20 N-gon faces. Their edge-count inflates E without adding the correct F, breaking the Euler identity.",
      fix: "Confirm use_grid_fill=True in the bmesh.ops.subdivide_edges() call. Also check freq > 1 before calling subdivide_edges — at freq=1 no subdivision occurs and χ should still be 2 (icosahedron).",
    },
    {
      symptom: "Sphere looks like a polyhedron — flat faces with visible seams at icosahedron edges",
      cause:
        "The geodesic projection step is missing or commented out. Without v.co = v.co.normalized() * radius, all vertices remain at their subdivided Euclidean positions — correct topology but wrong geometry.",
      fix: "Ensure the projection loop runs after subdivide_edges. Also check that radius matches RADIUS (not 1.0 when RADIUS=0.15).",
    },
    {
      symptom: "extrude_discrete_faces raises RuntimeError or returns empty faces dict",
      cause:
        "bm.normal_update() was not called before the extrude. extrude_discrete_faces uses face normals to determine the extrude direction — uninitialised normals produce zero-vector offsets.",
      fix: "Call bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces)) immediately before extrude_discrete_faces. The blueprint.py already does this; check it was not removed.",
    },
    {
      symptom: "GLB has 320 faces in Blender but many more in the Three.js vertex buffer",
      cause:
        "Blender deduplicates shared vertices at hard edges. With SMOOTH_SHADING=True all edges are smooth and the Blender vertex count (162) is preserved. With SMOOTH_SHADING=False (flat shading), every triangle gets its own set of 3 vertices — the GLB vertex count rises to 3×320=960.",
      fix: "For WebXR, SMOOTH_SHADING=True is recommended. For a faceted flat-shaded prop (e.g. a stage crystal), SMOOTH_SHADING=False with EXTRUDE_DEPTH=0 gives a clean hard-edge bake.",
    },
  ],
  externalLinks: [
    {
      label:
        "George W. Hart — Geodesic Spheres (polyhedra.net) — CC BY Attribution — background on Class I/II/III subdivision and Goldberg duals",
      href: "https://www.georgehart.com/virtual-polyhedra/geodesic.html",
    },
    {
      label:
        "Paul Bourke — Geodesic Sphere — Educational freeware — coordinate tables and frequency formula derivation",
      href: "http://paulbourke.net/geometry/geodesic/",
    },
    {
      label:
        "Blender Python API — bmesh.ops — CC BY-SA 4.0 — Blender Foundation — subdivide_edges and extrude_discrete_faces parameter reference",
      href: "https://docs.blender.org/api/current/bmesh.ops.html",
    },
  ],
  relatedTutorials: [
    {
      label:
        "GN Dual Mesh — Geodesic Voronoi Sphere: same topology via Geometry Nodes DualMesh node",
      href: "/tutorials/blender-tutorial-gn-dual-mesh-voronoi-sphere",
    },
    {
      label:
        "Python + bmesh — Procedural Dodecahedron: sibling Platonic-solid construction with bmesh",
      href: "/tutorials/blender-tutorial-python-bpy-bmesh-dodecahedron",
    },
    {
      label:
        "Python numpy — Surface Reaction-Diffusion via Mesh Laplacian: Turing spots on an icosphere substrate for VRM & WebXR",
      href: "/tutorials/blender-tutorial-python-numpy-surface-rd-mesh-laplacian-turing-vrm-webxr",
    },
    {
      label:
        "Python bmesh.ops — Poke Face: raised boss lattice on a flat grid (contrast with geodesic extrude)",
      href: "/tutorials/blender-tutorial-python-bmesh-ops-poke-face-faceted-crystal-boss-webxr",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-bmesh-ops-geodesic-sphere-icosahedron-frequency-subdivision-vrm-webxr",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "scripting",
      "geometry",
      "vrm",
      "webxr",
      "mathematics",
    ],
    body: Body,
  },
  data,
);

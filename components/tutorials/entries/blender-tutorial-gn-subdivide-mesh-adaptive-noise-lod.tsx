import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnSubdivideMeshAdaptiveNoiseLodBody() {
  return (
    <>
      <p>
        <code>GeometryNodeSubdivideMesh</code> raises every face in the mesh to
        the requested Catmull-Clark level. Unlike the Subdivision Surface
        modifier it carries no <em>Selection</em> input — you cannot pass a
        boolean field to protect some faces. To achieve per-patch selective
        subdivision in a Geometry Nodes tree you must Separate the geometry
        into two subsets <em>before</em> the Subdivide node, run the hot subset
        through subdivision, then join the halves back. This tutorial builds
        exactly that pattern into a terrain whose dense detail is driven by a
        Perlin noise field.
      </p>
      <p className="mt-3">
        Two independent noise fields power the terrain: one controls vertex
        height displacement (fine detail, 7 octaves) and a second controls the
        subdivision density map (coarse blobs, 3 octaves). Keeping them separate
        means you can place high-density patches wherever you like artistically
        — a shallow riverbed, a frost-cracked plaza — rather than letting
        topographic height dictate mesh density.
      </p>
      <p className="mt-3">
        The split-subdivide-join pattern also has a direct WebXR cost implication
        covered in the{" "}
        <Link href="/tutorials/blender-tutorial-gn-triangulate-mesh-webxr-tri-safe-export" className={lk}>
          Triangulate Mesh — WebXR Tri-Safe Export tutorial
        </Link>
        . For normal-handling on the seam between coarse and fine patches, see{" "}
        <Link href="/tutorials/blender-tutorial-gn-smooth-by-angle-normal-split" className={lk}>
          Smooth by Angle — Normal Split
        </Link>
        . The noise displacement technique used here is developed in depth in{" "}
        <Link href="/tutorials/blender-tutorial-gn-set-position-noise-displacement" className={lk}>
          GN Set Position — Noise Displacement
        </Link>
        .
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Why the node has no selection input
      </h2>
      <p>
        Catmull-Clark subdivision inserts one new vertex on every edge and one
        at every face centre, then repositions every original vertex toward a
        limit surface. Because the repositioning of a vertex depends on all its
        neighbours, a mixed subdivide (where an adjacent face is subdivided and
        yours is not) would produce a T-junction: the subdivided face has a new
        mid-edge vertex that the coarse face knows nothing about. The resulting
        gap breaks the mesh.
      </p>
      <p className="mt-3">
        Blender&rsquo;s Subdivide Mesh node avoids this by requiring the whole
        geometry socket to be subdivided uniformly. Selective subdivision is
        therefore a <em>structural concern</em>: you must hand the node only the
        geometry you intend to subdivide, which is what{" "}
        <code>Separate Geometry</code> provides. The seam boundary between coarse
        and fine patches is a hard edge — apply a Smooth by Angle node after the
        Join to let Blender reconcile the normal direction across it.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        The split-subdivide-join pattern
      </h2>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-3 overflow-x-auto">
{`# Step 1 — base terrain with height noise
n_grid    → Mesh Grid (9×9 verts, 4 m side)
n_setpos  → Set Position (offset Z = height_noise × TERRAIN_HEIGHT)

# Step 2 — density selection field (face domain)
position → Noise Texture (scale=2.2, detail=3) → Compare(> 0.55) → bool

# Step 3 — SPLIT before subdivide
Separate Geometry (domain=FACE, selection=dense_bool)
  outputs[0]  →  DENSE subset (noise > 0.55)
  outputs[1]  →  SPARSE subset (noise ≤ 0.55)

# Step 4 — subdivide only the dense subset
Subdivide Mesh (Level=2)   ← takes DENSE geometry only
  ×4 faces per level → Level 2 = ×16 faces on hot patches

# Step 5 — assign mat_dense (slot 1) to the subdivided faces
Set Material Index (index=1)

# Step 6 — rejoin
Join Geometry ← dense (subdivided) + sparse (original coarse)
`}
      </pre>
      <p>
        The code below connects these nodes via the bpy API. Named constants at
        the top let you tune the result without digging into the node graph.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Key bpy node setup
      </h2>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-3 overflow-x-auto">
{`DENSITY_THRESHOLD = 0.55
SUBDIVIDE_LEVEL   = 2

# Density selection
n_noise_d = nodes.new("ShaderNodeTexNoise")
n_noise_d.noise_dimensions              = '3D'
n_noise_d.inputs["Scale"].default_value  = 2.2
n_noise_d.inputs["Detail"].default_value = 3.0

n_cmp = nodes.new("FunctionNodeCompare")
n_cmp.data_type = 'FLOAT'
n_cmp.operation = 'GREATER_THAN'
n_cmp.inputs[1].default_value = DENSITY_THRESHOLD

links.new(position_node.outputs["Position"], n_noise_d.inputs["Vector"])
links.new(n_noise_d.outputs["Fac"],          n_cmp.inputs[0])

# Separate geometry by density bool
n_sep = nodes.new("GeometryNodeSeparateGeometry")
n_sep.domain = 'FACE'
links.new(terrain_geometry, n_sep.inputs["Geometry"])
links.new(n_cmp.outputs["Result"], n_sep.inputs["Selection"])
# outputs[0] = matching faces (dense), outputs[1] = rest (sparse)

# Subdivide dense subset only
n_sub = nodes.new("GeometryNodeSubdivideMesh")
n_sub.inputs["Level"].default_value = SUBDIVIDE_LEVEL
links.new(n_sep.outputs[0], n_sub.inputs["Mesh"])

# Rejoin
n_join = nodes.new("GeometryNodeJoinGeometry")
links.new(n_sub.outputs["Mesh"], n_join.inputs["Geometry"])   # dense
links.new(n_sep.outputs[1],      n_join.inputs["Geometry"])   # sparse`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Animating the threshold
      </h2>
      <p>
        The Compare node&rsquo;s <code>B</code> input (threshold) can be
        keyframed. The included <code>record.py</code> animates it
        0.2 → 0.8 → 0.2 over 120 frames, showing dense patches bloom outward
        then contract. This is a valid artistic effect — a terrain that
        &ldquo;heats&rdquo; into detail and cools back — and doubles as a proof
        that the split-subdivide-join pattern updates cleanly on every frame
        rather than baking at load time.
      </p>
      <p className="mt-3">
        To keyframe a GN node socket input in Python:
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-3 overflow-x-auto">
{`cmp_node.inputs[1].default_value = 0.2
cmp_node.inputs[1].keyframe_insert(data_path="default_value", frame=1)
cmp_node.inputs[1].default_value = 0.8
cmp_node.inputs[1].keyframe_insert(data_path="default_value", frame=60)
# interpolation applied via the action fcurves afterward`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Troubleshooting
      </h2>
      <ul className="list-disc list-inside mt-2 space-y-2 text-sm">
        <li>
          <strong>Hard crease at the patch boundary.</strong> Add a{" "}
          <Link href="/tutorials/blender-tutorial-gn-smooth-by-angle-normal-split" className={lk}>
            Smooth by Angle node
          </Link>{" "}
          after the Join with angle ≈ 30°. The seam softens while ridgelines stay crisp.
        </li>
        <li>
          <strong>Viewport very slow at high subdivision levels.</strong>{" "}
          Level 3 produces 64× faces. Keep at Level 1 while tuning; switch to 2
          only for export. The <code>Level</code> input accepts a driver —
          a scene custom property can swap viewport vs render values automatically.
        </li>
        <li>
          <strong>Dense patches look flat despite subdivision.</strong> The node
          smooths existing geometry; it does not add detail. Pipe the dense subset
          through a{" "}
          <Link href="/tutorials/blender-tutorial-gn-set-position-noise-displacement" className={lk}>
            Set Position
          </Link>{" "}
          with finer-scale noise <em>after</em> subdivision for micro-displacement
          only where the extra vertices exist.
        </li>
        <li>
          <strong>GLB is larger than expected.</strong> Add a Triangulate node
          before export and set Draco level 6. For tiles &gt; 2 k tris, bake to a
          static object and remove the GN modifier.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside sources</h2>
      <ul className="list-disc list-inside mt-2 space-y-2 text-sm">
        <li>
          <a
            href="https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/mesh/operations/subdivide_mesh.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Subdivide Mesh Node
          </a>{" "}
          (CC-BY-SA-4.0, Blender Documentation Team). Authoritative reference
          for level range, Catmull-Clark algorithm and known limitations on
          non-manifold input. Related:{" "}
          <a
            href="https://github.com/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/blender/blender
          </a>
          .
        </li>
        <li>
          <a
            href="https://graphics.pixar.com/opensubdiv/docs/subdivision_surfaces.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenSubdiv — Subdivision Surfaces Overview
          </a>{" "}
          (Apache-2.0, Pixar Animation Studios). Explains the Catmull-Clark
          rules that Blender implements: face point, edge point, vertex
          repositioning. Understanding why T-junctions break the algorithm
          explains why selective subdivision requires geometric splitting.
          Related:{" "}
          <a
            href="https://github.com/PixarAnimationStudios/OpenSubdiv"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            PixarAnimationStudios/OpenSubdiv
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    steps: [
      {
        title: "Run blueprint.py",
        body: "Open Blender 5.1 → Scripting workspace → Open blueprint.py → Run Script. A 4-metre terrain grid appears. Switch to Material Preview to see warm-brown dense patches against sage-green coarse areas.",
      },
      {
        title: "Inspect the node graph",
        body: "Select the terrain object → Geometry Nodes workspace. Trace the two noise paths: top branch (height displacement, ShaderNodeTexNoise scale 1.4) and bottom branch (density, scale 2.2). Find the Compare node — this is the split point.",
      },
      {
        title: "Adjust the threshold",
        body: "In the Compare node, drag the B value from 0 → 1. At 0 the whole terrain is subdivided; at 1 nothing is. Watch the face count in the viewport status bar change. Set it back to 0.55.",
      },
      {
        title: "Enable wireframe overlay",
        body: "Viewport Overlays → Wireframe (Amount 1.0). Orbit the terrain. You can now see the dense patches (fine quad grid) meeting the sparse areas (coarse quads) at a hard seam. This seam is the Join output boundary.",
      },
      {
        title: "Add Smooth by Angle downstream",
        body: "In the node graph, add a Smooth by Angle node between Join and the Group Output. Set angle to 30°. The seam crease softens while ridgelines stay crisp. This is the minimum post-join step for any webxr export.",
      },
      {
        title: "Export adaptive_terrain.glb",
        body: "File → Export → glTF 2.0. Set Format to GLB, enable Draco compression level 6, Apply Modifiers ON. Inspect the file size vs a uniformly-subdivided equivalent (add a straight Subdivide Mesh after the grid, bypass the split branch) — the selective version is ~40% smaller.",
      },
      {
        title: "Run record.py",
        body: "Scripting workspace → Open record.py → Run Script. Renders 120 frames of the threshold animating 0.2→0.8→0.2 to public/library/videos/…/viewport.mp4. Requires ffmpeg on PATH.",
      },
      {
        title: "Record screen.mp4",
        body: "Follow SCREEN-RECORDING-NOTES.md: three takes covering wireframe contrast, live threshold slider, and animation playback. Save to public/library/videos/geometry-nodes/gn-subdivide-mesh-adaptive-noise-lod/screen.mp4.",
      },
    ],
  },
  {
    slug: "blender-tutorial-gn-subdivide-mesh-adaptive-noise-lod",
    title:
      "GN Subdivide Mesh — Adaptive Terrain LOD: Noise-Driven Selective Subdivision (Blender 5.1)",
    date: "2026-06-28",
    kind: "tutorial",
    excerpt:
      "GeometryNodeSubdivideMesh has no selection input — it divides every face uniformly. To subdivide selectively, split geometry with Separate Geometry first (FACE domain, noise field > threshold), run only the dense subset through Subdivide Mesh, then Join. Two independent Perlin fields drive height and density separately; a keyframed threshold animates the patch area for viewport.mp4.",
    Body: GnSubdivideMeshAdaptiveNoiseLodBody,
  },
);

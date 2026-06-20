import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        The WebXR mobile triangle budget sits at roughly 200 000 triangles per
        frame on a mid-range headset — less for complex scenes with many draw
        calls. A single un-decimated subdivided character, terrain patch, or
        photogrammetry scan can exceed that alone. The Decimate modifier is
        Blender&apos;s built-in LOD tool, but it is misused far more often than
        it is used correctly: most tutorials demonstrate only the default
        Collapse mode on whatever mesh happens to be open, producing lumpy
        artefacts that discredit the technique. The correct approach is to
        choose the algorithm that matches the <em>topology type</em> of the
        source mesh, not to drag the Ratio slider until something looks
        acceptable. This tutorial demonstrates all three algorithms and
        explains when each is the right choice. See the{" "}
        <Link href="/tutorials/blender-to-site-asset-pipeline" className={lk}>
          Blender-to-site asset pipeline
        </Link>{" "}
        for how the resulting GLBs are loaded and Draco-decoded at runtime in
        the WebXR scene.
      </p>

      <p>
        <strong>COLLAPSE mode</strong> implements the Garland-Heckbert Quadric
        Error Metrics (QEM) algorithm. Each vertex is assigned a quadric — a
        4×4 symmetric matrix encoding the squared distance from a point to the
        set of planes defined by that vertex&apos;s adjacent faces. Collapsing
        an edge merges two vertices; the merged vertex position is chosen to
        minimise the combined quadric error. Edges are collapsed in increasing
        cost order until the Ratio target is reached. The result is a mesh that
        retains triangles where curvature is high (nostrils, ear ridges,
        shoulder joints) and removes them where curvature is low (flat cheeks,
        broad back). This makes Collapse the correct mode for organic shapes —
        sculpts, VRM characters, displaced terrain — where the topology has no
        flat planar regions to exploit. The <strong>Symmetry</strong> flag
        constrains collapse pairs to maintain bilateral symmetry across the
        chosen axis; essential for characters modelled with X-Mirror enabled,
        but counterproductive for asymmetric scans. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-image-texture-heightmap-terrain"
          className={lk}
        >
          GN heightmap terrain tutorial
        </Link>{" "}
        produces dense, curved terrain meshes that benefit from Collapse
        decimation before GLB export.
      </p>

      <p>
        <strong>DISSOLVE mode</strong> (labelled &ldquo;Planar&rdquo; in the
        modifier panel) operates on a completely different principle. It
        identifies adjacent faces whose normals differ by less than the Angle
        Limit and merges them into a single n-gon. The n-gons are then
        triangulated for export. On a flat wall that has been subdivided 8
        times — producing 512 coplanar triangles — Planar dissolve collapses
        the entire wall to two triangles with <em>zero visual change</em>. This
        is impossible with QEM Collapse, which would introduce visible error at
        the same ratio. The critical parameter is{" "}
        <code>use_dissolve_boundaries = False</code>: keeping this False
        prevents the modifier from dissolving edges that are marked as sharp or
        that lie on UV seam boundaries — edges that appear coplanar but carry
        topological meaning that must be preserved. Setting it True can destroy
        UV islands and sharp-edge normal splits, causing import artefacts in
        Three.js. The complementary technique is the SubDiv + crease workflow
        covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-subdiv-crease-bevel-weight-hard-surface"
          className={lk}
        >
          hard-surface SubD tutorial
        </Link>
        : crease-weighted edges survive Planar dissolve because their sharp
        flag prevents coplanar merging.
      </p>

      <p>
        <strong>UNSUBDIV mode</strong> attempts to reverse one or more levels
        of Catmull-Clark subdivision. Each iteration merges every 2×2 quad
        block back into the single quad it was subdivided from. This works
        cleanly only when the mesh was produced by a Subdivision Surface
        modifier applied to a pure quad mesh. If the mesh has any triangles
        (from bevels, n-gon fills, or import), Un-Subdivide fails silently —
        it skips the irregular poles and leaves a ragged half-reversed mesh.
        The Iterations value must not exceed the number of SubDiv levels that
        were applied: setting Iterations = 3 on a mesh that was subdivided only
        twice will produce artefacts. The correct workflow is to apply SubDiv{" "}
        <em>before</em> adding the Decimate modifier, because Un-Subdivide reads
        the Catmull-Clark topology encoded in the applied mesh. If SubDiv
        remains as a live modifier above Decimate in the stack, Un-Subdivide
        sees the pre-subdivision topology and reverses the wrong level. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-subdiv-crease-bevel-weight-hard-surface"
          className={lk}
        >
          hard-surface SubD tutorial
        </Link>{" "}
        for the canonical apply-then-decimate workflow.
      </p>

      <p>
        The export path uses{" "}
        <code>export_apply=True</code> on the glTF exporter so that the source
        .blend file retains the live Decimate modifier — the Ratio slider
        remains tunable even after the GLB has been exported. The GLB exporter
        evaluates the modifier stack, triangulates any remaining n-gons from
        Planar dissolve, and applies Draco compression at level 6. Draco and
        Decimate are complementary: Draco reduces the byte size of each
        triangle&apos;s attribute data (positions, normals, UVs) whilst
        Decimate reduces the triangle count itself. A 50 000-triangle mesh
        with Draco at level 6 and Decimate Collapse at 0.12 results in roughly
        6 000 triangles at ~15 KB — feasible for a spatial scene with 20+
        simultaneous assets. The{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/decimate.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual: Decimate Modifier
        </a>{" "}
        (CC BY-SA 4.0, Blender Foundation) documents all socket defaults. An
        important omission there: the manual does not warn that{" "}
        <code>use_dissolve_boundaries = True</code> destroys UV seams — this
        tutorial corrects that gap.{" "}
        <a
          href="https://github.com/mrdoob/three.js/blob/dev/examples/jsm/modifiers/SimplifyModifier.js"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Three.js SimplifyModifier
        </a>{" "}
        (MIT, mrdoob et al.) provides a JavaScript-side runtime alternative
        when you need dynamic LOD in the browser — its algorithm is a simpler
        vertex-cost scheme without QEM, so it produces more visual error at the
        same reduction level, making offline Blender decimation preferable for
        any asset whose triangle count is known at build time.
      </p>
    </>
  );
}

const base = {
  date: "2026-06-20",
  slug: "blender-tutorial-modifier-decimate-lod-webxr-planar-collapse",
  title:
    "Modifier — Decimate: Planar, Collapse and Un-Subdivide for WebXR LOD Meshes (Blender 5.1)",
  description:
    "Three Decimate algorithms — DISSOLVE (Planar), COLLAPSE (Garland-Heckbert QEM) and UNSUBDIV (reverse Catmull-Clark) — each suited to a different input topology. Planar dissolve removes redundant coplanar edges from hard-surface meshes with zero visual change. QEM Collapse greedily preserves curvature on organic shapes. Un-Subdivide reverses exact subdivision levels on clean quad meshes. Together they reduce a 50 000-triangle asset to WebXR mobile-VR budget without visible quality loss.",
  tags: [
    "blender",
    "modifier",
    "decimate",
    "lod",
    "webxr",
    "glb",
    "mesh-optimisation",
    "planar-dissolve",
    "qem",
    "un-subdivide",
    "draco",
    "performance",
  ],
  body: Body,
  externalLinks: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/decimate.html",
      label:
        "Blender Manual: Decimate Modifier (CC-BY-SA 4.0 — Blender Foundation)",
      note: "Official modifier documentation covering Collapse ratio, Planar angle limit, Un-Subdivide iterations, and the Symmetry flag. Related projects: projects.blender.org/blender/blender-manual; Subdivision Surface modifier documentation at the same domain.",
    },
    {
      href: "https://github.com/mrdoob/three.js/blob/dev/examples/jsm/modifiers/SimplifyModifier.js",
      label: "Three.js SimplifyModifier (MIT — mrdoob et al.)",
      note: "Runtime JavaScript LOD alternative for browser-side dynamic decimation. Uses vertex-cost simplification (simpler than QEM) — produces more error at the same ratio than Blender's COLLAPSE, making offline Blender decimation preferable when triangle budget is known at build time. Related: three.js DRACOLoader (same repo) for decompressing Draco-encoded GLBs at runtime.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "forty-five minutes to one hour",
    difficulty: "beginner",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Comfortable adding and stacking modifiers in the Properties panel.",
      "Basic understanding of Blender's mesh topology (vertices, edges, faces).",
      "Blender 5.1 installed — Decimate API is stable from 2.8 onward.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Decimate modifier is CPU-only. A 50 000-triangle mesh at Collapse ratio 0.12 evaluates in under one second on any modern machine.",
      },
    ],
    steps: [
      {
        title: "Understand the three mode choice matrix",
        body: "Before touching the modifier, classify your input mesh:\n\n  ORGANIC / IRREGULAR TRIS → use COLLAPSE.\n    Examples: sculpted heads, photogrammetry scans, GN-evaluated blobs, fluid simulation snapshots.\n    Reason: QEM measures curvature implicitly via quadric error; it retains triangles where they carry shape information and removes them where they do not.\n\n  HARD-SURFACE / FLAT WALLS → use DISSOLVE (Planar).\n    Examples: architecture, mechanical parts, SubDiv-boxed props, terrain planes.\n    Reason: flat coplanar faces are redundant — their normals are identical. Dissolve removes them exactly without introducing any visual error.\n\n  CLEAN QUAD MESH FROM SUBDIV → use UNSUBDIV.\n    Examples: a character modelled from primitives and subdivided, a bevel-weighted prop with applied SubDiv.\n    Reason: Un-Subdivide reverses the exact Catmull-Clark operation with minimal error (it knows the inverse mapping).\n\nMixing modes — DISSOLVE on an organic mesh, COLLAPSE on a flat box — is the leading cause of bad decimation results.",
      },
      {
        title: "DISSOLVE — Planar decimate on an over-subdivided box",
        body: 'Create a cube and apply eight subdivision cuts:\n\n  bpy.ops.mesh.primitive_cube_add(size=1.0)\n  obj = bpy.context.active_object\n  bpy.ops.object.mode_set(mode="EDIT")\n  bpy.ops.mesh.subdivide(number_cuts=8)\n  bpy.ops.object.mode_set(mode="OBJECT")\n\nThe cube now has ~6 500 triangles, all on flat walls. In Edit Mode wireframe, every wall is a dense grid.\n\nAdd the modifier:\n  mod = obj.modifiers.new("Decimate", "DECIMATE")\n  mod.decimate_type = "DISSOLVE"\n  mod.angle_limit = math.radians(5.0)       # 5° threshold\n  mod.use_dissolve_boundaries = False       # ← critical: protects UV seams\n\nToggle the modifier eye icon. The face count drops from ~6 500 to 12 (6 quads × 2 tris each). The cube looks IDENTICAL because every dissolved face was coplanar.\n\nRaise the angle_limit to math.radians(45). Now faces meeting at 45° corner edges are dissolved — the cube becomes a sphere of n-gons. This is too aggressive: hard corners disappear. The 5° sweet-spot dissolves only dead-flat redundancy.',
      },
      {
        title: "COLLAPSE — QEM decimation on an organic displaced sphere",
        body: 'Create a dense UV sphere and displace it:\n\n  bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=48, radius=0.8)\n  obj = bpy.context.active_object\n  bpy.ops.object.shade_smooth()\n  # Add a Clouds texture and Displace modifier, then apply the Displace.\n\nThe sphere now has ~12 000 triangles with irregular bumpy geometry.\n\n  mod = obj.modifiers.new("Decimate", "DECIMATE")\n  mod.decimate_type = "COLLAPSE"\n  mod.ratio = 0.12          # keep 12% → ~1 440 triangles\n  mod.use_symmetry = True   # enforce X-axis bilateral symmetry\n  mod.symmetry_axis = "X"\n\nDrag ratio from 0.12 to 1.0 and back. Observe that bumpy high-curvature regions keep their triangles longest — at ratio 0.30, prominent bumps are still clearly visible while flat areas are already coarsely triangulated.\n\nKey failure mode: enabling Symmetry on an asymmetric mesh (one that was NOT modelled with X-Mirror) causes QEM to force paired collapses that may not exist — triggering worse visual error than free collapse. Always match the Symmetry flag to the mesh\'s actual symmetry.',
      },
      {
        title: "UNSUBDIV — reverse subdivision on a pre-subdivided sphere",
        body: 'Create an icosphere, apply Subdivision Surface, then add Un-Subdivide:\n\n  bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.9)\n  obj = bpy.context.active_object\n  sub = obj.modifiers.new("SubDiv", "SUBSURF")\n  sub.levels = 3\n  bpy.ops.object.modifier_apply(modifier="SubDiv")  # ← apply BEFORE adding Decimate\n\n  mod = obj.modifiers.new("Decimate", "DECIMATE")\n  mod.decimate_type = "UNSUBDIV"\n  mod.iterations = 2\n\nWHY apply SubDiv before adding Decimate: Un-Subdivide reads the mesh topology to identify the 2×2 quad blocks introduced by each subdivision level. If SubDiv is still a live modifier above Decimate, Un-Subdivide receives the un-subdivided icosphere (5 quads per face) and cannot find the expected 4×4 blocks — it produces only marginal reduction or garbage topology.\n\nIncrease iterations from 2 to 4. At 4 iterations the icosphere drops below the original 2-subdivision base mesh and artefacts appear at the pole caps where the original triangular icosphere faces created non-quad patches. This is the hard limit: Un-Subdivide cannot go below the original quad-mesh topology that was subdivided.',
      },
      {
        title: "Export three LOD GLBs and compare file sizes",
        body: 'With all three objects set up, export each to a separate GLB:\n\n  bpy.ops.object.select_all(action="DESELECT")\n  obj.select_set(True)\n  bpy.context.view_layer.objects.active = obj\n  bpy.ops.export_scene.gltf(\n      filepath="//lod_blob_collapse.glb",\n      export_format="GLB",\n      use_selection=True,\n      export_apply=True,               # evaluates Decimate at export\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_normals=True,\n  )\n\nexport_apply=True is the key parameter: it evaluates the entire modifier stack into a temporary mesh, exports that, and discards the temporary mesh — leaving the source .blend with the live Decimate modifier intact for re-tuning.\n\nCompare file sizes in the OS file browser:\n  - Original 12 000-tri sphere (no Decimate, no Draco): ~480 KB\n  - 1 440-tri Collapse + Draco L6: ~12 KB  (97.5% reduction)\n  - 6 500-tri box, no Decimate + Draco L6: ~95 KB\n  - 12-tri Planar-dissolved box + Draco L6: ~2 KB  (97.9% reduction)\n\nThe Draco compression alone achieves about 60–70% on regular topology; the Decimate reduction stacks multiplicatively on top.',
      },
    ],
    finalResult:
      "Three GLBs on disc: lod_sphere_unsubdiv.glb (~22 KB, 2 levels of Un-Subdivide reversed), lod_box_planar.glb (~2 KB, Planar-dissolved hard-surface), lod_blob_collapse.glb (~12 KB, 12% QEM Collapse of displaced sphere). The source .blend retains all three live Decimate modifiers for ratio re-tuning without re-exporting the full pipeline. Each GLB is Draco level-6 compressed and ready for KTX2-enabled Three.js.",
    variations: [
      "Adaptive Planar angle per mesh region: add a Vertex Group to the box, fill the sharp-corner edge loops with weight 1.0, and connect the Vertex Group to the Decimate modifier's vertex_group property. Faces adjacent to weight-1.0 vertices are excluded from the dissolve — corners retain their edge loops while flat wall faces are still merged. This lets you use a high angle limit (15°) without losing corner crispness.",
      "LOD chain for Three.js LOD node: export the same asset three times with COLLAPSE ratios of 1.0, 0.5, and 0.12. In Three.js, create an LOD object and add three levels: lod.addLevel(highMesh, 0), lod.addLevel(midMesh, 10), lod.addLevel(lowMesh, 25). The LOD node switches mesh automatically based on camera distance — high-poly when near, low-poly when far. Combine with Draco for maximum network-transfer efficiency.",
      "Decimate as non-destructive silhouette preview: add Decimate COLLAPSE at ratio 0.05 in a second viewport shading slot (Viewport Shading → Geometry → Wireframe) to preview the extreme LOD silhouette while sculpting at high detail. Toggle the modifier eye icon to compare. The viewport can display the full-detail mesh whilst the modifier preview shows the export-target topology.",
    ],
    troubleshooting: [
      {
        symptom:
          "Planar dissolve changes ratio is minimal — face count barely drops on the box",
        cause:
          "The angle_limit is in radians, not degrees. Passing degrees directly (e.g. 5.0 instead of math.radians(5.0)) sets a limit of 5 radians ≈ 286° — almost nothing qualifies as non-coplanar, so nothing dissolves.",
        fix: "Always convert: mod.angle_limit = math.radians(PLANAR_ANGLE_DEG). The valid range is 0 to math.radians(180). Practical useful range is math.radians(1) to math.radians(15).",
      },
      {
        symptom:
          "Un-Subdivide on a sphere with iterations=2 produces no change or a broken mesh",
        cause:
          "The Subdivision Surface modifier was not applied before adding the Decimate modifier. Un-Subdivide receives the un-subdivided mesh and cannot find the 2×2 quad blocks to collapse.",
        fix: "Apply the SubDiv modifier first (bpy.ops.object.modifier_apply), then add the Decimate UNSUBDIV modifier. The correct stack order: [no modifiers] → [applied SubDiv] → Decimate UNSUBDIV.",
      },
      {
        symptom:
          "QEM Collapse produces asymmetric artefacts on a character mesh despite Symmetry enabled",
        cause:
          "The mesh is not perfectly bilaterally symmetric — even a single off-axis vertex prevents the QEM solver from finding matching collapse pairs on both sides, forcing unpaired single-side collapses.",
        fix: "Disable Symmetry for meshes that are not exactly symmetric. Use the Mesh Symmetrize operator (Mesh → Symmetrize, Direction = +X to -X) before decimating if symmetric output is required.",
      },
      {
        symptom:
          "UV texture is heavily distorted on the GLB exported after Planar dissolve",
        cause:
          "use_dissolve_boundaries was set to True, causing UV-seam edges to be dissolved. The dissolved n-gons span multiple UV islands, forcing the exporter to triangulate them with arbitrary diagonal cuts that cross island boundaries.",
        fix: "Set mod.use_dissolve_boundaries = False. This preserves every UV-seam boundary edge even if it is geometrically coplanar. After fixing this, re-export the GLB and verify the UV layout in Blender's UV editor before and after dissolve.",
      },
    ],
  },
  base,
);

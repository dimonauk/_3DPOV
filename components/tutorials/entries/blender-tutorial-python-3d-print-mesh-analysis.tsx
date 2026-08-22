import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Python3dPrintMeshAnalysisBody() {
  return (
    <>
      <p>
        The <strong>3D Print Toolbox</strong> extension gives you a one-click
        mesh audit inside Blender, but it is an optional extension and its
        operators are context-dependent.  This tutorial replaces every check
        the toolbox performs using <code>bmesh</code> primitives directly —
        <code>edge.is_manifold</code>, <code>bm.calc_volume()</code>, and a
        per-face normal dot product — so the audit runs identically in the
        Scripting workspace, from the command line, and inside a headless
        CI pipeline.  The same script builds the test mesh (a chess pawn
        revolved from a profile curve), tags each face with an overhang
        severity float, and exports both a GLB heat-map and a binary STL
        ready for slicing.
      </p>

      <h2>What makes a mesh print-ready?</h2>
      <p>
        FDM and SLA slicers share four hard requirements.  Fail any one of
        them and the slicer either refuses to process the file or produces
        incorrect toolpaths:
      </p>
      <ol>
        <li>
          <strong>Manifold (watertight) geometry.</strong> Every edge must be
          shared by exactly two faces — no more, no fewer.  An edge shared by
          one face is a boundary (open shell); shared by three or more is a
          non-manifold T-junction.  Both break the inside/outside distinction
          that slicers rely on to generate infill and walls.
        </li>
        <li>
          <strong>Consistent outward normals.</strong> The slicer uses face
          winding order to determine which side is the exterior.  Mixed
          winding produces phantom internal walls or hollow shells that slice
          incorrectly.
        </li>
        <li>
          <strong>No overhangs beyond the printer&apos;s self-support angle.</strong>{" "}
          FDM filament bridges unsupported spans up to ~45° from horizontal.
          Steeper faces need slicer-generated supports.  Identifying them in
          Blender before export lets you redesign rather than patch in the slicer.
        </li>
        <li>
          <strong>No sliver faces.</strong> Triangles with near-zero area
          produce numerical instability in slicer ray-casting.  A minimum face
          area above ~1&nbsp;×&nbsp;10⁻⁸ m² (for metre-scale models) is safe.
        </li>
      </ol>

      <h2>Building the pawn by revolving a profile</h2>
      <p>
        The pawn is defined as a list of <code>(radius, z)</code> pairs.
        Entries with radius&nbsp;≈&nbsp;0 collapse to a single pole vertex;
        all others produce a ring of <code>N_SEGS</code> vertices spread
        evenly around the Z axis.  Adjacent ring pairs are stitched into quad
        bands; pole-to-ring transitions become triangle fans:
      </p>
      <pre>
        <code>{`PROFILE = [
    (0.000, -0.540),   # bottom pole
    (0.400, -0.490),   # base outer rim
    (0.360, -0.310),   # base shoulder
    (0.130, -0.060),   # neck
    (0.125,  0.180),   # shaft rising
    (0.270,  0.360),   # ball equator
    (0.160,  0.500),   # ball taper
    (0.000,  0.540),   # top pole
]`}</code>
      </pre>
      <p>
        Why define a pawn rather than importing one?  Because the profile
        table is the complete specification — radius is wall thickness at every
        height, z is the build-plate distance.  Adjusting one entry immediately
        updates the entire mesh.  See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-bmesh-dodecahedron"
          className={lk}
        >
          bmesh dodecahedron tutorial
        </Link>{" "}
        for the same construction philosophy applied to an algebraic solid.
      </p>

      <h2>Why recalc_face_normals is mandatory here</h2>
      <p>
        The bottom and top triangle fans naturally wind in opposite orientations.
        The bottom fan goes <code>[pole, ring[s], ring[s+1]]</code> (outward
        from below), but the top fan goes <code>[ring[s], ring[s+1], pole]</code>{" "}
        (inward from above) — these conventions do not agree.{" "}
        <code>bmesh.ops.recalc_face_normals()</code> propagates a consistent
        outward winding across all faces via a flood-fill over the edge
        adjacency graph.  Without it, <code>bm.calc_volume()</code> returns a
        value near zero and the overhang check is meaningless because all
        normals are stochastic.
      </p>
      <p>
        Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-mesh-topology-vertex-valence-heat-map"
          className={lk}
        >
          vertex valence heat-map tutorial
        </Link>
        , which operates on an imported mesh where normals are already correct.
        Starting from a freshly-constructed bmesh always requires an explicit
        normal pass.
      </p>

      <h2>The signed-volume invariant</h2>
      <p>
        <code>bm.calc_volume()</code> computes the divergence theorem integral
        over all triangulated faces:
      </p>
      <pre>
        <code>{`V = (1/6) × Σ  v₀ · (v₁ × v₂)   for all triangles`}</code>
      </pre>
      <p>
        The sign depends entirely on face orientation: outward normals
        produce a <em>positive</em> volume, inward normals a <em>negative</em>{" "}
        volume.  A result near zero means the mesh is open, self-intersecting,
        or has mixed normals — any of which will break a slicer.  For a
        valid print mesh, the test is simply <code>volume &gt; 0</code>.  This
        is the same invariant a production quality-assurance pipeline uses before
        forwarding a model to a print farm.
      </p>

      <h2>Overhang analysis: max(0, −normal.z)</h2>
      <p>
        The overhang severity formula is a one-liner per face:
      </p>
      <pre>
        <code>{`severity = max(0.0, -face.normal.z)`}</code>
      </pre>
      <p>
        When <code>face.normal.z = +1</code> the face points straight up —
        resting on the build plate, severity zero.  When{" "}
        <code>face.normal.z = −1</code> the face is a ceiling pointing straight
        down — maximum overhang, severity 1.0.  The{" "}
        <code>max(0, …)</code> clamp discards upward and vertical faces so they
        do not pollute the heat map with negative-severity values.
      </p>
      <p>
        The 45° threshold converts to a cosine via{" "}
        <code>cos(45°)&nbsp;≈&nbsp;0.707</code>.  Any face whose{" "}
        <code>normal.z &lt; −0.707</code> is steeper than 45° from horizontal
        and needs support.  The neck underside of a pawn is a typical offender:
        the profile flares outward as it rises, producing a shallow{" "}
        ~25° overhang that most printers handle unsupported; but the base
        outer rim at −0.49 m has a near-horizontal underside that reliably
        needs a brim or raft.
      </p>
      <p>
        The severity float is stored as a named geometry attribute,{" "}
        <code>overhang_severity</code>, on each face.  The material&apos;s{" "}
        ShaderNodeAttribute reads it in EEVEE, feeding a green-to-red
        ColorRamp — the same pipeline the{" "}
        <Link
          href="/tutorials/blender-tutorial-vertex-colour-attributes"
          className={lk}
        >
          vertex colour attributes tutorial
        </Link>{" "}
        uses for runtime attribute visualisation.  Baking the heat map to a
        texture for GLB export follows exactly the workflow in the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          texture baking tutorial
        </Link>
        .
      </p>

      <h2>STL export in Blender 5.1</h2>
      <p>
        Blender 4.2 introduced <code>bpy.ops.wm.stl_export()</code> as a
        unified I/O operator, replacing the older{" "}
        <code>bpy.ops.export_mesh.stl()</code>.  The key axis parameters
        are <code>forward_axis=&apos;Y&apos;</code> and{" "}
        <code>up_axis=&apos;Z&apos;</code>, which map Blender&apos;s world
        space to the FDM slicer convention (build plate in XY, Z is build
        height).  The <code>ascii_format=False</code> flag writes a binary
        STL — typically 5× smaller than the ASCII variant with no information
        loss; all major slicers read binary STL correctly.
      </p>
      <p>
        The GLB export additionally passes{" "}
        <code>export_attributes=True</code> so the{" "}
        <code>overhang_severity</code> float attribute is written as a custom
        vertex accessor — accessible in Three.js via{" "}
        <code>mesh.geometry.attributes.overhang_severity</code> for real-time
        support visualisation in a WebXR viewer.  See the{" "}
        <Link
          href="/tutorials/blender-tutorial-faceted-gem-webxr"
          className={lk}
        >
          WebXR faceted gem tutorial
        </Link>{" "}
        for how the Holoflow atelier consumes per-vertex attributes from a GLB.
      </p>

      <h2>Extending the audit: self-intersection detection</h2>
      <p>
        The four checks in <code>blueprint.py</code> handle the most common
        failures.  Self-intersecting geometry (two non-adjacent faces that
        pierce each other) requires a BVH tree query:
      </p>
      <pre>
        <code>{`from mathutils.bvhtree import BVHTree

bvh = BVHTree.FromBMesh(bm, epsilon=1e-6)
overlaps = bvh.overlap(bvh)          # list of (face_idx, face_idx) pairs
non_adjacent = [
    (a, b) for a, b in overlaps
    if a != b and not are_adjacent(bm.faces[a], bm.faces[b])
]`}</code>
      </pre>
      <p>
        <code>BVHTree.overlap(self)</code> returns pairs of primitives that
        overlap within <code>epsilon</code>.  Filtering out face-pairs that
        share an edge isolates true geometric intersections.  For the pawn —
        a convex-ish revolution — self-intersections are impossible, but
        imported STL files from parametric CAD software frequently contain
        them wherever Boolean operations were not cleaned up.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/addons/mesh/3d_print_toolbox.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — 3D Print Toolbox
          </a>{" "}
          (CC-BY-SA 4.0, Blender Foundation) — documents the same four
          categories of mesh errors this tutorial checks manually.  The
          &ldquo;Check All&rdquo; section maps directly to the four
          functions in <code>analyse_and_tag()</code>.  Related:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/meshes/editing/mesh/cleanup.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Mesh Cleanup
          </a>{" "}
          covers the interactive counterpart operations (Merge by Distance,
          Fill Holes, Recalculate Normals).
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njanakiev/blender-scripting
          </a>{" "}
          (MIT, Nicolas Janakiev) — headless bpy examples demonstrating
          the operator-free construction philosophy.  Sibling project:{" "}
          <a
            href="https://github.com/njanakiev"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njanakiev GitHub profile
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO
          </a>{" "}
          (Apache-2.0, Khronos Group) — the exporter bundled with Blender;{" "}
          <code>export_attributes=True</code> is documented in its changelog
          for Blender 4.0+.  Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF specification
          </a>{" "}
          and{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Models"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF sample models
          </a>
          .
        </li>
      </ul>
    </>
  );
}

const base = {
  slug: "blender-tutorial-python-3d-print-mesh-analysis",
  title:
    "bpy + bmesh — 3D Print Prep: Manifold Validation, Overhang Analysis & STL Export (Blender 5.1)",
  date: "2026-06-10",
  kind: "tutorial" as const,
  excerpt:
    "Build a chess-pawn mesh via bmesh revolution, then audit it for 3D printing without any extension: detect non-manifold edges, confirm watertight winding via signed volume, tag every face with an overhang severity heat map, and export both a visualisation GLB and a binary STL ready for FDM/SLA slicing.",
  Body: Python3dPrintMeshAnalysisBody,
};

export const entry: Entry = buildInstructable(
  {
    time: "one evening",
    difficulty: "intermediate",
    cost: "free",
    goal: "Write a self-contained bpy script that constructs a chess pawn via bmesh revolution, runs a four-point print-readiness audit (manifold, winding, overhangs, slivers), stores per-face overhang severity as a named attribute with a heat-map material, and exports both a Draco GLB and a binary STL.",
    supplies: {
      software: [
        {
          name: "Blender",
          version: "5.1",
          url: "https://www.blender.org/download/",
          cost: "free",
          platforms: ["windows", "macos", "linux"],
        },
      ],
      materials: [],
      tools: [],
    },
    steps: [
      {
        title: "Open blueprint.py in the Scripting workspace",
        body: "Launch Blender 5.1 → switch to the Scripting workspace → click Open → navigate to public/library/blends/scripting/python-3d-print-mesh-analysis/blueprint.py. Do not run it yet.",
      },
      {
        title: "Read the PROFILE constant",
        body: "Scroll to the PROFILE list. Each (radius, z) pair defines one cross-section of the pawn. Identify the two poles (radius=0) at the top and bottom, and find the neck — the tightest cross-section at (0.130, -0.060). The neck overhang is where most slicers request support.",
      },
      {
        title: "Run the script",
        body: "Press Run Script (Alt+P). Watch the Info header for any errors. On success, the Python Console prints the analysis report: expected output is Non-manifold edges: 0, PRINT READY: True, and a positive volume.",
      },
      {
        title: "Inspect the heat map in Layout",
        body: "Switch to the Layout workspace. The pawn appears with the green-to-red overhang heat map. Rotate to the front view (Numpad 1) and look at the base underside — it should be red (facing straight down = overhang severity ≈ 1.0). The shaft and ball should be green.",
      },
      {
        title: "Verify manifold status in Edit Mode",
        body: "Enter Edit Mode (Tab) → switch to Edge select (2). Go to Select menu → Select All by Trait → Non Manifold. Nothing should be selected. If any edges are highlighted, the build failed — check the Python Console for errors.",
      },
      {
        title: "Check the signed volume in the Python Console",
        body: "Open a Python Console panel. Type: import bmesh; bm = bmesh.new(); bm.from_mesh(bpy.data.objects['pawn_print_ready'].data); bm.normal_update(); print(bm.calc_volume()). The output should be a positive float around 0.09–0.11 (volume of the pawn in cubic Blender units).",
      },
      {
        title: "Run record.py for the viewport animation",
        body: "In the Scripting workspace, open record.py and run it. EEVEE renders 360 frames to public/library/videos/scripting/python-3d-print-mesh-analysis/viewport.mp4. The video shows the heat-map pawn rotating — useful for thumbnail and demo footage.",
      },
      {
        title: "Import the STL into a slicer",
        body: "Open PrusaSlicer or UltiMaker Cura → import pawn_print_ready.stl. Enable the support visualisation overlay. The red zones in Cura's overhang view should match the red zones in the Blender heat map — confirming the analysis is correct.",
      },
    ],
    troubleshooting: [
      {
        symptom: "PRINT READY: False — Non-manifold edges: > 0",
        cause:
          "This should not occur with the unmodified PROFILE constant, as the revolution produces a closed mesh. The most likely cause is that N_SEGS was set to a very low value (< 4), causing degenerate quad faces at the poles.",
        fix: "Ensure N_SEGS >= 8. Values below 4 cause the revolution to produce triangles that share edges with three faces at the poles (non-manifold T-junctions).",
      },
      {
        symptom: "calc_volume() returns a negative number",
        cause:
          "recalc_face_normals() did not run, or the bmesh was re-opened from the mesh without calling normal_update() first. Negative volume = all normals are inverted.",
        fix: "In the analysis function, call bm.normal_update() before bm.calc_volume(). If the mesh was imported from an external STL, also call bmesh.ops.recalc_face_normals(bm, faces=bm.faces) before analysing.",
      },
      {
        symptom: "bpy.ops.wm.stl_export() raises AttributeError or OperatorNotFound",
        cause:
          "The stl_export operator was introduced in Blender 4.2 as the unified I/O operator. If Blender is older, the operator does not exist.",
        fix: "Upgrade to Blender 4.2 or later. For older versions, use bpy.ops.export_mesh.stl(filepath=STL_PATH, use_mesh_modifiers=True, axis_forward='Y', axis_up='Z') instead.",
      },
      {
        symptom: "Heat map is entirely green — no overhang faces detected",
        cause:
          "The ShaderNodeAttribute node is not finding the overhang_severity attribute. This usually means export_attributes=True was not set in the GLB export, or the attribute was created after the material was linked.",
        fix: "Ensure analyse_and_tag(mesh) is called before make_material() and mesh.materials.append(mat), so the attribute exists on the mesh when the material tries to read it. Re-run the script from the top.",
      },
    ],
  },
  base,
);

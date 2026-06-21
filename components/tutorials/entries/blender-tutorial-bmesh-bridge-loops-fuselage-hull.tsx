import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bmesh.ops.bridge_loops</code> is the Python equivalent of Blender&apos;s{" "}
        <em>Bridge Edge Loops</em> tool (Ctrl+E → Bridge Edge Loops in Edit Mode).
        It takes all edges from two separate, co-planar-or-not ring loops and fills
        the gap with a clean strip of quads — one quad column per segment.  For
        fuselage-style hull geometry, where the cross-section silhouette matters
        more than the detail, it is the sharpest tool available: define eight
        numbers and get a watertight mesh.
      </p>

      <h2>Why not extrude_discrete_faces?</h2>
      <p>
        The{" "}
        <Link href="/tutorials/blender-tutorial-python-bmesh-extrude-scale-fractal-spikes" className={lk}>
          fractal spike-ball tutorial
        </Link>{" "}
        uses <code>extrude_discrete_faces</code> — each face grows independently
        along its own normal.  That is the right call when the source faces are
        irregular and you want divergent spikes.  For a fuselage you need the
        opposite: two rings with a defined correspondence between vertices,
        bridged into perfectly aligned quad columns.  <code>bridge_loops</code>{" "}
        resolves the correspondence automatically from graph connectivity, which
        is exactly the property you want.
      </p>

      <h2>How create_circle sets up each ring</h2>
      <p>
        <code>bmesh.ops.create_circle</code> builds a closed polygon on the XY
        plane at the world origin, returning a dict with a <code>verts</code> key.
        Critical parameter: <code>cap_ends=False</code> — you want an{" "}
        <em>open</em> ring of edges, not a filled disc.  After creation, translate
        each vertex&apos;s <code>.co.z</code> to the ring&apos;s profile height.
        Do this <em>before</em> calling bridge_loops; the operator reads world
        positions at call time.
      </p>
      <pre>
        <code>{`res = bmesh.ops.create_circle(bm,
    cap_ends=False,
    segments=SEGMENTS,
    radius=r,
)
for v in res['verts']:
    v.co.z = z    # move to profile station`}</code>
      </pre>

      <h2>Filtering ring edges — why not pass bm.edges?</h2>
      <p>
        <code>bridge_loops</code> identifies which edges belong to which cycle by
        graph connectivity: it finds two separate connected components in the edge
        selection.  If you pass <code>bm.edges</code> (all edges in the mesh),
        every ring is connected to its neighbours through already-bridged quads
        and the algorithm cannot distinguish which two cycles to bridge.  You must
        pass only edges whose both endpoints are in the source rings:
      </p>
      <pre>
        <code>{`vset = set(rings[i])
lo_edges = [e for e in bm.edges
            if e.verts[0] in vset and e.verts[1] in vset]`}</code>
      </pre>
      <p>
        This pattern is safe because <code>create_circle</code> creates only
        edges within the ring — there are no cross-edges yet — so the filter is
        equivalent to <code>res['verts']</code>&apos;s adjacency list.
      </p>

      <h2>bridge_loops parameters that matter</h2>
      <ul>
        <li>
          <strong>use_cyclic=True</strong> — <em>mandatory</em> for closed rings.
          Without it, bridge_loops treats each ring as an open chain, connects the
          first vertex of one to the first of the other, and leaves exactly one
          quad-wide gap in the hull.  No error is raised; the mesh just has a hole.
        </li>
        <li>
          <strong>use_smooth=False</strong> — keeps sharp facet normals, matching
          the{" "}
          <Link href="/tutorials/blender-tutorial-gn-extrude-mesh-panel-inset-procedural" className={lk}>
            panel inset
          </Link>{" "}
          and cel-shading aesthetic.  Set True only if you want a smooth, blended
          hull — you will also want to call <code>bm.normal_update()</code>{" "}
          immediately after.
        </li>
        <li>
          <strong>twist_offset=0</strong> — vertex index offset between the two
          rings.  The default of 0 aligns angle=0 on ring[i] with angle=0 on
          ring[i+1].  If two adjacent rings were built with different starting
          angles (e.g. one rotated by half a segment), a non-zero twist_offset
          corrects the visual twist in the quads.  With{" "}
          <code>create_circle</code> producing consistent starting angles,
          twist_offset=0 is always correct here.
        </li>
      </ul>

      <h2>Closing the tips with a fan cap</h2>
      <p>
        <code>bridge_loops</code> only fills between two open loops; it does not
        close the ends.  The quickest cap is a vertex fan: one centre vertex plus
        n triangles, one per ring segment.  The winding order controls which way
        the normal points:
      </p>
      <pre>
        <code>{`# Tail cap (normal points −Z): a, b, centre — CCW when viewed from below
bm.faces.new([ring[j], ring[(j+1)%n], centre])

# Nose cap (normal points +Z): b, a, centre — reversed winding
bm.faces.new([ring[(j+1)%n], ring[j], centre])`}</code>
      </pre>
      <p>
        Rather than hand-checking per-cap winding, the blueprint calls
        <code> bmesh.ops.recalc_face_normals</code> once after all caps are placed.
        Blender resolves outward vs inward by majority vote across the closed
        volume — reliable as long as the hull is watertight (which bridge_loops
        guarantees for the side panels, and the fan caps close the tips).
      </p>

      <h2>The PROFILE as creative data</h2>
      <p>
        The eight <code>(z, radius)</code> pairs in{" "}
        <code>PROFILE</code> are the entire creative model.  Extending the profile
        with more stations (e.g. adding a mid-section weapon nacelle or a
        secondary engine flare) requires only inserting a new tuple — no viewport
        work.  This data-driven approach means the hull is fully version-controlled
        and diff-readable alongside the rest of the Holoflow asset pipeline (see{" "}
        <Link href="/tutorials/blender-to-site-asset-pipeline" className={lk}>
          Blender to Site Asset Pipeline
        </Link>
        ).
      </p>

      <h2>Flat shading and the low-poly pipeline</h2>
      <p>
        Setting <code>poly.use_smooth = False</code> on every polygon after{" "}
        <code>bm.to_mesh()</code> activates flat (faceted) shading: each quad
        reports its geometric face normal unchanged, no interpolation.  This is
        the same shading mode used in the{" "}
        <Link href="/tutorials/blender-tutorial-modifier-skin-remesh-character-blocking" className={lk}>
          Skin + Voxel Remesh character blocking
        </Link>{" "}
        tutorial for the initial blocking pass.  For WebXR the benefit is fewer
        bytes in the normal stream — Draco can compress flat-shaded models more
        aggressively because adjacent normals are identical and de-duplicate well.
        The{" "}
        <Link href="/tutorials/blender-tutorial-modifier-solidify-shell-architecture-3d-print" className={lk}>
          Solidify
        </Link>{" "}
        tutorial discusses when to reintroduce smooth shading after initial
        hard-surface blocking.
      </p>

      <h2>Outside references</h2>
      <ul>
        <li>
          <strong>Blender Python API — bmesh.ops</strong> (CC-BY-SA-4.0 · Blender
          Documentation Team){" "}
          <code>https://docs.blender.org/api/current/bmesh.ops.html</code> — the
          canonical reference for every <code>bmesh.ops.*</code> operator, its
          input keys, and return dict layout.  Also covers{" "}
          <code>create_circle</code>, <code>recalc_face_normals</code>, and{" "}
          <code>remove_doubles</code>.  Sibling pages:{" "}
          <code>bmesh.html</code> (BMesh type reference) and the Blender
          developer portal at <code>developer.blender.org</code>.
        </li>
        <li>
          <strong>blender-scripting</strong> (MIT · Nicolas Janakiev){" "}
          <code>https://github.com/njanakiev/blender-scripting</code> — a collection
          of headless bpy scripts for procedural mesh generation.  The{" "}
          <code>src/spring.py</code> file demonstrates bridge_loops across a helix
          profile, a close analogue to the fuselage technique.  Sibling works on
          the same account include <code>blender-addon-template</code> and several
          parametric surface scripts.
        </li>
        <li>
          <strong>glTF-Blender-IO</strong> (Apache-2.0 · Khronos Group){" "}
          <code>https://github.com/KhronosGroup/glTF-Blender-IO</code> — the
          official glTF 2.0 exporter bundled with Blender.  The{" "}
          <code>export_draco_mesh_compression_enable=True</code> flag used in this
          blueprint is implemented here.  Related: the glTF spec repository and
          glTF-Sample-Models for testing.
        </li>
      </ul>
    </>
  );
}

const base = {
  slug: "blender-tutorial-bmesh-bridge-loops-fuselage-hull",
  title: "Python — bmesh bridge_loops: Fuselage Hull from Stacked Profile Rings",
  libraryPath: "blends/scripting/bmesh-bridge-loops-fuselage-hull",
  publishedAt: "2026-06-21",
  author: "Holoflow Studio",
  Body,
};

export const entry: Entry = buildInstructable(
  {
    time: "one evening",
    difficulty: "intermediate",
    cost: "free",
    goal: "Write a bpy script that builds a watertight sci-fi fuselage hull using bmesh.ops.bridge_loops across eight profile rings, closes the tips with triangle fans, applies flat shading, and exports a WebXR-ready GLB — no viewport modelling required.",
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
        title: "Open blueprint.py",
        body: "Blender 5.1 → Scripting workspace → Text Editor → Open → navigate to public/library/blends/scripting/bmesh-bridge-loops-fuselage-hull/blueprint.py. Read the PROFILE constant: each (z, radius) tuple is a horizontal cross-section of the fuselage, ordered tail to nose.",
      },
      {
        title: "Study the PROFILE and SEGMENTS constants",
        body: "The eight pairs encode: tail nozzle (narrow), engine bell flare, belly (widest), mid-body cylinder, forward taper, neck, canopy bubble, nose tip. SEGMENTS=16 is shared by every ring — bridge_loops requires identical segment counts between the two rings it connects. Mismatch crashes silently with a degenerate mesh.",
      },
      {
        title: "Run the script",
        body: "Press Run Script (Alt+P). Three [holoflow] print lines confirm the .blend path, the GLB path, and success. The 3D viewport will show the fuselage hull object in Layout workspace.",
      },
      {
        title: "Inspect edge loop topology",
        body: "Layout workspace → select object → Tab (Edit Mode) → key 2 (Edge select). Alt+Click any horizontal edge to select a full ring loop. Eight distinct loops — one per profile station — should each select cleanly with no stray edges. Orbit to confirm the quad strips between rings are perfectly aligned.",
      },
      {
        title: "Inspect the fan caps",
        body: "In Edge select mode, orbit to view the nose and tail ends. Alt+Z (wireframe overlay) shows the fan triangles radiating from a central vertex. Compare to the quad panels on the hull sides — fans are acceptable at pointed tips but would cause shading artefacts on wide flat ends (use grid_fill there instead).",
      },
      {
        title: "Material Preview",
        body: "Object Mode → Z → Material Preview. The HullBase material shows dark gunmetal with a faint cold-blue engine-glow emission across the hull faces. The emission at 30% of EMIT_STR keeps it subtle — raise Emission Strength in the Shader Editor to push the neon-hull look harder.",
      },
      {
        title: "Reshape with PROFILE edits",
        body: "In blueprint.py, try flattening the belly: change (0.60, 1.20) to (0.60, 1.60). Rerun the script. The new hull reappears immediately — no vertex pushing needed. This data-driven silhouette editing is the core creative workflow for this technique.",
      },
      {
        title: "Render the turntable",
        body: "Open record.py in the same Scripting workspace → Run Script. EEVEE renders 60 frames (24 fps, 2.5 s) to public/library/videos/scripting/bmesh-bridge-loops-fuselage-hull/viewport.mp4. Confirm the hull rotates 360° with engine bloom visible.",
      },
      {
        title: "Verify the GLB",
        body: "Drag fuselage_hull.glb into gltf.report or the Babylon.js sandbox. Confirm: node named 'fuselage_hull', Draco decoded, Y-up orientation, HullBase material, flat normals. Poly count: (7 bridges × 16 quads) + (2 × 16 fan triangles) = 112 quads + 32 triangles = 144 faces.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Hull has a single quad-wide strip missing along its length",
        cause: "bridge_loops called with use_cyclic=False — it treats the ring as an open chain and stops one step short of closing the loop.",
        fix: "Add use_cyclic=True to the bmesh.ops.bridge_loops() call. This is mandatory for any ring produced by create_circle or any other closed loop.",
      },
      {
        symptom: "Quads between two rings are visibly twisted — vertices connect diagonally",
        cause: "twist_offset is non-zero, or two adjacent rings were produced with different starting vertex angles (e.g. one ring was rotated before bridging).",
        fix: "With create_circle, all rings start at angle=0 so twist_offset=0 is always correct. If you use mathutils.Matrix.Rotation to orient a ring differently before bridging, compute the angle difference in segments and set twist_offset accordingly.",
      },
      {
        symptom: "Nose or tail cap normals point inward — tip looks black in Material Preview",
        cause: "Fan triangle winding order is reversed for that cap; recalc_face_normals corrects outward direction by majority-vote but needs a closed, watertight mesh to work reliably.",
        fix: "Ensure all bridged panels and both fan caps are built before calling recalc_face_normals. If one cap is still wrong, flip it manually: select cap faces → Mesh → Normals → Flip or Alt+N → Flip.",
      },
      {
        symptom: "bridge_loops raises RuntimeError: 'Unable to bridge selected edges'",
        cause: "The edges passed contain more or fewer than two distinct connected components — either a ring is missing edges, or already-bridged quads are included in the selection.",
        fix: "Use the _ring_edges() helper to filter strictly: only edges whose both endpoints are in the target ring's vertex list. Print len(lo_edges), len(hi_edges) — each must equal SEGMENTS.",
      },
      {
        symptom: "GLB export error: 'context is incorrect'",
        cause: "bpy.ops.export_scene.gltf() must be called from the Scripting workspace (VIEW_3D context active) or in headless --background mode.",
        fix: "Run blueprint.py directly from the Scripting workspace tab, not from a standalone text editor panel in a non-3D layout. Alternatively: blender --background fuselage_hull.blend --python blueprint.py from the terminal.",
      },
    ],
  },
  base,
);

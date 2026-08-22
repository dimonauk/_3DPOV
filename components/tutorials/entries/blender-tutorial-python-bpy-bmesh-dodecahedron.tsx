import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function PythonBpyBmeshDodecahedronBody() {
  return (
    <>
      <p>
        The <strong>bmesh module</strong> is Blender&apos;s low-level mesh
        construction API — it operates directly on vertex, edge, and face data
        without invoking any operator, so it works identically inside the Text
        Editor, from a headless batch command, and inside an add-on operator.
        This tutorial builds a mathematically exact regular dodecahedron (12
        regular pentagonal faces, 20 vertices) from golden-ratio coordinates,
        assigns a Principled BSDF material through the node-tree data API, and
        exports a Draco-compressed GLB — all in one script, no clicks required.
      </p>

      <h2>bmesh vs bpy.ops — the right tool for each job</h2>
      <p>
        Every time you call a <code>bpy.ops</code> function, Blender internally
        checks the operator&apos;s poll function against the current{" "}
        <em>context</em> — which area is active, which mode the viewport is in,
        what is selected.  In a script that runs non-interactively (batch
        render, CI pipeline, add-on background thread) that context is often
        wrong, and the operator either silently no-ops or raises a
        &ldquo;context is incorrect&rdquo; runtime error.  The direct data API
        — <code>bpy.data.meshes.new()</code>,{" "}
        <code>bpy.data.objects.new()</code>, <code>bmesh.new()</code> — has no
        poll function and no context dependency.  It always works.
      </p>
      <p>
        The practical rule: use <code>bpy.ops</code> only for things that
        genuinely require the interactive state machine (sculpting strokes,
        modal transforms, file dialogue).  Use <code>bpy.data</code> +{" "}
        <code>bmesh</code> for everything constructive.  The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-mesh-boolean-hard-surface"
          className={lk}
        >
          Mesh Boolean hard-surface tutorial
        </Link>{" "}
        is a good counterpoint: it keeps Booleans inside Geometry Nodes precisely
        to avoid the context fragility of <code>bpy.ops.object.boolean()</code>.
      </p>

      <h2>Golden-ratio vertex coordinates</h2>
      <p>
        A regular dodecahedron can be constructed from three algebraic families
        of vertices, all of which involve the golden ratio
        φ&nbsp;=&nbsp;(1&nbsp;+&nbsp;√5)&nbsp;/&nbsp;2&nbsp;≈&nbsp;1.618:
      </p>
      <ul>
        <li>
          <strong>8 cube corners</strong> — (±1, ±1, ±1).  The dodecahedron
          circumscribes a cube; these are the cube&apos;s own vertices.
        </li>
        <li>
          <strong>12 rectangle vertices</strong> — three groups of four, each
          formed by (0, ±1/φ, ±φ) and its two even cyclic permutations.  Each
          group lies in one coordinate plane as a golden rectangle (aspect ratio
          φ&nbsp;:&nbsp;1).
        </li>
      </ul>
      <p>
        All 20 vertices sit on a circumsphere of radius&nbsp;√3.{" "}
        <code>blueprint.py</code> normalises by dividing by&nbsp;√3 and
        multiplying by <code>SCALE</code>, so the exported GLB always has a
        predictable bounding-box diameter of{" "}
        <code>2&nbsp;×&nbsp;SCALE</code>&nbsp;Blender units.  This matters for{" "}
        <Link
          href="/tutorials/blender-tutorial-faceted-gem-webxr"
          className={lk}
        >
          WebXR placement
        </Link>
        , where object size in metres maps directly to perceived scale.
      </p>

      <h2>Building the mesh with bmesh.faces.new()</h2>
      <p>
        The construction has four stages:
      </p>
      <ol>
        <li>
          <code>bm = bmesh.new()</code> — creates an in-memory mesh buffer
          not yet linked to any Blender data-block.
        </li>
        <li>
          <code>bm.verts.new(Vector(v) * factor)</code> — appends each of the
          20 vertices.  Multiplying by <code>factor</code> here rather than
          rescaling the object later means the GLB contains world-scale
          geometry with no residual transform to apply on the
          receiver side.
        </li>
        <li>
          <code>bm.verts.ensure_lookup_table()</code> — bmesh rebuilds its
          internal index pool only on demand; without this call, accessing
          <code>bm_verts[i]</code> by integer index raises an{" "}
          <code>IndexError</code>.
        </li>
        <li>
          <code>bm.faces.new([bm_verts[i] for i in face_indices])</code> —
          five vertices per call, 12 calls total.  bmesh infers all 30 edges
          automatically from the face adjacency.
        </li>
      </ol>
      <p>
        After <code>bm.normal_update()</code> and <code>bm.to_mesh(mesh)</code>,
        the bmesh buffer is freed with <code>bm.free()</code>.  Forgetting{" "}
        <code>bm.free()</code> leaks the in-memory buffer; in a script that
        creates hundreds of objects this becomes a significant memory drain.
      </p>

      <h2>Flat shading without an operator</h2>
      <p>
        The Shade Flat button in the viewport calls{" "}
        <code>bpy.ops.object.shade_flat()</code>, which requires an active
        object in Object Mode with the 3D Viewport focused.  In a batch script
        none of these are guaranteed.  The data API equivalent is:
      </p>
      <pre>
        <code>{`for poly in mesh.polygons:
    poly.use_smooth = False`}</code>
      </pre>
      <p>
        This iterates the polygon layer of the converted mesh (not the bmesh
        buffer) and sets each face to hard-edge shading.  The result is
        identical to the Shade Flat operator but has zero context dependency.
        Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-faceted-custom-split-normals"
          className={lk}
        >
          custom split normals workflow
        </Link>
        , which achieves a similar visual by storing per-loop normals — a more
        complex but more portable approach because it survives subdivision.
      </p>

      <h2>Material via the node-tree data API</h2>
      <p>
        <code>bpy.data.materials.new(&quot;name&quot;)</code> returns a material with
        nodes disabled.  Setting <code>mat.use_nodes = True</code> creates the
        default Principled BSDF + Material Output node tree.
        <code>mat.node_tree.nodes.get(&quot;Principled BSDF&quot;)</code> retrieves
        the node by its label — reliable in English-locale Blender; for
        locale-agnostic code, filter by <code>node.type == &apos;BSDF_PRINCIPLED&apos;</code>.
        Inputs are set directly by name:
      </p>
      <pre>
        <code>{`bsdf.inputs["Base Color"].default_value = (0.85, 0.62, 0.18, 1.0)
bsdf.inputs["Metallic"].default_value   = 0.85
bsdf.inputs["Roughness"].default_value  = 0.15`}</code>
      </pre>
      <p>
        The Anisotropic value of 0.40 gives each pentagonal face a slight
        directional highlight, making the faceted planes visually distinct under
        an area light.  The effect is subtle in EEVEE and pronounced in Cycles.
        See the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          texture baking tutorial
        </Link>{" "}
        for how to freeze these highlights into a baked AO/normal map for
        real-time delivery.
      </p>

      <h2>Export from script context</h2>
      <p>
        <code>bpy.ops.export_scene.gltf()</code> is the one operator call that
        cannot be avoided — the glTF exporter is implemented as a file-handler
        operator with no data-API equivalent.  In a script it works because the
        Scripting workspace provides a valid context with no selected area
        restriction on file-handler operators.  The key parameters:
      </p>
      <ul>
        <li>
          <code>export_apply=True</code> — bakes any pending object transforms
          into vertex positions; the{" "}
          <Link href="/tutorials/blender-to-site-asset-pipeline" className={lk}>
            site asset pipeline
          </Link>{" "}
          requires GLBs with no residual scale or rotation.
        </li>
        <li>
          <code>export_yup=True</code> — converts Blender&apos;s +Z-up convention
          to the glTF +Y-up convention required by three.js and WebXR runtimes.
        </li>
        <li>
          <code>export_draco_mesh_compression_level=6</code> — Draco level 6
          is the Holoflow studio default; higher levels save bytes but increase
          decode time on low-power XR headsets.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/api/current/bmesh.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Python API — bmesh module
          </a>{" "}
          (CC-BY-SA 4.0, Blender Documentation Team) — authoritative reference
          for all bmesh types, methods, and sequence objects.  The{" "}
          <code>bm.verts.ensure_lookup_table()</code> requirement is documented
          in the &ldquo;Custom data&rdquo; section.
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
          (MIT, Nicolas Janakiev) — a collection of headless bpy examples that
          demonstrates the same operator-free construction philosophy.  Sibling
          projects: the author&apos;s{" "}
          <a
            href="https://github.com/njanakiev"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njanakiev GitHub profile
          </a>{" "}
          hosts further bpy and data-science tooling.
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
          (Apache-2.0, Khronos Group) — the exporter bundled with Blender.
          Related: the{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF specification repository
          </a>{" "}
          and{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Models"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Sample-Models
          </a>
          .
        </li>
      </ul>
    </>
  );
}

const base = {
  slug: "blender-tutorial-python-bpy-bmesh-dodecahedron",
  title:
    "bpy + bmesh — Procedural Dodecahedron via Python Script (Blender 5.1)",
  date: "2026-06-07",
  kind: "tutorial" as const,
  excerpt:
    "Build a mathematically exact regular dodecahedron from golden-ratio coordinates using the bmesh direct-data API — no primitive operators, no Geometry Nodes. Assign a Principled BSDF material via the node-tree API and export a Draco-compressed GLB entirely from one Python script.",
  Body: PythonBpyBmeshDodecahedronBody,
};

export const entry: Entry = buildInstructable(
  {
    time: "one evening",
    difficulty: "intermediate",
    cost: "free",
    goal: "Write a self-contained bpy script that constructs a regular dodecahedron via bmesh, applies a gold Principled BSDF, keyframes a 360° spin, and exports a studio-ready GLB — with zero bpy.ops calls in the mesh construction path.",
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
        body: "Launch Blender → switch to the Scripting workspace → click Open → navigate to public/library/blends/scripting/python-bpy-bmesh-dodecahedron/blueprint.py. The script loads into the Text Editor. Do not run it yet.",
      },
      {
        title: "Read the VERTS and FACES constants",
        body: "Scroll to the VERTS list (20 entries) and FACES list (12 entries). Each FACES tuple contains 5 vertex indices ordered CCW from outside. Verify vertex 0 appears in exactly three faces (F0, F1, F2) — this is the degree-3 connectivity of a regular dodecahedron.",
      },
      {
        title: "Run the script",
        body: "Press Run Script (or Alt+P). Watch the Info header for errors. When successful, the Python Console at the bottom of the Scripting workspace prints three [holoflow] lines confirming .blend and .glb written, and the Euler check V−E+F = 2.",
      },
      {
        title: "Inspect the mesh in the Layout workspace",
        body: "Switch to Layout workspace. Select the dodecahedron object. Press Tab to enter Edit Mode. In the header, enable Face select mode (3 key). You should see 12 flat-shaded pentagons. Press A to select all — the status bar should read Verts: 20 | Edges: 30 | Faces: 12.",
      },
      {
        title: "Verify flat shading in the Properties panel",
        body: "Back in Object Mode, open the Object Data Properties panel (the green triangle icon). Under Normals, confirm Custom Split Normals is unchecked and Auto Smooth is off — flat shading here comes from poly.use_smooth=False set on each polygon, not from a normal modifier.",
      },
      {
        title: "Inspect the material node tree",
        body: "Open the Shader Editor (Shift+F3). Confirm one Principled BSDF node with Base Color = gold, Metallic ≈ 0.85, Roughness ≈ 0.15, Anisotropic ≈ 0.40. These values were set via bsdf.inputs[name].default_value — no operator was involved.",
      },
      {
        title: "Run record.py for the viewport animation",
        body: "In the Scripting workspace, open record.py and run it. EEVEE renders 120 frames to public/library/videos/scripting/python-bpy-bmesh-dodecahedron/viewport.mp4. Expect 2–5 minutes on a mid-range GPU at 1920×1080.",
      },
      {
        title: "Inspect the GLB in gltf.report",
        body: "Drag dodecahedron.glb into gltf.report. Confirm: one mesh node named 'dodecahedron', one material 'dodecahedron_gold', Draco compression decoded, no residual transform (identity matrix on the node), +Y up orientation.",
      },
    ],
    troubleshooting: [
      {
        symptom: "IndexError: index out of range when accessing bm_verts[i]",
        cause:
          "bm.verts.ensure_lookup_table() was not called before the face-construction loop. bmesh does not maintain a random-access index pool until explicitly asked.",
        fix: "Add bm.verts.ensure_lookup_table() immediately after the last bm.verts.new() call, before any bm_verts[i] access.",
      },
      {
        symptom: "All faces appear smooth-shaded in the viewport after running the script",
        cause:
          "The mesh was modified after bm.to_mesh() and before the polygon loop, or the loop ran on the wrong mesh data-block.",
        fix: "Confirm the polygon loop (for poly in mesh.polygons: poly.use_smooth = False) runs on the same mesh object returned by bpy.data.meshes.new(), not on a second mesh created by an import or primitive operator.",
      },
      {
        symptom: "GLB export fails with 'context incorrect'",
        cause:
          "bpy.ops.export_scene.gltf() was called from a context where no 3D viewport or file handler is reachable — e.g., from a background thread or a headless batch run without --python-use-system-env.",
        fix: "Run the script in the Scripting workspace (interactive) or pass the filepath directly on the command line: blender --background dodecahedron.blend --python record.py. For headless use, override the context: bpy.ops.export_scene.gltf({'area': None}, filepath=GLB_PATH, ...).",
      },
    ],
  },
  base,
);

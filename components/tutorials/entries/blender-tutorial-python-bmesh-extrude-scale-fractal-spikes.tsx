import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bmesh.ops.extrude_discrete_faces</code> lifts each face as a
        topologically isolated unit — no shared base edges with neighbours.
        Run it iteratively on the tip caps and you get a self-similar fractal
        spike-ball: every generation is proportionally smaller than its parent
        because the extrude length is derived from{" "}
        <code>sqrt(face.calc_area())</code>.  The result is a 1&thinsp;360-face
        mesh built entirely from the bmesh direct-data API, no operator context
        required, with two material slots separating the dark metallic base from
        the cyan-emissive tips.
      </p>

      <h2>extrude_discrete vs extrude_face_region</h2>
      <p>
        <code>extrude_face_region</code> bridges adjacent face edges into a
        connected shell — correct for the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-solidify-shell-architecture-3d-print"
          className={lk}
        >
          Solidify modifier&apos;s manifold wall
        </Link>
        , wrong for spikes.{" "}
        <code>extrude_discrete_faces</code> extrudes every input face
        independently, leaving an open gap between adjacent columns.  For a
        triangle, <code>result[&apos;faces&apos;]</code> = one cap + three side quads.
        The cap sits at the original face position immediately after extrusion —
        its normal still aligns with <code>orig_normal</code> before any
        translate has moved it.
      </p>

      <h2>Identifying the cap with a normal dot product</h2>
      <p>
        Side quad normals are perpendicular to <code>orig_normal</code> (dot
        ≈ 0); the cap is parallel (dot ≈ 1.0):
      </p>
      <pre>
        <code>{`cap = max(new_faces, key=lambda f: f.normal.dot(orig_normal))`}</code>
      </pre>
      <p>
        <code>bm.normal_update()</code> is only needed at the end of each
        iteration pass — not inside the per-face loop — because bmesh
        initialises normals for newly created faces.  This is the same
        orientation pattern used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-bmesh-dodecahedron"
          className={lk}
        >
          bmesh dodecahedron tutorial
        </Link>
        .
      </p>

      <h2>Self-similar spike lengths from face area</h2>
      <p>
        After iteration&nbsp;1, each cap has been scaled down by{" "}
        <code>SCALE_FACTOR</code>&nbsp;(0.58), so its area ≈{" "}
        <code>0.58²&nbsp;× original</code>.  Because spike height&nbsp;=
        &nbsp;<code>sqrt(face_area)&nbsp;× EXTRUDE_FACTOR</code>, the sub-spike
        height is automatically <code>0.58&nbsp;× parent_height</code> — no
        explicit iteration multiplier.  Convergent heights per iteration:
        0.36&nbsp;→ 0.21&nbsp;→ 0.12&nbsp;→ 0.07&nbsp;units (unit sphere).
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-repeat-zone-crystal-cluster"
          className={lk}
        >
          GN Repeat Zone crystal cluster
        </Link>{" "}
        achieves a related growth pattern in Geometry Nodes; bmesh gives
        finer per-face identity control.
      </p>

      <h2>The 3×3 space trap when scaling around a pivot</h2>
      <p>
        <code>bmesh.ops.scale</code> accepts a 3×3 <code>space</code> matrix
        — rotation/scale only, no translation.  Passing a 4×4{" "}
        <code>Matrix.Translation(pivot).inverted()</code> will raise{" "}
        <code>TypeError</code> or silently drop the translation.  The correct
        approach for an arbitrary pivot is a direct vertex loop:
      </p>
      <pre>
        <code>{`ctr = cap.calc_center_median()
for v in cap.verts:
    v.co = ctr + (v.co - ctr) * SCALE_FACTOR`}</code>
      </pre>

      <h2>Per-face material_index, flat shading, and GLB export</h2>
      <p>
        <code>face.material_index</code> is a first-class bmesh attribute —
        set it before <code>bm.to_mesh()</code>.  Slot&nbsp;0 = dark indigo
        PBR (metallic 0.85); slot&nbsp;1 = pure Emission (cyan, strength 5.0)
        on the 80 final-iteration caps.  Flat shading via{" "}
        <code>poly.use_smooth&nbsp;=&nbsp;False</code> on the converted mesh
        requires no operator context.  Export follows the apply-on-duplicate
        pattern — source keyframes stay live in the .blend; see the{" "}
        <Link href="/tutorials/blender-to-site-asset-pipeline" className={lk}>
          site asset pipeline
        </Link>{" "}
        for why every studio GLB must be Y-up with no residual transform.
        For how emission maps translate to a{" "}
        <Link href="/tutorials/blender-tutorial-faceted-gem-webxr" className={lk}>
          WebXR scene via KHR_materials_emissive_strength
        </Link>
        , see the faceted gem tutorial.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a href="https://docs.blender.org/api/current/bmesh.ops.html"
            className={lk} target="_blank" rel="noopener noreferrer">
            Blender Python API — bmesh.ops
          </a>{" "}
          (CC-BY-SA 4.0, Blender Documentation Team) — operator signatures,
          return dicts, and the <code>use_normal_flip</code> flag on{" "}
          <code>extrude_discrete_faces</code>.  Related:{" "}
          <a href="https://docs.blender.org/api/current/bmesh.html"
            className={lk} target="_blank" rel="noopener noreferrer">
            bmesh module overview
          </a>.
        </li>
        <li>
          <a href="https://github.com/njanakiev/blender-scripting"
            className={lk} target="_blank" rel="noopener noreferrer">
            njanakiev/blender-scripting
          </a>{" "}
          (MIT, Nicolas Janakiev) — headless bpy scripts demonstrating the
          operator-free direct-data API.  Sibling projects on the{" "}
          <a href="https://github.com/njanakiev" className={lk}
            target="_blank" rel="noopener noreferrer">author&apos;s profile</a>{" "}
          extend the approach to data visualisation.
        </li>
        <li>
          <a href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk} target="_blank" rel="noopener noreferrer">
            glTF-Blender-IO
          </a>{" "}
          (Apache-2.0, Khronos Group).  Related:{" "}
          <a href="https://github.com/KhronosGroup/glTF" className={lk}
            target="_blank" rel="noopener noreferrer">glTF spec</a>{" "}
          and{" "}
          <a href="https://github.com/KhronosGroup/glTF-Sample-Models"
            className={lk} target="_blank" rel="noopener noreferrer">
            sample models
          </a>.
        </li>
      </ul>
    </>
  );
}

const base = {
  slug: "blender-tutorial-python-bmesh-extrude-scale-fractal-spikes",
  title: "Python — bmesh Fractal Spike-Ball: Iterative extrude_discrete_faces + Cap Scale (Blender 5.1)",
  date: "2026-06-21",
  kind: "tutorial" as const,
  excerpt: "Build a fractal spike-ball via iterative bmesh.ops.extrude_discrete_faces: each pass extrudes tip caps independently, translates along the face normal, and scales toward the cap centre. Self-similar sub-spikes emerge naturally from area-proportional lengths. Exports Draco GLB with dark PBR base + cyan-emissive tips.",
  Body,
};

export const entry: Entry = buildInstructable(
  {
    time: "one evening",
    difficulty: "intermediate",
    cost: "free",
    goal: "Write a self-contained bpy script that builds a 4-iteration fractal spike-ball via bmesh.ops.extrude_discrete_faces, assigns a two-slot material (dark PBR base + cyan emission tips), keyframes a 360° spin, and exports a studio-ready GLB — no bpy.ops mesh construction calls.",
    supplies: {
      software: [
        { name: "Blender", version: "5.1", url: "https://www.blender.org/download/", cost: "free", platforms: ["windows", "macos", "linux"] },
      ],
      materials: [],
      tools: [],
    },
    steps: [
      {
        title: "Open blueprint.py",
        body: "Blender 5.1 → Scripting workspace → Open → navigate to public/library/blends/scripting/python-bmesh-extrude-scale-fractal-spikes/blueprint.py. Read the parameter block: ICO_SUBDIVISIONS, ITERATIONS, EXTRUDE_FACTOR, SCALE_FACTOR.",
      },
      {
        title: "Run the script",
        body: "Press Run Script (Alt+P). On success, three [holoflow] print lines confirm .blend, .glb, and face count (1 360 faces with defaults).",
      },
      {
        title: "Inspect spike topology",
        body: "Layout workspace → select object → Tab (Edit Mode) → key 3 (Face select). Orbit to see four generations of spikes. A selects all — status bar: 1 360 faces.",
      },
      {
        title: "Verify material slots",
        body: "Material Properties → confirm SpikeBase (slot 0) and SpikeTip (slot 1). In 3D Viewport: Z → Material Preview — tips appear bright cyan against the dark metallic base.",
      },
      {
        title: "Experiment with SCALE_FACTOR",
        body: "Change to 0.40 (needle-thin tips) or 0.70 (fat sub-spikes, less self-similar). Revert to 0.58 for the default aesthetic.",
      },
      {
        title: "Render and record",
        body: "F12 for a preview frame (bloom makes emissive tips glow). Then open record.py and run it — outputs viewport.mp4 (60 frames, 2.5 s at 24 fps).",
      },
      {
        title: "Inspect the GLB",
        body: "Drag fractal_spike_ball.glb into gltf.report. Confirm: node 'fractal_spike_ball', two materials, Draco decoded, identity transform, Y-up.",
      },
    ],
    troubleshooting: [
      {
        symptom: "All faces render in the same material — no cyan tips",
        cause: "face.material_index assigned after bm.free(), or tip_set references invalidated by an intermediate bmesh structural call.",
        fix: "Place the material_index loop immediately before bm.to_mesh(mesh) with no bmesh structural ops between the last _grow_spikes() call and the loop.",
      },
      {
        symptom: "Spikes grow inward",
        cause: "Face normals pointing inward — normals not updated before the growth loop.",
        fix: "Add bm.normal_update() immediately after bmesh.ops.create_icosphere(). For stubborn inversion: bmesh.ops.recalc_face_normals(bm, faces=bm.faces).",
      },
      {
        symptom: "GLB export raises 'context override deprecated'",
        cause: "bpy.ops.export_scene.gltf() with a {'area': None} override dict is unsupported in Blender 4.0+.",
        fix: "Remove the context dict argument. Run from the Scripting workspace directly, or headless: blender --background file.blend --python blueprint.py.",
      },
    ],
  },
  base,
);

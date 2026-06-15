import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnBevelMeshEdgeAngleChamferBody() {
  return (
    <>
      <p>
        The Bevel Mesh node in Geometry Nodes places an automatic chamfer on
        every edge that passes a boolean field test — no Edit Mode Ctrl+B, no
        Bevel modifier competing for stack position. The trick is pairing it
        with the Edge Angle node: feed the per-edge unsigned dihedral angle
        into a Compare node, threshold at 30&deg;, and the resulting boolean
        field becomes the Selection input. Sharp corners get chamfered; smooth
        transitions stay untouched. Chamfer width, segment count, and the angle
        threshold are all live modifier panel controls.
      </p>
      <p className="mt-3">
        This technique connects directly to the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-extrude-mesh-panel-lines"
          className={lk}
        >
          GN Extrude Mesh panel lines tutorial
        </Link>{" "}
        (the upstream mesh-cutting step that produces the inset recess
        chamfered here), the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-edge-crease-subdiv-hard-surface"
          className={lk}
        >
          edge crease + Subdivision Surface tutorial
        </Link>{" "}
        (the non-GN alternative for holding hard edges through Subdivision),
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-ao-pointiness-edge-highlight"
          className={lk}
        >
          AO + Pointiness edge highlight tutorial
        </Link>{" "}
        (the shader technique that makes these chamfer loops visually sing),
        and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-geonodes-tree-api"
          className={lk}
        >
          Python GN tree API tutorial
        </Link>{" "}
        (the bpy pattern used in <code>blueprint.py</code> here).
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Why Bevel Mesh instead of the Bevel modifier?
      </h2>
      <p>
        The Bevel modifier sits in the modifier stack and runs before or after
        Subdivision Surface depending on its position. Its selection method is
        either a vertex group (requiring manual weight painting) or a fixed
        angle limit property. The GN Bevel Mesh node receives its{" "}
        <em>Selection</em> as a computed boolean field — any GN expression:
        angle comparison, proximity to a surface, a named attribute written by
        a simulation zone, a pointiness approximation, or a random mask. The
        node graph makes the logic visible and fully non-destructive.
      </p>
      <p className="mt-2">
        A secondary reason: GN modifiers can expose clean group inputs as
        modifier panel sliders. Dragging <em>Chamfer Width</em> from 0.001 m to
        0.06 m live in the viewport is the fastest way to communicate the
        technique to a client — the chamfer grows and shrinks without leaving
        the Object Data context.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        The Edge Angle node — what it actually outputs
      </h2>
      <p>
        <code>GeometryNodeInputMeshEdgeAngle</code> has no inputs; it reads the
        current mesh topology from context and outputs two values per edge:
      </p>
      <ul className="list-disc list-inside text-sm space-y-1 mt-2">
        <li>
          <strong>Unsigned Angle</strong> — the angle between the two adjacent
          face normals, in radians. 0&nbsp;= perfectly coplanar (flat). π&nbsp;=
          faces point in opposite directions (interior surface of a flipped
          solid). A cube edge is exactly π/2 (90&deg; = 1.5708 rad).
        </li>
        <li>
          <strong>Signed Angle</strong> — positive for convex edges (exterior
          corners), negative for concave edges (interior grooves). Useful when
          you want to chamfer only convex edges and leave grooves sharp.
        </li>
      </ul>
      <p className="mt-2">
        The Compare node converts the scalar angle to a boolean: for a 30&deg;
        threshold (0.5236 rad), any edge with a dihedral &gt;&nbsp;30&deg; feeds
        a <code>True</code> selection into Bevel Mesh.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# Edge angle arithmetic
import math

# Cube has six faces. Each edge is shared by exactly two faces,
# each meeting at a right angle.
cube_edge_unsigned = math.pi / 2   # 1.5708 rad (90°) — well above any
                                   # reasonable threshold

# Panel recess inset edges: the outer loop dihedral depends on inset depth.
# For INSET_DEPTH=0.04 on a BOX_Z=0.3 block: angle ≈ arctan(0.04/0.10) ≈ 22°
# → below a 30° threshold if the recess is shallow, above it if steep.
# Choosing the threshold is an artistic decision, not a fixed constant.

# The Compare node (FLOAT, GREATER_THAN) in Python:
n_cmp = nodes.new("FunctionNodeCompare")
n_cmp.data_type = "FLOAT"
n_cmp.operation = "GREATER_THAN"
# A = Edge Angle (unsigned), B = Group Input "Angle Threshold"
# Result = True (bevel this edge) when A > B`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Building the GN tree via Python
      </h2>
      <p>
        The <code>blueprint.py</code> uses the Blender 4.0+ tree interface API
        (<code>tree.interface.new_socket()</code> instead of the old{" "}
        <code>tree.inputs.new()</code>). Sockets created in this order become
        the modifier panel fields in this order — geometry first, then the three
        float/int controls.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`ng = bpy.data.node_groups.new("HS_Chamfer", "GeometryNodeTree")
iface = ng.interface

# First INPUT geometry + first OUTPUT geometry are auto-wired to the object mesh
iface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
iface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

s_width = iface.new_socket("Chamfer Width", in_out="INPUT", socket_type="NodeSocketFloat")
s_width.default_value = 0.025
s_width.min_value     = 0.001
s_width.max_value     = 0.5

s_angle = iface.new_socket("Angle Threshold", in_out="INPUT", socket_type="NodeSocketFloat")
s_angle.subtype       = "ANGLE"    # displays as degrees in UI, stores radians
s_angle.default_value = math.radians(30.0)

# Link order: Group Input → Edge Angle → Compare → Bevel Mesh → Group Output
links.new(n_ea.outputs["Unsigned Angle"],  n_cmp.inputs["A"])
links.new(n_in.outputs["Angle Threshold"], n_cmp.inputs["B"])
links.new(n_cmp.outputs["Result"],         n_bvl.inputs["Selection"])
links.new(n_in.outputs["Chamfer Width"],   n_bvl.inputs["Amount"])`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        GLB export with materialised GN modifier
      </h2>
      <p>
        Blender&rsquo;s GLB exporter honours{" "}
        <code>export_apply=True</code>, which materialises every modifier stack
        before writing. The exported mesh contains the actual chamfered
        geometry, not the raw base mesh. The GN modifier is not embedded in
        the GLB — consumers see the final polygon result.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`bpy.ops.export_scene.gltf(
    filepath                             = bpy.path.abspath("//junction_block.glb"),
    use_selection                        = True,
    export_apply                         = True,   # materialises GN modifier
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = "WEBP",
)
# Result: chamfered geometry in GLB, Draco-compressed, WebP textures.
# The GN node tree is not included — only the evaluated mesh survives.`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Variants and extensions
      </h2>
      <ul className="list-disc list-inside text-sm space-y-2 mt-2">
        <li>
          <strong>Convex-only bevel.</strong> Replace the Unsigned Angle
          &gt;&nbsp;threshold chain with Signed Angle &gt;&nbsp;0 (concave
          edges have negative signed angle). Interior grooves stay razor-sharp;
          exterior corners bevel.
        </li>
        <li>
          <strong>Variable-width chamfer.</strong> Multiply Chamfer Width by a
          noise field before connecting to Bevel Mesh Amount. Each edge receives
          a different-width bevel driven by position — useful for organic
          wear-pattern effects.
        </li>
        <li>
          <strong>Named attribute gate.</strong> Pipe a{" "}
          <code>Named Attribute (Boolean)</code> node through an{" "}
          <code>Boolean AND</code> with the angle compare, so only
          paint-mask-selected regions receive the chamfer.
        </li>
        <li>
          <strong>Vertex mode.</strong> Set <code>n_bvl.mode = &quot;VERTICES&quot;</code>{" "}
          to bevel individual vertices rather than edges — produces a faceted
          spherical corner instead of an angled strip.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Failure modes</h2>
      <ul className="list-disc list-inside text-sm space-y-2 mt-2">
        <li>
          <strong>No edges bevel despite correct angle.</strong> The Edge Angle
          node counts only edges that are shared by <em>exactly two</em> faces.
          Boundary edges (one face, open mesh) output 0.0 — they are never
          selected by the compare. Close any mesh holes before applying the
          chamfer modifier.
        </li>
        <li>
          <strong>Bevel produces overlapping faces on thin geometry.</strong>{" "}
          Chamfer Width &gt; half the shortest adjacent edge. Reduce Width or
          lower Segments to 1.
        </li>
        <li>
          <strong>GLB looks un-chamfered in the browser viewer.</strong>{" "}
          Confirm <code>export_apply=True</code>. Without it the raw pre-GN
          mesh is written.
        </li>
        <li>
          <strong>
            <code>FunctionNodeCompare</code> Result always False.
          </strong>{" "}
          Check that <code>data_type = &quot;FLOAT&quot;</code> is set{" "}
          <em>before</em> reading or writing the inputs. Changing{" "}
          <code>data_type</code> after linking can silently reroute sockets to
          the wrong index.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Sources</h2>
      <ul className="list-disc list-inside text-sm space-y-1">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/bevel_mesh.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual &mdash; Bevel Mesh Node
          </a>{" "}
          &mdash; CC-BY-SA&nbsp;4.0, Blender Documentation Team. Mode (EDGES /
          VERTICES), Amount, Profile Factor, Segments. Related:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/read/edge_angle.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Edge Angle Node
          </a>{" "}
          and{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/bevel.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Bevel Modifier
          </a>{" "}
          (stack-based alternative).
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender-scripting &mdash; Nicolas Janakiev
          </a>{" "}
          &mdash; MIT. bmesh pattern reference: create, scale, inset, to_mesh.
          Related:{" "}
          <a
            href="https://github.com/njanakiev/blender-scripting/tree/master/scripts"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            scripts directory
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/geometry-nodes/gn-bevel-mesh-edge-angle-chamfer",
    time: "twenty to thirty minutes",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1"],
      tools: [
        "Scripting workspace — Text Editor",
        "Geometry Nodes workspace — node graph",
        "Properties ▸ Modifier — HS_Chamfer panel",
        "3D Viewport — solid shade with Edge Angle overlay",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py",
        body: "Scripting workspace → open blueprint.py → Run Script (Alt+P). A junction block (1.2 × 0.6 × 0.3 m) with a panel recess appears. The HS_Chamfer modifier is applied and the block is exported to junction_block.glb.",
      },
      {
        title: "Inspect the GN tree",
        body: "Select junction_block. Open Geometry Nodes workspace. Trace the tree: Group Input → Edge Angle → Compare (FLOAT, GREATER_THAN) → Bevel Mesh → Group Output. The Compare node reads Angle Threshold from Group Input; the Edge Angle node has no inputs — it reads topology from context.",
      },
      {
        title: "Live-edit chamfer width",
        body: "Properties ▸ Modifier (spanner icon) → HS_Chamfer. Drag Chamfer Width from 0.001 m to 0.06 m. The chamfer grows live in the viewport without entering Edit Mode. Return to 0.025 m.",
      },
      {
        title: "Adjust segments",
        body: "Change Segments from 2 to 4. Two additional edge loops appear per bevel, giving a sharper concave profile. At Segments = 1 the bevel is a single angled face. Return to 2.",
      },
      {
        title: "Change angle threshold",
        body: "Set Angle Threshold to 60° — only the sharpest cube corners (90° edges) still bevel; the inset recess edges (≈22°) are excluded. Set to 15° — nearly every edge bevels, including the flat-panel seams. Return to 30°.",
      },
      {
        title: "Verify original mesh is unchanged",
        body: "Tab into Edit Mode. The base mesh has only the original verts from the cube + inset operation — no bevel loops in data. Tab out: GN modifier re-applies the chamfer non-destructively.",
      },
      {
        title: "Run record.py",
        body: "Scripting workspace → open record.py → Run Script. Renders 180 frames at 30 fps to public/library/videos/geometry-nodes/gn-bevel-mesh-edge-angle-chamfer/viewport.mp4: frames 1–60 grow width 0.001 → 0.06 m, 61–90 return to 0.025 m, 91–180 rotate 360°.",
      },
    ],
    troubleshooting: [
      {
        symptom: "No edges are chamfered despite non-zero Chamfer Width",
        cause:
          "Edge Angle outputs 0.0 for boundary edges (edges with only one adjacent face). The compare returns False for every edge.",
        fix: "Select the mesh in Edit Mode and use Mesh ▸ Clean Up ▸ Fill Holes to close any open boundary loops, then re-run.",
      },
      {
        symptom: "Chamfer produces overlapping or inside-out faces at corners",
        cause:
          "Chamfer Width exceeds half the length of the shortest adjacent edge — bevel loops overlap.",
        fix: "Reduce Chamfer Width, or reduce Segments to 1 and keep Width conservative.",
      },
      {
        symptom: "Compare Result is always False",
        cause:
          "data_type was set after node links were created, silently rerouting sockets.",
        fix: "Set n_cmp.data_type = 'FLOAT' before calling links.new(). If re-running the script, the _purge() function removes the old tree.",
      },
    ],
    finalResult:
      "A sci-fi junction block (1.2 × 0.6 × 0.3 m) with a GN Chamfer modifier that automatically bevels every edge sharper than 30°. Chamfer Width, Segments, and Angle Threshold are live modifier panel controls. GLB exported at ~80 KB with Draco 6 + WebP. A 180-frame viewport animation demonstrates the width-grow effect and a 360° rotation.",
  },
  {
    slug: "blender-tutorial-gn-bevel-mesh-edge-angle-chamfer",
    title:
      "GN Bevel Mesh Node + Edge Angle — Procedural Hard-Surface Chamfer (Blender 5.1)",
    date: "2026-06-15",
    kind: "tutorial",
    excerpt:
      "Use the Geometry Nodes Bevel Mesh node with an Edge Angle → Compare field chain to automatically chamfer only the sharp edges of a hard-surface mesh. Chamfer width, segment count, and dihedral threshold are live modifier panel sliders — no Edit Mode work required.",
    Body: GnBevelMeshEdgeAngleChamferBody,
  },
);

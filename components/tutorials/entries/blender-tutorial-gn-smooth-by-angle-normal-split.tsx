import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender 4.1 quietly removed two properties that every online tutorial
        from 2020 to 2023 relied on:{" "}
        <code>bpy.types.Mesh.use_auto_smooth</code> and{" "}
        <code>auto_smooth_angle</code>. Scripts that set them will crash in
        Blender 5.1 with an <code>AttributeError</code>. The Object Data
        Properties panel no longer has an <em>Auto Smooth</em> tick. The
        replacement is{" "}
        <strong>
          <code>GeometryNodeSmoothByAngle</code>
        </strong>{" "}
        — available both as a one-click &ldquo;Smooth by Angle&rdquo; modifier
        and as a first-class node inside any Geometry Nodes tree. This tutorial
        covers both forms, explains the critical ordering constraint, and shows
        how the <code>sharp_edge</code> attribute the node writes travels
        through the glTF exporter into WebXR normal data.
      </p>
      <p>
        The demo mesh is a 16-sided prism. Its side-to-side dihedral angle is
        exactly 360&deg;&frasl;16&nbsp;=&nbsp;22.5&deg;. Its cap-to-side
        dihedral is 90&deg;. Setting the Angle threshold to&nbsp;30&deg; leaves
        the sides smooth and marks the cap ring sharp — the most common
        hard-surface WebXR profile. Dropping to&nbsp;15&deg; exceeds both
        dihedral classes and produces a fully faceted appearance. Drag the
        single group input socket and the mesh updates live. Two GLBs are
        exported to compare — study both in a glTF viewer to confirm the
        different normal splits.
      </p>

      <h2>Why Auto Smooth was removed</h2>
      <p>
        In Blender&rsquo;s pre-4.1 model, smooth shading was toggled per-face
        and the <em>Auto Smooth</em> checkbox applied a post-process pass that
        split custom normals wherever the face angle exceeded a stored threshold.
        This was a hidden side-effect baked into mesh data — not a modifier, not
        a GN node, not something visible in the modifier stack. The Blender core
        team moved it to a proper GN node in 4.1 so that the operation is
        composable, revertable, and shows up in the dependency graph. Old files
        are migrated on open: Blender adds a <em>Smooth by Angle</em> modifier
        automatically when it detects <code>use_auto_smooth=True</code> on a
        mesh being loaded.
      </p>

      <h2>The node: GeometryNodeSmoothByAngle</h2>
      <p>
        The node has three inputs and one geometry output:
      </p>
      <ul>
        <li>
          <strong>Mesh</strong> (Geometry) — the incoming mesh to process.
        </li>
        <li>
          <strong>Angle</strong> (Float, radians) — the dihedral threshold.
          Edges whose adjacent face normals subtend an angle above this value
          receive <code>sharp_edge&nbsp;=&nbsp;True</code>; edges below
          receive <code>sharp_edge&nbsp;=&nbsp;False</code>.
        </li>
        <li>
          <strong>Ignore Sharpness</strong> (Boolean, default False) — when
          False the node composes with existing sharp marks: a hand-marked sharp
          edge stays sharp regardless of its angle. When True the node ignores
          all pre-existing sharp marks and writes purely angle-derived values.
          Use True only when you want to completely replace manual crease work.
          Compare with the edge crease approach in the{" "}
          <Link
            href="/tutorials/blender-tutorial-gn-edge-crease-subdiv-hard-surface"
            className={lk}
          >
            GN edge crease and subdivision tutorial
          </Link>
          , where sharp marks and crease weights are separate attributes used
          by different downstream modifiers.
        </li>
      </ul>
      <p>
        Internally the node iterates over the EDGE domain, computes the
        unsigned dihedral angle between the two adjacent face normals (the same
        value exposed by the <em>Edge Angle</em> node), and writes the{" "}
        <code>sharp_edge</code> boolean attribute on each edge. It does not
        modify vertex positions or face topology.
      </p>

      <h2>Critical ordering: SetShadeSmooth BEFORE SmoothByAngle</h2>
      <p>
        <code>GeometryNodeSmoothByAngle</code> writes <em>which edges are
        sharp</em>. The renderer needs a smooth baseline to break against;
        without it, all edges are implicitly sharp regardless of the{" "}
        <code>sharp_edge</code> attribute.
      </p>
      <p>
        The mandatory prefix node is{" "}
        <strong>
          <code>GeometryNodeSetShadeSmooth</code>
        </strong>{" "}
        with <code>domain&nbsp;=&nbsp;FACE</code> and{" "}
        <code>Shade Smooth&nbsp;=&nbsp;True</code>. This sets the per-face
        smooth flag for the entire mesh before SmoothByAngle marks individual
        edges as exceptions. A mesh that comes in with all faces flat-shaded
        (the default for a new bmesh) will pass through SmoothByAngle unchanged
        — the <code>sharp_edge</code> marks exist but have nothing to override.
        See how the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-data-transfer-smooth-normals"
          className={lk}
        >
          Data Transfer smooth normals tutorial
        </Link>{" "}
        handles normal propagation for cases where smooth and flat faces coexist
        on a single object.
      </p>
      <p>
        Node tree order: Group&nbsp;Input → SetShadeSmooth(FACE, True) →
        SmoothByAngle(Angle, Ignore&nbsp;Sharpness) → Group&nbsp;Output. Any
        upstream GN operations (extrude, distribute, deform) go before
        SetShadeSmooth; any downstream operations go after SmoothByAngle if
        they do not need the final normal split to be present yet.
      </p>

      <h2>Verifying with the Spreadsheet editor</h2>
      <p>
        Open the Spreadsheet editor, select the prism, switch domain to{" "}
        <strong>Edge</strong> with Evaluated Data on. The{" "}
        <code>sharp_edge</code> (BOOLEAN) column appears. Side edges show{" "}
        <code>False</code> at 30&deg; (22.5&deg;&nbsp;&lt;&nbsp;30&deg;); cap-ring
        edges show <code>True</code> (90&deg;&nbsp;&gt;&nbsp;30&deg;). Drop
        Angle to 15&deg; and the side edges flip to <code>True</code> &mdash;
        the same diagnostic method used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-triangulate-mesh-webxr-tri-safe-export"
          className={lk}
        >
          Triangulate Mesh WebXR export tutorial
        </Link>{" "}
        to verify face counts before submitting a GLB.
      </p>

      <h2>The quick form: SMOOTH_BY_ANGLE modifier</h2>
      <p>
        When you only need a one-to-one replacement for{" "}
        <code>use_auto_smooth</code> and no other GN operations, the shortcut
        is the <em>Smooth by Angle</em> modifier (type{" "}
        <code>&apos;SMOOTH_BY_ANGLE&apos;</code>). Blender generates the GN
        tree internally; you address the Angle socket as{" "}
        <code>mod[&quot;Input_2&quot;]</code> (radians). The migration pattern:
      </p>
      <pre>{`# Blender ≤ 3.6 (no longer works in 4.1+):
mesh.use_auto_smooth      = True
mesh.auto_smooth_angle    = math.radians(30.0)

# Blender 4.1+ — modifier shortcut:
mod = obj.modifiers.new("SmoothByAngle", "SMOOTH_BY_ANGLE")
mod["Input_2"] = math.radians(30.0)   # Angle socket
mod["Input_3"] = False                 # Ignore Sharpness socket`}</pre>
      <p>
        The socket index offset is deliberate: <code>Input_1</code> is the
        Geometry input (implicit, not user-facing), so the first user-facing
        socket Angle is <code>Input_2</code>. This is a common source of
        off-by-one confusion.
      </p>

      <h2>GLB export and WebXR normals</h2>
      <p>
        The glTF 2.0 format stores vertex normals per accessor index. Where two
        triangles share a vertex but need different normals at that vertex (a
        hard edge), the exporter must duplicate the vertex — one copy per normal
        direction. The <code>sharp_edge</code> attribute is the signal the
        Blender glTF exporter uses to decide where to split. Without{" "}
        <code>export_apply=True</code> the GN modifier is never evaluated; the
        exporter sees an unmodified flat-shaded mesh and splits normals only at
        UV seams. For the full Blender-to-Three.js normal pipeline see the{" "}
        <Link href="/tutorials/blender-tutorial-faceted-custom-split-normals" className={lk}>
          custom split normals tutorial
        </Link>
        .
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/smooth_by_angle.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Blender Manual — Smooth by Angle Node
          </a>{" "}
          (CC-BY-SA-4.0 · Blender Foundation). Full parameter table, dihedral
          diagrams, and sibling GN Mesh Operations pages for Set Shade Smooth
          and Edge Angle.
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            KhronosGroup/glTF-Blender-IO
          </a>{" "}
          (Apache-2.0 · Khronos Group) — official Blender glTF exporter.
          The <code>sharp_edge</code> normal-split logic lives in{" "}
          <code>io_scene_gltf2/blender/exp/mesh/</code>. Related:{" "}
          <a href="https://github.com/KhronosGroup/glTF" className={lk} target="_blank" rel="noreferrer">
            glTF spec
          </a>{" "}
          and{" "}
          <a href="https://github.com/KhronosGroup/glTF-Sample-Assets" className={lk} target="_blank" rel="noreferrer">
            glTF-Sample-Assets
          </a>
          .
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-smooth-by-angle-normal-split",
  title:
    "GN Smooth by Angle — Blender 5.1 Auto-Smooth Replacement: Per-Angle Normal Split for Hard-Surface and WebXR Meshes",
  date: "2026-06-21",
  kind: "tutorial",
  excerpt:
    "Blender 4.1 removed use_auto_smooth. The replacement is GeometryNodeSmoothByAngle — either as a standalone modifier or wired into a custom GN tree. This tutorial covers the node, the mandatory SetShadeSmooth prerequisite, the sharp_edge attribute, the SMOOTH_BY_ANGLE modifier migration pattern, and how split normals travel through the glTF exporter into WebXR assets.",
  Body,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/geometry-nodes/gn-smooth-by-angle-normal-split/",
    time: "25 minutes",
    difficulty: "intermediate",
    cost: "free",
    software: [{ name: "Blender", version: "5.1", url: "https://www.blender.org/download/", cost: "open-source" }],
    prerequisites: [
      "Can add modifiers and wire nodes in the GN editor",
      "Basic Python scripting in the Scripting workspace",
    ],
    steps: [
      "Open Blender 5.1, Scripting workspace. Open blueprint.py and click Run Script. Confirm the Info header prints two GLB export lines.",
      "Switch to Layout workspace. Select smooth_prism. Open Properties → Modifier. Expand SmoothByAngle_GN. Drag Smooth Angle from 30° down to 10° and watch the 16 side faces develop hard edges in the EEVEE viewport.",
      "Return Smooth Angle to 30°. Only the cap-ring edges should show a hard silhouette.",
      "Open Geometry Node Editor. Click into the SmoothByAngle_GN tree. Identify Set Shade Smooth → Smooth by Angle → Group Output. Disconnect Set Shade Smooth and confirm all faces revert to flat. Reconnect it.",
      "Open Spreadsheet editor → Edge domain → Evaluated Data. Find the sharp_edge column. Side edges read False (22.5° < 30°); cap-ring edges read True (90° > 30°).",
      "Drop Smooth Angle to 15°. Side edges flip to True in the Spreadsheet (22.5° > 15°).",
      "Drag smooth_prism_30deg.glb and smooth_prism_15deg.glb into a glTF viewer to compare the normal splits.",
    ],
    troubleshooting: [
      {
        symptom: "AttributeError: 'Mesh' object has no attribute 'use_auto_smooth'",
        cause:
          "You are on Blender 4.1 or later and the old property has been removed.",
        fix: "Replace the old assignment with a 'SMOOTH_BY_ANGLE' modifier: mod = obj.modifiers.new('SmoothByAngle', 'SMOOTH_BY_ANGLE'); mod['Input_2'] = math.radians(30.0). Or use the GN tree approach from blueprint.py.",
      },
      {
        symptom: "Mesh looks completely flat-shaded — Smooth by Angle appears to have no effect",
        cause:
          "Set Shade Smooth node is missing or not placed before Smooth by Angle in the GN tree. The node marks which edges are sharp, but if all faces are already flat-shaded there is no smooth baseline to break.",
        fix: "Add a Set Shade Smooth node (domain: Face, Shade Smooth: True) between Group Input and Smooth by Angle. Check the blueprint.py GN tree order: SetShadeSmooth → SmoothByAngle.",
      },
      {
        symptom: "GLB normals look wrong in Three.js — smooth where they should be sharp",
        cause:
          "export_apply=True was not set in the bpy.ops.export_scene.gltf() call. The GN modifier was not baked; the exporter saw the unmodified mesh without sharp_edge marks.",
        fix: "Add export_apply=True to the export call in blueprint.py and re-run.",
      },
      {
        symptom: "mod['Input_2'] raises KeyError on SMOOTH_BY_ANGLE modifier",
        cause: "Socket numbering shifted in a pre-release build.",
        fix: "Open the modifier's node tree and read the Angle socket identifier from its properties panel, then update the key in your script.",
      },
      {
        symptom: "sharp_edge column does not appear in the Spreadsheet editor",
        cause: "Evaluated Data is not selected in the Spreadsheet dropdown, so it shows the base mesh without modifier output.",
        fix: "In the Spreadsheet header, enable Evaluated Data. If the column still does not appear, verify the SmoothByAngle node is connected and the modifier is enabled (eye icon on).",
      },
    ],
  },
  base,
);

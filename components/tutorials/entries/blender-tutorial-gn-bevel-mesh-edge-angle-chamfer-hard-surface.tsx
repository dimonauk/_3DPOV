import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnBevelMeshEdgeAngleChamferHardSurfaceBody() {
  return (
    <>
      <p>
        The <strong>Bevel Mesh</strong> geometry node (added in Blender 4.0,
        available in 5.1) places a chamfer strip on edges whose dihedral angle
        exceeds a programmable threshold. Set the threshold to 25° and every
        90° hard-surface corner gets a crisp chamfer; every shallow topology
        seam — the 170° angles between adjacent subdivided quads — is left
        untouched. The node sits inside the Geometry Nodes stack, so downstream
        nodes (Triangulate, Merge by Distance, Realize Instances) operate on
        already-bevelled topology. That is the key difference from the Bevel
        modifier, which always runs last.
      </p>
      <p className="mt-3">
        This tutorial builds a sci-fi control-panel slab in bmesh, attaches a
        GN modifier whose single tree is Group Input → Bevel Mesh → Set Shade
        Smooth → Group Output, then exports a Draco-compressed GLB for WebXR.
        The angle gate is exposed as an animatable modifier socket so you can
        keyframe the chamfer growth — useful for reveal animations. For normal
        splitting after the bevel, see the companion{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-smooth-by-angle-normal-split"
          className={lk}
        >
          GN Smooth by Angle
        </Link>{" "}
        tutorial, which replaces Blender&apos;s removed Auto Smooth with an
        in-stack normal-split pass. For heavier topology control on the same
        hard-surface read, compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-subdivision-surface-crease-support-loops-webxr"
          className={lk}
        >
          Subdivision Surface + Crease + Support Loops
        </Link>{" "}
        tutorial — that approach uses Catmull-Clark to grow curved edges from
        crease weights rather than adding a flat chamfer plane.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Dihedral angle — what the node measures
      </h2>
      <p>
        The dihedral angle of an edge is the angle between the normals of its
        two adjacent faces. A flat wall (two coplanar faces) has a dihedral
        angle of 180° — the normals are parallel. A 90° box corner (two
        perpendicular faces) has a dihedral angle of 90°. The Bevel Mesh node
        in ANGLE limit mode bevels edges whose angle is{" "}
        <em>below</em> the threshold (it measures the supplement — see the
        manual note below). Setting{" "}
        <code>ANGLE_THRESHOLD = math.radians(25.0)</code> means edges where the
        face normals diverge by more than 25° from parallel are bevelled — in
        practice, any corner sharper than 155°. Every right-angle and
        acute-angle edge on a hard-surface slab qualifies; shallow topology
        edges between nearly-coplanar quads do not.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Limit Method vs the Bevel modifier
      </h2>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-4 overflow-x-auto">
{`# mode and limit_method are NODE PROPERTIES, not sockets.
# They appear in the N panel when the node is selected.
bevel = nodes.new('GeometryNodeBevelMesh')
bevel.mode         = 'EDGES'   # bevel edge loops; VERTICES rounds vertex stars
bevel.limit_method = 'ANGLE'   # exposes the Angle socket; NONE bevels everything

# Wire the exposed sockets
links.new(grp_in.outputs['Bevel Width'],     bevel.inputs['Amount'])
links.new(grp_in.outputs['Angle Threshold'], bevel.inputs['Angle'])
links.new(grp_in.outputs['Segments'],        bevel.inputs['Segments'])`}
      </pre>
      <p>
        The <code>Profile</code> socket (0.0 = concave, 0.5 = convex arc,
        1.0 = flat chamfer plane) is not wired here — it defaults to 1.0 which
        is the flat chamfer most WebXR props need. For a convex bead on a
        luxury-product surface, wire a Float socket and set 0.5.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Setting modifier inputs by socket identifier
      </h2>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-4 overflow-x-auto">
{`# Blender 5.x: use the interface socket's .identifier attribute
# This is stable across file reload; avoid hardcoded "Socket_1" strings.
sock_amount = iface.new_socket("Bevel Width", in_out='INPUT',
                               socket_type='NodeSocketFloat')
sock_angle  = iface.new_socket("Angle Threshold", in_out='INPUT',
                               socket_type='NodeSocketFloat')

mod[sock_amount.identifier] = BEVEL_WIDTH    # e.g. 0.018 m
mod[sock_angle.identifier]  = ANGLE_THRESHOLD  # e.g. radians(25)`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Export considerations
      </h2>
      <p>
        Two strategies exist for delivering chamfered hard-surface in WebXR:
        <br />
        <strong>1. Geometry bevel</strong> (this tutorial) — bevel baked into
        the GLB vertex buffer via <code>export_apply=True</code>. Adds roughly
        2× the edge count on bevelled edges; no normal-map sampling at runtime.
        Correct at any camera distance and in any WebXR runtime regardless of
        normal-map support.
        <br />
        <strong>2. Baked normal map</strong> — high-poly bevelled mesh baked
        onto a low-poly sharp-edge mesh. Zero geometry overhead; requires
        normal-map texture sampling and correct tangent-space setup in the
        WebXR renderer. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr"
          className={lk}
        >
          Principled BSDF v2 → glTF PBR
        </Link>{" "}
        tutorial for the normal-map pipeline. For technical assembly
        diagrams where flat-shaded reads are preferred, combine the geometry
        bevel with the Workbench engine from the{" "}
        <Link
          href="/tutorials/blender-tutorial-workbench-cavity-outline-assembly-diagram"
          className={lk}
        >
          Workbench Cavity + Outline Assembly Diagram
        </Link>{" "}
        tutorial — chamfered edges catch cavity shading and read as precision
        machining.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside sources</h2>
      <ul className="list-disc list-inside space-y-2 text-sm">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/bevel_mesh.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Bevel Mesh node
          </a>{" "}
          © Blender Foundation, CC-BY-SA 4.0. Related:{" "}
          <a
            href="https://github.com/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender/blender
          </a>
          .
        </li>
        <li>
          <a
            href="https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Khronos glTF 2.0 Specification — Normal Accessors
          </a>{" "}
          © Khronos Group, Apache 2.0. Related:{" "}
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

export const entry: Entry = buildInstructable(
  {
    steps: [
      {
        title: "Run blueprint.py",
        body: "Open Blender 5.1 → Scripting workspace. Open blueprint.py → Run Script. A control-panel slab appears with a recessed cluster. The GN modifier 'BevelAngle_GN' is applied.",
      },
      {
        title: "Inspect the node tree",
        body: "Switch to Geometry Nodes workspace. Select the control_panel object. The modifier panel shows BevelAngle_GN. The node graph: Group Input → Bevel Mesh → Set Shade Smooth → Group Output.",
      },
      {
        title: "Verify mode and limit_method",
        body: "Click the Bevel Mesh node. In the N panel (Properties side panel) confirm Mode = EDGES, Limit Method = ANGLE. These are node properties, not visible as sockets in the graph.",
      },
      {
        title: "Test Bevel Width live",
        body: "In the modifier panel, drag the 'Bevel Width' input from 0.001 to 0.04. Watch the chamfer grow on the 90° corners. The flat top face shows no bevel — the dihedral angle between flat quads is well below 25°.",
      },
      {
        title: "Test Angle Threshold",
        body: "Set Angle Threshold to 0.087 (≈5°): almost no edges bevel. Set to 1.047 (≈60°): every edge bevels. Return to 0.436 (≈25°) — the production value. Note how the border-frame inner step also bevels (it is exactly 90°).",
      },
      {
        title: "Test Segments",
        body: "Set Segments to 1: flat one-cut chamfer. Set to 4: smooth rounded bead. Return to 2. Check in Material Preview — the 2-segment bevel reflects light along a clean highlight strip without the polygon silhouette visible at low FOV.",
      },
      {
        title: "Run record.py for viewport.mp4",
        body: "Open record.py in Scripting workspace → Run Script. Renders 60 frames: bevel ramps up over frames 1-30, camera orbits 90° over frames 30-60. Encodes to public/library/videos/geometry-nodes/gn-bevel-mesh-edge-angle-chamfer-hard-surface/viewport.mp4.",
      },
      {
        title: "Record screen.mp4",
        body: "Follow SCREEN-RECORDING-NOTES.md. Five takes: script run, node graph walkthrough, angle threshold comparison, segments comparison, GLB export check. Save to public/library/videos/geometry-nodes/gn-bevel-mesh-edge-angle-chamfer-hard-surface/screen.mp4.",
      },
    ],
  },
  {
    slug: "blender-tutorial-gn-bevel-mesh-edge-angle-chamfer-hard-surface",
    title:
      "GN Bevel Mesh + Edge-Angle Limit — Selective Hard-Surface Chamfer for WebXR (Blender 5.1)",
    date: "2026-06-28",
    kind: "tutorial",
    excerpt:
      "The Bevel Mesh geometry node (mode=EDGES, limit_method=ANGLE) bevels only edges whose dihedral angle exceeds a threshold — 90° hard corners yes, shallow topology seams no. Exposed as an animatable modifier socket so chamfer width can be keyframed. Build a sci-fi control-panel slab in bmesh, apply GN Bevel Mesh + Set Shade Smooth, export Draco-compressed GLB for WebXR. Beats the Bevel modifier when downstream GN nodes need to see bevelled topology.",
    Body: GnBevelMeshEdgeAngleChamferHardSurfaceBody,
  },
);

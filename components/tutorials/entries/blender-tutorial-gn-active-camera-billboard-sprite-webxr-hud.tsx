import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnActiveCameraBillboardBody() {
  return (
    <>
      <p>
        The <code>Active Camera</code> Geometry Nodes node (available from
        Blender 5.0 onward) outputs the scene camera&apos;s world-space 4×4
        transform matrix. Feeding that matrix into{" "}
        <code>Separate Matrix</code> extracts the camera&apos;s local axis
        vectors; feeding the correct column into{" "}
        <code>Align Euler to Vector</code> auto-rotates every instance in
        the tree to face the lens. No Python, no constraints, no parenting —
        the alignment updates every frame as the camera moves.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Camera coordinate frame and the billboard direction
      </h2>
      <p>
        Blender cameras use a right-hand coordinate system with{" "}
        <strong>−Z as the viewing (forward) direction</strong>. The camera&apos;s
        4×4 world matrix has four column vectors:
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-3 overflow-x-auto">
{`# FunctionNodeSeparateMatrix output sockets (Blender 5.1)
# UI label   bpy index   World-space meaning
# ─────────────────────────────────────────────────────
# Column 1   outputs[0]  Camera +X  (right of frame)
# Column 2   outputs[1]  Camera +Y  (up in frame)
# Column 3   outputs[2]  Camera +Z  (backward — opposite of view)
# Column 4   outputs[3]  Camera world position (translation)`}
      </pre>
      <p>
        A billboard whose face-normal (local +Z) must point{" "}
        <em>toward the camera</em> needs to align with the camera&apos;s
        forward direction, which is <strong>−Column&nbsp;3</strong>. If
        you align to +Column&nbsp;3 instead, the sprite faces away from the
        camera — it renders as a dark quad. One negation via Vector Math
        (Scale × −1) fixes this.
      </p>
      <p>
        Alternatively: align the sprite&apos;s local +Z directly to{" "}
        <em>+Column&nbsp;3</em> but flip the quad&apos;s face winding
        order so its front face is the −Z side. Both work; the blueprint
        uses the SCALE −1 approach because it leaves the sprite mesh
        unmodified and the geometry is easier to inspect.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Globally-aligned vs. per-sprite facing
      </h2>
      <p>
        This tutorial implements <strong>globally-aligned billboards</strong>:
        all sprites in the grid rotate identically, remaining parallel to the
        camera image plane. This matches what game engines call a
        &ldquo;screen-aligned billboard&rdquo; — correct for HUD elements,
        particle effects, and distant foliage.
      </p>
      <p>
        The alternative — <strong>per-sprite facing</strong> — computes a
        unique direction from each sprite&apos;s world position to the camera
        position. The formula is{" "}
        <code>normalize(camera_pos − sprite_pos)</code>, requiring the
        Position node plus Vector Math (Subtract, Normalize) per instance. It
        matters only when sprites are physically large or the camera FOV is
        very wide. The holoflow macro{" "}
        <code>holoflow_macros/billboard_camera_align.py</code> ships both modes
        behind a toggle socket.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Building the node graph (Blender 5.1)
      </h2>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-3 overflow-x-auto">
{`import bpy

ng = bpy.data.node_groups.new("BillboardCameraFacing", "GeometryNodeTree")
lk = ng.links.new

# ── points from a 3×3 grid (one sprite centre per vertex) ─────────────────────
n_grid = ng.nodes.new("GeometryNodeMeshGrid")
n_grid.inputs["Vertices X"].default_value = 3
n_grid.inputs["Vertices Y"].default_value = 3
n_grid.inputs["Size X"].default_value     = 2.8   # 1.4 m spacing × 2 gaps
n_grid.inputs["Size Y"].default_value     = 2.8

n_m2p = ng.nodes.new("GeometryNodeMeshToPoints")
n_m2p.mode = "VERTICES"
lk(n_grid.outputs["Mesh"], n_m2p.inputs["Mesh"])

# ── sprite source ──────────────────────────────────────────────────────────────
n_obj = ng.nodes.new("GeometryNodeObjectInfo")
n_obj.transform_space              = "ORIGINAL"
n_obj.inputs["Object"].default_value = sprite_ob  # flat quad, +Z = face normal

n_inst = ng.nodes.new("GeometryNodeInstanceOnPoints")
lk(n_m2p.outputs["Points"],   n_inst.inputs["Points"])
lk(n_obj.outputs["Geometry"], n_inst.inputs["Instance"])

# ── camera matrix decomposition ───────────────────────────────────────────────
n_cam  = ng.nodes.new("GeometryNodeInputActiveCamera")
n_sep  = ng.nodes.new("FunctionNodeSeparateMatrix")
lk(n_cam.outputs["Camera"], n_sep.inputs["Matrix"])

# Negate Column 3 so the vector points FROM the camera TOWARD the scene
n_neg  = ng.nodes.new("ShaderNodeVectorMath")
n_neg.operation                 = "SCALE"
n_neg.inputs["Scale"].default_value = -1.0
lk(n_sep.outputs[2], n_neg.inputs["Vector"])  # outputs[2] = Column 3 (0-indexed)

# ── align instance local +Z to face the camera ────────────────────────────────
n_aev  = ng.nodes.new("FunctionNodeAlignEulerToVector")
n_aev.axis       = "Z"      # sprite face-normal = local +Z
n_aev.pivot_axis = "AUTO"   # safe for any camera angle, including overhead
lk(n_neg.outputs["Vector"], n_aev.inputs["Vector"])

# ── apply per-frame rotation to all instances ─────────────────────────────────
n_rot = ng.nodes.new("GeometryNodeRotateInstances")
n_rot.inputs["Local Space"].default_value = False  # rotation is world-space
lk(n_inst.outputs["Instances"], n_rot.inputs["Instances"])
lk(n_aev.outputs["Rotation"],   n_rot.inputs["Rotation"])

# ── output ────────────────────────────────────────────────────────────────────
ng.interface.new_socket("Geometry", in_out="OUTPUT",
                        socket_type="NodeSocketGeometry")
n_out = ng.nodes.new("NodeGroupOutput")
lk(n_rot.outputs["Instances"], n_out.inputs["Geometry"])`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Why <code>pivot_axis=&apos;AUTO&apos;</code> (not Z)
      </h2>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-align-euler-to-vector-signage-facade"
          className={lk}
        >
          signage façade tutorial
        </Link>{" "}
        fixes <code>pivot_axis=&apos;Z&apos;</code> because all face normals on
        a vertical cylinder are horizontal. Camera facing is different: the camera
        can orbit overhead, look down steeply, or approach from any angle. When
        the target vector (−Column&nbsp;3) is nearly parallel to world Z, a
        Z-pivot produces gimbal lock — the sprite spins randomly. Setting{" "}
        <code>AUTO</code> picks the safest local pivot per-instance per-frame.
        The only side-effect is occasional roll discontinuity when the camera
        crosses the zenith — acceptable for HUD sprites, which are symmetric.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Per-instance colour via material index
      </h2>
      <p>
        Append nine materials to the sprite quad mesh object. In the GN tree,
        drive{" "}
        <code>Instance on Points → Instance Index</code> from{" "}
        <code>Index mod 9</code>. Each sprite picks the material at its
        sequential index, producing the nine-colour grid. When the host
        empty is exported (bake instances first with{" "}
        <code>Realize Instances</code>), each realized quad carries its own
        material slot.
      </p>
      <p>
        For comparison, the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-interpolate-domain-face-normal-vertex-colour-toon"
          className={lk}
        >
          Interpolate Domain toon-shading tutorial
        </Link>{" "}
        applies per-face random colour via vertex colour attributes rather
        than material indices — useful when all sprites share a single material
        with a colour input driven by <code>Named Attribute</code>.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        WebXR export: what the GLB can and cannot do
      </h2>
      <p>
        When you export the frame to GLB with <strong>Apply Modifiers</strong>
        on, the rotation is baked: sprites face wherever the camera was at
        export time. In a Three.js WebXR scene, they will not auto-rotate.
      </p>
      <p>
        There are three WebXR strategies depending on your need:
      </p>
      <ul className="list-disc pl-5 mt-1 space-y-1">
        <li>
          <strong>THREE.Sprite</strong> — replace the GLB quad with a native
          Three.js Sprite object; it handles camera-facing automatically in the
          renderer at zero CPU cost.
        </li>
        <li>
          <strong>lookAt in tick loop</strong> — keep the GLB quad but call{" "}
          <code>mesh.lookAt(camera.position)</code> per frame; gives full
          control over axes and constraints.
        </li>
        <li>
          <strong>Baked static</strong> — export the billboard for a fixed
          camera angle (e.g. a kiosk or gallery wall that users always
          face from the front). The Blender GN setup then serves as the
          production art tool, not the runtime logic.
        </li>
      </ul>
      <p className="mt-3">
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-arc-dial-gauge-webxr-hud"
          className={lk}
        >
          dial gauge WebXR HUD tutorial
        </Link>{" "}
        uses the baked static approach — it exports a gauge with its indicator
        needle at a specific reading, meant to be replaced at runtime via
        Three.js animation rather than billboarding.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Rotation math background
      </h2>
      <p>
        The transform chain in matrix form:
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-3 overflow-x-auto">
{`# M_cam  — camera world matrix (4×4, from Active Camera node)
# col2   — third column of M_cam: camera +Z axis in world space
# fwd    — camera forward (what it sees): fwd = -col2
# R_bill — billboard rotation s.t. sprite_local_Z == fwd

# AlignEulerToVector (Axis='Z') constructs R_bill by:
#   1. Finding the rotation axis: cross(world_Z, fwd)
#   2. Finding the rotation angle: acos(dot(world_Z, fwd))
#   3. Applying Rodrigues' rotation formula
# This is identical to calling quaternion_from_two_vectors(Z_hat, fwd)
# in mathutils — but computed per-instance in the GN evaluator.

# The crucial invariant: this rotation is NOT applied cumulatively.
# Each frame it is recomputed from scratch → no drift, no gimbal fatigue.`}
      </pre>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-rotation-nodes-axis-angle-fk-robot-arm"
          className={lk}
        >
          FK Robot Arm tutorial
        </Link>{" "}
        covers the axis-angle form of Rodrigues&apos; rotation in depth —
        that is exactly the operation <code>AlignEulerToVector</code> performs
        internally when Pivot=AUTO selects the cross-product axis.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Troubleshooting
      </h2>
      <ul className="list-disc pl-5 mt-1 space-y-2">
        <li>
          <strong>Sprites do not update as I orbit the viewport.</strong>{" "}
          The <code>Active Camera</code> node follows{" "}
          <code>bpy.context.scene.camera</code>, not the viewport navigation
          camera. If you orbit without a scene camera set, the matrix is
          identity and sprites do not move. Add a camera object and assign it
          via Scene Properties → Scene → Camera.
        </li>
        <li>
          <strong>Sprites face the wrong way (dark side toward camera).</strong>{" "}
          The Vector Math SCALE is missing or set to +1 instead of −1. Column
          3 of the camera matrix is the camera&apos;s backward axis; without
          negation the sprite&apos;s +Z faces away from the lens.
        </li>
        <li>
          <strong>Instances roll randomly when the camera looks straight down.</strong>{" "}
          This is the gimbal case. Setting <code>pivot_axis=&apos;AUTO&apos;</code>{" "}
          minimises it but cannot eliminate it when the target vector equals
          world +Z exactly. For top-down-only cameras, set{" "}
          <code>pivot_axis=&apos;Y&apos;</code> — this keeps the sprite&apos;s
          local +Y aligned to world +Y and only rotates in pitch.
        </li>
        <li>
          <strong>GLB exports as flat rotation baked to frame 1.</strong>{" "}
          Expected. Export on the frame where the camera angle matches your
          intended use, or skip the bake and handle billboarding in Three.js.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Outside sources
      </h2>
      <ul className="list-disc pl-5 mt-1 space-y-2">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/input/scene/active_camera.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Active Camera Node
          </a>{" "}
          (CC-BY-4.0 · Blender Foundation). Authoritative reference for the
          node&apos;s Matrix socket type and per-frame evaluation semantics.
          Sibling repository:{" "}
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
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/matrix/separate_matrix.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Separate Matrix Node
          </a>{" "}
          (CC-BY-4.0 · Blender Foundation). Documents the four Column outputs
          and their relationship to the input transform&apos;s axis vectors.
          Sibling:{" "}
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
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-active-camera-billboard-sprite-webxr-hud",
    time: "one session",
    difficulty: "intermediate",
    goal:
      "Use the Active Camera GN node (5.1) to build a camera-facing billboard sprite grid: decompose the camera world matrix with Separate Matrix, negate Column 3 to get the viewing direction, drive AlignEulerToVector (Axis=Z), and apply the result via Rotate Instances — updating every frame with zero Python.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    prerequisites: [
      "Understand Instance on Points and Mesh to Points",
      "Know Align Euler to Vector axis and pivot_axis semantics",
      "Comfortable reading 4×4 transform matrices as column vectors",
    ],
    steps: [
      {
        title: "Create the sprite quad",
        body: "primitive_plane_add(size=0.9). Rotate 0° — the default plane has +Z as its face normal, which is exactly the axis AlignEulerToVector will align. Apply scale. Hide from render (ob.hide_render = True) — GN will instance it, not render the original.",
      },
      {
        title: "Add nine materials to the sprite quad",
        body: "Append 9 materials with Base Color set to distinct hues (red, orange, yellow, green, cyan, blue, violet, pink, white). These become material slots 0–8; the GN tree selects them per-instance via Index mod 9.",
      },
      {
        title: "Build the GN grid and Mesh to Points",
        body: "Add a GN modifier to an Empty. Create a GeometryNodeMeshGrid (3×3 vertices, 2.8 m sides) and wire it through GeometryNodeMeshToPoints (mode=VERTICES). This gives exactly 9 equally-spaced points.",
      },
      {
        title: "Wire Active Camera → Separate Matrix → negate Column 3",
        body: "GeometryNodeInputActiveCamera outputs a Matrix socket. FunctionNodeSeparateMatrix outputs four Vector sockets (one per column, 1-indexed in UI). outputs[2] = Column 3 = camera +Z world axis. Wire through ShaderNodeVectorMath (SCALE, −1) to invert it into the camera viewing direction.",
      },
      {
        title: "Align Euler to Vector and Rotate Instances",
        body: "FunctionNodeAlignEulerToVector: axis='Z', pivot_axis='AUTO'. Wire the negated vector to inputs['Vector']. Wire the resulting Euler to GeometryNodeRotateInstances (Local Space = False). Wire Instance on Points → Rotate Instances → Group Output.",
      },
      {
        title: "Verify live update and export",
        body: "Move the scene camera (G) — all nine sprites should immediately reorient. For GLB: apply the GN modifier first (Ctrl+A in Properties → Modifiers) to bake the rotation, then File → Export → glTF 2.0 with Apply Modifiers checked.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Sprites do not react to camera movement",
        cause: "No scene camera is set, so Active Camera outputs an identity matrix.",
        fix: "Scene Properties → Scene → Camera: assign your camera object. The Active Camera node tracks this slot, not the viewport navigation camera.",
      },
      {
        symptom: "Front face of sprites is invisible from camera angle",
        cause: "The SCALE −1 step is missing; Column 3 is the backward axis, so sprites face away from the lens.",
        fix: "Insert ShaderNodeVectorMath (SCALE × −1) between Separate Matrix outputs[2] and AlignEulerToVector inputs['Vector'].",
      },
      {
        symptom: "Sprites randomly roll when camera looks straight down",
        cause: "Gimbal: target vector = world +Z exactly; rotation about +Z is undefined.",
        fix: "For a top-down camera, switch pivot_axis to 'Y' to constrain roll via the vertical axis instead.",
      },
    ],
  },
  {
    slug: "blender-tutorial-gn-active-camera-billboard-sprite-webxr-hud",
    title:
      "GN Active Camera — Camera-Facing Billboard Sprite Grid for WebXR HUD Elements (Blender 5.1)",
    date: "2026-07-03",
    kind: "tutorial",
    excerpt:
      "The Active Camera GN node exposes the scene camera's full 4×4 world matrix. Decompose it with Separate Matrix, negate Column 3 to get the view direction, drive AlignEulerToVector (Axis=Z, Pivot=AUTO), and pipe the result through Rotate Instances — every sprite in a scattered grid faces the lens each frame, no Python required.",
    Body: GnActiveCameraBillboardBody,
  },
);

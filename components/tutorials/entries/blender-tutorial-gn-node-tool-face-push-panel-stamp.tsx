import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnNodeToolFacePushPanelStampBody() {
  return (
    <>
      <p>
        Node Tools, introduced in Blender 4.2 and fully supported in 5.1,
        promote a Geometry Node tree to a first-class mesh-editing tool that
        appears in the 3D View toolbar, reads the live edit-mode face selection
        through a dedicated <code>Selection</code> socket, and bakes its result
        to the mesh in a single shot — no modifier stack, no Python operator
        class required. This tutorial builds a{" "}
        <strong>Face-Push Panel Stamp</strong>: select any faces, dial Amount,
        click Apply, each face translates outward along its own normal by an
        optionally randomised distance.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Tool mode vs modifier mode
      </h2>
      <p>
        A GN tree is just a modifier until <code>ng.is_tool = True</code>.
        After that flip: the <code>Selection</code> input socket binds directly
        to the live edit-mode face-selection mask (no vertex group needed); the
        Geometry input is injected by the framework rather than read from the
        stack; and the tree runs once per invocation and writes the result back
        permanently. The modifier clone (<code>is_tool=False</code>) built
        alongside it is for non-destructive preview only — the tool version
        commits on Apply.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Creating the interface sockets
      </h2>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-3 overflow-x-auto">
{`ng = bpy.data.node_groups.new("GN_FacePush_Tool", "GeometryNodeTree")
ng.is_tool = True   # GN editor header chip reads 'Tool' as confirmation

sel = ng.interface.new_socket(
    "Selection", in_out="INPUT", socket_type="NodeSocketBool")
sel.attribute_domain = "FACE"   # binds to face-selection mask in edit mode

amt = ng.interface.new_socket(
    "Amount", in_out="INPUT", socket_type="NodeSocketFloat")
amt.default_value = 0.06
amt.subtype = "DISTANCE"        # shows metres in the N-panel slider

rnd = ng.interface.new_socket(
    "Randomness", in_out="INPUT", socket_type="NodeSocketFloat")
rnd.min_value = 0.0; rnd.max_value = 1.0

ng.interface.new_socket("Geometry", in_out="OUTPUT",
                         socket_type="NodeSocketGeometry")`}
      </pre>
      <p>
        In tool mode omit the Geometry input socket — the framework provides it.
        The modifier clone needs an explicit Geometry input socket as the first
        interface item so the modifier stack wires up.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Randomised normal push — node chain
      </h2>
      <p>
        Offset = Normal × Amount × (1 + Randomness × centred) where{" "}
        <em>centred</em> is <code>FunctionNodeRandomValue(FLOAT, −0.5…0.5)</code>{" "}
        seeded by <code>GeometryNodeInputIndex</code>. At Randomness = 0 every
        face pushes identically; at Randomness = 1 panels range 50 % to 150 % of
        Amount.
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-3 overflow-x-auto">
{`n_idx = ng.nodes.new("GeometryNodeInputIndex")
n_rnd = ng.nodes.new("FunctionNodeRandomValue")
n_rnd.data_type = "FLOAT"
n_rnd.inputs["Min"].default_value = -0.5
n_rnd.inputs["Max"].default_value =  0.5
ng.links.new(n_idx.outputs["Index"], n_rnd.inputs["ID"])

n_m1  = ng.nodes.new("ShaderNodeMath"); n_m1.operation  = "MULTIPLY"
n_add = ng.nodes.new("ShaderNodeMath"); n_add.operation = "ADD"
n_add.inputs[0].default_value = 1.0
n_mamt= ng.nodes.new("ShaderNodeMath"); n_mamt.operation= "MULTIPLY"
ng.links.new(n_rnd.outputs["Value"],     n_m1.inputs[0])
ng.links.new(n_in.outputs["Randomness"], n_m1.inputs[1])
ng.links.new(n_m1.outputs["Value"],      n_add.inputs[1])
ng.links.new(n_in.outputs["Amount"],     n_mamt.inputs[0])
ng.links.new(n_add.outputs["Value"],     n_mamt.inputs[1])

n_nrm = ng.nodes.new("GeometryNodeInputNormal")
n_scl = ng.nodes.new("ShaderNodeVectorMath"); n_scl.operation = "SCALE"
ng.links.new(n_nrm.outputs["Normal"],  n_scl.inputs["Vector"])
ng.links.new(n_mamt.outputs["Value"],  n_scl.inputs["Scale"])

n_pos = ng.nodes.new("GeometryNodeSetPosition")
ng.links.new(n_in.outputs[0],           n_pos.inputs["Geometry"])
ng.links.new(n_in.outputs["Selection"], n_pos.inputs["Selection"])
ng.links.new(n_scl.outputs["Vector"],   n_pos.inputs["Offset"])`}
      </pre>
      <p>
        After SetPosition, chain a{" "}
        <code>GeometryNodeStoreNamedAttribute</code> (domain=FACE, FLOAT,
        name=<code>&apos;holoflow:facet&apos;</code>, value=1.0, Selection=same
        gate) so only the pushed faces carry the Holoflow WebXR exporter flag.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Why the Selection socket is different in tool mode
      </h2>
      <p>
        With <code>attribute_domain = &quot;FACE&quot;</code> and{" "}
        <code>is_tool = True</code>, Blender maps this socket directly to the
        edit-mode face-selection bitmask — the same flags that Box Select,
        Paint Select, and Loop Select write. No intermediate vertex-group
        attribute is needed. Change the selection, invoke the tool again, the
        new region is stamped. Set <code>attribute_domain</code> to{" "}
        <code>&apos;POINT&apos;</code> for vertex-selection tools (organic
        displacement); keep it <code>&apos;FACE&apos;</code> for panel work
        where face normals are unambiguous.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Related</h2>
      <ul className="list-disc list-inside space-y-2 mt-2 mb-4 text-sm">
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-extrude-mesh-city-block-attribute-height"
            className={lk}
          >
            GN Extrude Mesh — City Block per-face height
          </Link>{" "}
          — creates closed raised panels with side walls; use when you need
          visible wall geometry rather than floating face tiles.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-bevel-mesh-edge-angle-chamfer-hard-surface"
            className={lk}
          >
            GN Bevel Mesh — Selective hard-surface chamfer
          </Link>{" "}
          — natural follow-up: add bevels to the panel edge loops for
          light-catching chamfers.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-gizmo-nodes-interactive-viewport-controls"
            className={lk}
          >
            GN Gizmo Nodes — Interactive viewport controls
          </Link>{" "}
          — real-time drag handles for modifier parameters; combine with this
          tool: gizmos for live preview, Node Tool for final commit.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-socket-groups-parametric-crystal-ui"
            className={lk}
          >
            GN Socket Groups — Parametric UI panels
          </Link>{" "}
          — organise the tool&apos;s N-panel into labelled groups so Amount and
          Randomness sit under a &lsquo;Push Settings&rsquo; header.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Sources</h2>
      <ul className="list-disc list-inside space-y-3 mt-2 text-sm">
        <li>
          <a
            href="https://docs.blender.org/manual/en/5.1/modeling/meshes/editing/mesh/tools/node_tool.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Node Tools (5.1)
          </a>{" "}
          (CC-BY-SA 4.0, Blender Foundation). Documents is_tool, the Selection
          socket domain system, and toolbar registration. Related:{" "}
          <a href="https://github.com/blender/blender" className={lk}
             target="_blank" rel="noopener noreferrer">
            github.com/blender/blender
          </a>.
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
          (MIT, Nicolas Janakiev). Reference patterns for building GN trees
          programmatically: ng.nodes.new, ng.links.new, 4.0+ interface API.
          Related:{" "}
          <a href="https://github.com/njanakiev" className={lk}
             target="_blank" rel="noopener noreferrer">
            github.com/njanakiev
          </a>.
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KhronosGroup/glTF-Blender-IO
          </a>{" "}
          (Apache-2.0, Khronos Group). export_attributes=True preserves
          StoreNamedAttribute values (including holoflow:facet) in GLB extras.
          Related:{" "}
          <a href="https://github.com/KhronosGroup" className={lk}
             target="_blank" rel="noopener noreferrer">
            github.com/KhronosGroup
          </a>.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath: "blends/geometry-nodes/gn-node-tool-face-push-panel-stamp",
    time: "one session",
    difficulty: "intermediate",
    goal:
      "Build a GN tree with ng.is_tool=True that reads the live edit-mode face selection via a Selection socket (attribute_domain=FACE), translates selected faces outward by Amount × (1 + Randomness × per-face random), stores holoflow:facet=1.0 on moved faces, and registers via a Blender add-on macro for toolbar access.",
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
      "Familiar with GN modifier workflow (GroupInput/Output, 4.0 interface API)",
      "Know SetPosition + VectorMath SCALE offset pattern",
      "Understand StoreNamedAttribute domain settings",
    ],
    steps: [
      {
        title: "Create tree and flip is_tool",
        body: "ng = bpy.data.node_groups.new('GN_FacePush_Tool', 'GeometryNodeTree'). ng.is_tool = True. GN editor header chip reads 'Tool' — visual confirmation. Add Selection (NodeSocketBool, attribute_domain='FACE'), Amount (NodeSocketFloat, subtype='DISTANCE', default=0.06), Randomness (NodeSocketFloat, 0–1), Geometry output. Omit Geometry input — framework provides it in tool mode.",
      },
      {
        title: "Wire randomness chain + SetPosition",
        body: "Index → RandomValue(FLOAT, −0.5…+0.5, ID=Index). Math(MULTIPLY, random × Randomness). Math(ADD, 1.0). Math(MULTIPLY, Amount × above) → final_scale. Normal → VectorMath(SCALE, Scale=final_scale) → Offset. SetPosition: Geometry=GroupInput[0], Selection=GroupInput.Selection, Offset=above. StoreNamedAttribute(domain=FACE, data_type=FLOAT, Name='holoflow:facet', Value=1.0, Selection=Selection) → GroupOutput.",
      },
      {
        title: "Register add-on and test in Edit Mode",
        body: "Enable holoflow_macros/gn_node_tool_face_push.py as Blender add-on. Select mesh → Edit Mode → Face Select (3) → box-select a region. Toolbar (T) → Holoflow → Face Push Stamp → adjust Amount / Randomness → OK. Verify Spreadsheet editor (FACE domain): holoflow:facet = 1.0 on moved faces only. Ctrl+Z to undo, re-select a different region, repeat.",
      },
      {
        title: "Export GLB and record videos",
        body: "Run record.py for viewport.mp4 (Amount 0→0.12→0 animation, 60 frames, Workbench + Matcap + cavity). Run blueprint.py to export face_push_panel_stamp.glb with export_attributes=True, Draco 6, WebP. Follow SCREEN-RECORDING-NOTES.md for screen.mp4 — key takes: tool-mode chip, Amount drag, face select + Apply, undo + Randomness comparison.",
      },
    ],
    troubleshooting: [
      {
        symptom: "All faces push regardless of selection",
        cause:
          "sel.attribute_domain missing or not 'FACE', or GroupInput.Selection wired to a Bool constant True instead of the interface socket.",
        fix: "After ng.interface.new_socket, set sel.attribute_domain = 'FACE'. Confirm n_in.outputs['Selection'] — not a separate BooleanMath node — is wired to SetPosition.Selection. In the Spreadsheet editor (FACE domain, tool active), the Selection column should show True only for the selected faces.",
      },
      {
        symptom: "is_tool raises AttributeError",
        cause: "Blender version < 4.2. Node Tools require 4.2+.",
        fix: "Confirm bpy.app.version >= (4, 2, 0). On older builds simulate with a regular GN modifier + vertex-group attribute driving the Selection socket; toolbar integration is unavailable below 4.2.",
      },
    ],
    voiceMode: "aura",
  },
  {
    slug: "blender-tutorial-gn-node-tool-face-push-panel-stamp",
    title:
      "GN Node Tools — Custom Mesh-Edit Toolbar Tool: Face-Push Panel Stamp with Selection-Aware Domain Filtering (Blender 5.1)",
    date: "2026-06-28",
    kind: "tutorial",
    excerpt:
      "Mark a Geometry Node tree is_tool=True to create a Blender 5.1 Node Tool that reads the live edit-mode face selection, pushes each face along its normal by Amount with optional per-face Randomness, and stores holoflow:facet on moved faces for WebXR export — no Python operator class required.",
    Body: GnNodeToolFacePushPanelStampBody,
  },
);

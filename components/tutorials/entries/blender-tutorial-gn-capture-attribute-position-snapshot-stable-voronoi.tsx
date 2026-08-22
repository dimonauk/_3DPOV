import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnCaptureAttributeBody() {
  return (
    <>
      <p>
        Every value in a Geometry Nodes tree is either a <em>field</em> (lazy —
        evaluated at the point of consumption) or an <em>attribute</em> (concrete
        — a stored array on the geometry). <code>Capture Attribute</code> is the
        bridge: it forces a field to evaluate exactly once, at the node&apos;s own
        position in the stack, and stores the result as a frozen per-element
        attribute. Downstream nodes that read the output socket always see the
        snapshot value, even if the geometry has since been deformed, remeshed,
        or resampled. This tutorial builds a twisted hard-surface column whose
        Voronoi cell boundaries remain locked to the original cylinder grid,
        regardless of how far the Twist angle is cranked.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Field evaluation vs attribute storage
      </h2>
      <p>
        Connect the raw <code>Position</code> node directly to a Voronoi
        Texture, then twist the mesh with a downstream <code>SetPosition</code>.
        As you drag the Twist slider the Voronoi cells swim and shift — the
        texture is sampling the post-deform coordinates because{" "}
        <code>Position</code> is a field that re-evaluates lazily wherever it is
        consumed. Insert <code>Capture Attribute</code> (
        <code>data_type=FLOAT_VECTOR, domain=POINT</code>) before the twist and
        wire the frozen output to the Voronoi instead. Now the cells lock: the
        twist changes the mesh shape but the Voronoi always reads the original
        cylinder coordinates.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Node socket map (Blender 5.1)
      </h2>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-3 overflow-x-auto">
{`# bl_idname: GeometryNodeCaptureAttribute
# Set data_type and domain in the node header BEFORE wiring —
# the socket types update to match.

n_cap = ng.nodes.new("GeometryNodeCaptureAttribute")
n_cap.data_type = "FLOAT_VECTOR"   # matches Position field type
n_cap.domain    = "POINT"          # one frozen value per vertex

# inputs[0]  = Geometry  (pass-through)
# inputs[1]  = Value     (any FLOAT_VECTOR field — wire Position here)
# outputs[0] = Geometry  (same geometry, now carrying the attribute)
# outputs[1] = Attribute (frozen Vector — use this as stable seed)`}
      </pre>
      <p>
        The geometry leaving <code>outputs[0]</code> is identical to the input,
        except it now carries the captured array internally. You can chain
        multiple Capture Attribute nodes in a single tree; each freezes a
        different field at a different stack position.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Procedural twist using the frozen coordinates
      </h2>
      <p>
        The twist itself is built entirely in GN — no Simple Deform modifier
        needed. Captured Z (from <code>Separate XYZ</code>) drives the per-vertex
        rotation angle: <code>angle = captured_Z × (Twist / depth)</code>. A{" "}
        <code>Vector Rotate (AXIS_ANGLE)</code> node spins the captured XY
        around the world Z axis. Using captured coordinates as both the angle
        source and the vector being rotated means the entire twist calculation
        is evaluated from the pre-deform state — no feedback loop, no position
        drift on repeated modifier evaluation.
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-3 overflow-x-auto">
{`# Twist angle per vertex (centred column — Z in [−depth/2, +depth/2])
n_sep   → SeparateXYZ → Z
n_rate  → Math MULTIPLY (Z × 1/depth)
n_angle → Math MULTIPLY (above × Twist_socket)

# Rotate captured position around world Z by per-vertex angle
n_rot.rotation_type = "AXIS_ANGLE"
n_rot.inputs["Axis"].default_value = (0, 0, 1)
# Wire: captured_pos → n_rot Vector; angle → n_rot Angle
# Result:  n_rot.outputs["Vector"] → SetPosition.Position (absolute)`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Voronoi seeded from the frozen snapshot
      </h2>
      <p>
        <code>ShaderNodeTexVoronoi</code> (3D, Euclidean, F1) receives{" "}
        <code>n_cap.outputs[1]</code> as its Vector input and the{" "}
        <code>Voronoi Scale</code> group socket as its Scale. Because the seed
        is always the undeformed cylinder coordinates, animating Twist produces
        a column that bends and rotates while its surface markings stay
        perfectly still. The cell colour is stored as{" "}
        <code>FLOAT_COLOR</code> on the <code>FACE</code> domain via{" "}
        <code>StoreNamedAttribute</code> under the key{" "}
        <code>hs_cell_id</code> — the Holoflow WebXR exporter reads this to
        apply flat-panel shading per cell at runtime.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Domain bridging — FACE to POINT
      </h2>
      <p>
        Swap <code>n_cap.domain</code> from <code>POINT</code> to{" "}
        <code>FACE</code> and wire a <code>Face Normal</code> field into
        <code>inputs[1]</code>. The node stores one normal per face; any
        downstream <code>POINT</code>-domain node that reads the output socket
        receives the face normal of the face that owns that vertex (first face
        wins when vertices are shared). This is the standard pattern for
        projecting flat faceted normals onto vertex-domain shaders without
        manual UV editing.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Troubleshooting
      </h2>
      <ul className="list-disc ml-5 space-y-1 text-sm">
        <li>
          <strong>Cells still swim:</strong> confirm the Voronoi Vector is wired
          from <code>n_cap.outputs[1]</code>, not from a raw{" "}
          <code>Position</code> or <code>n_cap.outputs[0]</code> (which is the
          geometry pass-through, not the value).
        </li>
        <li>
          <strong>AttributeError on data_type:</strong> set{" "}
          <code>data_type</code> before adding links — the socket type updates
          when the property changes, making previously wired sockets
          type-incompatible.
        </li>
        <li>
          <strong>hs_cell_id missing in GLB:</strong> add{" "}
          <code>export_colors=True</code> and{" "}
          <code>export_attributes=True</code> to the glTF export call.{" "}
          <code>FLOAT_COLOR</code> maps to a <code>COLOR</code> accessor in the
          GLB extras; read in Three.js via{" "}
          <code>geometry.attributes.hs_cell_id</code>.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Studio cross-references</h2>
      <ul className="list-disc ml-5 space-y-1 text-sm">
        <li>
          <Link href="/tutorials/blender-tutorial-gn-set-material-index-voronoi-cell-zones" className={lk}>
            GN Set Material Index — Voronoi Cell Zones on Faceted Gem
          </Link>{" "}
          — earlier Voronoi cell workflow without Capture Attribute; compare
          how stable vs unstable seeding behaves on the same gem form.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-gn-scale-elements-noise-driven-face-scale-diamond-plate" className={lk}>
            GN Scale Elements — Noise-Driven Face-Scale Diamond Plate
          </Link>{" "}
          — StoreNamedAttribute + ShaderNodeAttribute pipeline used here for{" "}
          <code>hs_cell_id</code> follows the same pattern as{" "}
          <code>hs_panel_scale</code> in that tutorial.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr" className={lk}>
            Shader — Principled BSDF v2: Full Parameter Map to glTF 2.0 PBR
          </Link>{" "}
          — how Metallic, Roughness, and Emission survive the GLB export that
          the material on this column uses.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-gn-accumulate-field-weighted-stripe-tube" className={lk}>
            GN Accumulate Field — Proportional UV Stripes on a Curve Tube
          </Link>{" "}
          — Accumulate Field is another &quot;freeze along the stack&quot;
          pattern; compare its running-sum behaviour with Capture
          Attribute&apos;s single snapshot.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside sources</h2>
      <ul className="list-disc ml-5 space-y-1 text-sm">
        <li>
          <a
            href="https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/attribute/capture_attribute.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Capture Attribute
          </a>{" "}
          (CC-BY-SA 4.0, Blender Foundation). Canonical socket map, domain
          behaviour, and field-vs-attribute mental model. Related:{" "}
          <a
            href="https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/fields.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Fields reference
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
          (MIT, Nicolas Janakiev). GN node-tree construction patterns and
          bmesh subdivision helpers used in blueprint.py. Related:{" "}
          <a
            href="https://github.com/njanakiev/blender-jupyter"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender-jupyter
          </a>.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-capture-attribute-position-snapshot-stable-voronoi",
    time: "one session",
    difficulty: "intermediate",
    goal:
      "Understand field vs attribute evaluation in GN. Use GeometryNodeCaptureAttribute (data_type=FLOAT_VECTOR, domain=POINT) to freeze per-vertex position before a procedural twist, then seed a Voronoi Texture from the frozen snapshot so cell boundaries remain geometry-stable regardless of twist angle. Export the hs_cell_id named attribute to GLB for WebXR runtime access.",
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
      "Familiar with the GN modifier stack and GroupInput/Output",
      "Know StoreNamedAttribute + ShaderNodeAttribute pipeline",
      "Understand field evaluation order (why node position matters)",
    ],
    steps: [
      {
        title: "Create cylinder and add ring cuts",
        body: "bpy.ops.mesh.primitive_cylinder_add(vertices=16, depth=2.0, radius=0.5, end_fill_type='NGON'). In bmesh: select all vertical edges (delta Z > 0.1), bmesh.ops.subdivide_edges(cuts=14). This gives 15 rings — enough for a smooth twist silhouette.",
      },
      {
        title: "Insert Capture Attribute before the twist",
        body: "n_cap = ng.nodes.new('GeometryNodeCaptureAttribute'). n_cap.data_type='FLOAT_VECTOR', n_cap.domain='POINT'. Wire GroupInput[Geometry] → n_cap.inputs[0] and GeometryNodeInputPosition.Position → n_cap.inputs[1]. The frozen snapshot comes out of n_cap.outputs[1] as a Vector attribute.",
      },
      {
        title: "Build the twist deformation from the frozen Z",
        body: "SeparateXYZ(n_cap.outputs[1]) → Z → Math MULTIPLY (1/depth) → Math MULTIPLY (Twist socket) → VectorRotate(AXIS_ANGLE, Axis=(0,0,1), Vector=n_cap.outputs[1], Angle=above). SetPosition.Position = rotated vector (absolute override, not Offset). Chain: n_cap.outputs[0] → SetPosition.Geometry.",
      },
      {
        title: "Seed Voronoi from captured pos and store cell colour",
        body: "ShaderNodeTexVoronoi(3D, F1). Wire n_cap.outputs[1] → Voronoi.Vector; Voronoi Scale socket → Voronoi.Scale. StoreNamedAttribute(data_type='FLOAT_COLOR', domain='FACE', Name='hs_cell_id'). Wire Voronoi.Color → StoreNamedAttribute.Value. Chain SetPosition → StoreNamedAttribute → SetMaterial → GroupOutput.",
      },
      {
        title: "Export GLB and record videos",
        body: "bpy.ops.export_scene.gltf(export_apply=True, export_colors=True, export_attributes=True, Draco 6, WebP). Run record.py for viewport.mp4 (Twist 0°→180°→0°, 300 frames). Follow SCREEN-RECORDING-NOTES.md: show before/after (raw Position vs captured), node trace, Spreadsheet domain view, GLB attribute inspector.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Voronoi cells still swim when Twist changes",
        cause:
          "Voronoi Vector wired from a raw Position node or from n_cap.outputs[0] (geometry socket, not value socket).",
        fix: "Wire from n_cap.outputs[1] (the Attribute output, index 1). Confirm in the node by hovering the output socket — it reads 'Vector' not 'Geometry'. In the Spreadsheet with domain=POINT, the attribute array should show constant values as you drag Twist.",
      },
      {
        symptom: "data_type AttributeError or socket type mismatch on link",
        cause:
          "data_type set after wiring. The socket type changes when data_type changes, invalidating existing links.",
        fix: "Set n_cap.data_type = 'FLOAT_VECTOR' immediately after node creation, before ng.links.new. Same for domain — set it before wiring the geometry chain.",
      },
    ],
  },
  {
    slug: "blender-tutorial-gn-capture-attribute-position-snapshot-stable-voronoi",
    title:
      "GN Capture Attribute — Pre-Twist Position Snapshot: Stable Voronoi Cell Seeding on a Twisted Hard-Surface Column for WebXR",
    date: "2026-06-28",
    kind: "tutorial",
    excerpt:
      "GeometryNodeCaptureAttribute evaluates a field once at its stack position and freezes the result as a concrete attribute. Learn why this matters by building a procedurally twisted column whose Voronoi cell boundaries stay locked to the original cylinder grid — proving the snapshot happened before the deformation, not after.",
    Body: GnCaptureAttributeBody,
  },
);

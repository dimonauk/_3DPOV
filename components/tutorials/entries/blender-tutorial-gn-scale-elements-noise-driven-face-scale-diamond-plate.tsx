import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnScaleElementsDiamondPlateBody() {
  return (
    <>
      <p>
        The <strong>Scale Elements</strong> node in Geometry Nodes scales each
        face (or edge) toward its own centroid by an independent float field
        rather than a shared global value. Because it disconnects shared vertex
        ownership before scaling, sub-1.0 values open real gaps between adjacent
        faces — the mesh is not merely warped, it is split at every edge boundary
        before the per-face operation runs. Wire a Noise Texture into the Scale
        input and every face receives a spatially correlated but unique scale
        value, producing an industrial "diamond plate" or "scale armour" surface
        with no manual edge-loop work.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Why Scale Elements differs from Inset and Extrude
      </h2>
      <p>
        Three GN nodes produce face-level separation, but each operates on
        different geometry:
      </p>
      <ul className="list-disc list-inside mt-2 space-y-1">
        <li>
          <strong>Extrude Mesh</strong> (Individual Faces mode) lifts faces
          along their normals and inserts sidewall quads — the topology gains
          new geometry.
        </li>
        <li>
          <strong>Inset Faces</strong> (exposed via the Extrude node&apos;s
          Offset mode, or via Bevel Mesh) adds an inset ring per face — again
          new topology, now planar.
        </li>
        <li>
          <strong>Scale Elements</strong> adds <em>no</em> new topology. It
          moves existing vertices. The gaps are literal holes — transparent
          voids in the mesh where the original edge connections used to be.
        </li>
      </ul>
      <p className="mt-3">
        For WebXR props the "no new topology" property is a triangle budget
        win: a 16 × 16 grid processed through Scale Elements still has 512
        triangles (after GLB triangulation), whereas Extrude would add 256
        sidewall quads (512 extra triangles) per face pair.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">The node tree</h2>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`
Position ──────────────────────► NoiseTexture.Vector
                                      │ Fac
                                      ▼
GroupInput["Scale Min"] ─────► MapRange.To Min
GroupInput["Noise Scale"] ───► NoiseTexture.Scale
                                      │
                                  MapRange.Result
                                    │         │
                             Scale Elements  StoreNamedAttribute
                             (domain=FACE)   ("hs_panel_scale", FLOAT, POINT)
                                    │
                             GroupOutput.Geometry
`}</pre>
      <p>
        Exposing <code>Scale Min</code> as a group-input socket lets you
        keyframe the gap width from the modifier panel without touching the tree
        — the <code>record.py</code> animation drives it from 1.0 (flat grid)
        to 0.52 (maximum gap) over 90 frames.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Constructing the tree via bpy
      </h2>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`import bpy

tree = bpy.data.node_groups.new("HF_ScaleElements_DiamondPlate",
                                 "GeometryNodeTree")

# Blender 4.0+ interface API — tree.inputs/outputs are deprecated
tree.interface.new_socket("Geometry",    in_out="INPUT",
                          socket_type="NodeSocketGeometry")
tree.interface.new_socket("Geometry",    in_out="OUTPUT",
                          socket_type="NodeSocketGeometry")
sk = tree.interface.new_socket("Scale Min", in_out="INPUT",
                               socket_type="NodeSocketFloat")
sk.default_value = 0.52
sk.min_value     = 0.05
sk.max_value     = 1.0

gi  = tree.nodes.new("NodeGroupInput")
go  = tree.nodes.new("NodeGroupOutput")
pos = tree.nodes.new("GeometryNodeInputPosition")
noi = tree.nodes.new("ShaderNodeTexNoise")
mr  = tree.nodes.new("ShaderNodeMapRange")
se  = tree.nodes.new("GeometryNodeScaleElements")
sna = tree.nodes.new("GeometryNodeStoreNamedAttribute")

noi.noise_dimensions = "3D"
noi.inputs["Scale"].default_value   = 3.5
noi.inputs["Detail"].default_value  = 2.0

mr.inputs["From Min"].default_value = 0.0
mr.inputs["From Max"].default_value = 1.0
mr.inputs["To Max"].default_value   = 0.97   # SCALE_MAX: near-flush panel

se.domain  = "FACE"   # operate per-face, not per-edge or per-vertex

sna.data_type = "FLOAT"
sna.domain    = "POINT"
sna.inputs["Name"].default_value = "hs_panel_scale"

lk = tree.links
lk.new(gi.outputs["Geometry"],   se.inputs["Geometry"])
lk.new(pos.outputs["Position"],  noi.inputs["Vector"])
lk.new(noi.outputs["Fac"],       mr.inputs["Value"])
lk.new(gi.outputs["Scale Min"],  mr.inputs["To Min"])
lk.new(mr.outputs["Result"],     se.inputs["Scale"])
lk.new(mr.outputs["Result"],     sna.inputs["Value"])
lk.new(se.outputs["Geometry"],   sna.inputs["Geometry"])
lk.new(sna.outputs["Geometry"],  go.inputs["Geometry"])`}</pre>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Named attribute as a shader input
      </h2>
      <p>
        The <code>StoreNamedAttribute</code> node writes the per-vertex noise
        value as a FLOAT on the POINT domain. The material reads it back via a{" "}
        <strong>Attribute</strong> shader node, pipes the result through a
        Colour Ramp (near-black for low-scale seam vertices, pale steel for
        high-scale face centres), and connects that to the Principled BSDF Base
        Colour. The result: the darkest pixels are concentrated at seam edges
        — exactly where real machined grooves collect shadow.
      </p>
      <p className="mt-3">
        On GLB export with <code>export_colors=True</code>, the float attribute
        travels as a custom accessor. In Three.js:{" "}
        <code>geometry.attributes.hs_panel_scale.array</code> is available
        immediately after loading with GLTFLoader, ready to drive a custom GLSL
        uniform or a vertex-colour override in{" "}
        <code>onBeforeCompile</code>.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Animating the gap width
      </h2>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`# Find the modifier input socket identifier by name
mod  = obj.modifiers["diamond_plate_gn"]
tree = mod.node_group
sid  = next(
    item.identifier
    for item in tree.interface.items_tree
    if item.name == "Scale Min" and item.in_out == "INPUT"
)

def key(frame, value):
    bpy.context.scene.frame_set(frame)
    mod[sid] = value
    mod.keyframe_insert(data_path=f"[\\"{sid}\\"]", frame=frame)

key(1,   1.0)    # flat grid
key(30,  1.0)    # hold
key(120, 0.52)   # full diamond-plate
key(150, 0.52)   # hold`}</pre>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Troubleshooting
      </h2>
      <ul className="list-disc list-inside space-y-2">
        <li>
          <strong>No visible gaps at Scale = 0.52</strong> — check that the
          GN modifier is above any Subdivision Surface modifier in the stack.
          Subdivision runs after Scale Elements if placed below it, merging
          the gap vertices back together.
        </li>
        <li>
          <strong>hs_panel_scale missing from GLB extras</strong> — you need{" "}
          <code>export_colors=True</code> in the GLTF export settings. Without
          it, custom non-colour attributes are silently omitted.
        </li>
        <li>
          <strong>Socket identifier <code>None</code></strong> — the GN tree
          interface changed between Blender 3.x and 4.0+. On 3.x use{" "}
          <code>tree.inputs["Scale Min"].identifier</code> instead of
          iterating <code>tree.interface.items_tree</code>.
        </li>
        <li>
          <strong>Gaps look jagged in Rendered shading</strong> — add a{" "}
          <strong>Smooth by Angle</strong> GN node (threshold ≈ 30°) after
          Scale Elements to soften normal splits without losing the hard facet
          look on face centres.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">Related studio work</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <Link href="/tutorials/blender-tutorial-gn-extrude-mesh-panel-inset-procedural" className={lk}>
            GN Extrude Mesh — Panel Inset Procedural
          </Link>{" "}
          — compare with the topology-adding approach that produces sidewalls.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-vertex-colour-attributes" className={lk}>
            Vertex Colour Attributes in Blender
          </Link>{" "}
          — broader context for why POINT-domain attributes export cleanly to GLB.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-gn-attribute-statistic-evaluate-on-domain" className={lk}>
            GN Attribute Statistic + Evaluate on Domain
          </Link>{" "}
          — how to normalise fields and transfer them between domains.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-gn-store-named-attribute-shader-data-bridge" className={lk}>
            GN Store Named Attribute — Shader Data Bridge
          </Link>{" "}
          — the sister tutorial covering the full shader-bridge pattern.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">Outside sources</h2>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          Blender Foundation —{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/scale_elements.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Scale Elements node manual
          </a>{" "}
          · CC-BY-SA-4.0 · sibling:{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.GeometryNodeScaleElements.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.GeometryNodeScaleElements
          </a>
        </li>
        <li>
          Nicolas Janakiev —{" "}
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njanakiev/blender-scripting
          </a>{" "}
          · MIT · sibling:{" "}
          <a
            href="https://github.com/njanakiev/blender-jupyter"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender-jupyter
          </a>
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/geometry-nodes/gn-scale-elements-noise-driven-face-scale-diamond-plate/",
    time: "one focused session (≈ 40 minutes)",
    difficulty: "intermediate",
    cost: "free — all tools are part of Blender",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Comfortable building simple Geometry Nodes trees via the UI or bpy API",
      "Understand what a named attribute is and how it travels to GLB",
      "Basic Python scripting in the Blender Scripting workspace",
    ],
    steps: [
      {
        title: "Open blueprint.py in the Scripting workspace",
        body: "Open Blender 5.1. Switch to the Scripting workspace. Press New in the Text Editor, paste the contents of blueprint.py, and save it. Read the constants block at the top — OUTPUT_DIR defaults to a folder next to your .blend file.",
      },
      {
        title: "Run the script",
        body: "Press Alt+P (or ▶ Run Script). The script creates a 16 × 16 grid, builds the GN tree, adds the material, and exports diamond_plate.glb. Watch the system console for [blueprint] log lines confirming both files were written.",
      },
      {
        title: "Inspect the GN tree",
        body: "Select the diamond_plate object. Open the Geometry Nodes workspace. You should see the six-node chain from GroupInput through NoiseTexture → MapRange → ScaleElements → StoreNamedAttribute to GroupOutput. In the N-Panel (N key), find the modifier properties and drag Scale Min from 0.52 toward 1.0 — watch the gaps close in real time.",
      },
      {
        title: "Check the named attribute in the Spreadsheet",
        body: "Open a Spreadsheet editor (editor-type dropdown). Set domain to Point, tick Named Attributes. The hs_panel_scale column shows per-vertex float values in the 0.52–0.97 range, one per vertex of the modified geometry.",
      },
      {
        title: "Inspect the material colour-map",
        body: "Switch the viewport to Rendered shading (Z → Rendered). The grid shows dark seam lines where faces are scaled tightest and a pale-steel centre where scale is near 1.0. The colour ramp in the material maps hs_panel_scale 0→1 to charcoal→pale-steel Principled BSDF Base Colour.",
      },
      {
        title: "Record the animation (optional)",
        body: "Open record.py in a second Text Editor tab. Press Alt+P. The script keyframes Scale Min from 1.0 (flat) to 0.52 (full diamond plate) and renders a 150-frame opengl animation. Output lands at public/library/videos/geometry-nodes/…/viewport.mp4.",
      },
      {
        title: "Verify the GLB in Three.js",
        body: "Load diamond_plate.glb with Three.js GLTFLoader. After loading, check gltf.scene.children[0].geometry.attributes — you should see a custom hs_panel_scale Float32Array attribute alongside the standard position and normal. Use it to tint emissive or control a procedural cavity shader in onBeforeCompile.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Gaps do not appear even with Scale Min = 0.1",
        cause:
          "A Subdivision Surface modifier sits below the GN modifier in the stack. Subdivision merges the un-welded geometry back together.",
        fix: "Move the GN modifier below Subdivision Surface in the modifier panel, or remove Subdivision Surface entirely. Scale Elements must run after the base topology is fixed.",
      },
      {
        symptom: "AttributeError: 'ShaderNodeMapRange' not found",
        cause:
          "Running on Blender 3.x where 'ShaderNodeMapRange' was named differently in some contexts.",
        fix: "Update to Blender 5.1. On 3.x you may need 'ShaderNodeMapRange' with the node's data_type property absent — remove the data_type line.",
      },
      {
        symptom: "hs_panel_scale not present in the GLB attributes",
        cause:
          "export_colors=False was set in the GLTF export call, which skips non-standard vertex attributes.",
        fix: "Pass export_colors=True to bpy.ops.export_scene.gltf(). Custom float attributes are included only when colour export is enabled.",
      },
      {
        symptom: "Scale Min socket identifier comes back None in record.py",
        cause:
          "The blueprint.py was modified and the socket was renamed or the tree rebuilt without the exposed socket.",
        fix: "Re-run blueprint.py to rebuild the tree with the exposed Scale Min socket, then re-run record.py.",
      },
    ],
    finalResult:
      "A 16 × 16 quad grid with noise-driven per-face scale gaps exported as diamond_plate.glb — Draco-compressed, with hs_panel_scale float attribute for Three.js runtime use. Animation shows the gaps opening from a flat grid to full diamond-plate texture.",
  },
  {
    slug: "blender-tutorial-gn-scale-elements-noise-driven-face-scale-diamond-plate",
    title:
      "GN Scale Elements — Noise-Driven Face-Scale Diamond Plate for WebXR (Blender 5.1)",
    date: "2026-06-28",
    kind: "tutorial",
    excerpt:
      "Scale Elements disconnects shared vertex ownership before scaling each face toward its own centroid — pair it with a Noise Texture field and every face gets an independent gap width, producing industrial diamond-plate or scale-armour surface detail with no manual edge work.",
    Body: GnScaleElementsDiamondPlateBody,
  },
);

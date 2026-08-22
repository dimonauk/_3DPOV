import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnViewerNodeDebugBody() {
  return (
    <>
      <p>
        <code>GeometryNodeViewer</code> is a diagnostic socket: connect any
        field output to it mid-tree and Blender projects the values into the 3D
        Viewport as a colour overlay — grayscale for floats, RGB for vectors —
        and populates a &ldquo;Viewer&rdquo; column in the Spreadsheet Editor.
        The critical rule is that it must never be wired to Group Output; it
        lives as a side-branch so the main data path is untouched. You add a
        probe, read the values, then remove or disconnect it once the bug is
        found. It is the GN equivalent of inserting a print statement.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Why fields have domains and why the Viewer must match
      </h2>
      <p>
        Every GN field evaluates to a value per element of a specific{" "}
        <em>domain</em>: POINT (vertex), EDGE, FACE, CORNER (UV loop), CURVE
        (spline), or INSTANCE. The Viewer node&apos;s{" "}
        <code>domain</code> property must agree with the field you feed it.
        Set it to <code>POINT</code> when inspecting a noise scalar that drives
        per-vertex displacement; set it to <code>FACE</code> when inspecting a
        normal or material index. A mismatch — e.g., feeding a face attribute
        into a POINT-domain Viewer — causes Blender to interpolate or repeat
        values, which produces a misleading overlay that looks plausible but
        hides the real data. The Spreadsheet domain tab (Vertices, Edges, Faces
        …) must also match, or you will read the wrong row set.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Colour encoding in the Solid viewport overlay
      </h2>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-3 overflow-x-auto">
{`Float   → luminance    (0 = black, 1 = white; negative = clamp black)
Vector  → XYZ → RGB    (world normals: mostly blue on horizontal faces)
Bool    → 0/1 binary   (false = black, true = white)
Int     → normalised   (Spreadsheet maps to 0–1 relative to min/max)

Requirement: 3D Viewport must be in SOLID shading mode.
             Material Preview or Render mode ignores Viewer overlays.
Requirement: Overlays dropdown → Geometry Nodes must be ticked.`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Three probes — node graph (Blender 5.1)
      </h2>
      <p>
        The blueprint builds a 14×14 grid displaced by Noise Texture and
        installs three Viewer probes. Click any one in the GN editor to
        activate it; the active node&apos;s title bar highlights and the
        Spreadsheet follows automatically.
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-3 overflow-x-auto">
{`# ── Probe A: noise Fac at POINT domain (BEFORE displacement) ────────────
n_va = ns.new("GeometryNodeViewer")
n_va.domain = 'POINT'
n_va.label  = "Viewer: Noise Scalar"

# Wire: Group Input Geometry → n_va.inputs["Geometry"]
#       Noise Texture Fac    → n_va.inputs["Value"]
#
# The Geometry input receives the UNDISPLACED grid.
# The Value input receives the Fac field evaluated per vertex.
# Viewport: grayscale gradient; black = 0, white = 1.
# Spreadsheet: Vertices tab → Viewer column → exact floats.

# ── Probe B: face normal at FACE domain (AFTER displacement) ─────────────
n_vb = ns.new("GeometryNodeViewer")
n_vb.domain = 'FACE'
n_vb.label  = "Viewer: Face Normal"

# Wire: displaced geometry → n_vb.inputs["Geometry"]
#       GeometryNodeInputNormal → n_vb.inputs["Value"]
#
# Horizontal faces → blue. N/S slopes → green. E/W slopes → red.
# Spreadsheet: Faces tab → Viewer column → XYZ triples.

# ── Probe C: named attribute round-trip (POINT domain) ───────────────────
n_vc = ns.new("GeometryNodeViewer")
n_vc.domain = 'POINT'
n_vc.label  = "Viewer: Named Attr RT"

# GeometryNodeInputNamedAttribute has NO Geometry socket in 5.1 —
# it reads from the field evaluation context of its consumer.
n_named = ns.new("GeometryNodeInputNamedAttribute")
n_named.data_type = 'FLOAT'
n_named.inputs["Name"].default_value = "noise_height"

# Wire: n_store Geometry output → n_vc.inputs["Geometry"]
#       n_named Attribute output → n_vc.inputs["Value"]
#
# Must be identical to Probe A.
# Any divergence → domain mismatch in GeometryNodeStoreNamedAttribute
# (its domain property must be 'POINT' to match both Viewer domains).`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        The Store Named Attribute trap
      </h2>
      <p>
        <code>GeometryNodeStoreNamedAttribute</code> has an explicit{" "}
        <code>domain</code> property that defaults to <code>POINT</code> in a
        new node but can be changed to FACE, EDGE, or CORNER by accident when
        pasting nodes between trees. If Probe C shows zeros after Store is
        wired: the attribute was written to the FACE domain but the Viewer
        reads POINT — the named attribute exists but not on the domain you are
        querying. Fix: check <code>n_store.domain == &apos;POINT&apos;</code>{" "}
        and verify the <code>Name</code> string matches exactly, including case.
      </p>
      <p>
        This is related to the capture-attribute workflow covered in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-capture-attribute-position-snapshot-stable-voronoi"
          className={lk}
        >
          Capture Attribute: Pre-Twist Position Snapshot
        </Link>{" "}
        and the attribute bridging pattern from{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-store-named-attribute-shader-data-bridge"
          className={lk}
        >
          Store Named Attribute — Shader Data Bridge
        </Link>
        .
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Spreadsheet Editor integration
      </h2>
      <p>
        With any Viewer node active, open the Spreadsheet Editor. Select the
        correct domain tab (Vertices for POINT, Faces for FACE). A{" "}
        <strong>Viewer</strong> column appears alongside the built-in attribute
        columns. You can sort it descending to find the vertex with the highest
        noise value, then cross-locate it in the viewport by enabling{" "}
        <em>Highlight Selected</em>. This technique is how the topology heat
        map in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-mesh-topology-vertex-valence-heat-map"
          className={lk}
        >
          Vertex Valence Heat Map
        </Link>{" "}
        tutorial was debugged during development: a Viewer on the valence count
        confirmed the per-vertex integer values before they were used to drive
        the colour ramp.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Debugging accumulate-field outputs
      </h2>
      <p>
        Accumulate Field is particularly opaque — its running sum per domain
        is hard to reason about without seeing the values. A Viewer on the
        Leading or Trailing output, with domain set to match the field context
        (typically POINT or EDGE), reveals the cumulative sum at each element
        immediately. Compare this with the workflow in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-accumulate-field-weighted-stripe-tube"
          className={lk}
        >
          Accumulate Field — Proportional UV Stripes
        </Link>{" "}
        where the per-arc-length accumulation drives stripe widths.
      </p>
      <p>
        For position-based noise displacement specifically — the technique used
        in this blueprint — see also{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-set-position-noise-displacement"
          className={lk}
        >
          Set Position — Noise Displacement
        </Link>
        , which covers the displacement node graph without the diagnostic layer.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Failure modes and how to fix them
      </h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <strong>Viewer overlay stays solid grey despite wiring:</strong>{" "}
          The 3D Viewport is not in Solid shading mode. Press{" "}
          <kbd>Z</kbd> → Solid, or click the Solid sphere icon top right.
        </li>
        <li>
          <strong>Overlay visible in Solid but disappears in Render:</strong>{" "}
          Correct and expected. The Viewer overlay is a Solid-mode diagnostic
          only. Use Shader AOV nodes for persistent custom render passes.
        </li>
        <li>
          <strong>Spreadsheet shows no Viewer column:</strong>{" "}
          The active object does not have a GN modifier, or the GN modifier
          is disabled (eye icon off). Re-enable the modifier.
        </li>
        <li>
          <strong>Multiple Viewer nodes — only one shows data:</strong>{" "}
          Only the <em>active</em> Viewer node (the one selected in the node
          editor) is evaluated and displayed. Click a different Viewer node to
          switch focus.
        </li>
        <li>
          <strong>Probe C shows zeros:</strong>{" "}
          Attribute name mismatch or Store domain ≠ POINT. Check{" "}
          <code>n_store.domain</code> and the Name string in both Store and
          Named Attribute nodes.
        </li>
        <li>
          <strong>Performance warning on large meshes:</strong>{" "}
          The Viewer evaluates the full field every viewport redraw. On
          meshes with 100k+ vertices, disable the Viewer nodes (click the
          mute icon ×) until you need them, or work at a lower subdivision
          level.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        External references
      </h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/debug/viewer.html"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            Blender Manual — Viewer Node
          </a>{" "}
          (Blender Foundation; CC-BY-SA 4.0). Full domain enum reference and
          Spreadsheet integration notes. The related{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/editors/spreadsheet.html"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            Spreadsheet Editor
          </a>{" "}
          page covers column filtering and domain tabs in depth.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">For the record</h2>
      <p>
        See <code>SCREEN-RECORDING-NOTES.md</code> for the full OBS setup and
        a 10-minute recording script. The key moment to capture: change the
        Name string in Store Named Attribute from <code>noise_height</code> to
        a typo, watch Probe C go black, fix it, and watch it recover — that
        live feedback loop is the Viewer node&apos;s main teaching moment.
        Viewport render (
        <code>bpy.ops.render.opengl(animation=True)</code>) from a Solid-mode
        viewport produces <code>viewport.mp4</code> at 1920×1080, 12 seconds
        of the three probe segments in sequence.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-viewer-node-debug-inspect-attributes",
    time: "one afternoon",
    difficulty: "advanced",
    goal:
      "Use GeometryNodeViewer as a mid-tree diagnostic probe to inspect scalar, vector, and named-attribute fields without wiring to Group Output; read values in both the 3D Viewport colour overlay (Solid mode) and the Spreadsheet Editor; distinguish POINT-domain vs FACE-domain data; confirm Store Named Attribute round-trips via identical Probe A / Probe C readout; identify and fix domain-mismatch bugs in seconds rather than hours.",
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
      "Comfortable adding nodes and creating links via ng.nodes.new / ng.links.new",
      "Know how to apply a Geometry Nodes modifier and navigate the node editor",
      "Understand the concept of attribute domains (POINT, FACE, EDGE, CORNER)",
    ],
    steps: [
      {
        title: "Run blueprint.py to build the scene",
        body: "blender --background --python blueprint.py. This creates a 14×14 noise-displaced grid with three Viewer probes already wired as side branches. Open the resulting gn_viewer_debug.blend in Blender.",
      },
      {
        title: "Activate Probe A in the GN editor",
        body: "Open the GN editor. Click the node labelled 'Viewer: Noise Scalar'. Its title bar highlights. Set the 3D Viewport to Solid shading (Z → Solid) and verify that Overlays → Geometry Nodes is ticked. A grayscale gradient should appear on the grid surface: black at noise minimum, white at noise maximum.",
      },
      {
        title: "Read the values in the Spreadsheet Editor",
        body: "Open a Spreadsheet Editor panel. Select the Vertices tab. A 'Viewer' column appears. Sort descending. The highest values correspond to the white patches in the viewport. Click a row — the vertex highlights in the 3D Viewport if Highlight Selected is on.",
      },
      {
        title: "Switch to Probe B — Face Normal",
        body: "Click 'Viewer: Face Normal' in the GN editor. The Spreadsheet switches to the Faces tab and shows XYZ vector triples. The viewport shows RGB slope encoding: blue = horizontal, red/green = tilted. Compare the blue (Z) channel against the displacement — it should peak where the noise is highest.",
      },
      {
        title: "Switch to Probe C — Named Attribute round-trip",
        body: "Click 'Viewer: Named Attr RT'. Should be bit-for-bit identical to Probe A. If not: find Store Named Attribute, confirm its domain is POINT and its Name is 'noise_height'. Intentionally mis-type the name to 'noise_ht' and watch Probe C go black. Fix it to recover — this is the diagnostic loop the Viewer node enables.",
      },
      {
        title: "Disconnect and clean up probes",
        body: "When debugging is done: select a Viewer node's Geometry link and delete it (X). The node remains in the tree but evaluates nothing — a zero-cost placeholder. Alternatively delete Viewer nodes entirely before export. Neither approach affects Group Output or the glTF export.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Overlay shows nothing — grid stays flat grey",
        cause:
          "3D Viewport is in Material Preview or Render mode, not Solid mode.",
        fix: "Press Z and select Solid. The Viewer overlay only exists in Solid shading.",
      },
      {
        symptom: "Probe C shows zeros when Probe A shows correct values",
        cause:
          "Store Named Attribute domain is set to FACE or EDGE instead of POINT, or the Name string has a typo.",
        fix: "Check n_store.domain == 'POINT' and that the Name field in both Store and Named Attribute nodes is exactly 'noise_height'.",
      },
      {
        symptom: "Spreadsheet Viewer column missing",
        cause:
          "The active object has no GN modifier, or the modifier is toggled off.",
        fix: "Select the gn_debug_probe object and ensure the GN modifier eye icon is enabled.",
      },
    ],
  },
  {
    slug: "blender-tutorial-gn-viewer-node-debug-inspect-attributes",
    title:
      "GN Viewer Node — Field Inspection & Real-Time Attribute Debugging (Blender 5.1)",
    date: "2026-06-28",
    kind: "tutorial",
    excerpt:
      "GeometryNodeViewer is a side-branch diagnostic socket: connect any field mid-tree to see per-domain values as a viewport colour overlay and in the Spreadsheet Editor, without touching Group Output. Three probes — noise scalar, face normal, named-attribute round-trip — teach the complete debugging workflow that turns opaque GN trees into transparent, inspectable pipelines.",
    Body: GnViewerNodeDebugBody,
  }
);

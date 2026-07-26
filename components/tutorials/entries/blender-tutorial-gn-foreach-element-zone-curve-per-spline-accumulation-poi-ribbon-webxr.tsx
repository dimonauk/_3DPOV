import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-gn-foreach-element-zone-curve-per-spline-accumulation-poi-ribbon-webxr";

const TITLE =
  "GN Foreach Element Zone on Curves: Per-Spline Arc-Length Ribbon Builder & Poi Light-Trail WebXR GLB (Blender 5.1)";

const LEDE =
  "The Foreach Element Zone (stable in Blender 5.1) iterates over geometry domains — mesh faces, edges, splines — running a sub-graph once per element and accumulating the results. Set domain to SPLINE and each loop iteration receives a single-spline Curves object: Spline Length returns that strand's arc length, Curve to Mesh converts it to a ribbon, and the ribbon width is modulated by a Math(MULTIPLY_ADD) node wired to arc length. Eight helical strands are each independently resampled, profiled with a 8-gon circle whose radius = BASE_RADIUS + arc_length × RADIUS_SCALE, assigned a unique emission material via Set Material Index + Index node, then joined into a single Draco-6 GLB for WebXR bloom display. The modifier is built programmatically via Python bpy so every socket pairing, zone pairing (pair_with_output), and interface registration is explicit.";

function Body() {
  return (
    <>
      <p>
        The Foreach Element Zone was added to Geometry Nodes in Blender 4.3 as
        the non-temporal sibling of the Simulation Zone. Where the Simulation
        Zone carries state forward in time, the Foreach Zone carries geometry
        forward in space — each iteration processes one element (face, edge,
        point, or spline) and contributes its result to an accumulated output.
        Blender 5.1 stabilised the Curves domain: setting{" "}
        <code>GeometryNodeForeachGeometryElementInput.domain = &quot;SPLINE&quot;</code>{" "}
        makes the zone iterate once per spline in a multi-spline Curves object.
        This tutorial builds on the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-for-each-element-hex-panel"
          className={lk}
        >
          hex-panel Foreach tutorial
        </Link>{" "}
        (mesh face domain) and the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-to-mesh-ribbon-trim-tilt-webxr"
          className={lk}
        >
          Curve to Mesh ribbon tutorial
        </Link>
        , combining both techniques to process each strand of a poi light
        bundle independently.
      </p>

      <h2>Why Foreach over splines, and what you cannot do without it</h2>
      <p>
        Before the Foreach Zone, multi-strand geometry nodes fell into two
        camps. You could treat all control points as a flat field and compute a
        per-point ribbon width using field evaluation — but then every point on
        every strand shared the same domain statistics, so you could not weight
        strand A&apos;s ribbon by strand A&apos;s arc length while strand
        B&apos;s ribbon used strand B&apos;s arc length. Alternatively, you
        could route each strand through a separate node group manually — but
        that requires knowing the strand count at build time and hand-wiring
        eight or thirty or a hundred identical sub-graphs, which is
        impractical for a parametric setup.
      </p>
      <p>
        The Foreach Zone eliminates both problems. It iterates{" "}
        <em>however many splines</em> are in the input Curves object — zero to
        thousands — without any changes to the node graph. Inside the zone,{" "}
        <code>SplineLength</code> returns the arc length of the{" "}
        <em>current</em> spline (not the mean arc length across all splines),
        and <code>Index</code> returns the current spline&apos;s zero-based
        index, which maps directly to a material slot. Compare this to the
        per-spline attribute strategy in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr"
          className={lk}
        >
          Points to Curves ribbon tutorial
        </Link>
        : that tutorial stores a per-point age attribute to drive taper within
        one strand; this tutorial stores nothing — it <em>computes</em> per-strand
        properties on the fly inside the zone, which is the correct pattern when
        the per-element statistic is a global property of the element (its total
        length) rather than a per-point field.
      </p>

      <h2>Zone pairing in the Python API</h2>
      <p>
        Every Blender zone (Simulation, Foreach, Repeat) consists of a matched
        pair of nodes: an Input node and an Output node. In the UI you add them
        as a single unit; in Python you add them separately and then call{" "}
        <code>input_node.pair_with_output(output_node)</code>. Without
        pairing, Blender treats the two nodes as disconnected and the{" "}
        <em>inside the zone</em> concept does not apply — nodes drawn between
        them are topologically ordinary nodes, not zone members.
      </p>
      <pre>{`foreach_in  = ng.nodes.new("GeometryNodeForeachGeometryElementInput")
foreach_out = ng.nodes.new("GeometryNodeForeachGeometryElementOutput")
foreach_in.domain = "SPLINE"   # iterate over splines

# CRITICAL — without this the zone has no interior
foreach_in.pair_with_output(foreach_out)`}</pre>
      <p>
        Pairing also determines which sockets appear on each node.{" "}
        <code>foreach_in</code> gains a <strong>Main Geometry</strong> socket
        (the full Curves object, passed through but not iterated) and an{" "}
        <strong>Element Geometry</strong> output (the current single-spline
        Curves — this is what nodes inside the zone receive). Compare with the
        GN tree-from-Python approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-gn-tree-from-python-index-switch-poi-head-webxr"
          className={lk}
        >
          Index Switch poi head tutorial
        </Link>
        , which also builds a GN modifier in Python but does not use a zone.
        The zone pairing requirement is the key difference: Index Switch nodes
        can be wired freely, but zone nodes must be paired first.
      </p>

      <h2>Arc-length-driven ribbon width</h2>
      <p>
        Spline Length returns two fields:{" "}
        <code>Length</code> (arc length in Blender units) and{" "}
        <code>Point Count</code> (number of control points). We use{" "}
        <code>Length</code> as a scalar — technically it is a field that
        evaluates to the same value at every point of the current spline — and
        wire it into a <code>ShaderNodeMath(MULTIPLY_ADD)</code>:
      </p>
      <pre>{`# ribbon_radius = arc_length × RADIUS_SCALE + BASE_RADIUS
# Math MULTIPLY_ADD: output = Input0 × Input1 + Input2
math_r.inputs[0] = arc_length   # from SplineLength.Length
math_r.inputs[1] = RADIUS_SCALE  # modifier socket (~0.01)
math_r.inputs[2] = BASE_RADIUS   # modifier socket (~0.04)`}</pre>
      <p>
        The helix strands have different radii and turn counts (controlled by{" "}
        <code>r_local</code> and <code>HELIX_TURNS</code> in blueprint.py), so
        the outer strands, which trace larger circles, are measurably longer —
        a 1.7× longer strand gets a 1.7× wider ribbon section. The visual
        result is a tapered bundle: the innermost strand is the thinnest, the
        outermost the thickest, which roughly matches the cross-section of a
        real poi prop cluster photographed from the side.
      </p>

      <h2>Per-spline material assignment</h2>
      <p>
        Inside the Foreach Zone, <code>GeometryNodeInputIndex</code> returns
        the iteration counter — 0 on the first spline, 1 on the second, and so
        on. Wiring this into <code>GeometryNodeSetMaterialIndex</code> assigns
        the matching material slot to every face produced by Curve to Mesh for
        that strand. The material slots are pre-attached to the object by
        blueprint.py (<code>obj.data.materials.append(mat)</code>) before the
        modifier runs — GN Set Material Index references slots by integer, not
        by material pointer, so the order of <code>append()</code> calls
        determines which material index selects which colour.
      </p>
      <p>
        This is a simpler approach than the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-socket-panels-interface-collapsible-modifier-ui"
          className={lk}
        >
          GN socket panels tutorial
        </Link>
        &apos;s per-socket colour parameterisation, and it scales to arbitrary
        strand counts without modifier UI changes. The trade-off: colours are
        baked into the material list at construction time; changing strand 3
        from cyan to gold requires editing the material, not the modifier
        socket. For a studio library prop (where colours are design decisions,
        not interactive parameters) this is the right trade-off.
      </p>

      <h2>Resample inside the zone — why and what count</h2>
      <p>
        The helical control points are placed at uniform angular intervals, but
        the arc-length spacing between POLY spline points varies slightly with
        helix radius. Resampling to 96 uniformly-spaced points inside the zone
        guarantees that Curve to Mesh produces uniform-density ribbon polygons
        regardless of the original strand shape. The 96-point count is chosen
        to give smooth curvature at HELIX_TURNS = 3 (≈ 32 points per turn)
        while staying under the polygon budget for real-time WebXR rendering.
      </p>
      <p>
        The resample happens <em>inside the foreach zone</em>, not on the
        original Curves object, because the target count depends on the strand
        (longer strands might warrant more points). With the current uniform-count
        resample, each strand gets identical density — an improvement to reach
        for is wiring <code>SplineLength.Length / TARGET_EDGE_LENGTH</code>{" "}
        (via a Divide node) into the <code>Count</code> socket to achieve a
        target edge length rather than a target point count. That is the same
        adaptive pattern used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-hair-curves-spring-dynamics-vrm"
          className={lk}
        >
          Hair Curves spring dynamics tutorial
        </Link>
        , which also resamples inside a zone for uniform physics step accuracy.
      </p>

      <h2>Foreach vs Simulation Zone — when to reach for each</h2>
      <p>
        A working mental model: the Foreach Zone is a{" "}
        <code>map()</code> operation — it applies a sub-graph independently to
        each element and collects results. The Simulation Zone is a{" "}
        <code>fold()</code> — each frame carries forward a stateful geometry
        that the next frame reads and modifies. The ribbon builder here is
        purely <code>map()</code>: each strand is processed in isolation and
        the results are joined, which is exactly what Foreach is for.
      </p>
      <p>
        A{" "}
        <code>fold()</code> over splines would look like: &ldquo;for each new
        strand, check whether it intersects any strand processed so far and
        adjust its radius to avoid overlap.&rdquo; That accumulates state
        across iterations, which requires the Simulation Zone pattern (even
        though time is not involved). Blender 5.1 does not natively support a
        stateful Foreach; the workaround is a Simulation Zone running for{" "}
        <em>N</em> frames where each frame processes one strand. This is the
        technique in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-spring-mass-cloth-verlet-grid-webxr"
          className={lk}
        >
          Verlet cloth tutorial
        </Link>
        — using time as a loop counter to build geometry iteratively.
      </p>
    </>
  );
}

export const blenderTutorialGnForeachElementZoneCurvePerSplineAccumulationPoiRibbonWebxrEntry: Entry =
  buildInstructable(
    {
      blenderVersion: "5.1",
      difficulty: "advanced",
      time: "2–3 hours",
      prerequisites: [
        "Geometry Nodes intermediate — fields, domains, Curve to Mesh",
        "Basic Python bpy API — bpy.data.node_groups, node creation, linking",
        "Familiarity with Blender zones (Simulation Zone is sufficient context)",
      ],
      software: [
        {
          name: "Blender",
          version: "≥ 5.1",
          url: "https://www.blender.org/download/",
          cost: "free",
          platforms: ["windows", "macos", "linux"],
        },
      ],
      steps: [
        {
          title: "Run blueprint.py in the Scripting workspace",
          body: "Open the Scripting workspace. Create a new text block, paste the full contents of blueprint.py, and click Run Script. The Python console should print '[hf_ribbon] Done.' after a few seconds. Blender creates a Curves object (hf_poi_strands) with a GN modifier and 8 emission materials.",
        },
        {
          title: "Inspect the Foreach Zone in the GN editor",
          body: "Open the Geometry Node Editor. Select hf_poi_strands and press Tab to enter the modifier's node group. Locate the two green Foreach Element Zone nodes. Select the Input node and check the N panel (press N) — the Domain property should read 'Spline'. The nodes between the zone pair (Spline Length, Math, Circle, Curve to Mesh, Set Material Index) are the per-spline sub-graph.",
        },
        {
          title: "Verify per-spline arc length in the Spreadsheet",
          body: "Open the Spreadsheet Editor. Set the object to hf_poi_strands and the domain to Spline. You should see 8 rows. There is no pre-computed 'arc_length' attribute here — the Spline Length node computes it live inside the zone on each evaluation. To inspect it, add a Store Named Attribute node inside the zone after Spline Length and redirect the Length output there; the Spreadsheet will then show the computed value per spline.",
          code: `# Quick verification — print arc lengths from Python:
import bpy
obj = bpy.data.objects["hf_poi_strands"]
for spline in obj.data.splines:
    # POLY spline: arc length = sum of inter-point distances
    pts = [p.co for p in spline.points]
    L = sum((pts[i+1].xyz - pts[i].xyz).length for i in range(len(pts)-1))
    print(f"spline arc_length ≈ {L:.3f} m")`,
        },
        {
          title: "Adjust radius scale interactively",
          body: "Select the GN modifier in Properties → Modifier. The 'Base Radius' and 'Radius Scale' sockets appear as numeric fields. Increase Radius Scale from 0.010 to 0.025 — the outer strands (longer arc length) visibly widen relative to the inner strands. This demonstrates that the width difference is driven by the per-spline arc length computed inside the Foreach Zone.",
        },
        {
          title: "Export the GLB",
          body: "The script exports automatically when EXPORT_GLB = True. To re-export manually: File → Export → glTF 2.0, enable Draco compression at level 6, tick 'Apply Modifiers' so the Foreach zone geometry is baked. Confirm the GLB contains 8 distinct ribbon meshes with emission materials in a glTF viewer (gltf.report works well).",
          code: `# Manual export from Python:
bpy.ops.export_scene.gltf(
    filepath="/path/to/hf_poi_ribbons.glb",
    export_format="GLB",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_apply=True,
    use_selection=True,
)`,
        },
      ],
      variations: [
        "Change N_STRANDS to 16 and HELIX_TURNS to 5 — the blueprint requires zero node graph changes. The Foreach Zone adapts automatically to however many splines are in the Curves object. This is the key scalability advantage over hand-wired parallel sub-graphs.",
        "Replace the Math(MULTIPLY_ADD) radius with a curvature-driven width: add a Evaluate at Index node inside the zone that reads a per-point curvature float attribute (stored via the 'Spline Parameter' node + a Gradient Texture to simulate curvature variation), then average it per spline using Attribute Statistic to get a scalar per strand.",
        "Add a second Foreach Zone after the first to post-process the joined ribbon mesh — for example, iterating over each face island (one per strand, after baking) to set a custom FLOAT attribute 'strand_age' that drives a Shader Graph fade-out. This demonstrates that Foreach Zones can be chained in series, unlike Simulation Zones which cannot nest.",
        "Replace emission materials with a single Principled BSDF material driven by a 'strand_index' Named Attribute stored per vertex inside the zone. Use a Color Ramp in the shader to map the 0–7 integer to a spectrum. This is the correct pattern when you want shader-level colour blending between strands rather than hard material boundaries.",
        "Use the record.py script to render the rotating viewport animation, then screen-record the GN editor while scrubbing the Radius Scale slider. Combine both in a tutorial video edit — the animated ribbon for visual impact, the GN scrub for pedagogy.",
      ],
      troubleshooting: [
        {
          symptom: "Python error: 'NodeGroupInput' object has no attribute 'pair_with_output'",
          cause:
            "pair_with_output() is a method on zone INPUT nodes, not group input nodes. The script may have called it on the wrong node.",
          fix: "Confirm you are calling foreach_in.pair_with_output(foreach_out) where foreach_in is the GeometryNodeForeachGeometryElementInput node. The NodeGroupInput node (the modifier's group I/O) does not have this method.",
        },
        {
          symptom: "All ribbon strands have the same width — arc-length drive has no effect",
          cause:
            "The Spline Length node may be connected to the Main Geometry socket rather than the Element Geometry socket, so it evaluates the full multi-spline Curves object and returns a total length rather than per-strand lengths.",
          fix: "Inside the zone, the Resample Curve node must be wired to fe_in.outputs['Element Geometry'] (the single-strand sub-object). Then wire n_resample.outputs['Curve'] into n_spline_len.inputs['Curve']. If Spline Length is wired to Main Geometry the value is the same for all strands.",
        },
        {
          symptom: "The GN modifier shows no output geometry — viewport is empty",
          cause:
            "The Foreach zone is not paired — foreach_in.pair_with_output(foreach_out) was not called, so the zone has no interior and the Element Geometry socket is absent or disconnected.",
          fix: "Delete the two Foreach nodes, re-add them, call pair_with_output() before wiring anything else. The pairing must happen before linking — some Blender versions silently ignore links made before pairing.",
        },
        {
          symptom: "Material slots are assigned but all ribbons render as grey (default material)",
          cause:
            "Set Material Index uses the integer index to look up object.data.materials[], but the materials were appended to the object AFTER the modifier was added. Some Blender versions evaluate the modifier before the material slot changes propagate.",
          fix: "Call bpy.context.view_layer.update() after all material appends. The blueprint already does this; if running interactively, call it manually in the Text Editor console after paste-and-run.",
        },
      ],
      voiceMode: "aura",
    },
    {
      slug: SLUG,
      title: TITLE,
      date: "2026-07-26",
      kind: "tutorial",
      excerpt: LEDE,
      tags: [
        "blender",
        "geometry-nodes",
        "curves",
        "foreach-zone",
        "webxr",
        "poi",
        "light-painting",
        "procedural",
      ],
      Body,
    },
  );

export const entry = blenderTutorialGnForeachElementZoneCurvePerSplineAccumulationPoiRibbonWebxrEntry;

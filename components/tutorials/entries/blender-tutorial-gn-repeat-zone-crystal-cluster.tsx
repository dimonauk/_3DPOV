import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnRepeatZoneCrystalClusterBody() {
  return (
    <>
      <p>
        Blender&rsquo;s{" "}
        <strong>Repeat Zone</strong> is a pair of nodes &mdash; Repeat Input
        and Repeat Output &mdash; that run the sub-graph between them N times.
        On each iteration the loop index is available as an integer output, and
        any data you declare as a <em>body channel</em> flows in from the
        previous iteration and back out to the next. This is categorically
        different from{" "}
        <Link href="/tutorials/blender-tutorial-gn-instance-on-points" className={lk}>
          Instance on Points
        </Link>
        , which scatters one piece of geometry identically across many locations.
        With Repeat Zone you can change the geometry, position, scale, or
        topology on every single pass &mdash; making it the right tool for any
        procedural structure where things genuinely vary from one unit to the
        next.
      </p>

      <p>
        This tutorial builds a twelve-shard crystal cluster arranged on a{" "}
        <strong>Fermat spiral</strong>. The mathematics are simple: the radius of
        each shard is proportional to{" "}
        <code>√(i / N)</code> and its angle is{" "}
        <code>i × 2.399963 rad</code> (the golden angle). The golden angle is
        the most irrational angle that exists &mdash; it cannot be expressed as
        a ratio of small integers &mdash; so no two shards ever land on the same
        radial spoke from the centre. The result is the same packing geometry
        that sunflower heads and pine cones use to pack seeds as densely as
        possible. In a crystal cluster it gives a natural, organic distribution
        without any noise or randomness: the pattern is fully deterministic from
        the two parameters <em>count</em> and <em>radius</em>.
      </p>

      <p>
        The design choice in this blueprint is <em>stateless</em>: the Repeat
        Zone carries only one body channel (the accumulated crystal geometry).
        Position and scale are computed fresh each iteration from the loop index.
        A stateful alternative would carry the current angle and radius as Float
        body channels and increment them each pass &mdash; mathematically
        equivalent but harder to reason about and impossible to preview at an
        arbitrary frame without running the full loop from iteration zero. The
        stateless approach also means the node tree degrades gracefully at count
        = 1: the single crystal lands at the centre with full base scale, which
        is the correct artistic result. See the{" "}
        <Link href="/tutorials/blender-tutorial-animation-drivers-parametric-shader" className={lk}>
          animation drivers tutorial
        </Link>{" "}
        for the companion technique of driving shader parameters from a single
        animated custom property &mdash; the two combine cleanly: one driver can
        animate Crystal Count from 0 to 12 over a scene timeline.
      </p>

      <p>
        For the material, the blueprint uses Principled BSDF with{" "}
        <code>Transmission Weight = 0.85</code> and{" "}
        <code>surface_render_method = &apos;FORWARD&apos;</code>, matching the
        approach from the{" "}
        <Link href="/tutorials/blender-tutorial-faceted-gem-webxr" className={lk}>
          faceted gem WebXR tutorial
        </Link>
        . The shading difference from gems is the{" "}
        <code>SetShadeSmooth = False</code> node after the Repeat Output. Each
        cone face gets a flat normal, giving each facet a distinct luminance
        response under directional light. This is what separates a{" "}
        <em>crystal</em> read from a <em>glass</em> read: smooth shading hides
        the topology, flat shading advertises it. The{" "}
        <Link href="/tutorials/blender-tutorial-gn-mesh-boolean-hard-surface" className={lk}>
          GN Mesh Boolean tutorial
        </Link>{" "}
        uses the same post-boolean SetShadeSmooth for the same reason &mdash;
        both cases produce geometry where the shade-smooth state of incoming
        faces is unreliable, so an explicit override is always necessary.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-repeat-zone-crystal-cluster",
  title: "GN Repeat Zone — Procedural Crystal Cluster (Blender 5.1)",
  date: "2026-05-24",
  kind: "tutorial",
  excerpt:
    "Blender's Repeat Zone runs a sub-graph N times, accumulating geometry through a body channel. Build a twelve-shard crystal cluster arranged on a Fermat spiral using a single node group, no scatter nodes required.",
  Body: GnRepeatZoneCrystalClusterBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Comfortable building GN trees via bpy.data (no bpy.ops inside the tree).",
      "Completed the GN Instance on Points tutorial or understand what a multi-input socket is.",
      "Blender 5.1 installed; able to run blueprint.py headlessly with --background.",
      "Know what a Fermat spiral is, or willing to trust the maths and tweak the golden angle constant to see what breaks.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "Repeat Zone requires Blender 4.0 or later. EEVEE Next is used for the record.py render step.",
      },
    ],
    steps: [
      {
        title: "Understand the Repeat Zone's socket topology before touching Python",
        body:
          "The Repeat Zone is two nodes: Repeat Input and Repeat Output. After calling pair_with_output() they are locked together. The Repeat Input node has:\n\n  inputs[0] = 'Iterations'  (Int; how many passes to run)\n  outputs[0] = 'Iteration'  (Int; current pass index, 0-based)\n  outputs[1..N] = body channel outputs (data from the PREVIOUS iteration)\n\nThe Repeat Output node has:\n  inputs[0..N-1] = body channel inputs (data to pass to the NEXT iteration)\n\nBody channels are added via:\n  repeat_in.repeat_items.new('GEOMETRY', 'Accumulated')\n\nThe type enum is uppercase: 'GEOMETRY', 'FLOAT', 'INT', 'VECTOR'. Do NOT use 'NodeSocketGeometry' here — that is the interface socket API, a different system entirely. The body channel name can be anything; it determines the socket label in the node header.\n\nAt iteration 0, the body channel carries whatever Blender's default empty geometry is (effectively null). At iteration 1 it carries whatever the repeat_out received at iteration 0. This is the accumulation: each pass receives the previous pass's output and adds to it.",
      },
      {
        title: "Declare tree I/O sockets with tree.interface.new_socket()",
        body:
          "Create the node group and declare all public sliders before adding any inner nodes:\n\n  tree = bpy.data.node_groups.new(type='GeometryNodeTree', name='GNCrystalCluster')\n\n  tree.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')\n  tree.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')\n\n  s = tree.interface.new_socket('Crystal Count', in_out='INPUT', socket_type='NodeSocketInt')\n  s.default_value = 12\n  s.min_value = 1\n  s.max_value = 64\n\ntree.interface.new_socket() is the Blender 4.0+ API. tree.inputs.new() was silently removed before 5.x. Declaration order determines the mod['Input_N'] index: Geometry OUTPUT is treated as Input_1 internally, Geometry INPUT as Input_0 (auto-wired), and the first user socket (Crystal Count) becomes Input_2. Keep this mapping in a comment — the indices are not visible in the UI.\n\nThe golden angle constant (2.399963 rad) is intentionally NOT exposed as a socket. It is a mathematical fact, not an artistic parameter. Exposing it would imply the user should change it, which would only degrade the distribution quality.",
      },
      {
        title: "Create and pair the Repeat Zone nodes, then add body channels",
        body:
          "The sequence matters:\n\n  repeat_in  = nodes.new('GeometryNodeRepeatInput')\n  repeat_out = nodes.new('GeometryNodeRepeatOutput')\n  repeat_in.pair_with_output(repeat_out)         # zone established here\n  repeat_in.repeat_items.new('GEOMETRY', 'Accumulated')  # body channel added after\n\npair_with_output() must be called before adding body channels. Before pairing the two nodes exist independently and repeat_items is empty. After pairing, Blender creates the zone boundary and adding a body channel simultaneously updates both nodes: Repeat Input gains an output socket ('Accumulated'), Repeat Output gains a matching input socket.\n\nThen wire the Iterations count:\n\n  links.new(n_in.outputs['Crystal Count'], repeat_in.inputs['Iterations'])\n\nThe Iterations socket is at repeat_in.inputs[0]. It accepts Int or Float — Blender rounds to nearest integer internally.",
      },
      {
        title: "Compute per-iteration position using only the loop index",
        body:
          "All position mathematics are stateless — computed entirely from repeat_in.outputs['Iteration'] each pass:\n\n  # t: normalised position in spiral, 0 (centre) → 1 (outermost)\n  n_sub1  = Math(SUBTRACT)  # Crystal Count − 1\n  n_div_t = Math(DIVIDE)    # Iteration ÷ (Count − 1)\n\n  # angle: golden angle accumulation without carrying state\n  n_angle = Math(MULTIPLY)  # Iteration × 2.399963\n\n  # Fermat spiral: equal-area spacing between rings\n  n_sqrt   = Math(SQRT)     # √t\n  n_radius = Math(MULTIPLY) # √t × Spiral Radius\n\n  # Cartesian conversion\n  n_cos = Math(COSINE)      # cos(angle)\n  n_sin = Math(SINE)        # sin(angle)\n  n_x   = Math(MULTIPLY)   # cos × radius\n  n_y   = Math(MULTIPLY)   # sin × radius\n\nThe Fermat spiral formula (radius ∝ √t) spaces the rings so each annular band contains the same number of points — uniform area density. A naive linear radius (radius ∝ t) crowds the outer ring and wastes the centre.\n\nFor count = 1, t = 0 ÷ 0. Blender's Math(DIVIDE) returns 0 on zero-division (it does not throw an exception), so the single crystal lands at t=0, centre position, full base scale. This is the correct graceful degradation.",
      },
      {
        title: "Scale each shard with Map Range, then build the cone",
        body:
          "Use ShaderNodeMapRange to linearly interpolate from Base Scale (at t=0) to Tip Scale (at t=1):\n\n  n_map = nodes.new('ShaderNodeMapRange')\n  n_map.inputs['From Min'].default_value = 0.0\n  n_map.inputs['From Max'].default_value = 1.0\n  links.new(n_div_t.outputs['Value'],    n_map.inputs['Value'])\n  links.new(n_in.outputs['Base Scale'],  n_map.inputs['To Min'])\n  links.new(n_in.outputs['Tip Scale'],   n_map.inputs['To Max'])\n\nShaderNodeMapRange works in Geometry Nodes trees — it shares the same node implementation as in the Shader Editor. Access result at n_map.outputs['Result'].\n\nThe cone:\n  n_cone = nodes.new('GeometryNodeMeshCone')\n  n_cone.fill_type = 'NGON'               # single polygon per end cap\n  n_cone.inputs['Radius Top'].default_value = 0.001   # nearly-sharp tip\n  links.new(n_in.outputs['Cone Vertices'],  n_cone.inputs['Vertices'])\n  links.new(n_map.outputs['Result'],        n_cone.inputs['Radius Bottom'])\n  links.new(n_depth.outputs['Value'],       n_cone.inputs['Depth'])\n\nfill_type='NGON' creates a single polygon per cap face. TRIFAN creates a triangulated fan from a centre vertex — more faces, same visual result, no reason to use it. fill_type='NONE' leaves open caps: the solid has boundary edges and is not watertight. For a boolean cutter that matters critically; for a crystal display mesh it just means the underside is invisible, which is acceptable but messy.",
      },
      {
        title: "Accumulate with Join Geometry and close the loop",
        body:
          "The accumulation pattern:\n\n  n_join = nodes.new('GeometryNodeJoinGeometry')\n\n  # Multi-input socket — call links.new() twice to the same target socket\n  links.new(repeat_in.outputs['Accumulated'],  n_join.inputs['Geometry'])\n  links.new(n_transform.outputs['Geometry'],   n_join.inputs['Geometry'])\n\n  # Close the loop: feed joined result back to the Repeat Output body channel\n  links.new(n_join.outputs['Geometry'],        repeat_out.inputs['Accumulated'])\n\nJoin Geometry has a single multi-input 'Geometry' socket. The bpy API correctly appends a second link to it when you call links.new() a second time with the same socket — no index needed, no special API. The resulting mesh contains all geometry from all previous iterations plus the new shard.\n\nAfter the Repeat Output, add Set Shade Smooth:\n  n_smooth = nodes.new('GeometryNodeSetShadeSmooth')\n  n_smooth.domain = 'FACE'\n  n_smooth.inputs['Shade Smooth'].default_value = False\n\nFlat shading gives each cone face a uniform normal, making the facets legible as individual crystal planes. Without this node, the shade-smooth state of the cone faces is whatever Blender's cone primitive defaults to — which varies by Blender version and is not reliable.",
      },
      {
        title: "Export GLB with export_apply=True",
        body:
          "Attach the modifier and set initial values:\n\n  mod = obj.modifiers.new(name='HoloflowGNCrystal', type='NODES')\n  mod.node_group = tree\n  mod['Input_2'] = 12   # Crystal Count\n  mod['Input_3'] = 0.8  # Spiral Radius\n  mod['Input_4'] = 0.18 # Base Scale\n  mod['Input_5'] = 0.06 # Tip Scale\n  mod['Input_6'] = 8    # Cone Vertices\n  mod['Input_7'] = 2.5  # Base Height\n\nExport:\n  bpy.ops.export_scene.gltf(\n      filepath=str(GLB_OUT),\n      export_format='GLB',\n      use_selection=True,\n      export_apply=True,\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_normals=True,\n      export_materials='EXPORT',\n      export_image_format='WEBP',\n  )\n\nexport_apply=True triggers full depsgraph evaluation: Blender runs the Repeat Zone the configured number of times, collects the resulting mesh, and serialises that to the GLB. Without this flag the base mesh (an empty mesh with no vertices) is what the exporter writes. The GLB will load successfully in Three.js but contain an invisible object with zero faces.\n\nVerify in Don McCurdy's glTF Viewer: you should see twelve cone shards in a spiral. In the Scene Graph inspector confirm Mesh is a single mesh entry (not twelve separate objects) — Join Geometry collapsed them all.",
      },
    ],
    finalResult:
      "A GLB containing a single mesh of twelve faceted crystal shards arranged in a Fermat spiral, Draco-compressed, flat-shaded, with a cobalt-blue transmissive material. The source .blend retains the live GN modifier with all six sliders. Dragging Crystal Count from 1 to 12 adds shards one at a time in Fermat-spiral order; dragging Spiral Radius contracts or expands the cluster without changing the angular distribution.",
    variations: [
      "Hexagonal shards: set Cone Vertices = 6. Six-sided prisms read as quartz columns rather than tapered spikes. Combine with Radius Top = Radius Bottom (a cylinder, not a cone) for a more geometric, mineralogical cluster.",
      "Growth animation: keyframe Crystal Count from 1 to 12 over 60 frames with CONSTANT interpolation (no fractional shard counts). Set up a camera orbit simultaneously for a slow reveal. record.py demonstrates this exact setup — run it after blueprint.py.",
      "Colour gradient: add a vertex colour attribute inside the Repeat Zone using a Store Named Attribute node. Wire t (the normalised position) to the Red channel so outer shards are darker than the centre ones. Export with export_colors=True and wire COLOR_0 to a vertex-colour shader in Three.js for per-shard tinting without UV maps.",
    ],
    troubleshooting: [
      {
        symptom: "GLB exports as an invisible mesh with zero faces",
        cause: "export_apply was not set to True — the base mesh (empty) was serialised instead of the GN-evaluated result.",
        fix: "Add export_apply=True to the bpy.ops.export_scene.gltf() call. Also verify the modifier is attached and mod.node_group is not None before exporting.",
      },
      {
        symptom: "repeat_in.repeat_items.new() raises AttributeError",
        cause: "pair_with_output() was not called before adding body channels, or the node type string is wrong.",
        fix: "Call repeat_in.pair_with_output(repeat_out) first. Then repeat_in.repeat_items.new('GEOMETRY', 'Accumulated'). The type string must be uppercase 'GEOMETRY', not 'NodeSocketGeometry'.",
      },
      {
        symptom: "All twelve crystals overlap at the origin — no spiral spread",
        cause: "The Combine XYZ vector was wired to the Rotation socket of Transform Geometry instead of Translation, or the math links are broken.",
        fix: "Check Transform Geometry: Translation should receive the Combine XYZ vector. Rotation stays at default (0, 0, 0). In the node editor, select all and use N-panel > Item to inspect individual socket connections.",
      },
      {
        symptom: "Crystal Count slider snaps to 1 when set above 1 at runtime",
        cause: "mod['Input_2'] is being set to a float (1.0) rather than an int (1). The GN interface expects Int type for Int sockets.",
        fix: "Set mod['Input_2'] = int(value). Python automatically coerces to int when the socket type is Int, but explicit casting is safer when the value comes from a calculation.",
      },
    ],
  },
  base,
);

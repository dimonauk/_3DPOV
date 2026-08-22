import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A parabola is not the shape a cable makes.  It is the shape an arch
        makes when loaded uniformly along its horizontal span, and it is only
        a reasonable approximation for a hanging cable when the sag-to-span
        ratio is below about five per cent.  The true shape — the{" "}
        <strong>catenary</strong> — is described by the hyperbolic cosine:{" "}
        <code>y&nbsp;=&nbsp;a·cosh(x/a)</code>, where{" "}
        <code>a</code> is the ratio of horizontal tension to the cable&rsquo;s
        linear weight.  At WebXR prop scales, where cables often sag
        10&ndash;40 per cent of their span, the parabola diverges visibly from
        the catenary, and the eye catches it.  Blender 5.1&rsquo;s Geometry
        Nodes Math node includes a native{" "}
        <code>COSH</code> operation, so the full catenary formula can be
        computed inside the node graph, driven by a single{" "}
        <em>Sag Parameter</em> (<code>a</code>) group input without any bake or
        approximation.
      </p>
      <p>
        The construction uses{" "}
        <code>CurvePrimitiveLine</code> to seed a horizontal baseline, then{" "}
        <code>ResampleCurve</code> to distribute 32 evenly-spaced sample points
        along it.  A <code>SplineParameter.Factor</code>{" "}
        chain converts each point&rsquo;s t&nbsp;∈&nbsp;[0,&nbsp;1] into a
        signed x-coordinate centred at zero, feeds it into the catenary formula{" "}
        <code>a·(cosh(x/a)&nbsp;&minus;&nbsp;cosh(S/(2a)))</code>, and applies
        the result as a Z-offset via <code>SetPosition</code>.  The{" "}
        <code>&minus;cosh(S/(2a))</code> term is the crucial anchor: it ensures
        endpoints stay at <code>Z&nbsp;=&nbsp;0</code> while the midpoint droops
        to the correct depth — without it, all points shift downward uniformly
        and the curve is a catenary in the wrong frame of reference.  Compare
        the two-stage offset logic with the single-pass offset approach used in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-set-position-noise-displacement"
          className={lk}
        >
          Set Position Noise Displacement
        </Link>
        .  After the Z-offset a parabolic taper
        envelope{" "}
        (<code>4t(1&minus;t)</code>) scales the curve radius, making each cable
        thinner at its endpoints than at its belly — the same radius-as-field
        technique covered in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-spline-parameter-vine-tendril"
          className={lk}
        >
          Spline Parameter Vine Tendril
        </Link>
        .  Finally <code>CurveToMesh</code> sweeps a six-sided profile
        (hexagonal cross-section) to produce a low-poly tube that Draco compresses
        efficiently at level&nbsp;6 without visible quantisation artefacts.
      </p>
      <p>
        Five instances are arrayed by spacing individual cable objects along the
        Y axis, each sharing the same <code>CatenaryCable</code> node group —
        so adjusting <em>Sag Parameter</em> on the group input changes all five
        cables simultaneously.  The exported GLB uses the studio convention
        (Y-up, snake_case root name{" "}
        <code>cable_array</code>, Draco&nbsp;6) and imports directly into a
        Three.js scene as a static mesh ready for{" "}
        <code>@react-three/fiber</code>.  For animated cables — power-line swaying
        or cable vibration — animate{" "}
        <code>mod[&quot;Sag Parameter&quot;]</code> per frame via{" "}
        <code>modifier.keyframe_insert</code>; the technique is described
        exactly in{" "}
        <Link
          href="/tutorials/blender-tutorial-python-app-timers-deferred-live-reload-frame-stepper"
          className={lk}
        >
          Python bpy.app.timers — Deferred Live Reload
        </Link>
        .  For
        thicker, faceted variants or neon-glow variants of the same cable
        profile, cross-reference{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-fillet-curve-neon-sign"
          className={lk}
        >
          Fillet Curve — Neon Sign
        </Link>{" "}
        (which uses <code>FilletCurve</code> before the sweep to round corner
        joints) and{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-offset-point-in-curve-chain-links"
          className={lk}
        >
          Offset Point in Curve — Chain Links
        </Link>{" "}
        (which replaces the swept tube with periodic instanced link geometry).
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-catenary-curve-cable-array-webxr",
  title:
    "GN Catenary Curve — Mathematically Exact Hanging Cable Array for WebXR Interior Scenes (Blender 5.1)",
  date: "2026-07-01",
  kind: "tutorial",
  excerpt:
    "Builds a physically exact catenary curve (y = a·cosh(x/a) − a·cosh(S/2a)) inside a Geometry Nodes group using Blender 5.1's native COSH Math node. A single 'Sag Parameter' group input drives shape, taper, and animation. Five parallel cables are arrayed along Y and exported as GLB (Draco 6, Y-up) for WebXR. Covers the two-cosh anchor trick for correct endpoint pinning, parabolic radius taper via 4t(1−t), and hexagonal CurveToMesh profiling.",
  Body,
  related: [
    {
      href: "/tutorials/blender-tutorial-gn-curve-to-mesh",
      label: "Tutorial — GN Curve to Mesh",
      note: "The sweep operation used here — CurveToMesh with a circle profile — is detailed in this foundational tutorial along with fill caps, profile alignment, and UV generation.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-spline-parameter-vine-tendril",
      label: "Tutorial — Spline Parameter Vine Tendril",
      note: "Uses SplineParameter.Factor as a radius field to taper a swept curve — the exact technique applied here for the parabolic cable taper.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-offset-point-in-curve-chain-links",
      label: "Tutorial — Offset Point in Curve: Chain Links",
      note: "Replaces the continuous swept tube with periodic instanced link geometry on the same curve backbone — a direct visual alternative to the cable array produced here.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-fillet-curve-neon-sign",
      label: "Tutorial — Fillet Curve: Neon Sign",
      note: "Applies FilletCurve before CurveToMesh to round corner joints — useful when extending the catenary approach to conduit runs with sharp bends at junction boxes.",
    },
    {
      href: "/tutorials/blender-tutorial-modifier-wireframe-edge-tube-neon-skeleton",
      label: "Tutorial — Modifier Wireframe: Edge Tube Neon Skeleton",
      note: "Alternative tube-from-edge technique using the Wireframe modifier rather than GN. Compare the workflow for mesh-source cable runs versus curve-source catenary cables.",
    },
    {
      href: "https://github.com/njanakiev/blender-scripting",
      label: "njanakiev/blender-scripting (MIT — Nicolas Janakiev)",
      note: "Reference headless bpy patterns for node group construction: socket identifier lookup via ng.interface.items_tree, modifier input animation via keyframe_insert. Related: blender-jupyter (MIT).",
    },
    {
      href: "https://github.com/BrendanParmer/NodeToPython",
      label: "BrendanParmer/NodeToPython (MIT — Brendan Parmer)",
      note: "Converts any Geometry Nodes tree to Python — used to cross-check CurvePrimitiveLine, ResampleCurve, and SetCurveRadius node type identifiers against Blender 5.1. Related tests: https://github.com/BrendanParmer/NodeToPython/tree/main/tests",
    },
  ],
  sources: [
    {
      href: "https://github.com/njanakiev/blender-scripting",
      label: "njanakiev/blender-scripting (MIT — Nicolas Janakiev)",
      note: "Headless bpy patterns: ng.interface.new_socket for group I/O, node.location for layout, modifier keyframe_insert for GN socket animation. Sibling: https://github.com/njanakiev/blender-jupyter (MIT)",
    },
    {
      href: "https://github.com/BrendanParmer/NodeToPython",
      label: "BrendanParmer/NodeToPython (MIT — Brendan Parmer)",
      note: "GN→Python converter; verified GeometryNodeCurvePrimitiveLine, GeometryNodeResampleCurve, GeometryNodeSetCurveRadius, GeometryNodeCurveToMesh node type strings against live Blender 5.1 registry. Related tests: https://github.com/BrendanParmer/NodeToPython/tree/main/tests",
    },
  ],
};

const entry: Entry = buildInstructable(
  {
    time: "45 minutes",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Comfortable adding and connecting nodes in the Geometry Nodes editor.",
      "Know what SplineParameter.Factor returns (t ∈ [0, 1] along curve length).",
      "Read the GN Curve to Mesh tutorial first — this tutorial builds on that sweep pattern.",
      "Blender 5.1 installed.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "The Math node's COSH operation is available since Blender 4.0 and stable in 5.1. CurvePrimitiveLine, ResampleCurve, SetCurveRadius, and CurveToMesh are unchanged since Blender 4.1.",
      },
    ],
    steps: [
      {
        title: "Understand the catenary equation and the two-cosh anchor",
        body: "The catenary of a cable hanging between two equal-height endpoints:\n  z(x) = a · (cosh(x/a) − cosh(S/(2a)))\n  x ∈ [−S/2, +S/2]   (x=0 at midpoint)\n  a > 0               (catenary parameter = H/w, horizontal tension / linear weight)\n\nAt the midpoint (x=0):  z(0) = a·(1 − cosh(S/2a))  < 0  — the sag trough.\nAt the endpoints (x=±S/2): z(±S/2) = a·(cosh(S/2a) − cosh(S/2a)) = 0  ✓\n\nWHY subtract cosh(S/(2a)):\n  Without the subtraction, z(x) = a·(cosh(x/a) − 1):\n    z(0)    = 0     (midpoint stays at Z=0)\n    z(±S/2) = a·(cosh(S/2a) − 1)  > 0  — endpoints lift UP, cable inverted!\n  The subtraction translates the frame so endpoints are pinned at Z=0 and\n  the midpoint hangs below.  This term is constant for given a and S, so in\n  the node graph it is a second COSH evaluation on the constant S/(2a).\n\nSensitivity of 'a' to sag:\n  a → ∞ (very large): cosh(x/a) ≈ 1 + x²/(2a²) → z ≈ x²/(2a) − S²/(8a)\n    This is a parabola! Shows parabola is the taut-cable limit of catenary.\n  a = 0.25, S = 4.0: sag ≈ 1.85 m (very droopy, sag/span ≈ 0.46)\n  a = 1.20, S = 4.0: sag ≈ 0.68 m (gentle droop, sag/span ≈ 0.17)\n  a = 4.00, S = 4.0: sag ≈ 0.06 m (near-taut, sag/span ≈ 0.015)\n\nCompute sag in Python before building nodes:\n  import math\n  sag = SAG_PARAM * (math.cosh(SPAN / (2 * SAG_PARAM)) - 1)\n  print(f'Sag: {sag:.3f} m ({sag/SPAN*100:.1f}% of span)')",
      },
      {
        title: "Create the Geometry Nodes group and expose group inputs",
        body: "import bpy\n\nng = bpy.data.node_groups.new('CatenaryCable', 'GeometryNodeTree')\nng.is_modifier = True   # required for use as an object modifier\n\niface = ng.interface\niface.new_socket('Geometry',      in_out='OUTPUT', socket_type='NodeSocketGeometry')\niface.new_socket('Geometry',      in_out='INPUT',  socket_type='NodeSocketGeometry')\n\nsag_sock = iface.new_socket('Sag Parameter', in_out='INPUT', socket_type='NodeSocketFloat')\nsag_sock.default_value = 1.2\nsag_sock.min_value = 0.05  # prevents cosh(x/0) division by zero\n\nspan_sock = iface.new_socket('Span', in_out='INPUT', socket_type='NodeSocketFloat')\nspan_sock.default_value = 4.0\nspan_sock.min_value = 0.1\n\ngin  = ng.nodes.new('NodeGroupInput')\ngout = ng.nodes.new('NodeGroupOutput')\n\n# WHY expose both Sag Parameter and Span as group inputs:\n#   Sag Parameter changes droop depth continuously — ideal for animation.\n#   Span lets one node group serve cables of different lengths in the same scene\n#   without duplicating the group or baking a new cosh(S/2a) constant.\n#   Both affect the second COSH (the anchor term), so both must be live inputs.",
      },
      {
        title: "Seed the baseline and convert t to signed x",
        body: "nodes = ng.nodes\nlinks = ng.links\n\n# Horizontal line: start=(−S/2, 0, 0), end=(+S/2, 0, 0)\n# WHY CurvePrimitiveLine not a Grid: a single 2-point spline samples cleanly;\n# a grid would create a mesh that ResampleCurve cannot accept directly.\nline = nodes.new('GeometryNodeCurvePrimitiveLine')\nline.inputs['Start'].default_value = (-SPAN/2, 0.0, 0.0)\nline.inputs['End'].default_value   = ( SPAN/2, 0.0, 0.0)\n\nresamp = nodes.new('GeometryNodeResampleCurve')\nresamp.mode = 'COUNT'\nresamp.inputs['Count'].default_value = RESAMPLE_PTS\nlinks.new(line.outputs['Curve'], resamp.inputs['Curve'])\n\n# SplineParameter.Factor: t ∈ [0, 1], 0 at Start, 1 at End\n# Convert to x ∈ [−Span/2, +Span/2]:\n#   x = (t − 0.5) × Span\nspm  = nodes.new('GeometryNodeSplineParameter')\n\nmsub = nodes.new('ShaderNodeMath')\nmsub.operation = 'SUBTRACT'\nmsub.inputs[1].default_value = 0.5     # t − 0.5\nlinks.new(spm.outputs['Factor'], msub.inputs[0])\n\nmspan = nodes.new('ShaderNodeMath')\nmspan.operation = 'MULTIPLY'           # (t − 0.5) × Span\nlinks.new(msub.outputs['Value'],  mspan.inputs[0])\nlinks.new(gin.outputs['Span'],    mspan.inputs[1])\n\n# WHY not InputPosition.X directly for x:\n#   After ResampleCurve the Position.X of each point IS x, so you could use it.\n#   However, using SplineParameter.Factor keeps the calculation independent of\n#   initial position — useful if you later instance the curve elsewhere.",
      },
      {
        title: "Build the catenary Z-offset: cosh(x/a) − cosh(S/(2a))",
        body: "# --- cosh(x/a) chain ---\nmdiv_xa  = nodes.new('ShaderNodeMath'); mdiv_xa.operation  = 'DIVIDE'\nlinks.new(mspan.outputs['Value'],        mdiv_xa.inputs[0])   # x\nlinks.new(gin.outputs['Sag Parameter'],  mdiv_xa.inputs[1])   # a\n\nmcosh_xa = nodes.new('ShaderNodeMath'); mcosh_xa.operation = 'COSH'\nlinks.new(mdiv_xa.outputs['Value'], mcosh_xa.inputs[0])       # cosh(x/a)\n\n# --- cosh(S/(2a)) — the anchor constant ---\n# Computed from live group inputs so it updates when either changes.\nmhalf    = nodes.new('ShaderNodeMath'); mhalf.operation    = 'MULTIPLY'\nmhalf.inputs[1].default_value = 0.5\nlinks.new(gin.outputs['Span'], mhalf.inputs[0])               # S/2\n\nmdiv_hsa = nodes.new('ShaderNodeMath'); mdiv_hsa.operation = 'DIVIDE'\nlinks.new(mhalf.outputs['Value'],        mdiv_hsa.inputs[0])  # S/2\nlinks.new(gin.outputs['Sag Parameter'],  mdiv_hsa.inputs[1])  # a\n\nmcosh_hsa = nodes.new('ShaderNodeMath'); mcosh_hsa.operation = 'COSH'\nlinks.new(mdiv_hsa.outputs['Value'], mcosh_hsa.inputs[0])     # cosh(S/2a)\n\n# --- z_off = a · (cosh(x/a) − cosh(S/2a)) ---\nmsub2 = nodes.new('ShaderNodeMath'); msub2.operation = 'SUBTRACT'\nlinks.new(mcosh_xa.outputs['Value'],  msub2.inputs[0])\nlinks.new(mcosh_hsa.outputs['Value'], msub2.inputs[1])\n\nmmul_a = nodes.new('ShaderNodeMath'); mmul_a.operation = 'MULTIPLY'\nlinks.new(msub2.outputs['Value'],         mmul_a.inputs[0])\nlinks.new(gin.outputs['Sag Parameter'],   mmul_a.inputs[1])   # × a\n# Result is negative at centre, zero at endpoints — correct droop direction.\n\ncxyz = nodes.new('ShaderNodeCombineXYZ')\ncxyz.inputs['X'].default_value = 0.0\ncxyz.inputs['Y'].default_value = 0.0\nlinks.new(mmul_a.outputs['Value'], cxyz.inputs['Z'])\n\nsetpos = nodes.new('GeometryNodeSetPosition')\nlinks.new(resamp.outputs['Curve'],  setpos.inputs['Geometry'])\nlinks.new(cxyz.outputs['Vector'],   setpos.inputs['Offset'])",
      },
      {
        title: "Add parabolic radius taper and sweep the profile",
        body: "# Taper: 4t(1−t) peaks at 1.0 when t=0.5, falls to 0 at both endpoints.\n# Full radius: r(t) = PROFILE_R · (TAPER_TIP + (1 − TAPER_TIP) · 4t(1−t))\n# WHY parabolic not linear: linear taper makes endpoints look arbitrarily cut\n# rather than pinched; 4t(1−t) gives a natural cable-belly fullness.\n\nm4t  = nodes.new('ShaderNodeMath'); m4t.operation  = 'MULTIPLY'\nm4t.inputs[1].default_value = 4.0\nlinks.new(spm.outputs['Factor'], m4t.inputs[0])              # 4t\n\nm1mt = nodes.new('ShaderNodeMath'); m1mt.operation = 'SUBTRACT'\nm1mt.inputs[0].default_value = 1.0\nlinks.new(spm.outputs['Factor'], m1mt.inputs[1])             # 1 − t\n\nmtenv = nodes.new('ShaderNodeMath'); mtenv.operation = 'MULTIPLY'\nlinks.new(m4t.outputs['Value'],  mtenv.inputs[0])\nlinks.new(m1mt.outputs['Value'], mtenv.inputs[1])            # 4t(1−t)\n\nmscl = nodes.new('ShaderNodeMath'); mscl.operation = 'MULTIPLY'\nmscl.inputs[1].default_value = 1.0 - TAPER_TIP             # scale the range\nlinks.new(mtenv.outputs['Value'], mscl.inputs[0])\n\nmadd = nodes.new('ShaderNodeMath'); madd.operation = 'ADD'\nmadd.inputs[0].default_value = TAPER_TIP                    # add tip floor\nlinks.new(mscl.outputs['Value'], madd.inputs[1])\n\nmrad = nodes.new('ShaderNodeMath'); mrad.operation = 'MULTIPLY'\nmrad.inputs[1].default_value = PROFILE_R\nlinks.new(madd.outputs['Value'], mrad.inputs[0])\n\nsetrad = nodes.new('GeometryNodeSetCurveRadius')\nlinks.new(setpos.outputs['Curve'],  setrad.inputs['Curve'])\nlinks.new(mrad.outputs['Value'],    setrad.inputs['Radius'])\n\n# Profile circle: Radius=1.0 because the actual radius is driven by SetCurveRadius.\n# Resolution=6 gives a hexagonal cross-section: good silhouette, Draco-efficient.\ncircle = nodes.new('GeometryNodeCurvePrimitiveCircle')\ncircle.mode = 'RADIUS'\ncircle.inputs['Resolution'].default_value = PROFILE_RES\ncircle.inputs['Radius'].default_value     = 1.0\n\n# WHY Fill Caps=False: open-ended tubes read as continuous cable;\n# capped ends look like severed pipes and add unnecessary triangles at export.\nc2m = nodes.new('GeometryNodeCurveToMesh')\nc2m.inputs['Fill Caps'].default_value = False\nlinks.new(setrad.outputs['Curve'],  c2m.inputs['Curve'])\nlinks.new(circle.outputs['Curve'],  c2m.inputs['Profile Curve'])\nlinks.new(c2m.outputs['Mesh'],      gout.inputs['Geometry'])",
      },
      {
        title: "Array five cables and export GLB",
        body: "# Each cable is a separate object sharing the same node group.\n# WHY not instance on points: instancing would export as one InstancedMesh\n# in Three.js — fine for identical objects. Here each cable could later receive\n# independent Sag values, so separate objects with shared group are preferred.\n\nmat = bpy.data.materials.new('cable_jacket')\nmat.use_nodes = True\nbsdf = mat.node_tree.nodes['Principled BSDF']\nbsdf.inputs['Base Color'].default_value = (0.05, 0.05, 0.12, 1.0)  # dark navy\nbsdf.inputs['Metallic'].default_value   = 0.8\nbsdf.inputs['Roughness'].default_value  = 0.35\n\nfor i in range(CABLE_COUNT):\n    y = (i - (CABLE_COUNT - 1) / 2.0) * CABLE_SPACING\n    me  = bpy.data.meshes.new(f'cable_{i:02d}_base')\n    obj = bpy.data.objects.new(f'cable_{i:02d}', me)\n    bpy.context.scene.collection.objects.link(obj)\n    obj.location = (0.0, y, 0.0)\n    mod = obj.modifiers.new('CatenaryCable', 'NODES')\n    mod.node_group = ng\n    obj.data.materials.append(mat)\n\n# Apply modifiers before export — GLB cannot carry live GN modifiers.\n# export_apply=True in gltf operator does this implicitly; per-object apply\n# is needed here only if you want to inspect the evaluated mesh in Blender.\nbpy.ops.export_scene.gltf(\n    filepath=bpy.path.abspath(OUT_GLB),\n    export_format='GLB',\n    use_selection=False,\n    export_apply=True,      # bakes all modifier stacks into vertices\n    export_yup=True,        # studio convention: +Y up at export\n    export_draco_mesh_compression_enable=True,\n    export_draco_mesh_compression_level=6,\n    export_normals=True,\n    export_materials='EXPORT',\n)\n\n# Three.js import:\n# import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'\n# import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'\n# const draco = new DRACOLoader()\n# draco.setDecoderPath('/draco/')\n# const loader = new GLTFLoader()\n# loader.setDRACOLoader(draco)\n# loader.load('cable_array.glb', gltf => scene.add(gltf.scene))\n#\n# All five cable meshes appear as children of gltf.scene with names\n# cable_00 … cable_04. Apply MeshStandardMaterial per child for colour.",
      },
    ],
    finalResult:
      "A Blender scene with five physically exact catenary cables sharing a single parametric Geometry Nodes group. The 'Sag Parameter' input continuously controls droop depth. The exported cable_array.glb (Draco 6, Y-up) loads in Three.js or @react-three/fiber and renders as five dark-navy hexagonal-profile cables with natural endpoint taper.",
    variations: [
      "Unequal endpoint heights: offset the End point of CurvePrimitiveLine by a non-zero Z value to model a cable strung between anchor points at different elevations. The catenary formula still applies; the sag minimum point shifts horizontally toward the lower anchor. Compute the horizontal position of the minimum via x_min = a·arctanh((z2−z1)/(a·sinh(S/a))) where z1, z2 are endpoint heights.",
      "Twisted cable: after SetPosition but before CurveToMesh, add a SetCurveTilt node driven by SplineParameter.Factor × 2π × TWIST_TURNS. Combined with a non-circular profile (oval or D-shaped), this produces a twisted rope or braided-wire visual. See the Set Curve Tilt tutorial for the node pattern.",
      "Cable sway animation: keyframe Sag Parameter from the default value to a slightly lower value (more droop) on alternating frames with an F-Curve Noise modifier applied in the Graph Editor. The result mimics wind-induced oscillation. For physics-accurate sway use a Cloth modifier on a vertex-animated spline proxy, but for WebXR performance the driven-GN approach is preferable at < 1ms CPU cost.",
    ],
    troubleshooting: [
      {
        symptom: "Cable is an inverted arch — endpoints droop, centre lifts",
        cause: "The anchor subtraction (cosh(S/2a)) is missing or the sign is wrong — the formula reads cosh(x/a) only, placing Z=0 at the centre and endpoints above it.",
        fix: "Confirm the SUBTRACT node takes cosh(x/a) − cosh(S/2a) in that order. In the Geometry Nodes editor, follow the wire from the second COSH (the one fed by S/(2a)) into input 1 (bottom) of the SUBTRACT node. If it feeds input 0 (top), the subtraction is inverted — swap the inputs.",
      },
      {
        symptom: "Division by zero warning or NaN values when Sag Parameter approaches 0",
        cause: "The nodes divide by Sag Parameter at two points (x/a and S/(2a)). If a=0, cosh(∞) = ∞.",
        fix: "Set min_value=0.05 on the Sag Parameter socket in the group interface (as in the blueprint). For interactive use, clamp the UI slider in the modifier panel to [0.05, 10.0]. Alternatively add a Math(MAXIMUM, value, 0.05) node before each DIVIDE to enforce the floor inside the graph.",
      },
      {
        symptom: "Cables export to GLB with no droop — all five cables are flat horizontal lines",
        cause: "export_apply=False — the GN modifier is excluded from the GLB and only the base empty mesh is exported.",
        fix: "Pass export_apply=True to bpy.ops.export_scene.gltf(). In the UI: File → Export → glTF 2.0 → Data tab → tick 'Apply Modifiers'. Verify in the exported GLB with gltf-validator or gltf.report that mesh vertex counts are 32 × 6 = 192 per cable, not 0.",
      },
    ],
  },
  base,
);

export { entry };

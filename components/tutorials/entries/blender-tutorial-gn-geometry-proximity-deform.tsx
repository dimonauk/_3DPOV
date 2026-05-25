import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnGeometryProximityDeformBody() {
  return (
    <>
      <p>
        A{" "}
        <strong>Simulation Zone</strong> carries state across frames and must be
        advanced frame-by-frame before export — you saw that cost in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-wave-reveal"
          className={lk}
        >
          GN Simulation Zone wave-reveal tutorial
        </Link>
        . For a deformation that simply says &ldquo;push vertices away
        proportionally to how close a sphere is&rdquo; you do not need any state
        at all. The{" "}
        <strong>Geometry Proximity</strong> node answers, for every vertex in
        your mesh in a single pass: what is the nearest point on that other
        object&rsquo;s surface, and how far away is it? That distance is a pure
        mathematical field — scrub-safe, cache-free, and evaluated in constant
        time regardless of frame number.
      </p>

      <p>
        This tutorial builds the eight-node graph that turns Proximity&rsquo;s
        scalar distance into a soft −Z displacement dome. The key design
        decisions are: <strong>target_element = FACES</strong> for
        sub-vertex-precision sampling; <strong>SMOOTHERSTEP interpolation</strong>{" "}
        in MapRange for C² continuity at the field boundary (no pop, no crease);
        and using <strong>SetPosition with Offset</strong> rather than Position,
        so the original XY layout of each vertex is preserved. The resulting
        modifier lets you move the influence sphere anywhere in the 3D viewport
        and watch the deformation dome follow in real time — a direct proxy for
        the WebXR controller-hover interactions that the{" "}
        <Link
          href="/articles/cohesive-low-poly-cell-shaded-vrm-worlds"
          className={lk}
        >
          cohesive low-poly VRM world
        </Link>{" "}
        article describes as the studio&rsquo;s target aesthetic.
      </p>

      <p>
        The same field can drive cloth-like VRM cape deformation without the
        runtime cost of spring bones. The{" "}
        <Link
          href="/tutorials/blender-tutorial-vrm-spring-bones-hair-chain"
          className={lk}
        >
          VRM Spring Bones tutorial
        </Link>{" "}
        shows the physics-accurate version; Proximity Deform is the export-safe
        baked alternative for headsets that cannot run Verlet integration. The
        two approaches can also be combined: spring bones on the skeleton, a
        Proximity snapshot as the rest-pose collision offset baked into a shape
        key.
      </p>

      <p>
        To animate the field&rsquo;s strength or radius over time without
        resorting to a Simulation Zone, keyframe the modifier&rsquo;s exposed
        inputs — <em>Max Depress</em> and <em>Influence Radius</em> — directly
        on the modifier panel. That is the same mechanism explored in the{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-drivers-parametric-shader"
          className={lk}
        >
          Animation Drivers tutorial
        </Link>
        , except here you use keyframes rather than expression-string drivers.
        Both techniques output standard glTF animation channels; the difference
        is in how the value changes: driver expressions can derive values from
        other object properties, while keyframes are authored explicitly.
      </p>

      <p>
        Outside sources used in this tutorial:{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/sample/geometry_proximity.html"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          Blender Manual: Geometry Proximity Node
        </a>{" "}
        (CC-BY-SA&nbsp;4.0, Blender Documentation Team) — the authoritative
        reference for target_element modes, input sockets, and the exact
        semantics of the Position vs Distance outputs.{" "}
        <a
          href="https://github.com/KhronosGroup/glTF-Blender-IO"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          KhronosGroup/glTF-Blender-IO
        </a>{" "}
        (Apache-2.0, Khronos Group) — the exporter that converts the baked
        deformed mesh to a Draco-6 GLB; its sister project is the{" "}
        <a
          href="https://github.com/KhronosGroup/glTF"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          glTF 2.0 specification
        </a>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-geometry-proximity-deform",
  title:
    "GN Geometry Proximity — Proximity-Driven Deformation Field (Blender 5.1)",
  date: "2026-05-25",
  kind: "tutorial",
  excerpt:
    "Use the Geometry Proximity node to build a soft deformation dome on a subdivided grid — no Simulation Zone, no bake. A secondary object drives a SMOOTHERSTEP falloff that pushes vertices downward proportionally to their distance from the target surface. Scrub-safe, cache-free, real-time.",
  Body: GnGeometryProximityDeformBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Comfortable creating Geometry Nodes trees via bpy.data (no bpy.ops). Understand GroupInput / GroupOutput socket wiring.",
      "Know the difference between SetPosition.Offset and SetPosition.Position — Offset adds a delta; Position replaces the absolute coordinate.",
      "Familiarity with MapRange node inputs/outputs and what 'clamp' does when the distance exceeds from_max.",
      "Blender 5.1 installed. Can run scripts headlessly.",
    ],
    overview:
      "Build an eight-node GN modifier that queries the nearest-surface distance from every vertex to a secondary influence object, maps that distance through a SMOOTHERSTEP falloff, and applies a proportional −Z offset. The result is a soft deformation dome that follows the influence object in real time — no simulation bake required. Export as a Draco-6 GLB snapshot and scaffold the recording pipeline.",
    steps: [
      {
        title: "Understand what Geometry Proximity computes",
        body:
          "GeometryNodeProximity answers two questions for every point in the input geometry:\n\n  1. Where is the nearest point on the target surface?  → Position output (Vector)\n  2. How far away is it?                                → Distance output (Float)\n\nThe target_element property determines what constitutes 'the surface':\n\n  'POINTS' — snaps to the nearest vertex position.\n             Produces a Voronoi-cell pattern in the distance field;\n             each vertex of the sphere creates a flat-bottomed basin.\n             Useful for crystalline or cell-based effects.\n\n  'EDGES'  — nearest point on any edge segment (including endpoints).\n             Useful for cage-based deformers or ribbon effects.\n\n  'FACES'  — nearest point anywhere on any triangle of the target mesh.\n             Produces a smooth, continuous distance field with no\n             vertex-shaped dimpling.  THIS is what we want for organic\n             deformation.\n\nFor a UV sphere with 16×8 tessellation, POINTS mode would produce 128 discrete\nbasins arranged in rows.  FACES mode produces a single smooth dome — the\nEuclidean distance to the sphere's mathematical surface, sampled at every vertex.",
      },
      {
        title: "Create the ObjectInfo node and wire the influence sphere",
        body:
          "The GN tree cannot reference external scene objects directly — everything\nmust enter via a node.  ObjectInfo reads a bpy.types.Object and exposes its\nevaluated geometry:\n\n  n_obj = nodes.new('GeometryNodeObjectInfo')\n  n_obj.transform_space         = 'RELATIVE'\n  n_obj.inputs[0].default_value = sphere_obj   # Object socket\n  n_obj.inputs[1].default_value = False        # As Instance\n\nTwo decisions here:\n\ntransform_space = 'RELATIVE':\n  The sphere's geometry is expressed in the grid object's local coordinate\n  space.  If both objects share the same world matrix (no parent, same scale),\n  this is identical to ORIGINAL.  But the moment you move, rotate, or parent\n  the grid, ORIGINAL would shift the field off-centre while RELATIVE keeps it\n  locked to the grid.  Always use RELATIVE for per-object deformers.\n\nAs Instance = False:\n  The ObjectInfo Geometry output needs real mesh data for the Proximity node's\n  FACES target.  An instance handle (As Instance = True) gives a valid Position\n  but zero-area geometry — the Proximity node would fall back to POINTS mode\n  on an empty mesh, giving incorrect results with no error message.",
      },
      {
        title: "Wire GeometryNodeProximity and interpret its outputs",
        body:
          "  n_prox = nodes.new('GeometryNodeProximity')\n  n_prox.target_element = 'FACES'\n  links.new(n_obj.outputs['Geometry'], n_prox.inputs[0])  # Target\n\nThe Proximity node's input[0] is the Target geometry.  The Source Position input\n(input[1]) defaults to the mesh's own vertex positions — leave it disconnected.\n\nOutputs:\n  outputs[0] — Position (Vector): nearest point on the sphere surface.\n               Not used in this deformer; it becomes essential when you want to\n               push vertices TOWARD rather than AWAY from the target (e.g. a\n               magnetic attraction effect).\n  outputs[1] — Distance (Float): Euclidean distance from each vertex to the\n               nearest sphere surface point.  This is what feeds the MapRange.\n\nAn important subtlety: the Distance output is always NON-NEGATIVE.  Vertices\nINSIDE the target mesh get their distance to the nearest surface, not a negative\nvalue.  There is no signed-distance variant in GN — if you need inside vs outside\ndifferentiation you must compare the vertex position to the target object's\nbounding box or use a separate Is Inside Mesh node.",
      },
      {
        title: "Build the SMOOTHERSTEP MapRange falloff",
        body:
          "  n_map = nodes.new('ShaderNodeMapRange')\n  n_map.data_type          = 'FLOAT'\n  n_map.interpolation_type = 'SMOOTHERSTEP'\n  n_map.clamp              = True\n  n_map.inputs[1].default_value = 0.0   # from_min\n  # inputs[2] from_max ← Influence Radius group input (linked)\n  n_map.inputs[3].default_value = 1.0   # to_min  — full weight at distance 0\n  n_map.inputs[4].default_value = 0.0   # to_max  — zero weight at boundary\n\nSMOOTHERSTEP uses the quintic polynomial 6t⁵ − 15t⁴ + 10t³ where\nt = (value − from_min) / (from_max − from_min).\n\nCompare the three interpolation options:\n  LINEAR:      f'(boundary) ≠ 0  — velocity pop at the field edge\n  SMOOTHSTEP:  f'(boundary) = 0  — C¹ (no velocity pop, but acceleration pop)\n  SMOOTHERSTEP: f'=f''=0 at both ends — C² (no velocity or acceleration pop)\n\nFor a deformation dome, C² continuity means the mesh surface is curvature-\ncontinuous right up to the field boundary — no creasing or folding artefacts\neven at very coarse grid subdivision.  This matters enormously in WebXR where\nyou typically export at lower polygon counts.\n\nThe from_max is linked to the 'Influence Radius' group input so it can be\nkeyframed on the modifier panel:\n  links.new(n_in.outputs['Influence Radius'], n_map.inputs[2])",
      },
      {
        title: "Multiply, negate, and pack into a CombineXYZ offset vector",
        body:
          "Three arithmetic nodes convert the falloff scalar into a 3D offset vector:\n\n  # Scale by Max Depress (metres) → depress_magnitude\n  n_mul = nodes.new('ShaderNodeMath')\n  n_mul.operation = 'MULTIPLY'\n  links.new(n_map.outputs[0],            n_mul.inputs[0])  # falloff [0,1]\n  links.new(n_in.outputs['Max Depress'], n_mul.inputs[1])  # metres\n\n  # Negate: 0 − magnitude → negative_depress\n  n_neg = nodes.new('ShaderNodeMath')\n  n_neg.operation = 'SUBTRACT'\n  n_neg.inputs[0].default_value = 0.0   # minuend fixed at zero\n  links.new(n_mul.outputs[0], n_neg.inputs[1])\n\n  # Pack into (0, 0, −depress) vector\n  n_cxyz = nodes.new('ShaderNodeCombineXYZ')\n  n_cxyz.inputs[0].default_value = 0.0  # X\n  n_cxyz.inputs[1].default_value = 0.0  # Y\n  links.new(n_neg.outputs[0], n_cxyz.inputs[2])  # Z\n\nWhy a fixed −Z direction rather than pointing away from the sphere surface?\n\nFor a flat plane parallel to XY, pushing in −Z is identical to pushing away\nfrom the sphere's nearest surface point — the sphere hovers directly above the\nplane, so the 'away' direction IS −Z at every vertex.  The −Z shortcut\neliminates one VectorMath(SUBTRACT) and one VectorMath(NORMALIZE) node.\n\nIf you want a true push-apart displacement (e.g. for a curved surface or when\nthe sphere can orbit the mesh), replace the Subtract/CombineXYZ block with:\n  VectorMath(SUBTRACT, vertex_position, proximity_position) → direction\n  VectorMath(NORMALIZE, direction) → unit_direction\n  VectorMath(SCALE, unit_direction, depress_magnitude) → offset",
      },
      {
        title: "SetPosition with Offset (not Position) and attach the modifier",
        body:
          "  n_setpos = nodes.new('GeometryNodeSetPosition')\n  links.new(n_in.outputs['Geometry'], n_setpos.inputs[0])   # Geometry\n  links.new(n_cxyz.outputs[0],        n_setpos.inputs[3])   # Offset\n  links.new(n_setpos.outputs[0],      n_out.inputs['Geometry'])\n\nSetPosition has two write modes:\n  inputs[2] — Position: replaces the absolute vertex coordinate.\n              Using this would move every vertex to (0, 0, −depress),\n              erasing the original XY grid layout completely.\n  inputs[3] — Offset: adds a delta to the current position.\n              Vertex at (1.2, 0.8, 0.0) becomes (1.2, 0.8, −0.23).\n              The XY layout is perfectly preserved.  This is what you want.\n\nAttach and configure:\n  mod            = grid_obj.modifiers.new('ProximityDeform', 'NODES')\n  mod.node_group = tree\n\nThe modifier reads default values from the interface socket's .default_value\nproperties set earlier.  No need to assign mod['Socket_N'] explicitly — the\ninterface defaults are baked into the modifier at creation time.",
      },
      {
        title: "Export: export_apply=True bakes the deformed state",
        body:
          "The glTF exporter has two paths for meshes with GN modifiers:\n\n  export_apply=False (default): embeds the modifier stack and attempts to\n    export the node group as a custom extension.  Support varies widely\n    across runtimes.  Three.js and Babylon.js do NOT evaluate GN on import.\n\n  export_apply=True: collapses the entire modifier stack into real mesh data\n    before export.  What you see in the viewport IS what goes into the GLB.\n    This is always the correct choice when the modifier drives visible geometry\n    rather than being a runtime parameter.\n\nFor the Proximity Deform, export_apply=True means the GLB contains the grid\nfrozen at the sphere's current position.  To export a flat (undeformed) grid\nfor use as a WebXR runtime deformable asset, move the sphere far away first\n(or set Max Depress to 0) before running the export call.\n\nThe Draco-6 compression on a 1,600-vertex grid reduces the file by roughly\n70% vs uncompressed — especially important when this grid is one of many\nassets loading in a WebXR scene.\n\nbpy.ops.export_scene.gltf(\n    filepath                             = str(GLB_OUT),\n    export_format                        = 'GLB',\n    export_apply                         = True,\n    export_draco_mesh_compression_enable = True,\n    export_draco_mesh_compression_level  = 6,\n    export_image_format                  = 'WEBP',\n    export_yup                           = True,\n)",
      },
    ],
    finalResult:
      "A .blend containing a 40×40 subdivided grid with a live GN ProximityDeform modifier — move the influence_sphere object anywhere in the 3D viewport and the deformation dome follows in real time, no baking. A Draco-6 GLB snapshot captures the dome at its deepest. The modifier exposes Max Depress and Influence Radius as keyframable parameters on the Properties panel. The holoflow_macros/gn_proximity_deform.py helper packages the same graph for one-line reuse in other scenes.",
    variations: [
      "Push-apart displacement: replace the fixed −Z CombineXYZ block with VectorMath(SUBTRACT, vertex_pos, proximity_pos) → NORMALIZE → SCALE by depress_magnitude. The vertices push radially away from the sphere surface instead of straight down. Required when the grid is curved or the sphere can orbit the mesh in any direction.",
      "Multi-object field: add a second GeometryNodeProximity feeding a second MapRange and a second Math(MULTIPLY). Feed both magnitudes into a Math(MAX) before the negate — the deeper dome always wins. Alternatively use Math(ADD) for an additive field that stacks domes from multiple spheres.",
      "Material gradient from the same field: add a Store Named Attribute node (data_type=FLOAT, domain=POINT, name='proximity_weight') after SetPosition, writing the MapRange output (the [0,1] falloff) to the mesh. In the material, read it with ShaderNodeAttribute and drive a ColorRamp — vertices near the sphere can glow a different colour to the unaffected regions.",
      "Inward attraction: swap to_min=0 and to_max=1 in MapRange (now vertices far from the sphere get full weight) and keep the −Z direction. Vertices far from the sphere sink; vertices near it stay flat — an inversion of the dome into a surrounding moat.",
    ],
    troubleshooting: [
      {
        symptom: "No deformation visible — grid stays completely flat",
        cause:
          "The ObjectInfo node's Object input is empty, or the sphere is further than Influence Radius from every vertex.",
        fix:
          "Confirm n_obj.inputs[0].default_value = sphere_obj in the script. Check the modifier panel — the Influence Object slot should show 'influence_sphere'. Move the sphere to Z=0.3 in the 3D viewport; if the grid still does not deform, open the Spreadsheet editor, select Geometry output, and inspect the SetPosition Offset column — values should be non-zero near the sphere's XY position.",
      },
      {
        symptom: "Deformation is hard-edged or creased at the field boundary",
        cause:
          "MapRange.interpolation_type is LINEAR or SMOOTHSTEP instead of SMOOTHERSTEP, or clamp=False is allowing the falloff to go negative beyond the boundary.",
        fix:
          "Set n_map.interpolation_type = 'SMOOTHERSTEP' and n_map.clamp = True. With clamp off, vertices beyond Influence Radius receive a negative falloff weight, which after MULTIPLY produces a negative depress_magnitude — the grid lifts rather than staying flat outside the field, creating a ridge at the boundary.",
      },
      {
        symptom: "GLB loads in Three.js / Babylon.js but the mesh is perfectly flat",
        cause:
          "export_apply=False was used. The runtime does not evaluate GN.",
        fix:
          "Set export_apply=True in the export call. The GN modifier output is baked into real mesh vertices before the GLB is written. Verify by checking the vertex count in the exported GLB — an unapplied GN modifier on an empty base mesh will export zero vertices.",
      },
      {
        symptom: "Vertices fly to the origin — SetPosition erases the XY layout",
        cause:
          "CombineXYZ output is connected to SetPosition inputs[2] (Position) instead of inputs[3] (Offset).",
        fix:
          "Check: links.new(n_cxyz.outputs[0], n_setpos.inputs[3]). inputs[2] is 'Position' (absolute replacement); inputs[3] is 'Offset' (additive delta). The socket labels differ by one index.",
      },
      {
        symptom: "transform_space='ORIGINAL' causes the field to shift when the grid is moved",
        cause:
          "ORIGINAL expresses the sphere's geometry in world space. If the grid object has a non-identity world matrix (moved, rotated, or parented), ORIGINAL and RELATIVE diverge and the Proximity node measures distances in mismatched spaces.",
        fix:
          "Always use transform_space='RELATIVE' for per-object deformers. ORIGINAL is appropriate only when you intentionally want the target geometry expressed in world space — for example, when computing distances to a shared world-space grid that multiple objects all sample.",
      },
    ],
  },
  base,
);

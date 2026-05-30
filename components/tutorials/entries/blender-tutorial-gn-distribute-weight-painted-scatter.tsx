import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnDistributeWeightPaintedScatterBody() {
  return (
    <>
      <p>
        The{" "}
        <Link href="/tutorials/blender-tutorial-gn-instance-on-points" className={lk}>
          GN Instance on Points tutorial
        </Link>{" "}
        scattered props uniformly across an entire surface. Uniform scatter is
        fine for abstract patterns, but real environments — rocky plains,
        moss-covered terraces, sand dunes — require <em>art-directed density</em>:
        thick growth in sheltered hollows, bare patches where the ground is too
        steep or too exposed. This tutorial adds that control layer. A
        per-vertex FLOAT attribute named <code>scatter_density</code> lives on
        the terrain mesh. You paint it in Vertex Paint mode exactly as you would
        a weight map, building up gradients with a brush. Geometry Nodes then
        reads that attribute at every distributed point and uses it as a
        probability threshold: if a uniformly random float drawn per point falls
        above the density value, the point is deleted before any instance is
        placed. The result is a scatter whose density follows the painted map
        without any UV unwrapping, texture images, or driver expressions.
      </p>

      <p>
        The mechanism rests on an automatic attribute-transfer behaviour inside{" "}
        <strong>Distribute Points on Faces</strong>. When the node distributes
        points across a mesh, it interpolates POINT-domain vertex attributes to
        each output point using barycentric weights within the containing face
        triangle. This means <code>scatter_density</code> is available on the
        distributed points immediately — there is no{" "}
        <code>Capture Attribute</code> node in the tree. A{" "}
        <strong>Named Attribute</strong> node set to FLOAT and name{" "}
        <code>scatter_density</code> reads the interpolated value from the
        distributed-points geometry flowing downstream toward{" "}
        <strong>Delete Geometry</strong>. Compare this with the explicit
        attribute-write pattern in the{" "}
        <Link href="/tutorials/blender-tutorial-vertex-colour-attributes" className={lk}>
          Vertex Colour Attributes tutorial
        </Link>
        , where CORNER-domain colour data needed careful domain and index
        management. POINT-domain floats are simpler: one value per vertex,
        bilinearly interpolated, no loop index arithmetic.
      </p>

      <p>
        The probability gate uses three nodes in sequence. A{" "}
        <strong>Random Value</strong> (FLOAT, 0–1) generates an independent
        uniform draw per distributed point. A <strong>Compare</strong>{" "}
        (GREATER_EQUAL) asks whether that random float is <em>at or above</em>{" "}
        the density threshold — if so, it outputs True, meaning the point failed
        its density check. <strong>Delete Geometry</strong> (POINT domain)
        removes every True-selected point. The surviving points proceed to{" "}
        <strong>Instance on Points</strong> with the rock prop attached via{" "}
        <strong>Object Info</strong>. A second Random Value (FLOAT_VECTOR,
        Z ∈ [0, 2π]) supplies random yaw per instance, preventing the
        repetitive alignment that plagues hand-placed scatter. This pattern —
        distribute → filter → instance — is directly analogous to the weight
        map approach used in{" "}
        <Link href="/tutorials/blender-tutorial-armature-weight-paint" className={lk}>
          weight painting for armatures
        </Link>
        : a 0–1 float attribute controls influence, and the system responds
        continuously as you repaint.
      </p>

      <p>
        For WebXR delivery the terrain GLB is exported with{" "}
        <code>export_apply=True</code>, which requires{" "}
        <strong>Realize Instances</strong> before the Group Output — otherwise
        the exporter sees instance descriptors rather than real mesh data.
        Draco level 6 compresses the repeated rock geometry efficiently because
        all instances share the same topology before realization bakes them into
        the mesh. The{" "}
        <Link href="/tutorials/blender-tutorial-geo-nodes-low-poly-terrain" className={lk}>
          GN Low-Poly Terrain tutorial
        </Link>{" "}
        covers the base terrain construction and heightmap displacement that
        pairs naturally with this scatter technique to build complete environment
        patches for spatial scenes.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-distribute-weight-painted-scatter",
  title:
    "GN Distribute Points on Faces — Weight-Painted Density Scatter (Blender 5.1)",
  date: "2026-05-24",
  kind: "tutorial",
  excerpt:
    "Scatter low-poly rock props across a terrain where density follows a painted per-vertex FLOAT attribute. Blender interpolates scatter_density to every distributed point automatically; a Random Value vs Named Attribute probability gate then culls the excess before instancing.",
  Body: GnDistributeWeightPaintedScatterBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Understand Instance on Points and Object Info from the GN Instance on Points tutorial — this tutorial replaces uniform scatter with weighted culling.",
      "Know what a POINT-domain float attribute is and how to create one in Object Data Properties → Attributes.",
      "Comfortable with Vertex Paint mode: brush strength, colour picker (black = 0, white = 1).",
      "Blender 5.1 installed. Can run scripts headlessly or follow steps interactively.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "Distribute Points on Faces was introduced in Blender 3.0. FunctionNodeCompare (replacing the old Math > Compare) arrived in 3.4. The attribute-transfer behavior relied on here is 3.3+. Blueprint targets 5.1.",
      },
    ],
    steps: [
      {
        title: "Understand the density-as-probability pattern",
        body:
          "The core idea is a probabilistic gate, not a threshold cutoff. If you simply threshold — keep all points where density > 0.5, discard the rest — you get a hard boundary between dense and empty zones. The paintwork becomes binary. Probability does better:\n\n  density = 0.80: each point independently has an 80 % chance of surviving\n  density = 0.20: each point has a 20 % chance of surviving\n  density = 0.00: no point ever survives\n  density = 1.00: every point survives\n\nThe Random Value node draws a uniform [0, 1] float per point. Compare(GREATER_EQUAL, A=random, B=density) is True when the draw fails: random >= density means the point missed its quota. Delete Geometry removes those failed points. The survivors are the Lucky ones — and the spatial distribution of survivors naturally reflects the painted gradient without any UV or texture sampling overhead.\n\nThis is the same logic as vertex-group influence in armature deformation (see the Armature Weight Paint tutorial), but applied to scatter rather than bone weights. The 0–1 float attribute is the universal medium; the system consuming it differs.",
      },
      {
        title: "Build the terrain mesh and paint scatter_density",
        body:
          "Create a flat subdivided plane via bmesh.ops.create_grid:\n\n  bm = bmesh.new()\n  bmesh.ops.create_grid(\n      bm,\n      x_segments=15,\n      y_segments=15,\n      size=2.0,    # half-extent; full width = 4.0 m\n  )\n  bm.to_mesh(mesh)\n  bm.free()\n\nAdd the density attribute BEFORE the GN modifier:\n\n  mesh.attributes.new(name='scatter_density', type='FLOAT', domain='POINT')\n\nBlender zero-initialises all float values (density = 0.0 everywhere = no scatter). To paint interactively:\n  1. Select the terrain, switch to Vertex Paint mode.\n  2. In the header attribute drop-down, select 'scatter_density'.\n  3. Set brush colour to white (R=G=B=1.0).\n  4. Paint a soft blob at the centre to bring density up to 1.0.\n  5. Fade outward — the outer ring stays dark.\n\nFor the blueprint (headless), a radial gradient is computed directly:\n\n  half = TERRAIN_SIZE / 2.0\n  for i, vert in enumerate(mesh.vertices):\n      r = (vert.co.x**2 + vert.co.y**2) ** 0.5\n      attr.data[i].value = max(0.0, 1.0 - r / half)\n\nAfter applying the attribute, add the GN modifier. The attribute is pre-baked onto the mesh and flows into the GN tree as part of the terrain geometry.",
      },
      {
        title: "Create the prop object and wire Object Info",
        body:
          "The prop is a low-poly rock: a subdivision-1 icosphere with random per-vertex jitter applied to break the perfect spherical silhouette:\n\n  bmesh.ops.create_icosphere(bm, subdivisions=1, radius=PROP_RADIUS)\n  bm.verts.ensure_lookup_table()\n  rng = random.Random(PROP_SEED)\n  for v in bm.verts:\n      v.co.x += rng.uniform(-PROP_RADIUS * 0.22, PROP_RADIUS * 0.22)\n      v.co.y += rng.uniform(-PROP_RADIUS * 0.22, PROP_RADIUS * 0.22)\n      v.co.z  = abs(v.co.z) * rng.uniform(0.55, 0.90)  # flatten base\n  bm.normal_update()\n\nKeep flat normals on the rock mesh (face.use_smooth = False) — the Holoflow faceted aesthetic.\n\nIn the GN tree, Object Info wires up the prop:\n\n  n_obj = nodes.new('GeometryNodeObjectInfo')\n  n_obj.transform_space = 'RELATIVE'  # prop centred on its own origin\n  n_obj.inputs['Object'].default_value = prop_obj\n  # Output: n_obj.outputs['Geometry'] → InstanceOnPoints.inputs['Instance']\n\nRELATIVE transform space is mandatory for instancing. ORIGINAL would apply the world transform of the prop object to every instance, offsetting each one by the prop's world position rather than keeping them centred.",
      },
      {
        title: "Build Distribute Points on Faces and the GN tree skeleton",
        body:
          "Distribute Points on Faces setup:\n\n  n_dist = nodes.new('GeometryNodeDistributePointsOnFaces')\n  n_dist.distribute_method = 'RANDOM'\n  n_dist.inputs['Density'].default_value = MAX_DENSITY  # 8 pts/m²\n  n_dist.inputs['Seed'].default_value    = SCATTER_SEED\n  # Input:  n_dist.inputs['Mesh'] ← terrain (GroupInput)\n  # Output: n_dist.outputs['Points'] → Delete Geometry\n  # Also:   n_dist.outputs['Normal'] (face normal at each point — useful for slope alignment)\n\nDistribute on Faces in RANDOM mode ignores the Selection input by default (all faces included). Pass a boolean attribute to Selection to restrict scatter to tagged faces — useful for limiting rocks to only sloped or only flat terrain.\n\nThe Density input (float, pts/m²) is a scalar that applies uniformly before the probability gate. Setting it too low means sparse areas (density = 0.1) may receive zero points even before culling. Set it high enough that even low-density zones get a few candidates to draw from. A value of 8 pts/m² on a 4 m² terrain distributes ~128 points before culling — enough candidates for a density gradient down to ~0.15.",
      },
      {
        title: "Wire the probability gate: Named Attribute → Random Value → Compare → Delete",
        body:
          "Read scatter_density from distributed points:\n\n  n_attr = nodes.new('GeometryNodeInputNamedAttribute')\n  n_attr.data_type = 'FLOAT'\n  n_attr.inputs['Name'].default_value = 'scatter_density'\n  # Output: n_attr.outputs['Attribute'] — float per point (interpolated from terrain)\n\nNote: n_attr has NO geometry input. It reads from the geometry context inferred from the downstream Delete Geometry node. This automatic context propagation is how GN nodes share implicit geometry without explicit wiring on non-geometry paths.\n\nRandom draw per point:\n\n  n_rand = nodes.new('GeometryNodeRandomValue')\n  n_rand.data_type = 'FLOAT'\n  n_rand.inputs['Min'].default_value  = 0.0\n  n_rand.inputs['Max'].default_value  = 1.0\n  n_rand.inputs['Seed'].default_value = SCATTER_SEED\n\nProbability gate:\n\n  n_cmp = nodes.new('FunctionNodeCompare')\n  n_cmp.data_type = 'FLOAT'\n  n_cmp.operation = 'GREATER_EQUAL'  # True → delete\n  links.new(n_rand.outputs['Value'],     n_cmp.inputs['A'])\n  links.new(n_attr.outputs['Attribute'], n_cmp.inputs['B'])\n\nDelete Geometry:\n\n  n_del = nodes.new('GeometryNodeDeleteGeometry')\n  n_del.domain = 'POINT'\n  n_del.mode   = 'ALL'\n  links.new(n_dist.outputs['Points'],  n_del.inputs['Geometry'])\n  links.new(n_cmp.outputs['Result'],   n_del.inputs['Selection'])\n\nThe Selection input of Delete Geometry marks elements to DELETE (not to keep). GREATER_EQUAL gives True on the points that failed the density test — exactly the points that should go.",
      },
      {
        title: "Add random rotation, Instance on Points, and Realize for export",
        body:
          "Random yaw per instance (Z rotation only — rocks sit flat):\n\n  n_rot = nodes.new('GeometryNodeRandomValue')\n  n_rot.data_type = 'FLOAT_VECTOR'\n  n_rot.inputs[0].default_value = (0.0, 0.0, 0.0)\n  n_rot.inputs[1].default_value = (0.0, 0.0, 6.2832)  # 0–2π on Z\n  n_rot.inputs['Seed'].default_value = SCATTER_SEED + 1\n  # Output: n_rot.outputs['Value'] (Vector/Euler)\n\nInstance on Points:\n\n  n_inst = nodes.new('GeometryNodeInstanceOnPoints')\n  links.new(n_del.outputs['Geometry'],  n_inst.inputs['Points'])\n  links.new(n_obj.outputs['Geometry'],  n_inst.inputs['Instance'])\n  links.new(n_rot.outputs['Value'],     n_inst.inputs['Rotation'])\n\nRealize Instances + Group Output:\n\n  n_real = nodes.new('GeometryNodeRealizeInstances')\n  links.new(n_inst.outputs['Instances'], n_real.inputs['Geometry'])\n  links.new(n_real.outputs['Geometry'],  n_out.inputs['Geometry'])\n\nWhy Realize? Without it, bpy.ops.export_scene.gltf with export_apply=True would bake the GN modifier but instance data may export as KHR_mesh_gpu_instancing — a glTF extension not yet supported in all WebXR runtimes. Realizing first guarantees conventional indexed triangle mesh output.",
      },
    ],
    finalResult:
      "A .blend containing a 4 m × 4 m subdivided terrain with a per-vertex scatter_density attribute (radial gradient: full at centre, zero at edges). A GN modifier distributes 8 pts/m² uniformly, culls them probabilistically against the attribute, and instances a low-poly rock prop at each survivor with random yaw. The GLB exports the realized scatter as a single compressed mesh, Draco level 6.",
    variations: [
      "Slope-aware placement: use the Normal output from Distribute Points on Faces and feed it to Align Euler to Vector before Instance on Points. Rocks tilt to sit flush with sloped faces. Add a dot-product gate against the world Z axis to reject placement on near-vertical faces (cliffs should not have floating rocks).",
      "Multiple props: add a second Object Info node for a different prop (e.g. clumps of grass), and a third Random Value (INT, 0–1) to toggle between props using the Pick Instance and Instance Index inputs on Instance on Points. The Integer random value seeds differently from the Float random — adjust the Seed offset to avoid spatial correlation.",
      "Painted exclusion zones: add a second float attribute scatter_exclude painted as hard white circles where you never want scatter (roads, doorways). Inside the GN tree, read it with a second Named Attribute node and combine its result with the existing Compare using BooleanMath(OR) before Delete Geometry.",
    ],
    troubleshooting: [
      {
        symptom: "scatter_density reads as 0.0 on all distributed points — rocks only appear at density-1 boundary",
        cause:
          "The attribute was created AFTER the GN modifier was applied, so the mesh flowing into DistributePointsOnFaces does not carry it. Blender evaluates GN on the pre-modifier mesh data.",
        fix:
          "Create the attribute before adding the GN modifier. In the blueprint this is enforced by calling mesh.attributes.new() before mod = obj.modifiers.new(). Interactively: remove the GN modifier, add the attribute, re-add the modifier.",
      },
      {
        symptom: "AttributeError: 'GeometryNodeRandomValue' has no attribute 'data_type'",
        cause:
          "Using Blender older than 3.3, where Random Value's data_type property did not exist.",
        fix:
          "Confirm you are on Blender 5.1. If you need to run on an older version, use the deprecated separate Float Random and Vector Random nodes instead.",
      },
      {
        symptom: "GLB contains only the terrain plane, no rock instances",
        cause:
          "export_apply=True requires the GN tree to produce a realized mesh. If Realize Instances is missing or the ObjectInfo reference is broken (prop deleted after blueprint ran), the evaluated geometry may be empty.",
        fix:
          "Check that Realize Instances is the last node before Group Output. Confirm prop_obj is still in the scene (not deleted). Run bpy.context.view_layer.update() before the export call to ensure the modifier stack is evaluated.",
      },
      {
        symptom: "All rocks appear at the origin despite scatter",
        cause:
          "ObjectInfo transform_space is set to ORIGINAL rather than RELATIVE. Each instance inherits the prop's world-space transform (which may be at origin) instead of its local geometry.",
        fix:
          "Set n_obj.transform_space = 'RELATIVE'. Verify in the 3D viewport: the prop object's origin should sit at the object centre, not offset.",
      },
    ],
  },
  base,
);

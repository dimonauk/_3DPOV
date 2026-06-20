import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        The <strong>Index Switch</strong> node (introduced in Blender 4.1,
        polished in 5.1) is the field-aware sibling of Menu Switch. Where Menu
        Switch evaluates a single enum once per modifier evaluation — every
        instance receives the same choice — Index Switch accepts an{" "}
        <em>integer field</em> and evaluates it independently per element,
        meaning each scattered instance can land on a completely different
        geometry input. This tutorial builds a procedural colonnade of 40
        columns where four different column geometries are assigned per-instance
        by a random integer field, with a proximity override that forces the
        inner ring to always use the grandest variant. Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-menu-switch-tile-variant-kit"
          className={lk}
        >
          Menu Switch tile-variant tutorial
        </Link>
        , which demonstrates the global-enum pattern; the two nodes look
        similar in the node editor but behave in fundamentally different
        evaluation domains.
      </p>

      <p>
        The field expression driving the switch is a three-step composition:
        first, a <code>Random Value (INT, Min=0, Max=3)</code> node seeded from
        the{" "}
        <strong>Index</strong> field (each instance has a unique index, giving
        each its own deterministic random number); second, a proximity mask
        computed as{" "}
        <code>LESS_THAN(sqrt(X² + Y²), centre_radius)</code> that identifies
        near-centre points; third, a multiply-by-inverse{" "}
        <code>random × (1 − near)</code> that zeroes the index for near-centre
        points without any conditional branch — the same attribute-mask
        technique used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-points-faces-poisson-scatter"
          className={lk}
        >
          Distribute Points on Faces density-mask tutorial
        </Link>
        . The result: near-centre points always resolve to index 0 (the plain
        cylinder), outer points resolve randomly to indices 0–3.
      </p>

      <p>
        The four variant objects live in a hidden collection called{" "}
        <code>_column_variants</code>. Each is connected to an Index Switch
        input via an <strong>Object Info</strong> node set to{" "}
        <em>Original</em> transform space — this means the column&apos;s local
        origin is at its base centre, and Instance on Points places it
        correctly on the scatter points without a manual Z-offset. The approach
        mirrors the asset-collection pattern from the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-collection-info-pick-instance-asset-scatter"
          className={lk}
        >
          Collection Info + Pick Instance scatter tutorial
        </Link>
        , except that here the selection logic is an arithmetic field rather
        than a Pick Index socket — giving you full field-composition control
        over which variant lands where. After Instance on Points, a{" "}
        <strong>Realise Instances</strong> node bakes all copies into true mesh
        geometry before the GLB export, ensuring the exporter writes 40
        individual column meshes rather than an instanced scene graph (required
        for Draco compression and WebXR runtime compatibility).
      </p>

      <p>
        Outside reference:{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/switch/index_switch.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual — Index Switch Node
        </a>{" "}
        (Blender Foundation, CC-BY-SA 4.0) and{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/random_value.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual — Random Value Node
        </a>{" "}
        (Blender Foundation, CC-BY-SA 4.0). The proximity-override technique
        adapts the attribute-mask pattern documented in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-instance-on-points"
          className={lk}
        >
          Instance on Points fundamentals tutorial
        </Link>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-index-switch-per-instance-geometry-variant",
  title:
    "GN Index Switch — Per-Instance Geometry Variation: Attribute-Driven Multi-Mesh Asset Bag (Blender 5.1)",
  date: "2026-06-20",
  kind: "tutorial",
  excerpt:
    "Use the Index Switch node with a per-instance Random Value integer field to scatter four different column variants across a plane. Includes a proximity override that forces the inner ring to a specific variant using arithmetic field composition — no branch nodes needed.",
  Body,
};

export const entry = buildInstructable(
  {
    time: "one sitting (45–90 min)",
    difficulty: "intermediate",
    cost: "free — Blender 5.1 is open-source",
    supplies: {
      software: [
        {
          name: "Blender",
          version: "5.1",
          url: "https://www.blender.org/download/",
          cost: "free",
          platforms: ["windows", "macos", "linux"],
        },
      ],
    },
    steps: [
      {
        title: "Understand Index Switch vs Menu Switch",
        body: 'Before opening Blender, understand the core distinction — it defines every design decision in this tutorial.\n\nMenu Switch has a single enum input that is set once by the artist or by a driver.  Every instance, every face, every vertex in the modifier evaluation gets the same selected geometry.  Menu Switch is useful for art-direction "choose which tile style this prop uses" — a global override.\n\nIndex Switch takes an integer *field* on its Index socket.  A field is a function that maps each element to a value — so the integer can differ per instance, per face, per vertex.  When used inside Instance on Points, the field evaluates once per scatter point, and each point can resolve to a different geometry input (up to 15 inputs, indexed 0–14).\n\nThe implication: any computation you can express as a field (random noise, distance from a curve, colour from a texture, attribute read from a CSV file loaded via a Python handler) can drive which geometry variant each instance receives.  This tutorial uses a random integer field combined with a proximity mask, but the same socket accepts Voronoi cell index, nearest-neighbour lookup result, or attribute data from the Spreadsheet.',
      },
      {
        title: "Build the four column variants in a hidden collection",
        body: 'Open Blender 5.1, delete the default cube.\n\nCreate a new collection: Outliner → right-click Scene Collection → New Collection → name it "_column_variants".  In the Outliner, click the eye and camera icons on the collection to disable viewport visibility and rendering — this collection is a source library, not a visible scene object.\n\nVariant A — plain smooth cylinder:\n  Add → Mesh → Cylinder, Vertices=16, Radius=0.18, Depth=2.5.\n  Tab → Edit Mode → A (select all) → right-click → Shade Smooth.\n  Return to Object Mode.  Rename the object "variant_column_a".\n  Create a material "Mat_ColA", Base Color = warm off-white (0.82, 0.78, 0.70), Roughness=0.55.\n  Move to the _column_variants collection: right-click the object → Move to Collection.\n\nVariant B — hexagonal pillar (faceted):\n  Add → Cylinder, Vertices=6, Radius=0.22, Depth=2.5.\n  Shade Flat.  Name "variant_column_b".  Material "Mat_ColB", blue-grey (0.60, 0.72, 0.85).\n  Move to _column_variants.\n\nVariant C — tapered frustum:\n  Add → Cone, Vertices=8, Radius1=0.20, Radius2=0.08, Depth=2.5.\n  Shade Flat.  Name "variant_column_c".  Material "Mat_ColC", orange (0.90, 0.55, 0.30).\n  Move to _column_variants.\n\nVariant D — box column:\n  Add → Cube, Size=0.36.\n  Scale: S → X → 0.5, S → Y → 0.5, S → Z → 3.47 (so height = 0.36 × 2 × 3.47 ≈ 2.5).\n  Apply Scale (Ctrl+A → Scale).  Shade Flat.  Name "variant_column_d".  Material "Mat_ColD", green (0.45, 0.80, 0.55).\n  Move to _column_variants.\n\nAll four columns should now be in the hidden collection, each with its origin at the base centre (Z=0 at base means instances sit correctly on the ground when placed by Instance on Points).',
      },
      {
        title: "Create the ground plane and add a Geometry Nodes modifier",
        body: 'Add → Mesh → Plane.  S → 8 → Enter to scale to 16 BU extent.\nRename to "ground_plane".\nAssign a dark grey material "Mat_Ground" (Base Color 0.20, 0.20, 0.22).\n\nWith ground_plane selected, go to Properties (right panel) → Modifier (spanner icon) → Add Modifier → Geometry Nodes.\nClick "New" to create a fresh node tree.  Name it "Colonnade Generator".\n\nOpen a Geometry Nodes workspace editor.  You should see a Group Input → Group Output chain.  Add the following Group Input sockets via the node\'s sidebar (N key → Group tab → + Add Input):\n  • "Instance Count"  (Integer, default 40)\n  • "Random Seed"     (Integer, default 42)\n  • "Centre Radius"   (Float,   default 2.0)\nThese appear as sliders in the Modifier Properties panel.',
      },
      {
        title: "Scatter points with Distribute Points on Faces",
        body: 'In the GN editor, after Group Input:\n\nAdd → Geometry Nodes → Point → Distribute Points on Faces.\n  Distribute Method: POISSON_DISK\n  Distance Min:      0.55   (prevents columns touching)\n  Seed:              7      (hardcoded; change for different random layouts)\nWire:\n  Group Input.Geometry         → Distribute.Mesh\n  Group Input."Instance Count" → Distribute."Max Points"\n\nAt this stage, look at the viewport — you should see a spray of white dots on the plane (press Z → Wireframe if the dots are hidden).  The Poisson Disk method guarantees minimum spacing, so you will never see two columns overlapping regardless of Instance Count or Seed values.',
      },
      {
        title: "Compute per-instance distance from the world origin",
        body: 'Now build the proximity mask.  In Geometry Nodes, vector math without a dedicated Distance node requires Pythagoras manually:\n\n1. Add → Input → Position node.  Outputs the 3D world-space position of each point.\n\n2. Add → Converter → Separate XYZ.  Wire Position → Vector.\n\n3. Add two Math nodes, operation = MULTIPLY.\n   First:  wire X → both inputs.  This computes X².\n   Second: wire Y → both inputs.  This computes Y².\n   (Z is ignored — the ground is flat, so Z ≈ 0 for all scatter points.)\n\n4. Add Math, operation = ADD.  Wire X² → Input0, Y² → Input1.  This gives X² + Y².\n\n5. Add Math, operation = SQRT.  Wire (X²+Y²) → Input0.  Output: horizontal distance from origin.\n\n6. Add Math, operation = LESS_THAN.\n   Wire: SQRT.Value → Input0.\n   Wire: Group Input."Centre Radius" → Input1.\n   Output: 1.0 when the point is inside the radius, 0.0 otherwise.\n\nThis is a pure field — it evaluates once per point, and the result differs across the scatter.  Near the origin the field returns 1.0; far from it, 0.0.',
      },
      {
        title: "Random integer field seeded per instance",
        body: 'Add → Utilities → Random Value.\n  data_type = INT\n  Min = 0\n  Max = 3\nIn the node sidebar, set data_type to Integer (this changes the Min/Max sockets to integer type).\n\nWire:\n  Group Input."Random Seed" → Random Value.Seed\n\nFor per-instance uniqueness, the ID socket must vary per point.  Add → Input → Index node.  Wire Index → Random Value.ID.\n\nThe Index node outputs the integer index of each element in the current domain — for scatter points, this is 0, 1, 2, … 39.  The Random Value node uses this as a per-element seed, producing a different random integer (0–3) for each point.  Change the global Seed value and every point\'s random integer shuffles while remaining deterministic for the same Seed.\n\nWhy use ID rather than leaving it disconnected?\nWith ID = 0 (default), all points share the same hash input modified only by their spatial position.  If points are clustered, their positions are similar and the random output can be correlated.  Seeding by Index gives uncorrelated integers regardless of spatial proximity.',
      },
      {
        title: "Combine proximity mask and random index",
        body: 'Goal: near-centre points → index = 0.  Outer points → index = random.\n\nThe field expression is:\n  final_index = floor( random × (1 − is_near) )\n\nStep by step:\n\n1. Add Math, operation = SUBTRACT.\n   Input[0] = 1.0 (constant, type it directly)\n   Wire: LESS_THAN.Value → Input[1]\n   Output: 1.0 when far from centre, 0.0 when near.  This is the "not-near" mask.\n\n2. Add Math, operation = MULTIPLY.\n   Wire: Random Value.Value → Input[0]\n         SUBTRACT.Value     → Input[1]\n   When near: SUBTRACT = 0 → output = random × 0 = 0.  ✓\n   When far:  SUBTRACT = 1 → output = random × 1 = random.  ✓\n   Note: Random Value (INT) outputs a float-cast integer via the Value socket in GN; it needs no explicit cast.\n\n3. Add Math, operation = FLOOR.\n   Wire: MULTIPLY.Value → Input.\n   This guards against any fractional artefact from the multiply.  For integer inputs with no fractional component it is a no-op, but it documents intent and prevents future errors if you replace the multiply with a smoother blend.\n\nThe output of FLOOR is an integer-valued float field (0.0, 1.0, 2.0, or 3.0) ready for the Index Switch.',
      },
      {
        title: "Wire Index Switch with four Object Info inputs",
        body: 'Add → Geometry Nodes → Utilities → Switch → Index Switch.\n  data_type = GEOMETRY\n  By default the node has two inputs (0 and 1).  Click the + button in the node header twice to add two more, giving inputs 0, 1, 2, 3.\n\nWire: FLOOR.Value → Index Switch.Index\n\nFor each of the four column variants, add an Object Info node:\n  Add → Input → Scene → Object Info\n  transform_space = ORIGINAL  (uses local object origin — columns base at Z=0)\n  Click the eyedropper on "Object" and pick "variant_column_a".\n  Wire: Object Info.Geometry → Index Switch input [0]\n\nRepeat for variants b, c, d (inputs 1, 2, 3).\n\nNow the Index Switch outputs a different geometry per instance:\n  Index 0 → Variant A (smooth cylinder)\n  Index 1 → Variant B (hexagonal pillar)\n  Index 2 → Variant C (tapered frustum)\n  Index 3 → Variant D (box column)\n\nPoints within Centre Radius always resolve to Index 0 — the smooth cylinder — regardless of their random value.',
      },
      {
        title: "Instance on Points, random rotation, Realise, Join, export",
        body: 'Add → Geometry Nodes → Instances → Instance on Points.\n  Wire: Distribute.Points   → Instance on Points.Points\n        Index Switch [out]  → Instance on Points.Instance\n\nFor random column orientations (Z rotation only — columns are vertical):\n  Add → Utilities → Random Value, data_type = FLOAT, Min=0.0, Max=6.2832 (≈ 2π)\n  Wire: Index (same as before) → Random Value.ID\n        Group Input."Random Seed" → Random Value.Seed\n  Add → Converter → Combine XYZ.  Wire Random Value.Value → Z.  X and Y = 0.\n  Wire: Combine XYZ.Vector → Instance on Points.Rotation\n\nThis gives every column a random yaw while keeping it perfectly vertical — the stepped box variant looks especially varied with different faces presented.\n\nRealise Instances:\n  Add → Geometry Nodes → Instances → Realize Instances.\n  Wire: Instance on Points.Instances → Realize Instances.Geometry\n  Realize Instances converts the instanced representation into actual geometry.\n  This is required before GLB export to get Draco compression on the individual meshes.\n\nJoin Geometry:\n  Add → Geometry Nodes → Geometry → Join Geometry.\n  Wire: Group Input.Geometry        → Join Geometry   (the ground plane)\n        Realize Instances.Geometry  → Join Geometry   (the realised columns)\n        Join Geometry.Geometry      → Group Output.Geometry\n\nExport GLB:\n  File → Export → glTF 2.0 (.glb/.gltf)\n  ✓ Apply Modifiers\n  ✓ Draco Mesh Compression, Level 6\n  ✓ Y Up (WebXR convention)\n  Filename: colonnade_index_switch.glb\n\nOr via Python script:\n  bpy.ops.export_scene.gltf(\n      filepath="//colonnade_index_switch.glb",\n      export_format="GLB",\n      use_selection=False,\n      export_apply=True,\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_yup=True,\n  )',
      },
    ],
    finalResult:
      "A Draco-6 GLB containing a procedurally varied colonnade: 40 columns on a flat ground plane, each column being one of four mesh variants (smooth cylinder, hexagonal pillar, tapered frustum, stepped box) chosen by a per-instance random integer field. Columns within 2 BU of the origin are always the smooth cylinder variant. The source .blend retains the live GN modifier with Instance Count, Random Seed, and Centre Radius sliders. Changing Random Seed reshuffles all outer columns while preserving the inner-ring override.",
    variations: [
      "Five or more variants: click the + button on Index Switch to add input 4. Build a fifth Object Info node pointing to a new variant object. Change Random Value Max to 4. The distribution remains roughly uniform across all five types.",
      "Attribute-driven override: instead of proximity, use a Weight Paint vertex group on the ground plane to drive which variant lands where. Sample the weight with a Named Attribute node (name = the vertex group name, domain = POINT), multiply by 3, floor to integer, and use that as the Index Switch input. Painting black → variant 0, white → variant 3.",
      "Voronoi zone variant: replace the random field with a Voronoi Texture (3D, Smooth F1). Map its F1 output (0..1) via Multiply (×3) + Floor to get 0–3. Each Voronoi cell assigns a consistent variant to all points within it — useful for district-based environmental scatter (stone district, brick district, wood district).",
      "Animate the swap: expose a Group Input float 'Morph' (0..4). Wire Morph → Index Switch.Index directly (no Random Value). Keyframe Morph from 0 to 3 over 120 frames. Every column transitions through all four variants in sequence — a useful preview animation for a client kit-bash review.",
    ],
    troubleshooting: [
      {
        symptom: "Only one column variant appears — all instances look the same",
        cause:
          "The Index node is not connected to Random Value.ID. Without a per-instance ID, all points share the same hash input and the random integer collapses to a single value for the given Seed.",
        fix: "Add an Index node (Add → Input → Index) and wire its output to Random Value.ID. The Index field outputs a unique integer per scatter point, seeding each independently.",
      },
      {
        symptom:
          "Index Switch shows only 2 inputs and variants C and D never appear",
        cause:
          "The Index Switch node starts with 2 items (indices 0 and 1). Indices 2 and 3 resolve to the last available input when out of range, so only variants A and B appear.",
        fix: "Select the Index Switch node and click the + button in its header twice to add items 2 and 3. Wire variant_column_c to input 2 and variant_column_d to input 3.",
      },
      {
        symptom:
          "Near-centre columns are randomised instead of always being variant A",
        cause:
          "The SUBTRACT(1, LessThan) and MULTIPLY nodes are wired in the wrong order, or the LESS_THAN node's inputs are swapped (distance in Input[1], radius in Input[0]).",
        fix: "Confirm LESS_THAN: Input[0] = distance field (SQRT output), Input[1] = Centre Radius (Group Input). Then SUBTRACT: Input[0] = 1.0 (constant), Input[1] = LESS_THAN output. Then MULTIPLY: Input[0] = Random Value, Input[1] = SUBTRACT output.",
      },
      {
        symptom:
          "Columns float above the ground or sink below it",
        cause:
          "The variant objects have their origin at the mesh centre (Blender default) rather than the base. Object Info with transform_space = ORIGINAL places the instance so its origin aligns with the scatter point — if the origin is at mesh centre, columns are half-buried.",
        fix: "Select each variant object, press Tab → Edit Mode, select all, G → Z → move mesh up by half its height (1.25 BU for a 2.5-tall column) so the base is at Z=0 in local space. Apply origin: Object → Set Origin → Origin to 3D Cursor (with cursor at world origin).",
      },
      {
        symptom: "GLB is enormous — no Draco compression applied",
        cause:
          "Realise Instances was not included before export, or export_apply was left False. Without Realise Instances, the exporter writes an instanced scene graph which many Draco implementations cannot compress efficiently.",
        fix: "Ensure Realise Instances is wired between Instance on Points and Join Geometry. Set export_apply=True in the Python export call, and confirm Draco Mesh Compression Level 6 is checked in the export dialogue.",
      },
    ],
  },
  base,
);

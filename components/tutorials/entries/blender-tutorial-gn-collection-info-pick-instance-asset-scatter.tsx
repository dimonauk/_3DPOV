import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function CollectionInfoScatterBody() {
  return (
    <>
      <p>
        The standard{" "}
        <Link href="/tutorials/blender-tutorial-gn-instance-on-points" className={lk}>
          Instance on Points
        </Link>{" "}
        workflow places one mesh at every scatter point. Real environment dressing
        needs a <em>palette</em>: rocks of three silhouettes, two crystal heights,
        a mushroom — all drawn from the same surface modifier without pre-combining
        them into one mangled mesh. The{" "}
        <code>Collection Info</code> node solves this cleanly: point it at a
        Blender Collection, enable <code>Separate Children</code>, and every
        object in that collection becomes an individually addressable entry in an
        ordered instance list. Feed that list&rsquo;s output into{" "}
        <code>Instance on Points</code> with <code>Pick Instance = True</code>{" "}
        and a seeded integer random node on the <code>Instance Index</code>{" "}
        socket — each scatter point independently draws from the palette.
      </p>

      <p className="mt-3">
        The technique is additive with the density-masking approach in the{" "}
        <Link href="/tutorials/blender-tutorial-gn-distribute-weight-painted-scatter" className={lk}>
          weight-painted scatter tutorial
        </Link>
        : drive <code>Distribute Points on Faces</code> with a vertex-group
        density mask and Collection Info supplies the variety. The two levers
        — where things appear (weight paint) and which things appear (instance
        index seed) — remain completely independent, which is the reason
        production sets keep them separate rather than baking them into a
        single texture.
      </p>

      <p className="mt-3">
        For tile and panel work the{" "}
        <Link href="/tutorials/blender-tutorial-gn-menu-switch-tile-variant-kit" className={lk}>
          Menu Switch tile variant tutorial
        </Link>{" "}
        covers a complementary approach: one socket drives a discrete dropdown
        rather than a random draw. Collection Info is the right tool when
        statistical distribution is wanted; Menu Switch is the right tool when
        a controlled, art-directed per-face selection is wanted.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Separate Children and Transform Space
      </h2>
      <p>
        <code>Separate Children = True</code> is the switch that makes collection
        scatter work. With it off, Collection Info returns the entire collection
        as one block — <code>Pick Instance</code> has nothing to index. With it
        on, each child object becomes row <em>N</em> in the instances list. The
        order matches the Outliner child order, so reordering objects in the
        Outliner changes which index maps to which prop — worth knowing when
        you weight certain props more heavily by clamping the random range.
      </p>
      <p className="mt-3">
        <code>Transform Space = ORIGINAL</code> keeps each prop at its own
        local-space origin. <code>RELATIVE</code> would apply the scatter
        object&rsquo;s world transform to every instance — harmless at the origin,
        disastrous once the ground plane moves in world space. Always use
        ORIGINAL for asset-scatter; only RELATIVE is needed when you want the
        entire collection to follow the scatter object&rsquo;s parent hierarchy.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Seeded randomness in GN field evaluation
      </h2>
      <p>
        <code>Random Value (INT)</code> is a field node: it evaluates once per
        element in the current domain (one point per scatter point). Blender
        uses each point&rsquo;s implicit <code>Index</code> attribute combined
        with the node&rsquo;s <code>Seed</code> socket to produce a stable,
        per-instance integer. Changing the Seed socket reshuffles all
        assignments at once — a single integer encodes the entire scatter
        &ldquo;story&rdquo;. The range <code>min=0, max=N-1</code> must exactly
        match the collection child count; an out-of-range index wraps modulo the
        list length, so a mismatch skews the distribution towards the first item.
      </p>
      <p className="mt-3">
        Rotation and scale are driven by two further <code>Random Value (FLOAT)</code>
        nodes seeded with offset values so rotation and scale are not correlated.
        A Combine XYZ converts the float rotation to a <code>(0, 0, θ)</code>{" "}
        vector for <code>Rotate Instances</code>, keeping props upright on the
        ground plane while spinning freely on the local Z axis.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        GLB export: Realize Instances first
      </h2>
      <p>
        glTF 2.0 has no concept of a Collection Info palette. The{" "}
        <code>EXT_mesh_gpu_instancing</code> extension covers simple object
        instancing, but Blender 5.1 does not yet emit it for collection-scatter
        outputs. The practical export path: duplicate the scatter object,{" "}
        <code>Apply</code> the GN modifier (which bakes all instances into a
        single realised mesh), export that copy as a GLB, then delete it. The
        live GN tree on the original object remains intact and editable. A{" "}
        <Link href="/tutorials/blender-tutorial-python-batch-glb-exporter" className={lk}>
          batch GLB exporter script
        </Link>{" "}
        can automate this duplicate-apply-export-delete cycle across an entire
        scene of scatter objects.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Sources</h2>
      <ul className="list-disc list-inside text-sm space-y-1">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/instances/collection_info.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual &mdash; Collection Info Node
          </a>{" "}
          &mdash; CC-BY-SA 4.0, Blender Documentation Team. Documents{" "}
          <code>separate_children</code>, <code>reset_children</code>, and the
          two <code>transform_space</code> modes (ORIGINAL vs RELATIVE).
          Related:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/instances/instance_on_points.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Instance on Points node
          </a>{" "}
          and{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.GeometryNodeCollectionInfo.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.GeometryNodeCollectionInfo API
          </a>
          .
        </li>
        <li>
          <a
            href="https://studio.blender.org/films/sprite-fright/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Studio &mdash; Sprite Fright Open Movie
          </a>{" "}
          &mdash; CC BY 4.0, Blender Studio. Sprite Fright&rsquo;s forest and
          undergrowth sets use Collection Info scatter extensively — production
          files are publicly available and show how palette collections are
          organised (separate collections per biome, density weight-painted on
          terrain). Related:{" "}
          <a
            href="https://studio.blender.org/films/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Studio open movies
          </a>{" "}
          (Charge, Cosmos Laundromat) which share the same instancing
          conventions.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/geometry-nodes/gn-collection-info-pick-instance-asset-scatter",
    time: "25 to 40 minutes",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1"],
      tools: [
        "Scripting workspace — Text Editor",
        "Geometry Nodes workspace",
        "3D Viewport (Solid shading with Cavity overlay)",
        "Properties panel ▸ Modifier",
        "Outliner (collection management)",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py",
        body: "Scripting workspace → open blueprint.py → Run Script (Alt+P). Four props appear in the Outliner under the 'scatter_kit' collection: rock_a (grey), crystal_b (blue), pebble_c (tan), mushroom_d (red). The ground plane 'ground_scatter' carries the HF_CollectionScatter modifier. The Info bar prints 'blueprint GLB exported' and 'blend saved'. A GLB of the realised scatter lands in public/library/glbs/.",
      },
      {
        title: "Inspect Collection Info in the node tree",
        body: "Switch to Geometry Nodes workspace. Select ground_scatter. Locate the 'Collection Info' node near the left. Its Collection socket shows 'scatter_kit'. Confirm: Separate Children = On (checked), Transform Space = Original. Hover over the Instances output socket — the tooltip reads 'Instances (Geometry)'. This is the ordered palette the Instance on Points node will draw from.",
      },
      {
        title: "Inspect Instance on Points — Pick Instance",
        body: "Locate Instance on Points. Pick Instance input = True (constant Boolean). Instance Index input is driven by a Random Value (INT) node with Min=0, Max=3. This is the per-point palette lookup. The Rotation input receives a Combine XYZ (0, 0, random_Z) — only yaw varies, props stay upright. The Scale input is a Combine XYZ where all three channels share the same random float, giving uniform scale per instance.",
      },
      {
        title: "Scrub the Seed parameter",
        body: "In the N-panel modifier properties, find the 'Seed' input. Drag it from 0 to 100 slowly. The entire scatter pattern reshuffles: both point layout (Distribute Points uses the same seed) and prop selection change together. Stop at a value where the four prop types are visually balanced. Note: to decouple layout-seed from type-seed, add a separate Math (Add) node between Group Input Seed and the Random Value (INT) Seed socket — offset by a constant like 7.",
      },
      {
        title: "Adjust Min Distance",
        body: "Drag 'Min Distance' from 0.55 down to 0.25 — the scatter densifies dramatically, packing props tightly. Raise it to 1.2 — props thin out, wide spacing between each. The Poisson Disc algorithm guarantees no two points are closer than this distance, so it directly controls visual density without requiring a separate density texture.",
      },
      {
        title: "Add a fifth prop to the collection",
        body: "In the Outliner, right-click 'scatter_kit' → New Object → Mesh. Add any mesh (Shift+A in viewport), rename it 'log_e'. In the modifier, change the Random Value (INT) Max to 4. The new prop enters the palette immediately. This is the core authoring loop: add props to the collection, update the integer max — no node tree changes otherwise.",
      },
      {
        title: "Record and export",
        body: "Scripting workspace → open record.py → Run Script. A 150-frame animation renders: frames 1–40 reshuffle the seed, 41–90 orbit the camera, 91–150 tighten Min Distance. Output lands at public/library/videos/.../viewport.mp4. The GLB export already ran in blueprint.py; re-export by selecting ground_scatter, duplicating, applying HF_CollectionScatter modifier, then File ▸ Export ▸ glTF 2.0 with Draco compression enabled.",
      },
    ],
    troubleshooting: [
      {
        symptom: "All scatter points use only the first prop (rock_a) — other props never appear",
        cause:
          "Collection Info 'Separate Children' is off. When disabled, the node returns the entire collection as one block rather than as individually indexable children. The Instance Index input on Instance on Points then has nothing to pick between.",
        fix: "Select the Collection Info node. In the node properties (N-panel when the node is selected), enable 'Separate Children'. The instances output will immediately show the individual objects, and Pick Instance will start distributing across all four props.",
      },
      {
        symptom: "All instances are displaced far from the ground — they appear kilometres away",
        cause:
          "Transform Space is set to RELATIVE instead of ORIGINAL. RELATIVE applies the scatter object's world transform (position, rotation, scale) to every instance origin. If the ground plane sits at (0,0,0) this is invisible, but once the plane is moved or parented to another object, all instances shift by that offset.",
        fix: "In the Collection Info node properties, set Transform Space to ORIGINAL. Each prop is now placed at its own local-space origin (which blueprint.py sets to the base of each prop), and Instance on Points applies only the scatter point's position and the Rotate/Scale Instances adjustments.",
      },
      {
        symptom: "GLB file is tiny (< 1 KB) or opens empty in a viewer",
        cause:
          "The GN modifier was not applied before export. The modifier keeps instances in Blender's GN evaluation graph — they are not geometry yet. glTF export without applying the modifier exports only the base plane vertices, not the scatter.",
        fix: "Duplicate the scatter object (Shift+D, Escape to leave in place). Select the duplicate. In the modifier stack, click the dropdown arrow on HF_CollectionScatter → Apply. Now the duplicate is a plain mesh with all instances baked as real geometry. Export that duplicate. Delete it afterwards to keep the live GN tree intact.",
      },
    ],
    finalResult:
      "A 10 m² terrain plane scattered with four distinct low-poly props — rock, crystal, pebble, mushroom — drawn from a Collection Info palette via seeded random index selection. Single Seed parameter reshuffles the full scene. GLB exported with Draco 6 compression. 150-frame viewport recording of seed fan-out, camera orbit, and density swell.",
  },
  {
    slug: "blender-tutorial-gn-collection-info-pick-instance-asset-scatter",
    title:
      "GN Collection Info + Pick Instance — Randomised Multi-Asset Environmental Scatter (Blender 5.1)",
    date: "2026-06-19",
    kind: "tutorial",
    excerpt:
      "Use the Collection Info node (Separate Children = True) as an instance palette and drive Instance on Points' Pick Instance with a seeded Random Value (INT) to scatter four independent low-poly props across a terrain — no pre-combined meshes, one seed parameter to reshuffle everything.",
    tags: [
      "blender",
      "geometry-nodes",
      "collection-info",
      "pick-instance",
      "scatter",
      "environment",
      "instancing",
      "low-poly",
      "glb",
    ],
    Body: CollectionInfoScatterBody,
  },
);

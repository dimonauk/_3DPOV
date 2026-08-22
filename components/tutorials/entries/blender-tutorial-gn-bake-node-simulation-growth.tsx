import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnBakeNodeSimulationGrowthBody() {
  return (
    <>
      <p>
        Every Geometry Nodes Simulation Zone accumulates state frame by frame:
        frame&nbsp;N depends on frame&nbsp;N−1, which depends on frame&nbsp;N−2,
        and so on back to the initial conditions at frame&nbsp;0.  Without any
        disk cache, scrubbing to frame&nbsp;40 forces Blender to re-evaluate
        the entire 40-frame chain every time — acceptable once, exhausting if
        you are adjusting material settings or tweaking a camera.  The{" "}
        <strong>Bake node</strong> (introduced in Blender&nbsp;4.1, stabilised
        in&nbsp;5.1) solves this by writing the geometry state at every frame to
        compressed <code>.bnode</code> files on disk.  After a one-time bake
        the modifier reads those files instead of re-simulating, turning an
        O(N²) scrub into O(1).
      </p>

      <p>
        This tutorial builds a flood-fill activation simulation — a seed cluster
        of north-pole vertices spreads a cyan glow downward over a UV sphere, one
        topology ring per frame — and adds a Bake node immediately downstream of
        the Simulation Zone.  The simulation itself is a deliberate simplification:
        <code>GeometryNodeBlurAttribute</code> computes a single-ring weighted
        average of each vertex&rsquo;s <code>activated</code> value, and a{" "}
        <code>GREATER_THAN 0.15</code> comparison flips any vertex whose
        neighbours are at least 15&nbsp;% activated.  The interesting lesson is
        not the spreading rule — compare this with the full reaction&ndash;diffusion
        chemistry in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing"
          className={lk}
        >
          Grey-Scott Turing pattern tutorial
        </Link>{" "}
        for that — but the Bake node&rsquo;s placement, its cache path on disk, and
        the four operations the modifier panel exposes: Bake, Free, Resimulate,
        and Override Path.
      </p>

      <p>
        The <code>activated</code> attribute is stored as <code>FLOAT</code> rather
        than <code>BOOLEAN</code> because{" "}
        <code>GeometryNodeBlurAttribute</code> does not operate on boolean domains
        — it averages scalar or vector values across connected vertices.  Storing
        the attribute as 0.0 or 1.0 floats lets the blur propagate partial
        activation values that then trigger the threshold comparison.  The material
        reads <code>activated</code> through a{" "}
        <code>ShaderNodeAttribute</code> node with{" "}
        <code>attribute_type=&apos;GEOMETRY&apos;</code>, maps it through a
        ColorRamp (dark→cyan), and drives both <code>Emission Color</code> and{" "}
        <code>Emission Strength</code> on the Principled BSDF — the strength
        multiplier is above 1.0 so the exporter writes{" "}
        <code>KHR_materials_emissive_strength</code> into the GLB, preserving the
        bloom-level brightness in a Three.js WebXR scene.  See the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion"
          className={lk}
        >
          Blur Attribute heat-diffusion tutorial
        </Link>{" "}
        for a deep walk of the attribute averaging mechanics.
      </p>

      <p>
        Placement of the Bake node matters.  Put it <em>after</em> the Simulation
        Zone and it captures what the viewer will see — the final per-frame
        geometry with all attribute writes applied.  Put it{" "}
        <em>inside</em> the zone and it intercepts mid-evaluation state, which
        is correct only when you want to branch the simulation at that exact moment
        (an uncommon use case).  The node graph in this blueprint places the Bake
        node on the main geometry path between <code>SimulationOutput</code> and{" "}
        <code>GroupOutput</code>, a single link-hop that costs nothing at
        evaluation time when the bake is active — the modifier short-circuits
        to the disk read before the simulation zone is even entered.  For the
        comparable pattern in a physics context — baking cloth simulation frames
        to a point cache — see the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-cloth-simulation-waving-flag"
          className={lk}
        >
          cloth simulation waving flag tutorial
        </Link>
        , where the cache is per-object rather than per-node.
      </p>

      <p>
        The cache path defaults to{" "}
        <code>//simulation_cache/&lt;modifier_name&gt;/&lt;bake_node_id&gt;/</code>{" "}
        relative to the <code>.blend</code> file.  The bake node&rsquo;s ID is
        a stable integer assigned when the node is created; it does not change
        when you rename the node or the modifier.  Each frame writes one{" "}
        <code>.bnode</code> file — a binary container holding compressed geometry
        (vertex positions and any named attributes present on the geometry) for
        that frame.  At 24×16&nbsp;UV sphere resolution with one float attribute,
        frames run roughly 30–60&nbsp;KB each; 60&nbsp;frames totals about 2–4&nbsp;MB.
        More complex simulations with dense meshes and multiple attributes grow
        proportionally — the wave-reveal simulation in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-wave-reveal"
          className={lk}
        >
          simulation zone wave-reveal tutorial
        </Link>{" "}
        produces caches in the 20–50&nbsp;MB range per 60 frames for a 256×256
        grid.  The <em>Override Path</em> option in the modifier panel redirects
        the cache to an absolute path — useful when the blend file lives on a
        fast SSD but the cache should land on a separate scratch drive.
      </p>

      <p>
        For GLB export of a baked simulation, a depsgraph snapshot is the
        correct method: advance the scene to the target frame,
        call <code>obj.evaluated_get(depsgraph)</code> to get the modifier-baked
        state, and pass it to{" "}
        <code>bpy.data.meshes.new_from_object()</code>.  The resulting plain
        mesh carries the <code>activated</code> attribute in its vertex data,
        which the glTF exporter writes as a custom accessor (
        <code>_ACTIVATED</code> in the GLB JSON) when{" "}
        <code>export_attributes=True</code>.  A Three.js shader in the{" "}
        <Link href="/atelier" className={lk}>
          Atelier spatial viewer
        </Link>{" "}
        can read this accessor and replay the activation blend — turning what was
        a Blender simulation into a runtime material parameter.  The attribute
        accessor approach is the same mechanism used for elevation maps in the
        blob planet tutorial and per-tile latitude colours in the mesh-conform
        scatter tutorial.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-bake-node-simulation-growth",
  title:
    "GN Bake Node — Simulation Growth Cache: Crystal-Spread Frozen to Disk (Blender 5.1)",
  date: "2026-06-12",
  kind: "tutorial",
  excerpt:
    "GeometryNodeBake node placed downstream of a Simulation Zone freezes 60 frames of flood-fill activation spread to .bnode cache files, enabling O(1) timeline scrubbing. Covers bake placement (after vs inside sim zone), cache path structure, Free/Resimulate/Override Path operations, and GLB export of a single baked frame via depsgraph snapshot. BlurAttribute FLOAT spreading with GREATER_THAN threshold. Blender 5.1.",
  Body: GnBakeNodeSimulationGrowthBody,
};

export const entry = buildInstructable(
  {
    time: "40 minutes",
    difficulty: "intermediate",
    cost: "free — Blender 5.1, no add-ons",
    supplies: {
      materials: [
        "Blender 5.1",
        "blueprint.py from public/library/blends/geometry-nodes/gn-bake-node-simulation-growth/",
        "~4 MB disk space for bake cache",
      ],
      tools: [
        "3D Viewport › Rendered shading mode",
        "Geometry Node Editor (Ctrl-Space or header dropdown)",
        "Properties › Modifier panel (wrench icon)",
        "Scripting workspace (to run blueprint.py)",
        "Timeline (bottom of default layout)",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py and examine the scene",
        content: `Open Blender 5.1.  Switch to the Scripting workspace, click Open, and
load blueprint.py.  Click Run Script.

Switch to the Layout workspace.  In the 3D Viewport header, set shading
to Rendered mode (Z → Rendered, or the sphere icon).  You should see:
  - A UV sphere with a dark near-black material
  - A small cyan patch at the north pole — the seed vertices

Press Space to play the animation.  Watch the cyan activation spread downward
from the pole, one ring of vertices per frame, reaching the equator by roughly
frame 16 and the south pole by frame 25.  The Bloom effect gives each activated
vertex a soft radial glow.

Press Space to stop at any frame.  Scrub the timeline back to frame 1.
Notice the lag — Blender must re-evaluate the simulation from frame 0 to
reach the current frame.  On a 24×16 sphere this is fast, but on a dense mesh
with a complex simulation (like the Grey-Scott reaction-diffusion tutorial at
64×64 = 4096 vertices) scrubbing to frame 100 can take several seconds.
That is the problem the Bake node solves.`,
      },
      {
        title: "Locate the Bake node in the geometry node tree",
        content: `Select the crystal_sphere object.  Open the Geometry Node Editor
(Shift-F3, or change an area header type to Geometry Node Editor).

The modifier dropdown at the top of the editor should show CrystalSpreadBake.
If the tree is not visible, click the modifier name in the dropdown.

Walk the node tree from left to right:
  GroupInput (Geometry) → StoreNamedAttribute (seed init) →
  SimulationInput → [simulation zone contents] → SimulationOutput →
  [Bake node] → GroupOutput

Click the Bake node to select it.  Examine its two sockets:
  Input[0]:  Geometry — receives the simulation output
  Output[0]: Geometry — passes geometry through (when baked, reads from cache)

The Bake node has no numerical parameters — it is purely a cache intercept point.
When bake data is absent, the node is transparent: it passes geometry through
unchanged, exactly as if it were not in the tree.  This means you can add
a Bake node to any existing tree without altering the result until you
explicitly trigger a bake.

In the node's properties sidebar (N key → Item tab), you will see:
  Bake Mode: [Disabled / Baking / Baked]
  Bake Path: (blank until a bake is triggered)
  Bake Items: Geometry (automatically included)

The Bake Mode will show "Disabled" at this point — no cache data exists yet.`,
      },
      {
        title: "Trigger the bake from the modifier panel",
        content: `Open Properties → Modifier (wrench icon).  Expand the CrystalSpreadBake
modifier.

Scroll down past the node group inputs to find the Bake section.  You should
see a list item labelled with the Bake node's ID (a number like "Bake.001" or
similar) and three buttons: [Bake], [Free], and a path override field.

Click [Bake].

A progress bar appears in the lower-left corner of the screen, or in the
status bar, reading something like "Baking geometry nodes [frame X / 60]".
Blender evaluates the entire 60-frame simulation in order, capturing the
geometry state at the Bake node for each frame, and writes the results to:
  <blend_file_directory>/simulation_cache/CrystalSpreadBake/<bake_id>/

The bake typically finishes in under 5 seconds for this scene.

After the bake completes:
  - The modifier panel shows the Bake node status as "Baked" with a green icon
  - The Bake Path field shows the relative cache path
  - The [Bake] button is replaced by [Resimulate] and the [Free] button is active

Now scrub the timeline rapidly back and forth.  Playback is instant — the
modifier reads the .bnode file for each frame directly, skipping all simulation
evaluation entirely.  This is the core benefit: an O(1) cache lookup replaces
an O(N) simulation chain.`,
      },
      {
        title: "Inspect the cache files on disk",
        content: `Open a file manager (Windows Explorer, Finder, or Nautilus) and navigate
to the directory containing the blueprint.py file (or the blend file if you
saved it).

You should see a subdirectory:
  simulation_cache/
    CrystalSpreadBake/
      <bake_node_id>/    (a number, e.g. "2" or "3")
        0001.bnode
        0002.bnode
        ...
        0060.bnode

Each .bnode file is a binary compressed archive containing the geometry for
that frame: vertex positions, normals, and any named attributes (in this case
"activated", stored as float per vertex).

File sizes: at 24×16 UV sphere resolution, each .bnode is approximately 20–60 KB
uncompressed.  The exact size depends on attribute count and the Blosc compression
level Blender applies.

Total cache for 60 frames: approximately 2–4 MB — trivial compared to the
blend file itself or rendered images.  A more complex simulation (the 64×64
reaction-diffusion grid with conc_u and conc_v attributes) produces caches
of 8–20 MB for 180 frames.

To verify the attribute is in the cache, you can open a .bnode file in a hex
editor and search for the string "activated" — it appears in the attribute
name table near the file header.`,
      },
      {
        title: "Free the bake and modify the simulation",
        content: `Click [Free Bake] in the modifier panel.

The .bnode files are deleted from disk and the Bake Mode reverts to "Disabled".
Scrub the timeline — the simulation re-evaluates live again (with the familiar lag).

Now open the node tree and change the SPREAD_THRESHOLD parameter:
  Select the FunctionNodeCompare node (labelled "Compare" with "> 0.15")
  In the node's B input, change 0.15 to 0.35

Play the animation: the spread is now slower — each frame only activates
vertices where more than 35% of their neighbours are already active, requiring
a denser wavefront before propagation triggers.  The sphere fills by roughly
frame 40 instead of frame 25.

This illustrates the key insight: the Bake node does NOT lock the simulation
permanently.  Free the bake, modify any upstream node (spread rate, seed
threshold, blur iterations), and rebake to capture the new behaviour.
The cache is always exactly one [Bake] click away from being current.

After testing, restore the threshold to 0.15, then re-bake: [Bake].
The new cache matches the original behaviour.`,
      },
      {
        title: "Override the bake path to an absolute directory",
        content: `In the modifier panel, look at the path field next to the Bake node status.
It shows a relative path starting with // (blend-file-relative).

Click the path field and enter an absolute path, for example:
  /tmp/holoflow_bake_test/
  (or C:/tmp/holoflow_bake_test/ on Windows)

Click [Bake] again.  This time the cache files land in the specified directory
rather than alongside the blend file.

When to use an absolute path:
  - The blend file is on a slow network share; scratch cache on local SSD
  - Multiple blend files share the same bake (project-wide re-use)
  - A CI/build system renders the animation and the cache must be accessible
    to the rendering machine at a known location

To reset to the default relative path: clear the override field back to
empty (Blender will use //simulation_cache/... automatically).

Important: if you send a blend file to another artist without the cache,
the Bake node's mode will show "Disabled" on their machine (the cache path
is not found) and the simulation will re-evaluate live.  Include the
simulation_cache/ directory when distributing baked projects.`,
      },
      {
        title: "Export a single baked frame as GLB",
        content: `The blueprint.py script already ran export_snapshot_glb() which produced
crystal_spread_growth.glb at frame 22.  Here is the manual equivalent:

1. Make sure the bake is active (Bake Mode = "Baked")
2. Scrub to the desired export frame (e.g. frame 22 — roughly half the sphere
   activated)
3. In Python console or Scripting workspace, run:

   sc = bpy.context.scene
   dg = bpy.context.evaluated_depsgraph_get()
   obj = bpy.data.objects['crystal_sphere']
   eval_obj = obj.evaluated_get(dg)
   snap_me  = bpy.data.meshes.new_from_object(eval_obj, depsgraph=dg)
   snap_ob  = bpy.data.objects.new("snap", snap_me)
   sc.collection.objects.link(snap_ob)
   bpy.ops.object.select_all(action='DESELECT')
   snap_ob.select_set(True)
   bpy.ops.export_scene.gltf(
       filepath="//crystal_half_activated.glb",
       use_selection=True,
       export_attributes=True,
       export_draco_mesh_compression_enable=True,
       export_draco_mesh_compression_level=6,
       export_image_format='WEBP',
   )

The resulting GLB carries the "activated" attribute as a custom vertex
accessor (_ACTIVATED in the glTF JSON).  A Three.js material reading this
accessor can reconstruct the exact activation state at the exported frame —
useful for a "frozen moment" spatial scene where the activation boundary
is baked into the mesh data rather than re-computed at runtime.

export_attributes=True is required — without it the "activated" float
attribute is silently discarded and the GLB carries only positions + normals.`,
      },
    ],
    finalResult:
      "A Blender 5.1 UV sphere with a flood-fill activation simulation (BlurAttribute spreading from north-pole seed, GREATER_THAN 0.15 threshold) and a downstream Bake node that freezes 60 frames of simulation state to .bnode cache files. After baking, timeline scrubbing is instant. The scene exports a frame-22 snapshot GLB carrying the 'activated' float attribute as a custom glTF accessor. EEVEE-Next Bloom + KHR_materials_emissive_strength on the cyan emission material.",
    variations: [
      "Multi-seed initialisation: change the seed setup from a single north-pole cap to a random selection of faces. Replace the Compare(Z > threshold) branch with a Random Value node seeded by a Random Seed input integer, and use a Compare(> 0.98) threshold on the random output — roughly 2% of vertices start activated. Re-bake. The growth wavefronts collide and merge mid-sphere, producing a cellular territory pattern. The bake cache size is identical to the single-seed version — the Bake node captures geometry state regardless of the simulation dynamics.",
      "Per-frame attribute export for a WebXR animation: instead of exporting one GLB snapshot, export one GLB per frame (for the range you need) using a Python loop — bpy.context.scene.frame_set(fr); bpy.ops.export_scene.gltf(filepath=f'//frames/frame_{fr:04d}.glb', ...). A Three.js AnimationMixer then steps through the GLBs as morph target frames, replaying the activation spread at runtime. This approach sidesteps the lack of a Simulation Zone equivalent in the glTF spec: the entire simulation output is pre-baked into static GLB frames.",
      "Bake node inside the simulation zone for checkpointing: move the Bake node so it sits between two StoreNamedAttribute nodes INSIDE the zone. Bake to disk. Now you can restart the simulation from the baked checkpoint frame rather than from frame 0 — useful when tuning late-simulation behaviour without re-evaluating expensive early frames. Set the simulation's 'Start Frame' in the zone properties to the checkpoint frame number and re-bake from there. This is the GN equivalent of a physics point-cache partial bake.",
    ],
    troubleshooting: [
      {
        symptom: "The [Bake] button is missing from the modifier panel",
        cause:
          "The GN modifier does not contain a Bake node, or the Bake node is inside a nested node group that the modifier panel cannot surface. The modifier panel only shows Bake items for Bake nodes that are at the TOP LEVEL of the modifier's node group — Bake nodes inside sub-groups are not exposed.",
        fix: "Open the Geometry Node Editor and verify the Bake node (bl_idname: GeometryNodeBake) is directly in the root node group of the modifier, not inside a nested group. If it is inside a group, move it out to the root level. In Python: confirm the node exists with [n for n in mod.node_group.nodes if n.bl_idname == 'GeometryNodeBake'] — if the list is empty, the node is absent or in a nested group.",
      },
      {
        symptom: "Scrubbing the timeline is still slow after baking",
        cause:
          "The Bake node's mode has not switched to 'Baked'. This can happen if the bake was interrupted (e.g., Blender crashed mid-bake), leaving partial .bnode files on disk but the modifier still in 'Baking' state. The modifier will attempt to read from a partial cache but fall back to live simulation for missing frames.",
        fix: "Click [Free Bake] to clear the partial cache, then click [Bake] again to run a fresh complete bake. Check the simulation_cache/ directory after the free operation — ensure the <bake_node_id>/ subdirectory was deleted. If Blender crashed during bake, manually delete the simulation_cache directory before re-baking. On Linux/Mac: rm -rf simulation_cache/ from the blend file directory.",
      },
      {
        symptom: "The 'activated' attribute is absent from the exported GLB (no _ACTIVATED accessor in the JSON)",
        cause:
          "The glTF exporter was called without export_attributes=True (or its UI equivalent: Include → Custom Properties and Attributes → Attributes in the export dialog). Without this flag, only standard geometry data (positions, normals, UVs, vertex colours) is exported; custom named attributes are silently discarded.",
        fix: "Add export_attributes=True to the bpy.ops.export_scene.gltf() call, or in the export dialog check Include → Attributes. Note that even with this flag, the attribute domain must be POINT (vertex) for glTF export — FACE or EDGE domain attributes are not exportable in glTF 2.0. This blueprint stores 'activated' on the POINT domain, so it exports correctly.",
      },
    ],
  },
  base,
);

export { entry };

import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&rsquo;s{" "}
        <strong>Distribute Points on Faces</strong> node has two modes:{" "}
        <em>Random</em> (draw independently per unit area) and{" "}
        <em>Poisson Disk</em> (enforce a minimum separation between every pair
        of points). Random mode produces visible clumping — two points can be
        arbitrarily close — while Poisson Disk&rsquo;s blue-noise distribution
        matches the exclusion radius seen in biological scatter patterns:
        boulder fields, forest floors, coral heads. For the same perceived
        coverage, Poisson Disk needs roughly 30&nbsp;% fewer instances, which
        matters when you&rsquo;re targeting a WebXR polygon budget.
      </p>
      <p>
        This tutorial builds a complete terrain-scatter system: a procedural
        hill mesh, two faceted rock variants, a slope filter that strips cliff
        faces, per-point random Z rotation and uniform scale, then a single
        realised GLB ready for{" "}
        <Link href="/atelier" className={lk}>
          the Atelier WebXR viewer
        </Link>
        .
      </p>

      <h2>Poisson Disk vs Random — the one-line rule</h2>
      <p>
        Use <strong>Random</strong> when you want statistically uniform coverage
        and clumping is acceptable (particle rain, procedural dust). Use{" "}
        <strong>Poisson Disk</strong> when silhouette variety matters and you
        cannot afford points touching each other (rocks, trees, characters).
        The two modes expose different sockets: Random uses{" "}
        <code>Density</code> (points/m²); Poisson Disk uses{" "}
        <code>Distance Min</code> + <code>Density Max</code>. Switching modes
        in the node panel rewires the visible sockets — if you have an
        existing link to <code>Density</code> it will break silently on a mode
        switch, so check connections after changing.
      </p>

      <h2>Slope selection mask</h2>
      <p>
        The <code>Selection</code> input accepts a Boolean field evaluated per
        face. Wiring{" "}
        <code>Input Normal → Separate XYZ → Z → Compare (GREATER_THAN 0.25)</code>{" "}
        passes only faces within ~76&nbsp;° of horizontal. Why 0.25 and not a
        nicer threshold like 0.5? Because terrain normals are interpolated
        across the face — a face with an average tilt of 30&nbsp;° (
        <code>Normal.z ≈ 0.87</code>) is perfectly walkable but its boundary
        quads can average down to 0.3 when pressed against a cliff. Setting the
        threshold low enough (0.2–0.3) avoids over-pruning.
      </p>
      <p>
        This mask is the correct place for a{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-index-switch-lod-mesh-kit"
          className={lk}
        >
          vertex-group density weight
        </Link>{" "}
        too: paint a Named Attribute{" "}
        <code>scatter_density</code> (FLOAT, FACE domain) and multiply it
        into the Compare threshold via a Math node — full artist control over
        where rocks appear without touching the node tree.
      </p>

      <h2>Per-point random values — the ID socket</h2>
      <p>
        <code>FunctionNodeRandomValue</code> has two seed inputs:{" "}
        <code>Seed</code> (the global sequence seed, same for all points) and{" "}
        <code>ID</code> (a per-element offset). If you leave{" "}
        <code>ID</code> unconnected every scattered point draws the same scalar
        — all rocks become identical clones at the same Z rotation and scale.
        Connect <code>GeometryNodeInputIndex → ID</code> on every RandomValue
        node to restore per-point uniqueness. Use different{" "}
        <code>Seed</code> offsets (+1, +2) for rotation vs scale so those two
        random sequences are statistically independent.
      </p>

      <h2>Normal-aligned rotation + local Z twist</h2>
      <p>
        The scatter node&rsquo;s <code>Rotation</code> output is a ROTATION
        type pre-aligned to the face normal — connecting it directly to
        InstanceOnPoints&rsquo;s <code>Rotation</code> socket makes every rock
        sit flush with the slope for free. To add per-rock twist without
        tilting off the slope, use{" "}
        <code>RotateInstances(Local Space = True)</code> with an{" "}
        <code>AxisAngleToRotation(Axis=(0,0,1), Angle=random)</code> rotation.
        Local Space means the Z axis of{" "}
        <em>each instance&rsquo;s own frame</em> — which is the surface normal
        — so the twist is a spin around the slope, not around world Z.
      </p>

      <h2>Uniform scale via CombineXYZ</h2>
      <p>
        <code>ScaleInstances</code> takes a VECTOR for scale, not a float. For
        truly uniform scale (same multiplier on all three axes), wire the same{" "}
        <code>FunctionNodeRandomValue</code> output to all three channels of a{" "}
        <code>CombineXYZ</code> node. Using{" "}
        <code>RandomValue(FLOAT_VECTOR)</code> instead would draw an
        independent random per axis, producing squashed or stretched rocks —
        useful for pebbles, wrong for boulders.
      </p>

      <h2>Realise before export</h2>
      <p>
        Instances are lazy references — the GLB exporter writes zero geometry
        for an unrealised instance tree.{" "}
        <code>RealizeInstances</code> expands every instance into real mesh
        faces. Pair it with{" "}
        <code>JoinGeometry</code> to merge terrain and rocks into one mesh
        before the Group Output, keeping the GLB as a single draw call. For
        scenes where you need per-rock collision or selection in the WebXR
        runtime, keep rocks as separate objects and skip JoinGeometry — just
        realise and export with the Select Hierarchy option in the glTF
        exporter.
      </p>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-geometry-to-instance-multi-variant-prop-scatter"
            className={lk}
          >
            GN Geometry to Instance — Multi-Variant Prop Scatter
          </Link>{" "}
          — for scattering with geometry collections rather than two Object
          Info nodes.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-modifier-decimate-lod-webxr-planar-collapse"
            className={lk}
          >
            Modifier — Decimate: Planar, Collapse and Un-Subdivide for WebXR LOD
          </Link>{" "}
          — reduce the realised rock mesh polygon count for mobile WebXR.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-batch-glb-exporter"
            className={lk}
          >
            Python — Batch GLB Exporter
          </Link>{" "}
          — automate export of terrain variants with different seeds into a
          folder of GLBs for procedural level generation.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-repeat-zone-iterative-lsystem-branch-growth"
            className={lk}
          >
            GN Repeat Zone — Iterative L-System Branch Growth
          </Link>{" "}
          — combine with this tutorial: scatter branch-growth tree instances
          onto terrain for a full forest scene.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-distribute-points-on-faces-poisson-disk-terrain-scatter",
  title:
    "GN Distribute Points on Faces — Poisson-Disk Terrain Scatter with Slope Filter in Blender 5.1",
  date: "2026-06-26",
  kind: "tutorial",
  excerpt:
    "Use Blender 5.1's Distribute Points on Faces in Poisson-Disk mode to scatter two faceted rock variants across a procedural terrain, with a Normal.z slope filter, per-point random rotation and uniform scale, and a single-mesh Draco GLB for WebXR.",
  Body,
};

export const entry = buildInstructable(
  {
    topic: "geometry-nodes",
    subtopic: "Distribute Points on Faces / Poisson Disk Scatter",
    sources: [
      {
        title: "Blender Manual — Distribute Points on Faces",
        url: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/point/distribute_points_on_faces.html",
        licence: "CC-BY-SA 4.0",
        author: "Blender Foundation",
        related: [
          "https://projects.blender.org/blender/blender",
          "https://developer.blender.org/docs/",
        ],
      },
      {
        title:
          "Fast Poisson Disk Sampling in Arbitrary Dimensions — Robert Bridson, SIGGRAPH 2007",
        url: "https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf",
        licence: "Academic / Public Domain algorithm",
        author: "Robert Bridson, University of British Columbia",
        related: [
          "https://github.com/corporateshark/poisson-disk-generator",
        ],
      },
    ],
    steps: [
      {
        title: "Create the terrain mesh",
        body: "Run blueprint.py from the Scripting workspace (New Text → paste → Run Script). A 40×40 grid displaced by fractal Brownian motion appears. Shade Smooth is applied automatically.",
      },
      {
        title: "Inspect the Geometry Nodes modifier",
        body: "Select the terrain. Properties panel → Modifier stack → HS_Scatter. You will see Min Distance, Density Max, and Seed sliders. These map directly to the Group Input sockets in the node tree.",
      },
      {
        title: "Explore the slope mask",
        body: "Open Geometry Nodes editor (Shift-F3). Find the path: Input Normal → Separate XYZ → Z → Compare (GREATER_THAN). Change the threshold B value on the Compare node. Set it to 0.9 — only near-flat faces scatter rocks. Set it to 0.0 — all faces scatter rocks, including vertical cliffs.",
      },
      {
        title: "Test Poisson Disk vs Random",
        body: "In the Distribute Points on Faces node, change distribution_type from POISSON_DISK to RANDOM (node property dropdown). At the same density the Random scatter shows visible clumping. Switch back to POISSON_DISK to see the blue-noise distribution.",
      },
      {
        title: "Change the scatter seed",
        body: "In the modifier panel, change the Seed value. The scatter re-randomises instantly — rock positions, rotations, and scales all change without re-running the script. This is the live parameter control that makes GN scatter authoring non-destructive.",
      },
      {
        title: "Export the GLB",
        body: "File → Export → glTF 2.0. Enable Apply Modifiers and Draco mesh compression Level 6. Export to terrain_scatter.glb. The exported file contains terrain geometry + all realised rock faces as a single mesh.",
      },
    ],
    troubleshooting: [
      {
        symptom: "No rocks appear — terrain is bare after running blueprint.py",
        cause: "The rock objects (rock_a, rock_b) were removed by the purge() call if you re-ran the script in an existing session.",
        fix: "Run blueprint.py on a fresh Blender start (File → New → General, then run script). The purge() at the top clears all objects from the previous session before rebuilding.",
      },
      {
        symptom: "AttributeError: 'FunctionNodeRandomValue' has no attribute 'data_type'",
        cause: "Running Blender older than 4.1. FunctionNodeRandomValue gained the data_type property and ID socket in 4.1.",
        fix: "Upgrade to Blender 4.1 or later. In 5.1 both data_type and the ID socket are stable API.",
      },
      {
        symptom: "All rocks have identical Z rotation (no twist variety)",
        cause: "GeometryNodeInputIndex is not connected to the ID socket of FunctionNodeRandomValue for rotation.",
        fix: "In the node tree, find rand_z (FunctionNodeRandomValue). Confirm the link from GeometryNodeInputIndex output 'Index' → rand_z input 'ID'. If missing, add the Index node and wire it.",
      },
      {
        symptom: "Rocks are non-uniformly squashed (tall and thin, or flat)",
        cause: "FunctionNodeRandomValue with data_type='FLOAT_VECTOR' was used for scale instead of FLOAT + CombineXYZ. FLOAT_VECTOR draws three independent randoms.",
        fix: "Change the scale RandomValue data_type to 'FLOAT' and wire its single output to all three CombineXYZ inputs (X, Y, Z all connected to same socket).",
      },
      {
        symptom: "GLB is empty — 0 KB file",
        cause: "RealizeInstances or JoinGeometry is not in the node tree, so the exporter sees no concrete geometry.",
        fix: "Verify the chain: ScaleInstances → RealizeInstances → JoinGeometry → Group Output. Each node must be linked; check for broken (red) links in the GN editor.",
      },
      {
        symptom: "Rocks spawn on vertical cliff faces despite SLOPE_MIN = 0.25",
        cause: "bm.normal_update() was not called before bm.to_mesh() in make_terrain(). Blender computed stale normals from the pre-displaced mesh.",
        fix: "The blueprint.py already calls bm.normal_update() after displacement. If you modified the script and removed this call, add it back before bm.to_mesh(mesh).",
      },
    ],
    finalResult:
      "An 8×8 m terrain mesh with two faceted rock variants scattered via Poisson-Disk blue-noise, cliff faces excluded by a slope filter, per-point random Z rotation and 0.5–2.2× uniform scale variation, exported as a single Draco L6 GLB under 2 MB suitable for WebXR environments.",
    variations: [
      "Density vertex group: paint a vertex colour or Named Attribute 'scatter_density' (FLOAT, VERTEX domain) on the terrain. Transfer to FACE domain via Evaluate on Domain. Multiply into Density Max to create clearings, paths, or dense thickets — without touching the node tree.",
      "Multi-variant IndexSwitch with 4 variants: replace the Modulo 2 picker with a Modulo 4 node and extend the IndexSwitch to four Object Info inputs (boulder, pebble, stump, mushroom). The distribution logic is unchanged.",
      "Slope-stratified scatter: chain two Distribute Points nodes — one for SLOPE_MIN=0.6 (steep faces → sparse lichen rocks), one for SLOPE_MIN=0 with Selection inverted (flat faces → dense grass tufts). JoinGeometry both point clouds before InstanceOnPoints.",
    ],
  },
  base,
);

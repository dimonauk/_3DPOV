import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Most Geometry Nodes tutorials reach for the{" "}
        <code>Index</code> node when they need to stagger a per-instance
        animation: take the scatter index, divide by some constant, use it
        as a phase.  The problem is that{" "}
        <code>Index</code> returns Blender&apos;s internal traversal order,
        which follows neither spatial position nor any predictable pattern.
        Change the scatter seed or the density and the stagger order reshuffles
        completely — not art-directable.{" "}
        <strong>Accumulate Field</strong> solves this with a{" "}
        <code>Sort Index</code> socket that reorders the accumulation before
        it runs, giving you a spatially deterministic rank per instance.  Wire{" "}
        <code>floor(position.X × 100)</code> into Sort Index and you get a
        left-to-right rank 0 … N−1 that is stable across any seed or density
        change.
      </p>

      <p className="mt-4">
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-repeat-zone-crystal-antenna-webxr"
          className={lk}
        >
          Repeat Zone tutorial
        </Link>{" "}
        threads a single piece of geometry through N iterations — each
        iteration adds to it.  Accumulate Field is the per-point analogue:
        instead of adding geometry, it adds a scalar (1.0 per element) and
        returns both the running total <em>before</em> the current element
        (Leading) and the grand total.  Leading ÷ Total = phase.  Apply that
        phase to Scene Time and each hex pillar gets its own independent
        reveal window, offset by{" "}
        <code>phase × STAGGER_DUR</code> seconds.  The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-verlet-rope-cable-physics"
          className={lk}
        >
          Simulation Zone rope tutorial
        </Link>{" "}
        uses Scene Time to advance a physics state one step per frame;
        here we use it differently — not as a step counter but as a continuous
        parameter evaluated identically on every frame.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Why Poisson disk, and why does the density input live on the modifier?
      </h2>
      <p className="mt-2">
        Poisson disk sampling guarantees a minimum separation between points,
        eliminating the clumped pairs that Random scatter produces.  The result
        looks like it was placed by hand.  The trade-off is a slightly longer
        evaluation time (~2 ms overhead at Density = 5 pts/m²) and the fact
        that Distance Min must be set consistently with Density Max to avoid the
        sampler giving up mid-grid.  This blueprint uses{" "}
        <code>0.85 / sqrt(DENSITY)</code> as the minimum — just inside the
        theoretical Poisson radius, leaving the sampler enough headroom to fill
        corners.  Density Max is wired from a Group Input socket so it appears
        as a keyframeable slider in the modifier panel alongside Stagger Duration
        and Rise Time: all three are adjustable without re-running the script.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        The hex pillar template and the Z-scale trick
      </h2>
      <p className="mt-2">
        A Blender cylinder is centred at its origin by default — it extends from
        −Depth/2 to +Depth/2 along Z.  If you drive its Z scale from 0 to 1 directly,
        the pillar shrinks symmetrically: it appears to collapse inward rather than
        grow from the ground.  The fix is a{" "}
        <code>Transform Geometry</code> node that translates the cylinder up by{" "}
        <code>PILLAR_H / 2</code> before instancing — placing the base at Z = 0.
        With the base anchored at world origin, scaling Z from 0 to 1 grows the
        pillar upward cleanly.  The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-index-of-nearest-point-connection-web-circuit-board-webxr"
          className={lk}
        >
          Index of Nearest circuit board tutorial
        </Link>{" "}
        uses a similar per-instance transform trick for aligning edge tubes.
      </p>

      <p className="mt-2">
        Six cylinder segments give a hexagonal cross-section — one vertex per
        flat face, consistent with the Holoflow faceted aesthetic and roughly
        25 % fewer triangles than an octagonal column.  For export, Realise
        Instances bakes the instance data to mesh geometry before the GLB
        serialiser sees it; without this step{" "}
        <code>export_apply=True</code> still bakes the modifier but you lose the
        ability to inspect individual instance counts inside Blender.  The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-interpolate-domain-face-random-hue-vertex-colour-flat-shaded-webxr"
          className={lk}
        >
          Interpolate Domain tutorial
        </Link>{" "}
        explains why domain realisation matters when attributes must survive the
        instance-to-mesh boundary.
      </p>

      <p className="mt-4 text-sm text-zinc-400">
        Outside source — Blender Foundation: Accumulate Field node reference,
        CC BY-SA 4.0.{" "}
        <a
          href="https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/utilities/field/accumulate_field.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org
        </a>
        {" "}· sibling:{" "}
        <a
          href="https://projects.blender.org"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          projects.blender.org
        </a>
        .  Outside source — Robert Guetzkow,{" "}
        <a
          href="https://github.com/robertguetzkow/blender-python-examples"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          blender-python-examples
        </a>{" "}
        (MIT).  Related:{" "}
        <a
          href="https://github.com/robertguetzkow/blender-addon-clean-up-imported-materials"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          blender-addon-clean-up-imported-materials
        </a>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-accumulate-field-staggered-reveal-webxr",
  title:
    "GN Accumulate Field — Staggered Hex-Pillar Reveal Animation for WebXR (Blender 5.1)",
  date: "2026-07-04",
  kind: "tutorial",
  excerpt:
    "Use Accumulate Field's Sort Index to impose a left-to-right spatial rank on Poisson-scattered points, then drive each hex pillar's rise time from its normalised rank. The result is a directed wave of hexagonal columns emerging from a flat grid — ready to export as a GLB for WebXR scene-entry animations.",
  Body,
};

export const entry = buildInstructable(
  {
    time: "one afternoon",
    difficulty: "intermediate",
    cost: "free — Blender 5.1 and this script",
    supplies: {
      materials: [
        "Blender 5.1 (EEVEE Next renderer)",
        "blueprint.py from this library entry",
        "record.py for the viewport render",
      ],
      tools: [
        "Geometry Nodes editor",
        "Python Script editor (for blueprint.py)",
        "glTF validator (optional) — gltf-validator.khronos.org",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py and inspect the modifier panel",
        body: "Open a new Blender 5.1 session.  In the Text Editor, open blueprint.py and press Run Script.\n\nA thin host plane appears with the StaggerReveal GN modifier active.  In the Properties panel → Modifier (wrench icon) you will see three sliders:\n  Density          = 5.0\n  Stagger Duration = 3.0\n  Rise Time        = 0.40\n\nPress Spacebar.  At frame 0 all pillars have Z scale = 0 and are invisible.  By frame 90 (3 s) the rightmost pillars should be at full height.",
      },
      {
        title: "Trace the Accumulate Field node graph",
        body: "Switch to the Geometry Node Editor.  Pan left to find the Accumulate Field node (green border, centre-left of the graph).\n\nIts inputs:\n  Value      = 1.0 (constant — accumulates a running integer count)\n  Group ID   = unconnected (default 0 → single group covering all points)\n  Sort Index = wired from Math(FLOOR) ← Math(MULTIPLY, ×100) ← SeparateXYZ.X ← InputPosition\n\nIts outputs:\n  Leading = rank of this element (0 to N−1)\n  Total   = N (total point count in this evaluator pass)\n\nRight-click → View → Zoom to fit to see the full graph.  Identify the math chain: Leading / Total → phase → × STAGGER_DUR → offset_t → Subtract from Seconds → Divide by RISE_TIME → Clamp → CombineXYZ.Z → InstanceOnPoints.Scale.",
      },
      {
        title: "Understand why Sort Index matters",
        body: "Temporarily disconnect the Sort Index wire (click the socket and drag away).  Scrub through the timeline.  The reveal order is now the internal Poisson traversal order — spatially random.\n\nReconnect the Sort Index wire.  The wave is left-to-right again.\n\nNow change the Seed on the DistributePointsOnFaces node (Properties → Modifier → Seed, or click the node's Seed input).  The wave STILL moves left-to-right because the Sort Index maps position.X, not scatter index.  This is the deterministic spatial rank guarantee that the plain Index node cannot provide.",
      },
      {
        title: "Tune the timing parameters",
        body: "In the modifier panel:\n\n  Stagger Duration 3.0 → 1.0   — wave completes in ~1.4 s total (STAGGER_DUR + RISE_TIME)\n  Rise Time        0.4 → 0.1   — each pillar snaps up nearly instantly\n  Rise Time        0.1 → 1.5   — pillars overlap heavily; multiple are mid-rise at once\n\nRule of thumb: perceived animation quality peaks when Rise Time ≈ 0.3 × STAGGER_DUR.  Longer Rise Time creates visible overlap (organic); shorter creates crisp sequential pop (mechanical).\n\nFor a WebXR scene-entry animation, 0.25 × total duration for STAGGER_DUR and 0.35 × STAGGER_DUR for RISE_TIME feels natural at typical room-scale viewing distance.",
      },
      {
        title: "Export the static frame GLB",
        body: "Set frame to 0 (all pillars flat) for a 'before' state, or frame 90 (all pillars up) for the 'completed grid' state.\n\nFrom the Text Editor, or from a terminal:\n  blender --background stagger_reveal.blend --python blueprint.py\n\nThe export section of blueprint.py is at the bottom of main():\n  bpy.ops.export_scene.gltf(\n      filepath='//stagger_reveal_frame000.glb',\n      export_format='GLB',\n      export_apply=True,\n      export_yup=True,\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_image_format='WEBP',\n  )\n\nExpected output: stagger_reveal_frame000.glb, ~30–80 KB (Draco 6 compresses hex geometry well).  Validate with gltf-validator: mesh.primitives[0].attributes.POSITION should report ~750 vertices at DENSITY=5.",
      },
      {
        title: "Record the reveal animation with record.py",
        body: "With stagger_reveal.blend open, run record.py from the Text Editor.\n\nrecord.py sets up:\n  Camera at (−3.5, −7.5, 6.0) — diagonal elevated view showing the left-to-right wave\n  Sun key light (energy 3.5, sharp angle 0.08 rad for toon shadow definition)\n  Area rim light from behind-left\n  Dark world background\n  EEVEE Next, 1920×1080, 30 fps, frames 0–149 (5 s)\n\nOutput: public/library/videos/geometry-nodes/gn-accumulate-field-staggered-reveal-webxr/viewport.mp4\n\nFor the screen recording, follow SCREEN-RECORDING-NOTES.md: capture ~90 s showing the modifier panel, node graph, Sort Index disconnect test, and live parameter tuning.",
      },
    ],
    finalResult:
      "A Geometry Nodes modifier that drives a left-to-right wave of ~125 hexagonal pillars rising from a flat Poisson-scattered field. Three keyframeable modifier inputs (Density, Stagger Duration, Rise Time) give real-time control without re-running any script. Exports as stagger_reveal_frame000.glb (~30–80 KB, Draco 6, +Y up, WebP) for direct use in WebXR scene-entry animations or Three.js.",
    variations: [
      "Radial wave (outward from centre): replace position.X with the distance from the grid origin — sqrt(pos.X² + pos.Y²). Wire that distance (after scaling to int) as the Sort Index. The wave now ripples outward from the centre of the grid.",
      "Random stagger (controlled randomness): replace the sort-by-X chain with FunctionNodeRandomValue(seed=Index, min=0, max=10000) cast to Int. Each pillar rises at a random time but deterministic per seed — change the seed socket's value to get a different random reveal order without losing repeatability.",
      "Per-axis colour fade: add a second Accumulate Field with the same Sort Index and Value = (0.0, 0.9, 1.0, 1.0) colour. The Leading output gives a per-pillar colour that interpolates from dark (early) to bright (late) across the wave — combine with a ColourAttribute bake and a WebXR vertex colour shader for a gradient reveal effect.",
    ],
    troubleshooting: [
      {
        symptom: "All pillars appear at the same time (no stagger effect)",
        cause:
          "The Sort Index socket is not connected, or Accumulate Field is returning Total = 0 because the DistributePointsOnFaces node has no faces to sample.",
        fix:
          "Check that the MeshGrid node is wired to DistributePointsOnFaces.Mesh and that Density Max > 0.  In the Python console: mod = bpy.context.active_object.modifiers['StaggerReveal']; print(mod.node_group.nodes['Accumulate Field'].inputs[2].links) — should show one link from the floor Math node.",
      },
      {
        symptom: "Wave runs right-to-left instead of left-to-right",
        cause:
          "The object or grid has a negative X scale baked in, flipping world-space X for the position field.",
        fix:
          "Select the host object, apply scale (Ctrl+A → Scale), then re-run blueprint.py.  Alternatively, negate the Sort Index: add a Math(MULTIPLY, −1) node between SeparateXYZ.X and the ×100 chain.",
      },
      {
        symptom: "GLB exports 0 triangles",
        cause:
          "export_apply=False, or the Realise Instances node is missing from the GN tree.",
        fix:
          "Confirm export_apply=True in the bpy.ops.export_scene.gltf call.  In the GN editor, verify that a Realise Instances node sits between Instance on Points and Set Material.  Without it, the GLB serialiser sees instance data the glTF format cannot represent.",
      },
      {
        symptom: "Pillars overlap and clip through each other",
        cause:
          "PILLAR_R is too large relative to the Poisson Distance Min, or DENSITY is so high that Distance Min is smaller than PILLAR_R.",
        fix:
          "Keep PILLAR_R < 0.4 / sqrt(DENSITY).  At DENSITY=5 that is PILLAR_R < 0.18 m; the default 0.09 m has a comfortable 2× margin.  Halve DENSITY or reduce PILLAR_R.",
      },
    ],
  },
  base,
);

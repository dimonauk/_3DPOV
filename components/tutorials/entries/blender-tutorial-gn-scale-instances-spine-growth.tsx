import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnScaleInstancesSpineGrowthBody() {
  return (
    <>
      <p>
        <strong>Scale Instances</strong> is the procedural instancing node that
        most tutorials skip past in favour of its flashier neighbour, Instance on
        Points.  But Scale Instances is the piece that transforms a uniform stamp
        into an organic field: it reads an independent scale value per instance
        and applies it in the instance&apos;s own local coordinate space.  This
        tutorial builds a porcupine-bristle sphere — 642 outward-pointing cones
        grown from an IcoSphere surface — where noise, latitude, and an animated{" "}
        <code>Grow_Factor</code> socket together determine how tall each spine
        grows.  The final result exports cleanly to GLB for WebXR delivery.
      </p>

      <h2>Scale Instances vs Transform Instances</h2>
      <p>
        Both nodes manipulate instance transforms, but they operate at completely
        different granularities. <em>Transform Instances</em> applies one uniform
        translation, rotation, or scale delta to the entire instance set — every
        instance moves or grows by the same amount.  <em>Scale Instances</em>{" "}
        accepts a <strong>field</strong> for its Scale input: a value evaluated
        independently per instance, just like any other GN field.  This means you
        can wire a noise texture, a per-element attribute, or a mathematical
        expression into the Scale socket and each instance will receive its own
        unique scale value.  There is no loop, no For Each zone, no index
        arithmetic — the field graph handles the per-instance evaluation
        automatically.
      </p>
      <p>
        The practical consequence: the whole spine-growth system — noise macro
        pattern, latitude compression, and animation multiplier — is expressed in
        a single short math chain wired into one socket.  The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-for-each-element-hex-panel"
          className={lk}
        >
          For Each Element zone
        </Link>{" "}
        would be needed here only if you required cross-iteration state (e.g.,
        each spine&apos;s height depending on its neighbours).  Scale Instances
        assumes each instance is independent, which is exactly the organic case.
      </p>

      <h2>Local Space pivot: the two settings that matter</h2>
      <p>
        The Scale Instances node has two inputs that most documentation glosses
        over: <strong>Local Space</strong> and <strong>Center</strong>.
      </p>
      <p>
        <code>Local Space = True</code> maps the scale to the instance&apos;s{" "}
        <em>own</em> coordinate axes.  For spines on a sphere every cone is
        tilted to point outward — its local Z is aligned to the surface normal
        via{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-instance-on-points"
          className={lk}
        >
          Align Euler to Vector
        </Link>
        .  Setting Local Space to False would apply the scale in <em>world</em>{" "}
        Z — a vertical squash/stretch in world space — which shears any cone
        tilted away from the world Y-up axis.  The spine at the equator (pointing
        horizontally) would be scaled in world-up and appear to grow sideways
        rather than outward.
      </p>
      <p>
        <code>Center = (0, 0, 0)</code> in LOCAL space is the cone&apos;s base
        vertex — the point touching the sphere surface.  With this setting the
        cone grows outward from its attachment point.  If you set Center to{" "}
        <code>(0, 0, SPINE_LENGTH / 2)</code> the pivot moves to the cone
        midpoint, and scaling makes the base retract INTO the sphere at the same
        rate as the tip extends out.  Setting Center to{" "}
        <code>(0, 0, SPINE_LENGTH)</code> puts the pivot at the tip: the base
        plunges into the sphere and the tip stays fixed — useful for a draping
        animation but incorrect for a grow-from-root reveal.
      </p>

      <h2>Three-layer scale formula</h2>
      <p>
        The scale field is assembled from three independent multipliers that the
        CombineXYZ node packs into a{" "}
        <code>(1.0, 1.0, combined_z)</code> vector (X and Y remain at 1.0 so the
        cone&apos;s radial profile never changes):
      </p>
      <ul>
        <li>
          <strong>Noise layer</strong> — a 3D Noise Texture (Scale 2.4, Detail 3,
          Roughness 0.55) evaluated at each vertex world position gives a
          continent-like blob pattern across the sphere.  Its Fac output (0–1) is
          remapped to [0.18, 1.0] via MapRange with SMOOTHSTEP interpolation to
          round off the hard edges between patches.
        </li>
        <li>
          <strong>Latitude layer</strong> — the vertex world Z coordinate is
          separated, made absolute, then remapped: equator (|Z|=0) → 1.0 (full
          height), poles (|Z|≈1) → 0.42 (compressed).  This mirrors the organic
          thinning seen in real porcupine quill distributions and avoids visual
          crowding where outward cones converge near both poles.  Compare this
          with the{" "}
          <Link
            href="/tutorials/blender-tutorial-gn-set-position-noise-displacement"
            className={lk}
          >
            Blob Planet tutorial
          </Link>
          , which uses the same position-sampling pattern to drive noise
          displacement amplitude.
        </li>
        <li>
          <strong>Grow Factor layer</strong> — the Group Input socket (0 → 1).
          Multiplied last so it uniformly gates all other variation.  At
          Grow_Factor = 0 every spine collapses to a flat disc regardless of
          noise or latitude; the growth reveal is therefore always coherent across
          the full sphere surface simultaneously.
        </li>
      </ul>

      <h2>Noise texture in the GN graph</h2>
      <p>
        <code>ShaderNodeTexNoise</code> is available in the Geometry Nodes editor
        as a field node — it is not confined to the shader graph.  It evaluates
        the Blender noise function at a Vector input (here: InputPosition per
        vertex) and outputs Fac (scalar) and Color (RGB).  The same approach
        drives the displacement field in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-repeat-zone-crystal-cluster"
          className={lk}
        >
          Crystal Cluster
        </Link>{" "}
        tutorial via a Repeat Zone, but Scale Instances eliminates the need for
        a zone entirely: the noise evaluates once per instance during the normal
        field traversal.
      </p>
      <p>
        The <code>3D</code> noise dimensions mode is correct here — it evaluates
        in world-space 3D rather than UV-space 2D or animated 4D.  Because the
        IcoSphere has no UV map and the scale variation should be independent of
        viewing angle or time, 3D is the clean choice.  Increasing Roughness
        above 0.7 produces a cragger surface that can make equatorial spines look
        broken; keeping it at 0.55 gives smooth continental patches.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>All spines are the same height</strong> — the Noise Texture may
          not be connected to Scale Instances.  Check the wire runs from Noise →
          MapRange → Multiply → CombineXYZ → Scale Instances Scale input.  Use
          Ctrl+Shift+click (Node Wrangler) to preview each node and confirm values
          change per vertex in the Spreadsheet.
        </li>
        <li>
          <strong>Spines shear sideways when rotating the sphere</strong> — Local
          Space is set to False.  Enable it on the Scale Instances node.
        </li>
        <li>
          <strong>Spines collapse inward (base retracts) instead of growing out</strong>{" "}
          — Center is not at (0, 0, 0) local.  Reset the Center vector on Scale
          Instances to (0, 0, 0).
        </li>
        <li>
          <strong>Polar spines are the same length as equatorial ones</strong> —
          the latitude MapRange is missing.  Confirm SeparateXYZ → Absolute →
          MapRange is wired into the second Multiply node, not bypassed.
        </li>
        <li>
          <strong>GLB export produces no geometry</strong> — Realize Instances
          must sit between Scale Instances and Group Output.  The glTF exporter
          with export_apply=True realises GN but Realize Instances inside the GN
          graph is the safer, more explicit choice.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-scale-instances-spine-growth",
  title:
    "GN Scale Instances — Noise-Driven Organic Spine Growth on a Sphere (Blender 5.1)",
  date: "2026-06-06",
  kind: "tutorial",
  excerpt:
    "Use Scale Instances with Local Space = True and a (1, 1, Z) vector field to grow 642 cone spines outward from an IcoSphere. A three-layer scale formula — noise × latitude compression × animated Grow_Factor — drives organic variation without a For Each zone or index arithmetic.",
  Body: GnScaleInstancesSpineGrowthBody,
};

export const entry = buildInstructable(
  {
    time: "one evening",
    difficulty: "intermediate",
    cost: "free",
    goal: "Build an organic porcupine-bristle sphere using Scale Instances with a noise × latitude × animation field driving per-spine height.",
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
      materials: [],
      tools: [],
    },
    steps: [
      {
        title: "Run blueprint.py to build the scene",
        body: "In Blender, open the Scripting workspace, load blueprint.py, and run it. Blender resets to an empty scene, creates the IcoSphere, builds the GN modifier tree, and saves spine_growth.blend. Switch to the Layout workspace and confirm the modifier is active on the sphere.",
      },
      {
        title: "Verify cone alignment",
        body: "Set Viewport Shading to Solid and orbit the sphere. Every spine should point radially outward — no spines lying flat or pointing inward. If any are misaligned, check the FunctionNodeAlignEulerToVector node has axis='Z' and the InputNormal wire is connected to its Vector input.",
      },
      {
        title: "Test the Grow Factor socket",
        body: "In the GN modifier properties (the wrench icon), find the Grow Factor slider. Drag it to 0 — all spines should collapse to flat discs. Drag back to 1 — all spines should extend to their noise-varied heights. If all spines collapse but to cones rather than flat: Local Space is False, or Center is not (0,0,0).",
      },
      {
        title: "Inspect the Spreadsheet for per-instance scale",
        body: "Open the Spreadsheet editor and set the domain to INSTANCE. With Node Wrangler active, Ctrl+Shift+click the Scale Instances node to pin the Spreadsheet to it. You should see a Scale column with values like (1.0, 1.0, 0.73) — X and Y always 1.0, Z varying between MIN_SCALE and MAX_SCALE per instance.",
      },
      {
        title: "Check polar compression",
        body: "Orbit the viewport camera directly over the north or south pole. Spines near the pole should visibly shorter than those in the equatorial band — roughly 0.42 × height at the pole tip. If they are all the same height, the latitude MapRange is not wired into the multiply chain.",
      },
      {
        title: "Run record.py to render the grow reveal",
        body: "Load record.py in the Scripting workspace and run it. It keyframes Grow_Factor 0 → 1 over 55 frames, adds camera orbit, lighting, and renders via EEVEE to public/library/videos/geometry-nodes/gn-scale-instances-spine-growth/viewport.mp4. Expect 2-4 minutes render time on a mid-range GPU.",
      },
      {
        title: "Inspect the exported GLB",
        body: "Drag spine_growth.glb into gltf.report or the Three.js editor. Confirm the mesh is a realised cone array, the material loaded with the teal-to-amber gradient, and the Draco decompression succeeded. The GLB should be under 2 MB with Draco level 6.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Spines are all identical height — no noise variation",
        cause:
          "The noise-to-scale chain is broken. The Noise Texture Fac output is not wired through MapRange into the first Multiply node.",
        fix: "Open the GN editor. Ctrl+Shift+click the ShaderNodeTexNoise node to preview its Fac output in the Spreadsheet — you should see varying grey values per vertex. If the Spreadsheet shows all-zero, check that GeometryNodeInputPosition is wired into the Noise Texture Vector input.",
      },
      {
        symptom: "Spines shear diagonally instead of growing straight out",
        cause:
          "Local Space is False on the Scale Instances node. The Z scale is applied in world axes, which shears tilted cones.",
        fix: "Select Scale Instances in the GN editor. In the node properties, enable Local Space. The spines should immediately correct to grow along their own outward axes.",
      },
      {
        symptom: "Grow_Factor animation keyframes have no effect in record.py",
        cause:
          "The socket identifier 'Input_2' has changed because the interface socket creation order differs from what record.py expects.",
        fix: "In the GN modifier properties panel, hover over the Grow Factor slider to see its RNA data path (e.g. '[\"Input_3\"]'). Update the key_socket calls in record.py to use the correct identifier.",
      },
    ],
  },
  base,
);

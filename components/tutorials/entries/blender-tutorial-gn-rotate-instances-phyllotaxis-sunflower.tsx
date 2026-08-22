import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnRotateInstancesPhyllotaxisSunflowerBody() {
  return (
    <>
      <p>
        The <strong>Golden Angle</strong> α ≈ 137.508° is the smaller of the
        two angles that divide a full turn in the Golden Ratio.  Equivalently,
        α&nbsp;=&nbsp;2π(2&nbsp;−&nbsp;φ) where φ&nbsp;=&nbsp;(1&nbsp;+&nbsp;√5)/2.
        Placing the <em>n</em>th element at polar coordinates
        (√<em>n</em>&nbsp;·&nbsp;<em>c</em>,&nbsp;<em>n</em>&nbsp;·&nbsp;α)
        produces a uniform-density disc for <em>any</em> seed count — something
        no rational angle can achieve because rational steps eventually repeat,
        creating radial spokes.  The Golden Angle is maximally irrational
        (continued fraction [1;1,1,1,…]): successive seeds are always spread
        as far apart as possible.  This is the mathematical basis of sunflower
        phyllotaxis, documented by{" "}
        <a
          href="https://doi.org/10.1016/0025-5564(79)90080-4"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Vogel (1979)
        </a>{" "}
        — public domain — and the Blender implementation follows it exactly.
      </p>

      <p>
        The GN tree starts with a <code>GeometryNodePoints</code> node (COUNT
        = 144, a Fibonacci number) placing all seeds at the origin.  A{" "}
        <code>GeometryNodeInputIndex</code> field node provides the per-point
        integer index <em>i</em>.  Two <code>ShaderNodeMath</code> chains
        compute angle and radius as pure fields — no explicit loop, no For-Each
        zone.  The angle chain: <code>Multiply(i,&nbsp;GOLDEN_ANGLE_RAD)</code>{" "}
        → θ.  The radius chain: <code>Power(i,&nbsp;0.5)</code> →{" "}
        <code>Multiply(SPACING)</code> → r.  Then{" "}
        <code>Cosine(θ)&nbsp;×&nbsp;r</code> and{" "}
        <code>Sine(θ)&nbsp;×&nbsp;r</code> feed a{" "}
        <code>CombineXYZ</code> whose output drives{" "}
        <code>SetPosition</code>.  Every node in this chain is a{" "}
        <strong>field node</strong>: it evaluates lazily per-element when a
        geometry socket downstream actually consumes the result, so the entire
        polar-to-Cartesian transform costs one evaluation pass over 144 points.
        Compare with the prefix-sum pattern in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-accumulate-field-spiral-staircase"
          className={lk}
        >
          Accumulate Field spiral staircase
        </Link>
        : that tree accumulates a running total along a sequential domain;
        phyllotaxis is simpler — a direct closed-form per-element formula with
        no dependency on preceding elements.
      </p>

      <p>
        After <code>InstanceOnPoints</code> places a flat elongated seed mesh
        (a cuboid 144&nbsp;×&nbsp;60&nbsp;×&nbsp;34&nbsp;mm, long axis along
        +X) at each point,{" "}
        <strong>
          <code>RotateInstances</code>
        </strong>{" "}
        receives <code>CombineXYZ(0,&nbsp;0,&nbsp;θ)</code> as its Rotation
        input — the exact same angle field that was used to{" "}
        <em>place</em> the point.  This is the elegant part: because a Z
        rotation of θ maps the +X axis to (cos&nbsp;θ,&nbsp;sin&nbsp;θ,&nbsp;0),
        and because each seed sits at position
        (r·cos&nbsp;θ,&nbsp;r·sin&nbsp;θ,&nbsp;0), every seed automatically
        faces directly outward from the disc centre.  <code>Local Space</code>{" "}
        must be <code>False</code> (world space): local mode would rotate each
        instance around its own slab centre, leaving it pointing in the same
        global direction instead of sweeping outward.  The same world-vs-local
        distinction matters in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-scale-instances-spine-growth"
          className={lk}
        >
          Scale Instances spine-growth tutorial
        </Link>{" "}
        and in the staircase tutorial above.
      </p>

      <p>
        With 144 seeds (a Fibonacci number), the disc displays{" "}
        <strong>89 clockwise and 55 counter-clockwise spirals</strong> — the
        classic pair of consecutive Fibonacci numbers that appear in real
        sunflowers.  Changing COUNT to 89 gives 55+34; changing to 233 gives
        144+89.  Any Fibonacci seed count maximises the visible pair count,
        but non-Fibonacci counts still tile cleanly — only the spiral counts
        change.  The{" "}
        <code>GeometryNodeRealizeInstances</code> node at the end bakes all 144
        instances to independent meshes before the GLB export, which allows
        Draco level 6 to compress the full vertex buffer rather than only the
        single-seed prototype mesh — the same export reasoning documented in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-instance-on-points"
          className={lk}
        >
          GN Instance on Points tutorial
        </Link>
        .
      </p>

      <p>
        <strong>Troubleshooting.</strong> If the disc centre looks empty, check
        that the <code>GeometryNodePoints</code> Radius input is near zero
        (0.001 m); a large radius pre-offsets each source point, displacing
        seed 0 off-centre.  If seeds all point in the same direction instead of
        radiating outward, confirm <code>Local Space = False</code> on
        RotateInstances.  If the seed mesh is invisible in the GN tree, verify
        that <code>ObjectInfo → transform_space = &#39;ORIGINAL&#39;</code>:
        RELATIVE mode re-interprets the seed&#39;s vertices in the scaffold
        object&#39;s local space, which collapses them when the scaffold has no
        scale.  The GLB export calls <code>export_apply=True</code>, which bakes
        the GN modifier before writing — without this flag, exporters older than
        Blender 4.0 would write an empty mesh (the un-evaluated scaffold), not
        the 144-seed disc.  See the Blender Geometry Nodes documentation on the{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/instances/rotate_instances.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Rotate Instances node
        </a>{" "}
        (CC-BY-SA 4.0, Blender Foundation) for the full socket reference.
      </p>

      <p>
        <strong>Adapting for studio use.</strong> Swap the seed mesh for any
        flat instance — a faceted gem, a VRM hair segment, a circuit tile —
        and the phyllotaxis disc becomes a generative packing tool.  Hooking a
        noise texture into the Radius multiplier adds organic radial variation
        while preserving the golden-angle angular distribution.  The pattern is
        also 3D-print ready out of the box: the GLB Draco export preserves
        watertight geometry if the seed mesh is closed, and the flat profile
        keeps all seeds within a 2.4 m disc that fits standard print beds at
        1:10 scale.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-rotate-instances-phyllotaxis-sunflower",
  title: "GN Rotate Instances — Phyllotaxis Sunflower Array",
  kind: "tutorial",
  date: "2026-06-09",
  excerpt:
    "Build a mathematically exact 144-seed sunflower disc using the Golden Angle, polar field maths, and world-space RotateInstances in Blender 5.1.",
  tags: [
    "blender",
    "geometry-nodes",
    "rotate-instances",
    "phyllotaxis",
    "golden-angle",
    "instance-on-points",
    "mathematics",
    "procedural",
  ],
  Body: GnRotateInstancesPhyllotaxisSunflowerBody,
  furtherReading: [
    {
      label:
        "Rotate Instances Node — Blender 5.1 Manual (CC-BY-SA 4.0, Blender Foundation)",
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/instances/rotate_instances.html",
    },
    {
      label:
        "Vogel H. (1979) 'A better way to construct the sunflower head' — Mathematical Biosciences 44(3–4): 179–189 (public domain)",
      href: "https://doi.org/10.1016/0025-5564(79)90080-4",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "45 minutes",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    blenderVersion: "5.1",
    prerequisites: [
      "Familiar with the Geometry Nodes editor: can add nodes, connect sockets, set node properties.",
      "Blender 5.1 installed and can run a .py script via the Text Editor workspace.",
      "Understands InstanceOnPoints (see the GN Instance on Points tutorial).",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "GeometryNodePoints (the standalone Points node) is stable since Blender 3.4. GeometryNodeRotateInstances is stable since Blender 3.0. ShaderNodeMath operations COSINE, SINE, POWER are available in the GN editor in all 3.x and 4.x/5.x builds.",
      },
    ],
    finalResult:
      "A 144-seed phyllotaxis disc displaying 89 + 55 Fibonacci spirals. The .blend file includes an orbit camera animation. The .glb exports with Draco level 6 and a gold Principled BSDF material.",
    variations: [
      "Change COUNT to any Fibonacci number (55, 89, 233, 377) to get the corresponding pair of counter-rotating spirals. Non-Fibonacci counts still tile cleanly but the visible spiral pair counts change.",
      "Replace the flat cuboid seed with any flat mesh object — a faceted gem, a playing-card shape, a studio logo tile — to produce a phyllotaxis packing of arbitrary instances.",
      "Add a ScaleInstances node after RotateInstances driven by the same radius field (r / MAX_R) to make outer seeds proportionally larger — biological sunflowers have larger achenes near the disc margin.",
    ],
    troubleshooting: [
      {
        symptom: "Disc centre looks empty — seeds missing at the origin",
        cause:
          "GeometryNodePoints Radius is set to a large value (>0.01 m), pre-offsetting seed positions before SetPosition overwrites them.",
        fix: "Set GeometryNodePoints Radius to 0.001 or 0.0.",
      },
      {
        symptom: "All seeds point in the same direction instead of radiating outward",
        cause: "RotateInstances Local Space is True (seeds rotate around their own centres).",
        fix: "Uncheck Local Space on the RotateInstances node.",
      },
      {
        symptom: "GLB exports but Three.js shows an empty scene",
        cause: "export_apply=True was not set — the NODES modifier was not baked.",
        fix: "Re-export with export_apply=True in the bpy.ops.export_scene.gltf call.",
      },
    ],
  },
  base,
);

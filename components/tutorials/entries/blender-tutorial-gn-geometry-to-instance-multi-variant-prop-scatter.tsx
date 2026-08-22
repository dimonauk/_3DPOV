import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every GN scatter tutorial eventually asks: how do you scatter{" "}
        <em>multiple</em> mesh variants — four boulder types, six plant
        species, a dozen tile patterns — without duplicating vertex data at
        every point? The usual answer is{" "}
        <strong>Index Switch</strong>, but IndexSwitch evaluates every branch
        regardless of which index is active. All N geometry sub-trees run
        per-element in the scatter domain even if zero points select that
        branch. The correct answer for static props is{" "}
        <strong>Geometry to Instance</strong> combined with{" "}
        <strong>Join Geometry</strong> and{" "}
        <strong>Instance on Points</strong> with{" "}
        <strong>Pick Instance</strong> enabled. Each source geometry is
        evaluated exactly once, wrapped as a reference, bundled into a
        library, and the per-point selection happens at realisation time with
        zero extra evaluation cost.
      </p>
      <p>
        <code>GeometryNodeGeometryToInstance</code> is the deliberate inverse
        of Realise Instances. Where Realise Instances collapses instance
        references into flat mesh data, Geometry to Instance packages flat
        geometry as a single instance slot — a reference, not a copy. For
        the Realise Instances pattern and when to use it, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-instance-on-points"
          className={lk}
        >
          Instance on Points deep-dive tutorial
        </Link>
        . For a weight-paint-driven scatter workflow without multi-variant
        selection, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-weight-painted-scatter"
          className={lk}
        >
          distribute weight-painted scatter tutorial
        </Link>
        .
      </p>

      <h2>The prop library pattern</h2>
      <p>
        The core construction is a fan-in:
      </p>
      <pre className="text-xs leading-relaxed bg-neutral-900 p-4 rounded overflow-x-auto">
{`ObjectInfo(boulder_0) → GeometryToInstance ─┐
ObjectInfo(boulder_1) → GeometryToInstance  ├→ JoinGeometry  →  [prop library]
ObjectInfo(boulder_2) → GeometryToInstance  │
ObjectInfo(boulder_3) → GeometryToInstance ─┘`}
      </pre>
      <p>
        After the Join Geometry, the output is one geometry containing four
        instance slots — indices 0 through 3. This geometry value wires
        directly into <code>InstanceOnPoints.Instance</code>.
      </p>
      <p>
        Set <code>ObjectInfo.transform_space = &apos;RELATIVE&apos;</code> on every
        node. With <code>ORIGINAL</code>, boulder instances appear at their
        world-space origin (often the scene origin), not at the scatter points.
      </p>

      <h2>Pick Instance and Instance Index</h2>
      <p>
        <strong>Pick Instance</strong> on <code>InstanceOnPoints</code> is
        disabled by default. Disabled, the node places ALL slots from the
        Instance input at every scatter point — four boulders stacked on
        each other. Enable it and the node picks exactly one slot per point,
        selected by the <strong>Instance Index</strong> integer field.
      </p>
      <p>
        Wire a{" "}
        <code>RandomValue (INT)</code> node with{" "}
        <code>Min = 0</code> and <code>Max = N &minus; 1</code> to{" "}
        <code>Instance Index</code>. Use a distinct Seed offset for the
        index picker and the scale picker so the two random streams are
        uncorrelated — otherwise small boulders always come from the same
        variant.
      </p>
      <p>
        For structured picking — boulder_0 on flat ground, boulder_3 on
        steep slopes — replace the RandomValue with a slope-derived integer:
        <code> InputNormal → DOT(Z) → Math(MULTIPLY, N&minus;1) →
        Math(FLOOR)</code>. The integer distribution then mirrors the
        terrain angle continuously.
      </p>

      <h2>Geometry to Instance vs IndexSwitch — the evaluation model</h2>
      <p>
        Both patterns achieve per-point variant selection, but they differ
        in <em>when</em> geometry is evaluated:
      </p>
      <ul>
        <li>
          <strong>IndexSwitch</strong>: all N branch sub-trees evaluate
          for every element in the active domain (every scatter point).
          The selected output is forwarded; the rest are discarded.
          Total cost: N × (cost per sub-tree) × (point count).
        </li>
        <li>
          <strong>GeometryToInstance + Pick Instance</strong>: each source
          sub-tree evaluates once (during library construction, independent
          of scatter point count). Total cost: N × (cost per sub-tree) +
          (point count × lookup).
        </li>
      </ul>
      <p>
        For four static pre-baked meshes, the difference is negligible.
        For four complex modifier stacks or GN sub-trees, it is significant.
        IndexSwitch is still the right choice when you genuinely need to
        feed <em>computed</em> geometry per-point — e.g. a parametric shape
        whose parameters vary per scatter location. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-repeat-zone-crystal-cluster"
          className={lk}
        >
          Repeat Zone crystal cluster tutorial
        </Link>{" "}
        for a case where computation happens inside the instancing loop.
      </p>

      <h2>Uniform random scale via CombineXYZ</h2>
      <p>
        <code>InstanceOnPoints.Scale</code> takes a Vector. For isotropic
        (uniform) random scale, wire the same{" "}
        <code>RandomValue (FLOAT)</code> node to all three inputs of a{" "}
        <code>Combine XYZ</code> node. Because the same node instance is
        referenced for X, Y, and Z, it evaluates once per point and
        produces consistent X&nbsp;=&nbsp;Y&nbsp;=&nbsp;Z.
      </p>

      <h2>GLB export caveat</h2>
      <p>
        <code>export_apply = True</code> in the glTF export call forces{" "}
        Realise Instances before writing. The glTF{" "}
        <code>EXT_mesh_gpu_instancing</code> extension is NOT preserved; all
        geometry is flattened. For production WebXR delivery with GPU
        instancing, export each boulder variant as a separate GLB and
        manage instancing in Three.js or Babylon. For this tutorial,{" "}
        <code>export_apply = True</code> is correct — it bakes the GN
        modifier and confirms the scatter geometry is sound. For the
        Boolean modifier hard-surface pipeline that feeds similar export
        decisions, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-mesh-boolean-hard-surface"
          className={lk}
        >
          GN mesh boolean hard-surface tutorial
        </Link>
        .
      </p>

      <h2>Blender 5.1 specifics</h2>
      <ul>
        <li>
          <code>GeometryNodeGeometryToInstance</code> output socket was
          named <code>&apos;Geometry&apos;</code> in Blender 4.0–4.2 and renamed{" "}
          <code>&apos;Instances&apos;</code> in 4.3+. Use integer index{" "}
          <code>g2i.outputs[0]</code> to avoid version-specific string
          lookup failures.
        </li>
        <li>
          <code>nt.interface.new_socket()</code> is the 4.0+ replacement
          for the removed <code>nt.inputs.new()</code>{" "}
          /<code>nt.outputs.new()</code> API.
        </li>
        <li>
          <code>DistributePointsOnFaces</code> in RANDOM mode socket
          layout: [0]&nbsp;=&nbsp;Mesh, [1]&nbsp;=&nbsp;Selection,
          [2]&nbsp;=&nbsp;Density, [3]&nbsp;=&nbsp;Density Factor,
          [4]&nbsp;=&nbsp;Seed. Use integer indices rather than socket names
          to avoid differences between RANDOM and POISSON_DISK modes.
        </li>
      </ul>

      <h2>Sources and attribution</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/operations/geometry_to_instance.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Blender Manual — Geometry to Instance Node
          </a>{" "}
          — CC-BY-SA 4.0, Blender Documentation Team. Primary reference for
          the node, its input/output sockets, and the inverse relationship
          to Realise Instances. Related projects:{" "}
          <a
            href="https://github.com/blender/blender"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            blender/blender
          </a>{" "}
          (GPL-2+, Blender Foundation);{" "}
          <a
            href="https://extensions.blender.org"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Blender Extensions Platform
          </a>
          .
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/instances/instance_on_points.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Blender Manual — Instance on Points Node
          </a>{" "}
          — CC-BY-SA 4.0, Blender Documentation Team. Covers the Pick
          Instance boolean and Instance Index socket. Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            KhronosGroup/glTF
          </a>{" "}
          (MIT) for the <code>EXT_mesh_gpu_instancing</code> extension
          specification.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-geometry-to-instance-multi-variant-prop-scatter",
  title:
    "GN Geometry to Instance — Multi-Variant Prop Scatter: Efficient Instance Picking from a Bundled Prop Library (Blender 5.1)",
  date: "2026-06-22",
  kind: "tutorial",
  excerpt:
    "GeometryNodeGeometryToInstance wraps flat geometry as a single instance reference — the inverse of Realise Instances. This tutorial builds a 4-variant boulder library by passing each ObjectInfo through GeometryToInstance and joining the results, then uses InstanceOnPoints with Pick Instance enabled to draw one variant per scatter point by a RandomValue integer index. No IndexSwitch branching, no per-point geometry duplication.",
  Body,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/geometry-nodes/gn-geometry-to-instance-multi-variant-prop-scatter/",
    time: "25 minutes",
    difficulty: "intermediate",
    cost: "free",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
      },
    ],
    prerequisites: [
      "Can create and wire Geometry Nodes trees",
      "Understands the difference between instances and realised mesh geometry",
      "Basic Python scripting in the Scripting workspace",
    ],
    steps: [
      {
        title: "Run blueprint.py",
        body: "Open Blender 5.1 → Scripting workspace. Load blueprint.py and click Run Script. Confirm '[blueprint] exported → //boulder_scatter.glb' in the Info header.",
      },
      {
        title: "Inspect the modifier",
        body: "Switch to Layout. Select the terrain object. Open Properties → Modifier. Confirm the PropScatter GN modifier is attached.",
      },
      {
        title: "Toggle Pick Instance",
        body: "Open the GN editor. Find the InstanceOnPoints node. Untick Pick Instance — all 4 boulder variants stack at every scatter point. Re-enable it to see one variant per point.",
      },
      {
        title: "Adjust the variant range",
        body: "Locate the RandomValue(INT) node wired to Instance Index. Change Max from 3 to 1 — observe only 2 variants in the scatter. Restore to 3.",
      },
      {
        title: "Disconnect a slot",
        body: "Disconnect one GeometryToInstance output from the JoinGeometry node. Observe that boulder variant disappearing from the scatter field. Reconnect it.",
      },
      {
        title: "Inspect the Spreadsheet",
        body: "Open Spreadsheet editor → Instance domain → Evaluated Data. Confirm 4 instance slots are listed. Switch to Point domain and find the Instance Index column — verify values range 0–3.",
      },
      {
        title: "Preview the GLB",
        body: "Drag boulder_scatter.glb into a glTF viewer. Orbit to identify all four boulder shapes: base sphere, river stone (flat Z), granite slab (elongated Y), rough crag (noise-warped).",
      },
    ],
    troubleshooting: [
      {
        symptom: "All 4 boulder variants stack at every scatter point",
        cause:
          "Pick Instance is disabled (default). Without it, InstanceOnPoints places all slots from the Instance input at every point.",
        fix: "Enable Pick Instance on the InstanceOnPoints node. Confirm the Instance Index socket is wired to a RandomValue(INT) node with Max = VARIANT_COUNT - 1.",
      },
      {
        symptom: "Boulders appear at world origin, not at scatter points",
        cause:
          "ObjectInfo transform_space is set to ORIGINAL. Boulder source objects are at or near world origin.",
        fix: "Set transform_space = 'RELATIVE' on all ObjectInfo nodes. This places each instance in the terrain object's local space.",
      },
      {
        symptom: "GeometryToInstance output socket raises AttributeError in Python",
        cause:
          "In Blender 4.0–4.2 the output socket was named 'Geometry'; in 4.3+ it was renamed to 'Instances'.",
        fix: "Use the integer index: g2i.outputs[0]. This works across all Blender 4.x and 5.x versions.",
      },
      {
        symptom: "Only variant 0 appears — other variants are missing",
        cause:
          "RandomValue data_type is not 'INT', or Min and Max are both 0, or the output is not wired to Instance Index.",
        fix: "Confirm rand_idx.data_type = 'INT', Min = 0, Max = VARIANT_COUNT - 1. Verify the 'Value' output is linked to InstanceOnPoints 'Instance Index'.",
      },
      {
        symptom: "GLB file is large despite using instances",
        cause:
          "export_apply=True forces Realise Instances before writing. glTF EXT_mesh_gpu_instancing is not preserved.",
        fix: "This is expected for tutorial confirmation. For production WebXR with GPU instancing, export each boulder variant as a separate GLB and instance in Three.js.",
      },
    ],
  },
  base,
);

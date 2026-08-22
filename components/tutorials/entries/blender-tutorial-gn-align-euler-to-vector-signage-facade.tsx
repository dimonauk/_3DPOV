import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnAlignEulerToVectorBody() {
  return (
    <>
      <p>
        Every instance placed on a surface has a rotation problem: which local
        arm do you point at the face normal, and how do you stop the instance
        rolling into a random orientation around that arm?{" "}
        <code>FunctionNodeAlignEulerToVector</code> answers both questions with
        two properties — <code>axis</code> and <code>pivot_axis</code> — but
        choosing them correctly requires knowing your instance&apos;s default
        local coordinate frame. Get it wrong and you get spikes instead of
        panels. This tutorial places flat sign panels on a 16-sided cylindrical
        building façade and explains every degree of freedom involved.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        The axis selection problem
      </h2>
      <p>
        A flat rectangular panel modelled with <em>X = width</em>,{" "}
        <em>Z = height</em>, and <em>Y = depth (thin axis)</em> has its front
        face normal pointing along local <strong>+Y</strong>. To make panels
        face outward from a wall, you need local +Y to equal the face normal.
        Set <code>axis=&apos;Y&apos;</code>. If you instead set{" "}
        <code>axis=&apos;Z&apos;</code>, the node aligns local +Z to the face
        normal — the panel&apos;s <em>top edge</em> points outward, producing
        the classic &ldquo;spikes on a wall&rdquo; artefact that trips up every
        person who first encounters this node.
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-3 overflow-x-auto">
{`# Correct for a panel modelled with +Y = outward
n_align = ng.nodes.new("FunctionNodeAlignEulerToVector")
n_align.axis       = "Y"   # align LOCAL +Y to face normal
n_align.pivot_axis = "Z"   # keep the roll axis pointing to world +Z (upright)

# Socket map
# inputs[0]  Rotation (Euler) — starting orientation; zero = identity
# inputs[1]  Factor   (Float) — blend 0–1; animate for panel reveal sequence
# inputs[2]  Vector           — target direction in world space (face normal here)
# outputs[0] Rotation (Euler) — send straight to Instance on Points.Rotation`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        pivot_axis and the gimbal collapse
      </h2>
      <p>
        Once <code>axis</code> fixes the pointing direction, the instance still
        has one rotational degree of freedom — the roll around that axis. The{" "}
        <code>pivot_axis</code> property controls which axis the node rotates
        around to <em>achieve</em> the alignment, which in turn determines the
        roll of the result. For a vertical cylinder where all face normals are
        horizontal, <code>pivot_axis=&apos;Z&apos;</code> works perfectly:
        rotation happens around world Z, so every panel stays perfectly upright.
      </p>
      <p>
        The failure mode: if a face normal is exactly parallel to the pivot
        axis (e.g. a face pointing straight up when pivot=Z), the rotation is
        undefined — gimbal collapse. For terrain (normals pointing mostly
        upward), always use <code>pivot_axis=&apos;AUTO&apos;</code>, which
        selects a safe pivot per-instance. For a building with vertical walls,{" "}
        <code>pivot_axis=&apos;Z&apos;</code> is optimal — it explicitly locks
        the upright direction and avoids any ambiguity.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Full axis reference
      </h2>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-3 overflow-x-auto">
{`# axis    pivot_axis  Use case
# ─────────────────────────────────────────────────────────────────
# 'Z'     'AUTO'      Object stands UP from surface (rock, tree, boulder)
# 'Y'     'Z'         Object FACES outward, stays upright (sign, panel)
# 'X'     'Y'         Object runs ALONG an edge (cable, seam strip)
# 'Z'     'AUTO'      Then add Rotate Euler for decals lying FLAT on surface
#
# Rule of thumb: identify which local arm of your instance is the "pointing"
# arm, set axis to match, then test pivot with a tilted surface.`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Building the node graph (Blender 5.1)
      </h2>
      <p>
        The façade is a 16-sided cylinder with end caps deleted so only the
        outer wall faces remain. <code>Distribute Points on Faces</code> (
        <code>POISSON_DISK</code>) drops a point per face cluster, with one
        normal per point. The normals feed directly into{" "}
        <code>AlignEulerToVector.inputs[2]</code>. The aligned Euler feeds into{" "}
        <code>Instance on Points.Rotation</code>. The panel instance is a thin
        box whose back face sits at Y=0 in local space, offset 15 mm from the
        wall by setting its rest location to Y=0.5×depth+offset before
        applying the transform.
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-3 overflow-x-auto">
{`n_dist = ng.nodes.new("GeometryNodeDistributePointsOnFaces")
n_dist.distribute_method = "POISSON_DISK"
n_dist.inputs["Seed"].default_value = 42

n_norm = ng.nodes.new("GeometryNodeInputNormal")

n_align = ng.nodes.new("FunctionNodeAlignEulerToVector")
n_align.axis, n_align.pivot_axis = "Y", "Z"

n_obj = ng.nodes.new("GeometryNodeObjectInfo")
n_obj.transform_space = "ORIGINAL"
n_obj.inputs["Object"].default_value = panel_ob  # set in Python

n_inst = ng.nodes.new("GeometryNodeInstanceOnPoints")

lk(n_dist.outputs["Points"],    n_inst.inputs["Points"])
lk(n_norm.outputs["Normal"],    n_align.inputs[2])
lk(n_align.outputs["Rotation"], n_inst.inputs["Rotation"])
lk(n_obj.outputs["Geometry"],   n_inst.inputs["Instance"])`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        The Factor socket — reveal animation
      </h2>
      <p>
        <code>inputs[1]</code> is a 0–1 blend factor. At 0 the node is a
        no-op (instances keep their default orientation). At 1 they fully snap
        to the aligned rotation. Animating Factor from 0 to 1 over 90 frames
        produces a satisfying panel-snap reveal that works well in WebXR
        scene-entry sequences without any NLA or shape-key overhead.
      </p>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-3 overflow-x-auto">
{`# Keyframe the Factor socket directly on the node
n_align.inputs[1].default_value = 0.0
n_align.inputs[1].keyframe_insert("default_value", frame=1)
n_align.inputs[1].default_value = 1.0
n_align.inputs[1].keyframe_insert("default_value", frame=90)`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Why InputNormal vs the Distribute Rotation output
      </h2>
      <p>
        <code>Distribute Points on Faces</code> gained a built-in{" "}
        <code>Rotation</code> output in Blender 5.0 (aligned with Z = face
        normal). You <em>could</em> pipe that straight into Instance on Points
        and skip AlignEulerToVector entirely — but only if your instance&apos;s
        local +Z is already the &ldquo;pointing&rdquo; arm. The moment you
        change to a panel (local +Y) or an edge-following cable (local +X), the
        built-in rotation is wrong. Using <code>InputNormal</code> →{" "}
        <code>AlignEulerToVector</code> explicitly makes the axis mapping
        visible and controllable, which is the pattern that scales to any
        instance model.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Troubleshooting</h2>
      <ul className="list-disc ml-5 space-y-1 text-sm">
        <li>
          <strong>Panels look like spikes:</strong> axis is set to{" "}
          <code>Z</code> when the panel&apos;s outward arm is{" "}
          <code>Y</code>. Check your instance object in local view (numpad 5,
          then numpad 1) and identify which coloured axis arrow points out of
          the front face.
        </li>
        <li>
          <strong>Panels snap-on at random roll angles:</strong>{" "}
          pivot_axis=AUTO on a vertical surface. Change to{" "}
          <code>pivot_axis=&apos;Z&apos;</code> to lock the upright direction.
        </li>
        <li>
          <strong>Some panels flip when cylinder is tilted:</strong> face
          normals near world +Z are approaching the pivot axis. Change to{" "}
          <code>pivot_axis=&apos;AUTO&apos;</code>.
        </li>
        <li>
          <strong>Panels embedded in the wall (no offset):</strong> the panel
          origin is at mesh centre, not at its back face. Either move the panel
          geometry in Edit Mode so the back face sits at Y=0, or use a{" "}
          <code>Translate Instances</code> node after Instance on Points to
          push 0.02 m along the local normal.
        </li>
        <li>
          <strong>GLB has wrong instance positions:</strong> add{" "}
          <code>Realize Instances</code> before export;{" "}
          <code>export_apply=True</code> alone does not collapse GN instances
          if they are still in instance form inside the modifier stack.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Studio cross-references</h2>
      <ul className="list-disc ml-5 space-y-1 text-sm">
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-rotate-instances-phyllotaxis-sunflower"
            className={lk}
          >
            GN Rotate Instances — Phyllotaxis Sunflower
          </Link>{" "}
          — the Rotate Instances node spins already-placed instances around
          their own local axes; combine it with AlignEulerToVector when you
          need both surface-normal alignment and a secondary roll animation.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-geometry-to-instance-multi-variant-prop-scatter"
            className={lk}
          >
            GN Geometry to Instance — Multi-Variant Prop Scatter
          </Link>{" "}
          — when instancing multiple panel variants (neon sign, blank, logo),
          combine the collection approach from that tutorial with the
          AlignEulerToVector rotation from this one.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-distribute-points-faces-poisson-scatter"
            className={lk}
          >
            GN Distribute Points on Faces — Poisson Scatter
          </Link>{" "}
          — the Poisson Disk distribution and seed parameters used here share
          the same node; that tutorial covers distance vs density trade-offs in
          depth.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr"
            className={lk}
          >
            Shader — Principled BSDF v2: Full Parameter Map to glTF 2.0 PBR
          </Link>{" "}
          — the panel material&apos;s Emission and Roughness properties survive
          GLB export via the mapping described there.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside sources</h2>
      <ul className="list-disc ml-5 space-y-1 text-sm">
        <li>
          <a
            href="https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/utilities/rotation/align_euler_to_vector.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Align Euler to Vector
          </a>{" "}
          (CC-BY-SA 4.0, Blender Foundation). Canonical axis/pivot table and
          socket definitions for Blender 5.1. Related:{" "}
          <a
            href="https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/utilities/rotation/rotate_euler.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Rotate Euler
          </a>{" "}
          for compound rotation after alignment.
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njanakiev/blender-scripting
          </a>{" "}
          (MIT, Nicolas Janakiev). GN node-tree construction patterns used in
          blueprint.py — particularly the interface socket / ng.links.new
          patterns. Related:{" "}
          <a
            href="https://github.com/njanakiev/blender-jupyter"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender-jupyter
          </a>{" "}
          for notebook-driven scripting sessions.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-align-euler-to-vector-signage-facade",
    time: "one session",
    difficulty: "intermediate",
    goal:
      "Master FunctionNodeAlignEulerToVector: understand the axis vs pivot_axis decision, build a node graph that places flat sign panels on a cylindrical building so each panel faces outward and stays upright, and animate the Factor socket for a snap-on reveal. Export to GLB for WebXR.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    prerequisites: [
      "Know how Instance on Points and Distribute Points on Faces work",
      "Comfortable with the GN modifier stack and GroupInput/Output",
      "Understand Euler rotations and local vs world coordinate frames",
    ],
    steps: [
      {
        title: "Model the panel instance with a known local frame",
        body: "primitive_cube_add(size=1.0). Scale to (0.28, 0.025, 0.45) — X=width, Y=depth, Z=height. Apply scale. Shift Y by PANEL_D*0.5 + 0.015 so the back face sits at Y=0 (contact point on the wall). Apply location. The panel's front face normal = local +Y.",
      },
      {
        title: "Create the façade and delete end caps",
        body: "primitive_cylinder_add(vertices=16, depth=6.0, radius=2.5). Apply transforms. In bmesh, delete faces where abs(normal.z) > 0.9 — removes top and bottom circles, leaving only the 16 side quads for distribution.",
      },
      {
        title: "Add Distribute Points on Faces (Poisson Disk)",
        body: "n_dist.distribute_method = 'POISSON_DISK'. Wire Group Input Geometry → n_dist.inputs['Mesh']. Wire a Panel Spacing float socket → n_dist.inputs['Distance Min'] (default 1.1 m). Set Seed = 42. The outputs are Points geometry, Normal vector, and a built-in Rotation.",
      },
      {
        title: "Wire InputNormal into AlignEulerToVector",
        body: "n_norm = nodes.new('GeometryNodeInputNormal'). n_align.axis = 'Y', n_align.pivot_axis = 'Z'. Wire n_norm.outputs['Normal'] → n_align.inputs[2]. Leave inputs[0] (Rotation) unconnected — it defaults to zero Euler (identity). inputs[1] Factor = 1.0 or animate 0→1.",
      },
      {
        title: "Instance on Points and realize, then export",
        body: "n_obj = nodes.new('GeometryNodeObjectInfo'). n_obj.inputs['Object'].default_value = panel_ob. Wire n_dist['Points'] → n_inst['Points'], n_obj['Geometry'] → n_inst['Instance'], n_align['Rotation'] → n_inst['Rotation']. Add RealizeInstances, JoinGeometry (merge with façade pass-through), SetMaterial, GroupOutput. Export GLB with export_apply=True.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Panels point away from the wall like spikes",
        cause: "axis='Z' aligns the panel's local +Z (its top edge, not its face) to the face normal.",
        fix: "Set axis='Y'. Confirm by viewing the panel in local mode (Numpad 5 → Numpad 1): the green +Y arrow should point out of the face you want aimed outward.",
      },
      {
        symptom: "Panels snap at arbitrary roll — some sideways, some upside down",
        cause: "pivot_axis='AUTO' on a vertical surface: each instance chooses its own roll independently.",
        fix: "Set pivot_axis='Z'. This forces all rotations to use world Z as the pivot, keeping every panel upright on a vertical façade.",
      },
    ],
  },
  {
    slug: "blender-tutorial-gn-align-euler-to-vector-signage-facade",
    title:
      "GN Align Euler to Vector — Normal-Aligned Panel Instances on a Curved Architectural Façade (Blender 5.1)",
    date: "2026-06-28",
    kind: "tutorial",
    excerpt:
      "FunctionNodeAlignEulerToVector is the correct way to orient instances on any surface, but axis and pivot_axis must match your instance's local coordinate frame. Build a signage system for a cylindrical building: distribute flat panels via Poisson Disk, align local +Y to each face normal, lock the roll with pivot_axis=Z, and animate the Factor socket for a snap-on WebXR reveal.",
    Body: GnAlignEulerToVectorBody,
  },
);

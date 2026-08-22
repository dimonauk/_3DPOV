import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>GeometryNodeIsViewport</code> is a zero-input field source —
        no geometry socket, no parameters — that returns a single Boolean:{" "}
        <strong>True</strong> when the GN tree is being evaluated for the
        interactive 3D viewport, <strong>False</strong> for every other
        context. That covers final render (F12), Cycles or EEVEE baking,
        viewport render animation, and — the catch that surprises almost
        every new user —{" "}
        <code>bpy.ops.export_scene.gltf(export_apply=True)</code>. Wired into
        a <code>Switch(GEOMETRY)</code> node it gives a single modifier that
        automatically presents the artist with a fast low-poly mesh and feeds
        the bake and GLB pipeline with a detailed subdivided, noise-displaced
        version, all without duplicate objects, render-layer toggles, or a
        manual "swap before bake" checklist step.
      </p>

      <p>
        The contrast with the integer-driven approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-index-switch-lod-mesh-kit"
          className={lk}
        >
          Index Switch LOD mesh kit tutorial
        </Link>{" "}
        is instructive. An integer LOD selector gives the artist explicit
        control — they can dial in whichever tier they need for a screenshot
        or a comparison. <code>Is Viewport</code> removes the manual step
        entirely: the right mesh appears in the right context automatically.
        The two patterns are complementary; studios often combine them — an
        integer selector chooses among three pre-built LOD tiers, and{" "}
        <code>Is Viewport</code> toggles between the selected LOD (viewport)
        and a bake-quality super-set of that LOD (render).
      </p>

      <h2 className="mt-6 text-lg font-semibold">Switch wiring pattern</h2>
      <p className="mt-2">
        <code>Switch(GEOMETRY)</code> has three inputs and one output. The
        top socket is the <em>selector</em> (Bool). When the selector is{" "}
        <strong>True</strong>, the node outputs whatever is connected to its
        second socket, labelled <em>True</em>. When the selector is{" "}
        <strong>False</strong>, it outputs the third socket, labelled{" "}
        <em>False</em>. Connecting <code>Is&nbsp;Viewport</code> as the
        selector therefore routes the viewport-optimised geometry through the
        True socket and the render-quality geometry through the False socket,
        exactly matching the natural reading of &ldquo;if we are in the
        viewport, use this; otherwise use that.&rdquo;
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`# In the GN tree Python API (bpy ≥ 5.1):
is_vp  = nodes.new("GeometryNodeIsViewport")   # no inputs
switch = nodes.new("GeometryNodeSwitch")
switch.input_type = 'GEOMETRY'

# inputs[0] = Switch (Bool selector)
# inputs[1] = False branch  → render/GLB geometry
# inputs[2] = True  branch  → viewport geometry
links.new(is_vp.outputs[0],       switch.inputs[0])
links.new(viewport_mesh.outputs["Mesh"],  switch.inputs[2])
links.new(render_mesh.outputs["Geometry"],switch.inputs[1])
links.new(switch.outputs[0], go.inputs["Geometry"])`}
      </pre>

      <h2 className="mt-6 text-lg font-semibold">
        Performance numbers that motivate this
      </h2>
      <p className="mt-2">
        A 12-face box with a single Extrude Mesh inset evaluates in under 1 ms
        on any modern GPU — the artist can orbit, scrub the timeline, and
        adjust GN parameters with no stutter. Adding{" "}
        <code>SubdivideMesh(level=2)</code> turns those 12 faces into 192, and
        the noise displacement field adds a full Perlin evaluation per vertex.
        Total cost: roughly 30 ms per frame in the GN evaluator. Acceptable
        for a Cycles bake that runs once; unacceptable in a viewport that must
        maintain 30 fps interactive response. <code>Is&nbsp;Viewport</code>{" "}
        absorbs that 29 ms tax automatically. The relevant comparison is the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-subdivide-mesh-adaptive-noise-lod"
          className={lk}
        >
          Subdivide Mesh adaptive LOD tutorial
        </Link>
        , which shows how to tune subdivision level against camera distance —
        a dynamic approach that can be layered on top of the Is Viewport gate.
      </p>

      <h2 className="mt-6 text-lg font-semibold">GLB export: the False path</h2>
      <p className="mt-2">
        When <code>bpy.ops.export_scene.gltf(export_apply=True)</code> is
        called, Blender evaluates every modifier on every exported object in
        the same context as a final render. <code>Is&nbsp;Viewport</code>{" "}
        returns False. The Switch node outputs the render subgraph geometry.
        The exported GLB therefore contains the subdivided, displaced mesh —
        192+ faces rather than the 12 visible in the viewport. This is by
        design: the high-quality mesh is what WebXR visitors see; the
        low-poly mesh is a private working aid for the studio. Verify in{" "}
        <code>gltf-validator</code> or the Khronos glTF viewer and confirm
        the face count matches <code>SUBDIV_LEVELS²&nbsp;×&nbsp;12</code>.
        See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-cycles-batch-bake-normal-ao-emission-webxr"
          className={lk}
        >
          Cycles batch bake tutorial
        </Link>{" "}
        for the full pipeline that converts the render-time geometry into
        WebP normal and AO maps before final GLB export.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Simulation Zone escape hatch
      </h2>
      <p className="mt-2">
        <code>Is&nbsp;Viewport</code> pairs naturally with GN Simulation
        Zones — the mechanism behind the growth and particle effects in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-bake-node-simulation-growth"
          className={lk}
        >
          GN Bake node simulation tutorial
        </Link>
        . A Simulation Zone that advances frame-by-frame physics cannot run
        during a Cycles bake: Cycles fires dozens of sample passes per frame
        and the zone would advance dozens of times per render frame, producing
        garbled output. The fix: gate the simulation zone output with{" "}
        <code>Is&nbsp;Viewport</code>&thinsp;→&thinsp;Switch, routing the
        live simulation through the True branch (viewport) and a pre-baked
        static mesh through the False branch (render). The Bake node captures
        the viewport simulation result; the Switch presents it to Cycles.
        This is the production pattern for every simulation-heavy GN tree in
        the studio.
      </p>

      <p className="mt-4">
        <strong>Outside sources:</strong> The{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/misc/is_viewport.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual — Is Viewport node
        </a>{" "}
        (CC-BY, Blender Foundation) documents the evaluation contexts in which
        the node returns True vs False; its sibling pages covering the Switch
        node and the Field System overview form the theoretical background.
        The source is part of the{" "}
        <a
          href="https://github.com/blender/blender"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          blender/blender
        </a>{" "}
        repository. The{" "}
        <a
          href="https://developer.blender.org/docs/features/geometry_nodes/"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Developer Docs — Geometry Nodes Field System
        </a>{" "}
        (CC-BY, Blender Foundation) explains the lazy evaluation model that
        makes <code>Is Viewport</code> a zero-cost field source: the Boolean
        is resolved once per evaluation context, not once per vertex. The
        developer documentation lives alongside the source at{" "}
        <a
          href="https://projects.blender.org/blender/blender"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          projects.blender.org
        </a>
        .
      </p>
      <p className="mt-2">
        For how the resulting GLB loads and renders in the Holoflow spatial
        viewer, see the{" "}
        <Link href="/atelier" className={lk}>
          Atelier WebXR viewer
        </Link>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-is-viewport-render-lod-switch-webxr",
  title:
    "GN Is Viewport + Switch — Automatic Render-vs-Viewport LOD for Cycles Bake & WebXR Export",
  date: "2026-07-03",
  kind: "tutorial",
  excerpt:
    "Use GeometryNodeIsViewport as a zero-input Boolean field source to automatically route a fast low-poly mesh to the interactive viewport and a subdivided noise-displaced mesh to Cycles baking and GLB export — no duplicate objects, no manual swap steps.",
  Body,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/geometry-nodes/gn-is-viewport-render-lod-switch-webxr/",
    time: "1–2 hours",
    difficulty: "intermediate",
    overview:
      "Wire GeometryNodeIsViewport into Switch(GEOMETRY) to give a single modifier two personalities: a 12-face viewport-fast mesh for artist iteration and a 192-face Cycles-quality mesh for texture baking and GLB export, with zero manual intervention at export time.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "GeometryNodeIsViewport available since Blender 3.0; Switch(GEOMETRY) input_type property since 3.0; SubdivideMesh since 3.0.",
      },
    ],
    prerequisites: [
      "Can build Geometry Nodes trees in the GN editor or via bpy node_groups API",
      "Understands the Blender modifier stack and what export_apply=True does",
      "Familiar with SubdivideMesh and SetPosition nodes",
    ],
    steps: [
      {
        title: "Understand the evaluation contexts",
        body: `GeometryNodeIsViewport returns True in exactly one context: when Blender is drawing the interactive 3D viewport during normal editing. It returns False in every other evaluation pass:

• Final render (F12 / bpy.ops.render.render())
• Viewport render animation (bpy.ops.render.opengl(animation=True))
• Cycles and EEVEE texture baking
• bpy.ops.export_scene.gltf(export_apply=True) — this is the one that catches people

The node has no inputs and no settable properties. It resolves once per evaluation context, not once per vertex. The Boolean is the same value for every point in the GN tree during a given evaluation pass — this is what makes it a constant cost regardless of mesh complexity.

WHY it is a field source and not a modifier input: GN modifier inputs (the sockets in the N-panel) are set by the user or Python before evaluation begins. Is Viewport is resolved by the evaluator at evaluation time. It therefore cannot be driven from outside the tree — which is exactly the point. You cannot accidentally set it to the wrong value.`,
      },
      {
        title: "Build the viewport (fast) subgraph",
        body: `Run Stage 1 of blueprint.py. The viewport path creates a cube (0.80 × 0.12 × 1.60 m) and extrudes the front face inward by 8 mm using Extrude Mesh in FACES mode, selected by face normal Y > 0.85.

WHY only one Extrude: the viewport path is for artist iteration — orbit speed and parameter feedback. A single inset pass gives enough visual feedback to judge proportions while keeping evaluation under 1 ms. All the fine detail (noise displacement, smooth subdivision) belongs on the render path and will confuse the artist if visible at all times.

After running blueprint.py, orbit the panel in SOLID shading. The viewport is snappy. Open the Geometry Nodes editor (Ctrl+Shift+Tab → Geometry Nodes workspace) and locate the Is Viewport node. It is connected to switch.inputs[0]. In SOLID mode, Is Viewport = True → the Simple cube mesh is displayed.`,
      },
      {
        title: "Build the render (quality) subgraph",
        body: `The render path starts from the same cube but passes through SubdivideMesh(Level=2) before SetPosition.

SubdivideMesh at Level=2 applies Catmull-Clark subdivision twice:
  Level 0:  12 faces (the original cube)
  Level 1:  48 faces (each face → 4 quad faces)
  Level 2: 192 faces (each of the 48 → 4 again)

WHY Catmull-Clark (the default) rather than Simple: Catmull-Clark computes new vertex positions to produce a smoothed surface. Simple just adds edge loops without repositioning — it is faster but keeps sharp corners. For a baked normal map, Catmull-Clark curvature is what you want.

The noise displacement uses ShaderNodeTexNoise driven by the vertex Position field, not a UV coordinate. This makes it position-coherent: if you animate the panel translating through the scene, the noise pattern does not swim. Scale=14, Detail=6, Roughness=0.65 gives a fine milled-metal surface finish. Amplitude is 3 mm — enough to show in a normal-map bake, too subtle to alter the silhouette.

SetPosition offsets each vertex by Normal × noise_scalar. The Normal field (GeometryNodeInputNormal) ensures each vertex moves perpendicular to the local surface, not along world Z.`,
      },
      {
        title: "Wire Is Viewport into Switch",
        body: `Add Is Viewport and Switch nodes in the GN editor, or run blueprint.py which builds the complete tree.

In the GN Python API:
  is_vp = nodes.new("GeometryNodeIsViewport")
  switch = nodes.new("GeometryNodeSwitch")
  switch.input_type = 'GEOMETRY'

Switch input sockets when input_type='GEOMETRY':
  inputs[0] = Switch (Bool)   ← connect Is Viewport here
  inputs[1] = False  (Geometry) ← render-quality subgraph
  inputs[2] = True   (Geometry) ← viewport-fast subgraph

Verify: press Z → Rendered in the viewport. EEVEE evaluates the modifier in the same context as a render (Is Viewport = False) and the subdivided mesh appears. The silhouette gains visible curvature and the surface shows fine noise texture. Press Z → Solid to return to the low-poly mesh instantly.

The transition is the key demo moment for the screen recording.`,
      },
      {
        title: "Export the GLB and verify face count",
        body: `Call export_glb() from the Python console (or paste the bpy.ops.export_scene.gltf() call with export_apply=True).

Open the GLB in gltf-validator (online at:
  https://github.khronos.org/glTF-Validator/ )

Under meshes[0].primitives[0], check the POSITION accessor's count:
  576 vertices (192 faces × 3 vertices per tri, minus shared verts ≈ correct order of magnitude)

If you see 36 vertices (12 quads × 3), something prevented the GN modifier from evaluating in render context. Common cause: the mesh object had no GN modifier applied (it was disabled in the viewport and render simultaneously). Check the modifier's render-eye icon in the Properties panel.

Document this face count in your studio's asset log alongside the slug and GLB path. The Holoflow exporter adds this to the MANIFEST automatically when you pass --manifest to the batch export script.`,
      },
      {
        title: "Extend: multiple render tiers",
        body: `Nest two Switch nodes to create three tiers:

  Tier 0 (viewport):  12 faces — interactive editing
  Tier 1 (preview):   48 faces — quick bake sanity check
  Tier 2 (final):    192 faces — production bake and GLB

The first Switch gates Is Viewport → Tier 0 vs. a second Switch.
The second Switch gates an integer driver → Tier 1 vs. Tier 2.
Set the integer driver from Python before the bake run:

  mod = obj.modifiers["IsViewportLOD"]
  mod["Socket_LOD"] = 2  # 2 = final quality
  bpy.ops.object.bake(type='NORMAL', ...)

This pattern appears in the Index Switch LOD tutorial and composes cleanly with Is Viewport because Is Viewport is evaluated first.`,
      },
    ],
    finalResult:
      "A server panel modifier (GN_IsViewport_LOD node group) that automatically presents 12 faces to the interactive viewport and 192+ subdivided + noise-displaced faces to Cycles baking and GLB export, controlled by a single GeometryNodeIsViewport field source with no artist intervention.",
    variations: [
      "Add a ShadeSmooth node (GeometryNodeSetShadeSmooth, domain=FACE, True) on the render subgraph output. Flat shading on 192 faces shows faceting at grazing angles — smooth shading fixes it. Leave the viewport path flat-shaded for crisp low-poly aesthetics.",
      "Replace the render noise displacement with a texture-based displacement driven by an ImageTexture node pointing at a Holoflow-baked displacement map. This lets artists pre-bake a high-detail sculpt (e.g. from ZBrush) and apply it procedurally to many panel instances via GN without loading the full sculpt into every scene.",
      "Use Is Viewport to gate an expensive Simulate Zone: wire the zone output to Switch.inputs[2] (True = live sim in viewport) and the GN Bake node output to Switch.inputs[1] (False = cached static mesh during render). This is the canonical pattern for simulation + bake + render in Blender 5.1.",
    ],
    troubleshooting: [
      {
        symptom: "Viewport always shows the render-quality mesh — Is Viewport appears to always return False",
        cause:
          "The object or the GN modifier has the viewport-display eye icon disabled in the modifier stack, causing Blender to skip viewport evaluation and only evaluate at render time.",
        fix: "In the Properties panel → Modifiers, check that both the eye (viewport) and camera (render) icons are enabled for the GN modifier. If the eye is off, Blender never draws the modifier in the viewport.",
      },
      {
        symptom: "GLB contains 12 faces (low-poly) not 192",
        cause:
          "The GN modifier has the render (camera) icon disabled, so export_apply=True skips it and exports the base mesh instead.",
        fix: "Enable the camera icon on the GN modifier. Alternatively, if you intentionally want to export the low-poly version, disconnect Is Viewport from Switch and wire a Boolean constant (False) for the render path permanently.",
      },
      {
        symptom: "Switching shading modes causes a long pause before the render-quality mesh appears",
        cause:
          "SUBDIV_LEVELS is too high (level 3 → 768 faces, level 4 → 3072 faces) and the noise evaluation is expensive on many vertices.",
        fix: "Reduce SUBDIV_LEVELS to 2. If you need level 3 quality, consider switching the render engine to EEVEE Next for the viewport check (much faster than Cycles for the realtime preview), and only use Cycles for the final bake.",
      },
    ],
  },
  base,
);

export { entry };

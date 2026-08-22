import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A Cycles Arbitrary Output Variable is a named channel you define on the
        ViewLayer, then write to from any shader tree via a{" "}
        <code>ShaderNodeOutputAOV</code> node. The pass captures exactly what
        your shader computes — a world-space height gradient, a procedural noise
        mask, a curvature estimate — pixel-by-pixel at full render resolution,
        independent of UV layout. For WebXR the resulting EXR layer becomes a{" "}
        <code>THREE.DataTexture</code> that drives custom GLSL: gradient-based
        colour zones, animated mask reveals, toon-outline thickness maps. The key
        distinction from texture baking is direction: baking projects
        geometry-space data onto UV-mapped pixels; AOVs capture shader-space data
        in screen space, written during the same Cycles render pass that produces
        the beauty. Compare the two-pass EXR compositor pipeline here with the
        single-layer approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-compositor-nodetree-render-passes-eevee-glb-bake"
          className={lk}
        >
          Compositor Render Passes tutorial
        </Link>
        , which routes diffuse, glossy, and shadow passes through identical
        File&nbsp;Output nodes.
      </p>

      <p>
        The ViewLayer API is the entry point:{" "}
        <code>vl = bpy.context.view_layer</code>, then{" "}
        <code>aov = vl.aovs.add()</code>. Each{" "}
        <code>bpy.types.AOVItem</code> carries two properties:{" "}
        <code>.name</code> (the identifier string) and{" "}
        <code>.type</code> (<code>&apos;COLOR&apos;</code> for a 3-channel float
        or <code>&apos;VALUE&apos;</code> for a scalar). The name must be set
        before you build the compositor — the{" "}
        <code>CompositorNodeRLayers</code> node does not grow its AOV output
        sockets until the ViewLayer AOVs are committed to the data block. Running{" "}
        <code>build_compositor()</code> before <code>define_aovs()</code> leaves
        the sockets absent and the link calls silent-fail. Order matters: define →
        build → render. For idempotent re-runs, strip previous AOVs first with a{" "}
        <code>for aov in list(vl.aovs): vl.aovs.remove(aov)</code> loop before
        adding fresh ones. The same ViewLayer pass registration pattern underpins
        the collection-masking workflow in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-viewlayer-multi-pass-collection-mask-eevee-webxr"
          className={lk}
        >
          ViewLayer Multi-Pass tutorial
        </Link>
        .
      </p>

      <p>
        <code>ShaderNodeOutputAOV.name</code> is a quirk: the property shadows
        the base <code>bpy.types.Node.name</code> with AOV-specific semantics.
        When you do{" "}
        <code>aov_node = nt.nodes.new(&apos;ShaderNodeOutputAOV&apos;)</code>,
        the node enters the tree under the key <code>&quot;AOV Output&quot;</code>;
        then <code>aov_node.name = &quot;HeightGradient&quot;</code> sets the
        AOV target name — the string that must match the ViewLayer entry
        exactly, case-sensitive. The node&rsquo;s tree key remains{" "}
        <code>&quot;AOV Output&quot;</code> (or <code>&quot;AOV Output.001&quot;</code>{" "}
        on the second node). A mismatch between the shader node name and the
        ViewLayer AOV name produces an all-black EXR layer with no error — the
        most common silent failure in AOV setups. AOV Output nodes fire in every
        Cycles sample regardless of which{" "}
        <code>ShaderNodeOutputMaterial</code> is marked active. You do not need
        to wire them through the active surface path; they run in parallel with
        the BSDF evaluation. <code>&apos;COLOR&apos;</code>-type AOVs expect the{" "}
        <code>Color</code> input socket wired; <code>&apos;VALUE&apos;</code>-type
        use the <code>Value</code> socket. Wiring a scalar into{" "}
        <code>Color</code> on a <code>&apos;VALUE&apos;</code>-type AOV silently
        writes 0.
      </p>

      <p>
        The Emit Bake route reaches UV-mapped data textures without a second
        render pass. Wire any shader computation into an{" "}
        <code>ShaderNodeEmission</code>, connect that to a second{" "}
        <code>ShaderNodeOutputMaterial</code> node, set{" "}
        <code>out_bake.is_active_output = True</code> (and deactivate the beauty
        output), then call{" "}
        <code>bpy.ops.object.bake(type=&apos;EMIT&apos;)</code>. Blender projects
        the emission value through the mesh&rsquo;s UV layout onto the Image
        Texture node that is both selected and has no output links —{" "}
        <code>nt.nodes.active = img_node</code> is the critical line; without it
        the operator raises{" "}
        <em>&quot;No active image found&quot;</em>. The geometry&rsquo;s{" "}
        <code>Pointiness</code> output from <code>ShaderNodeNewGeometry</code>{" "}
        is one of the most useful emit-bake targets: it gives a
        vertex-interpolated convexity estimate (convex edges → 1.0, concavities
        → 0.0) that passes through a <code>ShaderNodeValToRGB</code> to become
        a WebXR edge-wear or toon-outline thickness data map. This bake-type
        pattern is the same one used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-cycles-batch-bake-normal-ao-emission-webxr"
          className={lk}
        >
          Cycles Batch Bake tutorial
        </Link>
        , which loops across multiple objects and bake types in a single pipeline.
      </p>

      <p>
        After the AOV render and emit bake, the export step restores the beauty
        Material Output (<code>out_render.is_active_output = True</code>) before
        calling <code>export_scene.gltf()</code>. Without this restore the GLB
        ships with the Emission material — the mesh renders as flat white in
        WebXR. The colour-management pipeline throughout is ACES-equivalent AgX
        with linear float buffers, keeping the 32-bit EXR layers radiometrically
        correct for use in HDR lighting rigs — see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-scene-color-management-agx-ocio-bake-safe"
          className={lk}
        >
          AgX Colour Management tutorial
        </Link>{" "}
        for the scene settings that prevent clamping and gamma-encoding artefacts
        in baked data.
      </p>

      <p>
        <strong>Outside sources.</strong>{" "}
        Blender Foundation —{" "}
        <em>bpy.types.AOVItem API Reference (5.1)</em>{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.AOVItem.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          docs.blender.org/api/5.1/bpy.types.AOVItem.html
        </a>{" "}
        CC-BY-4.0 — documents the <code>.name</code> and <code>.type</code>{" "}
        properties of ViewLayer AOVs, the <code>.aovs</code> collection
        accessor, and the implicit socket registration on the RenderLayers
        compositor node; sibling project{" "}
        <a
          href="https://projects.blender.org/blender/blender-extensions"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          blender/blender-extensions
        </a>{" "}
        (Apache-2.0) — the Extensions Platform hosting render pass helpers such
        as Render Passes Compositor and Multi-Layer EXR utilities that build on
        the same AOV infrastructure. Blender Foundation —{" "}
        <em>Cycles Render Passes Manual (5.1)</em>{" "}
        <a
          href="https://docs.blender.org/manual/en/5.1/render/cycles/render_settings/passes.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          docs.blender.org/manual/en/5.1/render/cycles/render_settings/passes.html
        </a>{" "}
        CC-BY-SA-4.0 — full table of built-in Cycles passes (Combined, Diffuse,
        Glossy, AO, Shadow, Normal, Position, Vector) alongside the AOV section
        showing how custom passes appear in the compositor and in the Image
        Editor&rsquo;s render pass drop-down; related manual page{" "}
        <a
          href="https://docs.blender.org/manual/en/5.1/render/cycles/baking.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          Cycles Baking (5.1)
        </a>{" "}
        — covers the active Image Texture node requirement, selected-to-active
        projection, and all supported bake types including <code>EMIT</code>.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-cycles-shader-aov-custom-pass-bake-webxr",
  title:
    "Python Cycles Shader AOV — Arbitrary Output Variables: Custom Data Baking for WebXR (Blender 5.1)",
  date: "2026-07-05",
  kind: "tutorial",
  excerpt:
    "Cycles AOVs pipe custom shader data — height gradients, noise masks, curvature — into named render passes alongside the beauty output. vl.aovs.add() defines the channel; ShaderNodeOutputAOV.name writes to it (case-sensitive; must match ViewLayer AOV name exactly). Compositor order matters: define_aovs() before build_compositor() or the RenderLayers sockets are absent. For UV-mapped data textures, the Emit Bake route (Geometry.Pointiness → Emission → active output → bake type=EMIT) bakes any shader value through UV projection into a WebP for GLB embedding.",
  tags: [
    "blender",
    "python",
    "scripting",
    "cycles",
    "aov",
    "baking",
    "render-passes",
    "compositor",
    "webxr",
    "data-texture",
  ],
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-cycles-shader-aov-custom-pass-bake-webxr",
    time: "fifty minutes",
    difficulty: "advanced",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Comfortable writing bpy Python scripts in the Scripting workspace",
      "Understands the Cycles render pipeline and basic material node trees",
      "Has used the compositor at least once (Render Layers → Composite node)",
    ],
    steps: [
      {
        title:
          "Understand the two AOV data capture routes",
        body: "Route A — ViewLayer AOV render pass:\n  1. Define AOV on vl.aovs (name + type)\n  2. Add ShaderNodeOutputAOV in shader tree (name must match)\n  3. Build compositor: RenderLayers AOV socket → File Output (OpenEXR Multilayer)\n  4. Single-sample Cycles render → multi-layer EXR written by compositor\n  Result: full-resolution, non-UV-dependent data in EXR layers\n\nRoute B — Emit Bake:\n  1. Wire data into Emission → active Material Output\n  2. Add Image Texture node (active, no links) as bake target\n  3. bpy.ops.object.bake(type='EMIT')\n  Result: UV-projected data in a PNG/WebP ready for GLB embed\n\nWhen to use each:\n  Route A: world-space data (heights, normals, velocity vectors), multi-channel at once,\n           no UV distortion, suitable for screen-space post-effects in WebXR.\n  Route B: UV-mapped data textures for THREE.MeshStandardMaterial.map or\n           custom ShaderMaterial uniforms, controllable resolution, re-bake on geometry change.",
      },
      {
        title:
          "Define ViewLayer AOVs — vl.aovs.add(), name, type",
        body: "import bpy\n\nvl = bpy.context.view_layer\n\n# Idempotent: clear old AOVs before adding new ones.\nfor aov in list(vl.aovs):\n    vl.aovs.remove(aov)\n\naov_h      = vl.aovs.add()\naov_h.name = 'HeightGradient'  # must match ShaderNodeOutputAOV.name exactly\naov_h.type = 'COLOR'           # 3-channel float — use for RGB-packed data\n\naov_n      = vl.aovs.add()\naov_n.name = 'NoiseMask'\naov_n.type = 'VALUE'           # 1-channel float — scalars, masks\n\n# AOV types:\n#   'COLOR' — 3-channel RGBA float; wire to ShaderNodeOutputAOV inputs['Color']\n#   'VALUE' — 1-channel float;       wire to ShaderNodeOutputAOV inputs['Value']\n#\n# Mixing type: wiring a scalar into a COLOR-type AOV's Color socket packs\n# the scalar into R only; G and B stay 0.  Use CombineXYZ to spread it:\n#   combine.inputs['X'] = combine.inputs['Y'] = combine.inputs['Z'] = scalar_link",
      },
      {
        title:
          "Wire ShaderNodeOutputAOV in the material — the name quirk",
        body: "mat = bpy.data.materials.new('aov_mat')\nmat.use_nodes = True\nnt = mat.node_tree\n\n# ... (Principled BSDF → Material Output already wired) ...\n\n# AOV Output node — name property is the AOV target, not the node tree key.\naov_h_node      = nt.nodes.new('ShaderNodeOutputAOV')\naov_h_node.name = 'HeightGradient'  # sets the AOV target name\n#   The node's key in nt.nodes is still 'AOV Output' (or 'AOV Output.001').\n#   Access later via: nt.nodes['AOV Output'] — NOT nt.nodes['HeightGradient']\n\n# Wire a height gradient (Object-space Y remapped 0→1) into it:\n# tex_coord → separate_xyz → map_range → combine_xyz → aov_h_node.inputs['Color']\n\n# AOV Output nodes fire every Cycles sample regardless of active Material Output.\n# No need to route them through the active surface path — they run in parallel.\n\n# WHY two ShaderNodeOutputAOV nodes can coexist:\n#   Each node writes independently to its named AOV channel.  Cycles accumulates\n#   both on the same render pass.  Zero performance penalty over one AOV node\n#   because the shader is already running — it's just an extra output write.",
      },
      {
        title:
          "Build the compositor — order relative to define_aovs() is critical",
        body: "# ALWAYS call define_aovs() BEFORE build_compositor().\n# The RenderLayers node grows AOV output sockets only when the ViewLayer\n# has AOVs committed.  If you build the compositor first, the sockets are absent\n# and ct.links.new(rl.outputs['HeightGradient'], ...) raises KeyError.\n\nscene.use_nodes = True\nct = scene.node_tree\nct.nodes.clear()\n\nrl       = ct.nodes.new('CompositorNodeRLayers')\nrl.scene = scene\nrl.layer = bpy.context.view_layer.name\n\nfo                        = ct.nodes.new('CompositorNodeOutputFile')\nfo.format.file_format     = 'OPEN_EXR_MULTILAYER'\nfo.format.color_depth     = '32'    # 32-bit float — lossless data, no clamping\nfo.base_path              = bpy.path.abspath('//')  # .blend directory\n\n# Default slot 0 exists; rename it.  add_slot for second.\nfo.file_slots[0].path = 'HeightGradient'\nfo.file_slots.new('NoiseMask')\n\n# AOV sockets on rl.outputs are named after the AOV names:\nct.links.new(rl.outputs['HeightGradient'], fo.inputs['HeightGradient'])\nct.links.new(rl.outputs['NoiseMask'],      fo.inputs['NoiseMask'])\n\n# Fire the render (1 sample is enough — AOV data has no variance):\nbpy.ops.render.render(write_still=False)\n# Output: aov_passes_0001.exr with two named layers in the blend directory.",
      },
      {
        title:
          "Emit Bake — Geometry.Pointiness to UV data texture",
        body: "# Prerequisites: object has a UV map, scene.render.engine == 'CYCLES'\n\n# 1. Build the curvature sub-graph in the existing material.\ngeom  = nt.nodes.new('ShaderNodeNewGeometry')\ncramp = nt.nodes.new('ShaderNodeValToRGB')\n# Tune ColorRamp: 0.4→black, 0.7→white concentrates on mid-convexity edges.\ncramp.color_ramp.elements[0].position = 0.4\ncramp.color_ramp.elements[1].position = 0.7\nnt.links.new(geom.outputs['Pointiness'], cramp.inputs['Fac'])\n\nemit = nt.nodes.new('ShaderNodeEmission')\nnt.links.new(cramp.outputs['Color'], emit.inputs['Color'])\n\nout_bake = nt.nodes.new('ShaderNodeOutputMaterial')\nnt.links.new(emit.outputs['Emission'], out_bake.inputs['Surface'])\nout_bake.is_active_output = True    # make bake output active\nout_render.is_active_output = False  # suppress beauty during bake\n\n# 2. Create the bake target image and activate it.\nbake_img = bpy.data.images.new('curvature_bake', 512, 512, float_buffer=True)\nimg_node = nt.nodes.new('ShaderNodeTexImage')\nimg_node.image = bake_img\nnt.nodes.active = img_node   # CRITICAL — active + no output links = bake target\n\n# 3. Bake.\nbpy.context.view_layer.objects.active = ob\nob.select_set(True)\nscene.render.bake.use_pass_direct   = False\nscene.render.bake.use_pass_indirect = False\nbpy.ops.object.bake(type='EMIT')\n\n# 4. Save as WebP for GLB embed.\nbake_img.filepath_raw = bpy.path.abspath('//curvature_bake.webp')\nbake_img.file_format  = 'WEBP'\nbake_img.save()\n\n# 5. Restore beauty output before export!\nout_bake.is_active_output   = False\nout_render.is_active_output = True",
      },
    ],
  },
  base
);

import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ShaderAovCustomPassesBody() {
  return (
    <>
      <p>
        A standard render pass — Diffuse, Specular, Shadow — is a
        post-render filter on a geometry buffer the renderer controls. You
        cannot write into it from inside a shader. An{" "}
        <strong>Arbitrary Output Variable</strong> (AOV) inverts this: you
        place a <code>ShaderNodeOutputAOV</code> anywhere in your material
        graph, name it, wire any value or colour into it, and the renderer
        stores whatever your shader computed as an independent EXR layer
        with exactly that name — the beauty buffer untouched. This tutorial
        wires three AOV outputs into a faceted sapphire amulet material:
        a Fresnel scalar for glow control (<code>GlowMask</code>, Value
        type), a Fresnel-tinted rim colour (<code>RimMask</code>, Color
        type), and a remapped world-space normal (<code>FlatNormal</code>,
        Color type). All three are recombined in the Compositor. Compare
        with the{" "}
        <Link
          href="/tutorials/blender-tutorial-cycles-light-groups-non-destructive-relight"
          className={lk}
        >
          Cycles Light Groups tutorial
        </Link>
        , which achieves a similar per-layer isolation at the{" "}
        <em>light</em> level rather than the shader level — both write
        independent EXR layers; neither requires a re-render to change the
        grade.
      </p>

      <p>
        The Python API lives on the <code>ViewLayer</code>, not the Scene:{" "}
        <code>scene.view_layers[&quot;ViewLayer&quot;].aovs</code>. Add
        each entry with <code>a&nbsp;=&nbsp;vl.aovs.add()</code>, then set{" "}
        <code>a.name</code> (the exact string that identifies the EXR slot)
        and <code>a.type</code> (<code>&apos;VALUE&apos;</code> or{" "}
        <code>&apos;COLOR&apos;</code>). In the shader tree, set{" "}
        <code>node.name&nbsp;=&nbsp;&quot;GlowMask&quot;</code> on the
        corresponding <code>ShaderNodeOutputAOV</code> node —{" "}
        <code>node.name</code> IS the AOV target name, the same string you
        type in the Properties panel Name field in the UI. If node and
        ViewLayer names differ by even one character, the pass renders
        black with no warning. In the multilayer EXR the slot key follows
        <code>&quot;ViewLayer.AOV.GlowMask&quot;</code>; Compositor Render
        Layers exposes these sockets after the first render or clicking
        Refresh. The same mechanism delivers the Normal and Albedo passes
        that the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-oidn-denoise-cycles-passes"
          className={lk}
        >
          OIDN Denoise tutorial
        </Link>{" "}
        feeds into the AI denoiser — those are built-in passes, but the
        EXR slot system is identical, making AOV a generalisation of the
        same pipeline.
      </p>

      <p>
        The <code>FlatNormal</code> AOV requires a mandatory remap. A
        world-space normal has components in <code>[-1,&nbsp;1]</code>.
        EXR stores floating-point faithfully across that range, but
        compositing tools assume <code>[0,&nbsp;1]</code> for colour
        channels — negative components clip to black. The remap{" "}
        <code>(N&nbsp;+&nbsp;1)&nbsp;/&nbsp;2</code> folds the hemisphere
        into the positive unit cube: a face pointing toward the camera
        (<code>+Z</code>) becomes <code>(0.5,&nbsp;0.5,&nbsp;1.0)</code>{" "}
        — the cerulean blue of every tangent-space normal map. For this
        flat-shaded gem every pixel within a facet shares the same constant
        normal, making the AOV a free per-facet ID map.{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          The texture baking tutorial
        </Link>{" "}
        covers the same convention from the bake side: the same
        <code>(N&nbsp;+&nbsp;1)&nbsp;/&nbsp;2</code> remap is required so
        that a baked normal texture reads correctly in a real-time engine.
        AOV skips the bake entirely — useful for a render-time diagnostic
        or for a stylised compositing effect that never needs real-time
        playback.
      </p>

      <p>
        The compositor architecture is the tutorial&rsquo;s real payoff.
        Instead of running Glare on the Combined pass — which blooms every
        bright pixel uniformly — the blueprint gates Glare on{" "}
        <code>GlowMask</code>. <code>GlowMask</code> is the raw Fresnel
        scalar after the Power sharpening: exactly <code>1.0</code> at
        grazing angles where the rim glows, <code>0.0</code> everywhere
        else. Glare on that signal blooms only the gem&rsquo;s edges; the
        background and gem interior remain crisp. The same logic applies
        to the <code>RimMask</code> colour grade — RGB Curves pushes the
        blue channel only in the masked region, shifting the rim toward
        cold cyan without touching the void interior. Both effects are
        mixed back into Combined additively at controlled factors (0.7 and
        0.25). For the complementary workflow of applying Glare across the
        full image with tone mapping, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-glare-filmgrain-tonemapping"
          className={lk}
        >
          Glare + Film Grain + Tone Map tutorial
        </Link>
        . The two approaches compose: AOV-gated Glare for precision, global
        Glare for ambient bloom, tone map last.
      </p>

      <h3>Troubleshooting</h3>
      <ul>
        <li>
          <strong>AOV pass renders solid black:</strong>{" "}
          node.name in the shader and aov.name in Render
          Properties → Shader AOV differ. Open the N-panel in the
          Shader Editor, select the AOV Output node, read the Name
          field directly. Check for trailing spaces.
        </li>
        <li>
          <strong>AOV sockets missing on Render Layers:</strong>{" "}
          render one frame (F12) first, then click Refresh on the
          Render Layers node. Sockets are resolved lazily.
        </li>
        <li>
          <strong>FlatNormal appears uniform grey:</strong>{" "}
          mesh is smooth-shaded — normals interpolate across faces.
          Run <code>bpy.ops.object.shade_flat()</code> to get
          per-facet constant normals.
        </li>
        <li>
          <strong>EEVEE Next — AOV passes black:</strong>{" "}
          confirm <code>scene.render.engine&nbsp;=&nbsp;&apos;BLENDER_EEVEE_NEXT&apos;</code>.
          Legacy EEVEE silently ignores AOV Output nodes.
        </li>
      </ul>

      <h3>Sources &amp; Credits</h3>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/render/shader_nodes/output/aov_output.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — AOV Output Node
          </a>{" "}
          (CC-BY-SA 4.0, Blender Documentation Team). Name-matching rule,
          type enum, and EXR slot naming convention from this reference.
          Related:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/render/layers/passes.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Render Passes manual
          </a>
          , which contextualises AOV within the full built-in pass set.
        </li>
        <li>
          <a
            href="https://github.com/AcademySoftwareFoundation/openexr"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenEXR — Academy Software Foundation
          </a>{" "}
          (BSD-2-Clause, ASWF). The multilayer EXR format that carries all
          AOV data from renderer to compositor. The slot hierarchy
          convention (<code>&quot;ViewLayer.AOV.GlowMask&quot;</code>)
          follows the OpenEXR channel naming specification. Related:{" "}
          <a
            href="https://github.com/AcademySoftwareFoundation/OpenColorIO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenColorIO
          </a>{" "}
          (BSD-3-Clause, ASWF) — handles the colour-space transform applied
          to EXR channels during compositing.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-shader-aov-custom-render-passes",
  title:
    "Shader AOV — Custom Render Passes: Glow, Rim & Normal in Cycles (Blender 5.1)",
  date: "2026-06-17",
  kind: "tutorial",
  excerpt:
    "AOV Output nodes let shaders write any value or colour directly into a named EXR layer, independent of the beauty composite. Three custom passes — GlowMask (Fresnel scalar), RimMask (Fresnel colour), FlatNormal (world normal [0,1]) — are registered via view_layer.aovs, wired into a sapphire gem material, and recombined in the Compositor to gate Glare and per-region colour grading.",
  Body: ShaderAovCustomPassesBody,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    time: "one session",
    difficulty: "advanced",
    libraryPath: "blends/rendering/shader-aov-custom-render-passes",
    prerequisites: [
      "Cycles Light Groups tutorial — same EXR-layer isolation concept at the light level.",
      "Principled BSDF + Fresnel + Emission node setup (EEVEE Toon Cel Shader level).",
      "Compositor basics — Render Layers node, pass sockets, Mix Add (OIDN Denoise tutorial level).",
      "Blender 5.1 installed. Headless script runs: blender --background --python.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "EEVEE Next AOV support added in Blender 4.0. Legacy EEVEE ignores AOV nodes silently. Cycles AOV available since 2.92. view_layer.aovs API stable from 3.3+.",
      },
    ],
    steps: [
      {
        title: "Register AOV slots on the ViewLayer",
        body:
          "AOV registration must happen before rendering — do it in the same script that builds the material.\n\n  vl = scene.view_layers['ViewLayer']\n  while vl.aovs:\n      vl.aovs.remove(vl.aovs[0])  # clear stale entries\n  for name, kind in (('GlowMask','VALUE'),('RimMask','COLOR'),('FlatNormal','COLOR')):\n      a = vl.aovs.add()\n      a.name = name\n      a.type = kind\n\ntype='VALUE' writes to the AOV Output node's 'Value' socket (float).\ntype='COLOR' writes to the 'Color' socket (RGBA).\n\nIn the rendered multilayer EXR: 'ViewLayer.AOV.GlowMask', etc.\nCompositor Render Layers sockets appear only after first render or Refresh click.",
      },
      {
        title: "Wire AOV Output nodes in the material",
        body:
          "For each pass, create ShaderNodeOutputAOV and set node.name to the exact AOV name:\n\n  ag = t.nodes.new('ShaderNodeOutputAOV')\n  ag.name = 'GlowMask'          # AOV target — must match vl.aovs entry\n  t.links.new(pwr.outputs['Value'], ag.inputs['Value'])\n\nnode.name IS the pass target name. It is stored in the same RNA identifier slot that the UI 'Name' field reads. A single character mismatch renders the pass black with no error.\n\nFor FlatNormal, remap normal [-1,1] to [0,1] before wiring:\n  VectorMath(ADD, N, (1,1,1)) → VectorMath(DIVIDE, result, (2,2,2)) → AOV Color\n\nNegative components clip to black in compositors assuming [0,1] range.",
      },
      {
        title: "Build the Compositor — gate Glare on GlowMask",
        body:
          "Core compositing principle: use an AOV pass as a SPATIAL GATE.\n\n  RenderLayers.GlowMask → Glare(GHOSTS, threshold=0.25) → MixRGB(ADD, fac=0.7)\n  MixRGB.input[1] = RenderLayers.Combined\n  → MixRGB(ADD, fac=0.25) with RenderLayers.RimMask→RGBCurves\n\nGlare on Combined: every bright pixel blooms (sky, specular highlights, gem).\nGlare on GlowMask: only rim edges bloom (GlowMask = Fresnel^5, 1.0 at edges, 0.0 elsewhere).\n\nThe same pattern applies to any AOV: route an effect through the AOV spatial mask, mix the result back into Combined additively. Non-destructive — change the grade without re-rendering.",
      },
      {
        title: "Render to multilayer EXR and inspect the passes",
        body:
          "Configure before rendering:\n  scene.render.image_settings.file_format = 'OPEN_EXR_MULTILAYER'\n  scene.render.image_settings.color_depth = '32'\n\nStandard OPEN_EXR only writes Combined. MULTILAYER writes all passes.\n\nAfter F12 or bpy.ops.render.render(write_still=True):\n  Image Editor → Open → select .exr\n  Header dropdown → ViewLayer.AOV.FlatNormal\n  → rainbow of per-facet colours (each facet = one constant world normal)\n\nThe Compositor Viewer node wired to FlatNormal shows this live in the compositor workspace.",
      },
    ],
    troubleshooting: [
      {
        symptom: "AOV pass renders as solid black",
        cause: "node.name and vl.aovs entry name differ — case-sensitive exact match required.",
        fix:
          "N-panel in Shader Editor → select AOV Output node → read Name field. Compare with Render Properties → Shader AOV panel. Fix mismatch. Re-render.",
      },
      {
        symptom: "AOV sockets not visible on Render Layers in Compositor",
        cause: "Sockets are resolved lazily on first render.",
        fix: "F12 to render one frame, then click Refresh on the Render Layers node.",
      },
      {
        symptom: "FlatNormal appears uniform grey",
        cause: "Mesh is smooth-shaded; normals interpolate across faces.",
        fix: "bpy.ops.object.shade_flat() or Object Data Properties → Shade Flat.",
      },
      {
        symptom: "EEVEE Next — AOV passes black, Combined renders fine",
        cause: "Engine is set to legacy EEVEE ('BLENDER_EEVEE') not EEVEE Next.",
        fix: "scene.render.engine = 'BLENDER_EEVEE_NEXT'. AOV added in EEVEE Next (Blender 4.0+).",
      },
    ],
  },
  base,
);

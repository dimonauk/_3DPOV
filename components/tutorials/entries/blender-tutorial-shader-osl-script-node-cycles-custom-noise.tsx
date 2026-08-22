import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Open Shading Language (OSL) is a C-like shader language developed by
        Sony Pictures Imageworks and maintained under BSD-3-Clause by the
        Academy Software Foundation. Blender&rsquo;s Cycles renderer has
        executed OSL shaders on the CPU since Blender 2.65; in Blender 5.1 the
        Script node parses any OSL source stored in a Blender Text block and
        auto-generates typed input/output sockets — no compile step, no
        extensions required. This tutorial builds{" "}
        <code>hs_lava_crack</code>, a turbulence FBM shader that produces
        crack-seam rock using only the OSL built-in{" "}
        <code>noise(&quot;perlin&quot;, &hellip;)</code> function, and wires
        it to a Principled BSDF + Emission mix so the seams glow.
      </p>

      <h2>Why OSL rather than built-in noise nodes?</h2>
      <p>
        Every Blender procedural node compiles to GLSL or CUDA kernel code at
        start-up and its parameters are fixed at the node level. OSL shaders
        are interpreted per-sample on the CPU and can contain loops, branches,
        and arbitrary arithmetic over any combination of OSL globals (
        <code>P</code>, <code>N</code>, <code>u</code>, <code>v</code>,{" "}
        <code>time</code>, &hellip;). This makes OSL the right tool when you
        need: custom noise topology that the built-in nodes cannot express,
        look-up tables embedded as arrays in the shader source, or mathematical
        operations that would take a dozen nodes to approximate in the visual
        graph. The trade-off is CPU-only execution — OSL does not run on
        Cycles GPU (OptiX / HIP / Metal) in Blender 5.1.
      </p>

      <h2>The OSL source: <code>hs_lava_crack</code></h2>
      <p>
        The shader has seven inputs and two outputs: <strong>Scale</strong>{" "}
        multiplies <code>P</code> (higher = denser cracks);{" "}
        <strong>Octaves / Lacunarity / Gain</strong> are standard FBM
        parameters (4 octaves, lacunarity 2, gain 0.5);{" "}
        <strong>Threshold</strong> sets the lava/rock boundary (0.42 gives
        ~30&percnt; lava coverage at Scale 5);{" "}
        <strong>Lava_Col / Rock_Col</strong> are the two blended colours.
        Output <strong>Color</strong> feeds Base Color and Emission Color;
        output <strong>Fac</strong> (0=rock, 1=lava) drives the Mix Shader
        blend so only crack pixels emit light.
      </p>
      <p>
        The key arithmetic is the <em>turbulence</em> variant of FBM: each
        octave contributes <code>amp * abs(noise(&quot;perlin&quot;, p))</code>{" "}
        rather than the signed value. OSL&rsquo;s <code>noise(&quot;perlin&quot;, …)</code>{" "}
        returns [0,&nbsp;1], so <code>abs()</code> here is redundant for the
        perlin variant — but it becomes essential if you switch to{" "}
        <code>noise(&quot;snoise&quot;, …)</code> (signed, returns [−1,&nbsp;1]).
        The pattern is preserved either way and the comment in the source serves
        as a reminder of the invariant. After summing and normalising, a{" "}
        <code>smoothstep(Threshold, Threshold + 0.1, val)</code> ramp converts
        the continuous field into a near-binary crack mask with a 0.1 soft
        transition.
      </p>

      <h2>Enabling OSL in Blender 5.1</h2>
      <p>
        OSL is a Cycles-only feature. In Render Properties set Render
        Engine&nbsp;= Cycles, then under Sampling &rarr; Advanced expand the
        Shading section and tick{" "}
        <strong>Open Shading Language</strong>. The device selector must be set
        to <strong>CPU</strong> — the checkbox is greyed out when GPU Compute
        is active. If you switch to GPU mode mid-session, Cycles silently falls
        back to a constant black output for any Script node, which is a common
        source of confusion.
      </p>

      <h2>Setting up the Script node</h2>
      <p>
        In the Shader Editor, Add &rarr; Script. The node appears with a single
        text-selector field. Click the field and choose (or create) your OSL
        Text block. Once a valid shader is assigned Blender parses it and
        creates sockets from the OSL parameter list: non-output primitive types
        (float, color, vector, point, normal, matrix) become input sockets;{" "}
        <code>output</code>-qualified parameters become output sockets. Change
        any parameter declaration and click the{" "}
        <strong>Refresh</strong> button on the node (the circular arrow icon)
        to re-parse — the socket list updates immediately.
      </p>
      <p>
        There are two node modes. <strong>Internal</strong> reads from a Text
        block in <code>bpy.data.texts</code> — portable across .blend files.{" "}
        <strong>External</strong> references a .osl or .oso file on disk and
        supports a compile-on-save workflow for longer shaders. The tutorial
        uses Internal mode so the source travels with the .blend.
      </p>

      <h2>Node wiring for the lava material</h2>
      <p>
        The material tree is:
      </p>
      <pre>{`[Script: hs_lava_crack]
  Color ──▶ [Principled BSDF] Base Color
  Color ──▶ [Emission]        Color
  Fac   ──▶ [Mix Shader]      Fac
[Principled BSDF] ──▶ [Mix Shader] Shader 1
[Emission]        ──▶ [Mix Shader] Shader 2
[Mix Shader]      ──▶ [Material Output]`}</pre>
      <p>
        Principled BSDF handles the rock surface with high Roughness (0.85) and
        low Specular IOR Level (0.1). Emission Strength of 3.5 makes the lava
        seams visibly incandescent. The Mix Shader driven by Fac ensures only
        crack pixels use the Emission path; the rock regions are pure BSDF with
        no emitted light contribution.
      </p>

      <h2>Animating shader parameters via Python</h2>
      <p>
        OSL Script node inputs support keyframe animation on their{" "}
        <code>default_value</code> property. Access the target input by index
        (e.g. <code>script_nd.inputs[0]</code> for Scale) then call{" "}
        <code>input.keyframe_insert(data_path=&apos;default_value&apos;, frame=f)</code>{" "}
        inside a loop. The animation can be played in Rendered mode to preview
        the crack density changing in real time — though each frame still
        requires full CPU path-trace evaluation, so playback will be slow
        unless samples are kept very low (&le;&nbsp;16) or a small viewport
        resolution is used.
      </p>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link href="/tutorials/blender-tutorial-shader-procedural-lava-magma-flow" className={lk}>
            Shader: Procedural Lava &amp; Magma Flow
          </Link>{" "}
          — the same visual goal via Voronoi + Wave Texture nodes; compare the
          two approaches to understand where OSL adds flexibility over the
          visual graph.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-cycles-path-guiding-caustics-glass" className={lk}>
            Cycles Path Guiding &amp; Caustics Through Glass
          </Link>{" "}
          — Cycles sampling and denoising settings covered in depth; the same
          Render Properties section governs OSL device selection.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-shader-procedural-worn-metal-edge-wear" className={lk}>
            Procedural Worn Metal &amp; Edge Wear
          </Link>{" "}
          — masking strategy using Pointiness / AO that parallels the Fac
          output from the OSL Script node.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-gn-store-named-attribute-shader-data-bridge" className={lk}>
            GN Store Named Attribute → Shader Data Bridge
          </Link>{" "}
          — passing per-vertex geometry data into shaders without OSL.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-eevee-toon-cel-shader" className={lk}>
            EEVEE Toon Cel Shader
          </Link>{" "}
          — EEVEE does not support OSL; knowing this boundary is essential
          before adopting Script nodes in a production pipeline.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://github.com/AcademySoftwareFoundation/OpenShadingLanguage"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Open Shading Language — AcademySoftwareFoundation
          </a>{" "}
          (BSD-3-Clause · Sony Pictures Imageworks / ASWF) — authoritative OSL
          specification, stdlib reference, and test suite. Language spec PDF at{" "}
          <code>src/doc/osl-languagespec.pdf</code>; sibling project{" "}
          <a href="https://github.com/AcademySoftwareFoundation/MaterialX" className={lk} target="_blank" rel="noreferrer">MaterialX</a>{" "}
          (Apache-2.0) handles OSL interchange for USD / Hydra.
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/render/cycles/nodes/types/shaders/script.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Blender Manual: Cycles Script Node
          </a>{" "}
          (CC-BY 4.0 · Blender Foundation) — Internal/External modes, socket
          type mapping, Refresh workflow, and the{" "}
          <a href="https://docs.blender.org/manual/en/latest/render/cycles/nodes/osl.html" className={lk} target="_blank" rel="noreferrer">OSL globals reference</a>{" "}
          listing every supported Cycles OSL variable.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-shader-osl-script-node-cycles-custom-noise",
  title:
    "Shader: OSL Script Node — Custom Procedural Turbulence & Lava-Crack Material in Cycles (Blender 5.1)",
  date: "2026-06-21",
  kind: "tutorial",
  excerpt:
    "Open Shading Language lets you write C-like shader functions as Blender Text blocks and plug them into Cycles via the Script node. This tutorial builds hs_lava_crack — a turbulence FBM shader using abs(noise(\"perlin\")) across four octaves — wires its Color and Fac outputs to a Principled BSDF + Emission mix, and shows how to keyframe OSL parameters from Python. OSL requires CPU device; GPU Cycles does not support it in Blender 5.1.",
  Body,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/shading/shader-osl-script-node-cycles-custom-noise/",
    time: "30 minutes",
    difficulty: "advanced",
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
      "Comfortable navigating the Shader Editor and wiring nodes",
      "Can switch Render Engine to Cycles and change device to CPU",
      "Basic Python scripting in the Scripting workspace",
    ],
    steps: [
      "Open Blender 5.1. In Render Properties: set Render Engine = Cycles, Device = CPU. Expand Sampling → Advanced → Shading. Tick Open Shading Language. Confirm the checkbox is not greyed out (it greys out when GPU is selected).",
      "Open the Scripting workspace. Open blueprint.py and click Run Script. Watch the Info header for two print lines confirming the render and save paths.",
      "Switch to Shader Editor with the LavaPlane selected. Locate the Script node. Click its socket list to confirm Scale, Octaves, Lacunarity, Gain, Threshold, Lava_Col, Rock_Col on the left, and Color + Fac on the right.",
      "Click the Script node then open the text block `hs_lava_crack.osl` in the Text Editor header. Read through the OSL source: parameter block, FBM loop, smoothstep. Change Threshold from 0.42 to 0.6 and click the Refresh button (circular arrow) on the Script node. The material updates live in Rendered viewport.",
      "Set viewport shading to Rendered (Z → 8) and drag the Scale value in the Script node's N-panel between 2 and 12. Observe crack density changing. The Principled BSDF handles the rock; the Emission shader is blended in via Mix Shader wherever Fac > 0.",
      "Open the File Browser and navigate to the output/ folder. Open osl_lava_0001.png in the Image Editor to review the full 64-sample Cycles render.",
      "In the Scripting workspace, open record.py and click Run Script. The animation keyframes Scale 2→12 over 60 frames and renders via Cycles at half resolution.",
    ],
    troubleshooting: [
      {
        symptom:
          "Script node outputs a constant black colour; no texture visible in Rendered mode",
        cause:
          "Cycles is running on GPU (OptiX / HIP / Metal). OSL is CPU-only in Blender 5.1.",
        fix: 'In Render Properties → Device, select CPU. The Open Shading Language checkbox must be ticked. After switching, click Refresh on the Script node to force a re-parse.',
      },
      {
        symptom:
          "Script node shows no sockets after assigning the OSL Text block",
        cause:
          "The OSL source contains a syntax error that prevents parsing, or the selected Text block is empty.",
        fix: "In the Text Editor, switch to the hs_lava_crack.osl block and check for red error markers. Common mistakes: missing semicolons, `int` loop variable declared inside the for() rather than before it (LLVM OSL is strict about C89 rules), or a typo in a type name. Click Refresh on the Script node after fixing.",
      },
      {
        symptom:
          "Open Shading Language checkbox is greyed out and unclickable",
        cause: "Device is set to GPU Compute.",
        fix: "Set Device to CPU in Render Properties → Device. The OSL checkbox becomes interactive immediately.",
      },
      {
        symptom:
          "Render is extremely slow — minutes per frame even at 64 samples",
        cause:
          "OSL executes on CPU, which is many times slower than GPU path-tracing. The subdivided plane with 128×128 grid has over 32,000 polygons, all with OSL evaluation per sample per bounce.",
        fix: "Reduce cycles.samples to 16–32 for preview renders. For final output, reduce PLANE_DIVS in blueprint.py to 64 (16,000 polygons), or bake the OSL texture to an Image Texture node using Cycles Bake (Cycles → Bake → Diffuse → Color) which converts the procedural result to a UV-mapped PNG that renders at full GPU speed.",
      },
      {
        symptom:
          "script_nd.inputs[0] raises IndexError: list index out of range in record.py",
        cause:
          "The Script node sockets have not populated yet when record.py runs — either the OSL parse did not complete or the material was not found.",
        fix: "Ensure blueprint.py completed successfully in the same session first. If running record.py standalone, add bpy.context.view_layer.update() before accessing inputs. Check that OslLavaCrack_Mat exists in bpy.data.materials.",
      },
    ],
  },
  base,
);

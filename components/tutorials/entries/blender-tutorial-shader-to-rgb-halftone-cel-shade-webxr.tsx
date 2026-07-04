import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ShaderToRgbHalftoneCelShadeBody() {
  return (
    <>
      <p>
        The <code>ShaderToRGB</code> node gives you a window into EEVEE&rsquo;s
        lighting evaluation: it samples whatever the Principled BSDF would show
        at the current pixel and hands the result back as a plain{" "}
        <code>Color</code> socket — not a physically correct irradiance, but
        the screen-space result of diffuse, specular, and shadow combined.
        Pass that colour through a two-stop CONSTANT ColourRamp to posterise
        it into two hard toon bands, then feed the toon brightness into an
        amplitude-modulated halftone dot screen: shadow pixels get fat dots,
        lit pixels get thin dots.  The same AM encoding governs offset
        lithography — the technique that prints newspapers and book covers.
        See how flat-shaded toon approaches differ without Shader-to-RGB in the{" "}
        <Link href="/tutorials/blender-tutorial-eevee-toon-cel-shader" className={lk}>
          EEVEE Toon Cel Shader
        </Link>{" "}
        tutorial and the GN-driven vertex-colour approach in{" "}
        <Link href="/tutorials/blender-tutorial-gn-interpolate-domain-face-normal-vertex-colour-toon" className={lk}>
          Interpolate Domain: face normal → vertex colour toon
        </Link>.
      </p>

      <h2>Why Shader to RGB is EEVEE-only — and why that matters for WebXR</h2>
      <p>
        <code>ShaderNodeShaderToRGB</code> intercepts the BSDF evaluation
        mid-tree: it asks EEVEE to evaluate the attached shader as if it were
        the final surface output, captures the RGB result, and presents it as
        data for further manipulation.  Cycles does not support this because
        the Cycles path-tracer evaluates BSDFs during light-transport
        integration, not as a simple colour lookup.  Setting the scene to
        Cycles causes <code>ShaderToRGB</code> to emit solid black.
      </p>
      <p>
        glTF 2.0 — the format WebXR runtimes use — has no concept of EEVEE
        shader evaluation whatsoever.  A GLB exported with an active{" "}
        <code>ShaderToRGB</code> node appears entirely black in the browser.
        The fix is to <strong>bake</strong> the EEVEE result to an emission
        texture and export that texture as the Principled BSDF{" "}
        <code>Emission Color</code> slot.  The baked material slot is called{" "}
        <code>HalftoneCel_Baked</code> in <code>blueprint.py</code>; it wires
        the 1 K WebP emission map to Emission Strength 1.0 with Roughness 1.0
        and Metallic 0.0 so the PBR channels stay neutral and the halftone
        reads as a self-lit flat image in any WebXR engine.  Compare the
        emission-bake step in{" "}
        <Link href="/tutorials/blender-tutorial-python-cycles-batch-bake-normal-ao-emission-webxr" className={lk}>
          Cycles Batch Bake: Normal, AO &amp; Emission to WebP
        </Link>{" "}
        for the same pattern applied to a full asset pipeline.
      </p>

      <h2>Building the halftone screen: frac → centre → length → threshold</h2>
      <p>
        A halftone dot screen is a tiled field of circles.  In a shader node
        graph, build it from UV coordinates:
      </p>
      <ol>
        <li>
          <strong>TexCoord → Mapping (Z rotation 45°)</strong> — the 45° angle
          is not arbitrary.  When the UV grid aligns with the mesh edges at 0°,
          the dot columns coincide with any horizontal or vertical seam and
          produce a moiré pattern.  45° breaks that alignment at the cost of
          slightly less efficient UV space; for a panel with square UVs the
          tradeoff is invisible.
        </li>
        <li>
          <strong>VectorMath SCALE × 18</strong> — multiplies UV by the screen
          frequency.  At frequency 18, each 1-unit UV island contains 18 × 18
          = 324 dot cells.  Tune this to match the apparent viewing distance:
          close-up props want lower frequency (larger, more legible dots);
          background panels can use 28–40.
        </li>
        <li>
          <strong>SeparateXYZ → Math FRACT on X and Y</strong> — wraps each
          component into [0, 1], creating a repeating tile.  This is the
          equivalent of the <code>mod(uv, 1.0)</code> operation in GLSL.
        </li>
        <li>
          <strong>Subtract 0.5 from each component → CombineXYZ</strong> —
          shifts the tile origin so the dot centre sits at (0, 0) within each
          cell rather than the corner.  Without this step the dot is a
          quarter-circle clipped at the tile corner.
        </li>
        <li>
          <strong>VectorMath LENGTH</strong> — returns the distance from the
          dot centre.  This scalar is the dot&rsquo;s radial field: values
          below the threshold are inside the dot; values above are outside.
        </li>
        <li>
          <strong>Math LESS_THAN(dot_dist, dot_radius)</strong> — the threshold
          step.  Outputs 1.0 inside the dot, 0.0 outside.  Clean binary — no
          anti-aliasing, true halftone hard edges.
        </li>
      </ol>

      <h2>Amplitude modulation: the radius as a function of toon value</h2>
      <p>
        Fixed-radius dots produce a binary screen — every dot the same size
        regardless of lighting.  Amplitude-modulated halftone varies the dot
        radius with the grey value it is encoding: full shadow = largest
        possible dot (approaching 0.5, which fills the entire cell); full light
        = smallest possible dot (approaching 0.0, invisible).  In print terms:
        more ink in shadow, less ink in highlights.
      </p>
      <p>
        In the node graph, implement AM with a <strong>Mix (Float)</strong>{" "}
        node wired so:
      </p>
      <ul>
        <li>Input A = <code>DOT_SHADOW</code> (0.44) — radius used for shadow</li>
        <li>Input B = <code>DOT_LIT</code> (0.16) — radius used for lit zones</li>
        <li>
          Factor = toon band value from the ColourRamp output.  Blender
          auto-converts the <code>Color</code> socket to the float Factor via
          luminance, which works correctly for a greyscale ramp.  Shadow grey
          (0.18) → Factor ~0.18 → radius closer to DOT_SHADOW.  Lit white
          (1.0) → Factor 1.0 → radius = DOT_LIT.
        </li>
      </ul>
      <p>
        The result is then multiplied back against the toon value so the actual
        dot colour matches the band: shadow dots are 0.18 grey, lit dots are
        white.  Without this multiply the shadow dots are white-on-black, which
        inverts the printed ink metaphor.
      </p>

      <h2>Baking to WebP for WebXR export</h2>
      <p>
        The bake is an <strong>Emit pass</strong> in Cycles — not a Diffuse or
        Combined pass.  The Emit pass captures exactly what the Emission socket
        outputs, with no additional lighting calculation.  Because the halftone
        material wires its final value to an <code>Emission</code> node rather
        than the Principled BSDF surface input, the Emit pass reads the
        halftone dots directly, unaffected by Cycles&rsquo; path tracer.  This
        is the correct bake pass to use whenever the look depends on EEVEE-only
        nodes.
      </p>
      <p>
        Bake sequence: render engine → Cycles; add an unlinked Image Texture
        node in the <code>HalftoneCel</code> material selecting the{" "}
        <code>halftone_baked</code> image; Properties → Render → Bake → Type =
        Emit → Run Bake.  Save the image as WebP.  Switch engine back to EEVEE
        Next.  The <code>HalftoneCel_Baked</code> material already references
        the same image — select that slot and export GLB.  See the full emit
        bake pipeline context in{" "}
        <Link href="/tutorials/blender-tutorial-eevee-next-bloom-emission-glow-cel-shade" className={lk}>
          EEVEE Next Bloom, Emission &amp; Glow: Cel-Shade Neon Prop
        </Link>{" "}
        for a worked example of emission-dominant export materials.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Halftone appears black in viewport</strong> — render engine is
          Cycles; switch to EEVEE Next.  <code>ShaderToRGB</code> outputs black
          in all non-EEVEE contexts.
        </li>
        <li>
          <strong>Dots have soft edges</strong> — check the ColourRamp
          Interpolation is set to <code>CONSTANT</code>, not Linear or Ease.
          LESS_THAN produces hard binary output; soft edges come from the ramp
          feeding a non-binary value to the dot_radius mix.
        </li>
        <li>
          <strong>Moiré pattern on geometry edges</strong> — the Mapping node Z
          rotation is not 45°.  At 0° the dot grid aligns with axis-aligned UV
          seams.  45° breaks the alignment.  For circular or irregular meshes
          30° or 60° are equally effective alternatives.
        </li>
        <li>
          <strong>GLB appears black in browser / Three.js</strong> — the baked
          emission slot was not active during export, or the bake target image
          was not saved.  Confirm <code>halftone_baked.webp</code> exists on
          disk and is referenced by the <code>HalftoneCel_Baked</code>{" "}
          material&rsquo;s Image Texture node before exporting.
        </li>
        <li>
          <strong>Dots disappear at glancing angles</strong> — UV distortion at
          high angles stretches dot cells into ellipses, and the LESS_THAN
          threshold eliminates most of the elongated dots.  Use a lower screen
          frequency for curved or oblique surfaces.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <p>
        Blender Foundation.{" "}
        <em>Shader to RGB Node</em>.  Blender 5.1 Manual.  CC-BY-SA-4.0.{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/render/shader_nodes/converter/shader_to_rgb.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          docs.blender.org
        </a>
        .  Sibling: <a
          href="https://docs.blender.org/api/5.1/bpy.types.ShaderNodeShaderToRGB.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          bpy.types.ShaderNodeShaderToRGB API reference
        </a>
        .
      </p>
      <p>
        Ulichney, R. (1987).{" "}
        <em>Digital Halftoning</em>.  MIT Press.  The foundational text on AM
        and FM halftone theory; the amplitude-modulation principle (dot radius
        proportional to grey value) described in this tutorial is a direct
        implementation of the AM screen model presented in Chapter 3.  The
        blueprint algorithm is an independent CC0 implementation; no derived
        code.  Sibling work:{" "}
        <a
          href="https://graphics.pixar.com/library/RendermanThroughTheYears/"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          Pixar&rsquo;s RenderMan history
        </a>{" "}
        (halftone frequency analysis informed early renderer anti-aliasing
        strategies).
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-shader-to-rgb-halftone-cel-shade-webxr",
  title:
    "Shader: Shader to RGB + Amplitude-Modulated Halftone Screen — EEVEE Cel-Shade to WebXR Bake (Blender 5.1)",
  tags: [
    "blender",
    "shader",
    "halftone",
    "cel-shade",
    "toon",
    "eevee",
    "shader-to-rgb",
    "bake",
    "webxr",
    "glb",
    "npm",
  ],
  category: "tutorial",
  publishedOn: "2026-07-04",
  summary:
    "ShaderNodeShaderToRGB captures EEVEE's Principled BSDF as a colour and feeds it into a " +
    "two-band CONSTANT ColourRamp, then an amplitude-modulated UV halftone screen: dot radius " +
    "scales with toon value so shadows get fat dots and lit zones get sparse dots — the same AM " +
    "encoding as offset lithography.  Screen angle 45° prevents moiré.  The EEVEE result is " +
    "baked to a 1 K WebP emission texture via Cycles Emit pass for clean GLB/WebXR export.",
  body: ShaderToRgbHalftoneCelShadeBody,
  libraryPath:
    "blends/shading/shader-to-rgb-halftone-cel-shade-webxr",
});

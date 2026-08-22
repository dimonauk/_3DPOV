import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function CompositorGlareFilmGrainToneMappingBody() {
  return (
    <>
      <p>
        A raw Cycles or EEVEE render is scene-linear: values range from 0 to
        several thousand, stored as 32-bit floats, representing physical light
        energy.  Displays cannot show that range — they expect values in
        approximately [0, 1] on a gamma-corrected curve.  The Compositor is
        the bridge, and the <em>order</em> in which you apply post-processing
        stages determines whether you get a polished image or broken artefacts.
        The chain in this blueprint — Glare → Tone Map → Film Grain → Lens
        Distortion → Vignette — is not stylistic preference: each node must
        operate in the colour space its maths assumes.
      </p>
      <p>
        <strong>Glare</strong> must come first, before any tone curve, because
        it works by spreading photons from HDR pixels above a threshold.  Once
        you compress bright values into [0, 1] via tone mapping, those peaks
        are gone — Glare has nothing to catch.  Blender&#39;s Compositor
        Glare node offers four types: <em>Fog Glow</em> for omnidirectional
        specular bloom, <em>Streaks</em> for anamorphic lens flares,{" "}
        <em>Simple Star</em> for cross-hatch night-light effects, and{" "}
        <em>Ghosts</em> for sun-lens artefacts.  The choice follows optics, not
        mood.  A chrome sphere and a faceted gem lit from a point source
        produce radial halos — Fog Glow is correct.  Film grain must come{" "}
        <em>after</em> tone mapping for the opposite reason: noise added in
        scene-linear space is luminance-weighted.  A pixel at 10 cd/m² gets
        ten times more grain than one at 1 cd/m², making shadow noise explode
        to an ugly, non-physical mess.  Post-tone-map (display-referred) space
        gives perceptually uniform grain — exactly how silver-halide crystals
        in 35mm film distribute themselves across the tonal range.
      </p>
      <p>
        One important pipeline caveat: Blender 5.1&#39;s default view transform
        is <strong>AgX</strong> (derived from Troy Sobotka&#39;s{" "}
        <a
          href="https://github.com/sobotka/filmic-blender"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          filmic-blender
        </a>
        , MIT).  AgX applies its tone curve through the display engine —{" "}
        <em>not</em> the Compositor.  Adding a Tone Map compositor node on top
        double-tone-maps the image, crushing blacks and muddying highlights.
        This blueprint uses <em>View Transform = Raw</em> so the Tone Map node
        is the only curve applied — a demonstration rig for understanding the
        node.  For production rendering, switch back to AgX and remove the Tone
        Map node.  Both approaches work; you cannot safely use both at once.
        See also the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-cryptomatte-multilayer-exr"
          className={lk}
        >
          Cryptomatte + Multi-Layer EXR tutorial
        </Link>{" "}
        for the complementary pipeline that writes every render pass to a
        graded EXR for DaVinci Resolve, and the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-light-linking-character-rig"
          className={lk}
        >
          EEVEE Light Linking tutorial
        </Link>{" "}
        for the scene-lighting rig that generates the HDR data this chain
        processes.  The gem shader driving the specular highlights is covered
        in{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-transmission-iridescence"
          className={lk}
        >
          Principled BSDF Transmission + Iridescence
        </Link>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-compositor-glare-filmgrain-tonemapping",
  title:
    "Compositor — Glare + Film Grain + Tone Map: Cinematic Post-Processing Pipeline",
  date: "2026-06-12",
  kind: "tutorial",
  excerpt:
    "Wire Blender 5.1's Compositor in the correct colour-space order: Fog Glow bloom on scene-linear HDR, PhotoReceptor tone mapping, display-referred film grain, lens distortion, and a multiply vignette — with a full bpy blueprint and the two-pipeline AgX caveat.",
  Body: CompositorGlareFilmGrainToneMappingBody,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath: "blends/compositing/compositor-glare-filmgrain-tonemapping",
    time: "one focused session",
    difficulty: "intermediate",
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
      "Comfortable navigating the Blender UI and running scripts from the Text Editor",
      "Basic understanding of Cycles render settings (samples, denoising)",
      "Familiarity with the Compositing workspace and Use Nodes toggle",
    ],
    steps: [
      {
        title: "Run blueprint.py and inspect the scene",
        body: `Open Blender 5.1. Open the Text Editor, paste blueprint.py, and press Alt+P (Run Script).\n\nThe script builds a chrome sphere and a faceted gem on a dark ground plane, adds a 650 W point key light and a 110 W cool area fill, and sets up the camera at 50 mm. The key light's high wattage is intentional: it creates a scene-linear specular spike above GLARE_THRESHOLD = 0.80 on the chrome sphere surface.\n\nWith engine = Cycles and 64 samples + OIDN denoising, the render will complete in 1–3 minutes on a mid-range GPU. Inspect the viewport with Rendered shading (Z › Rendered) to confirm the specular highlights are bright white — they will be the primary Glare targets.`,
      },
      {
        title: "Understand the Glare node (Fog Glow)",
        body: `Switch to the Compositing workspace. The node tree already exists from blueprint.py. Find the Glare node immediately after Render Layers.\n\nKey parameters:\n- **glare_type = FOG_GLOW**: omnidirectional diffuse spread. Use STREAKS for anamorphic-lens bokeh highlights, SIMPLE_STAR for city-light cross-hatch, GHOSTS for sun flares.\n- **threshold = 0.80**: only scene-linear values above this bloom. Values are in [0, ∞); 0.80 means pixels outputting more than 80% of 1 W/m²/sr bloom. HDR specular spikes on chrome easily exceed 2.0.\n- **size = 8**: bloom radius in 2^size pixels (256 px at size 8). Lower for tight glints, higher for soft haze.\n- **mix = 0.85**: blends original image (0) with pure glow (1). At 0.85, you see 15% original + 85% glow — adjust down if bloom feels too dominant.\n\nMute the Glare node (M) and press F12 to see the ungraded render. Re-enable it and re-render to compare.`,
      },
      {
        title: "Configure the Tone Map node",
        body: `The Tone Map node (CompositorNodeTonemap, type PHOTORECEPTOR) follows Glare directly.\n\n- **key = 0.18**: maps the scene's geometric mean luminance to 18% grey — the same exposure reference as an 18% grey card in photography. Raise this to brighten the overall image, lower it to darken.\n- **offset = 1.0**: no black lift. Set to 0.8–0.9 for a faded-film look where shadows never reach pure black.\n- **gamma = 1.0**: linear output. Set to 2.2 only if your final output format (JPEG, sRGB PNG) requires display-referred gamma baked in rather than managed by the OS colour profile.\n\nIMPORTANT: this node works correctly here because View Transform = Raw (set by the script). If you switch Color Management › View Transform back to AgX, disable or delete this Tone Map node — AgX handles the tone curve, and leaving both active produces a double-crushed result.`,
      },
      {
        title: "Film grain — why it goes after tone mapping",
        body: `The grain image node contains a 1280×720 monochrome noise texture generated by the Python script. Values are centred on 0.5 with ±0.017 deviation (GRAIN_STRENGTH × 0.5). R = G = B for every pixel — luminance-only grain.\n\nThe Screen blend mode mixes with the tone-mapped image at Fac = GRAIN_STRENGTH (0.035). Screen(a,b) = 1-(1-a)(1-b): at low values it approximates Add but avoids clipping highlights above 1.0. An Add blend at the same factor would blow out bright areas.\n\nIf you move the grain Mix node to before the Tone Map (before the ToneMap, directly after Glare), re-render and compare: you will see heavy shadow noise because the grain is now scene-linear and gets amplified by the tone curve. Move it back after Tone Map and the noise becomes perceptually even. This is the most diagnostic A/B comparison in the tutorial — do it live in the screen recording.`,
      },
      {
        title: "Lens distortion and vignette",
        body: `The Lens Distortion node (CompositorNodeLensdist) applies barrel distortion (LENS_DISTORT = -0.03, negative bows the image outward) and lateral chromatic aberration (LENS_DISPERSE = 0.008, shifts red/blue channels slightly outward from centre). Both values are subtle at the defaults — increase to 0.15 and 0.05 respectively for a dramatic vintage-lens look.\n\nThe vignette is an Ellipse Mask (covering 85% of frame width/height, centred) blurred by a 180 px Gaussian. The blur output [0, 1] is remapped to [1 - VIG_DEPTH, 1] via two Math nodes (Multiply then Add), so the mask centre stays at 1.0 (no effect) and the corners become 1 - 0.70 = 0.30. This remapped value is multiplied against the image.\n\nWhy Multiply not Add-Black: adding a dark gradient subtracts each channel equally. On a saturated colour, one channel hits zero before others — hue shifts. Multiply scales all channels by the same scalar, preserving hue regardless of saturation. Lightroom uses the same principle for its Post-Crop Vignette (Highlight Priority mode).`,
      },
    ],
    finalResult:
      "A Blender 5.1 compositor tree that applies a full cinematic post chain — Fog Glow bloom on HDR specular highlights, PhotoReceptor tone mapping, display-referred film grain via Screen blend, barrel lens distortion with chromatic aberration, and a multiply vignette — with the correct colour-space ordering documented. The blueprint.py script builds both the 3D scene and the full node tree from scratch. The AgX double-tone-map caveat is demonstrated and explained.",
    variations: [
      "Selective bloom via Cryptomatte isolation: instead of blooming the entire render, use a Cryptomatte node (see the companion Cryptomatte tutorial) to isolate just the gem or just the chrome sphere. Feed only that matte-isolated pass into Glare, then Add it back on top of the unglared full render. This confines bloom to one object without affecting the background or other geometry — a technique used in product visualisation where the backdrop must stay clean.",
      "STREAKS glare for anamorphic look: change gl.glare_type to 'STREAKS', set streaks=4 (number of streak arms), angle_offset=0.0 (horizontal streaks for widescreen), and fade=0.9 (streak falloff). STREAKS simulates the horizontal lens streaks characteristic of anamorphic cinematography. Combine with a 2.39:1 crop (render height 536 px at 1280 wide) and a ColourBalance node slight teal-orange grade for the full anamorphic-cinema aesthetic.",
      "AgX pipeline with no Tone Map node: change bpy.context.scene.view_settings.view_transform = 'AgX' and view_settings.look = 'AgX - Medium Contrast'. Remove the ToneMap compositor node entirely — replace its wire with a direct connection from Glare to the grain Mix node. AgX handles the tone curve at display time; everything in the compositor stays scene-linear until the final display. This is the recommended production pipeline; the Tone Map node in this blueprint exists only to demonstrate the photoreceptor model interactively.",
    ],
    troubleshooting: [
      {
        symptom: "No bloom visible in the render even with Glare enabled",
        cause:
          "GLARE_THRESHOLD is set above the maximum scene-linear pixel value in the render. If no pixel in the entire render exceeds the threshold (e.g. threshold=1.5 but all pixels are <1.0), Glare produces no output. Also check that the key light energy is genuinely high — at 650 W in scene units it produces values well above 0.8 on the chrome sphere, but if the light was repositioned or its energy changed the peak value may be lower.",
        fix: "Temporarily set threshold=0.0 to confirm the Glare node is functioning (the entire image blooms). Then raise threshold gradually until only the bright specular spike remains. In the UV/Image Editor, Ctrl+Click on the Render Layers output to see actual pixel values — the chrome specular peak should show values >1.0 in scene-linear.",
      },
      {
        symptom:
          "Image looks flat and desaturated with crushed blacks after rendering",
        cause:
          "Both the Tone Map compositor node AND the AgX view transform are active simultaneously. View Transform = Raw was set by the script; if you changed Color Management back to AgX without removing the ToneMap node, you are double-tone-mapping.",
        fix: "Go to Properties › Render › Color Management › View Transform. If it is set to AgX (or Filmic), delete the ToneMap node from the compositor tree and wire Glare directly to the grain Mix node. If you want to keep the ToneMap node for interactive demonstration, set View Transform = Raw and look = None as the script does.",
      },
      {
        symptom: "Film grain appears much heavier in the shadows than in highlights",
        cause:
          "The grain Mix node is wired before the Tone Map node, so grain is being added in scene-linear space. Scene-linear noise is luminance-weighted — low-luminance shadow pixels receive disproportionately amplified noise when the tone curve later compresses the range.",
        fix: "In the compositor tree, move the grain Mix node to after the ToneMap node output. Reconnect: ToneMap → grain Mix input 1 (not Glare → Mix). The grain should then appear uniform across tonal values.",
      },
    ],
  },
  base,
);

export { entry };

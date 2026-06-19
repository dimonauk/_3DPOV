import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function CompositorColorGradingBody() {
  return (
    <>
      <p>
        Colour grading in Blender&apos;s compositor is a linear-space
        operation: every pixel value is a physical light quantity (candelas,
        scene-referred), not a display percentage. The display transform
        (Filmic, ACES, or AgX in Blender&apos;s colour management settings)
        maps that linear range onto screen gamma{" "}
        <em>after</em> the compositor has finished — which means your Curves
        and Color Balance nodes shape the light data itself, not a
        tone-mapped approximation of it. This has a concrete consequence: an
        S-curve that looks &ldquo;natural&rdquo; in a Photoshop
        display-referred image will{" "}
        <strong>crush highlights and lift blacks</strong> when applied in
        linear space to the same subject. The curve must be designed against
        the linear range, not the gamma-encoded preview. The pipeline in this
        entry — Exposure → RGB Curves → Color Balance (ASC-CDL) →
        Hue-Saturation-Value → Vignette — is ordered for linear correctness,
        and each stage is explained in that context. Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-glare-filmgrain-tonemapping"
          className={lk}
        >
          Glare + Film Grain pipeline
        </Link>
        , which adds photographic texture after the tone map, or the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-kuwahara-painterly-stylisation"
          className={lk}
        >
          Kuwahara painterly filter
        </Link>
        , which reshapes the image&apos;s perceptual structure entirely —
        both of which sit downstream of the grade, not upstream.
      </p>

      <p>
        The <strong>Exposure node</strong> is the correct place to make
        overall brightness adjustments. It applies a scene-linear multiply:{" "}
        <code>out = in × 2^EV</code>. EV −0.2 ≈ ×0.87 — a subtle
        pull-back that creates headroom for specular highlights above 1.0 to
        survive the downstream S-curve without hard-clipping at the white
        point. Adjust brightness here, not with the RGB Curves master white
        point or the Color Balance Slope, because those operations also shift
        the contrast relationship between tones. The{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-oidn-denoise-cycles-passes"
          className={lk}
        >
          OIDN Denoise tutorial
        </Link>{" "}
        explains why denoising must precede all grading nodes: noise is a
        random per-pixel signal that the CDL slope would amplify and the
        Curves S-bend would push into the crushed-shadows zone.
      </p>

      <p>
        The <strong>RGB Curves node</strong> takes a{" "}
        <code>CurveMapping</code> with four curves: index&nbsp;0 is the
        combined (C) master curve that controls all three channels together;
        indices&nbsp;1–3 are per-channel R, G, B overrides. The combined
        S-curve here uses two added control points — (0.18,&nbsp;0.15) and
        (0.82,&nbsp;0.88) — against the existing endpoints (0,&nbsp;0) and
        (1,&nbsp;1). In linear space, 0.18 is photographic middle grey
        (18&nbsp;% reflectance). Pulling it down to 0.15 deepens the
        midtones; raising near-whites at 0.82 to 0.88 opens the highlights.
        The result is a modest contrast lift that does not clip — the white
        point stays at (1,&nbsp;1). After adding points, you{" "}
        <strong>must</strong> call <code>crv.mapping.update()</code> or the
        added points are silently discarded at render time.
      </p>

      <p>
        The <strong>Color Balance node in ASC-CDL mode</strong> is the
        industry interchange format for primary colour correction. The
        formula is{" "}
        <code>out = clamp(slope × in + offset) ^ power</code>. Slope is a
        linear gain (≡ Gain in Lift/Gamma/Gain terminology), Offset is an
        additive constant (≡ Lift), Power is an exponent (≡ Gamma, but
        reciprocal in direction: Power&nbsp;&lt;&nbsp;1 lifts midtones).
        Unlike Lift/Gamma/Gain, CDL values are colour-space agnostic: the
        same Slope/Offset/Power triple produces the same perceptual result
        whether the source is scene-linear, log-C, or ACES AP0, because the
        formula does not bake in any gamma assumption. This is why ASC-CDL
        is the exchange format between DI suites (DaVinci Resolve,
        Baselight, Nuke) — a .cdl file can move between facilities without
        numerical reinterpretation. In Blender&apos;s Python API, set{" "}
        <code>node.correction_method = &apos;OFFSET_POWER_SLOPE&apos;</code>{" "}
        and then assign <code>node.slope</code>, <code>node.offset</code>,{" "}
        <code>node.power</code> as RGBA tuples (the A component is ignored by
        the CDL formula). The{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-aov-custom-render-passes"
          className={lk}
        >
          AOV custom render-pass tutorial
        </Link>{" "}
        shows how to isolate the Glow pass before the CDL grade — useful
        when you want the emission ring to bypass the warm shift and stay
        cool-violet.
      </p>

      <p>
        <strong>Hue-Saturation-Value</strong> comes after CDL, not before,
        because HSV converts from RGB to a cylindrical perceptual model
        (hue angle, chroma radius, value) and back. Applying CDL
        (a Cartesian per-channel linear operation) to HSV-transformed
        values would rotate the hue axes unpredictably — the reverse order
        is safe. The saturation boost of ×1.15 amplifies all chroma
        uniformly, which on the violet pillar with a warm grade pushes the
        purple facets into a richer tone and makes the emissive ring
        more vivid. A value of 1.0 leaves saturation unchanged; above 1.5
        tends to clip chroma in bright highlights.
      </p>

      <p>
        The <strong>vignette</strong> uses an EllipseMask (white inside, black
        outside) blurred with a 160-pixel Gaussian, then remapped from the
        range [0,&nbsp;1] to the range [1−S,&nbsp;1] via two Math nodes
        (MULTIPLY then ADD). Multiplying the graded image by this mask darkens
        the corners to (1−S) of their original brightness while leaving the
        centre untouched. At S&nbsp;=&nbsp;0.35 the corners drop to 65&nbsp;%
        of centre brightness — perceptible but not dominant.{" "}
        <code>CompositorNodeMath</code> outputs a greyscale float, which
        Blender&apos;s compositor auto-promotes to an RGB value when wired
        into the Mix node&apos;s colour socket. The{" "}
        <Link
          href="/tutorials/blender-tutorial-cycles-light-groups-non-destructive-relight"
          className={lk}
        >
          Cycles Light Groups tutorial
        </Link>{" "}
        demonstrates a complementary approach: isolate the key-light
        contribution and vignette only that pass, leaving fill and rim
        unaffected.
      </p>

      <p>
        <strong>Outside sources.</strong> The ASC Color Decision List
        specification v1.2 (2009) defines the Offset/Power/Slope formula and
        the interchange XML schema; it is publicly available from the American
        Society of Cinematographers at{" "}
        <a
          href="https://www.acescentral.com"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          acescentral.com
        </a>
        . Blender&apos;s colour management system is built on{" "}
        <strong>OpenColorIO</strong> (OCIO), maintained by the Academy
        Software Foundation under Apache-2.0, at{" "}
        <a
          href="https://github.com/AcademySoftwareFoundation/OpenColorIO"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/AcademySoftwareFoundation/OpenColorIO
        </a>
        . The OCIO project is sibling to{" "}
        <strong>OpenEXR</strong> (BSD-3-Clause) and{" "}
        <strong>MaterialX</strong> (Apache-2.0), also under the Academy
        Software Foundation (ASWF). The full Blender compositor colour-node
        reference is at{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/compositing/types/color/"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org/manual/en/latest/compositing/types/color/
        </a>{" "}
        (CC-BY-SA-4.0).
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-compositor-color-grading-rgb-curves-cdl",
  title:
    "Compositor — Colour Grading: Exposure + RGB Curves + ASC-CDL Color Balance + HSV Pipeline (Blender 5.1)",
  date: "2026-06-19",
  kind: "tutorial",
  excerpt:
    "A film-grade colour pipeline in Blender's compositor running in scene-linear OCIO space: Exposure (EV −0.2 headroom) → RGB Curves S-contrast (linear midpoints at 0.18/0.82) → Color Balance ASC-CDL (Offset/Power/Slope — the industry interchange format used by Resolve, Baselight, Nuke) → Hue-Saturation-Value (×1.15 saturation secondary) → EllipseMask vignette (35 % corners). Includes Python compositor build, CDL formula derivation, linear-space curve design, and node-order rationale.",
  Body: CompositorColorGradingBody,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    time: "one session",
    difficulty: "intermediate",
    libraryPath:
      "blends/compositing/compositor-color-grading-rgb-curves-cdl",
    prerequisites: [
      "Compositor basics — Render Layers, Viewer node, pass sockets (OIDN Denoise tutorial level).",
      "Understanding of Cycles rendering — samples, adaptive threshold, Normal + DiffCol passes.",
      "Familiarity with Blender colour management settings (Filmic/AgX display transform in Render Properties).",
      "Blender 5.1 installed. All nodes used here (Color Balance, RGB Curves, HSV, EllipseMask, Math, MixRGB) have been present since Blender 3.x.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "Color Balance OFFSET_POWER_SLOPE mode (ASC-CDL) available since Blender 3.3. CompositorNodeCurveRGB.mapping.curves[0] for combined curve present since 2.8x. EllipseMask, CompositorNodeMath all available throughout 4.x–5.x.",
      },
    ],
    steps: [
      {
        title: "Enable Normal + DiffCol passes for guided denoising",
        body:
          "Before F12, two auxiliary passes must be active on the View Layer:\n\n  vl = scene.view_layers['ViewLayer']\n  vl.use_pass_normal        = True\n  vl.use_pass_diffuse_color = True\n\nWithout these, OIDN falls back to image-only denoising (no spatial guidance),\nwhich over-blurs fine surface detail and introduces gradient banding that the\ndownstream CDL Slope would amplify. Blueprint.py sets these automatically.",
      },
      {
        title: "Wire Exposure before RGB Curves",
        body:
          "The Exposure node applies a scene-linear multiply: out = in × 2^EV\n\n  exp = tree.nodes.new('CompositorNodeExposure')\n  exp.inputs['Exposure'].default_value = -0.2   # EV −0.2 ≈ ×0.87\n  tree.links.new(dn.outputs['Image'], exp.inputs['Image'])\n\nEV −0.2 pulls back the overall brightness so specular highlights above 1.0\nhave room to survive the S-curve without hard-clipping at the white point.\nIf you adjust brightness with RGB Curves' white endpoint instead, you also\nchange the shape of the contrast curve — a two-parameter entanglement that\nis hard to tune by eye.",
      },
      {
        title: "Add S-curve control points for linear-space contrast",
        body:
          "CompositorNodeCurveRGB has a CurveMapping with four curves:\n  [0] = combined (C)  [1] = R  [2] = G  [3] = B\n\nDefault points [0]=(0,0) and [1]=(1,1) already exist — only add midpoints:\n\n  crv = tree.nodes.new('CompositorNodeCurveRGB')\n  c   = crv.mapping.curves[0]          # combined curve\n  c.points.new(0.18, 0.15)             # pull midgrey (18 %) below diagonal\n  c.points.new(0.82, 0.88)             # lift near-whites above diagonal\n  crv.mapping.update()                  # MANDATORY — discarded without this\n\n0.18 is photographic middle grey in scene-linear space. Pulling it to 0.15\ndeepens shadows without moving the black point. The near-white anchor at 0.82\nopens the highlight shoulder without raising the white point. Both endpoints\nstay at (0,0) and (1,1) — no clipping.",
      },
      {
        title: "Configure Color Balance in ASC-CDL mode",
        body:
          "Switch the Color Balance node from default Lift/Gamma/Gain to ASC-CDL:\n\n  cb = tree.nodes.new('CompositorNodeColorBalance')\n  cb.correction_method = 'OFFSET_POWER_SLOPE'\n  cb.slope  = (1.05, 1.00, 0.96, 1.0)   # warm highlight gain (R up, B down)\n  cb.offset = (0.01, 0.00, -0.01, 1.0)  # warm shadow lift (R up, B down)\n  cb.power  = (0.95, 0.95,  1.00, 1.0)  # compress R+G mids → warm/bright\n  tree.links.new(crv.outputs['Image'], cb.inputs['Color'])\n\nASC-CDL formula: out = clamp(slope × in + offset) ^ power\nNeutral values: slope=(1,1,1) offset=(0,0,0) power=(1,1,1)\n\nThese settings produce a warm-toned cinematic look:\n  Shadows: slightly orange-warm (R+ offset, B− offset)\n  Mids:    brightened warm (power < 1 on R+G lifts mids)\n  Highlights: warm punch (R slope up, B slope down)\n\nAlpha channel (4th component) is unused by the formula — set to 1.0.",
      },
      {
        title: "Secondary correction with Hue-Saturation-Value",
        body:
          "Wire HSV after CDL, not before:\n\n  hsv = tree.nodes.new('CompositorNodeHueSat')\n  hsv.inputs['Hue'].default_value        = 0.5    # neutral (0=−360°, 1=+360°)\n  hsv.inputs['Saturation'].default_value = 1.15   # +15% chroma\n  hsv.inputs['Value'].default_value      = 1.0    # leave for Exposure\n  hsv.inputs['Fac'].default_value        = 1.0\n  tree.links.new(cb.outputs['Color'], hsv.inputs['Color'])\n\nHue 0.5 = no rotation. Saturation > 1.0 boosts all chroma uniformly.\nAbove 1.5, bright specular highlights may clip — monitor with the\nViewer node and a Scope (Waveform) if available.\n\nReason for ordering after CDL: HSV converts RGB → cylindrical space.\nCDL Slope applied to HSV-converted values would shift hue angles. The\nreverse (CDL first, HSV second) keeps hue relationships intact.",
      },
      {
        title: "Build the vignette with EllipseMask, Blur, and Math",
        body:
          "The vignette remaps a blurred ellipse mask from range [0,1] to [(1−S), 1]\nthen multiplies the graded image by that mask:\n\n  # Mask: 1.0 inside ellipse, 0.0 outside\n  ell = tree.nodes.new('CompositorNodeEllipseMask')\n  ell.x, ell.y, ell.width, ell.height = 0.5, 0.5, 0.65, 0.75\n\n  # Blur the hard ellipse edge\n  blur = tree.nodes.new('CompositorNodeBlur')\n  blur.filter_type, blur.size_x, blur.size_y = 'GAUSS', 160, 160\n  tree.links.new(ell.outputs['Mask'], blur.inputs['Image'])\n\n  # Remap: mask×S  →  [0, S]\n  m1 = tree.nodes.new('CompositorNodeMath')\n  m1.operation = 'MULTIPLY'\n  m1.inputs[1].default_value = 0.35  # S = vignette strength\n  tree.links.new(blur.outputs['Image'], m1.inputs[0])\n\n  # Remap: + (1−S)  →  [1−S, 1]\n  m2 = tree.nodes.new('CompositorNodeMath')\n  m2.operation = 'ADD'\n  m2.inputs[1].default_value = 0.65  # 1 − S\n  tree.links.new(m1.outputs['Value'], m2.inputs[0])\n\n  # Multiply: image × vignette_mask\n  vig = tree.nodes.new('CompositorNodeMixRGB')\n  vig.blend_type = 'MULTIPLY'\n  vig.inputs[0].default_value = 1.0\n  tree.links.new(hsv.outputs['Color'], vig.inputs[1])\n  tree.links.new(m2.outputs['Value'], vig.inputs[2])\n\nCompositorNodeMath outputs a 'Value' (float/greyscale). When wired into\nMixRGB's colour socket, Blender auto-promotes it to RGB(x, x, x) —\nno additional conversion node needed.",
      },
    ],
    troubleshooting: [
      {
        symptom:
          "RGB Curves node has no visible S-shape — graded image looks identical to input",
        cause:
          "crv.mapping.update() was not called after adding points. Without update(), Blender silently discards added CurveMap points at render time.",
        fix:
          "Always call crv.mapping.update() immediately after all curve point additions. If running blueprint.py a second time in the same session, check whether the combined curve already has extra points from the first run — duplicate points cause unexpected shape.",
      },
      {
        symptom:
          "Color Balance has no effect in OFFSET_POWER_SLOPE mode — all values appear neutral",
        cause:
          "cb.correction_method is still 'LIFT_GAMMA_GAIN' (the default). The node accepts cb.offset/power/slope only when OFFSET_POWER_SLOPE mode is active.",
        fix:
          "Set cb.correction_method = 'OFFSET_POWER_SLOPE' before assigning offset/power/slope. Verify in the Properties panel of the selected node (Compositor editor sidebar): the Correction Method dropdown should read 'Offset/Power/Slope'.",
      },
      {
        symptom: "Vignette multiplies image to solid black",
        cause:
          "The ADD step (m2) is missing or its constant is 0.0 instead of (1 − S). The mask range stays [0, S] with a zero minimum, so outside-ellipse pixels become 0 × image = black.",
        fix:
          "Confirm m2.inputs[1].default_value = 1.0 - VIGNETTE_STRENGTH. For S=0.35 this should be 0.65. Without the ADD node, the corners multiply to 0.",
      },
      {
        symptom: "HSV saturation boost clips emissive ring to white",
        cause:
          "The ring emission strength (8.0 W) produces scene-linear values far above 1.0. After the CDL Slope multiplies them further, HSV saturation boost moves the saturated component outside the displayable range before the Filmic display transform can roll it off.",
        fix:
          "Reduce ring emission strength to 3–4, or add an additional Exposure node (EV −0.5) between the Mix node and the Composite to bring the emission peak below the Filmic shoulder. Alternatively, reduce HSV saturation to 1.05 so the effect is more restrained on high-energy pixels.",
      },
      {
        symptom:
          "CompositorNodeMath output wired to MixRGB colour input produces error or wrong colour",
        cause:
          "The MixRGB node input type is RGBA, and CompositorNodeMath outputs a greyscale float ('Value'). In some Blender versions this conversion is implicit; in others the node editor shows an incompatible-socket warning.",
        fix:
          "Insert a CompositorNodeSetAlpha node with Mode='APPLY' to promote the float to RGBA, or use a CompositorNodeMixRGB(blend_type='MIX', Fac=1.0) with inputs wired to the float — the Mix node's greyscale-to-colour promotion is more reliable than direct Math→color links in older builds.",
      },
    ],
  },
  base,
);

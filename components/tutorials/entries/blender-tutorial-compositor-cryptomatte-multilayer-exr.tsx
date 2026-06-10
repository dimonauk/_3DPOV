import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function CompositorCryptomatteMultilayerExrBody() {
  return (
    <>
      <p>
        Every Cycles render produces far more information than the final
        composited image — a shadow pass, a glossy pass, surface normals,
        depth — but unless you explicitly ask Blender to save them, all of it
        is discarded at the end of the render.  The Compositor&#39;s{" "}
        <strong>File Output</strong> node with{" "}
        <code>OPEN_EXR_MULTILAYER</code> format is the one setting that changes
        this: it writes every named render pass as a separate channel in a
        single <code>.exr</code> file.  Open that file in DaVinci Resolve,
        Natron, or Nuke and you can reweight the shadow, boost only the glossy
        highlights, or desaturate a specific pass — without touching the Blender
        file or re-rendering.
      </p>

      <p>
        The DWAA codec (lossy Dreamworks wavelet) is almost always the correct
        choice over ZIP.  ZIP is lossless and produces files 2× smaller than
        raw float.  DWAA is perceptually lossless and produces files 3–8×
        smaller.  At 1080p the quality difference is invisible under normal
        grading.  Use ZIP only for VFX pipelines that require bit-exact round-
        trips — for Holoflow&#39;s grade sessions, DWAA is the standard.
      </p>

      <p>
        <strong>Cryptomatte</strong> is a specification developed by Psyop for
        storing per-object silhouettes in the EXR.  Rather than painting mattes
        by hand or keyframing a garbage matte every time an object moves,
        Cryptomatte hashes each object name into a float value and stores it
        per pixel.  At composite time you type the object name — or click it on
        screen — and the node reconstructs the exact anti-aliased matte.  The
        specification (BSD 2-Clause, see{" "}
        <a
          href="https://github.com/Psyop/Cryptomatte"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/Psyop/Cryptomatte
        </a>
        , Psyop Inc.) stores three depth layers by default — up to six
        overlapping transparent objects at any pixel — which is more than
        enough for most scenes.
      </p>

      <p>
        In Blender 5.1, enabling Cryptomatte requires two ticks in the View
        Layer properties: <em>Cryptomatte Object</em> and, optionally,{" "}
        <em>Cryptomatte Accurate</em>.  Accurate mode adds sub-pixel precision
        for transparent objects — it roughly doubles the per-frame render cost
        of the Cryptomatte pass, but the matte edges on glass or transparent
        geometry become correct rather than approximated.  For the faceted gem
        in this tutorial, Accurate mode is worth the cost: the gem&#39;s
        transmitted background pixels would otherwise bleed into a hard-edged
        matte boundary.
      </p>

      <p>
        The compositor node tree follows a left-to-right cascade.  The{" "}
        <code>CompositorNodeRLayers</code> node is the source; its{" "}
        <code>Denoising Normal</code> and <code>Denoising Albedo</code> outputs
        feed the <code>CompositorNodeDenoise</code> node alongside the main{" "}
        <code>Image</code> pass.  This three-buffer path is what Intel OIDN
        (Apache-2.0) needs to preserve edge sharpness: the Normal buffer
        localises geometry boundaries so the network doesn&#39;t smear across
        them, and the Albedo buffer anchors colour so denoising doesn&#39;t
        desaturate textures.  At 64 samples the result is visually
        indistinguishable from a 2048-sample render.  Compare this to the
        NLM (Non-Local Means) fallback, which is a spatial patch-averaging
        filter: it smears fireflies into blotches rather than removing them.
      </p>

      <p>
        The Cryptomatte node&#39;s <code>matte_id</code> field accepts a
        double-quoted object name — e.g.{" "}
        <code>&#39;&quot;faceted_gem&quot;&#39;</code> in Python — which is an
        exact hash match.  Multiple objects are space-separated:{" "}
        <code>&#39;&quot;gem1&quot; &quot;gem2&quot;&#39;</code>.  Setting this
        in the Python API rather than through the UI is important for batch
        pipelines: the UI picker works by sampling the rendered Cryptomatte
        image in the viewport, which is not available in headless mode.  The
        hash itself is deterministic on object name, so as long as the object
        name is stable across renders, the matte matches — rename the object
        and the matte silently goes blank.
      </p>

      <p>
        The glow effect isolates the gem before the Glare node.  A{" "}
        <code>CompositorNodeMixRGB</code> in MULTIPLY mode multiplies the
        denoised Combined pass by the Cryptomatte&#39;s greyscale Matte output,
        zeroing every pixel not covered by the gem.  The Fog Glow Glare node
        operates on this masked extract.  Its output is then ADDed back onto the
        full denoised frame.  Critically, this means the glow is computed from
        the gem&#39;s actual high-dynamic-range pixel values — the bright
        transmission hotspots bloom naturally — without any spill onto the matte
        sphere or ground plane.  Compare this to running Glare on the full
        Combined pass, where any bright highlight in the scene would bloom,
        including the key-light reflection on the sphere.
      </p>

      <p>
        The Fog Glow type is the correct choice for gems and glass.  Light
        entering a transparent object refracts through multiple surfaces,
        exiting as a diffuse omnidirectional halo.  Simple Star and Streaks
        model lens artefacts — the physical cross-hatch or anamorphic streak
        formed by the aperture blades — which are camera properties, not
        material properties.  Blending Fog Glow at{" "}
        <code>mix = 0.70</code> rather than 1.0 retains some of the original
        un-bloomed gem pixels, preventing the effect from completely
        desaturating the teal facets.
      </p>

      <p>
        The vignette chain uses Blender&#39;s native{" "}
        <code>CompositorNodeEllipseMask</code> rather than a Texture node or
        a rendered gradient.  An unblurred Ellipse Mask has hard aliased edges.
        A Gaussian blur with radius 120 px softens those edges into a smooth
        radial gradient.  Subtracting from 1.0 inverts the mask so the centre
        is bright and the edges are dark.  A <code>MULTIPLY_ADD</code> math
        node then scales the range: multiplied by <code>VIGNETTE_STRENGTH</code>{" "}
        and offset by <code>1 − VIGNETTE_STRENGTH</code>, so the darkest corner
        pixel value is never below <code>1 − strength</code> — a full black
        vignette at 1.0, no vignette at 0.0, controllable in a single constant.
        This approach is colour-neutral: it reduces luminance uniformly without
        affecting hue or saturation.
      </p>

      <p>
        The baking and pass-extraction side of this workflow relates directly to
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          Texture Baking — Normal Map and AO tutorial
        </Link>
        , where render passes are similarly captured as image data for later
        use.  The key difference is domain: baking writes passes into UV-mapped
        textures on specific objects; the compositor&#39;s File Output writes
        passes into a full-frame image regardless of UV layout — the two
        techniques serve different pipeline stages.
      </p>

      <p>
        The gem material in this scene — Principled BSDF v2 with Transmission
        Weight and Iridescence — is covered in depth in the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-transmission-iridescence"
          className={lk}
        >
          Principled BSDF v2 Transmission + Iridescence tutorial
        </Link>
        .  The IOR value (1.72 ≈ crown glass) and Iridescence (0.45, thin-film
        interference) are set to produce the specific bright hotspots that make
        the Fog Glow worth applying.  A low-IOR diffuse material would not
        produce pixel values above the <code>GLARE_THRESHOLD</code> of 0.8 and
        the glow chain would output nothing.
      </p>

      <p>
        For rendering and compositing toon-shaded characters, the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-toon-cel-shader"
          className={lk}
        >
          EEVEE Toon Cel Shader tutorial
        </Link>{" "}
        describes the EEVEE render engine setup.  The compositor nodes shown
        here work with both Cycles and EEVEE Next — EEVEE Next supports
        Cryptomatte Object as of Blender 4.2 and correctly outputs the
        CryptoObject passes.  The Denoise node, however, only applies to Cycles
        renders; EEVEE renders are noise-free by construction and the Denoise
        node passes EEVEE frames through unchanged.
      </p>

      <p>
        Grease Pencil objects appear in Cryptomatte passes with their own
        object hashes, which means outlines generated by the{" "}
        <Link
          href="/tutorials/blender-tutorial-grease-pencil-lineart-toon-outline"
          className={lk}
        >
          Grease Pencil Line Art tutorial
        </Link>{" "}
        can be isolated and treated separately in the compositor — for instance
        darkening the ink lines independently of the fill shading.  The Line
        Art modifier output lands in the GP object&#39;s Cryptomatte layer, so
        the matte covers the full stroke extent including any anti-aliased edges.
      </p>

      <p>
        The full Blender Compositor reference is maintained at{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/compositing/"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org/manual/en/latest/compositing/
        </a>{" "}
        (CC-BY-SA 4.0, Blender Foundation).  The Filmic colour management
        pipeline used in Blender — which defines how HDR values are tone-mapped
        before the compositor sees them — is documented in{" "}
        <a
          href="https://github.com/sobotka/filmic-blender"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          sobotka/filmic-blender
        </a>{" "}
        (MIT, Troy Sobotka): the Look and View Transform settings in Colour
        Management affect what the compositor&#39;s Viewer node displays, though
        File Output always writes raw linear float values regardless of the
        active View Transform.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-compositor-cryptomatte-multilayer-exr",
  title: "Compositor Nodes — Cryptomatte Masking + Multi-Layer EXR",
  kind: "tutorial",
  date: "2026-06-10",
  excerpt:
    "Build a production compositor tree in Blender 5.1: OIDN denoising, " +
    "Cryptomatte-isolated gem glow, soft vignette, and all render passes " +
    "written to a multi-layer OpenEXR for DaVinci or Natron grading.",
  tags: [
    "blender",
    "compositor",
    "cryptomatte",
    "exr",
    "render-passes",
    "denoising",
    "oidn",
    "vignette",
    "fog-glow",
    "production-pipeline",
  ],
  Body: CompositorCryptomatteMultilayerExrBody,
  furtherReading: [
    {
      label:
        "Cryptomatte Specification v1.2.1 — BSD 2-Clause — Psyop Inc.",
      href: "https://github.com/Psyop/Cryptomatte",
    },
    {
      label:
        "Blender Compositor Manual — CC-BY-SA 4.0 — Blender Foundation",
      href: "https://docs.blender.org/manual/en/latest/compositing/",
    },
    {
      label:
        "Filmic Blender (colour management pipeline) — MIT — Troy Sobotka",
      href: "https://github.com/sobotka/filmic-blender",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "50 minutes",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    blenderVersion: "5.1",
    prerequisites: [
      "Comfortable in the Blender 3D Viewport and Properties panels.",
      "Can open the Compositing workspace and connect nodes by dragging links.",
      "Understands Render Layers (what a View Layer is, what passes are).",
      "Has run at least one Cycles render in Blender.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "Cryptomatte Object pass is stable since Blender 3.3. " +
          "CompositorNodeDenoise (OIDN) is stable since Blender 3.0. " +
          "OPEN_EXR_MULTILAYER file format with DWAA codec is stable since Blender 3.4. " +
          "EEVEE Next Cryptomatte support requires Blender 4.2+.",
      },
    ],
    finalResult:
      "A Blender 5.1 compositor tree producing: a denoised Combined pass " +
      "(OIDN, 64 samples), an isolated gem Fog Glow effect, a soft vignette, " +
      "and a multi-layer .exr containing DiffDir, GlossDir, Shadow, Normal, " +
      "and Depth passes alongside the final composite.",
    variations: [
      "Switch from CYCLES to BLENDER_EEVEE_NEXT to lose the Denoise node (EEVEE is noiseless) " +
        "but keep Cryptomatte and Glare — cuts render time from minutes to seconds per frame.",
      "Increase pass_cryptomatte_depth from 3 to 6 for scenes with many overlapping transparent " +
        "objects (stacked glass layers, particle systems) — doubles the Cryptomatte EXR footprint.",
      "Replace Fog Glow with Streaks (glare_type='STREAKS', streaks=4) for a star-burst on " +
        "metallic objects — pair with Cryptomatte on the metallic sphere to avoid blooming diffuse surfaces.",
      "Add a CompositorNodeColorBalance (CDL mode) between the denoised image and the vignette " +
        "for a full Lift/Gamma/Gain grade baked into the final composite PNG.",
    ],
    troubleshooting: [
      {
        symptom: "Cryptomatte matte output is all black — gem not isolated",
        cause:
          "Cryptomatte Object pass not enabled in View Layer properties, " +
          "or the object was renamed after the matte_id was set.",
        fix:
          "Tick Properties > View Layer > Passes > Cryptomatte > Object. " +
          "Re-render. Confirm node.matte_id = '\"' + gem_obj.name + '\"' matches the current object name.",
      },
      {
        symptom: "Denoise node outputs a blank or grey image",
        cause:
          "Denoising Normal and Denoising Albedo passes are not enabled, " +
          "or the Denoise node inputs are not wired.",
        fix:
          "Enable Properties > Render > Sampling > Denoising in Render Properties. " +
          "In the compositor, connect rl.outputs['Denoising Normal'] and " +
          "'Denoising Albedo' to the Denoise node's Normal and Albedo inputs.",
      },
      {
        symptom: "Multi-layer EXR only contains one layer named 'Combined'",
        cause:
          "The File Output node's format was set after adding file slots — " +
          "slots added before format.file_format='OPEN_EXR_MULTILAYER' are " +
          "treated as individual EXR files.",
        fix:
          "Set file_out.format.file_format = 'OPEN_EXR_MULTILAYER' before " +
          "calling file_out.file_slots.new(). The blueprint.py already does this in order.",
      },
      {
        symptom: "Fog Glow covers the entire image, not just the gem",
        cause:
          "Glare node is receiving the full denoised Combined pass rather " +
          "than the Cryptomatte-masked gem extract.",
        fix:
          "Ensure the MixRGB MULTIPLY node (gem_extract) sits between the " +
          "Denoise output and the Glare input. The Glare ADD node combines " +
          "the glow back with the full frame after the fact.",
      },
      {
        symptom: "Vignette has a hard ellipse edge rather than a smooth gradient",
        cause:
          "The Blur node size is zero or the blur is not connected to the " +
          "Ellipse Mask output.",
        fix:
          "Set vig_blur.size_x = vig_blur.size_y = 120 and confirm " +
          "vig_ell.outputs['Mask'] → vig_blur.inputs['Image'] link exists.",
      },
    ],
  },
  base,
);

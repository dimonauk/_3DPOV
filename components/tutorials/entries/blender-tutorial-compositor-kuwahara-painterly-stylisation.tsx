import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function CompositorKuwaharaPainterlyBody() {
  return (
    <>
      <p>
        The <strong>Kuwahara filter</strong>, added to Blender&apos;s
        Compositor in 4.3, turns a Cycles render into something that reads
        like an oil painting — coherent directional strokes that follow the
        silhouette of your objects rather than cutting blindly across them.
        It does this by partitioning each pixel&apos;s neighbourhood into
        four overlapping sectors, computing the mean and variance of each
        sector, and outputting the mean of whichever sector has the lowest
        variance. Low-variance sectors are, by definition, the ones that do
        not straddle a colour boundary — so the filter naturally picks the
        colour &ldquo;on the same side of the edge&rdquo; as the current
        pixel. The <strong>Anisotropic</strong> variant (Kyprianidis 2009)
        goes further: it computes a local{" "}
        <em>structure tensor</em> from the image gradient, extracts the
        dominant edge direction from the tensor&apos;s eigenvectors, and
        rotates and stretches the four sectors to align their boundaries with
        that direction. At a vessel rim, strokes curve around the rim. At a
        corner, they terminate cleanly. Compared with the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-glare-filmgrain-tonemapping"
          className={lk}
        >
          Glare + Film Grain pipeline
        </Link>
        , which adds texture to an otherwise photo-real render, Kuwahara
        changes the fundamental look of the image — it is a style transfer
        node, not a post-effect.
      </p>

      <p>
        The Python compositor API exposes the node as{" "}
        <code>CompositorNodeKuwahara</code>. The four properties that matter:
      </p>

      <ul className="list-disc list-inside space-y-1 pl-2">
        <li>
          <code>size</code> (int) — kernel half-radius in pixels. At 1280×720,
          3–5 is subtle and 7–10 is full painterly. The perceptual equivalence
          with resolution is roughly &times;1.5 not &times;2 when doubling
          resolution — test at your target size before assuming a 4K value
          by doubling.
        </li>
        <li>
          <code>uniformity</code> (int) — the Gaussian sigma governing how
          strongly the weighting of each sector adapts to the structure tensor.
          Low values (2–3) make the filter highly sensitive to local direction;
          high values (8+) approximate the isotropic Classic mode.
        </li>
        <li>
          <code>sharpness</code> (float 0–1) — the exponent in the soft-max
          weighting between sectors. At 1.0 only the minimum-variance sector
          contributes: hard stroke boundaries. At 0.0 all sectors blend equally
          regardless of variance: pure blur.
        </li>
        <li>
          <code>variation</code> (enum) — <code>&apos;ANISOTROPIC&apos;</code>{" "}
          or <code>&apos;CLASSIC&apos;</code>. Always use Anisotropic. Classic
          uses fixed circular sectors and produces visible T-junction artefacts
          at every edge crossing.
        </li>
      </ul>

      <p>
        One critical pipeline rule: <strong>always denoise before Kuwahara</strong>.
        The filter is a variance-minimiser. In a noisy Cycles render, sensor noise
        inflates the variance of every sector indiscriminately — the filter loses
        all edge-selectivity and produces muddy blobs. The{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-oidn-denoise-cycles-passes"
          className={lk}
        >
          OIDN Denoise tutorial
        </Link>{" "}
        covers the full Normal + Albedo pass setup; that clean image is the
        correct Kuwahara input. After Kuwahara, mix 75&nbsp;% painted with
        25&nbsp;% clean denoised: full Kuwahara suppresses micro-detail
        (thin specular highlights on glaze, fine roughness variation) that
        the mix recovers for free. The{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-voronoi-cracked-ceramic-iridescence"
          className={lk}
        >
          Voronoi Cracked Ceramic shader
        </Link>{" "}
        produces exactly the kind of high-frequency surface detail that
        benefits from this partial-mix approach.
      </p>

      <p>
        For the scene in this entry: a faceted 12-sided celadon vessel with a
        torus emissive trim ring renders in Cycles at 96 adaptive samples.
        The trim ring emits at 6&nbsp;W — high enough that Kuwahara&apos;s
        low-variance sector at the torus surface picks up the warm gold and
        traces paint strokes around the circumference, which is the most
        visually legible demonstration of the contour-following behaviour.
        The compositor pipeline feeds OIDN → Kuwahara (Size&nbsp;4,
        Anisotropic) → MixRGB&nbsp;0.75 → subtle Film Grain → Reinhard
        Tone Map → Composite. Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-aov-custom-render-passes"
          className={lk}
        >
          AOV custom render passes
        </Link>{" "}
        approach: both produce non-destructive compositor pipelines from a
        single render; AOV isolates data per shader region, Kuwahara reshapes
        the entire image&apos;s perceptual character.
      </p>

      <p>
        <strong>Outside sources:</strong>{" "}
        The anisotropic variant is documented in{" "}
        <em>
          &ldquo;Image and Video Abstraction by Anisotropic Kuwahara
          Filtering&rdquo;
        </em>{" "}
        (Kyprianidis, Collomosse, Wang, Isenberg — CGF 28:7, 2009). Blender&apos;s
        implementation follows the structure-tensor eigenvector approach described
        in §3.3 of that paper. The filter is also related to the{" "}
        <em>Difference-of-Gaussians</em> edge-flow methods used in non-photorealistic
        rendering research by Winnemoeller et al. (SIGGRAPH 2006,{" "}
        <a
          href="https://holgerweb.net/PhD/Research/papers/DoG.pdf"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          public PDF
        </a>
        ). Both treat the structure tensor as the fundamental orientation primitive —
        the same abstraction Blender exposes via the Kuwahara node.
        Full Blender Compositor node reference at{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/compositing/"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org/manual/en/latest/compositing/
        </a>{" "}
        (CC-BY-SA).
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-compositor-kuwahara-painterly-stylisation",
  title:
    "Compositor — Kuwahara Anisotropic Filter: Painterly Oil-Paint Stylisation (Blender 5.1)",
  date: "2026-06-17",
  kind: "tutorial",
  excerpt:
    "The Kuwahara Anisotropic compositor node (Blender 4.3+) computes a local structure tensor from image gradients and aligns its sector partitions to edge flow — producing contour-following paint strokes rather than isotropic blur. Pipeline: OIDN Denoise → Kuwahara (Size 4, Anisotropic, Sharpness 0.55) → MixRGB 75% → Film Grain → Reinhard Tone Map. Includes full Python compositor build, parameter guide, and failure-mode catalogue.",
  Body: CompositorKuwaharaPainterlyBody,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    time: "one session",
    difficulty: "intermediate",
    libraryPath:
      "blends/compositing/compositor-kuwahara-painterly-stylisation",
    prerequisites: [
      "Compositor basics — Render Layers, pass sockets, Viewer node (OIDN Denoise tutorial level).",
      "Cycles rendering fundamentals — samples, adaptive sampling, Normal + Albedo passes.",
      "Familiarity with the Compositor node editor workspace.",
      "Blender 5.1 installed. Kuwahara node added in Blender 4.3; not available in earlier versions.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "CompositorNodeKuwahara first appeared in Blender 4.3 (November 2024). Both CPU and GPU compositing backends support it. CLASSIC variation available since 4.3; ANISOTROPIC variation may require 4.3+.",
      },
    ],
    steps: [
      {
        title: "Enable Normal + DiffCol passes on the View Layer",
        body:
          "OIDN requires auxiliary passes to be enabled before rendering:\n\n  vl = scene.view_layers['ViewLayer']\n  vl.use_pass_normal        = True   # geometry guidance\n  vl.use_pass_diffuse_color = True   # material albedo guidance\n\nIf these are not enabled, OIDN falls back to image-only denoising, which blurs\nfine surface detail — the same detail Kuwahara would otherwise preserve via\nits low-variance sector selection. Enable both before F12.",
      },
      {
        title: "Insert OIDN Denoise node before Kuwahara",
        body:
          "Create the denoise node and wire all three channels:\n\n  dn = tree.nodes.new('CompositorNodeDenoise')\n  dn.use_hdr = True\n  dn.prefilter = 'ACCURATE'\n  tree.links.new(rl.outputs['Image'],   dn.inputs['Image'])\n  tree.links.new(rl.outputs['Normal'],  dn.inputs['Normal'])\n  tree.links.new(rl.outputs['DiffCol'], dn.inputs['Albedo'])\n\nuse_hdr=True preserves specular highlights above 1.0 through denoising.\nprefilter='ACCURATE' applies an iterative pre-filter to the auxiliary passes;\ncritical at low sample counts (< 64 spp) when Normal and Albedo passes are\nthemselves noisy. At 256+ spp, 'FAST' is sufficient.",
      },
      {
        title: "Add and configure the Kuwahara node",
        body:
          "Wire the denoised output into Kuwahara:\n\n  kuw = tree.nodes.new('CompositorNodeKuwahara')\n  kuw.size       = 4           # pixel radius — 3-5 at 720p, 5-8 at 1080p\n  kuw.uniformity = 4           # sigma of sector Gaussian weighting\n  kuw.sharpness  = 0.55        # stroke boundary crispness\n  kuw.variation  = 'ANISOTROPIC'\n  tree.links.new(dn.outputs['Image'], kuw.inputs['Image'])\n\nNote: if kuw.variation raises AttributeError in your build, check the node\nproperties in Python console: [p for p in dir(kuw) if not p.startswith('_')].\nThe Blender source uses 'variation' for the algorithm enum as of 4.3.",
      },
      {
        title: "Mix Kuwahara with clean denoised at 75 %",
        body:
          "Full Kuwahara suppresses fine specular and roughness microdetail:\n\n  mix = tree.nodes.new('CompositorNodeMixRGB')\n  mix.blend_type = 'MIX'\n  mix.inputs['Fac'].default_value = 0.75\n  tree.links.new(dn.outputs['Image'],  mix.inputs[1])  # A: clean\n  tree.links.new(kuw.outputs['Image'], mix.inputs[2])  # B: painted\n\nSocket index 1 = first colour input (labelled 'Image' or 'A').\nSocket index 2 = second colour input ('Image 2' or 'B').\n\n0.75 is a starting point. Lower it (0.5) for a subtle stylistic touch;\nraise it (1.0) for full oil-paint with no photographic residue.\nThe celadon glaze coat (Coat Weight 0.9, Coat Roughness 0.05) produces\nthin white specular streaks that read better at 0.75 than at 1.0.",
      },
      {
        title: "Add Film Grain and Tone Map, then composite",
        body:
          "Grain adds photographic texture; Tone Map controls dynamic range:\n\n  # Grain: approximated via noise texture mixed with ADD at low strength\n  grain_mix = tree.nodes.new('CompositorNodeMixRGB')\n  grain_mix.blend_type = 'ADD'\n  grain_mix.inputs['Fac'].default_value = 0.05  # subtle\n\n  tone = tree.nodes.new('CompositorNodeTonemap')\n  tone.tonemap_type = 'RD_PHOTORECEPTOR'\n  tone.key   = 0.18\n  tone.gamma = 1.0\n\n  comp = tree.nodes.new('CompositorNodeComposite')\n\nRD_PHOTORECEPTOR models chromatic adaptation (von Kries + Reinhard rolloff).\ntone.key = 0.18 is photographic middle grey — the industry standard target.\nRaising gamma to 1.1–1.3 warms the highlights without touching shadows.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Kuwahara output looks like uniform blur — no stroke structure",
        cause:
          "Input to Kuwahara is a noisy raw render, not the OIDN-denoised output. Noise inflates variance in every sector equally, destroying edge-selectivity.",
        fix: "Always wire OIDN Denoise output into Kuwahara, not the raw Render Layers Combined socket.",
      },
      {
        symptom: "Blocky T-junction artefacts at every hard edge",
        cause: "kuw.variation = 'CLASSIC' is active. Classic uses fixed circular sectors that slice across edges.",
        fix: "Set kuw.variation = 'ANISOTROPIC'. The structure tensor aligns sectors to the edge direction and eliminates T-junctions.",
      },
      {
        symptom: "CompositorNodeKuwahara raises TypeError — unknown node type",
        cause: "Blender version older than 4.3. The Kuwahara node was added in 4.3 (November 2024).",
        fix: "Update to Blender 5.1 or at minimum 4.3. Check bpy.app.version >= (4, 3, 0) at the top of blueprint.py.",
      },
      {
        symptom: "Strokes don't follow the rim curve — look horizontal everywhere",
        cause:
          "kuw.size is very large (> 10 at 720p). At extreme sizes the structure tensor is averaged over so many pixels that local edge direction is lost.",
        fix: "Reduce size to 3–6 for 720p. Scale up proportionally: at 1080p try 5–9; at 4K try 8–14.",
      },
      {
        symptom: "Mix node shows solid black on socket 1 or 2",
        cause: "Socket indexing off by one. CompositorNodeMixRGB socket layout: inputs[0]=Fac, inputs[1]=Image A, inputs[2]=Image B.",
        fix: "Use inputs['Fac'], inputs[1], inputs[2] — or link by output name: dn.outputs['Image'], kuw.outputs['Image'].",
      },
    ],
  },
  base,
);

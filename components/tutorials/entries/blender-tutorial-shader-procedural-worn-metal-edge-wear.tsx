import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ShaderProceduralWornMetalBody() {
  return (
    <>
      <p>
        The <strong>Bevel node</strong> is an EEVEE-exclusive shader node that
        reads Blender&rsquo;s G-buffer depth pass at every rendered pixel and
        estimates local surface curvature from the depth discontinuity.  At a
        sharp edge the face normals on either side diverge; the Bevel node
        returns a blended Normal that represents a rounded transition even when
        the underlying geometry has no bevel modifier.  Comparing this perturbed
        Normal against the unmodified{" "}
        <code>Geometry.Normal</code> via a{" "}
        <code>VectorMath DOT_PRODUCT</code> gives a per-pixel curvature scalar:
        1.0 on flat faces, falling toward 0 at right-angle edges.  Inverting it
        (1&nbsp;&minus;&nbsp;dot) gives the edge-wear mask — 0 on smooth metal,
        rising to 1 exactly where scratches accumulate in reality.  No hand-painted
        masks.  No UV unwrap.  The physics of the mesh drives the wear
        distribution for free.
      </p>

      <p>
        A second wear signal comes from a <code>ShaderNodeTexNoise</code> tree,
        producing random oxidation patches that appear across flat surfaces
        independently of edge curvature.  A{" "}
        <code>Math MAX</code> node combines both channels: either edge curvature
        or a noise patch alone is sufficient to trigger full wear, but the two
        cannot compound — adding them would over-dirty the mid-face zones that
        should stay polished.  The combined mask drives a{" "}
        <code>MixShader</code> between two Principled BSDF nodes: a
        mirror-bright clean steel (Roughness&nbsp;0.06, Metallic&nbsp;1.0) and a
        scattered worn version (Roughness&nbsp;0.72, Metallic&nbsp;0.75 — the
        oxide layer is not purely metallic).  The same noise also feeds a{" "}
        <code>Bump</code> node wired into the Worn PBSDF&rsquo;s Normal socket,
        adding micro-scratch perturbation that appears only in the worn zones where
        that PBSDF is blended in.  See how texture baking can capture this
        procedural result in the{" "}
        <Link href="/tutorials/blender-tutorial-texture-baking-normal-ao" className={lk}>
          normal &amp; AO baking tutorial
        </Link>
        .
      </p>

      <p>
        The critical limitation for WebXR delivery: the Bevel node is a
        screen-space operator that lives entirely in EEVEE&rsquo;s render
        pipeline.  The GLB exporter has no access to G-buffer curvature data; the
        exported file carries only the flat Metallic / Roughness value evaluated
        at export time, not the per-pixel wear distribution.  For Three.js r152+
        delivery with full wear detail, bake the material Roughness pass in Cycles
        (which evaluates the full procedural graph per texel) to a PNG, then plug
        that PNG into the PBSDF Roughness socket before the final GLB export.  The
        glTF{" "}
        <code>metallicRoughnessTexture</code> channel carries it cleanly.  The
        same principle applies to any EEVEE-only node — Ambient Occlusion,
        Bevel, Screen-Space Reflections — none of which survive the export
        boundary without a prior bake pass.  Contrast this with the
        transmission and iridescence extensions covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-transmission-iridescence"
          className={lk}
        >
          Principled BSDF transmission &amp; iridescence tutorial
        </Link>
        , which export natively via KHR extensions because they are analytical
        BSDF parameters, not screen-space effects.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-shader-procedural-worn-metal-edge-wear",
  title:
    "Shader: Procedural Worn Metal — Bevel-Shader Edge Wear, Noise Bump & Roughness Gradient (Blender 5.1)",
  date: "2026-06-07",
  kind: "tutorial",
  excerpt:
    "Use the EEVEE-exclusive Bevel node to detect edge curvature via DOT PRODUCT and drive a wear mask that blends polished steel into oxidised scratched metal exactly where physics places damage. Noise patches add off-edge oxidation; a Bump node adds micro-scratch normals. No UV unwrap. Expert coverage of the GLB export limitation and Cycles bake workaround for WebXR.",
  Body: ShaderProceduralWornMetalBody,
  related: [
    {
      href: "/tutorials/blender-tutorial-shader-principled-transmission-iridescence",
      label: "Tutorial — Principled BSDF Transmission & Iridescence",
      note: "BSDF extensions that DO export natively to GLB — contrast with the EEVEE-only Bevel node.",
    },
    {
      href: "/tutorials/blender-tutorial-eevee-toon-cel-shader",
      label: "Tutorial — EEVEE Next Toon / Cel-Shader",
      note: "Another EEVEE-specific material technique: Shader to RGB with CONSTANT ColorRamp bands.",
    },
    {
      href: "/tutorials/blender-tutorial-texture-baking-normal-ao",
      label: "Tutorial — Texture Baking (Normal + AO)",
      note: "The Cycles bake workflow that captures procedural wear into a GLB-safe roughness texture.",
    },
    {
      href: "/tutorials/blender-tutorial-faceted-custom-split-normals",
      label: "Tutorial — Faceted Custom Split Normals",
      note: "Custom normals change how the Bevel node reads curvature — sharp crease normals amplify the wear signal at fold lines.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/render/shader_nodes/input/bevel.html",
      label:
        "Blender Manual — Bevel Node (CC-BY-SA 4.0 — Blender Foundation contributors)",
      note: "Full Bevel node reference. Key detail: Samples controls how many screen-space taps are used to estimate curvature — 4 is fast, 16 is production quality, values above 32 have diminishing returns. The node evaluates in EEVEE's deferred shading pass; it is listed as 'Experimental' in Blender 4.x but stable in 5.1. Related projects: blender/blender (GPL-2.0, not used here). Companion nodes: Ambient Occlusion node (also EEVEE screen-space, same export limitation).",
    },
    {
      href: "https://github.com/njanakiev/blender-scripting",
      label: "njanakiev/blender-scripting (MIT — Nicolas Janakiev)",
      note: "Reference collection of bpy scripting patterns for materials, mesh generation, and scene setup. The material-nodes section covers node identifier strings, input/output naming conventions, and link creation patterns that match Blender 4.x/5.x. Related sibling resources: blender-python-snippets by Blender Artists community (CC0).",
    },
  ],
};

const entry: Entry = buildInstructable(
  {
    time: "one to two hours",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Comfortable with the Shader Editor: can add nodes, connect sockets, read the node graph.",
      "Blender 5.1 installed; can run a .py script via the Text Editor workspace.",
      "Familiar with bpy.data.materials.new() and mat.use_nodes = True.",
      "Optional: read the EEVEE toon cel-shader tutorial for context on EEVEE-specific node graph patterns.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "The Bevel shader node requires EEVEE Next (default renderer in Blender 4.2+). In Cycles it returns the unperturbed surface normal and has no wear-detection effect — this is by design, as Cycles does not use a G-buffer.",
      },
    ],
    steps: [
      {
        title: "Understand the Bevel node's screen-space curvature detection",
        body: "The Bevel node is listed under Input nodes in the Shader Editor. It has two inputs:\n\n  inputs['Samples']  INT    — number of depth-buffer taps (default 4; use 16 for production)\n  inputs['Radius']   FLOAT  — world-space curvature detection radius in metres\n\nand one output:\n\n  outputs['Normal']  VECTOR — perturbed normal vector\n\nAt a flat face, the depth buffer shows a smooth gradient. The Bevel node's taps all agree, so the returned Normal matches the surface Normal. At a sharp edge, the taps on either side of the edge sample different face planes; the returned Normal tilts toward the adjacent face as if a bevel existed in geometry.\n\nCRITICAL: This node evaluates AFTER the geometry pass in EEVEE's deferred pipeline. It has NO effect in Cycles. If you switch the render engine to Cycles (e.g. for the Roughness bake), the Bevel node reverts to a pass-through — ensure your node graph is structured so the worn-metal result degrades gracefully in Cycles by NOT wiring the Bevel Normal into the clean PBSDF.\n\nRadius guidance:\n  0.02 m → wear only at knife-edge creases; wider edges stay clean\n  0.06 m → wear starts one scale-unit before the edge; visible worn gradient\n  0.15 m → very broad wear zone; reads as general surface weathering\n\nThe blueprint uses BEVEL_RADIUS = 0.06 on a 1.5 m Suzanne head — equivalent to ~6 cm radius on a real object.",
      },
      {
        title: "Extract edge curvature as a wear mask via DOT PRODUCT",
        body: "Connect Bevel.Normal and Geometry.Normal into a VectorMath DOT_PRODUCT node:\n\n  n_dot = nodes.new('ShaderNodeVectorMath')\n  n_dot.operation = 'DOT_PRODUCT'\n  links.new(n_bevel.outputs['Normal'],   n_dot.inputs[0])\n  links.new(n_geom.outputs['Normal'],    n_dot.inputs[1])\n\nDOT_PRODUCT outputs to the 'Value' socket (float), not 'Vector':\n\n  links.new(n_dot.outputs['Value'], n_inv.inputs[1])\n\nInvert with Math SUBTRACT:\n\n  n_inv.operation = 'SUBTRACT'\n  n_inv.inputs[0].default_value = 1.0   # constant\n  # inputs[1] receives dot Value\n\nThis gives:\n  flat face  → dot ≈ 1.0  → 1 − 1.0 = 0.0  (no wear)\n  90° edge   → dot ≈ 0.0  → 1 − 0.0 = 1.0  (full wear)\n\nShape the signal with a ColorRamp (LINEAR interpolation):\n\n  n_cr_edge.color_ramp.elements[0].position = 0.28  # wear starts here\n  n_cr_edge.color_ramp.elements[1].position = 0.65  # full wear\n\nSlide the left stop rightward (toward 0.50) to restrict wear only to the sharpest creases. Slide it leftward (toward 0.10) to start wear on gentle curves like a smooth forehead. The ColorRamp is a physical calibration tool: it maps the mathematical curvature range to a perceptual wear threshold for the specific object being shaded.\n\nInterpolation mode comparison for edge wear:\n  LINEAR   → smooth graduation — reads as oxidation staining\n  CONSTANT → binary on/off — reads as hard anodising or paint chip\n  B_SPLINE → softened ramp; use for rubber or plastic edge wear",
      },
      {
        title: "Add noise-based wear patches and combine signals with MAX",
        body: "Edge curvature catches the geometric stress points. Noise patches add the chemical / environmental weathering that covers flat surfaces regardless of geometry:\n\n  n_noise = nodes.new('ShaderNodeTexNoise')\n  n_noise.noise_dimensions                   = '3D'\n  n_noise.inputs['Scale'].default_value      = 12.0\n  n_noise.inputs['Detail'].default_value     = 6.0\n  n_noise.inputs['Roughness'].default_value  = 0.55\n  n_noise.inputs['Distortion'].default_value = 0.3\n\nWire Object texture coordinates (not UV) into the noise vector:\n\n  links.new(n_tc.outputs['Object'], n_noise.inputs['Vector'])\n\nWHY Object coords: they scale with the object uniformly. UV coords would pin the noise pattern to specific UV islands — moving a UV island during retopology would shift the wear pattern on the final mesh. Object coords stay physically consistent.\n\nShape with ColorRamp (B_SPLINE for soft patch edges):\n\n  n_cr_noise.color_ramp.elements[0].position = 0.50\n  n_cr_noise.color_ramp.elements[1].position = 0.82\n\nCombine with MAX:\n\n  n_max = nodes.new('ShaderNodeMath')\n  n_max.operation = 'MAXIMUM'\n  links.new(n_cr_edge.outputs['Color'],  n_max.inputs[0])\n  links.new(n_cr_noise.outputs['Color'], n_max.inputs[1])\n\nWHY MAX over ADD: ADD compounds wear at points where BOTH signals are high (every edge that happens to fall in a high-noise zone). This creates unrealistically dirty patches at edges. MAX takes whichever signal is stronger — each channel contributes independently at its own threshold. The mathematical identity: MAX(a, b) = (a + b + |a − b|) / 2, which shows it is equivalent to ADD only when the signals do not overlap.\n\nNote on ColorRamp → Math input: ShaderNodeValToRGB outputs 'Color' (RGBA vector). ShaderNodeMath inputs accept Color sockets by reading the R channel only, which is safe because both ColorRamps here are greyscale (R = G = B).",
      },
      {
        title: "Wire micro-scratch Bump into the Worn PBSDF Normal",
        body: "The same Noise.Fac feeds a Bump node:\n\n  n_bump = nodes.new('ShaderNodeBump')\n  n_bump.inputs['Strength'].default_value = 0.38\n  n_bump.inputs['Distance'].default_value = 0.003   # 3 mm\n  links.new(n_noise.outputs['Fac'], n_bump.inputs['Height'])\n  links.new(n_bump.outputs['Normal'], n_worn.inputs['Normal'])\n\nWHY Bump over Displacement:\n  Displacement adds actual geometry offsets — it would create micro-spikes on the silhouette that break the smooth metallic read.\n  Bump perturbs the shading normal used in the BSDF evaluation only. The geometry stays smooth.\n\nThe worn PBSDF receives the perturbed Normal, the clean PBSDF does not. Because MixShader blends between them (clean at 0, worn at 1), the bump perturbation fades in exactly as the wear mask rises. Flat faces see no bump; tight-edge creases and noise patches see the full scratch texture.\n\nKeep Bump Strength < 0.5 on metal. High strength reads as rock or concrete — the BSDF cannot distinguish the physical source of the normal perturbation; it only responds to the perturbation magnitude.\n\nDistance = 0.003 (3 mm): this controls the physical scale of the height field used to compute the bump gradient. Too small and the bump pattern disappears at normal render scale. Too large and the bump gradient becomes coarse and banded.",
      },
      {
        title: "Mix clean and worn PBSDF, verify in EEVEE, export GLB with bake note",
        body: "Final material wiring:\n\n  # Clean polished steel\n  n_clean.inputs['Base Color'].default_value  = (0.72, 0.72, 0.74, 1.0)\n  n_clean.inputs['Metallic'].default_value    = 1.0\n  n_clean.inputs['Roughness'].default_value   = 0.06\n  n_clean.inputs['IOR'].default_value         = 2.5     # non-physical steel approx\n\n  # Worn oxidised metal\n  n_worn.inputs['Base Color'].default_value   = (0.21, 0.18, 0.15, 1.0)\n  n_worn.inputs['Metallic'].default_value     = 0.75    # oxide layer, not pure metal\n  n_worn.inputs['Roughness'].default_value    = 0.72\n\n  n_mix = nodes.new('ShaderNodeMixShader')\n  links.new(n_max.outputs['Value'],  n_mix.inputs['Fac'])\n  links.new(n_clean.outputs['BSDF'], n_mix.inputs[1])\n  links.new(n_worn.outputs['BSDF'],  n_mix.inputs[2])\n\nEEVEE viewport check:\n  1. Set shading to Material Preview (EEVEE) — press Z → Material Preview\n  2. Orbit around the mesh — watch edge brightness shift as different creases rotate into frame\n  3. Increase BEVEL_SAMPLES to 16 if wear appears noisy at default quality\n\nGLB export (standard Holoflow settings):\n  bpy.ops.export_scene.gltf(\n      export_format='GLB',\n      export_apply=True,\n      export_materials='EXPORT',\n      export_image_format='WEBP',\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n  )\n\nWebXR bake workflow for full wear detail in Three.js:\n  1. Switch render engine: scene.render.engine = 'CYCLES'\n  2. Add a UV unwrap if none exists: bpy.ops.object.editmode_toggle() + bpy.ops.uv.smart_project()\n  3. Create bake image: img = bpy.data.images.new('worn_roughness', 2048, 2048)\n  4. Add Image Texture node in the material, select img, but do NOT link it\n  5. bpy.ops.object.bake(type='ROUGHNESS', use_selected_to_active=False)\n  6. Save image, plug it into PBSDF Roughness socket, re-export GLB\n  The baked roughness texture captures the full procedural wear distribution that the Bevel node produced in EEVEE.",
      },
    ],
    finalResult:
      "A fully procedural worn-metal Suzanne (monkey head) with edge-curvature-detected wear concentrated at tight-angle creases, random noise oxidation patches on flat surfaces, and micro-scratch Bump detail in the worn zones. The BLEND file runs in EEVEE Next with a two-light studio setup. The GLB exports cleanly but carries only flat Metallic/Roughness values — bake first for WebXR roughness texture delivery.",
    variations: [
      "Anodised aluminium: CLEAN_COLOUR = (0.04, 0.28, 0.62, 1.0) electric blue, CLEAN_ROUGHNESS = 0.10, WORN_COLOUR = (0.55, 0.50, 0.45, 1.0) bare silver, WORN_METALLIC = 1.0. Use CONSTANT ColorRamp interpolation on the edge signal — anodising chips at a hard threshold, not a gradient. BEVEL_RADIUS = 0.03 for tight chip-only wear at sharpest corners.",
      "Corroded copper / bronze: CLEAN_COLOUR = (0.65, 0.38, 0.18, 1.0) warm copper, WORN_COLOUR = (0.22, 0.42, 0.30, 1.0) verdigris green, WORN_METALLIC = 0.2 — verdigris is almost non-metallic. Add a third noise layer at Scale = 3.0 for large-scale patina zones. Increase NOISE_CR stop[0] to 0.35 so patina covers more of the flat surface.",
      "Brushed steel: CLEAN_ROUGHNESS = 0.22 (already brushed texture read), WORN_ROUGHNESS = 0.85. Add an Anisotropy node to the clean PBSDF to simulate the directional scratch pattern of real brushing: n_clean.inputs['Anisotropic'].default_value = 0.6, n_clean.inputs['Anisotropic Rotation'].default_value = 0.0. Rotate with a driver on Anisotropic Rotation to align brush direction to object space.",
    ],
    troubleshooting: [
      {
        symptom: "Bevel node has no visible effect — mesh renders flat with no edge wear",
        cause: "The render engine is set to Cycles instead of EEVEE Next. The Bevel node returns the unperturbed surface normal in Cycles; the DOT PRODUCT of two identical normals is always 1.0, and 1 − 1 = 0, so the wear mask is permanently zero.",
        fix: "Set scene.render.engine = 'BLENDER_EEVEE_NEXT' and switch the 3D viewport shading to Material Preview or Rendered. In EEVEE Next, also confirm that the Bevel node is not inside a Cycles-only material setup with a Holdout or Volume shader that prevents EEVEE evaluation.",
      },
      {
        symptom: "Wear appears over the entire surface uniformly — no clean zones",
        cause: "The ColorRamp edge stop positions are too far left; the threshold is set so low that even near-flat faces exceed it.",
        fix: "In the ColorRamp Edge node, move the first (black) stop rightward to 0.45–0.55. This sets the wear start threshold higher, restricting wear to genuinely tight-angle edges. Also check that the Bevel Radius is not set extremely large (> 0.2 m on a 1.5 m object) — a large radius blurs the curvature estimate across broad areas.",
      },
      {
        symptom: "GLB in Three.js shows no roughness variation — flat shiny surface",
        cause: "The Bevel node's screen-space effect does not transfer to the GLB export. The file carries only the Roughness value evaluated at export time as a single material uniform.",
        fix: "Bake the Roughness pass in Cycles before exporting: switch engine to Cycles, unwrap UVs, create a 2048×2048 bake target, run bpy.ops.object.bake(type='ROUGHNESS'), then plug the baked image into the PBSDF Roughness socket and re-export. The metallicRoughnessTexture channel in the GLB will then carry per-texel wear detail readable by Three.js MeshStandardMaterial.",
      },
    ],
  },
  base,
);

export { entry };

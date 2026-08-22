import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        The Compositor nodetree lives at <code>scene.node_tree</code> once{" "}
        <code>scene.use_nodes = True</code> is set. Blender auto-populates it
        with a RenderLayers → Composite pair, but this pair silently absorbs
        the first link you try to create — call <code>tree.nodes.clear()</code>{" "}
        and <code>tree.links.clear()</code> before adding your own nodes. Node
        bl_idnames in the Compositor use the{" "}
        <code>&quot;CompositorNode&quot;</code> prefix, entirely distinct from
        the <code>&quot;ShaderNode&quot;</code> and{" "}
        <code>&quot;GeometryNode&quot;</code> families; you cannot mix prefixes
        between tree types. Blender 5.1 adds a GPU compositor backend settable
        via <code>scene.render.compositor_device = &apos;GPU&apos;</code> that
        evaluates the full tree on the GPU during each viewport refresh —
        measurably faster for complex chains involving Glare, Denoise, and Lens
        Distortion at 1920 × 1080. Pair it with{" "}
        <code>compositor_precision = &apos;AUTO&apos;</code> to get full float32
        precision on the GPU path. The colour grading foundation is covered in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-scene-color-management-agx-ocio-bake-safe"
          className={lk}
        >
          AgX colour management tutorial
        </Link>
        , which explains why display transform must be separated from bake
        colour space before any compositor CDL grade is applied.
      </p>
      <p>
        The OIDN denoiser node (<code>CompositorNodeDenoise</code>) accepts an
        Image, a Normal, and an Albedo input. Providing all three dramatically
        improves edge preservation compared to image-only denoising — a silhouette
        that is clean in a ground-truth path-trace render can look smeared when
        denoised without the geometry normal guidance. The guidance passes are
        enabled on the view layer with <code>vl.use_denoising_data = True</code>,
        which exposes <code>Denoising Normal</code> and{" "}
        <code>Denoising Albedo</code> sockets on the RenderLayers node. Setting
        this flag after the first render has no effect until the cache is
        invalidated — it must be set before the scene is first evaluated. The
        denoiser&apos;s <code>use_hdr = True</code> property must also be set
        explicitly: without it, values above 1.0 are clipped to 1.0 before the
        OIDN pass, and the downstream Glare node never receives the HDR emission
        signal it needs to produce a bloom. This is the same reason the batch
        bake pipeline in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-cycles-batch-bake-normal-ao-emission-webxr"
          className={lk}
        >
          Cycles batch bake tutorial
        </Link>{" "}
        sets <code>float_buffer = True</code> on emission bake images — HDR
        values must be preserved end-to-end through the pipeline.
      </p>
      <p>
        The File Output node (<code>CompositorNodeOutputFile</code>) writes a
        multilayer EXR containing every render pass as a named channel group.
        The node has a subtle API trap: <code>layer_slots.new(name)</code> adds a
        named input slot visible in the node editor, but{" "}
        <code>tree.links.new</code> requires the <strong>integer index</strong>{" "}
        of the destination socket, not its name. Build a{" "}
        <code>slot_names</code> list from{" "}
        <code>fileout.layer_slots</code> immediately after adding all slots, then
        resolve each destination with{" "}
        <code>slot_names.index(slot_name)</code> to get the correct index. The
        default auto-created slot at index 0 also catches the first link — always
        remove all existing slots before adding custom ones. The EXR codec{" "}
        <code>&apos;ZIP&apos;</code> applies lossless deflate compression per
        scanline and is well supported by both DaVinci Resolve and{" "}
        <code>openexr-python</code> for offline compositing. <code>&apos;ZIPS&apos;</code>{" "}
        compresses individual scanlines and is faster to seek in large files.{" "}
        The resulting multilayer EXR carries all diffuse, glossy, AO, depth, and
        normal passes for non-destructive relight — the same archival strategy the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-light-rig-3point-eevee-lightgroup-webxr-bake"
          className={lk}
        >
          EEVEE light group tutorial
        </Link>{" "}
        uses to separate key, fill, and rim contributions into independently
        scalable layers.
      </p>
      <p>
        The Lens Distortion node (<code>CompositorNodeLensDist</code>) accepts
        two scalar inputs: <code>Distortion</code> (barrel/pincushion coefficient,
        positive = barrel) and <code>Dispersion</code> (chromatic aberration,
        shifts the red channel outward and the blue channel inward). Both are
        set via <code>node.inputs[&apos;Distortion&apos;].default_value</code>
        directly — the node has no operator-level equivalent. The{" "}
        <code>use_projector</code> flag switches between radial (standard camera)
        and anamorphic lens distortion; the radial mode is appropriate for any
        spherical lens. A subtle barrel coefficient of 0.012 and dispersion of
        0.008 produces a just-perceptible lens signature without distorting
        geometry in final stills — useful for adding organic authenticity to
        fully synthetic EEVEE renders before export. For the WebXR lightmap
        bake path, set both to 0.0 to preserve texel-accurate geometry in the
        baked result; the distortion is a display-only operation and should not
        propagate into the EXR archive connected to the File Output node.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-compositor-nodetree-render-passes-eevee-glb-bake",
  title:
    "Python bpy.types.CompositorNodeTree — Production Compositor Pipeline: Render Passes, OIDN Denoise & Multilayer EXR (Blender 5.1)",
  date: "2026-07-05",
  kind: "tutorial",
  excerpt:
    "Script the Compositor nodetree from scratch — clear the auto-populated default graph, wire RenderLayers through OIDN denoising, CDL colour balance, FOG_GLOW and lens distortion, then archive every render pass to a multilayer EXR for non-destructive WebXR lightmap baking.",
  Body,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-compositor-nodetree-render-passes-eevee-glb-bake",
    time: "one focused session",
    difficulty: "advanced",
    prerequisites: [
      "Comfortable with bpy.data and bpy.types — can create objects and materials without operators",
      "Understands Blender render passes (diffuse direct, AO, depth, normal)",
      "Familiar with the Compositor workspace and what RenderLayers/Composite nodes do",
      "Has read the AgX colour management tutorial for context on display vs bake colour spaces",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    steps: [
      {
        title: "Enable render passes and denoising data on the view layer",
        body: "Before touching the compositor, configure the view layer to emit the passes the graph needs:\n\n  vl = scene.view_layers[0]\n  vl.use_pass_diffuse_direct   = True\n  vl.use_pass_diffuse_indirect = True\n  vl.use_pass_glossy_direct    = True\n  vl.use_pass_ao               = True\n  vl.use_pass_z                = True\n  vl.use_pass_normal           = True\n  vl.use_denoising_data        = True  # exposes Denoising Normal + Albedo sockets\n\nuse_denoising_data must be set before the first render evaluation — it cannot be toggled after the scene has been evaluated in a session without a full cache flush.\n\nEnable EEVEE Next and the GPU compositor backend:\n  scene.render.engine                = 'BLENDER_EEVEE_NEXT'\n  scene.render.compositor_device    = 'GPU'   # 5.1 only\n  scene.render.compositor_precision = 'AUTO'  # full float32 on GPU path",
      },
      {
        title: "Create the CompositorNodeTree and clear the auto-populated default",
        body: "scene.use_nodes = True creates scene.node_tree (a CompositorNodeTree) and auto-adds a RenderLayers node wired to a Composite node:\n\n  scene.use_nodes = True\n  tree = scene.node_tree\n  tree.nodes.clear()   # remove auto-pair — it silently absorbs your first link\n  tree.links.clear()\n\nWith the tree cleared, create each node using its bl_idname:\n\n  rl       = tree.nodes.new('CompositorNodeRLayers')\n  denoise  = tree.nodes.new('CompositorNodeDenoise')\n  cb       = tree.nodes.new('CompositorNodeColorBalance')\n  glare    = tree.nodes.new('CompositorNodeGlare')\n  lensdist = tree.nodes.new('CompositorNodeLensDist')\n  comp     = tree.nodes.new('CompositorNodeComposite')\n  fileout  = tree.nodes.new('CompositorNodeOutputFile')\n\nBind the RenderLayers to the view layer you configured:\n  rl.layer = vl.name",
      },
      {
        title: "Configure the OIDN denoiser — HDR mode and guidance passes",
        body: "CompositorNodeDenoise accepts three inputs:\n  Image   — the noisy beauty render\n  Normal  — denoising normal pass (geometry orientation guide)\n  Albedo  — denoising albedo pass (surface colour guide)\n\nSet use_hdr before wiring — without it, values >1.0 are clipped:\n  denoise.use_hdr  = True   # preserve emission peaks for downstream Glare\n  denoise.filter_type = 'IMAGE'  # default — the general-purpose beauty filter\n\nWire all three inputs:\n  tree.links.new(rl.outputs['Image'],            denoise.inputs['Image'])\n  tree.links.new(rl.outputs['Denoising Normal'], denoise.inputs['Normal'])\n  tree.links.new(rl.outputs['Denoising Albedo'], denoise.inputs['Albedo'])\n\nWith guidance passes connected, OIDN can distinguish geometry edges from noise and preserve fine surface detail that image-only mode smears.",
      },
      {
        title: "Wire the CDL colour grade, Glare, and Lens Distortion in series",
        body: "ColorBalance CDL in LIFT_GAMMA_GAIN mode:\n  cb.correction_method = 'LIFT_GAMMA_GAIN'\n  cb.lift  = (0.00, 0.00, 0.01, 1.0)   # blue shadow push\n  cb.gamma = (1.00, 0.98, 0.95, 1.0)   # warm mids\n  cb.gain  = (1.08, 1.04, 0.98, 1.0)   # warm highlights\n  tree.links.new(denoise.outputs['Image'], cb.inputs['Image'])\n\nFOG_GLOW for emission bloom:\n  glare.glare_type = 'FOG_GLOW'\n  glare.threshold  = 0.85   # pixels above this luma value glow\n  glare.mix        = 0.04   # additive glow weight (0 = no glow, 1 = full)\n  glare.size       = 6      # 2**6 = 64 px kernel radius\n  tree.links.new(cb.outputs['Image'], glare.inputs['Image'])\n\nLens Distortion (display-only — set to 0.0 for bake output path):\n  lensdist.inputs['Distortion'].default_value = 0.012  # barrel\n  lensdist.inputs['Dispersion'].default_value = 0.008  # chromatic aberration\n  tree.links.new(glare.outputs['Image'], lensdist.inputs['Image'])\n\nComposite output:\n  tree.links.new(lensdist.outputs['Image'], comp.inputs['Image'])",
      },
      {
        title: "Configure the File Output node — multilayer EXR with named slots",
        body: "File Output requires the integer slot index for wiring — not the slot name:\n\n  fileout.base_path                 = '//render/compositor_passes'\n  fileout.format.file_format        = 'OPEN_EXR_MULTILAYER'\n  fileout.format.exr_codec          = 'ZIP'   # lossless deflate\n  fileout.format.color_depth        = '32'    # full float32\n\nRemove the auto-created default slot (it would absorb index 0 links):\n  while fileout.layer_slots:\n      fileout.layer_slots.remove(fileout.layer_slots[0])\n\nAdd named slots then wire by index:\n  SLOTS = ['Image', 'Denoising Normal', 'Denoising Albedo',\n           'Diffuse Direct', 'Diffuse Indirect', 'Glossy Direct',\n           'AO', 'Depth', 'Normal']\n  for name in SLOTS:\n      fileout.layer_slots.new(name)\n\n  slot_names = [s.name for s in fileout.layer_slots]\n  for rl_name, slot_name in [('Image','Image'), ('AO','AO'), ...]:\n      idx = slot_names.index(slot_name)\n      tree.links.new(rl.outputs[rl_name], fileout.inputs[idx])\n\nThe EXR file will contain separate R,G,B,A channels per named layer.",
      },
    ],
    finalResult:
      "A full Compositor nodetree wired in Python: RenderLayers → OIDN Denoise (with HDR + guidance passes) → CDL ColorBalance → FOG_GLOW Glare → LensDist → Composite, with a parallel branch to a multilayer EXR File Output archiving Image, Denoising Normal/Albedo, Diffuse Direct/Indirect, Glossy Direct, AO, Depth, and Normal passes. The GPU compositor backend is enabled. Rendering (F12) produces both a graded viewport beauty and a full-precision EXR pass archive.",
    variations: [
      "Lightmap bake path: set LENS_DISTORTION = 0.0 and LENS_DISPERSION = 0.0 and connect the Denoise output directly to the File Output instead of through the Glare/LensDist chain. The CDL grade also moves to a separate 'display' branch — the archive EXR should be linear, ungraded.",
      "Cryptomatte masking: add a CompositorNodeCryptomatte node after RenderLayers, enable vl.use_pass_cryptomatte_object = True, and route the matte into a CompositorNodeMixRGB to isolate individual objects for per-object EXR channels. NOTE: cryptomatte and denoising data passes share internal buffers in EEVEE Next — disable denoising data if you need cryptomatte on the same view layer.",
      "Per-light EXR channels with LightGroups: add vl.lightgroups entries as in the light rig tutorial, then route each 'RenderLayer.key.DiffDir', 'RenderLayer.fill.DiffDir' socket into separate File Output slots. The resulting EXR allows a compositor to rebalance key-to-fill ratio without re-rendering.",
      "Animated exposure ramp: add a CompositorNodeExposure node between Denoise and ColorBalance. Keyframe exposure.inputs['Exposure'].default_value from 0.0 at frame 1 to -1.5 at frame 48 for a sunset fade. The GPU compositor re-evaluates every frame without re-rendering the full 3D scene.",
    ],
    troubleshooting: [
      {
        symptom:
          "RuntimeError: links.new called with mismatched socket types (RGBA vs VALUE)",
        cause:
          "A render pass that outputs a scalar (Depth, AO) was connected to a File Output slot expecting RGBA. Scalar passes write only the R channel; the EXR layer is valid but the G, B, A channels are zero.",
        fix: "This is expected behaviour for scalar passes in multilayer EXR. Use a CompositorNodeSepRGBA / CombRGBA to broadcast the scalar to all four channels if a full RGBA representation is required for a specific downstream tool.",
      },
      {
        symptom:
          "Glare node produces no glow even with emission-heavy materials",
        cause:
          "denoise.use_hdr was not set to True. OIDN with use_hdr = False clips values above 1.0 before writing its output, so the HDR emission peaks the Glare node needs are already gone by the time the signal reaches it.",
        fix: "Set denoise.use_hdr = True. If the denoise node is downstream of any Mix or Exposure node that clips to 0–1, also ensure those nodes operate in float32 mode.",
      },
      {
        symptom:
          "File Output EXR contains no data or only one channel is populated",
        cause:
          "The auto-created default slot was not removed before adding custom slots. The auto slot occupies index 0 and absorbs every link wired to fileout.inputs[0] regardless of slot name.",
        fix: "Add the while loop to remove all existing layer_slots before calling fileout.layer_slots.new(). The blueprint includes this — check it ran without error.",
      },
      {
        symptom:
          "compositor_device = 'GPU' raises AttributeError in Blender 4.x",
        cause:
          "The GPU compositor backend was introduced in Blender 5.1. The attribute does not exist in earlier builds.",
        fix: "Guard with: if hasattr(scene.render, 'compositor_device'): scene.render.compositor_device = 'GPU'. The CPU fallback is automatic on 4.x.",
      },
      {
        symptom: "Denoising Normal / Denoising Albedo sockets missing on RenderLayers node",
        cause:
          "vl.use_denoising_data = True was set after the scene was first evaluated, or the RenderLayers node was created before the view layer was configured.",
        fix: "Set vl.use_denoising_data = True before scene.use_nodes = True or before the first bpy.context.view_layer.update(). If the session is already running, remove and re-add the RenderLayers node after setting the flag — the sockets are generated at node creation time from the view layer state.",
      },
    ],
  },
  base,
);

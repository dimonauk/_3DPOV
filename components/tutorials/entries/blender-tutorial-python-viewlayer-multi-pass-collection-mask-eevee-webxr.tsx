import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender renders one &ldquo;view layer&rdquo; at a time, but a scene can
        carry as many as you need. Each <code>ViewLayer</code> has its own
        collection visibility mask, its own render pass selection, and its own
        RenderLayers node in the compositor — so you can bake the ground plane
        with AO and indirect diffuse, bake the props with cavity normals, and
        bake the character with OIDN-guided denoising, all in a single F12
        press. Blender queues every enabled ViewLayer automatically and hands
        the results to the compositor tree, which sees all three as live
        sockets. Compare this with the single-layer pipeline in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-compositor-nodetree-render-passes-eevee-glb-bake"
          className={lk}
        >
          Compositor Render Passes tutorial
        </Link>
        : that script enables every pass on one layer, which works for hero
        renders but wastes memory on passes the other render elements do not
        need.
      </p>

      <p>
        The collection masking mechanism is a two-level hierarchy. At the top
        is <code>bpy.types.LayerCollection</code> — a per-ViewLayer wrapper
        around <code>bpy.types.Collection</code>. Setting{" "}
        <code>layer_collection.children[&apos;HLF_Char&apos;].exclude = True</code>{" "}
        on the Env ViewLayer makes the character collection invisible to that
        layer: no pixels, no shadow, no indirect light contribution. This is
        deliberately stronger than viewport hide (<code>hide_viewport</code>)
        or render hide (<code>hide_render</code>), which only suppress the
        object but let it still cast shadows. The{" "}
        <code>holdout</code> flag on a LayerCollection is the opposite tool:
        the geometry disappears from the rendered pixels but still occludes
        objects behind it, producing a cut-out alpha — essential for AR
        overlays in WebXR where the real world shows through. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-eevee-next-shadow-ssr-ao-render-config"
          className={lk}
        >
          EEVEE Next Render Config tutorial
        </Link>{" "}
        covers the render engine settings that govern how those shadow
        contributions are calculated once the layer mask is in place.
      </p>

      <p>
        Per-layer render pass flags are set as boolean properties on{" "}
        <code>bpy.types.ViewLayer</code> — for example{" "}
        <code>vl.use_pass_ambient_occlusion = True</code>. Each flag you
        enable adds a named output socket to the corresponding{" "}
        <code>CompositorNodeRLayers</code> node. Only enable passes you
        actually wire in the compositor — every extra pass costs GPU memory
        and compositor evaluation time.{" "}
        <code>vl.use_denoising_data = True</code> is the one exception worth
        paying for on the character layer: it exposes Denoising Normal and
        Denoising Albedo sockets that guide OIDN to preserve hair and eyelash
        edges rather than blurring them into the skin. That denoising approach
        is the same spatial-guidance strategy used by the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-vector-displacement-multires-bake-cycles"
          className={lk}
        >
          Vector Displacement Bake pipeline
        </Link>{" "}
        — keep the geometry detail in the output even when the raw render is
        noisy.
      </p>

      <p>
        The compositor tree binds each <code>CompositorNodeRLayers</code> to a
        specific view layer via <code>node.layer = &apos;ViewLayerName&apos;</code>.
        That property stores the layer&rsquo;s <em>name</em>, not an index — so
        renaming a ViewLayer after the compositor is wired silently breaks the
        binding without an error. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-light-rig-3point-eevee-lightgroup-webxr-bake"
          className={lk}
        >
          3-Point Lighting Rig tutorial
        </Link>{" "}
        demonstrates using EEVEE Light Groups as a complementary approach:
        instead of separating objects into ViewLayers, you separate light
        contributions into named groups so you can relight in the compositor
        without re-rendering. The two techniques compose well — ViewLayer
        isolation for geometry separation, Light Groups for relighting within
        each layer.
      </p>

      <p>
        The File Output compositor node stores all named inputs into a
        multilayer EXR. Slots are added with{" "}
        <code>file_slots.new(slot_name)</code>, and each slot&rsquo;s integer
        position in the list is its input socket index — there is no name-based
        socket lookup. The auto-created default slot must be removed before
        adding custom ones, otherwise it silently occupies index 0 and absorbs
        the first link. This EXR archive is the artefact that feeds the WebXR
        bake pipeline: each named layer becomes a separate texture in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-depsgraph-evaluated-geometry-gn-instances-batch-export"
          className={lk}
        >
          batch GLB export workflow
        </Link>
        , where the Depsgraph-evaluated mesh carries named UV channels that
        reference the correct EXR layer per material slot.
      </p>

      <p>
        <strong>Outside sources.</strong>{" "}
        Blender Foundation —{" "}
        <em>bpy.types.ViewLayer API Reference (5.1)</em>{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.ViewLayer.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          docs.blender.org/api/5.1/bpy.types.ViewLayer.html
        </a>{" "}
        CC-BY-4.0 — full listing of{" "}
        <code>use_pass_*</code> flags, <code>use_denoising_data</code>,{" "}
        <code>layer_collection</code> accessor, and the{" "}
        <code>view_layers.new()</code> / <code>.remove()</code> API; sibling
        repo{" "}
        <a
          href="https://projects.blender.org/blender/blender-extensions"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          blender/blender-extensions
        </a>{" "}
        (Apache-2.0) — the extensions platform where add-ons that automate
        multi-layer render pipelines are distributed.{" "}
        Blender Foundation —{" "}
        <em>bpy.types.LayerCollection API Reference (5.1)</em>{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.LayerCollection.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          docs.blender.org/api/5.1/bpy.types.LayerCollection.html
        </a>{" "}
        CC-BY-4.0 — documents the <code>exclude</code>, <code>holdout</code>,
        and <code>indirect_only</code> flags and explains how the{" "}
        <code>layer_collection</code> hierarchy mirrors the Outliner collection
        tree; related project{" "}
        <a
          href="https://projects.blender.org/blender/blender-addons"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          blender/blender-addons
        </a>{" "}
        — legacy add-on repository containing the Render: Render Button After
        Frame Change add-on which uses the same ViewLayer API for per-layer
        automation.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-viewlayer-multi-pass-collection-mask-eevee-webxr",
  title:
    "Python bpy.types.ViewLayer — Multi-Pass Collection Masking, Per-Layer Render Flags & Compositor Merge for WebXR Bakes (Blender 5.1)",
  date: "2026-07-05",
  kind: "tutorial",
  excerpt:
    "ViewLayer isolation separates Env, Props, and Character collections so each renders with its own pass set — AO for the ground, normals for props, OIDN-guided denoising for the character — all in one F12 press. layer_collection.children[name].exclude masks geometry completely (no shadow bleed); holdout keeps occlusion for AR compositing. Three RenderLayers nodes merge via AlphaOver in the compositor; a multilayer EXR archive stores all passes for the WebXR bake pipeline.",
  tags: [
    "blender",
    "python",
    "scripting",
    "view-layer",
    "compositor",
    "render-passes",
    "eevee",
    "collection",
    "webxr",
    "bake",
  ],
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-viewlayer-multi-pass-collection-mask-eevee-webxr",
    time: "fifty minutes",
    difficulty: "intermediate",
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
      "Understands the Blender Outliner's collection hierarchy",
      "Has read the Compositor Render Passes tutorial or knows what render passes are",
    ],
    steps: [
      {
        title: "Understand ViewLayer vs Collection — two separate hierarchies",
        body: "scene.collection      — the data hierarchy: collections hold objects\nscene.view_layers     — the render hierarchy: ViewLayers control what renders\n\nA Collection is shared data (bpy.data.collections).  A LayerCollection is a\nper-ViewLayer wrapper around a Collection; it is NOT a Collection itself.\n\nThe Outliner shows both, which confuses beginners:\n  Outliner → Blender File shows bpy.data.collections (shared data)\n  Outliner → View Layer shows the LayerCollection tree for the active ViewLayer\n\nA collection's objects belong to it regardless of ViewLayer.\nLayerCollection.exclude = True hides that collection in one ViewLayer only.\nOther ViewLayers are unaffected — they each have their own LayerCollection wrapper.\n\nIn Python:\n  scene.collection.children   # top-level collections (Collection type)\n  vl.layer_collection.children  # LayerCollection wrappers for those same collections",
      },
      {
        title: "Create named collections and populate them",
        body: "import bpy\n\ndef _get_or_create_col(name):\n    if name in bpy.data.collections:\n        return bpy.data.collections[name]\n    col = bpy.data.collections.new(name)\n    bpy.context.scene.collection.children.link(col)  # attach to root\n    return col\n\ncol_env   = _get_or_create_col('HLF_Env')\ncol_props = _get_or_create_col('HLF_Props')\ncol_char  = _get_or_create_col('HLF_Char')\n\n# Create objects and move them into the correct collection.\n# New primitives land in bpy.context.collection (the scene root);\n# unlink then re-link to the target.\nbpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, 0))\nground = bpy.context.active_object\nbpy.context.scene.collection.objects.unlink(ground)\ncol_env.objects.link(ground)\n\n# Repeat for props and character — see blueprint.py for full setup.\n\n# IMPORTANT: lights in the root collection are visible to all ViewLayers\n# unless that ViewLayer excludes the root.  Put shared lights in root.",
      },
      {
        title: "Create view layers and rename the default",
        body: "scene = bpy.context.scene\n\n# Rename the default ViewLayer so the compositor binding is stable.\nscene.view_layers[0].name = 'All'   # full-composite reference layer\n\ndef _new_layer(name):\n    existing = scene.view_layers.get(name)\n    if existing:\n        return existing\n    return scene.view_layers.new(name)\n\nvl_env   = _new_layer('Env')\nvl_props = _new_layer('Props')\nvl_char  = _new_layer('Character')\n\n# view_layers.new(name) clones the currently active ViewLayer's settings.\n# The clone starts with all collections visible — you then exclude the ones\n# you don't want rather than toggling from scratch.\n\n# To delete a ViewLayer:\n# scene.view_layers.remove(vl_env)  — only works if ≥2 layers remain;\n# Blender always keeps at least one ViewLayer.",
      },
      {
        title: "Mask collections per layer with exclude / holdout / indirect_only",
        body: "# vl.layer_collection is the root LayerCollection.\n# Its .children dict maps collection names to LayerCollection wrappers.\n# Indexing: root_lc.children['HLF_Char'] — by name string.\n\ndef set_masks(vl, include, exclude_names):\n    root_lc = vl.layer_collection\n    for name in exclude_names:\n        lc = root_lc.children.get(name)\n        if lc:\n            lc.exclude = True       # invisible: no pixels, no shadow, no GI bounce\n    for name in include:\n        lc = root_lc.children.get(name)\n        if lc:\n            lc.exclude = False\n\nset_masks(vl_env,   include=['HLF_Env'],   exclude_names=['HLF_Props', 'HLF_Char'])\nset_masks(vl_props, include=['HLF_Props'], exclude_names=['HLF_Env',   'HLF_Char'])\nset_masks(vl_char,  include=['HLF_Char'],  exclude_names=['HLF_Env',   'HLF_Props'])\n\n# exclude vs holdout — choose based on intended compositing:\n#   exclude = True   → collection is gone; no shadow on other geometry\n#   holdout = True   → objects are transparent in render but still occlude\n#                       (creates an alpha cut-out — use for AR matte)\n#   indirect_only    → objects bounce light but render as invisible\n\n# For the Env layer you may want to set holdout on HLF_Char so the character\n# casts a shadow on the ground but doesn't render in the Env layer pass.\n# Swap: lc.exclude = False; lc.holdout = True",
      },
      {
        title: "Enable render passes per layer",
        body: "# Each flag adds a named socket to the CompositorNodeRLayers node.\n# Only enable passes you actually use — each costs GPU memory.\n\n# Env: static baked background — needs full diffuse + AO + shadow.\nvl_env.use_pass_diffuse_direct    = True\nvl_env.use_pass_diffuse_indirect  = True\nvl_env.use_pass_ambient_occlusion = True\nvl_env.use_pass_shadow            = True\n\n# Props: interactive objects — AO for cavity + Normal for contact shadows.\nvl_props.use_pass_diffuse_direct    = True\nvl_props.use_pass_ambient_occlusion = True\nvl_props.use_pass_normal            = True\n\n# Char: character — OIDN-guided denoising requires Normal + Albedo data.\nvl_char.use_pass_diffuse_direct = True\nvl_char.use_pass_normal         = True\nvl_char.use_pass_shadow         = True\nvl_char.use_denoising_data      = True   # adds Denoising Normal + Albedo sockets\n\n# Socket names on the RenderLayers node:\n#   'Image'              → combined RGBA\n#   'Diffuse Direct'     → vl.use_pass_diffuse_direct\n#   'AO'                 → vl.use_pass_ambient_occlusion\n#   'Shadow'             → vl.use_pass_shadow\n#   'Normal'             → vl.use_pass_normal\n#   'Denoising Normal'   → vl.use_denoising_data\n#   'Denoising Albedo'   → vl.use_denoising_data\n# Wrong socket name → links.new() silently does nothing; check by printing\n# [s.name for s in rl_node.outputs]",
      },
      {
        title: "Build the compositor tree — RenderLayers + AlphaOver + File Output",
        body: "scene.use_nodes = True\ntree = scene.node_tree\ntree.nodes.clear()          # remove auto-generated defaults\n\nnodes = tree.nodes\nlinks = tree.links\n\n# One RenderLayers node per ViewLayer\nrl_env   = nodes.new('CompositorNodeRLayers'); rl_env.location   = (-600, 300)\nrl_props = nodes.new('CompositorNodeRLayers'); rl_props.location = (-600,   0)\nrl_char  = nodes.new('CompositorNodeRLayers'); rl_char.location  = (-600,-300)\n\n# .layer stores the ViewLayer NAME — not an index.\n# If the name changes after wiring, the node goes blank with no error.\nrl_env.layer   = 'Env'\nrl_props.layer = 'Props'\nrl_char.layer  = 'Character'\n\n# Merge with AlphaOver: B composites over A using B's alpha.\nao1 = nodes.new('CompositorNodeAlphaOver'); ao1.location = (-200, 200)\nao2 = nodes.new('CompositorNodeAlphaOver'); ao2.location = (100, 100)\n\nlinks.new(rl_env.outputs['Image'],   ao1.inputs[1])  # A = Env\nlinks.new(rl_props.outputs['Image'], ao1.inputs[2])  # B = Props over Env\nlinks.new(ao1.outputs['Image'],       ao2.inputs[1])  # A = Env+Props\nlinks.new(rl_char.outputs['Image'],   ao2.inputs[2])  # B = Char on top\n\n# Wire to composite output\ncomp = nodes.new('CompositorNodeComposite'); comp.location = (400, 100)\nlinks.new(ao2.outputs['Image'], comp.inputs['Image'])",
      },
      {
        title: "Archive all passes to multilayer EXR via File Output",
        body: "fout = nodes.new('CompositorNodeOutputFile')\nfout.location = (400, -200)\nfout.format.file_format = 'OPEN_EXR_MULTILAYER'\nfout.format.color_depth = '32'              # full 32-bit float\nfout.base_path          = '//render/multilayer'\n\n# CRITICAL: remove the auto-created default slot before adding custom ones.\n# If you skip this, the first link goes to the default slot (index 0), not\n# the first slot you add — which shifts all subsequent indices by 1.\nwhile fout.file_slots:\n    fout.file_slots.remove(fout.file_slots[0])\n\n# Each slot becomes one EXR layer.  Slot index == input socket index.\nSLOTS = [\n    ('Env.Combined',   rl_env,   'Image'),\n    ('Env.AO',         rl_env,   'AO'),\n    ('Props.Combined', rl_props, 'Image'),\n    ('Char.Combined',  rl_char,  'Image'),\n    ('Char.Shadow',    rl_char,  'Shadow'),\n    ('Char.Normal',    rl_char,  'Normal'),\n]\nfor slot_name, src_node, src_sock_name in SLOTS:\n    slot     = fout.file_slots.new(slot_name)\n    sock_idx = list(fout.file_slots).index(slot)\n    src_sock = src_node.outputs.get(src_sock_name)\n    if src_sock:\n        links.new(src_sock, fout.inputs[sock_idx])\n\n# In Nuke/DaVinci/Fusion, each EXR layer name appears as a separate channel.\n# In Blender's own compositor, File Output EXR can be read back with an\n# Image node set to 'Multilayer EXR' and a RenderLayer dropdown.",
      },
    ],
  },
  base
);

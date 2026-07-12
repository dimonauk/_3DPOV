import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Cycles Light Linking arrived in Blender 4.0 and reached its stable API
        in 5.1. It answers a question that studio lighting has always posed: can
        a single fill lamp warm the hero prop without touching the background,
        without resorting to separate render layers or compositing tricks? The
        answer is two collection references hanging off each light&rsquo;s{" "}
        <code>light_linking</code> slot —{" "}
        <code>receiver_collection</code> (which objects does this light
        illuminate?) and <code>blocker_collection</code> (which objects cast
        shadows for it?). An empty slot restores the default all-objects
        behaviour; a populated collection makes the light exclusive to its
        listed members. For WebXR deployment, where there is no live Cycles
        renderer, the arrangement must be baked into a UV lightmap before export
        — and Cycles evaluates the receiver and blocker collections correctly
        during <code>bpy.ops.object.bake(type=&apos;DIFFUSE&apos;)</code>. This
        is the end-to-end pipeline: wire the light linking, bake the lightmap,
        export to GLB. Compare the 3-point rig construction in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-light-rig-3point-eevee-lightgroup-webxr-bake"
          className={lk}
        >
          Light Rig tutorial
        </Link>{" "}
        for the non-linked starting point.
      </p>

      <p>
        The API lives on <code>bpy.types.ObjectLightLinking</code>, accessed via{" "}
        <code>light_obj.light_linking</code>. Two properties matter:{" "}
        <code>.receiver_collection</code> and{" "}
        <code>.blocker_collection</code>, both typed as{" "}
        <code>bpy.types.Collection | None</code>. The collections you assign are
        plain <code>bpy.data.collections</code> data-blocks — they must{" "}
        <em>not</em> be linked into the scene collection hierarchy. Linking them
        there would surface them in the Outliner as viewport collections and
        potentially add noise to your compositor ViewLayer passes (see{" "}
        <Link
          href="/tutorials/blender-tutorial-python-viewlayer-multi-pass-collection-mask-eevee-webxr"
          className={lk}
        >
          ViewLayer Multi-Pass
        </Link>
        ). The light-linking slot creates an implicit Cycles dependency on the
        collection data-block — no scene link required. Create with{" "}
        <code>bpy.data.collections.new(&quot;ll_recv_fill&quot;)</code>, then
        link objects into it with{" "}
        <code>recv_fill.objects.link(hero_ob)</code>, then assign:{" "}
        <code>fill_light.light_linking.receiver_collection = recv_fill</code>.
        That is the entire per-light setup; repeat for each light that needs
        selective illumination.
      </p>

      <p>
        The semantics are inclusive and asymmetric. For{" "}
        <code>receiver_collection</code>: empty/None means every scene object
        receives this light (classic behaviour); a set collection means{" "}
        <em>only those objects</em> are lit. Unlisted objects are not darkened
        — they simply do not receive this light source. For{" "}
        <code>blocker_collection</code>: empty/None means every object casts
        shadows; a set collection means only listed objects cast shadows for
        this specific light. The studio scene in the blueprint uses this
        asymmetry deliberately: the rim spotlight&rsquo;s receiver includes both
        hero and accent orb, but its blocker contains only the hero — the accent
        orb passes the rim light without casting a distracting halo, keeping the
        WebXR silhouette clean. EEVEE Next has partial Light Linking support from
        Blender 4.2, but correctness is not guaranteed across all shadow modes;
        for a production lightmap bake, always use Cycles (configured via{" "}
        <code>scene.render.engine = &apos;CYCLES&apos;</code> before the bake
        call). The EEVEE Next shadow/SSR configuration is covered separately in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-eevee-next-shadow-ssr-ao-render-config"
          className={lk}
        >
          EEVEE Next Render Config tutorial
        </Link>
        .
      </p>

      <p>
        Baking with Light Linking active requires one additional discipline: the
        bake <em>type</em> matters more than it does in a standard lightmap
        workflow. <code>type=&apos;DIFFUSE&apos;</code> with{" "}
        <code>pass_filter=&#123;&apos;COLOR&apos;, &apos;DIRECT&apos;,
        &apos;INDIRECT&apos;&#125;</code> captures the diffuse colour, direct
        illumination, and indirect bounce — everything that the light linking
        arrangement modifies — without specular. Specular spikes look wrong on
        faceted low-poly geometry in a real-time renderer, and they vary with
        camera angle, making them inappropriate for a baked texture.{" "}
        <code>type=&apos;COMBINED&apos;</code> includes specular and is the
        wrong choice here. The bake image node must be the{" "}
        <em>active node</em> in the material&rsquo;s node tree — not wired into
        the shader graph, but selected. Setting{" "}
        <code>nt.nodes.active = bake_node</code> after{" "}
        <code>nt.nodes.new(&apos;ShaderNodeTexImage&apos;)</code> is the correct
        pattern; forgetting this step makes the bake operator write to the wrong
        image or produce a silent no-op. The Cycles AOV approach to per-pixel
        data capture — a complementary technique — is detailed in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-cycles-shader-aov-custom-pass-bake-webxr"
          className={lk}
        >
          Cycles Shader AOV tutorial
        </Link>
        .
      </p>

      <p>
        The resulting lightmap is exported as a WebP texture embedded in the
        GLB via <code>export_image_format=&apos;WEBP&apos;</code>. In a Three.js
        scene the lightmap slot is{" "}
        <code>material.lightMap = new THREE.TextureLoader().load(url)</code>{" "}
        with <code>material.lightMapIntensity = 1.0</code>; for Babylon.js it is{" "}
        <code>mat.lightmapTexture</code>. The selective fill-lamp warmth baked
        onto the hero prop reads as a subtle colour temperature shift that gives
        the object visual hierarchy in the scene — a technique from traditional
        key/fill compositing carried into spatial computing via a single 512 px
        texture. The studio&rsquo;s batch normal and AO bake pipeline, which
        runs alongside this as a separate pass, is documented in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-cycles-batch-bake-normal-ao-emission-webxr"
          className={lk}
        >
          Cycles Batch Bake tutorial
        </Link>
        .
      </p>
    </>
  );
}

const meta = {
  slug: "blender-tutorial-python-cycles-light-linking-receiver-blocker-bake-webxr",
  title:
    "Python bpy.types.Object.light_linking — Cycles Light Linking: Receiver & Blocker Collections, Per-Object Light Masking & Selective Lightmap Bake for WebXR",
  date: "2026-07-12",
  tags: ["blender", "python", "cycles", "lighting", "webxr", "baking"],
  blenderVersion: "5.1" as const,
};

export const entry: Entry = buildInstructable(
  meta,
  Body,
  [
    {
      title: "Scene construction",
      steps: [
        {
          title: "Reset and create geometry",
          body: "Run `reset_scene()` to clear all objects, meshes, materials, images, and collections. Then `make_faceted_gem()` adds an icosphere, applies a Decimate modifier at 0.5 ratio, flat-shades, and smart-UV-projects at 45° angle limit. `make_accent_orb()` and `make_floor()` add secondary geometry with basic UV unwraps.",
        },
        {
          title: "Assign materials",
          body: "Each object gets a Principled BSDF material via `make_material()`. The hero gem is blue-grey (0.18, 0.52, 0.85), the accent orb is warm amber, the floor is near-black. Roughness is intentionally high (0.7–1.0) so the diffuse bake captures lighting clearly without specular contamination.",
        },
        {
          title: "Add three lights",
          body: "Key light: Area 400 W at upper-right, no linking. Fill light: Area 200 W at upper-left. Rim light: Spot 300 W behind the scene, 45° cone, 0.15 blend. Positions are set via `ob.rotation_euler` after `make_light()` creates each lamp. Rotation is passed as degrees and converted with `math.radians()`.",
        },
      ],
    },
    {
      title: "Light Linking setup",
      steps: [
        {
          title: "Understand the API surface",
          body: "`light_obj.light_linking` returns a `bpy.types.ObjectLightLinking` instance with two properties: `.receiver_collection` (Collection | None) and `.blocker_collection` (Collection | None). Both default to None, meaning all-objects behaviour. Setting them to a collection makes the light exclusive to its members.",
        },
        {
          title: "Fill light — hero-only receiver",
          body: "```python\nrecv_fill = bpy.data.collections.new('ll_recv_fill')\nrecv_fill.objects.link(hero)\nfill_light.light_linking.receiver_collection = recv_fill\n```\nThis collection is an orphaned data-block — not in `bpy.context.scene.collection.children`. The Cycles dependency graph evaluates it via the light_linking reference. Accent orb and floor are unlinked from this fill light entirely.",
        },
        {
          title: "Rim light — receiver and blocker",
          body: "The rim receives both hero and accent. Create `ll_recv_rim`, link both objects, assign. Then create `ll_block_rim`, link only hero, assign to `rim_light.light_linking.blocker_collection`. Result: the accent orb is rim-lit but does not cast a rim shadow — giving a cleaner WebXR silhouette.",
        },
      ],
    },
    {
      title: "Cycles bake and export",
      steps: [
        {
          title: "Create bake image and active node",
          body: "```python\nimg = bpy.data.images.new('hero_lightmap', 512, 512)\nnode = nt.nodes.new('ShaderNodeTexImage')\nnode.image = img\nnt.nodes.active = node  # critical — this is the bake target\n```\nThe node is NOT wired into the shader. Blender&rsquo;s bake operator reads the active Image Texture node as its write target, regardless of graph connections.",
        },
        {
          title: "Configure Cycles and bake",
          body: "```python\nscene.render.engine = 'CYCLES'\nscene.cycles.samples = 64\nbpy.ops.object.bake(\n    type='DIFFUSE',\n    pass_filter={'COLOR', 'DIRECT', 'INDIRECT'},\n    margin=4, margin_type='ADJACENT_FACES'\n)\n```\nLight Linking is evaluated during this bake. The fill lamp&rsquo;s colour temperature appears only on the hero; the rim shadow appears only from the hero. Do not use `type='COMBINED'` — specular is angle-dependent and corrupts a static lightmap.",
        },
        {
          title: "Save lightmap and export GLB",
          body: "```python\nimg.filepath_raw = '//hero_prop_lightmap.webp'\nimg.file_format  = 'WEBP'\nimg.save_render('//hero_prop_lightmap.webp', scene=bpy.context.scene)\nbpy.ops.export_scene.gltf(\n    filepath='//light_linking_export.glb',\n    use_selection=True,\n    export_draco_mesh_compression_enable=True,\n    export_draco_mesh_compression_level=6,\n    export_image_format='WEBP',\n    export_apply=True, export_yup=True\n)\n```\nIn Three.js, apply the lightmap via `material.lightMap` on the imported mesh. The baked selective illumination is now a static WebP — zero runtime cost in WebXR.",
        },
      ],
    },
    {
      title: "Troubleshooting",
      steps: [
        {
          title: "Light Linking has no effect — all objects still lit",
          body: "Confirm `scene.render.engine = 'CYCLES'` before baking. EEVEE Next supports Light Linking from 4.2 but the bake path may not evaluate receiver collections. Also verify the collection data-block is not empty: `len(recv_fill.objects)` should be non-zero.",
        },
        {
          title: "Bake image is black / no pixels written",
          body: "The Image Texture node must be the *active* node in the material (`nt.nodes.active = bake_node`). If a different node is active, the bake operator writes to that image (or silently fails). Also check that the hero object is both selected and the active context object before calling `bpy.ops.object.bake()`.",
        },
        {
          title: "AttributeError: `light_linking` not found",
          body: "Light Linking requires Blender 4.0 or later. In a 3.x build the attribute does not exist. Check `bpy.app.version >= (4, 0, 0)` and bail gracefully if not. In 5.1 the API is stable and this error should not appear unless running against a pre-4.0 binary.",
        },
        {
          title: "GLB viewer shows uniform grey — no lightmap visible",
          body: "Confirm the exported GLB contains the lightmap texture (open in a GLTF viewer like Babylon.js Sandbox or glTF-Sample-Viewer). In Three.js, the lightmap must be assigned to the `MeshStandardMaterial.lightMap` slot, not `map`. Set `lightMapIntensity = 1.0`. The texture UV must use channel 1 (UV1) in Three.js — configure `uv: 1` on the texture or use the GLTFLoader&rsquo;s automatic UV channel assignment.",
        },
      ],
    },
  ],
  {
    sources: [
      {
        url: "https://docs.blender.org/manual/en/latest/render/cycles/light_linking.html",
        title: "Cycles Light Linking — Blender Manual",
        author: "Blender Foundation",
        licence: "CC-BY-SA-4.0",
        note: "Official manual page covering the Light Linking UI, semantics, and Cycles/EEVEE support matrix.",
      },
      {
        url: "https://docs.blender.org/api/current/bpy.types.ObjectLightLinking.html",
        title: "bpy.types.ObjectLightLinking — Blender Python API Reference",
        author: "Blender Foundation",
        licence: "CC-BY-4.0",
        note: "Canonical API reference for receiver_collection and blocker_collection properties on the ObjectLightLinking type.",
      },
    ],
  }
);
